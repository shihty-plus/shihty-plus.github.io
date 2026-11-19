/* monde.js — la sphère 3D qui sert de monde au questionnaire.
   20 tuiles = 20 parties (+ tuiles décoratives). Entre deux parties, la sphère tourne vers la tuile
   de la partie suivante, puis on « plonge » dedans. Pendant les questions, elle reste en fond, floue.
   Monde.init(parties, iconeDe, couleurDe, decoDe) ; Monde.station(k, faites, revenir) ; Monde.plonger(fini) ;
   Monde.fond() ; Monde.cacher() */
(function () {
  'use strict';
  var CALME = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var N = 60, PAS = 3;   // la partie k occupe la tuile k*3 ; les autres tuiles sont décoratives
  var racine, scene, rotor, tuiles = [], parties = [], ax = -.25, ay = 0, cible = null, mode = 'cache', dernier = 0, R = 220;

  function init(listeParties, iconeDe, couleurDe, decoDe) {
    if (racine) return;
    parties = listeParties;
    racine = document.createElement('div'); racine.id = 'monde'; racine.className = 'univers cache'; racine.setAttribute('aria-hidden', 'true');
    scene = document.createElement('div'); scene.className = 'monde-scene';
    rotor = document.createElement('div'); rotor.className = 'monde-rotor';
    var deco = [];
    parties.forEach(function (p) { deco = deco.concat(decoDe(p)); });
    for (var i = 0; i < N; i++) {
      var y = 1 - 2 * (i + .5) / N, lat = Math.asin(y), lon = i * 2.39996;
      var t = document.createElement('div'), k = i % PAS === 0 ? i / PAS : -1;
      t.className = 'monde-tuile' + (k >= 0 && k < parties.length ? ' partie' : ' deco');
      t.style.transform = 'rotateY(' + lon.toFixed(4) + 'rad) rotateX(' + lat.toFixed(4) + 'rad) translateZ(var(--R))';
      var e = document.createElement('span'); e.className = 'sph-em';
      if (k >= 0 && k < parties.length) {
        t.style.setProperty('--c', couleurDe(parties[k]));
        e.textContent = iconeDe(parties[k]);
        var num = document.createElement('b'); num.className = 'monde-num'; num.textContent = String(k + 1);
        t.appendChild(e); t.appendChild(num);
        tuiles[k] = { el: t, lat: lat, lon: lon };
      } else {
        e.textContent = deco[i % deco.length] || '✨';
        t.appendChild(e);
      }
      rotor.appendChild(t);
    }
    scene.appendChild(rotor); racine.appendChild(scene);
    document.body.insertBefore(racine, document.body.firstChild);
    taille(); window.addEventListener('resize', taille);
    requestAnimationFrame(boucle);
  }
  function taille() {
    R = Math.round(Math.max(150, Math.min(300, Math.min(window.innerWidth, window.innerHeight) * .36)));
    racine.style.setProperty('--R', R + 'px');
  }
  function angle(a) { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; }
  function boucle(t) {
    requestAnimationFrame(boucle);
    var dt = Math.min(64, t - (dernier || t)); dernier = t;
    if (mode === 'cache') return;
    if (cible && !CALME) {
      var dx = cible.x - ax, dy = angle(cible.y - ay), k = 1 - Math.pow(.92, dt / 16.7);
      ax += dx * k; ay += dy * k;
      if (Math.abs(dx) < .002 && Math.abs(dy) < .002) { ax = cible.x; ay = cible.y; }
    } else if (cible) { ax = cible.x; ay = cible.y; }
    else if (!CALME) ay += dt * (mode === 'fond' ? .00006 : .00012);
    var oscille = cible && !CALME ? Math.sin(t / 1400) * .04 : 0;
    rotor.style.transform = 'rotateX(' + (ax + oscille).toFixed(4) + 'rad) rotateY(' + (ay + oscille * .6).toFixed(4) + 'rad)';
  }
  function etats(k, faites) {
    tuiles.forEach(function (x, i) {
      x.el.classList.toggle('faite', faites.indexOf(i) >= 0);
      x.el.classList.toggle('ici', i === k);
      x.el.classList.toggle('apres', i > k && faites.indexOf(i) < 0);
    });
  }
  /* Montre la sphère nette et la fait tourner vers la tuile k. revenir = on sort d'une partie (zoom arrière). */
  function station(k, faites, revenir) {
    if (!racine) return;
    etats(k, faites || []);
    racine.className = 'univers vue' + (revenir && !CALME ? ' sortie' : '');
    if (revenir && !CALME) { void racine.offsetWidth; requestAnimationFrame(function () { racine.classList.remove('sortie'); }); }
    var x = tuiles[k]; if (!x) return;
    cible = { x: -x.lat, y: -x.lon };
    mode = 'vue';
  }
  /* Plongée dans la tuile en face, puis fini(). */
  function plonger(fini) {
    if (!racine || CALME) { if (fini) fini(); return; }
    racine.classList.add('plonge');
    setTimeout(function () { if (fini) fini(); }, 900);
  }
  function fond() { if (!racine) return; cible = null; mode = 'fond'; racine.className = 'univers fond'; }
  function cacher() { if (!racine) return; mode = 'cache'; racine.className = 'univers cache'; }
  window.Monde = { init: init, station: station, plonger: plonger, fond: fond, cacher: cacher };
})();
