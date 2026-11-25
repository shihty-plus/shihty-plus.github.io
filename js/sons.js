/* sons.js — effets sonores et musique de fond (fichiers dans assets/sons/, générés par IA).
   - Musique de jeu sur la page d'accueil SEULEMENT : elle tente de démarrer dès l'ouverture ; si le navigateur bloque
     le son sans geste du visiteur (Chrome, Safari…), elle démarre au premier toucher / clic. Elle s'arrête en fondu
     dès que le questionnaire commence. Pas d'autre fond sonore.
   - Deux boutons dans l'en-tête : effets sonores (🔊) et musique (🎵) ; le choix est gardé.
   - Parties sensibles (dépression, anxiété, idées suicidaires) : fond plus bas, seulement le clic discret.
   Sons.jouer(nom, volume) ; Sons.sensible(bool) ; Sons.ambiance('jeu' | 'nature' | null) */
(function () {
  'use strict';
  var DOSSIER = 'assets/sons/';
  var NOMS = ['clic', 'succes', 'whoosh', 'sonnerie', 'rit', 'bonjour', 'surpris', 'aww', 'ronfle', 'hmph', 'baille', 'boing', 'revele', 'recompense', 'porte'];
  var VOL = { clic: .35, succes: .5, whoosh: .3, sonnerie: .32, rit: .55, bonjour: .55, surpris: .5, aww: .5, ronfle: .45, hmph: .5, baille: .5, boing: .22, revele: .45, recompense: .5, porte: .9 };
  var NEUTRES = { clic: 1, whoosh: 1 };          // les seuls sons gardés dans les parties sensibles
  var NIVEAUX = { jeu: .09, nature: .14 }, SENSIBLE = .06;   // fonds très bas
  var ctx = null, bufs = {}, maitre = null, pistes = {}, voulue = null, enSensible = false, derniers = {};
  function lire(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v === '1'; } catch (e) { return d; } }
  function ecrire(k, v) { try { localStorage.setItem(k, v ? '1' : '0'); } catch (e) { /* rien */ } }
  var SAISIE = /[?&]saisie=/.test(location.search);   // saisie des questionnaires papier : silence par défaut
  var effets = lire('shihty-effets', !SAISIE), musique = lire('shihty-musique2', !SAISIE);

  function charger(nom, fichier) {
    return fetch(DOSSIER + fichier + '?v=' + (window.SHIHTY_VERSION || '')).then(function (r) { return r.arrayBuffer(); })
      .then(function (a) { return new Promise(function (ok, ko) { ctx.decodeAudioData(a, ok, ko); }); })
      .then(function (b) { bufs[nom] = b; }).catch(function () { /* son manquant : on continue sans */ });
  }
  function deverrouiller() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); maitre = ctx.createGain(); maitre.connect(ctx.destination);

    Promise.all(NOMS.map(function (n) { return charger(n, n + '.mp3'); })).then(function () { if (enAttente && document.querySelector('.page-accueil')) { var a = enAttente; enAttente = null; jouer(a[0], a[1]); } });
  }
  ['pointerdown', 'pointerup', 'click', 'keydown', 'touchend'].forEach(function (ev) { document.addEventListener(ev, deverrouiller, { capture: true, passive: true }); });

  var enAttente = null;   // un son demandé avant le premier geste (ex. « bonjour » de Dittou) est joué dès que le son est autorisé
  function jouer(nom, vol) {
    if (effets && (!ctx || !bufs[nom]) && (nom === 'bonjour' || nom === 'rit')) enAttente = [nom, vol];
    if (!effets || !ctx || !bufs[nom]) return;
    if (enSensible && !NEUTRES[nom]) return;
    var t = ctx.currentTime;
    if (derniers[nom] && t - derniers[nom] < .05) return;   // pas de rafales
    derniers[nom] = t;
    var s = ctx.createBufferSource(), g = ctx.createGain();
    s.buffer = bufs[nom]; g.gain.value = (VOL[nom] || .5) * (vol === undefined ? 1 : vol) * (enSensible ? .6 : 1);
    s.connect(g); g.connect(maitre); s.start();
  }
  /* musique de fond : page d'accueil seulement (lecteur audio du navigateur, qui peut démarrer sans clic quand le
     navigateur l'autorise) ; elle s'arrête en fondu dès qu'on commence à répondre. */
  var lecteur = null, fondu = null, VOL_JEU = .12;
  function lecteurMusique() {
    if (!lecteur) { lecteur = new Audio('assets/sons/musique.mp3?v=' + (window.SHIHTY_VERSION || '')); lecteur.loop = true; lecteur.preload = 'auto'; lecteur.volume = 0; }
    return lecteur;
  }
  function volVers(cible, ms, fin) {
    clearInterval(fondu); var a = lecteurMusique(), v0 = a.volume, t0 = performance.now();
    fondu = setInterval(function () { var k = Math.min(1, (performance.now() - t0) / ms); a.volume = Math.max(0, Math.min(1, v0 + (cible - v0) * k)); if (k >= 1) { clearInterval(fondu); if (fin) fin(); } }, 40);
  }
  function appliquer() {
    var veut = musique && voulue === 'jeu';
    var a = lecteurMusique();
    if (veut) {
      if (a.paused) {
        var p = a.play();
        if (p && p.then) p.then(function () { attente(false); volVers(VOL_JEU, 1500); }).catch(function () { attente(true); });   // bloqué : on attend le premier geste
        else volVers(VOL_JEU, 1500);
      } else volVers(VOL_JEU, 800);
    } else if (!a.paused) volVers(0, 1200, function () { a.pause(); });
  }
  function attente(v) { var b = document.getElementById('btn-musique'); if (b) b.classList.toggle('attend', v && musique); }
  function ambiance(nom) { if (nom === 'nature') nom = null; if (nom === voulue) return; voulue = nom; appliquer(); }
  function demarrerMusique() { deverrouiller(); }
  function sensible(v) { enSensible = !!v; }
  // au premier geste (si le navigateur avait bloqué), la musique démarre
  ['pointerdown', 'click', 'keydown', 'touchend'].forEach(function (ev) { document.addEventListener(ev, function () { if (musique && voulue === 'jeu' && lecteur && lecteur.paused) appliquer(); }, { capture: true, passive: true }); });

  /* ---------- boutons de l'en-tête ---------- */
  var SVG = {
    effetsOn: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a4.5 4.5 0 0 1 0 7M18.5 6a8 8 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    effetsOff: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 9l6 6M22 9l-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    musique: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 17V5l11-2v12" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="6.5" cy="17.5" r="2.8" fill="currentColor"/><circle cx="17.5" cy="15" r="2.8" fill="currentColor"/></svg>'
  };
  function boutons() {
    var zone = document.querySelector('.entete-droite'); if (!zone || document.getElementById('btn-effets')) return;
    var be = document.createElement('button'), bm = document.createElement('button');
    be.type = bm.type = 'button'; be.id = 'btn-effets'; bm.id = 'btn-musique';
    be.className = bm.className = 'album-btn son-btn';
    function maj() {
      be.innerHTML = effets ? SVG.effetsOn : SVG.effetsOff; be.setAttribute('aria-pressed', effets); be.setAttribute('aria-label', effets ? 'إيقاف المؤثرات الصوتية' : 'تشغيل المؤثرات الصوتية');
      bm.innerHTML = SVG.musique; bm.classList.toggle('off', !musique); bm.setAttribute('aria-pressed', musique); bm.setAttribute('aria-label', musique ? 'إيقاف الموسيقى' : 'تشغيل الموسيقى');
      be.classList.toggle('off', !effets);
    }
    be.addEventListener('click', function () { effets = !effets; ecrire('shihty-effets', effets); maj(); jouer('clic'); });
    bm.addEventListener('click', function () {
      musique = !musique; ecrire('shihty-musique2', musique); maj(); deverrouiller();
      appliquer();
    });
    zone.insertBefore(bm, zone.firstChild); zone.insertBefore(be, zone.firstChild); maj();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boutons); else boutons();

  /* ---------- sons automatiques ---------- */
  // clic sur une réponse
  document.addEventListener('change', function (ev) {
    var t = ev.target; if (!t.closest || !t.closest('#app')) return;
    if (t.type === 'radio' || t.type === 'checkbox' || t.tagName === 'SELECT') jouer('clic');
  }, true);
  // boutons principaux (suivant, commencer…) : petit whoosh
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('#btn-suivant, .btn-principal, .carte-btn, .rep-resume');
    if (b) jouer(b.classList.contains('rep-resume') ? 'clic' : 'whoosh');
  }, true);

  window.Sons = { jouer: jouer, sensible: sensible, demarrerMusique: demarrerMusique, ambiance: ambiance,
    etat: function () { return { ctx: ctx && ctx.state, charges: Object.keys(bufs).length, fond: voulue, musiqueJoue: !!lecteur && !lecteur.paused, volMusique: lecteur && +lecteur.volume.toFixed(3), sensible: enSensible, effets: effets }; } };
})();
