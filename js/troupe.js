/* troupe.js — accueil : une petite troupe de Dittou qui change de place au défilement (effet « Morphose »).
   Chaque section de l'accueil est une « scène » : place, taille, rotation, profondeur et expression de chaque Dittou.
   Entre deux scènes, chaque Dittou glisse de l'une à l'autre en suivant exactement le défilement (et revient en remontant).
   Profondeur : au fond = plus petit, flou, plus pâle ; devant = grand et net.
   Troupe.monter(app) — s'arrête tout seul quand l'accueil quitte la page. */
(function () {
  'use strict';
  var CALME = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* x, y : centre en fraction de l'écran ; s : taille (px pour un écran de 1280) ; r : rotation (°) ; z : profondeur 0 (fond) → 1 (devant) ; i : image */
  var SCENES_BUREAU = {
    hero: [
      { x: .04, y: .5, s: 60, r: -12, z: .45, i: 'rit' }, { x: .97, y: .86, s: 74, r: 10, z: .7, i: 'coeurs' },
      { x: .05, y: .86, s: 62, r: -8, z: .35, i: 'surpris' }, { x: .56, y: .9, s: 48, r: 6, z: .2, i: 'saute' },
      { x: .97, y: .2, s: 46, r: 14, z: .15, i: 'dort' }],
    tunnel: [
      { x: .1, y: .2, s: 52, r: -24, z: .3, i: 'surpris' }, { x: .9, y: .26, s: 60, r: 22, z: .45, i: 'surpris' },
      { x: .13, y: .8, s: 66, r: 18, z: .55, i: 'fatigue' }, { x: .87, y: .78, s: 44, r: -20, z: .2, i: 'bas' },
      { x: .5, y: .1, s: 34, r: 0, z: .05, i: 'dort' }],
    cinetique: [
      { x: .07, y: .5, s: 118, r: -6, z: 1, i: 'rit' }, { x: .93, y: .3, s: 96, r: 8, z: .85, i: 'rit' },
      { x: .88, y: .84, s: 54, r: -10, z: .3, i: 'surpris' }, { x: .18, y: .14, s: 44, r: 12, z: .2, i: 'agace' },
      { x: .6, y: .92, s: 46, r: 4, z: .25, i: 'coeurs' }],
    comment: [
      { x: .07, y: .3, s: 70, r: -4, z: .8, i: 'salut' }, { x: .93, y: .3, s: 70, r: 4, z: .8, i: 'salut' },
      { x: .05, y: .72, s: 56, r: 6, z: .5, i: 'rit' }, { x: .95, y: .72, s: 56, r: -6, z: .5, i: 'coeurs' },
      { x: .5, y: .95, s: 40, r: 0, z: .2, i: 'saute' }],
    cta: [
      { x: .1, y: .5, s: 100, r: -8, z: .95, i: 'coeurs' }, { x: .9, y: .5, s: 100, r: 8, z: .95, i: 'saute' },
      { x: .2, y: .86, s: 62, r: 6, z: .6, i: 'rit' }, { x: .8, y: .86, s: 62, r: -6, z: .6, i: 'salut' },
      { x: .9, y: .16, s: 50, r: 10, z: .4, i: 'surpris' }]
  };
  var SCENES_MOBILE = {
    hero: [{ x: .1, y: .9, s: 52, r: 12, z: .6, i: 'rit' }, { x: .9, y: .88, s: 48, r: -10, z: .45, i: 'surpris' }, { x: .5, y: 1.02, s: 40, r: 8, z: .2, i: 'coeurs' }],
    tunnel: [{ x: .12, y: .18, s: 48, r: -22, z: .35, i: 'surpris' }, { x: .88, y: .8, s: 54, r: 20, z: .5, i: 'fatigue' }, { x: .86, y: .16, s: 34, r: 14, z: .1, i: 'dort' }],
    cinetique: [{ x: .14, y: .84, s: 80, r: -6, z: 1, i: 'rit' }, { x: .86, y: .14, s: 62, r: 8, z: .7, i: 'rit' }, { x: .84, y: .88, s: 40, r: -8, z: .2, i: 'agace' }],
    comment: [{ x: .1, y: .09, s: 46, r: -6, z: .6, i: 'salut' }, { x: .9, y: .09, s: 46, r: 6, z: .6, i: 'coeurs' }, { x: .92, y: .9, s: 38, r: 0, z: .3, i: 'saute' }],
    cta: [{ x: .12, y: .86, s: 62, r: -8, z: .95, i: 'coeurs' }, { x: .88, y: .86, s: 62, r: 8, z: .95, i: 'saute' }, { x: .88, y: .14, s: 40, r: 0, z: .4, i: 'surpris' }]
  };
  var ORDRE = [['hero', '.ac-hero'], ['tunnel', '.tunnel'], ['cinetique', '.cinetique'], ['comment', '.comment'], ['cta', '.cta']];

  function src(n) { return window.Avatar ? window.Avatar.src(n) : 'assets/bitto/' + n + '.webp'; }
  function lisse(t) { return t * t * (3 - 2 * t); }

  function monter(app) {
    var ancien = document.querySelector('.troupe'); if (ancien) ancien.remove();
    var mob = innerWidth < 760, SC = mob ? SCENES_MOBILE : SCENES_BUREAU, n = SC.hero.length;
    var couche = document.createElement('div'); couche.className = 'troupe'; couche.setAttribute('aria-hidden', 'true');
    var d = [];
    for (var k = 0; k < n; k++) {
      var e = document.createElement('div'); e.className = 'tr-d';
      var im = document.createElement('img'); im.alt = ''; im.draggable = false; im.src = src(SC.hero[k].i);
      e.appendChild(im); couche.appendChild(e); d.push({ el: e, img: im, n: SC.hero[k].i, ph: Math.random() * 6 });
    }
    document.body.appendChild(couche);
    var reperes = [];
    function mesurer() {
      reperes = [];
      ORDRE.forEach(function (o, i) {
        var s = app.querySelector(o[1]); if (!s) return;
        var haut = s.getBoundingClientRect().top + scrollY;
        if (i === 0) { reperes.push([0, o[0]]); return; }
        reperes.push([haut - innerHeight * .45, o[0]]);
        if (s.offsetHeight > innerHeight * 1.6) reperes.push([haut + s.offsetHeight - innerHeight * 1.2, o[0]]);   // le tunnel : la scène tient pendant tout le tunnel
      });
    }
    mesurer(); setTimeout(mesurer, 800); setTimeout(mesurer, 2500);
    addEventListener('resize', mesurer);
    var echelle = Math.min(1.15, Math.max(.75, innerWidth / 1280));
    function boucle(t) {
      if (!document.body.contains(app) || !app.classList.contains('page-accueil')) { couche.remove(); removeEventListener('resize', mesurer); return; }
      requestAnimationFrame(boucle);
      var y = scrollY, a = reperes[0], b = reperes[0];
      for (var i = 0; i < reperes.length; i++) { if (reperes[i][0] <= y) { a = reperes[i]; b = reperes[i + 1] || reperes[i]; } }
      var u = b[0] > a[0] ? Math.max(0, Math.min(1, (y - a[0]) / (b[0] - a[0]))) : 0, e2 = lisse(u);
      var A = SC[a[1]], Bs = SC[b[1]];
      d.forEach(function (o, k) {
        var p = A[k], q = Bs[k];
        var x = p.x + (q.x - p.x) * e2, yy = p.y + (q.y - p.y) * e2, s = (p.s + (q.s - p.s) * e2) * (mob ? 1.3 : echelle * 1.65);
        var r = p.r + (q.r - p.r) * e2, z = p.z + (q.z - p.z) * e2;
        // en plein milieu du passage, il tourne un peu sur lui-même (effet 3D)
        var tour = Math.sin(u * Math.PI) * (k % 2 ? -1 : 1) * 40;
        var flotte = CALME ? 0 : Math.sin(t / 900 + o.ph) * (4 + z * 4);
        var nom = e2 < .5 ? p.i : q.i;
        if (nom !== o.n) { o.n = nom; o.img.src = src(nom); }
        o.el.style.transform = 'translate3d(' + (x * innerWidth - s / 2).toFixed(1) + 'px,' + (yy * innerHeight - s / 2 + flotte).toFixed(1) + 'px,0) perspective(500px) rotateY(' + tour.toFixed(1) + 'deg) rotate(' + r.toFixed(1) + 'deg)';
        o.el.style.width = s.toFixed(1) + 'px';
        o.el.style.filter = 'blur(' + ((1 - z) * .9).toFixed(2) + 'px) drop-shadow(0 ' + (6 + z * 10).toFixed(0) + 'px ' + (8 + z * 12).toFixed(0) + 'px rgba(0,0,0,.3))';
        o.el.style.opacity = (.82 + z * .18).toFixed(2);
        o.el.style.zIndex = String(Math.round(z * 10));
      });
    }
    requestAnimationFrame(boucle);
  }
  window.Troupe = { monter: monter };
})();
