/* avatar.js — Dittou (ديتو), la mascotte de SHIHTY+ (images dans assets/bitto/, fond retiré).
   Avatar.src(nom)          chemin d'une image : 'salut', 'yeux', 'rit', 'surpris', 'coeurs', 'fatigue', 'dort', 'agace', 'bas', 'saute', 'dos'
   Avatar.pose(nom)         <span><img></span> d'une image de Dittou
   Avatar.portrait(boite)   accueil : Dittou vivant. Ses pupilles (dessinées par code sur l'image « yeux ») suivent
                            la souris ou le doigt ; il cligne des yeux, se penche vers le curseur, et réagit :
                            survol → rit, clic → surpris / rit / cœurs, trop de clics → agacé,
                            bouton « ابدأ » → cœurs, laissé seul → fatigué puis endormi. */
(function () {
  'use strict';
  var DOSSIER = 'assets/bitto/';
  var CALME = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EXPR = ['yeux', 'rit', 'surpris', 'coeurs', 'fatigue', 'dort', 'agace', 'bas', 'saute', 'salut'];
  var NOTIFS = ['❤️', '👍', '💬', '🔔', '😂', '📸', '▶️', '🔥', '📩', '🎵'];
  /* position des yeux sur l'image « yeux » (fractions de la largeur / hauteur), mesurée sur l'image */
  var YEUX = [
    { cx: .4322, cy: .3673, r: .0711 },
    { cx: .6648, cy: .3351, r: .0704 }
  ];
  var RATIO = 682 / 720;
  /* barre de réactions (comme sur les réseaux sociaux) : emoji, expression de Dittou, nom affiché */
  var REACTIONS = [['😂', 'rit', 'هههه'], ['😍', 'coeurs', 'عجبني'], ['😮', 'surpris', 'واو'], ['🤩', 'saute', 'برافو'], ['🥱', 'fatigue', 'عييت'], ['😴', 'dort', 'نعسان'], ['😠', 'agace', 'معصب']];   // largeur / hauteur des images d'expression

  function src(nom) { return DOSSIER + nom + '.webp'; }
  function emoji(e) { var s = window.Icones && window.Icones.src(e); return s ? '<img class="em3d" src="' + s + '" alt="">' : e; }
  function pose(nom) {
    var b = document.createElement('span'); b.className = 'avt-pose avt-' + nom; b.setAttribute('aria-hidden', 'true');
    var im = document.createElement('img'); im.src = src(nom); im.alt = ''; im.decoding = 'async'; b.appendChild(im);
    return b;
  }

  /* les yeux dessinés : une pupille (avec deux reflets) et une paupière pour cligner, par œil */
  function yeuxSvg() {
    var s = '<svg class="btt-yeux" viewBox="0 0 ' + RATIO * 1000 + ' 1000" preserveAspectRatio="none" aria-hidden="true">';
    YEUX.forEach(function (e, i) {
      var cx = e.cx * RATIO * 1000, cy = e.cy * 1000, r = e.r * RATIO * 1000;
      s += '<clipPath id="bttOeil' + i + '"><circle cx="' + cx + '" cy="' + cy + '" r="' + (r * .97) + '"/></clipPath>' +
        '<g clip-path="url(#bttOeil' + i + ')">' +
          '<g class="btt-pupille" data-i="' + i + '">' +
            '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * .56) + '" fill="#141B2E"/>' +
            '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * .56) + '" fill="url(#bttReflet)" opacity=".5"/>' +
            '<circle cx="' + (cx + r * .2) + '" cy="' + (cy - r * .24) + '" r="' + (r * .2) + '" fill="#fff"/>' +
            '<circle cx="' + (cx - r * .22) + '" cy="' + (cy + r * .2) + '" r="' + (r * .09) + '" fill="#fff"/>' +
          '</g>' +
          '</g>' +
        '</g>';
    });
    YEUX.forEach(function (e, i) {
      var cx = e.cx * RATIO * 1000, cy = e.cy * 1000, r = e.r * RATIO * 1000;
      s += '<clipPath id="bttPaup' + i + '"><circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 1.22) + '"/></clipPath>' +
        '<g class="btt-paupiere" clip-path="url(#bttPaup' + i + ')"><image href="' + src('dort') + '" x="0" y="0" width="' + RATIO * 1000 + '" height="1000" preserveAspectRatio="none"/></g>';
    });
    s += '<defs><radialGradient id="bttReflet" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#4B5A80"/><stop offset="1" stop-color="#141B2E" stop-opacity="0"/></radialGradient></defs></svg>';
    return s;
  }

  function portrait(boite, TX) {
    TX = TX || {};
    boite.classList.add('btt');
    boite.innerHTML = '<div class="btt-ombre"></div><div class="btt-corps"><div class="btt-in"><div class="btt-pile"></div>' + yeuxSvg() + '</div></div><div class="viv-effets"></div><p class="btt-bulle" aria-live="polite"></p>' +
      '<div class="btt-reac" role="group" aria-label="تفاعل مع ديتو">' + REACTIONS.map(function (r, i) {
        return '<button type="button" class="btt-r" data-i="' + i + '" style="--i:' + i + '" aria-label="' + r[2] + '"><span class="btt-r-em">' + r[0] + '</span><span class="btt-r-nom">' + r[2] + '</span></button>';
      }).join('') + '</div>';
    var bulleEl = boite.querySelector('.btt-bulle'), bulleMin = null;
    function parler(txt, ms) {
      if (!txt) return;
      bulleEl.textContent = txt; bulleEl.classList.remove('on'); void bulleEl.offsetWidth; bulleEl.classList.add('on');
      clearTimeout(bulleMin); bulleMin = setTimeout(function () { bulleEl.classList.remove('on'); }, ms || 2800);
    }
    var corps = boite.querySelector('.btt-corps'), dedans = boite.querySelector('.btt-in'), pile = boite.querySelector('.btt-pile'), fx = boite.querySelector('.viv-effets');
    var svgYeux = boite.querySelector('.btt-yeux');
    var pupilles = [].slice.call(boite.querySelectorAll('.btt-pupille')), paupieres = [].slice.call(boite.querySelectorAll('.btt-paupiere'));
    var saut = 0, imgs = {}, actuelle = null, minuteur = null, verrou = 0, clics = [], suite = 0;
    var dernierGeste = performance.now(), endormi = false, prochainCligne = performance.now() + 2500, cligne = 0;
    var vise = { x: 0, y: .25 }, regard = { x: 0, y: .25 }, incl = { x: 0, y: 0 }, inclS = { x: 0, y: 0 }, avant = performance.now();

    EXPR.forEach(function (e) {
      var im = document.createElement('img'); im.src = src(e); im.alt = ''; im.draggable = false; im.className = 'btt-img';
      pile.appendChild(im); imgs[e] = im;
    });
    function montrer(e, ms) {
      if (actuelle !== e) {
        if (actuelle) imgs[actuelle].classList.remove('on');
        imgs[e].classList.add('on'); actuelle = e;
        svgYeux.style.opacity = e === 'yeux' ? 1 : 0;   // les pupilles vivantes seulement sur l'image « yeux »
        dedans.classList.remove('pop'); void dedans.offsetWidth; dedans.classList.add('pop');
      }
      clearTimeout(minuteur);
      if (ms) minuteur = setTimeout(function () { endormi = false; montrer('yeux'); }, ms);
    }
    function bulle(e, classe, x, y, duree) {
      var el = document.createElement('span');
      el.className = 'viv-fx ' + (classe || 'monte'); el.innerHTML = emoji(e);
      el.style.left = x + '%'; el.style.top = y + '%';
      el.style.setProperty('--dx', (Math.random() * 160 - 80).toFixed(0) + 'px');
      el.style.setProperty('--r', (Math.random() * 60 - 30).toFixed(0) + 'deg');
      fx.appendChild(el); setTimeout(function () { el.remove(); }, duree || 2400);
    }
    function salve(n, liste) {
      liste = liste || NOTIFS;
      for (var k = 0; k < n; k++) setTimeout(function () { bulle(liste[Math.floor(Math.random() * liste.length)], 'monte', 40 + Math.random() * 30, 22); }, k * 130);
    }
    function geste() {
      dernierGeste = performance.now();
      if (endormi || actuelle === 'fatigue') { endormi = false; montrer('surpris', 900); salve(4, ['🔔', '📩', '💬']); verrou = performance.now() + 900; parler(TX.reveil, 1800); }
    }
    function viser(cx, cy) {   // le point regardé, en coordonnées de l'écran
      var r = svgYeux.getBoundingClientRect();
      var ox = r.left + r.width * .55, oy = r.top + r.height * .35;
      var dx = cx - ox, dy = cy - oy, d = Math.sqrt(dx * dx + dy * dy) || 1, f = Math.min(1, d / 260);
      vise.x = dx / d * f; vise.y = dy / d * f;
      incl.x = Math.max(-1, Math.min(1, dx / (r.width * 1.4))); incl.y = Math.max(-1, Math.min(1, dy / (r.height * 1.4)));
    }

    corps.addEventListener('click', function () {
      geste(); var t = performance.now();
      clics = clics.filter(function (c) { return t - c < 2500; }); clics.push(t);
      if (clics.length >= 6) { clics = []; if (window.Sons) window.Sons.jouer('hmph'); montrer('agace', 1800); verrou = t + 1800; parler((TX.reactions || {}).agace, 2000); return; }
      var s = [['surpris', 900, null], ['rit', 1300, null], ['coeurs', 1500, ['❤️', '😍', '💕']]][suite++ % 3];
      if (window.Sons) window.Sons.jouer({ surpris: 'surpris', rit: 'rit', coeurs: 'aww' }[s[0]]);
      montrer(s[0], s[1]); salve(5, s[2]); verrou = t + s[1];
    });
    boite.querySelectorAll('.btt-r').forEach(function (b) {
      b.addEventListener('click', function (ev) {
        ev.stopPropagation(); geste();
        var r = REACTIONS[+b.getAttribute('data-i')];
        montrer(r[1], 2200); verrou = performance.now() + 2200; endormi = false;
        parler((TX.reactions || {})[r[1]], 2400);
        if (r[1] === 'saute') saut = performance.now();
        if (window.Sons) window.Sons.jouer({ rit: 'rit', coeurs: 'aww', surpris: 'surpris', saute: 'succes', fatigue: 'baille', dort: 'ronfle', agace: 'hmph' }[r[1]]);
        for (var k = 0; k < 6; k++) setTimeout(function () { bulle(r[0], 'monte', 35 + Math.random() * 30, 20); }, k * 110);
        b.classList.remove('choisi'); void b.offsetWidth; b.classList.add('choisi');
      });
    });
    setTimeout(function () {
      document.querySelectorAll('.ac-cta').forEach(function (b) {
        b.addEventListener('pointerenter', function () { geste(); montrer('coeurs', 1600); salve(4, ['❤️', '💕']); verrou = performance.now() + 1600; });
      });
    }, 50);
    function bouge(ev) { geste(); viser(ev.clientX, ev.clientY); }
    function touche(ev) { var t = ev.touches && ev.touches[0]; if (t) { geste(); viser(t.clientX, t.clientY); } }
    window.addEventListener('pointermove', bouge, { passive: true });
    window.addEventListener('pointerdown', bouge, { passive: true });
    window.addEventListener('touchstart', touche, { passive: true });
    window.addEventListener('scroll', geste, { passive: true });

    var prochaineNotif = performance.now() + 3000;
    function boucle(t) {
      if (!document.body.contains(boite)) {
        window.removeEventListener('pointermove', bouge); window.removeEventListener('pointerdown', bouge);
        window.removeEventListener('touchstart', touche); window.removeEventListener('scroll', geste); return;
      }
      requestAnimationFrame(boucle);
      var dt = Math.min(.05, (t - avant) / 1000); avant = t;
      var calme = t - dernierGeste;
      // sans souris depuis un moment : il regarde son « écran » vers le bas, puis ailleurs
      if (calme > 3000 && actuelle === 'yeux') { vise.x = Math.sin(t / 1700) * .5; vise.y = .3 + Math.sin(t / 2300) * .2; }
      var k = CALME ? 1 : 1 - Math.exp(-dt * 9), k2 = CALME ? 1 : 1 - Math.exp(-dt * 3.2);
      inclS.x += (incl.x - inclS.x) * k2; inclS.y += (incl.y - inclS.y) * k2;
      regard.x += (vise.x - regard.x) * k; regard.y += (vise.y - regard.y) * k;
      pupilles.forEach(function (p, i) {
        var r = YEUX[i].r * RATIO * 1000 * .4;
        p.setAttribute('transform', 'translate(' + (regard.x * r).toFixed(1) + ' ' + (regard.y * r).toFixed(1) + ')');
      });
      // clignement
      if (t > prochainCligne && actuelle === 'yeux') { cligne = t; prochainCligne = t + 2200 + Math.random() * 3200; }
      var c = cligne ? (t - cligne) / 150 : 2, f = c < 1 ? c : c < 2 ? 2 - c : 0;
      paupieres.forEach(function (p) { p.style.opacity = Math.min(1, f * 2.5).toFixed(2); });
      // il se penche vers le curseur, respire, et fait un petit saut de temps en temps
      if (!CALME) {
        if (actuelle === 'yeux' && Math.random() < .0008) saut = t;
        var s = saut ? (t - saut) / 560 : 1, h = s < 1 ? Math.sin(s * Math.PI) : 0;
        var ecr = s < 1 ? (s < .15 ? s / .15 : s > .85 ? (1 - s) / .15 : 0) * .06 : 0;
        corps.style.transform = 'translateY(' + (-h * 9).toFixed(3) + '%) scale(' + (1 + ecr).toFixed(4) + ',' + (1 - ecr + Math.sin(t / 700) * .008).toFixed(4) + ')';   // seuls les yeux suivent le curseur
        boite.querySelector('.btt-ombre').style.transform = 'scale(' + (1 - h * .35).toFixed(3) + ')';
      }
      if (t > prochaineNotif && !endormi && actuelle !== 'fatigue') { prochaineNotif = t + 2600 + Math.random() * 2600; bulle(NOTIFS[Math.floor(Math.random() * NOTIFS.length)], 'monte', 40 + Math.random() * 30, 22); }
      // laissé seul : fatigué (batterie rouge), puis il s'endort
      if (actuelle === 'yeux' && calme > 9000) { montrer('fatigue'); parler((TX.reactions || {}).fatigue, 2400); setTimeout(function () { if (actuelle === 'fatigue' && performance.now() - dernierGeste > 9000) { endormi = true; montrer('dort'); } }, 2600); }
      if (endormi && Math.random() < .01) bulle('💤', 'zzz', 66, 14, 2200);
    }
    montrer('salut', 1800);   // il dit bonjour en arrivant
    (TX.accueil || []).forEach(function (m, i) { setTimeout(function () { if (document.body.contains(boite) && performance.now() > verrou) parler(m, 2900); }, 700 + i * 3300); });
    requestAnimationFrame(boucle);
  }

  window.Avatar = { src: src, pose: pose, portrait: portrait };
})();
