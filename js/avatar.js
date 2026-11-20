/* avatar.js — les avatars 3D (images dans assets/avatars/).
   Avatar.genre()            'f' ou 'h' (tiré au hasard à la première visite, puis gardé)
   Avatar.choisir(g)         change de personnage (accueil + voyage)
   Avatar.src(nom)           chemin d'une image : 'neutre', 'dos', 'fille-salut'...
   Avatar.portrait(boite)    accueil : portrait vivant (expressions, icônes qui sortent du téléphone)
   Avatar.pose(nom, icone)   <img> d'une pose (avec une icône sur la pancarte si besoin) */
(function () {
  'use strict';
  var DOSSIER = 'assets/avatars/';
  var CALME = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EXPR = ['neutre', 'surpris', 'dort', 'rit', 'coeurs', 'baille'];
  var NOTIFS = ['❤️', '👍', '💬', '🔔', '😂', '📸', '▶️', '🔥', '📩', '🎵'];
  var g = null, ecouteurs = [];

  function lire() { try { return localStorage.getItem('shihty-avatar'); } catch (e) { return null; } }
  function genre() {
    if (!g) { g = lire(); if (g !== 'f' && g !== 'h') g = Math.random() < .5 ? 'f' : 'h'; }
    return g;
  }
  function choisir(n) {
    if (n !== 'f' && n !== 'h' || n === g) return;
    g = n; try { localStorage.setItem('shihty-avatar', n); } catch (e) { /* rien */ }
    ecouteurs.forEach(function (f) { f(n); });
  }
  function surChangement(f) { ecouteurs.push(f); }
  function src(nom, gg) {
    if (/^(fille|garcon)-/.test(nom)) return DOSSIER + nom + '.webp';
    return DOSSIER + ((gg || genre()) === 'f' ? 'fille-' : 'garcon-') + nom + '.webp';
  }
  function emoji(e) { var s = window.Icones && window.Icones.src(e); return s ? '<img class="em3d" src="' + s + '" alt="">' : e; }

  function pose(nom, icone) {
    var b = document.createElement('span');
    b.className = 'avt-pose avt-' + nom.replace(/^(fille|garcon)-/, '');
    b.setAttribute('aria-hidden', 'true');
    var dedans = document.createElement('span'); dedans.className = 'avt-in'; b.appendChild(dedans);
    var im = document.createElement('img'); im.src = src(nom); im.alt = ''; im.decoding = 'async';
    dedans.appendChild(im);
    if (icone && /pancarte/.test(nom)) { var p = document.createElement('span'); p.className = 'avt-signe'; p.innerHTML = emoji(icone); dedans.appendChild(p); }
    return b;
  }

  /* ---------- portrait vivant ---------- */
  function portrait(boite) {
    boite.classList.add('avt-portrait');
    boite.innerHTML = '<div class="avt-incline"><span class="avt-lueur"></span><div class="avt-pile"></div></div><div class="viv-effets"></div>' +
      '<div class="avt-choix" role="group"><button type="button" data-g="f">طالبة</button><button type="button" data-g="h">طالب</button></div>';
    var pile = boite.querySelector('.avt-pile'), incl = boite.querySelector('.avt-incline'), fx = boite.querySelector('.viv-effets');
    var imgs = {}, actuelle = null, verrou = 0, clics = 0, dernierGeste = performance.now(), endormi = false, minuteur = null;

    function charger() {
      pile.innerHTML = ''; imgs = {};
      EXPR.forEach(function (e) {
        var im = document.createElement('img'); im.src = src(e); im.alt = ''; im.className = 'avt-expr' + (e === 'neutre' ? ' neutre' : '');
        im.draggable = false; pile.appendChild(im); imgs[e] = im;
      });
      actuelle = null; montrer('neutre');
      boite.querySelectorAll('.avt-choix button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-g') === genre() ? 'true' : 'false'); });
    }
    function montrer(e, ms) {
      if (!imgs[e]) return;
      if (actuelle !== e) {
        if (actuelle) imgs[actuelle].classList.remove('on');
        imgs[e].classList.add('on'); actuelle = e;
        pile.classList.remove('pop'); void pile.offsetWidth; pile.classList.add('pop');
      }
      clearTimeout(minuteur);
      if (ms) minuteur = setTimeout(function () { endormi = false; montrer('neutre'); }, ms);
    }
    function bulle(e, classe, x, y, duree) {
      var el = document.createElement('span');
      el.className = 'viv-fx ' + (classe || 'monte'); el.innerHTML = emoji(e);
      el.style.left = (x || 50) + '%'; el.style.top = (y || 74) + '%';
      el.style.setProperty('--dx', (Math.random() * 160 - 80).toFixed(0) + 'px');
      el.style.setProperty('--r', (Math.random() * 60 - 30).toFixed(0) + 'deg');
      fx.appendChild(el); setTimeout(function () { el.remove(); }, duree || 2400);
    }
    function salve(n, liste) {
      liste = liste || NOTIFS;
      for (var k = 0; k < n; k++) setTimeout(function () { bulle(liste[Math.floor(Math.random() * liste.length)], 'monte', 44 + Math.random() * 12, 72); }, k * 140);
    }
    function geste() {
      dernierGeste = performance.now();
      if (endormi) { endormi = false; montrer('surpris', 900); salve(4, ['🔔', '📩', '💬']); }
    }

    // clic : surpris → rit → cœurs, avec une salve de notifications
    var SUITE = [['surpris', 900, null], ['rit', 1300, null], ['coeurs', 1500, ['❤️', '😍', '💕']]];
    incl.addEventListener('click', function () {
      geste(); var s = SUITE[clics++ % SUITE.length]; montrer(s[0], s[1]); salve(s[2] ? 5 : 6, s[2]);
      verrou = performance.now() + s[1];
    });
    incl.addEventListener('pointerenter', function () { geste(); if (performance.now() > verrou) montrer('rit', 1400); });
    boite.querySelectorAll('.avt-choix button').forEach(function (b) {
      b.addEventListener('click', function () { choisir(b.getAttribute('data-g')); });
    });
    surChangement(function () { if (document.body.contains(boite)) { charger(); salve(5); } });

    // cœurs dans les yeux quand on survole le bouton « commencer »
    setTimeout(function () {
      document.querySelectorAll('.ac-cta').forEach(function (b) {
        b.addEventListener('pointerenter', function () { geste(); montrer('coeurs', 1600); salve(4, ['❤️', '💕']); verrou = performance.now() + 1600; });
      });
    }, 50);

    // il se penche vers la souris (parallaxe 3D douce)
    var cx = 0, cy = 0, tx = 0, ty = 0;
    function bouge(ev) {
      geste();
      var r = boite.getBoundingClientRect();
      tx = Math.max(-1, Math.min(1, (ev.clientX - (r.left + r.width / 2)) / (r.width * 1.2)));
      ty = Math.max(-1, Math.min(1, (ev.clientY - (r.top + r.height / 2)) / (r.height * 1.2)));
    }
    window.addEventListener('pointermove', bouge, { passive: true });
    window.addEventListener('scroll', geste, { passive: true });

    // laissé seul : notifications, bâillement, puis il s'endort
    var prochaineNotif = performance.now() + 3500;
    function boucle(t) {
      if (!document.body.contains(boite)) { window.removeEventListener('pointermove', bouge); window.removeEventListener('scroll', geste); return; }
      requestAnimationFrame(boucle);
      cx += (tx - cx) * .06; cy += (ty - cy) * .06;
      if (!CALME) incl.style.transform = 'rotateY(' + (cx * 9).toFixed(2) + 'deg) rotateX(' + (-cy * 6).toFixed(2) + 'deg)';
      var calme = t - dernierGeste;
      if (t > prochaineNotif && !endormi) { prochaineNotif = t + 2600 + Math.random() * 2600; bulle(NOTIFS[Math.floor(Math.random() * NOTIFS.length)], 'monte', 44 + Math.random() * 12, 72); }
      if (actuelle === 'neutre' && !endormi && calme > 9000) { montrer('baille'); setTimeout(function () { if (actuelle === 'baille') { endormi = true; montrer('dort'); } }, 1800); }
      if (endormi && Math.random() < .012) bulle('💤', 'zzz', 58, 30, 2200);
    }
    charger();
    requestAnimationFrame(boucle);
  }

  window.Avatar = { genre: genre, choisir: choisir, surChangement: surChangement, src: src, pose: pose, portrait: portrait };
})();
