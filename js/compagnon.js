/* compagnon.js — Dittou voyage sur tout le site.
   Un seul personnage (élément fixe #dittou) qui vole en courbe 3D d'un endroit à l'autre :
   - accueil : au défilement, il quitte le portrait du haut et saute d'une section à l'autre ;
   - questionnaire : il reste près de la carte (sur téléphone il « dépasse » du bas de l'écran),
     sautille à chaque réponse, saute de joie quand la page est finie et va s'asseoir sur « التالي » ;
   - transitions : il traverse l'écran en bondissant pendant que l'ancienne page part en 3D ;
   - résultats : il arrive à côté du score avec une expression adaptée au niveau.
   Compagnon.init(textes) ; Compagnon.page(type) ; Compagnon.masquer(bool) ; Compagnon.traverser() */
(function () {
  'use strict';
  var CALME = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var B = 140, RATIO = 720 / 682;                 // taille de base (px) et rapport hauteur / largeur des images
  var el, corps, img, bulle, TX = {};
  var pos = { x: -300, y: -300, s: 90, o: 0 }, vol = null, mode = 'aucun', cache = false;
  var imgBase = 'salut', imgTemp = null, imgTempFin = 0, section = -1, dernier = 0, minBulle = null, bulleFaite = {};
  var compteRep = 0, complet = false;

  function src(n) { return window.Avatar ? window.Avatar.src(n) : 'assets/bitto/' + n + '.webp'; }
  function mobile() { return innerWidth < 900; }
  function creer() {
    el = document.createElement('div'); el.id = 'dittou'; el.className = 'dt'; el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<div class="dt-corps"><img class="dt-img" alt="" draggable="false"></div><p class="dt-bulle"></p>';
    document.body.appendChild(el);
    corps = el.querySelector('.dt-corps'); img = el.querySelector('.dt-img'); bulle = el.querySelector('.dt-bulle');
    img.src = src('salut');
    ['salut', 'rit', 'surpris', 'coeurs', 'saute', 'bas', 'dos', 'fatigue'].forEach(function (n) { var i = new Image(); i.src = src(n); });
  }
  function image(n, ms) {
    if (ms) { imgTemp = n; imgTempFin = performance.now() + ms; } else imgBase = n;
  }
  var nomFn = function (t) { return t; };
  function parler(txt, ms) {
    txt = nomFn(txt);
    if (!txt || cache) return;
    bulle.textContent = txt; bulle.classList.remove('on'); void bulle.offsetWidth; bulle.classList.add('on');
    clearTimeout(minBulle); minBulle = setTimeout(function () { bulle.classList.remove('on'); }, ms || 2600);
  }
  function rect(sel) { var n = typeof sel === 'string' ? document.querySelector(sel) : sel; return n && n.offsetParent !== null ? n.getBoundingClientRect() : null; }
  function visibleR(r) { return r && r.bottom > 0 && r.top < innerHeight; }

  /* ---------- où doit être Dittou maintenant ? ---------- */
  var SECTIONS = [
    { sel: '.tunnel', cote: 'g', img: 'surpris', cle: 'tunnel' },
    { sel: '.cinetique', cote: 'd', img: 'rit', cle: 'cinetique' },
    { sel: '.comment', cote: 'g', img: 'salut', cle: 'comment' },
    { sel: '.cta', cote: 'cta', img: 'coeurs', cle: 'cta' }
  ];
  function cibleAccueil() {
    var portrait = rect('.viv-cadre .btt-corps');
    if (portrait && portrait.bottom > innerHeight * .3) { section = -1; return { x: portrait.left, y: portrait.top, s: portrait.width, o: 0, img: 'salut' }; }
    var mid = innerHeight * .5, k = 0;
    SECTIONS.forEach(function (sc, i) { var r = rect(sc.sel); if (r && r.top < mid) k = i; });
    var sc = SECTIONS[k], s = mobile() ? 74 : 124, m = mobile() ? 6 : 28, h = s * RATIO;
    if (k !== section) { section = k; var t = (TX.sections || {})[sc.cle]; if (t && !bulleFaite[sc.cle]) { bulleFaite[sc.cle] = 1; setTimeout(function () { parler(t, 3000); }, 650); } }
    if (sc.cote === 'cta') {
      var b = rect('.cta .ac-cta');
      if (visibleR(b)) return { x: Math.max(m, b.left - s - 14), y: b.top + b.height / 2 - h * .62, s: s, o: 1, img: sc.img };
    }
    return { x: sc.cote === 'g' ? m : innerWidth - s - m, y: innerHeight * (mobile() ? .62 : .5) - h / 2, s: s, o: 1, img: sc.img };
  }
  function pageComplete() {
    var qs = [].filter.call(document.querySelectorAll('#app .question'), function (q) { return q.offsetParent !== null || q.classList.contains('repondu'); });
    if (!qs.length) return false;
    return qs.every(function (q) {
      if (q.querySelector('input:checked')) return true;
      return [].some.call(q.querySelectorAll('input[type=number], input[type=text], select'), function (c) { return c.value !== ''; });
    });
  }
  function cibleQuestion() {
    var carte = rect('#app .carte') || rect('#app'), btn = rect('#btn-suivant');
    var s = mobile() ? 64 : 112, h = s * RATIO;
    var ton = (document.querySelector('#app .carte-resultat') || {}).className || '';
    var imgR = mode === 'resultat' ? (/ton-bon/.test(ton) ? 'saute' : /ton-attention/.test(ton) || document.querySelector('#app .soutien') ? 'bas' : 'salut') : (complet ? 'saute' : 'salut');
    var quiz = document.body.classList.contains('mode-quiz');
    if (mobile()) {
      if (quiz) return { x: 4, y: innerHeight - h * .58, s: s, o: 1, img: imgR, peek: true };   // quiz : il reste en bas, sans cacher les réponses
      return { x: 4, y: innerHeight - h * (complet || mode === 'resultat' ? .98 : .58), s: s, o: 1, img: imgR, peek: !complet };
    }
    // position de la carte SANS ses animations (sinon Mochi suit la carte qui glisse, puis revient)
    var c0 = document.querySelector('#app .carte'), ra = document.getElementById('app').getBoundingClientRect();
    var gauche = c0 ? ra.left + c0.offsetLeft : (carte ? carte.left : 30);
    var x = Math.max(8, gauche - s - 22);
    return { x: x, y: innerHeight - h - 36, s: s, o: 1, img: imgR };
  }
  function cible() {
    if (cache || mode === 'aucun' || mode === 'cache') return { x: pos.x, y: pos.y + 40, s: pos.s, o: 0 };
    if (mode === 'accueil') return cibleAccueil();
    if (mode === 'question' || mode === 'resultat') return cibleQuestion();
    if (mode === 'aide') {   // consentement : en bas à gauche, il dépasse du bas de l'écran (ne cache pas les boutons)
      var sa = mobile() ? 64 : 110;
      return { x: 6, y: innerHeight - sa * RATIO * .55, s: sa, o: 1, img: 'salut', peek: true };
    }
    return { x: pos.x, y: pos.y, s: pos.s, o: 0 };
  }

  /* ---------- vol en courbe 3D ---------- */
  function voler(depart, opts) {
    opts = opts || {};
    vol = { t0: performance.now(), dur: opts.dur || Math.min(560, 340 + Math.hypot(pos.x - depart.x, pos.y - depart.y) * .25), de: { x: depart.x, y: depart.y, s: depart.s }, haut: opts.haut, bonds: opts.bonds || 1, tour: opts.tour || 0 };
  }
  function poser(x, y, s, o, rotY, rot, sx, sy) {
    el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0) scale(' + (s / B).toFixed(4) + ')';
    el.style.opacity = o.toFixed(3);
    corps.style.transform = 'perspective(600px) rotateY(' + (rotY || 0).toFixed(1) + 'deg) rotate(' + (rot || 0).toFixed(2) + 'deg) scale(' + (sx || 1).toFixed(3) + ',' + (sy || 1).toFixed(3) + ')';
  }
  function boucle(now) {
    requestAnimationFrame(boucle);
    var dt = Math.min(.05, (now - dernier) / 1000); dernier = now;
    var c = cible();
    var n = imgTemp && now < imgTempFin ? imgTemp : (c.img || imgBase);
    if (img.getAttribute('data-n') !== n) { img.setAttribute('data-n', n); img.src = src(n); }
    el.classList.toggle('peek', !!c.peek && !vol);

    if (vol) {
      var p = Math.min(1, (now - vol.t0) / vol.dur), e = 1 - Math.pow(1 - p, 3);   // part vite, se pose en douceur
      var dx = c.x - vol.de.x, dist = Math.hypot(dx, c.y - vol.de.y);
      var haut = vol.haut !== undefined ? vol.haut : Math.min(110, 30 + dist * .15);
      var saut = vol.bonds > 1 ? Math.abs(Math.sin(p * Math.PI * vol.bonds)) : Math.sin(p * Math.PI);
      pos.x = vol.de.x + dx * e; pos.y = vol.de.y + (c.y - vol.de.y) * e - saut * haut; pos.s = vol.de.s + (c.s - vol.de.s) * e;
      pos.o = Math.min(1, pos.o + dt * 5); if (c.o === 0 && p > .85) pos.o = Math.max(0, (1 - p) / .15);
      var dir = dx < 0 ? -1 : 1, rotY = vol.tour ? p * 360 * vol.tour : dir * 12 * Math.sin(p * Math.PI);
      var ecrase = 0;
      poser(pos.x, pos.y, pos.s, pos.o, rotY, dir * 3 * Math.sin(p * Math.PI), 1, 1 + Math.sin(p * Math.PI) * .03);
      if (p >= 1) { vol = null; if (corps.animate && !CALME) corps.animate([{ transform: 'scale(1.05,.95)' }, { transform: 'none' }], { duration: 220, easing: 'ease-out' }); }
      return;
    }
    var k = CALME ? 1 : 1 - Math.exp(-dt * 14);
    if (!CALME && pos.o > .05 && c.o > 0 && Math.hypot(c.x - pos.x, c.y - pos.y) > 240) { voler(pos); return; }   // grand changement : il s'envole
    pos.x += (c.x - pos.x) * k; pos.y += (c.y - pos.y) * k; pos.s += (c.s - pos.s) * k; pos.o += (c.o - pos.o) * Math.min(1, k * 1.4);
    var flotte = CALME ? 0 : Math.sin(now / 900) * 2;
    poser(pos.x, pos.y + flotte, pos.s, pos.o, 0, 0);
    document.body.classList.toggle('dt-dehors', mode === 'accueil' && section >= 0);
  }

  /* ---------- réactions ---------- */
  function sautille(force) {
    if (CALME || !corps.animate) return;
    var f = force || 1;
    corps.animate([{ transform: 'none' }, { transform: 'translateY(' + (-10 * f) + 'px)' }, { transform: 'none' }], { duration: 300, easing: 'ease-out' });
  }
  function surReponse(ev) {
    if ((mode !== 'question') || !ev.target.closest || !ev.target.closest('#app')) return;
    if (!/radio|checkbox/.test(ev.target.type) && ev.target.tagName !== 'SELECT') return;
    compteRep++;
    if (document.body.classList.contains('mode-quiz')) { image('rit', 400); sautille(.7); return; }   // quiz : petit bond seulement
    var avant = complet; complet = pageComplete();
    if (complet && !avant) {
      image('saute', 1300); sautille(1.8); parler(TX.complet, 2600); if (window.Sons) window.Sons.jouer('succes');
      if (window.FX && !CALME) { var r = el.getBoundingClientRect(); window.FX.eclat(r.left + r.width / 2, r.top + r.height / 3, 14); }
      return;
    }
    image('rit', 650); sautille(1);
    var liste = TX.reponses || [];
    if (liste.length && compteRep % 6 === 0) parler(liste[(compteRep / 6) % liste.length | 0], 2200);
  }

  /* ---------- API ---------- */
  function init(textes) {
    if (el) return; TX = textes || {};
    creer();
    document.addEventListener('change', surReponse, true);
    requestAnimationFrame(function (t) { dernier = t; boucle(t); });
  }
  function page(type) {
    var avant = mode; mode = type;
    if (type === 'aide') { dernierAide = 0; if (avant !== 'aide' && el) voler({ x: -140, y: innerHeight * .8, s: 70 }, { dur: 520, haut: 50 }); }
    if (el && type === 'question' && document.body.classList.contains('mode-quiz')) { if (bulle) bulle.classList.remove('on'); }
    if (!el) return; complet = type === 'question' && !document.body.classList.contains('mode-quiz') ? pageComplete() : false;
    if (type === 'accueil') { section = -1; bulleFaite = {}; }
    if (type === 'resultat') {
      var ton = (document.querySelector('#app .carte-resultat') || {}).className || '';
      var cle = /ton-bon/.test(ton) ? 'bon' : /ton-attention/.test(ton) || document.querySelector('#app .soutien') ? 'attention' : /ton-moyen/.test(ton) ? 'moyen' : 'neutre';
      setTimeout(function () { parler((TX.resultat || {})[cle], 3600); if (window.Sons && cle !== 'attention') window.Sons.jouer('revele'); }, 900);
      if (avant !== 'question' && avant !== 'resultat') voler({ x: -160, y: innerHeight * .4, s: pos.s }, { dur: 480 });
    }
    if (type === 'question' && avant !== 'question' && avant !== 'resultat' && !vol) {
      voler({ x: -140, y: innerHeight * .7, s: mobile() ? 64 : 112 }, { dur: 520, haut: 40 });   // il arrive par la gauche, où il reste
      pos.o = 1;
    }
  }
  function masquer(v) { cache = !!v; if (el) el.classList.toggle('dt-cache', cache); }
  /* l'ancienne page part en 3D pendant que Dittou traverse l'écran en bondissant */
  function traverser() {
    if (!el || CALME) return;
    var app = document.getElementById('app'); if (!app) return;
    var r = app.getBoundingClientRect(), c = app.cloneNode(true);
    c.removeAttribute('id'); c.querySelectorAll('[id]').forEach(function (n) { n.removeAttribute('id'); });
    c.querySelectorAll('input').forEach(function (i) { i.removeAttribute('name'); });
    c.querySelectorAll('canvas').forEach(function (n) { n.remove(); });
    c.classList.add('page-sortante');
    c.style.cssText = 'position:fixed;left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;margin:0;pointer-events:none;z-index:40;transform-origin:0 50%';
    document.body.appendChild(c);
    var a = c.animate([{ transform: 'perspective(1400px) rotateY(0) translateX(0)', opacity: 1 }, { transform: 'perspective(1400px) rotateY(18deg) translateX(-12%)', opacity: 0 }], { duration: 320, easing: 'cubic-bezier(.4,0,.75,.2)', fill: 'forwards' });
    a.onfinish = function () { c.remove(); };
    setTimeout(function () { if (c.parentNode) c.remove(); }, 500);
    sautille(1.2);
    pos.o = 1; image('saute', 1000);
  }
  /* Mochi est cliquable : il propose de l'aide (ouvre le guide) */
  var auClic = null, dernierAide = 0;
  function surClic(f) {
    auClic = f;
    corps.style.pointerEvents = 'auto'; corps.style.cursor = 'pointer';
    corps.addEventListener('click', function () { if (auClic && !cache && mode !== 'accueil') { sautille(1); auClic(); } });
    document.addEventListener('pointerdown', function () { dernierAide = performance.now(); }, true);
    setInterval(function () {   // il propose son aide quand on ne bouge plus depuis un moment
      if (cache || mode !== 'question') return;
      if (performance.now() - dernierAide > (mode === 'aide' ? 1200 : 45000)) { dernierAide = performance.now() + (mode === 'aide' ? 20000 : 0); parler(TX.aide || 'تحتاج مساعدة؟ ضغط عليا 📖', mode === 'aide' ? 9000 : 4500); }
    }, 1500);
  }
  window.Compagnon = { nom: function (f) { nomFn = f; }, surClic: surClic, init: init, page: page, masquer: masquer, traverser: traverser, parler: parler };
})();
