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
      var cy = Math.max(r.top + r.height / 2, Math.min(r.height, innerHeight * .6) / 2 + 70);   // il ne sort pas par le haut de l'écran
      return { x: (r.left + r.width / 2) / innerWidth, y: cy / innerHeight, s: r.width, r: 0, i: 'salut', portrait: true };
    }
    var yPrec = scrollY, vitesse = 0, sonne = 0;
    // le grand Dittou du haut sonne aussi : ondes ajoutées autour du portrait
    var viv = app.querySelector('.viv'), cadre = app.querySelector('.viv-cadre'), ondesP = null;
    if (cadre) { ondesP = document.createElement('div'); ondesP.className = 'tr-ondes-portrait'; ondesP.innerHTML = '<span class="tr-onde g"><i></i><i></i></span><span class="tr-onde d"><i></i><i></i></span>'; cadre.appendChild(ondesP); }
    function sonnerie(t) {   // comme un téléphone : il sonne ~1 s, se tait ~1,4 s, et recommence
      var c = (t % 2400) / 2400; return c < .42 ? Math.min(1, Math.sin(c / .42 * Math.PI) * 1.6) : 0;
    }
    function boucle(t) {
      if (!document.body.contains(app) || !app.classList.contains('page-accueil')) { couche.remove(); removeEventListener('resize', mesurer); document.body.classList.remove('dt-dehors'); return; }
      requestAnimationFrame(boucle);
      var y = scrollY, a = reperes[0], b = reperes[0];
      for (var i = 0; i < reperes.length; i++) { if (reperes[i][0] <= y) { a = reperes[i]; b = reperes[i + 1] || reperes[i]; } }
      if (!a) return;
      var u = b[0] > a[0] ? Math.max(0, Math.min(1, (y - a[0]) / (b[0] - a[0]))) : 0;
      var e = lisse(u), p = scene(a[1]), q = scene(b[1]);
      var enVol = a[1] !== b[1] && u > 0 && u < 1;
      // trajet d'abeille : une courbe qui monte un peu, avec une petite vague
      var x = p.x + (q.x - p.x) * e + (enVol ? Math.sin(u * Math.PI * 2) * .035 : 0);
      var yy = p.y + (q.y - p.y) * e - (enVol ? Math.sin(u * Math.PI) * .12 : 0);
      var s = p.s + (q.s - p.s) * e, r = p.r + (q.r - p.r) * e;
      // sonnerie : forte pendant le vol et quand on fait défiler, s'arrête une fois posé
      vitesse += (Math.abs(y - yPrec) - vitesse) * .25; yPrec = y;
      var cible = Math.max(enVol ? 1 : Math.min(1, vitesse / 25) * .7, sonnerie(t) * .8);
      sonne += (cible - sonne) * .25;
      var vib = CALME ? 0 : sonne, jx = Math.sin(t * .19) * 3.2 * vib, jr = Math.sin(t * .23) * 4.5 * vib;
      var flotte = CALME ? 0 : Math.sin(t / 800) * 5 * (1 - vib);
      // dans le portrait (haut de page) : invisible, le grand Dittou est là
      // sortie du portrait : le petit Dittou apparaît exactement sur le grand pendant que le grand s'efface (fondu enchaîné)
      var op = a[1] === b[1] ? (p.portrait ? 0 : 1) : p.portrait ? lisse(Math.min(1, u / .14)) : q.portrait ? lisse(Math.min(1, (1 - u) / .14)) : 1;
      var nom = enVol ? (u < .5 ? p.i : q.i) : (u < .5 ? p.i : q.i);
      if (enVol && u > .3 && u < .85) nom = 'saute';
      if (enVol && (p.portrait && u <= .3 || q.portrait && u >= .7)) nom = 'salut';
      if (nom !== nomImg) { nomImg = nom; img.src = src(nom); }
      dEl.style.width = s.toFixed(1) + 'px';
      dEl.style.opacity = op;
      dEl.style.transform = 'translate3d(' + (x * innerWidth - s / 2 + jx).toFixed(1) + 'px,' + (yy * innerHeight - s / 2 + flotte).toFixed(1) + 'px,0) rotate(' + (r + jr).toFixed(2) + 'deg)';
      dEl.style.setProperty('--sonne', vib.toFixed(3));
      if (viv) {
        viv.style.opacity = (1 - op).toFixed(3);
        viv.style.transform = vib > .01 ? 'translate(' + jx.toFixed(1) + 'px,0) rotate(' + (jr * .6).toFixed(2) + 'deg)' : '';
      }
      if (ondesP) { ondesP.style.setProperty('--sonne', (vib * (1 - op)).toFixed(3)); }
    }
    requestAnimationFrame(boucle);
  }
  window.Troupe = { monter: monter };
})();
