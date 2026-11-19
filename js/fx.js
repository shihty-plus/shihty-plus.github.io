/* fx.js — effets SHIHTY+ : formes flottantes en parallaxe, clics magiques, halo du curseur,
   vol des autocollants vers l'album. Tout est désactivé si l'appareil demande moins d'animations. */
(function () {
  'use strict';
  var CALME = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PALETTE = ['#2DD4BF', '#0D9488', '#FF7F6B', '#F0644F', '#E2B970', '#F1D9A8'];
  var GLYPHES = ['+', '✦', '●', '✿', '+', '◆'];
  function hasard(a, b) { return a + Math.random() * (b - a); }
  function choix(t) { return t[Math.floor(Math.random() * t.length)]; }

  /* ---------- 1. formes flottantes ---------- */
  var TYPES = ['rond', 'anneau', 'plus', 'pilule', 'pois', 'demi', 'vague', 'goutte', 'anneau', 'plus'];
  function creerFormes() {
    var decor = document.querySelector('.decor');
    if (!decor) return;
    var boite = document.createElement('div');
    boite.className = 'formes';
    var n = window.innerWidth < 700 ? 11 : 18;
    for (var i = 0; i < n; i++) {
      var type = TYPES[i % TYPES.length];
      var f = document.createElement('span');
      var taille = type === 'pois' ? hasard(70, 120) : hasard(26, window.innerWidth < 700 ? 74 : 110);
      f.className = 'forme f-' + type;
      f.style.cssText = '--x:' + hasard(-4, 96).toFixed(1) + '%;--y:' + hasard(-4, 94).toFixed(1) + '%;--s:' + taille.toFixed(0) + 'px;' +
        '--c:' + choix(PALETTE) + ';--d:' + hasard(.25, 1.1).toFixed(2) + ';--rot:' + hasard(-40, 40).toFixed(0) + 'deg;' +
        '--dur:' + hasard(7, 15).toFixed(1) + 's;--del:-' + hasard(0, 10).toFixed(1) + 's;--op:' + hasard(.45, .9).toFixed(2);
      var corps = document.createElement('i');
      if (type === 'vague') corps.innerHTML = '<svg viewBox="0 0 100 30" aria-hidden="true"><path d="M3 15 Q 15 2 27 15 T 51 15 T 75 15 T 97 15" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round"/></svg>';
      f.appendChild(corps);
      boite.appendChild(f);
    }
    decor.appendChild(boite);
    if (CALME) return;
    // parallaxe : souris, doigt et défilement déplacent les formes selon leur profondeur
    var cible = { x: 0, y: 0 }, cour = { x: 0, y: 0 }, enCours = false;
    function boucle() {
      cour.x += (cible.x - cour.x) * 0.08; cour.y += (cible.y - cour.y) * 0.08;
      decor.style.setProperty('--mx', cour.x.toFixed(3));
      decor.style.setProperty('--my', cour.y.toFixed(3));
      decor.style.setProperty('--sy', String(window.scrollY | 0));
      if (Math.abs(cible.x - cour.x) > 0.002 || Math.abs(cible.y - cour.y) > 0.002) requestAnimationFrame(boucle); else enCours = false;
    }
    function relancer() { if (!enCours) { enCours = true; requestAnimationFrame(boucle); } }
    window.addEventListener('pointermove', function (e) {
      cible.x = (e.clientX / window.innerWidth) * 2 - 1;
      cible.y = (e.clientY / window.innerHeight) * 2 - 1;
      relancer();
    }, { passive: true });
    window.addEventListener('scroll', relancer, { passive: true });
  }

  /* ---------- 2. clics magiques ---------- */
  function eclat(x, y, force) {
    if (CALME) return;
    var n = force || 10;
    var boite = document.createElement('div');
    boite.className = 'eclat';
    boite.style.left = x + 'px'; boite.style.top = y + 'px';
    var onde = document.createElement('span');
    onde.className = 'eclat-onde';
    onde.style.borderColor = choix(PALETTE);
    boite.appendChild(onde);
    for (var i = 0; i < n; i++) {
      var p = document.createElement('span');
      var angle = (i / n) * Math.PI * 2 + hasard(-.25, .25);
      var dist = hasard(38, 86) * (force > 12 ? 1.25 : 1);
      p.className = 'eclat-p';
      p.textContent = choix(GLYPHES);
      p.style.color = choix(PALETTE);
      p.style.fontSize = hasard(11, 20).toFixed(0) + 'px';
      p.style.setProperty('--dx', (Math.cos(angle) * dist).toFixed(1) + 'px');
      p.style.setProperty('--dy', (Math.sin(angle) * dist).toFixed(1) + 'px');
      p.style.setProperty('--r', hasard(-200, 200).toFixed(0) + 'deg');
      boite.appendChild(p);
    }
    document.body.appendChild(boite);
    setTimeout(function () { boite.remove(); }, 900);
  }
  document.addEventListener('pointerdown', function (e) {
    var t = e.target;
    if (t.closest && t.closest('input[type=text], input[type=number], select, textarea, details')) return;
    var interactif = t.closest && t.closest('.option, .btn, .album-btn, .sticker, .lien-aide, .marque');
    eclat(e.clientX, e.clientY, interactif ? (interactif.classList.contains('btn-principal') ? 16 : 11) : 7);
    if (interactif && navigator.vibrate) { try { navigator.vibrate(8); } catch (err) { /* refusé */ } }
  }, { passive: true });

  /* ---------- 3. halo qui suit la souris (ordinateur) ---------- */
  function creerHalo() {
    if (CALME || !window.matchMedia('(pointer: fine)').matches) return;
    var halo = document.createElement('div');
    halo.className = 'halo';
    document.body.appendChild(halo);
    var cx = -100, cy = -100, x = -100, y = -100, actif = false;
    function boucle() {
      x += (cx - x) * 0.22; y += (cy - y) * 0.22;
      halo.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      if (Math.abs(cx - x) > 0.3 || Math.abs(cy - y) > 0.3) requestAnimationFrame(boucle); else actif = false;
    }
    window.addEventListener('pointermove', function (e) {
      cx = e.clientX; cy = e.clientY;
      var sur = e.target.closest && e.target.closest('.option, .btn, button, a, summary, label');
      halo.classList.toggle('sur-lien', !!sur);
      if (!actif) { actif = true; requestAnimationFrame(boucle); }
    }, { passive: true });
    document.addEventListener('pointerleave', function () { halo.classList.add('cache'); });
    document.addEventListener('pointerenter', function () { halo.classList.remove('cache'); });
  }

  /* ---------- 4. un autocollant gagné s'envole vers l'album ---------- */
  var file = [];
  var occupe = false;
  function debloquer(emoji, couleur, cible, fini) {
    file.push([emoji, couleur, cible, fini]);
    if (!occupe) suivant();
  }
  function suivant() {
    var x = file.shift();
    if (!x) { occupe = false; return; }
    occupe = true;
    var emoji = x[0], couleur = x[1], cible = x[2], fini = x[3];
    if (CALME || !cible || !cible.getBoundingClientRect || !document.body.animate) { if (fini) fini(); occupe = false; suivant(); return; }
    var s = document.createElement('div');
    s.className = 'sticker sticker-vol';
    s.style.setProperty('--sc', couleur || '#FF7F6B');
    s.innerHTML = '<span class="sticker-emoji"></span>';
    s.firstChild.textContent = emoji;
    document.body.appendChild(s);
    var r = cible.getBoundingClientRect();
    var dx = r.left + r.width / 2 - window.innerWidth / 2, dy = r.top + r.height / 2 - window.innerHeight / 2;
    var anim = s.animate([
      { transform: 'translate(-50%,-50%) scale(0) rotate(-40deg)', opacity: 0 },
      { transform: 'translate(-50%,-50%) scale(1.35) rotate(10deg)', opacity: 1, offset: .22 },
      { transform: 'translate(-50%,-50%) scale(1.15) rotate(-6deg)', opacity: 1, offset: .55 },
      { transform: 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px)) scale(.25) rotate(360deg)', opacity: .6 }
    ], { duration: 1500, easing: 'cubic-bezier(.4,0,.2,1)' });
    eclat(window.innerWidth / 2, window.innerHeight / 2, 18);
    anim.onfinish = function () {
      s.remove();
      cible.classList.remove('recoit'); void cible.offsetWidth; cible.classList.add('recoit');
      if (fini) fini();
      suivant();
    };
  }

  /* ---------- 5. l'emoji de la réponse choisie s'envole ---------- */
  function envol(emoji, x, y) {
    if (CALME || !emoji) return;
    for (var k = 0; k < 3; k++) {
      var e = document.createElement('span');
      e.className = 'envol';
      e.textContent = emoji;
      e.style.left = x + 'px'; e.style.top = y + 'px';
      e.style.setProperty('--dx', hasard(-50, 50).toFixed(0) + 'px');
      e.style.setProperty('--r', hasard(-25, 25).toFixed(0) + 'deg');
      e.style.animationDelay = (k * 90) + 'ms';
      e.style.fontSize = (k === 0 ? 34 : 22) + 'px';
      document.body.appendChild(e);
      setTimeout(function (n) { return function () { n.remove(); }; }(e), 1300);
    }
  }

  /* ---------- 6. projecteur qui suit la souris, téléphone 3D qui s'incline, boutons magnétiques ---------- */
  function suivrePointeur() {
    if (CALME) return;
    var racine = document.documentElement, attente = false, ex = 0, ey = 0;
    window.addEventListener('pointermove', function (e) {
      ex = e.clientX; ey = e.clientY;
      if (attente) return; attente = true;
      requestAnimationFrame(function () {
        attente = false;
        racine.style.setProperty('--px', (ex / window.innerWidth * 100).toFixed(1) + '%');
        racine.style.setProperty('--py', (ey / window.innerHeight * 100).toFixed(1) + '%');
        var tel = document.querySelector('.tel3d-corps');
        if (tel) {
          var r = tel.getBoundingClientRect(), dx = (ex - (r.left + r.width / 2)) / window.innerWidth, dy = (ey - (r.top + r.height / 2)) / window.innerHeight;
          tel.style.setProperty('--ry', (dx * 30).toFixed(2) + 'deg');
          tel.style.setProperty('--rx', (-dy * 24).toFixed(2) + 'deg');
        }
        document.querySelectorAll('.magnetique').forEach(function (b) {
          var r = b.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, d = Math.hypot(ex - cx, ey - cy);
          if (d < 140) b.style.transform = 'translate(' + ((ex - cx) * .22).toFixed(1) + 'px,' + ((ey - cy) * .3).toFixed(1) + 'px)';
          else if (b.style.transform) b.style.transform = '';
        });
      });
    }, { passive: true });
  }

  function init() { creerFormes(); creerHalo(); suivrePointeur(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.FX = { eclat: eclat, debloquer: debloquer, envol: envol, calme: CALME };
})();
