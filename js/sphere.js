/* sphere.js — sphère 3D de tuiles qui tourne (CSS 3D, sans bibliothèque).
   Sphere.creer(['❤️','💬',…], { n: 34, rayon: 190, classe: '' }) → élément .sph */
(function () {
  'use strict';
  function creer(emojis, o) {
    o = o || {};
    var n = o.n || 34, R = o.rayon || 190;
    var sph = document.createElement('div'); sph.className = 'sph ' + (o.classe || '');
    sph.style.setProperty('--R', R + 'px');
    var rotor = document.createElement('div'); rotor.className = 'sph-rotor';
    for (var k = 0; k < n; k++) {
      var y = 1 - 2 * (k + .5) / n, lat = Math.asin(y), lon = k * 2.39996;
      var t = document.createElement('div');
      t.className = 'sph-tuile v' + (k % 5);
      t.style.transform = 'rotateY(' + lon.toFixed(3) + 'rad) rotateX(' + lat.toFixed(3) + 'rad) translateZ(var(--R))';
      t.style.setProperty('--k', k);
      var e = document.createElement('span'); e.className = 'sph-em'; e.textContent = emojis[k % emojis.length];
      t.appendChild(e); rotor.appendChild(t);
    }
    sph.appendChild(rotor);
    return sph;
  }
  window.Sphere = { creer: creer };
})();
