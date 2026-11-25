/* troupe.js — accueil : Dittou « sonne » et vole d'une section à l'autre au défilement (comme une abeille).
   Un seul Dittou. En haut, c'est le grand portrait. Quand on descend, il sort du portrait et vole, guidé
   exactement par le défilement, vers sa place dans chaque section. Pendant le vol il SONNE : il vibre comme
   un téléphone qui reçoit un appel, avec des ondes de sonnerie de chaque côté. Arrivé, il se pose en douceur.
   En remontant, il refait le chemin à l'envers et revient dans le portrait.
   Troupe.monter(app) — s'arrête tout seul quand l'accueil quitte la page. */
(function () {
  'use strict';
  var CALME = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* x, y : centre en fraction de l'écran ; s : taille (px) ; r : rotation (°) ; i : image ; null = dans le portrait */
  var SCENES_BUREAU = {
    hero: null,
    tunnel: { x: .84, y: .7, s: 170, r: 8, i: 'surpris' },
    cinetique: { x: .11, y: .52, s: 190, r: -8, i: 'rit' },
    comment: { x: .9, y: .26, s: 150, r: 6, i: 'salut' },
    cta: { x: .1, y: .64, s: 160, r: -6, i: 'coeurs' }
  };
  var SCENES_MOBILE = {
    hero: null,
    tunnel: { x: .78, y: .8, s: 112, r: 8, i: 'surpris' },
    cinetique: { x: .2, y: .84, s: 120, r: -8, i: 'rit' },
    comment: { x: .84, y: .12, s: 92, r: 6, i: 'salut' },
    cta: { x: .2, y: .86, s: 104, r: -6, i: 'coeurs' }
  };
  var ORDRE = [['hero', '.ac-hero'], ['tunnel', '.tunnel'], ['cinetique', '.cinetique'], ['comment', '.comment'], ['cta', '.cta']];

  function src(n) { return window.Avatar ? window.Avatar.src(n) : 'assets/bitto/' + n + '.webp'; }
  function lisse(t) { return t * t * (3 - 2 * t); }

  function monter(app) {
    var ancien = document.querySelector('.troupe'); if (ancien) ancien.remove();
    var mob = innerWidth < 760, SC = mob ? SCENES_MOBILE : SCENES_BUREAU;
    var couche = document.createElement('div'); couche.className = 'troupe'; couche.setAttribute('aria-hidden', 'true');
    couche.innerHTML = '<div class="tr-d"><span class="tr-onde g"><i></i><i></i></span><img alt="" draggable="false"><span class="tr-onde d"><i></i><i></i></span></div>';
    document.body.appendChild(couche);
    var dEl = couche.querySelector('.tr-d'), img = dEl.querySelector('img'), nomImg = 'salut';
    img.src = src('salut');
    ['surpris', 'rit', 'coeurs', 'saute'].forEach(function (n) { var i = new Image(); i.src = src(n); });

    var reperes = [];
    function mesurer() {
      reperes = [];
      ORDRE.forEach(function (o, i) {
        var s = app.querySelector(o[1]); if (!s) return;
        var haut = s.getBoundingClientRect().top + scrollY;
        if (i === 0) { reperes.push([0, o[0]]); return; }
        reperes.push([haut - innerHeight * (i === 1 ? -.35 : .4), o[0]]);   // sortie du haut : étalée jusqu'à l'entrée dans le tunnel
        if (s.offsetHeight > innerHeight * 1.6) reperes.push([haut + s.offsetHeight - innerHeight * 1.2, o[0]]);   // le tunnel : il reste posé pendant tout le tunnel
      });
    }
    mesurer(); setTimeout(mesurer, 800); setTimeout(mesurer, 2500);
    addEventListener('resize', mesurer);

    function scene(nom) {
      var sc = SC[nom];
      if (sc) return sc;
      var r = (document.querySelector('.viv-cadre .btt-corps') || {}).getBoundingClientRect ? document.querySelector('.viv-cadre .btt-corps').getBoundingClientRect() : null;
      if (!r) return { x: .5, y: -.3, s: 120, r: 0, i: 'salut', portrait: true };
      var cy = Math.max(r.top + r.height / 2, Math.min(r.height, innerHeight * .6) / 2 + 140);   // place pour la barre de réactions au-dessus   // il ne sort pas par le haut de l'écran
      return { x: (r.left + r.width / 2) / innerWidth, y: cy / innerHeight, s: r.width, r: 0, i: 'salut', portrait: true };
    }
    var yPrec = scrollY, vitesse = 0, sonne = 0, segSon = null;
    // une réaction choisie pendant qu'il s'envole change aussi l'expression du petit Dittou
    var imgReac = null, finReac = 0, EXPR_REAC = ['rit', 'coeurs', 'surpris', 'saute', 'fatigue', 'dort', 'agace'];
    app.addEventListener('click', function (ev) { var b = ev.target.closest && ev.target.closest('.btt-r'); if (b) { imgReac = EXPR_REAC[+b.getAttribute('data-i')]; finReac = performance.now() + 2200; } });
    // le grand Dittou du haut sonne aussi : ondes ajoutées autour du portrait
    var viv = app.querySelector('.viv'), cadre = app.querySelector('.viv-cadre'), ondesP = null;
    if (cadre) { ondesP = document.createElement('div'); ondesP.className = 'tr-ondes-portrait'; ondesP.innerHTML = '<span class="tr-onde g"><i></i><i></i></span><span class="tr-onde d"><i></i><i></i></span>'; cadre.appendChild(ondesP); }
    var sonneFort = -1e9, PERIODE = 30000, DUREE = 1600, debutSonnerie = performance.now() + 4000, sonneeJouee = -1;
    function sonnerie(t) {   // comme un téléphone : de temps en temps (toutes les 30 s), il sonne ~1,6 s, AVEC le son
      var k = Math.floor((t - debutSonnerie) / PERIODE), c = (t - debutSonnerie) - k * PERIODE;
      if (t < debutSonnerie || c > DUREE) return 0;
      if (k !== sonneeJouee) {
        var pret = window.Sons && window.Sons.etat && window.Sons.etat().ctx === 'running' && !document.querySelector('.demarrage');
        if (!pret) { debutSonnerie = t + 3000; return 0; }   // le son n'est pas encore autorisé : il sonnera 3 s après l'entrée
        sonneeJouee = k; window.Sons.jouer('sonnerie'); setTimeout(function () { window.Sons.jouer('sonnerie'); }, 800);   // « dring dring »
        sonneFort = t;   // vibration bien visible pendant la sonnerie
        try { if (navigator.vibrate && window.Sons.etat().effets) navigator.vibrate([220, 120, 220, 120, 220]); } catch (e) { /* téléphone sans vibreur */ }   // le téléphone de l'étudiant vibre aussi (Android)
      }
      return Math.min(1, Math.sin(c / DUREE * Math.PI) * 1.6);
    }
    var corpsP = app.querySelector('.viv .btt-in'), survol = false;
    if (viv) { viv.addEventListener('pointerenter', function () { survol = true; }); viv.addEventListener('pointerleave', function () { survol = false; }); }
    function boucle(t) {
      if (!document.body.contains(app) || !app.classList.contains('page-accueil')) { couche.remove(); removeEventListener('resize', mesurer); document.body.classList.remove('dt-dehors'); return; }
      requestAnimationFrame(boucle);
      var y = scrollY, a = reperes[0], b = reperes[0];
      for (var i = 0; i < reperes.length; i++) { if (reperes[i][0] <= y) { a = reperes[i]; b = reperes[i + 1] || reperes[i]; } }
      if (!a) return;
      var u = b[0] > a[0] ? Math.max(0, Math.min(1, (y - a[0]) / (b[0] - a[0]))) : 0;
      var e = lisse(u), p = scene(a[1]), q = scene(b[1]);
      var enVol = a[1] !== b[1] && u > 0 && u < 1;
      if (enVol && segSon !== a[0]) { segSon = a[0]; }   // il vibre en s'envolant, sans son (le son seulement toutes les 30 s)
      if (!enVol) segSon = null;
      // trajet d'abeille : une courbe qui monte un peu, avec une petite vague
      var x = p.x + (q.x - p.x) * e + (enVol ? Math.sin(u * Math.PI * 2) * .035 : 0);
      var yy = p.y + (q.y - p.y) * e - (enVol ? Math.sin(u * Math.PI) * .12 : 0);
      var s = p.s + (q.s - p.s) * e, r = p.r + (q.r - p.r) * e;
      // sonnerie : forte pendant le vol et quand on fait défiler, s'arrête une fois posé
      vitesse += (Math.abs(y - yPrec) - vitesse) * .25; yPrec = y;
      var cible = Math.max(enVol ? 1 : 0, sonnerie(t) * .8);   // il vibre seulement quand il sonne (et pendant son vol) : au repos, on peut essayer les réactions
      sonne += (cible - sonne) * .25;
      var fort = t - sonneFort < DUREE ? 2.2 : 1;   // pendant la sonnerie des 30 s, il vibre beaucoup plus fort
      var vib = CALME ? 0 : sonne, jx = Math.sin(t * .19) * 3.2 * vib * fort, jr = Math.sin(t * .23) * 4.5 * vib * fort;
      var flotte = CALME ? 0 : Math.sin(t / 800) * 5 * (1 - vib);
      // dans le portrait (haut de page) : invisible, le grand Dittou est là
      // sortie du portrait : le petit Dittou apparaît exactement sur le grand pendant que le grand s'efface (fondu enchaîné)
      var op = a[1] === b[1] ? (p.portrait ? 0 : 1) : p.portrait ? lisse(Math.min(1, u / .14)) : q.portrait ? lisse(Math.min(1, (1 - u) / .14)) : 1;
      var nom = enVol ? (u < .5 ? p.i : q.i) : (u < .5 ? p.i : q.i);
      if (enVol && u > .3 && u < .85) nom = 'saute';
      if (enVol && (p.portrait && u <= .3 || q.portrait && u >= .7)) nom = 'salut';
      if (imgReac && t < finReac) nom = imgReac;
      if (nom !== nomImg) { nomImg = nom; img.src = src(nom); }
      dEl.style.width = s.toFixed(1) + 'px';
      dEl.style.opacity = op;
      dEl.style.transform = 'translate3d(' + (x * innerWidth - s / 2 + jx).toFixed(1) + 'px,' + (yy * innerHeight - s / 2 + flotte).toFixed(1) + 'px,0) rotate(' + (r + jr).toFixed(2) + 'deg)';
      dEl.style.setProperty('--sonne', vib.toFixed(3));
      if (viv) {
        // seul Dittou s'efface quand il s'envole : la barre de réactions reste à sa place et défile avec la page
        viv.querySelectorAll('.btt-corps, .btt-ombre, .btt-bulle').forEach(function (n) { n.style.opacity = (1 - op).toFixed(3); });
        // la barre de réactions reste accrochée sous l'en-tête tant que le haut de la page est visible
        var reac = viv.querySelector('.btt-reac');
        if (reac && cadre) {
          var rc = cadre.getBoundingClientRect(), naturel = rc.top + reac.offsetTop, haut = (document.querySelector('.entete') || { offsetHeight: 64 }).offsetHeight + 10;
          var cx = rc.left + rc.width / 2, dx = 0, dy = Math.max(0, haut - naturel);
          if (op > .02) {   // Dittou s'envole : la barre reste juste au-dessus de sa tête
            var fx = x * innerWidth, fy = yy * innerHeight - s / 2 - reac.offsetHeight - 10;
            var w = Math.min(1, op * 8); dx = (fx - cx) * w; dy = (Math.max(haut, fy) - naturel) * w + dy * (1 - w);
          }
          reac.style.translate = dx || dy ? 'calc(-50% + ' + dx.toFixed(1) + 'px) ' + dy.toFixed(1) + 'px' : '';
          reac.style.opacity = Math.max(0, Math.min(1, (rc.bottom - 140) / 160)).toFixed(3);
          reac.style.pointerEvents = rc.bottom < 180 ? 'none' : '';
        }
        // seul le corps de Dittou vibre (les réactions restent immobiles) ; il se calme quand on le survole pour réagir
        var vp = survol ? 0 : vib;
        if (!corpsP) corpsP = app.querySelector('.viv .btt-in');
        if (corpsP) { corpsP.style.translate = vp > .01 ? (jx * vp / Math.max(vib, .01)).toFixed(1) + 'px 0' : ''; corpsP.style.rotate = vp > .01 ? (jr * .6).toFixed(2) + 'deg' : ''; }
      }
      if (ondesP) { ondesP.style.setProperty('--sonne', ((survol ? 0 : vib) * (1 - op)).toFixed(3)); }
    }
    requestAnimationFrame(boucle);
  }
  window.Troupe = { monter: monter };
})();
