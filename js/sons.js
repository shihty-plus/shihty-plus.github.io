/* sons.js — effets sonores et ambiance de nature (fichiers dans assets/sons/, générés par IA ; aucun instrument).
   - Rien ne joue avant le premier geste du visiteur (règle des navigateurs).
   - Deux boutons dans l'en-tête : effets sonores (🔊) et ambiance nature (🍃) ; le choix est gardé.
   - Ambiance : ruisseau + léger vent + chants d'oiseaux de temps en temps, sans instrument ; démarre avec « ابدأ الرحلة », très bas.
   - Parties sensibles (dépression, anxiété, idées suicidaires) : ambiance plus basse, sans oiseaux, seulement le clic discret.
   Sons.jouer(nom, volume) ; Sons.sensible(bool) ; Sons.demarrerMusique() */
(function () {
  'use strict';
  var DOSSIER = 'assets/sons/';
  var NOMS = ['clic', 'succes', 'whoosh', 'sonnerie', 'rit', 'bonjour', 'surpris', 'aww', 'ronfle', 'hmph', 'baille', 'boing', 'revele', 'recompense', 'porte'];
  var VOL = { clic: .35, succes: .5, whoosh: .3, sonnerie: .32, rit: .55, bonjour: .55, surpris: .5, aww: .5, ronfle: .45, hmph: .5, baille: .5, boing: .22, revele: .45, recompense: .5, porte: .45 };
  var NEUTRES = { clic: 1, whoosh: 1 };          // les seuls sons gardés dans les parties sensibles
  var MUSIQUE = .14, MUSIQUE_SENSIBLE = .06;   // ambiance très basse
  var ctx = null, bufs = {}, maitre = null, gainMus = null, srcMus = null, enSensible = false, derniers = {};
  function lire(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v === '1'; } catch (e) { return d; } }
  function ecrire(k, v) { try { localStorage.setItem(k, v ? '1' : '0'); } catch (e) { /* rien */ } }
  var SAISIE = /[?&]saisie=/.test(location.search);   // saisie des questionnaires papier : silence par défaut
  var effets = lire('shihty-effets', !SAISIE), musique = lire('shihty-nature', !SAISIE), musiqueVoulue = false;

  function charger(nom, fichier) {
    return fetch(DOSSIER + fichier).then(function (r) { return r.arrayBuffer(); })
      .then(function (a) { return new Promise(function (ok, ko) { ctx.decodeAudioData(a, ok, ko); }); })
      .then(function (b) { bufs[nom] = b; }).catch(function () { /* son manquant : on continue sans */ });
  }
  function deverrouiller() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); maitre = ctx.createGain(); maitre.connect(ctx.destination);
    gainMus = ctx.createGain(); gainMus.gain.value = 0; gainMus.connect(maitre);
    charger('nature', 'nature.mp3').then(function () { if (musiqueVoulue) lancerMusique(); });
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
  /* ambiance de nature (assets/sons/nature.mp3, générée par IA : ruisseau, oiseaux, vent ; aucun instrument), en boucle */
  function lancerMusique() {
    if (!ctx || srcMus || !musique || !bufs.nature) return;
    srcMus = ctx.createBufferSource(); srcMus.buffer = bufs.nature; srcMus.loop = true;
    srcMus.loopStart = .03; srcMus.loopEnd = bufs.nature.duration - .03;
    srcMus.connect(gainMus); srcMus.start(0, .03);
    volumeMusique(3);
  }
  function volumeMusique(duree) {
    if (!gainMus) return;
    var t = ctx.currentTime, v = musique && srcMus ? (enSensible ? MUSIQUE_SENSIBLE : MUSIQUE) : 0;
    gainMus.gain.cancelScheduledValues(t); gainMus.gain.setValueAtTime(gainMus.gain.value, t);
    gainMus.gain.linearRampToValueAtTime(v, t + (duree || 1));
  }
  function demarrerMusique() { musiqueVoulue = true; deverrouiller(); lancerMusique(); }
  function sensible(v) { v = !!v; if (v === enSensible) return; enSensible = v; if (ctx) volumeMusique(1.5); }

  /* ---------- boutons de l'en-tête ---------- */
  var SVG = {
    effetsOn: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a4.5 4.5 0 0 1 0 7M18.5 6a8 8 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    effetsOff: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 9l6 6M22 9l-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    musique: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M5 19C5 10 11 4 20 4c0 9-6 15-15 15z" fill="currentColor"/><path d="M5 19c4-5 7-8 11-11" fill="none" stroke="#0B3B3A" stroke-width="1.6" stroke-linecap="round"/></svg>'
  };
  function boutons() {
    var zone = document.querySelector('.entete-droite'); if (!zone || document.getElementById('btn-effets')) return;
    var be = document.createElement('button'), bm = document.createElement('button');
    be.type = bm.type = 'button'; be.id = 'btn-effets'; bm.id = 'btn-musique';
    be.className = bm.className = 'album-btn son-btn';
    function maj() {
      be.innerHTML = effets ? SVG.effetsOn : SVG.effetsOff; be.setAttribute('aria-pressed', effets); be.setAttribute('aria-label', effets ? 'إيقاف المؤثرات الصوتية' : 'تشغيل المؤثرات الصوتية');
      bm.innerHTML = SVG.musique; bm.classList.toggle('off', !musique); bm.setAttribute('aria-pressed', musique); bm.setAttribute('aria-label', musique ? 'إيقاف أصوات الطبيعة' : 'تشغيل أصوات الطبيعة');
      be.classList.toggle('off', !effets);
    }
    be.addEventListener('click', function () { effets = !effets; ecrire('shihty-effets', effets); maj(); jouer('clic'); });
    bm.addEventListener('click', function () {
      musique = !musique; ecrire('shihty-nature', musique); maj(); deverrouiller();
      if (musique) { musiqueVoulue = true; if (!srcMus) lancerMusique(); }
      volumeMusique(.6);
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

  window.Sons = { jouer: jouer, sensible: sensible, demarrerMusique: demarrerMusique,
    etat: function () { return { ctx: ctx && ctx.state, charges: Object.keys(bufs).length, musique: !!srcMus, volMusique: gainMus && gainMus.gain.value, sensible: enSensible, effets: effets }; } };
})();
