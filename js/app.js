/* app.js — parcours de l'étudiant : accueil → consentement → prénom → questionnaire (avec le résultat
   affiché après chaque partie) → envoi → récapitulatif → fin.
   Toutes les questions viennent de data/questions.json ; les textes d'interface de data/textes.json ;
   le feedback de data/feedback.json ; les ressources d'aide de data/ressources.json. */
(function () {
  'use strict';

  var CFG = window.SIHHATY_CONFIG || {};
  var Q, T, F, R;                    // données chargées
  var ECRANS = [];                   // écrans du questionnaire, à plat
  var PARTIES = [];                  // parties du questionnaire (une par autocollant)
  var FIN_PARTIE = {};               // index du dernier écran de questions de chaque partie
  var UNE_A_LA_FOIS = false;         // false : une échelle entière par page (demande de l'équipe)
  var CTX = { auto: false, sansEmoji: false, heros: '' };   // contexte de l'écran en cours de rendu
  var SENS = 'avant';                // sens de la dernière navigation (pour l'animation)
  var PILOTES = new Set();           // variables dont dépend une condition d'affichage
  var etat = null;                   // progression en cours
  var params = new URLSearchParams(location.search);
  var SAISIE = params.has('saisie') && params.get('saisie') === String(CFG.CODE_SAISIE || '1');
  var CLE = SAISIE ? 'sihhaty_saisie_v1' : 'sihhaty_progression_v1';
  var CLE_RES = 'sihhaty_resultats_v1';
  var PAUSE_MAX = 5 * 60 * 1000;     // au-delà, le temps d'inactivité n'est pas compté dans duree_minutes
  var app = document.getElementById('app');
  var CALME = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- petits utilitaires ---------- */
  function h(tag, attrs, enfants) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k === 'html') n.innerHTML = v;           // uniquement pour les SVG internes
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), v);
      else if (v === true) n.setAttribute(k, '');
      else n.setAttribute(k, v);
    });
    (enfants || []).forEach(function (e) { if (e) n.appendChild(typeof e === 'string' ? document.createTextNode(e) : e); });
    return n;
  }
  function vide(v) { return Schema.vide(v); }
  function lire(stock, cle) { try { var s = stock.getItem(cle); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
  function ecrire(stock, cle, val) { try { stock.setItem(cle, JSON.stringify(val)); } catch (e) { /* stockage indisponible */ } }
  function effacer(stock, cle) { try { stock.removeItem(cle); } catch (e) { /* idem */ } }
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    var b = new Uint8Array(16);
    (window.crypto || window.msCrypto).getRandomValues(b);
    b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
    var x = Array.prototype.map.call(b, function (v) { return (v < 16 ? '0' : '') + v.toString(16); }).join('');
    return x.slice(0, 8) + '-' + x.slice(8, 12) + '-' + x.slice(12, 16) + '-' + x.slice(16, 20) + '-' + x.slice(20);
  }
  function toast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg; t.classList.add('visible');
    clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove('visible'); }, 2600);
  }
  function afficher(noeuds, classe) {
    app.className = 'page ' + (classe || '');
    document.body.classList.add('clair');
    app.style.removeProperty('--accent');
    majAlbum(false);
    app.replaceChildren.apply(app, noeuds.filter(Boolean));
    window.scrollTo(0, 0);
    try { app.focus({ preventScroll: true }); } catch (e) { /* ancien navigateur */ }
  }
  function bouton(texte, classe, action, attrs) {
    return h('button', Object.assign({ type: 'button', class: 'btn ' + classe, text: texte, onclick: action }, attrs || {}));
  }
  /* Confirmation dans la page (remplace window.confirm). */
  function confirmer(message, oui) {
    var d = document.getElementById('dialogue-aide');
    function fermer() { if (d.close) d.close(); else d.removeAttribute('open'); }
    d.replaceChildren(
      h('p', { class: 'confirmer-texte', id: 'aide-titre', text: message }),
      h('div', { class: 'nav' }, [bouton(T.confirmation.non, 'btn-gris', fermer), bouton(T.confirmation.oui, 'btn-principal', function () { fermer(); oui(); })])
    );
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
  }
  function confettis() {
    if (CALME) return;
    var couleurs = ['#4ADE80', '#8B5CF6', '#FBBF24', '#F472B6', '#38BDF8', '#FB7185'];
    var boite = h('div', { class: 'confettis', 'aria-hidden': 'true' });
    for (var i = 0; i < 46; i++) {
      boite.appendChild(h('span', { style: 'left:' + Math.round(Math.random() * 100) + '%;background:' + couleurs[i % couleurs.length] +
        ';animation-delay:' + (Math.random() * 0.5).toFixed(2) + 's;animation-duration:' + (1.6 + Math.random() * 1.4).toFixed(2) + 's;--r:' + Math.round(Math.random() * 720 - 360) + 'deg;' +
        'width:' + (6 + Math.round(Math.random() * 6)) + 'px;height:' + (8 + Math.round(Math.random() * 8)) + 'px' }));
    }
    document.body.appendChild(boite);
    setTimeout(function () { boite.remove(); }, 3600);
  }

  /* ---------- illustrations ludiques (autocollants animés) ---------- */
  function autocollant(emoji, satellites, classe) {
    return h('div', { class: 'autocollant ' + (classe || ''), 'aria-hidden': 'true' }, [
      h('span', { class: 'autocollant-halo' }),
      h('span', { class: 'autocollant-emoji', text: emoji })
    ].concat((satellites || []).map(function (s, i) { return h('span', { class: 'satellite s' + (i + 1), text: s }); })));
  }
  function sceneAccueil() {
    var bulles = ['💬', '🎮', '❤️', '📸', '🎵', '🤖', '🌙', '⚡'];
    return h('div', { class: 'scene', 'aria-hidden': 'true' }, [
      h('div', { class: 'telephone' }, [
        h('div', { class: 'telephone-encoche' }),
        h('div', { class: 'telephone-ecran' }, [
          h('div', { class: 'tel-ligne l1' }), h('div', { class: 'tel-ligne l2' }),
          h('div', { class: 'tel-grille' }, ['📱', '🎧', '🎲', '💤', '🏃', '🧠'].map(function (e) { return h('span', { text: e }); })),
          h('div', { class: 'tel-coeur', text: '💚' })
        ])
      ])
    ].concat(bulles.map(function (b, i) { return h('span', { class: 'bulle b' + (i + 1), text: b }); })));
  }

  /* ---------- progression ---------- */
  function nouvelEtat() {
    return { v: 2, id: uuid(), etape: 'accueil', i: 0, reponses: {}, prenom: '', actif_ms: 0, dernier: Date.now(), num_formulaire: '', album: [] };
  }
  function sauver() {
    var m = Date.now();
    if (etat.etape === 'questionnaire') etat.actif_ms += Math.min(m - etat.dernier, PAUSE_MAX);
    etat.dernier = m;
    ecrire(localStorage, CLE, etat);
  }
  function majSalutation() {
    var s = document.getElementById('salutation');
    var p = etat && etat.prenom;
    s.hidden = !p;
    if (p) {
      s.replaceChildren(h('span', { text: T.salutation.replace('{prenom}', p) }), h('span', { class: 'pastille', text: p.charAt(0) }));
    }
  }

  /* ---------- construction des écrans ---------- */
  function construireEcrans() {
    ECRANS = [];
    var apres = (!SAISIE && F.apres_partie) || {};
    Q.sections.forEach(function (s, iS) {
      s.parties.forEach(function (p, iP) {
        var premier = true;
        // une station (île) avant chaque partie : l'étudiant y attend le participant
        if (!SAISIE) ECRANS.push({ type: 'station', section: s, partie: p, iPartie: iP, iSection: iS, debutSection: iP === 0 });
        p.ecrans.forEach(function (elements) {
          var ech = elements.length === 1 && elements[0].type === 'echelle' ? elements[0] : null;
          if (UNE_A_LA_FOIS && !SAISIE) {
            if (ech) {
              ech.items.forEach(function (it, k) {
                ECRANS.push({ type: 'q', section: s, partie: p, iPartie: iP, elements: elements, echelle: ech, items: [it],
                  dernierBloc: k === ech.items.length - 1, debutPartie: premier, unique: true });
                premier = false;
              });
              return;
            }
            var attente = [];   // un « message » s'affiche avec la question qui le suit
            elements.forEach(function (el) {
              if (el.type === 'message') { attente.push(el); return; }
              ECRANS.push({ type: 'q', section: s, partie: p, iPartie: iP, elements: attente.concat([el]), debutPartie: premier, unique: true });
              attente = []; premier = false;
            });
            return;
          }
          if (!ech) { ECRANS.push({ type: 'q', section: s, partie: p, iPartie: iP, elements: elements, debutPartie: premier }); premier = false; return; }
          var n = ech.items.length;
          var nb = ech.par_ecran && !SAISIE ? Math.ceil(n / ech.par_ecran) : 1;   // longues échelles découpées (BFI : 3 pages de 10)
          var taille = Math.ceil(n / nb);
          for (var k = 0; k < nb; k++) {
            ECRANS.push({ type: 'q', section: s, partie: p, iPartie: iP, elements: elements, echelle: ech,
              items: ech.items.slice(k * taille, (k + 1) * taille), dernierBloc: k === nb - 1, debutPartie: premier });
            premier = false;
          }
        });
        // Résultat affiché juste après la partie (demande de l'équipe)
        if (apres[p.id]) ECRANS.push({ type: 'resultat', section: s, partie: p, iPartie: iP, cle: apres[p.id] });
      });
    });
    Schema.elements(Q).forEach(function (x) { collecterPilotes(x.el.si); });
    PARTIES = []; FIN_PARTIE = {};
    Q.sections.forEach(function (s) { s.parties.forEach(function (p) { PARTIES.push(p); }); });
    ECRANS.forEach(function (e, i) { if (e.type === 'q') FIN_PARTIE[e.partie.id] = i; });
  }
  function collecterPilotes(c) {
    if (!c) return;
    if (c.tous) c.tous.forEach(collecterPilotes);
    if (c.un_parmi) c.un_parmi.forEach(function (v) { PILOTES.add(v); });
    if (c.var) PILOTES.add(c.var);
  }
  function miniOui(rep) {
    for (var i = 1; i <= 6; i++) if (Number(rep['MINI_0' + i]) === 1) return true;
    return false;
  }
  function resultatDisponible(cle, rep, scores) {
    if (cle === 'SOUTIEN') return miniOui(rep);
    if (cle === 'BFI') return !vide(scores.SCORE_BFI_E);
    var e = F.echelles[cle];
    return !!e && !vide(scores[e.score]) && !vide(scores[e.niveau]);
  }
  function ecranVisible(e, eff, scores) {
    if (e.type === 'intro' || e.type === 'station') return true;
    if (e.type === 'resultat') return resultatDisponible(e.cle, eff.rep, scores);
    return e.elements.some(function (el) { return Schema.varsElement(el).length && eff.visibles.has(el); });
  }
  function ecranSuivant(i, sens) {
    var eff = Schema.effectives(Q, etat.reponses);
    var scores = Scoring.calculer(eff.rep);
    for (var k = i + sens; k >= 0 && k < ECRANS.length; k += sens) if (ecranVisible(ECRANS[k], eff, scores)) return k;
    return -1;
  }

  /* ---------- rendu des questions ---------- */
  function definir(v, val) {
    if (vide(val)) delete etat.reponses[v]; else etat.reponses[v] = val;
    sauver();
  }
  function apresChangement(v, noeud) {
    if (noeud) { var q = noeud.closest('.question'); if (q) retirerErreur(q); }
    if (PILOTES.has(v)) rendreQuestionnaire(true);
  }
  function retirerErreur(q) {
    q.classList.remove('en-erreur');
    var e = q.querySelector(':scope > .erreur'); if (e) e.remove();
    var r = document.getElementById('resume-erreurs'); if (r && !app.querySelector('.en-erreur')) r.hidden = true;
  }
  function poserErreur(q, msg) {
    retirerErreur(q);
    q.classList.add('en-erreur');
    q.appendChild(h('p', { class: 'erreur', role: 'alert', text: msg }));
  }

  /* Genre visuel des réponses : « accord » (−− … ++), « frequence » (disque qui se remplit), « ouinon », « simple ». */
  var GENRES = { bfi: 'accord', mspss: 'accord', smas: 'accord', oui_non: 'ouinon',
    frequence_5: 'frequence', ppcs: 'frequence', cgpt: 'frequence', pss: 'frequence', phq: 'frequence', mhc: 'frequence',
    isi_severite: 'frequence', isi_satisfaction: 'frequence', isi_remarque: 'frequence', isi_inquietude: 'frequence', isi_interference: 'frequence',
    difficulte: 'frequence', temps_5: 'frequence' };
  var SIGNES = { 5: ['−−', '−', '○', '+', '++'], 7: ['−−−', '−−', '−', '○', '+', '++', '+++'] };
  function genreDe(ref) { return typeof ref === 'string' ? (GENRES[ref] || 'simple') : 'simple'; }
  function pastilleOption(genre, i, n, o) {
    if (genre === 'accord' && SIGNES[n]) return h('span', { class: 'pastille-opt p-accord', 'aria-hidden': 'true', dir: 'ltr', text: SIGNES[n][i] });
    if (genre === 'frequence') return h('span', { class: 'pastille-opt p-niveau', 'aria-hidden': 'true' });
    if (genre === 'ouinon') return h('span', { class: 'pastille-opt ' + (o.c === 1 ? 'p-oui' : 'p-non'), 'aria-hidden': 'true', text: o.c === 1 ? '✓' : '✕' });
    return h('span', { class: 'pastille-opt p-simple', 'aria-hidden': 'true' });
  }
  /* Décor de la partie : couleur, personnage, objet animé, autocollants. */
  function theme(partie) { return (T.themes || {})[partie.id] || { couleur: '#8B5CF6', perso: '🧑‍🎓', heros: '⭐', anim: 'pulse', particules: ['✨'], mouvement: 'flotte' }; }
  function bandeauTheme(partie) {
    var th = theme(partie);
    var extra = null;
    if (th.extra === 'machine') {
      extra = h('div', { class: 'machine' }, [0, 1, 2].map(function (k) {
        return h('div', { class: 'rouleau' }, [h('span', { class: 'r' + k, text: ['🍒', '7️⃣', '💎', '🍋', '⭐', '🍒'].join('\n') })]);
      }));
    } else if (th.extra === 'saisie') {
      extra = h('div', { class: 'bulle-saisie' }, [h('i'), h('i'), h('i')]);
    }
    return h('div', { class: 'bandeau-theme', 'aria-hidden': 'true' }, [
      h('span', { class: 'bt-perso', text: th.perso }),
      h('span', { class: 'bt-heros anim-' + th.anim, text: th.heros }),
      extra
    ].concat((th.particules || []).map(function (p, i) { return h('span', { class: 'bt-p mv-' + th.mouvement + ' p' + (i + 1), text: p }); })));
  }
  function cotes(partie) {
    var th = theme(partie), liste = [th.heros].concat(th.particules || []).slice(0, 6);
    return h('div', { class: 'cotes', 'aria-hidden': 'true' }, liste.map(function (p, i) { return h('span', { class: 'cote c' + (i + 1), text: p }); }));
  }
  function appliquerTheme(partie) {
    if (partie) app.style.setProperty('--accent', theme(partie).couleur); else app.style.removeProperty('--accent');
  }

  function groupeRadios(v, opts, classe, auChoix, genre) {
    var n = opts.length;
    var riche = !/opts-(num|emoji)/.test(classe);
    if (riche && !/avec-barre/.test(classe)) classe += ' avec-barre';   // barre colorée sur toutes les réponses
    return h('div', { class: 'options ' + classe, style: '--n:' + n }, opts.map(function (o, i) {
      var id = v + '__' + o.c;
      var input = h('input', { type: 'radio', name: v, id: id, value: String(o.c), checked: Number(etat.reponses[v]) === o.c && !vide(etat.reponses[v]) });
      var avecEmoji = false;   // réponses sans emoji : plus compact, le questionnaire paraît moins long
      var auto = CTX.auto;
      input.addEventListener('change', function () {
        definir(v, o.c);
        if (avecEmoji && window.FX) { var r = input.parentNode.getBoundingClientRect(); window.FX.envol(o.e, r.left + r.width / 2, r.top + r.height / 2); }
        apresChangement(v, input);
        if (auChoix) auChoix(input);
        if (auto) avanceAutomatique();
      });
      return h('label', { class: 'option' + (riche ? ' riche' : '') + (avecEmoji ? ' avec-emoji' : ''), for: id, style: '--t:' + (n > 1 ? i / (n - 1) : 0) }, [
        input,
        avecEmoji ? h('span', { class: 'opt-emoji g' + Math.min(3, graphemes(o.e)), 'aria-hidden': 'true', text: o.e }) : (riche ? pastilleOption(genre || 'simple', i, n, o) : null),
        o.emoji ? h('span', { class: 'emoji', 'aria-hidden': 'true', text: o.emoji }) : null,
        h('span', { class: 'option-texte', text: o.t })
      ]);
    }));
  }

  function graphemes(t) {
    try { if (window.Intl && Intl.Segmenter) return Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(t)).length; } catch (e) { /* ancien navigateur */ }
    return Math.max(1, Math.round(String(t).replace(/[\uFE0F\u200D]/g, '').length / 2));
  }
  function badge(el) {
    if (SAISIE) return null;
    if (!UNE_A_LA_FOIS) return el.emoji ? h('span', { class: 'q-mini', 'aria-hidden': 'true', text: el.emoji }) : null;
    var e = el.emoji || CTX.heros;
    return e ? h('div', { class: 'q-badge', 'aria-hidden': 'true', text: e }) : null;
  }
  /* Après une réponse à une question à choix unique : passage automatique à la suivante. */
  function avanceAutomatique() {
    var i0 = etat.i;
    clearTimeout(avanceAutomatique.t);
    avanceAutomatique.t = setTimeout(function () { if (etat.i === i0 && document.getElementById('btn-suivant')) avancer(); }, 520);
  }
  function rendreChoix(el) {
    var opts = Schema.options(Q, el.options);
    var classe = el.affichage === 'emojis' ? 'opts-emoji' : (el.affichage === 'numerique' ? 'opts-num' : (opts.length <= 2 && !opts.some(function (o) { return (o.t || '').length > 34; }) ? 'opts-duo' : 'opts-v'));
    return h('fieldset', { class: 'question', 'data-var': el.var }, [
      h('legend', null, [badge(el), el.texte]),
      el.aide ? h('p', { class: 'aide', text: el.aide }) : null,
      avecSansEmoji(el.sans_emoji, function () { return groupeRadios(el.var, opts, classe, null, genreDe(el.options)); })
    ]);
  }
  function avecSansEmoji(sans, f) {
    var avant = CTX.sansEmoji; CTX.sansEmoji = avant || !!sans;
    try { return f(); } finally { CTX.sansEmoji = avant; }
  }
  function rendreNombre(el) {
    var input = h('input', { type: 'number', inputmode: 'numeric', class: 'champ champ-nombre', id: 'c_' + el.var, min: el.min, max: el.max, step: '1',
      value: vide(etat.reponses[el.var]) ? '' : etat.reponses[el.var] });
    input.addEventListener('input', function () {
      var x = input.value.trim();
      definir(el.var, x === '' || isNaN(Number(x)) ? '' : Number(x));
      retirerErreur(input.closest('.question'));
    });
    input.addEventListener('change', function () { if (PILOTES.has(el.var)) rendreQuestionnaire(true); });
    return h('div', { class: 'question', 'data-var': el.var }, [badge(el), h('label', { class: 'titre-question', for: 'c_' + el.var, text: el.texte }), input]);
  }
  function rendreTexte(el) {
    var input = h('input', { type: 'text', class: 'champ', id: 'c_' + el.var, maxlength: '120', autocomplete: 'off', value: etat.reponses[el.var] || '' });
    input.addEventListener('input', function () { definir(el.var, input.value.trim()); retirerErreur(input.closest('.question')); });
    return h('div', { class: 'question', 'data-var': el.var }, [badge(el), h('label', { class: 'titre-question', for: 'c_' + el.var, text: el.texte }), input]);
  }
  function rendreListe(el) {
    var sel = h('select', { class: 'champ', id: 'c_' + el.var }, [h('option', { value: '', text: T.choisir })].concat(
      Schema.options(Q, el.options).map(function (o) { return h('option', { value: String(o.c), text: o.t, selected: Number(etat.reponses[el.var]) === o.c }); })));
    sel.addEventListener('change', function () { definir(el.var, sel.value === '' ? '' : Number(sel.value)); apresChangement(el.var, sel); });
    return h('div', { class: 'question', 'data-var': el.var }, [badge(el), h('label', { class: 'titre-question', for: 'c_' + el.var, text: el.texte }), sel]);
  }
  function rendreMultiple(el) {
    return h('fieldset', { class: 'question', 'data-multiple': '1' }, [
      el.texte ? h('legend', null, [badge(el), el.texte]) : badge(el),
      h('div', { class: 'options opts-v avec-barre' }, el.choix.map(function (c, i) {
        var input = h('input', { type: 'checkbox', id: 'c_' + c.var, checked: Number(etat.reponses[c.var]) === 1 });
        input.addEventListener('change', function () { definir(c.var, input.checked ? 1 : 0); apresChangement(c.var, input); });
        return h('label', { class: 'option riche', for: 'c_' + c.var, style: '--t:' + (el.choix.length > 1 ? i / (el.choix.length - 1) : 0) }, [input,
          h('span', { class: 'pastille-opt p-simple p-case', 'aria-hidden': 'true' }), h('span', { class: 'option-texte', text: c.t })]);
      }))
    ]);
  }
  function rendreReseaux(el) {
    function coche(r) { return Number(etat.reponses[r.var]) === 1; }
    var lignes = el.reseaux.map(function (r) {
      var cb = h('input', { type: 'checkbox', id: 'c_' + r.var, checked: coche(r), 'aria-label': el.colonne_utilise + ' ' + r.t });
      cb.addEventListener('change', function () {
        definir(r.var, cb.checked ? 1 : 0);
        if (!cb.checked) [el.var_plus, el.var_moins].forEach(function (v) { if (Number(etat.reponses[v]) === r.c) definir(v, ''); });
        rendreQuestionnaire(true);
      });
      function radio(v, libelle, desactive) {
        var rd = h('input', { type: 'radio', name: v, value: String(r.c), disabled: desactive, checked: Number(etat.reponses[v]) === r.c, 'aria-label': libelle + ' ' + r.t });
        rd.addEventListener('change', function () { definir(v, r.c); retirerErreur(rd.closest('.question')); });
        return rd;
      }
      var nbCoches = el.reseaux.filter(coche).length;
      return h('tr', null, [
        h('th', { scope: 'row' }, [h('label', { for: 'c_' + r.var }, [r.e ? h('span', { class: 'reseau-emoji', 'aria-hidden': 'true', text: r.e }) : null, r.t])]),
        h('td', null, [cb]),
        h('td', null, [radio(el.var_plus, el.colonne_plus, !coche(r))]),
        h('td', null, [radio(el.var_moins, el.colonne_moins, !coche(r) || nbCoches < 2)])
      ]);
    });
    return h('div', { class: 'question question-reseaux', 'data-reseaux': '1' }, [
      badge(el),
      h('p', { class: 'avertissement', text: el.avertissement }),
      h('div', { class: 'table-defilante' }, [h('table', { class: 'reseaux' }, [
        h('thead', null, [h('tr', null, [h('td'), h('th', { scope: 'col', text: el.colonne_utilise }), h('th', { scope: 'col', text: el.colonne_plus }), h('th', { scope: 'col', text: el.colonne_moins })])]),
        h('tbody', null, lignes)
      ])])
    ]);
  }
  function rendreEchelle(ecran) {
    var ech = ecran.echelle;
    var blocs = ecran.items.map(function (it) {
      var opts = Schema.options(Q, it.options || ech.options);
      var num = ech.affichage === 'numerique';
      var classe = num ? 'opts-num opts-bornes' : (opts.length <= 2 ? 'opts-duo' : 'opts-likert') + (ech.barre ? ' avec-barre' : '');
      if (!num && opts.length > 2 && opts.length <= 5 && !CTX.sansEmoji && opts[0].e && !SAISIE) classe = 'opts-rangee' + (ech.barre ? ' avec-barre' : '');
      else if (ecran.unique && !num && opts.length > 2) classe = (opts.length <= 5 && !CTX.sansEmoji && opts[0].e ? 'opts-rangee' : 'opts-v') + (ech.barre ? ' avec-barre' : '');
      return h('fieldset', { class: 'question item' + (ecran.unique ? ' item-unique' : ''), 'data-var': it.var }, [
        h('legend', null, [ecran.unique ? badge({}) : null, it.texte]),
        groupeRadios(it.var, opts, classe, (SAISIE || ecran.unique) ? null : allerAuSuivant, genreDe(it.options || ech.options)),
        it.note ? h('p', { class: 'note', text: it.note }) : null
      ]);
    });
    return h('div', { class: 'echelle' }, [
      ech.consigne ? h('p', { class: 'consigne', text: ech.consigne }) : null
    ].concat(blocs, [ech.message_apres && ecran.dernierBloc ? h('p', { class: 'message message-doux', text: ech.message_apres }) : null]));
  }
  /* Après un choix sur un item d'échelle : faire défiler jusqu'au prochain item sans réponse. */
  /* Une question répondue se replie en une fine ligne (question + réponse choisie) et la suivante remonte.
     Toucher la ligne la rouvre pour changer la réponse. Uniquement pour les questions à choix unique. */
  var REPLI = false;
  function replierReponses() {
    REPLI = true;
    app.querySelectorAll('fieldset.question').forEach(function (q) {
      if (q.querySelector('input[type=checkbox], input[type=number], select') || q.dataset.reseaux) return;
      var radios = q.querySelectorAll('input[type=radio]'); if (!radios.length) return;
      q.classList.add('repliable');
      var resume = h('button', { type: 'button', class: 'rep-resume', 'aria-label': T.navigation.modifier || 'تعديل' }, [h('span', { class: 'rep-coche', 'aria-hidden': 'true', text: '✓' }), h('span', { class: 'rep-texte' }), h('span', { class: 'rep-modif', 'aria-hidden': 'true', text: '✎' })]);
      q.appendChild(resume);
      function maj() {
        var c = q.querySelector('input[type=radio]:checked'); if (!c) return false;
        var lab = c.closest('label');
        resume.querySelector('.rep-texte').textContent = lab ? (lab.querySelector('.option-texte') || lab).textContent : '';
        resume.style.setProperty('--t', lab ? (lab.style.getPropertyValue('--t') || 0) : 0);
        return true;
      }
      if (maj()) q.classList.add('repondu');
      var minut = null;
      q.addEventListener('change', function (ev) {
        if (ev.target.type !== 'radio' || !maj()) return;
        clearTimeout(minut);
        minut = setTimeout(function () { q.classList.add('repondu'); }, 380);   // on laisse voir le choix, puis la carte se replie
      });
      resume.addEventListener('click', function () { clearTimeout(minut); q.classList.remove('repondu'); });
    });
  }
  function allerAuSuivant(input) {
    var item = input.closest('.item'); if (!item) return;
    var suivants = Array.prototype.slice.call(app.querySelectorAll('.item'));
    var cible = suivants.slice(suivants.indexOf(item) + 1).find(function (n) { return vide(etat.reponses[n.getAttribute('data-var')]); });
    var dest = cible || app.querySelector('.nav');
    if (!dest) return;
    if (REPLI) {   // la carte se replie : on ne fait défiler que si la question suivante sort de l'écran
      setTimeout(function () { var r = dest.getBoundingClientRect(); if (r.top < 70 || r.bottom > innerHeight - 20) dest.scrollIntoView({ behavior: CALME ? 'auto' : 'smooth', block: cible ? 'center' : 'end' }); }, 820);
      return;
    }
    setTimeout(function () { dest.scrollIntoView({ behavior: CALME ? 'auto' : 'smooth', block: cible ? 'center' : 'end' }); }, 180);
  }

  function rendreElement(el) {
    switch (el.type) {
      case 'choix': return rendreChoix(el);
      case 'nombre': return rendreNombre(el);
      case 'texte': return rendreTexte(el);
      case 'liste': return rendreListe(el);
      case 'multiple': return rendreMultiple(el);
      case 'reseaux': return rendreReseaux(el);
      case 'message': return el.intertitre ? h('h2', { class: 'intertitre', text: el.texte }) : h('p', { class: 'message', text: el.texte });
      default: return null;
    }
  }

  /* ---------- validation d'un écran ---------- */
  function valider(ecran, eff) {
    var erreurs = [];   // { noeud, message, bloquant }
    function q(v) { return app.querySelector('[data-var="' + v + '"]'); }
    function manque(noeud, msg) { erreurs.push({ noeud: noeud, message: msg || T.erreurs.obligatoire, bloquant: false }); }
    if (ecran.echelle) {
      ecran.items.forEach(function (it) { if (vide(etat.reponses[it.var])) manque(q(it.var)); });
      return erreurs;
    }
    ecran.elements.forEach(function (el) {
      if (!eff.visibles.has(el)) return;
      var rep = etat.reponses;
      if (el.type === 'choix' || el.type === 'liste' || el.type === 'texte') {
        if (vide(rep[el.var])) manque(q(el.var));
      } else if (el.type === 'nombre') {
        var x = rep[el.var];
        if (vide(x)) { manque(q(el.var), T.erreurs.nombre.replace('{min}', el.min).replace('{max}', el.max)); return; }
        if (x < el.min || x > el.max || Math.floor(x) !== x) erreurs.push({ noeud: q(el.var), message: T.erreurs.nombre.replace('{min}', el.min).replace('{max}', el.max), bloquant: true });
        else if (el.max_var && !vide(rep[el.max_var]) && x > Number(rep[el.max_var])) erreurs.push({ noeud: q(el.var), message: T.erreurs.age_incoherent, bloquant: true });
      } else if (el.type === 'multiple') {
        var nb = el.choix.filter(function (c) { return Number(rep[c.var]) === 1; }).length;
        if (nb < (el.min || 0)) manque(app.querySelector('#c_' + el.choix[0].var).closest('.question'), T.erreurs.au_moins_un);
      } else if (el.type === 'reseaux') {
        var noeud = app.querySelector('[data-reseaux]');
        var coches = el.reseaux.filter(function (r) { return Number(rep[r.var]) === 1; });
        if (!coches.length) manque(noeud, T.erreurs.au_moins_un);
        else if (vide(rep[el.var_plus])) manque(noeud, T.erreurs.reseaux_plus);
        else if (coches.length >= 2 && vide(rep[el.var_moins])) manque(noeud, T.erreurs.reseaux_moins);
        else if (coches.length >= 2 && Number(rep[el.var_moins]) === Number(rep[el.var_plus])) erreurs.push({ noeud: noeud, message: T.erreurs.reseaux_moins, bloquant: true });
      }
    });
    return erreurs;
  }

  /* ---------- écran du questionnaire ---------- */
  function icone(id) { return (T.icones || {})[id] || '⭐'; }
  function stepper(ecran) {
    var parties = ecran.section.parties;
    return h('ol', { class: 'stepper', 'aria-label': ecran.section.titre }, parties.map(function (p, i) {
      var st = ecran.type === 'intro' ? 'a-venir' : (i < ecran.iPartie ? 'fait' : (i === ecran.iPartie ? 'en-cours' : 'a-venir'));
      return h('li', { class: 'etape ' + st, 'aria-current': st === 'en-cours' ? 'step' : null, title: p.titre }, [
        h('span', { class: 'rond', 'aria-hidden': 'true', text: st === 'fait' ? '✓' : icone(p.id) }),
        h('span', { class: 'etape-nom', text: p.titre })
      ]);
    }));
  }
  function barreProgression() {
    var pct = Math.round(100 * etat.i / ECRANS.length);
    return h('div', { class: 'progression-ligne' }, [
      h('div', { class: 'progression', role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(pct), 'aria-label': T.navigation.progression }, [
        h('div', { class: 'progression-barre', style: 'width:' + Math.max(3, pct) + '%' })
      ]),
      h('span', { class: 'progression-pct', dir: 'ltr', text: pct + '%' })
    ]);
  }

  /* ---------- stations : chaque partie est une île flottante où un étudiant attend ---------- */
  var PERSOS_DEFAUT = ['🧑‍🎓', '👩‍🎓', '👨‍🎓', '🧑‍💻', '👩‍💻', '🧑‍🏫'];
  function ileSVG(id) {
    return '<svg viewBox="0 0 320 210" class="ile-svg" aria-hidden="true">' +
      '<defs><linearGradient id="roc' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9A26A"/><stop offset=".55" stop-color="#9C7445"/><stop offset="1" stop-color="#5E4429"/></linearGradient>' +
      '<linearGradient id="her' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5EEAD4"/><stop offset="1" stop-color="#0D9488"/></linearGradient></defs>' +
      '<path d="M18 62 C 40 40 120 34 160 36 C 210 34 290 42 304 62 C 290 98 248 112 226 140 C 204 168 186 196 160 204 C 136 196 120 170 100 146 C 76 118 34 100 18 62 Z" fill="url(#roc' + id + ')"/>' +
      '<path d="M70 96 L 92 128 M 230 92 L 210 130 M 150 120 L 158 176" stroke="#5E4429" stroke-width="3" stroke-linecap="round" opacity=".45"/>' +
      '<ellipse cx="160" cy="58" rx="146" ry="30" fill="url(#her' + id + ')"/>' +
      '<path d="M22 60 q10 -18 18 -2 q6 -16 14 0 q8 -14 14 2 M250 52 q8 -16 16 0 q8 -14 14 2 q6 -12 12 4 M120 40 q6 -12 12 0 q6 -10 10 2" fill="#14B8A6" stroke="#0F766E" stroke-width="2"/>' +
      '<circle cx="64" cy="50" r="5" fill="#FF7F6B"/><circle cx="256" cy="46" r="4" fill="#E2B970"/><circle cx="196" cy="40" r="3.500" fill="#FF7F6B"/>' +
      '<path d="M120 196 q-4 10 2 14 M196 182 q4 12 -2 16 M150 204 q2 6 -1 8" stroke="#0F766E" stroke-width="2.500" fill="none" stroke-linecap="round"/>' +
      '</svg>';
  }

  /* Station : le monde 3D où l'étudiant marche jusqu'à la station, puis le panneau d'arrivée. */
  function rendreStation(ecran, precedent) {
    var p = ecran.partie, th = theme(p), num = PARTIES.indexOf(p) + 1, v = T.voyage;
    var intro = (T.sections_intro || {})[ecran.section.id] || {};
    var monde = ecran.debutSection ? (v.mondes || {})[ecran.section.id] : null;
    return [
      barreProgression(),
      h('section', { class: 'v3d', style: '--accent:' + th.couleur }, [
        h('div', { class: 'v3d-scene' }),
        T.ditto && !SAISIE ? h('p', { class: 'v3d-bulle', text: T.ditto.stations[(num - 1) % T.ditto.stations.length] }) : null,
        h('div', { class: 'v3d-carte', 'aria-hidden': 'true' }),
        h('p', { class: 'v3d-route' }, [h('span', { class: 'v3d-route-t', text: v.en_route.replace('{n}', num) }), h('span', { class: 'v3d-passer', text: v.passer })]),
        h('div', { class: 'v3d-panneau' }, [
          monde ? h('p', { class: 'monde' }, [h('span', { class: 'monde-em', text: monde })]) : null,
          ecran.debutSection && intro.message ? h('p', { class: 'encouragement', text: intro.message }) : null,
          h('p', { class: 'station-num', text: v.station.replace('{n}', num).replace('{total}', PARTIES.length) }),
          h('h1', { class: 'station-titre' }, [h('span', { 'aria-hidden': 'true', text: icone(p.id) + ' ' }), p.titre]),
          window.Jeux && T.jeux ? h('div', { class: 'pause-invit' }, [
            h('span', { class: 'pause-invit-t', text: T.jeux.invitation }),
            bouton(T.jeux.bouton, 'btn-pause', function () { window.Jeux.ouvrir(T.jeux, function () {}); })
          ]) : null,
          h('div', { class: 'nav' }, [precedent, bouton(v.entrer, 'btn-principal', avancer, { id: 'btn-suivant' })])
        ])
      ])
    ];
  }
  var DERNIERE_STATION = null;
  function lancerVoyage3D(ecran) {
    var sec = app.querySelector('.v3d'); if (!sec) return;
    var k = PARTIES.indexOf(ecran.partie);
    var de = SENS === 'avant' && DERNIERE_STATION !== k ? k - 1 : k;
    DERNIERE_STATION = k;
    var arrive = function () { sec.classList.add('arrive'); };
    if (!window.Voyage3D || !window.Voyage3D.monter(sec.querySelector('.v3d-scene'), de, k, arrive)) { sec.classList.add('sans3d'); arrive(); }
  }
  /* L'avatar 🎒 saute de la station précédente à la nouvelle. */
  function lancerRoute() {
    var r = app.querySelector('.route'); if (!r) return;
    var noeuds = r.querySelectorAll('.route-noeud'), av = r.querySelector('.route-avatar');
    function placer(k) {
      var n = noeuds[k]; if (!n) return;
      var rr = r.getBoundingClientRect(), nr = n.getBoundingClientRect();
      av.style.left = (nr.left - rr.left + nr.width / 2) + 'px';
    }
    placer(Number(r.getAttribute('data-de')));
    requestAnimationFrame(function () { setTimeout(function () { av.classList.add('saute'); placer(Number(r.getAttribute('data-a'))); }, 650); });
  }

  /* « 3 / 30 » : position de la question dans sa partie (questions affichées seulement). */
  function compteurPartie(ecran, eff) {
    var scores = Scoring.calculer(eff.rep), n = 0, pos = 0;
    ECRANS.forEach(function (e, i) {
      if (e.type !== 'q' || e.partie !== ecran.partie || !ecranVisible(e, eff, scores)) return;
      n++; if (i === etat.i) pos = n;
    });
    return h('span', { class: 'compteur', dir: 'ltr', text: pos + ' / ' + n });
  }
  function rendreQuestionnaire(conserverDefilement) {
    REPLI = false;
    var y = window.scrollY;
    var focusId = document.activeElement && document.activeElement.id;
    var ecran = ECRANS[etat.i];
    var eff = Schema.effectives(Q, etat.reponses);
    var dernier = ecranSuivant(etat.i, 1) < 0;
    var precedent = ecranSuivant(etat.i, -1) >= 0 ? bouton(T.navigation.precedent, 'btn-gris', reculer) : h('span');
    var noeuds, classe = 'page-questionnaire';

    if (ecran.type === 'station') {
      noeuds = rendreStation(ecran, precedent);
      classe = 'page-questionnaire page-station';
    } else if (ecran.type === 'intro') {
      var intro = (T.sections_intro || {})[ecran.section.id] || {};
      noeuds = [
        barreProgression(),
        h('section', { class: 'carte carte-intro' }, [
          autocollant(icone(ecran.section.id), intro.satellites, 'grand'),
          intro.message ? h('p', { class: 'encouragement', text: intro.message }) : null,
          h('h1', { class: 'titre-degrade', text: ecran.section.titre }),
          ecran.section.intro ? h('p', { class: 'intro-texte', text: ecran.section.intro }) : null,
          h('ul', { class: 'missions' }, ecran.section.parties.map(function (p) {
            return h('li', null, [h('span', { class: 'mission-icone', 'aria-hidden': 'true', text: icone(p.id) }), h('span', { text: p.titre })]);
          })),
          h('div', { class: 'nav' }, [precedent, bouton(T.navigation.commencer_section, 'btn-principal', avancer)])
        ])
      ];
    } else if (ecran.type === 'resultat') {
      classe = 'page-questionnaire page-revelation';
      var scores = Scoring.calculer(eff.rep);
      var soutien = ecran.cle === 'SOUTIEN' || (ecran.cle === 'PHQ9' && Number(eff.rep.PHQ_09) >= 1);
      noeuds = [
        barreProgression(),
        ecran.cle === 'SOUTIEN' ? null : h('div', { class: 'revelation-tete' }, [
          h('p', { class: 'revelation-sur', text: T.resultats.intermediaire_sur }),
          h('h1', { class: 'revelation-titre', text: etat.prenom ? T.resultats.intermediaire_prenom.replace('{prenom}', etat.prenom) : T.resultats.intermediaire_titre })
        ]),
        ecran.cle === 'SOUTIEN' ? null : (ecran.cle === 'BFI' ? carteBFI(scores) : carteEchelle(ecran.cle, scores)),
        soutien ? blocSoutien() : null,
        ecran.cle === 'SOUTIEN' ? null : h('p', { class: 'avertissement-medical petit', text: F.avertissement }),
        h('div', { class: 'nav' }, [precedent, bouton(dernier ? T.navigation.envoyer : T.resultats.continuer, 'btn-principal', avancer, { id: 'btn-suivant' })])
      ];
    } else {
      var visiblesQ = ecran.elements.filter(function (el) { return eff.visibles.has(el); });
      var seule = ecran.echelle ? null : visiblesQ.filter(function (el) { return el.type !== 'message'; });
      CTX.sansEmoji = !!((ecran.echelle && ecran.echelle.sans_emoji) || (seule && seule[0] && seule[0].sans_emoji));
      CTX.heros = theme(ecran.partie).heros;
      CTX.auto = !!(ecran.unique && (ecran.echelle ? !ecran.echelle.message_apres || !ecran.dernierBloc : (seule.length === 1 && seule[0].type === 'choix')));
      var contenu = ecran.echelle ? [rendreEchelle(ecran)]
        : ecran.elements.filter(function (el) { return eff.visibles.has(el); }).map(rendreElement);
      noeuds = [
        barreProgression(),
        h('div', { class: 'tete-section' }, [h('p', { class: 'nom-section', text: ecran.section.titre }), stepper(ecran)]),
        SAISIE ? null : cotes(ecran.partie),
        h('section', { class: 'carte carte-theme glisse-' + SENS + (ecran.unique ? ' carte-question' : '') }, [
          SAISIE || !ecran.debutPartie ? null : bandeauTheme(ecran.partie),   // bannière seulement sur la 1re page de la station
          h('h2', { class: 'titre-partie' }, [h('span', { class: 'titre-partie-icone', 'aria-hidden': 'true', text: icone(ecran.partie.id) }), h('span', { text: ecran.partie.titre }),
            ecran.unique ? compteurPartie(ecran, eff) : null])
        ].concat(contenu)),
        h('p', { class: 'resume-erreurs', id: 'resume-erreurs', role: 'alert', hidden: true, text: T.erreurs.resume }),
        h('div', { class: 'nav' }, [
          precedent,
          bouton(dernier ? (SAISIE ? T.saisie.enregistrer : T.navigation.envoyer) : T.navigation.suivant, 'btn-principal', avancer, { id: 'btn-suivant' })
        ])
      ];
    }
    app.className = 'page ' + classe;
    document.body.classList.add('clair');
    appliquerTheme(ecran.type === 'intro' ? null : ecran.partie);

    majAlbum(!SAISIE);
    app.replaceChildren.apply(app, noeuds.filter(Boolean));
    if (ecran.type === 'station' && !SAISIE) lancerVoyage3D(ecran);
    if (ecran.type === 'q' && !SAISIE && !ecran.unique) replierReponses();
    if (conserverDefilement) {
      window.scrollTo(0, y);
      if (focusId) { var f = document.getElementById(focusId); if (f) try { f.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
    } else {
      window.scrollTo(0, 0);
    }
  }

  function avancer() {
    var ecran = ECRANS[etat.i];
    if (ecran.type === 'q') {
      var eff = Schema.effectives(Q, etat.reponses);
      var erreurs = valider(ecran, eff);
      var bloquantes = erreurs.filter(function (e) { return e.bloquant; });
      var aTraiter = SAISIE ? bloquantes : erreurs;
      if (aTraiter.length) {
        aTraiter.forEach(function (e) { if (e.noeud) poserErreur(e.noeud, e.message); });
        document.getElementById('resume-erreurs').hidden = false;
        if (aTraiter[0].noeud) aTraiter[0].noeud.scrollIntoView({ behavior: CALME ? 'auto' : 'smooth', block: 'center' });
        return;
      }
      if (SAISIE && erreurs.length) { confirmer(T.saisie.incomplet, passer); return; }
    }
    passer();
  }
  function passer() {
    var avant = ECRANS[etat.i];
    SENS = 'avant';
    var suivant = ecranSuivant(etat.i, 1);
    if (suivant < 0) { envoyer(); return; }
    etat.i = suivant;
    var gagnes = SAISIE ? [] : nouveauxAutocollants();
    sauver();
    var e2 = ECRANS[suivant];
    function montrer() {
      rendreQuestionnaire(false);
      annoncerAutocollants(gagnes);
      if (e2.type === 'resultat' && e2.cle !== 'SOUTIEN') { confettis(); return; }
      var msg = e2.type === 'q' && e2.debutPartie && e2.partie !== avant.partie && (T.encouragements_parties || {})[e2.partie.id];
      if (msg && !SAISIE && !gagnes.length) toast(msg);
    }
    if (SAISIE) { montrer(); return; }
    // entrer dans une station : une porte s'ouvre
    if (avant.type === 'station' && e2.type === 'q' && window.FX) {
      var porte = function () { window.FX.porte(theme(avant.partie).couleur, icone(avant.partie.id), avant.partie.titre, montrer); };
      porte();
      return;
    }
    // nouvelle station : l'étudiant marche sur la carte de la station précédente à la suivante
    montrer();
  }

  /* ---------- mini-jeu de 8 secondes avant chaque partie (casser la sensation de longueur) ---------- */
  function miniJeu(station, fini) {
    var J = T.jeu, sid = station.section.id, but = 5, duree = 8000, pris = 0, fin = false, minuteurs = [];
    if (!J || (window.FX && window.FX.calme)) { fini(); return; }
    var cibles = (J.cibles || {})[sid] || ['⭐'];
    var compte = h('span', { class: 'jeu-compte', dir: 'ltr', text: '0 / ' + but });
    var barre = h('div', { class: 'jeu-temps-barre' });
    var arene = h('div', { class: 'jeu-arene', style: '--c:' + theme(station.partie).couleur });
    var passer = h('button', { type: 'button', class: 'btn btn-fantome jeu-passer', text: J.passer });
    var fond = h('div', { class: 'jeu-mini', role: 'dialog', 'aria-label': J.titre }, [
      h('div', { class: 'jeu-tete' }, [h('strong', { text: J.titre }), compte]),
      h('p', { class: 'jeu-consigne', text: (J.consignes || {})[sid] || '' }),
      h('div', { class: 'jeu-temps' }, [barre]),
      arene, passer
    ]);
    document.body.appendChild(fond);
    function terminer(message) {
      if (fin) return; fin = true;
      minuteurs.forEach(clearTimeout); clearInterval(apparition);
      etat.points = (etat.points || 0) + pris; sauver();
      arene.replaceChildren(h('div', { class: 'jeu-fin' }, [h('p', { class: 'jeu-fin-msg', text: message }), h('p', { class: 'jeu-fin-total', text: J.total.replace('{n}', etat.points) })]));
      if (pris >= but) confettis();
      setTimeout(function () { fond.classList.add('sortie'); setTimeout(function () { fond.remove(); }, 350); fini(); }, pris >= but ? 1100 : 900);
    }
    function cible() {
      if (fin) return;
      var r = arene.getBoundingClientRect();
      var b = h('button', { type: 'button', class: 'jeu-cible', 'aria-label': '+1', text: cibles[Math.floor(Math.random() * cibles.length)],
        style: 'left:' + (8 + Math.random() * 76).toFixed(1) + '%;top:' + (10 + Math.random() * 70).toFixed(1) + '%' });
      b.addEventListener('pointerdown', function (e) {
        e.preventDefault(); if (fin || b.classList.contains('pris')) return;
        b.classList.add('pris'); pris++; compte.textContent = pris + ' / ' + but;
        if (window.FX) window.FX.eclat(e.clientX, e.clientY, 14);
        setTimeout(function () { b.remove(); }, 300);
        if (pris >= but) terminer(J.gagne.replace('{n}', pris));
      });
      arene.appendChild(b);
      minuteurs.push(setTimeout(function () { if (!b.classList.contains('pris')) { b.classList.add('rate'); setTimeout(function () { b.remove(); }, 300); } }, 1700));
    }
    var apparition = setInterval(cible, 560);
    setTimeout(cible, 150);
    requestAnimationFrame(function () { barre.style.transition = 'transform ' + duree + 'ms linear'; barre.style.transform = 'scaleX(0)'; });
    minuteurs.push(setTimeout(function () { terminer(pris ? J.gagne.replace('{n}', pris) : J.temps); }, duree));
    passer.addEventListener('click', function () { terminer(J.temps); });
  }

  /* ---------- carte de la route : chemin sinueux à travers les 3 mondes ---------- */
  var CARTE = { L: 360, pas: 88, haut: 80 };
  function pointsCarte() {
    var pts = [{ x: 180, y: CARTE.haut }];   // index 0 = départ, puis 1..20 = stations
    PARTIES.forEach(function (p, k) { pts.push({ x: 180 + 112 * Math.sin((k + 1) * 1.05), y: CARTE.haut + (k + 1) * CARTE.pas }); });
    return pts;
  }
  function cheminLisse(pts) {
    var d = 'M' + pts[0].x.toFixed(1) + ' ' + pts[0].y.toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += ' C' + (p1.x + (p2.x - p0.x) / 6).toFixed(1) + ' ' + (p1.y + (p2.y - p0.y) / 6).toFixed(1) + ' ' +
        (p2.x - (p3.x - p1.x) / 6).toFixed(1) + ' ' + (p2.y - (p3.y - p1.y) / 6).toFixed(1) + ' ' + p2.x.toFixed(1) + ' ' + p2.y.toFixed(1);
    }
    return d;
  }
  /* de, a : index de station (0..19) ; -1 = départ. */
  function construireCarte(de, a) {
    var pts = pointsCarte(), H = pts[pts.length - 1].y + 80, d = cheminLisse(pts), mondes = '', v = T.voyage;
    var couleursMonde = { S1: '#0D9488', S2: '#E0543F', S3: '#C8964A' };
    Q.sections.forEach(function (sec) {
      var idx = PARTIES.filter(function (p) { return sec.parties.indexOf(p) >= 0; }).map(function (p) { return PARTIES.indexOf(p) + 1; });
      var y0 = pts[idx[0]].y - CARTE.pas / 2, y1 = pts[idx[idx.length - 1]].y + CARTE.pas / 2;
      mondes += '<rect x="0" y="' + y0 + '" width="' + CARTE.L + '" height="' + (y1 - y0) + '" fill="' + couleursMonde[sec.id] + '" opacity=".1"/>' +
        '<text x="' + (CARTE.L / 2) + '" y="' + (y0 + 24) + '" text-anchor="middle" class="carte-monde" fill="' + couleursMonde[sec.id] + '">' + ((v.mondes || {})[sec.id] || '') + '</text>';
    });
    var deco = ['🌴', '☁️', '🌵', '⛰️', '🌲', '🏕️', '🌸', '🪨'];
    var decos = '';
    for (var k = 1; k < pts.length; k += 2) decos += '<text x="' + (pts[k].x > 180 ? 40 : 320) + '" y="' + (pts[k].y + 10) + '" font-size="26" opacity=".75" text-anchor="middle">' + deco[k % deco.length] + '</text>';
    var noeuds = '<g class="carte-noeud depart"><circle cx="' + pts[0].x + '" cy="' + pts[0].y + '" r="22" fill="#FFFCF7"/><text x="' + pts[0].x + '" y="' + (pts[0].y + 9) + '" font-size="24" text-anchor="middle">🚩</text>' +
      '<text x="' + pts[0].x + '" y="' + (pts[0].y - 30) + '" class="carte-lib" text-anchor="middle">' + v.depart + '</text></g>';
    PARTIES.forEach(function (p, k) {
      var pt = pts[k + 1], st = k < a ? 'fait' : (k === a ? 'ici' : 'apres'), c = theme(p).couleur;
      noeuds += '<g class="carte-noeud ' + st + '" style="--c:' + c + '">' +
        '<circle cx="' + pt.x.toFixed(1) + '" cy="' + pt.y + '" r="25" class="cn-fond"/>' +
        '<text x="' + pt.x.toFixed(1) + '" y="' + (pt.y + 9) + '" font-size="24" text-anchor="middle">' + (st === 'apres' ? '🔒' : icone(p.id)) + '</text>' +
        (st === 'fait' ? '<circle cx="' + (pt.x + 18).toFixed(1) + '" cy="' + (pt.y - 18) + '" r="9" fill="#2DD4BF" stroke="#fff" stroke-width="2"/><text x="' + (pt.x + 18).toFixed(1) + '" y="' + (pt.y - 14) + '" font-size="11" font-weight="800" text-anchor="middle" fill="#042F2E">✓</text>' : '') +
        '<text x="' + (pt.x + (pt.x > 180 ? -36 : 36)).toFixed(1) + '" y="' + (pt.y + 5) + '" class="carte-lib" text-anchor="' + (pt.x > 180 ? 'end' : 'start') + '">' + (k + 1) + '</text></g>';
    });
    var svg = '<svg viewBox="0 0 ' + CARTE.L + ' ' + H + '" class="carte-svg" aria-hidden="true">' + mondes + decos +
      '<path d="' + d + '" class="carte-chemin-ombre"/><path d="' + d + '" class="carte-chemin"/><path d="' + d + '" class="carte-chemin-fait"/>' + noeuds + '</svg>';
    var avatar = h('div', { class: 'carte-avatar', html: window.Avatar ? '' : window.Etudiant ? Etudiant.svg({ pose: 'salut', genre: (de + a) % 2 ? 'h' : 'f' }) : '🎒' });
    if (window.Avatar) avatar.appendChild(window.Avatar.pose('salut'));
    return { el: h('div', { class: 'carte-monde-boite' }, [h('div', { class: 'carte-plan', html: svg }), avatar]), pts: pts };
  }
  function voyageCarte(de, a, fini, statique, depart) {
    var v = T.voyage, c = construireCarte(de, a);
    var fermer = h('button', { type: 'button', class: 'btn btn-principal carte-btn', text: statique ? v.fermer : depart ? v.commencer_route : v.continuer });
    var fond = h('div', { class: 'carte-jeu' + (statique ? ' statique' : ''), role: 'dialog', 'aria-label': v.carte_titre }, [
      h('div', { class: 'carte-tete' }, [h('strong', { text: v.carte_titre }), h('span', { class: 'carte-compte', dir: 'ltr', text: (a + 1) + ' / ' + PARTIES.length })]),
      depart ? h('p', { class: 'carte-intro', text: v.carte_intro.replace('{n}', PARTIES.length).replace('{s}', Q.sections.length) }) : null,
      h('div', { class: 'carte-defile' }, [c.el]),
      fermer
    ]);
    document.body.appendChild(fond);
    var defile = fond.querySelector('.carte-defile'), chemin = fond.querySelector('.carte-chemin'), fait = fond.querySelector('.carte-chemin-fait'), av = fond.querySelector('.carte-avatar');
    var total = chemin.getTotalLength(), echant = [];
    for (var l = 0; l <= total; l += 3) { var q = chemin.getPointAtLength(l); echant.push([l, q.x, q.y]); }
    function longueurA(idx) {
      var pt = c.pts[idx + 1], best = 0, bd = 1e9;
      echant.forEach(function (e) { var dd = (e[1] - pt.x) * (e[1] - pt.x) + (e[2] - pt.y) * (e[2] - pt.y); if (dd < bd) { bd = dd; best = e[0]; } });
      return best;
    }
    if (depart && T.ditto) av.appendChild(h('span', { class: 'carte-bulle', text: T.ditto.carte.replace('{n}', PARTIES.length) }));
    var L0 = longueurA(de), L1 = longueurA(a), termine = false;
    fait.style.strokeDasharray = total; 
    function placer(l) {
      var q = chemin.getPointAtLength(l), sc = c.el.clientWidth / CARTE.L;
      av.style.transform = 'translate(' + (q.x * sc).toFixed(1) + 'px,' + (q.y * sc).toFixed(1) + 'px)';
      fait.style.strokeDashoffset = (total - l).toFixed(1);
      defile.scrollTop = q.y * sc - defile.clientHeight / 2;
    }
    function finir() {
      if (termine) return; termine = true;
      fond.classList.add('sortie');
      setTimeout(function () { fond.remove(); }, 380);
      if (fini) fini();
    }
    fermer.addEventListener('click', finir);
    fond.addEventListener('keydown', function (e) { if (e.key === 'Escape') finir(); });
    requestAnimationFrame(function () {
      placer(statique || (window.FX && window.FX.calme) ? L1 : L0);
      fermer.focus();
      if (statique || (window.FX && window.FX.calme)) return;
      var t0 = performance.now() + 450, duree = 1700;
      (function pas(t) {
        if (termine) return;
        var x = Math.max(0, Math.min(1, (t - t0) / duree)), e = x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
        placer(L0 + (L1 - L0) * e);
        av.classList.toggle('marche', x > 0 && x < 1);
        if (x < 1) requestAnimationFrame(pas);
        else { av.classList.add('arrive'); if (window.FX) { var r = av.getBoundingClientRect(); window.FX.eclat(r.left + r.width / 2, r.top + r.height / 2, 16); } }
      })(performance.now());
    });
  }
  function ouvrirCarte() {
    var a = 0;
    PARTIES.forEach(function (p, k) { if ((etat.album || []).indexOf(p.id) >= 0) a = Math.min(PARTIES.length - 1, k + 1); });
    var e = ECRANS[etat.i]; if (e && e.partie) a = PARTIES.indexOf(e.partie);
    voyageCarte(a, a, null, true);
  }

  /* ---------- album d'autocollants : un par partie terminée ---------- */
  function autocollantsGagnes(i) {
    return PARTIES.filter(function (p) { return FIN_PARTIE[p.id] !== undefined && FIN_PARTIE[p.id] < i; });
  }
  function nouveauxAutocollants() {
    etat.album = etat.album || [];
    var nouveaux = autocollantsGagnes(etat.i).filter(function (p) { return etat.album.indexOf(p.id) < 0; });
    nouveaux.forEach(function (p) { etat.album.push(p.id); });
    return nouveaux;
  }
  function annoncerAutocollants(liste) {
    var cible = document.getElementById('album');
    // reprise d'une ancienne sauvegarde : plusieurs autocollants d'un coup → on n'anime que le dernier
    if (liste.length > 1) { liste = liste.slice(-1); majCompteAlbum(); }
    liste.forEach(function (p) {
      toast(T.album.nouveau.replace('{nom}', p.titre));
      if (window.FX) window.FX.debloquer(icone(p.id), theme(p).couleur, cible, majCompteAlbum);
    });
  }
  function majCompteAlbum() {
    var n = (etat && etat.album || []).length;
    var c = document.getElementById('album-compte');
    if (c) c.textContent = T.album.compte.replace('{n}', n).replace('{total}', PARTIES.length);
  }
  function majAlbum(visible) {
    var b = document.getElementById('album');
    if (!b || !T) return;
    b.hidden = !visible;
    var bc = document.getElementById('btn-carte'); if (bc) bc.hidden = !visible;
    var bj = document.getElementById('btn-jeux'); if (bj) bj.hidden = !visible || !window.Jeux;
    majCompteAlbum();
  }
  function grilleAlbum(ids) {
    return h('div', { class: 'album-grille' }, PARTIES.map(function (p, k) {
      var ok = ids.indexOf(p.id) >= 0;
      return h('div', { class: 'sticker' + (ok ? '' : ' verrouille'), style: '--sc:' + theme(p).couleur + ';--k:' + k, title: ok ? p.titre : T.album.verrouille }, [
        h('span', { class: 'sticker-emoji', 'aria-hidden': 'true', text: ok ? icone(p.id) : '?' }),
        h('span', { class: 'sticker-nom', text: ok ? p.titre : T.album.verrouille })
      ]);
    }));
  }
  function ouvrirAlbum() {
    var d = document.getElementById('dialogue-aide');
    var ids = etat.album || [];
    d.replaceChildren(
      h('h2', { class: 'album-titre', id: 'aide-titre', text: T.album.titre }),
      h('p', { class: 'aide centre', text: T.album.sous_titre }),
      h('p', { class: 'album-score', dir: 'ltr', text: T.album.compte.replace('{n}', ids.length).replace('{total}', PARTIES.length) }),
      grilleAlbum(ids),
      h('div', { class: 'nav' }, [h('span'), bouton(T.aide.fermer, 'btn-gris', function () { d.close(); })])
    );
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
  }
  function reculer() {
    var p = ecranSuivant(etat.i, -1);
    if (p < 0) return;
    SENS = 'arriere';
    etat.i = p; sauver();
    rendreQuestionnaire(false);
  }

  /* ---------- pages d'entrée ---------- */
  /* ---------- page d'accueil : partie claire, puis tunnel 3D au défilement ---------- */
  function motsAnimes(texte, classe) {
    return h('span', { class: classe }, texte.split(' ').map(function (m, k) {
      return h('span', { class: 'mot', style: '--k:' + k }, [h('span', { class: 'mot-in', text: m })]);
    }).reduce(function (acc, x) { acc.push(x, ' '); return acc; }, []));
  }
  function titreAccueil(mots) {
    return h('h1', { class: 'ac-titre' }, mots.filter(function (m) { return m[1] !== 'chip'; }).map(function (m, k) {
      if (m[1] === 'chip') return h('span', { class: 'mot ac-chip', style: '--k:' + k, 'aria-hidden': 'true' }, [h('span', { class: 'mot-in' }, [h('span', { class: 'ac-chip-tel' }, [h('span', { text: m[0] })])])]);
      return h('span', { class: 'mot ' + (m[1] === 'b' ? 'fort' : 'leger'), style: '--k:' + k }, [h('span', { class: 'mot-in', text: m[0] })]);
    }).reduce(function (acc, x) { acc.push(x, ' '); return acc; }, []));
  }
  /* Un(e) étudiant(e) perdu(e) dans son téléphone, au centre d'une sphère de réseaux sociaux qui tourne. */
  function scenePerdu(A) {
    return h('section', { class: 'ac-perdu', 'aria-hidden': 'true' }, [
      h('div', { class: 'orbites' }, [0, 1].map(function (o) {
        var liste = (A.sphere || ['📱']).filter(function (_, k) { return k % 2 === o; }).slice(0, o ? 7 : 9);
        return h('div', { class: 'orbite o' + o, style: '--n:' + liste.length }, liste.map(function (e, k) {
          return h('span', { class: 'orbite-icone', style: '--k:' + k }, [h('span', { class: 'sph-em', text: e })]);
        }));
      })),
      h('div', { class: 'perdu-perso' }, [
        h('span', { class: 'sph-perso', text: A.perdu || '🤳' }),
        h('span', { class: 'perdu-bulle' }, [h('span', { class: 'sph-bulle-em', text: A.perdu_bulle || '😵‍💫' })]),
        h('span', { class: 'perdu-lueur' })
      ]),
      h('p', { class: 'perdu-texte', text: A.perdu_texte || '' })
    ]);
  }
  /* Illustration animée : une personne de nuit, le visage éclairé par son téléphone ;
     les réseaux sociaux s'échappent de l'écran et montent sans fin. */
  /* Portrait vivant : un étudiant qui scrolle (js/vivant.js). */
  function visuelAddiction() {
    var boite = h('div', { class: 'viv' });
    var cadre = h('div', { class: 'ac-visuel apparait', style: '--k:4' }, [h('div', { class: 'viv-cadre' }, [h('span', { class: 'viv-halo', 'aria-hidden': 'true' }), boite])]);
    setTimeout(function () { if (window.Avatar) window.Avatar.portrait(boite, T.ditto); else if (window.Vivant) window.Vivant.monter(boite); }, 0);
    return cadre;
  }
  function pageAccueil() {
    var enCours = etat.etape === 'questionnaire' || etat.etape === 'prenom' || etat.etape === 'envoi';
    var a = T.accueil, A = T.accueil2;
    var commencer = enCours ? reprendre : pageConsentement;
    var cta = function (classe) { return bouton((enCours ? a.bouton_reprendre : A.cta) + ' ←', 'btn ac-cta ' + (classe || ''), commencer); };
    var eventail = h('div', { class: 'ac-eventail', 'aria-hidden': 'true' }, A.cartes.map(function (c, k) {
      return h('div', { class: 'ac-carte', style: '--k:' + k + ';--n:' + A.cartes.length + ';--c:' + c[2] }, [
        h('span', { class: 'ac-carte-em', text: c[0] }), h('span', { class: 'ac-carte-nom', text: c[1] })
      ]);
    }));
    var tunnel = h('section', { class: 'tunnel' }, [
      h('div', { class: 'tunnel-scene' }, [
        h('canvas', { class: 'tunnel-canvas', 'aria-hidden': 'true' }),
        h('div', { class: 'tunnel-textes' }, A.beats.map(function (b, k) {
          return h('div', { class: 'beat' + (k === A.beats.length - 1 ? ' beat-fin' : ''), 'data-a': String(b.a), 'data-b': String(b.b) }, [
            h('p', { class: 'beat-t', text: b.t }), h('p', { class: 'beat-s', text: b.s }),
            k === A.beats.length - 1 ? cta('ac-cta-clair') : null
          ]);
        })),
        h('div', { class: 'tunnel-indice', 'aria-hidden': 'true' }, [h('span')])
      ])
    ]);
    var cinetique = h('section', { class: 'cinetique', 'aria-hidden': 'true' }, A.cinetique.map(function (ligne, k) {
      return h('div', { class: 'cin-ligne', 'data-sens': k % 2 ? '1' : '-1' }, ligne.concat(ligne).map(function (m) {
        return m[1] === 'tag' ? h('span', { class: 'cin-tag', text: m[0] }) : h('span', { class: 'cin-mot', text: m[0] });
      }));
    }));
    afficher([
      h('section', { class: 'ac-hero' }, [
        h('div', { class: 'ac-grille' }, [
          visuelAddiction(A.visuel || {}),
          h('div', { class: 'ac-texte' }, [
            h('p', { class: 'ac-etiquette apparait', style: '--k:0', text: a.etiquette }),
            titreAccueil(A.mots),
            h('p', { class: 'ac-sous apparait', style: '--k:7', text: a.sous_titre }),
            enCours ? h('p', { class: 'ac-reprise', text: a.reprise }) : null,
            h('div', { class: 'ac-actions apparait', style: '--k:9' }, [
              cta(),
              enCours ? bouton(a.bouton_recommencer, 'btn ac-lien', function () { etat = nouvelEtat(); sauver(); pageConsentement(); })
                : h('a', { class: 'btn ac-lien', href: '#decouvrir', text: A.decouvrir })
            ])
          ])
        ]),
        eventail
      ]),
      h('span', { id: 'decouvrir' }),
      tunnel,
      cinetique,
      h('section', { class: 'comment' }, [
        h('h2', { class: 'section-titre revele' }, [motsAnimes(a.comment_titre, 'titre-mots')]),
        h('div', { class: 'etapes' }, (a.etapes || []).map(function (e, k) {
          return h('article', { class: 'etape-carte revele', style: '--k:' + k }, [
            h('span', { class: 'etape-num', dir: 'ltr', text: '0' + (k + 1) }),
            h('span', { class: 'etape-icone', 'aria-hidden': 'true', text: e.icone }),
            h('h3', { text: e.titre }), h('p', { text: e.texte })
          ]);
        })),
        h('div', { class: 'stats' }, (a.stats || []).map(function (st, k) {
          return h('div', { class: 'stat revele', style: '--k:' + k }, [h('strong', { class: 'compte', dir: 'ltr', 'data-n': String(st.n), 'data-s': st.s, text: '0' + st.s }), h('span', { text: st.t })]);
        }))
      ]),
      h('section', { class: 'cta revele' }, [
        h('h2', { class: 'section-titre' }, [motsAnimes(a.cta_titre, 'titre-mots')]),
        h('ul', { class: 'badges' }, a.badges.map(function (b, i) {
          return h('li', null, [h('span', { 'aria-hidden': 'true', text: (a.badges_icones || [])[i] || '✨' }), h('span', { text: b })]);
        })),
        cta()
      ])
    ], 'page-accueil');
    animerAccueil();
    if (window.Accueil3D) window.Accueil3D.monter(tunnel);
  }
  /* révélations au défilement, compteurs, texte qui glisse avec le défilement */
  function animerAccueil() {
    var els = app.querySelectorAll('.revele');
    var compter = function (el) {
      var cible = Number(el.getAttribute('data-n')), suf = el.getAttribute('data-s') || '', t0 = performance.now();
      (function pas(t) {
        var x = Math.min(1, (t - t0) / 1400), e = x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
        el.textContent = Math.round(cible * e) + suf;
        if (x < 1) requestAnimationFrame(pas);
      })(t0);
    };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entrees) {
        entrees.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add('vu');
          en.target.querySelectorAll('.compte').forEach(compter);
          io.unobserve(en.target);
        });
      }, { threshold: .2 });
      els.forEach(function (el) { io.observe(el); });
    } else els.forEach(function (el) { el.classList.add('vu'); });
    var lignes = app.querySelectorAll('.cin-ligne'), sec = app.querySelector('.cinetique');
    function glisse() {
      if (!document.body.contains(sec)) { window.removeEventListener('scroll', glisse); return; }
      var r = sec.getBoundingClientRect(), p = (window.innerHeight - r.top) / (window.innerHeight + r.height);
      lignes.forEach(function (l) { l.style.transform = 'translateX(' + (Number(l.getAttribute('data-sens')) * (p - .5) * 40).toFixed(2) + '%)'; });
    }
    if (sec && !CALME) { window.addEventListener('scroll', glisse, { passive: true }); glisse(); }
    var perdu = app.querySelector('.ac-perdu'), sph = perdu && perdu.querySelector('.orbites');
    function grandit() {
      if (!document.body.contains(perdu)) { window.removeEventListener('scroll', grandit); return; }
      var r = perdu.getBoundingClientRect(), p = Math.max(0, Math.min(1, (window.innerHeight - r.top) / (window.innerHeight + r.height)));
      sph.style.setProperty('--zoom', (0.75 + p * 0.75).toFixed(3));
    }
    if (sph && !CALME) { window.addEventListener('scroll', grandit, { passive: true }); grandit(); }
  }
  function reprendre() {
    if (etat.etape === 'envoi') envoyer();
    else rendreQuestionnaire(false);
  }
  function pageConsentement() {
    var c = T.consentement;
    var cb = h('input', { type: 'checkbox', id: 'consentement' });
    var err = h('p', { class: 'erreur', role: 'alert', hidden: true, text: c.erreur });
    cb.addEventListener('change', function () { err.hidden = true; });
    afficher([
      h('section', { class: 'carte' }, [
        autocollant('🔐', ['✅', '🤝'], 'moyen'),
        h('h1', { class: 'titre-degrade centre', text: c.titre }),
        h('div', { class: 'consentement-texte' }, c.paragraphes.map(function (p) { return h('p', { text: p }); })),
        h('label', { class: 'option option-consentement', for: 'consentement' }, [cb, h('span', { class: 'option-texte', text: c.case })]),
        err,
        h('div', { class: 'nav' }, [
          bouton(c.bouton_refuser, 'btn-gris', function () { effacer(localStorage, CLE); etat = nouvelEtat(); pageRefus(); }),
          bouton(c.bouton_accepter, 'btn-principal', function () {
            if (!cb.checked) { err.hidden = false; return; }
            etat.etape = 'questionnaire'; etat.i = 0; etat.prenom = ''; etat.dernier = Date.now(); sauver(); majSalutation();
            // la carte de toute la route s'affiche d'abord : on voit combien de stations il y a
            voyageCarte(-1, 0, function () { rendreQuestionnaire(false); }, false, true);
          })
        ])
      ])
    ]);
  }
  function pageRefus() {
    afficher([h('section', { class: 'carte carte-centre' }, [
      autocollant('👋', [], 'moyen'),
      h('h1', { class: 'titre-degrade', text: T.refus.titre }),
      h('p', { text: T.refus.texte })
    ])]);
  }
  function pagePrenom() {
    var p = T.prenom;
    var input = h('input', { type: 'text', class: 'champ', id: 'prenom', maxlength: '24', autocomplete: 'off', placeholder: p.placeholder, value: etat.prenom || '' });
    function suite(garder) {
      etat.prenom = garder ? input.value.trim().slice(0, 24) : '';
      etat.etape = 'questionnaire'; etat.i = 0; etat.dernier = Date.now(); sauver(); majSalutation();
      voyageCarte(-1, 0, function () { rendreQuestionnaire(false); });
    }
    afficher([h('section', { class: 'carte carte-centre' }, [
      autocollant('😊', ['👋', '✨'], 'moyen'),
      h('h1', { class: 'titre-degrade' }, [h('label', { for: 'prenom', text: p.titre })]),
      h('p', { class: 'aide', text: p.texte }),
      input,
      h('div', { class: 'nav' }, [bouton(p.passer, 'btn-gris', function () { suite(false); }), bouton(p.bouton, 'btn-principal', function () { suite(true); })])
    ])]);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') suite(true); });
  }

  /* ---------- mode saisie chercheur ---------- */
  function pageSaisie(message) {
    var s = T.saisie;
    var input = h('input', { type: 'text', class: 'champ', id: 'num_formulaire', maxlength: '30', autocomplete: 'off', inputmode: 'numeric' });
    var err = h('p', { class: 'erreur', role: 'alert', hidden: true, text: T.erreurs.obligatoire });
    function debut() {
      if (!input.value.trim()) { err.hidden = false; return; }
      etat = nouvelEtat(); etat.num_formulaire = input.value.trim(); etat.etape = 'questionnaire'; sauver();
      rendreQuestionnaire(false);
    }
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') debut(); });
    afficher([h('section', { class: 'carte carte-centre' }, [
      message ? h('p', { class: 'message message-succes', text: message }) : null,
      h('h1', { class: 'titre-degrade', text: s.titre }),
      h('label', { class: 'titre-question', for: 'num_formulaire', text: s.num_formulaire }),
      input, err,
      h('div', { class: 'nav' }, [h('span'), bouton(message ? s.nouvelle : s.commencer, 'btn-principal', debut)])
    ])]);
    input.focus();
  }

  /* ---------- envoi ---------- */
  function construireLigne() {
    var eff = Schema.effectives(Q, etat.reponses);
    var scores = Scoring.calculer(eff.rep);
    var ligne = {
      id_participation: etat.id,
      duree_minutes: Math.round(etat.actif_ms / 6000) / 10,
      mode: SAISIE ? 'papier' : 'en ligne',
      consentement: 1,
      num_formulaire: SAISIE ? etat.num_formulaire : ''
    };
    Schema.variables(Q).forEach(function (v) { ligne[v.code] = vide(eff.rep[v.code]) ? '' : eff.rep[v.code]; });
    Scoring.COLONNES.forEach(function (c) { ligne[c] = scores[c]; });
    return { ligne: ligne, scores: scores, soutien: Scoring.besoinSoutien(eff.rep) };
  }
  function poster(ligne, essai) {
    return fetch(CFG.ENDPOINT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },   // « requête simple » : pas de blocage CORS
      body: JSON.stringify({ ligne: ligne }),
      redirect: 'follow'
    }).then(function (r) { return r.json(); }).then(function (j) {
      if (!j || !j.ok) throw new Error((j && j.erreur) || 'réponse inattendue');
    }).catch(function (e) {
      if (essai >= 3) throw e;
      // Le même identifiant est renvoyé : le script ignore les doublons.
      return new Promise(function (ok) { setTimeout(ok, 1500 * essai); }).then(function () { return poster(ligne, essai + 1); });
    });
  }
  var envoiEnCours = false;
  function envoyer() {
    if (envoiEnCours) return;
    envoiEnCours = true;
    var btn = document.getElementById('btn-suivant'); if (btn) btn.disabled = true;
    etat.etape = 'envoi'; sauver();
    var paquet = construireLigne();
    afficher([h('section', { class: 'carte carte-centre' }, [
      h('div', { class: 'roue', 'aria-hidden': 'true' }),
      h('h1', { class: 'titre-degrade', text: T.envoi.titre }),
      h('p', { text: T.envoi.texte })
    ])]);
    var envoi = CFG.ENDPOINT_URL ? poster(paquet.ligne, 1) : new Promise(function (ok) { setTimeout(ok, 500); });
    envoi.then(function () {
      envoiEnCours = false;
      effacer(localStorage, CLE);
      if (SAISIE) {
        var num = etat.num_formulaire; etat = nouvelEtat();
        pageSaisie(T.saisie.succes.replace('{num}', num));
        return;
      }
      var res = { scores: paquet.scores, soutien: paquet.soutien, prenom: etat.prenom };
      ecrire(sessionStorage, CLE_RES, res);
      toast(CFG.ENDPOINT_URL ? T.envoi.confirmation : T.envoi.demo);
      pageResultats(res);
      confettis();
    }).catch(function () {
      envoiEnCours = false;
      afficher([h('section', { class: 'carte carte-centre' }, [
        autocollant('📡', [], 'moyen'),
        h('h1', { class: 'titre-degrade', text: T.envoi.echec_titre }),
        h('p', { text: T.envoi.echec_texte }),
        h('div', { class: 'nav' }, [h('span'), bouton(T.envoi.reessayer, 'btn-principal', envoyer)])
      ])]);
    });
  }

  /* ---------- soutien et aide ---------- */
  function blocSoutien(idTitre) {
    var liste = (R.ressources || []).filter(function (r) { return r.verifie === true; });
    return h('section', { class: 'soutien' }, [
      h('h2', { id: idTitre || null, text: R.titre }),
      h('p', { text: R.message }),
      liste.length ? h('h3', { text: R.titre_ressources }) : null,
      liste.length ? h('ul', { class: 'ressources' }, liste.map(function (r) {
        return h('li', null, [
          h('strong', { text: r.nom }),
          r.description ? h('span', { text: ' — ' + r.description }) : null,
          r.telephone ? h('a', { class: 'tel', href: 'tel:' + String(r.telephone).replace(/[^0-9+]/g, ''), dir: 'ltr', text: r.telephone }) : null,
          r.lien ? h('a', { class: 'tel', href: r.lien, rel: 'noopener noreferrer', target: '_blank', dir: 'ltr', text: r.lien }) : null
        ]);
      })) : null
    ]);
  }
  function ouvrirAide() {
    var d = document.getElementById('dialogue-aide');
    d.replaceChildren(blocSoutien('aide-titre'), h('div', { class: 'nav' }, [h('span'), bouton(T.aide.fermer, 'btn-gris', function () { d.close(); })]));
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
  }

  /* ---------- résultats : anneau, radar, cartes ---------- */
  function anneau(pct, ton, valeur, sous) {
    var r = 52, c = 2 * Math.PI * r;
    pct = Math.max(0.04, Math.min(1, pct));
    return h('div', { class: 'anneau ton-' + ton }, [
      h('div', { html: '<svg viewBox="0 0 120 120" aria-hidden="true"><circle class="anneau-piste" cx="60" cy="60" r="' + r + '"/>' +
        '<circle class="anneau-valeur" cx="60" cy="60" r="' + r + '" transform="rotate(-90 60 60)" style="--c:' + c.toFixed(1) + ';--o:' + (c * (1 - pct)).toFixed(1) + '"/></svg>' }),
      h('div', { class: 'anneau-centre' }, [h('strong', { dir: 'ltr', text: valeur }), h('span', { dir: 'ltr', text: sous })])
    ]);
  }
  function carteEchelle(cle, scores) {
    var e = F.echelles[cle];
    var score = scores[e.score], niv = scores[e.niveau];
    if (vide(score) || vide(niv)) return null;
    var n = e.niveaux[String(niv)]; if (!n) return null;
    return h('article', { class: 'carte carte-resultat ton-' + n.ton }, [
      h('header', { class: 'resultat-tete' }, [
        h('span', { class: 'resultat-icone', 'aria-hidden': 'true', text: e.icone }),
        h('h2', { text: e.titre })
      ]),
      h('div', { class: 'resultat-corps' }, [
        anneau((Number(score) - e.min) / (e.max - e.min), n.ton, String(score), '/ ' + e.max),
        h('div', { class: 'resultat-texte' }, [
          h('span', { class: 'badge ton-' + n.ton, text: n.libelle }),
          e.unite ? h('span', { class: 'resultat-unite', text: e.unite }) : null,
          h('p', { class: 'explication', text: n.explication })
        ])
      ]),
      h('h3', { text: T.resultats.conseils }),
      h('ol', { class: 'conseils' }, n.conseils.map(function (c) { return h('li', { text: c }); })),
      n.consulter ? h('p', { class: 'consulter', text: T.resultats.consulter }) : null
    ]);
  }
  function radar(valeurs, noms) {
    var cx = 150, cy = 140, R0 = 88, n = valeurs.length, s = '<svg viewBox="0 0 300 280" class="radar" role="img" aria-label="' + F.BFI.titre + '">';
    function pt(i, f) { var a = (-90 + i * 360 / n) * Math.PI / 180; return [(cx + Math.cos(a) * R0 * f).toFixed(1), (cy + Math.sin(a) * R0 * f).toFixed(1)]; }
    [0.25, 0.5, 0.75, 1].forEach(function (f) {
      s += '<polygon class="radar-grille" points="' + valeurs.map(function (_, i) { return pt(i, f).join(','); }).join(' ') + '"/>';
    });
    valeurs.forEach(function (_, i) { var p = pt(i, 1); s += '<line class="radar-grille" x1="' + cx + '" y1="' + cy + '" x2="' + p[0] + '" y2="' + p[1] + '"/>'; });
    s += '<polygon class="radar-forme" points="' + valeurs.map(function (v, i) { return pt(i, Math.max(0.06, (v - 1) / 4)).join(','); }).join(' ') + '"/>';
    valeurs.forEach(function (v, i) {
      var p = pt(i, Math.max(0.06, (v - 1) / 4)), l = pt(i, 1.27);
      s += '<circle class="radar-point" cx="' + p[0] + '" cy="' + p[1] + '" r="5"/>';
      s += '<text class="radar-nom" x="' + l[0] + '" y="' + l[1] + '" text-anchor="middle" dominant-baseline="middle" direction="rtl">' + noms[i] + '</text>';
    });
    return s + '</svg>';
  }
  function carteBFI(scores) {
    var b = F.BFI;
    if (vide(scores.SCORE_BFI_E)) return null;
    var cles = Object.keys(b.traits);
    var vals = cles.map(function (d) { return Number(scores['SCORE_BFI_' + d]); });
    var fort = cles[vals.indexOf(Math.max.apply(null, vals))];
    var traits = cles.map(function (d, i) {
      var t = b.traits[d], s = vals[i];
      var desc = s >= 3.5 ? t.haut : (s <= 2.5 ? t.bas : t.moyen);
      return h('div', { class: 'trait' }, [
        h('div', { class: 'trait-tete' }, [h('strong', null, [h('span', { 'aria-hidden': 'true', text: t.icone + ' ' }), t.nom]), h('span', { class: 'trait-score', dir: 'ltr', text: s.toFixed(1) + ' / 5' })]),
        h('div', { class: 'jauge-piste' }, [h('div', { class: 'jauge-valeur', style: 'width:' + Math.round((s - 1) / 4 * 100) + '%' })]),
        h('p', { class: 'trait-niveau', text: b.niveaux[String(scores['NIVEAU_BFI_' + d])] || '' }),
        h('p', { class: 'explication', text: desc }),
        h('details', null, [h('summary', { text: T.resultats.facettes })].concat(b.facettes_par_trait[d].map(function (f) {
          var v = Number(scores['SCORE_BFI_' + f]);
          return h('div', { class: 'facette' }, [
            h('span', { text: b.facettes[f] }),
            h('div', { class: 'jauge-piste' }, [h('div', { class: 'jauge-valeur', style: 'width:' + Math.round((v - 1) / 4 * 100) + '%' })]),
            h('span', { dir: 'ltr', text: v.toFixed(1) })
          ]);
        })))
      ]);
    });
    return h('article', { class: 'carte carte-resultat ton-neutre' }, [
      h('header', { class: 'resultat-tete' }, [h('span', { class: 'resultat-icone', 'aria-hidden': 'true', text: b.icone }), h('h2', { text: b.titre })]),
      h('div', { class: 'radar-boite', html: radar(vals, cles.map(function (d) { return b.traits[d].court; })) }),
      h('p', { class: 'trait-vedette' }, [h('span', { text: b.vedette + ' ' }), h('strong', { text: b.traits[fort].icone + ' ' + b.traits[fort].nom })]),
      h('p', { class: 'explication centre', text: b.introduction })
    ].concat(traits));
  }
  function synthese(scores) {
    var forces = [], attention = [];
    F.ordre.forEach(function (cle) {
      var e = F.echelles[cle]; if (!e || e.prive) return;
      var n = e.niveaux[String(scores[e.niveau])]; if (!n) return;
      if (n.ton === 'bon') forces.push(e.nom_court);
      if (n.ton === 'attention') attention.push(e.nom_court);
    });
    var s = F.synthese, phrases = [];
    if (forces.length) phrases.push(s.forces.replace('{liste}', forces.slice(0, 4).join('، ')));
    phrases.push(attention.length ? s.attention.replace('{liste}', attention.join('، ')) : s.aucune_attention);
    phrases.push(s.conclusion);
    return h('section', { class: 'carte synthese' }, [h('h2', { text: T.resultats.synthese_titre })].concat(phrases.map(function (p) { return h('p', { text: p }); })));
  }
  function pageResultats(res) {
    var t = T.resultats, sc = res.scores;
    function quitter() {
      effacer(sessionStorage, CLE_RES); effacer(localStorage, CLE);
      etat = nouvelEtat(); majSalutation(); pageFin();
    }
    var cartes = F.ordre.map(function (cle) { return cle === 'BFI' ? carteBFI(sc) : carteEchelle(cle, sc); });
    afficher([
      h('div', { class: 'tete-resultats' }, [
        window.Avatar && T.ditto ? h('div', { class: 'ditto-merci' }, [
          h('img', { class: 'ditto-merci-img', src: window.Avatar.src('saute'), alt: '' }),
          h('div', { class: 'ditto-merci-bulle' }, [h('strong', { text: T.ditto.fin_titre }), h('span', { text: T.ditto.fin_texte })])
        ]) : autocollant('🏆', ['🎉', '⭐', '💚'], 'grand'),
        h('h1', { class: 'revelation-titre', text: t.titre }),
        h('p', { class: 'revelation-sur', text: res.prenom ? t.titre_prenom.replace('{prenom}', res.prenom) : t.sous_titre })
      ]),
      h('p', { class: 'avertissement-medical', text: F.avertissement }),
      res.soutien ? blocSoutien() : null,
      synthese(sc),
      h('section', { class: 'carte album-final' }, [
        h('h2', { class: 'album-titre', text: T.album.titre }),
        h('p', { class: 'album-score', text: T.album.final }),
        grilleAlbum(PARTIES.map(function (p) { return p.id; }))
      ])
    ].concat(cartes, [
      h('div', { class: 'actions-resultats' }, [
        bouton(t.telecharger, 'btn-principal', function () { window.print(); }),
        bouton(t.terminer, 'btn-fantome', quitter),
        bouton(t.effacer, 'btn-lien', function () { confirmer(t.effacer_confirmation, quitter); })
      ])
    ]), 'page-resultats');
  }
  function pageFin() {
    var mail = CFG.CONTACT_EMAIL;
    afficher([h('section', { class: 'carte carte-centre' }, [
      autocollant('💚', ['🙏', '🎓', '✨'], 'grand'),
      h('h1', { class: 'titre-degrade', text: T.fin.titre }),
      h('p', { text: T.fin.texte }),
      mail ? h('p', { class: 'aide' }, [T.fin.contact + ' ', h('a', { href: 'mailto:' + mail, dir: 'ltr', text: mail })]) : null
    ])]);
  }

  /* ---------- démarrage ---------- */
  function charger(nom) {
    return fetch('data/' + nom + '.json', { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(nom);
      return r.json();
    });
  }
  Promise.all(['questions', 'textes', 'feedback', 'ressources'].map(charger)).then(function (d) {
    Q = d[0]; T = d[1]; F = d[2]; R = d[3];
    construireEcrans();
    if (window.Voyage3D && !SAISIE) window.Voyage3D.init({ parties: PARTIES, couleur: function (p) { return theme(p).couleur; }, icone: function (p) { return icone(p.id); },
      monde: function (p) { var s = null; Q.sections.forEach(function (x) { if (x.parties.indexOf(p) >= 0) s = x.id; }); return s; } });
    var nom = document.getElementById('marque-nom');
    nom.replaceChildren(T.marque.replace(/\+$/, ''), h('b', { class: 'plus', 'aria-hidden': 'true', text: '+' }));
    document.getElementById('album-bouton-texte').textContent = T.album.bouton;
    document.getElementById('album').addEventListener('click', ouvrirAlbum);
    document.getElementById('carte-bouton-texte').textContent = T.voyage.bouton_carte;
    document.getElementById('btn-carte').addEventListener('click', ouvrirCarte);
    document.getElementById('jeux-bouton-texte').textContent = T.jeux.entete;
    document.getElementById('btn-jeux').addEventListener('click', function () { if (window.Jeux) window.Jeux.ouvrir(T.jeux, function () {}); });
    var lien = document.getElementById('lien-aide');
    lien.textContent = T.aide.lien; lien.addEventListener('click', ouvrirAide);
    var bandeau = document.getElementById('bandeau');
    if (SAISIE) { bandeau.textContent = T.saisie.bandeau; bandeau.hidden = false; }
    else if (!CFG.ENDPOINT_URL) { bandeau.textContent = T.envoi.demo; bandeau.hidden = false; }

    var sauvegarde = lire(localStorage, CLE);
    etat = sauvegarde && sauvegarde.v === 2 && sauvegarde.i < ECRANS.length ? sauvegarde : nouvelEtat();
    etat.dernier = Date.now();
    majSalutation();

    if (SAISIE) {
      if (etat.etape === 'questionnaire' && etat.num_formulaire) rendreQuestionnaire(false); else pageSaisie();
      return;
    }
    var res = lire(sessionStorage, CLE_RES);
    if (res && res.scores) pageResultats(res); else pageAccueil();
  }).catch(function (e) {
    app.replaceChildren(h('p', { class: 'carte', text: 'تعذر تحميل الاستبيان. المرجو إعادة تحميل الصفحة. (' + (e && e.message) + ')' }));
  });
})();
