/* vivant.js — « portrait vivant » : un étudiant dessiné (SVG) qui scrolle son téléphone.
   Ses yeux suivent la souris, il cligne, il se replonge dans son téléphone dès qu'on le laisse,
   il réagit au survol, au clic et quand on le tire (la tête s'étire comme de la pâte puis revient).
   Laissé seul, il bâille, s'endort, sursaute à une notification...
   Vivant.monter(conteneur) ; s'arrête tout seul quand le conteneur quitte la page. */
(function () {
  'use strict';
  var CALME = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';
  var EYES = { g: [162, 205], d: [238, 205] };
  var BOUCHES = {
    sourire: 'M181 268 Q200 282 219 268',
    neutre: 'M184 272 Q200 275 216 272',
    moue: 'M186 274 Q200 268 214 274',
    fache: 'M182 278 Q200 266 218 278',
    malin: 'M182 270 Q204 282 222 264'
  };
  var NOTIFS = ['❤️', '👍', '💬', '🔔', '😂', '📸', '▶️', '🔥', '📩', '🎵'];

  function svgDessin() {
    return '<svg viewBox="0 0 400 480" class="viv-svg" aria-hidden="true">' +
      '<defs>' +
      '<radialGradient id="vPeau" cx="45%" cy="35%" r="70%"><stop offset="0" stop-color="#FAD3B2"/><stop offset=".7" stop-color="#EDB48C"/><stop offset="1" stop-color="#D99A72"/></radialGradient>' +
      '<radialGradient id="vCheveux" cx="40%" cy="30%" r="75%"><stop offset="0" stop-color="#6B4430"/><stop offset="1" stop-color="#2E1C14"/></radialGradient>' +
      '<linearGradient id="vSweat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14B8A6"/><stop offset="1" stop-color="#0B6E66"/></linearGradient>' +
      '<radialGradient id="vIris" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#8A5A3C"/><stop offset="1" stop-color="#3A2216"/></radialGradient>' +
      '<radialGradient id="vLueur" cx="50%" cy="100%" r="80%"><stop offset="0" stop-color="#5EEAD4" stop-opacity=".55"/><stop offset="1" stop-color="#5EEAD4" stop-opacity="0"/></radialGradient>' +
      '<clipPath id="vOeilG"><ellipse cx="162" cy="205" rx="24" ry="26"/></clipPath>' +
      '<clipPath id="vOeilD"><ellipse cx="238" cy="205" rx="24" ry="26"/></clipPath>' +
      '<clipPath id="vEcran"><rect x="-41" y="-74" width="82" height="150" rx="10"/></clipPath>' +
      '</defs>' +
      '<ellipse cx="200" cy="470" rx="150" ry="16" fill="rgba(23,48,47,.12)"/>' +
      // buste
      '<path d="M40 480 C44 400 92 360 150 352 L250 352 C308 360 356 400 360 480 Z" fill="url(#vSweat)"/>' +
      '<path d="M150 352 C160 380 240 380 250 352" fill="none" stroke="#0B5C55" stroke-width="10" stroke-linecap="round"/>' +
      '<path d="M176 372 L170 420 M224 372 L230 420" stroke="#E2B970" stroke-width="5" stroke-linecap="round"/>' +
      '<rect x="182" y="318" width="36" height="44" rx="14" fill="#D99A72"/>' +
      // tête (déformable)
      '<g class="viv-tete">' +
        '<g class="viv-cheveux-arriere"><circle cx="112" cy="170" r="30" fill="url(#vCheveux)"/><circle cx="288" cy="170" r="30" fill="url(#vCheveux)"/></g>' +
        '<ellipse cx="90" cy="215" rx="16" ry="22" fill="#E6A780"/><ellipse cx="310" cy="215" rx="16" ry="22" fill="#E6A780"/>' +
        '<ellipse cx="200" cy="205" rx="112" ry="122" fill="url(#vPeau)"/>' +
        '<ellipse cx="200" cy="300" rx="70" ry="22" fill="url(#vLueur)" class="viv-lueur"/>' +
        '<g class="viv-cheveux">' +
          [[118, 120, 34], [150, 96, 38], [192, 86, 40], [236, 94, 38], [272, 118, 34], [296, 150, 26], [104, 150, 26], [170, 112, 30], [222, 110, 30], [140, 132, 22], [258, 132, 22]]
            .map(function (c) { return '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '" fill="url(#vCheveux)"/>'; }).join('') +
          '<path d="M150 92 q10 -12 22 -4 M210 80 q12 -10 22 0 M256 104 q12 -6 18 6" stroke="#8A5A3C" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>' +
        '</g>' +
        '<ellipse cx="134" cy="250" rx="20" ry="11" fill="#FF7F6B" opacity=".28"/><ellipse cx="266" cy="250" rx="20" ry="11" fill="#FF7F6B" opacity=".28"/>' +
        // yeux
        ['g', 'd'].map(function (c) {
          var x = EYES[c][0], y = EYES[c][1];
          return '<g class="viv-oeil viv-oeil-' + c + '">' +
            '<ellipse cx="' + x + '" cy="' + y + '" rx="24" ry="26" fill="#fff"/>' +
            '<g clip-path="url(#vOeil' + c.toUpperCase() + ')">' +
              '<g class="viv-iris"><circle cx="' + x + '" cy="' + y + '" r="14" fill="url(#vIris)"/><circle cx="' + x + '" cy="' + y + '" r="7" fill="#140B07"/>' +
              '<circle cx="' + (x - 5) + '" cy="' + (y - 6) + '" r="4.500" fill="#fff"/><circle cx="' + (x + 5) + '" cy="' + (y + 5) + '" r="2" fill="#fff" opacity=".8"/></g>' +
              '<path class="viv-coeur" d="M' + x + ' ' + (y + 12) + ' C' + (x - 22) + ' ' + (y - 2) + ' ' + (x - 12) + ' ' + (y - 20) + ' ' + x + ' ' + (y - 8) + ' C' + (x + 12) + ' ' + (y - 20) + ' ' + (x + 22) + ' ' + (y - 2) + ' ' + x + ' ' + (y + 12) + 'Z" fill="#EF4466"/>' +
              '<rect class="viv-paupiere" x="' + (x - 28) + '" y="' + (y - 30) + '" width="56" height="60" fill="#EDB48C"/>' +
            '</g>' +
            '<path class="viv-cils" d="M' + (x - 25) + ' ' + y + ' Q' + x + ' ' + (y + 6) + ' ' + (x + 25) + ' ' + y + '" stroke="#2E1C14" stroke-width="4" fill="none" stroke-linecap="round"/>' +
            '<path class="viv-sourcil" d="M' + (x - 22) + ' ' + (y - 40) + ' Q' + x + ' ' + (y - 50) + ' ' + (x + 22) + ' ' + (y - 40) + '" stroke="#3A2216" stroke-width="7" fill="none" stroke-linecap="round"/>' +
            '<path class="viv-larme" d="M' + (x + (c === 'g' ? -14 : 14)) + ' ' + (y + 24) + ' q-6 12 0 16 q6 -4 0 -16z" fill="#7DD3FC"/>' +
          '</g>';
        }).join('') +
        '<path d="M196 226 Q190 246 200 250 Q208 250 206 244" stroke="#C98763" stroke-width="4" fill="none" stroke-linecap="round"/>' +
        '<path class="viv-bouche" d="' + BOUCHES.sourire + '" stroke="#7A3B2E" stroke-width="6" fill="none" stroke-linecap="round"/>' +
        '<ellipse class="viv-bouche-o" cx="200" cy="274" rx="12" ry="14" fill="#5B2318"/>' +
        '<g class="viv-rire"><path d="M176 264 Q200 300 224 264 Q200 272 176 264Z" fill="#5B2318"/><path d="M182 266 Q200 271 218 266 L216 272 Q200 276 184 272Z" fill="#fff"/></g>' +
      '</g>' +
      // mains + téléphone
      '<g class="viv-tel" transform="translate(200 418) rotate(-7)">' +
        '<rect x="-48" y="-82" width="96" height="166" rx="16" fill="#17202E"/>' +
        '<g clip-path="url(#vEcran)"><rect x="-41" y="-74" width="82" height="150" fill="#F8FAFC"/>' +
          '<g class="viv-fil">' +
          [0, 1, 2, 3, 4, 5, 6, 7].map(function (k) {
            var y = -70 + k * 52, c = ['#FFC2B6', '#99F6E4', '#F1D9A8', '#C7D2FE'][k % 4];
            return '<circle cx="-30" cy="' + (y + 6) + '" r="5" fill="' + c + '"/><rect x="-22" y="' + (y + 3) + '" width="40" height="5" rx="2.500" fill="#D7DEE5"/>' +
              '<rect x="-34" y="' + (y + 14) + '" width="68" height="30" rx="6" fill="' + c + '"/>';
          }).join('') +
          '</g></g>' +
        '<rect x="-14" y="-78" width="28" height="6" rx="3" fill="#0B0F17"/>' +
        '<g class="viv-pouce"><rect x="10" y="-6" width="26" height="46" rx="13" fill="#EDB48C"/></g>' +
      '</g>' +
      '<ellipse cx="146" cy="452" rx="30" ry="26" fill="#EDB48C"/><ellipse cx="254" cy="448" rx="30" ry="26" fill="#EDB48C"/>' +
      '</svg>';
  }

  function monter(boite) {
    boite.innerHTML = svgDessin() + '<div class="viv-effets"></div>';
    var svg = boite.querySelector('svg'), fx = boite.querySelector('.viv-effets');
    var tete = svg.querySelector('.viv-tete'), bouche = svg.querySelector('.viv-bouche'), boucheO = svg.querySelector('.viv-bouche-o'), rire = svg.querySelector('.viv-rire');
    var oeil = { g: svg.querySelector('.viv-oeil-g'), d: svg.querySelector('.viv-oeil-d') };
    function partie(c, sel) { return oeil[c].querySelector(sel); }
    var etat = {
      regardX: 0, regardY: 0, cibleX: 0, cibleY: .9, souris: -1e9, defile: -1e9, entree: performance.now(),
      cligne: 0, prochainCligne: performance.now() + 2500, humeur: null, humeurFin: 0, survol: null, survolDepuis: 0,
      acte: null, acteT: 0, acteI: 0, prochainIdle: 14000 + Math.random() * 6000, tirages: [],
      appui: null, sx: 0, sy: 0, vx: 0, vy: 0, inclX: 0, inclY: 0, endormi: false
    };
    function svgPt(cx, cy) { var r = svg.getBoundingClientRect(); return [(cx - r.left) / r.width * 400, (cy - r.top) / r.height * 480]; }
    function pctPt(x, y) { return [x / 4, y / 4.8]; }
    function emoji(e) { var s = window.Emoji3D && window.Emoji3D.src(e); return s ? '<img class="em3d" src="' + s + '" alt="">' : e; }
    function bulle(e, x, y, classe, duree) {
      var p = pctPt(x, y), el = document.createElement('span');
      el.className = 'viv-fx ' + (classe || 'monte'); el.innerHTML = emoji(e);
      el.style.left = p[0] + '%'; el.style.top = p[1] + '%';
      el.style.setProperty('--dx', (Math.random() * 140 - 70).toFixed(0) + 'px');
      el.style.setProperty('--r', (Math.random() * 60 - 30).toFixed(0) + 'deg');
      fx.appendChild(el); setTimeout(function () { el.remove(); }, duree || 2400);
    }
    function salve(n, liste) { for (var k = 0; k < n; k++) setTimeout(function () { bulle((liste || NOTIFS)[Math.floor(Math.random() * (liste || NOTIFS).length)], 200, 360); }, k * 140); }
    function humeur(h, ms) { etat.humeur = h; etat.humeurFin = performance.now() + ms; }
    function coup(dx, dy) { etat.vx += dx; etat.vy += dy; }
    function reveil(t) {
      etat.souris = t;
      if (etat.acte) { var a = etat.acte; etat.acte = null; if (a === 'dodo') { humeur('surpris', 700); coup(0, -.25); } }
      etat.endormi = false; etat.prochainIdle = 14000 + Math.random() * 6000;
    }

    /* actes quand on le laisse seul */
    var ACTES = {
      baille: [['baille', 1700], ['neutre', 500]],
      dodo: [['ferme', 1200], ['dodo', 5200], ['surpris', 900, function () { salve(4, ['🔔', '📩', '💬']); coup(0, -.3); }], ['sourire', 600]],
      ruse: [['gauche', 650], ['droite', 650], ['gauche', 450], ['malin', 900]],
      notif: [['notif', 300, function () { salve(6); }], ['rire', 1300], ['sourire', 500]],
      amour: [['coeurs', 1500, function () { salve(5, ['❤️', '😍', '💕']); }], ['sourire', 500]]
    };
    var ROTATION = ['notif', 'baille', 'ruse', 'amour', 'dodo'], rot = [];
    function lancer(nom, t) { etat.acte = ACTES[nom]; etat.acteNom = nom; etat.acteI = -1; suivant(t); }
    function suivant(t) {
      etat.acteI++;
      if (!etat.acte || etat.acteI >= etat.acte.length) { etat.acte = null; return; }
      etat.acteT = t; var e = etat.acte[etat.acteI]; if (e[2]) e[2]();
    }

    /* entrées */
    function surMouvement(ev) {
      var t = performance.now();
      var r = svg.getBoundingClientRect(), ex = r.left + r.width * .5, ey = r.top + r.height * (205 / 480);
      var dx = ev.clientX - ex, dy = ev.clientY - ey, d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / (r.width * .6));
      etat.cibleX = dx / d * k; etat.cibleY = dy / d * k;
      reveil(t);
      var p = svgPt(ev.clientX, ev.clientY), z = null;
      if (Math.hypot(p[0] - 162, p[1] - 205) < 30) z = 'oeilG';
      else if (Math.hypot(p[0] - 238, p[1] - 205) < 30) z = 'oeilD';
      else if (Math.abs(p[0] - 200) < 34 && Math.abs(p[1] - 272) < 20) z = 'bouche';
      else if (Math.abs(p[0] - 200) < 56 && p[1] > 330) z = 'tel';
      else if (Math.hypot((p[0] - 200) / 112, (p[1] - 205) / 122) < 1) z = 'visage';
      if (z !== etat.survol) { etat.survol = z; etat.survolDepuis = t; if (z === 'tel') salve(3); }
      if (etat.appui) {
        var q = svgPt(ev.clientX, ev.clientY), ddx = (q[0] - etat.appui.x) / 400, ddy = (q[1] - etat.appui.y) / 480;
        var L = Math.hypot(ddx, ddy), lim = .22;
        if (L > 0) { var f = lim * (1 - Math.exp(-L / lim)) / L; ddx *= f; ddy *= f; }
        etat.appui.dx = ddx; etat.appui.dy = ddy; if (L > .02) etat.appui.tire = true;
      }
    }
    function surAppui(ev) {
      var p = svgPt(ev.clientX, ev.clientY);
      if (Math.hypot((p[0] - 200) / 125, (p[1] - 205) / 135) > 1 && !(Math.abs(p[0] - 200) < 56 && p[1] > 330)) return;
      reveil(performance.now());
      etat.appui = { x: p[0], y: p[1], dx: 0, dy: 0, tire: false, t: performance.now() };
      try { svg.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
      ev.preventDefault();
    }
    function surRelache() {
      var a = etat.appui; if (!a) return;
      etat.appui = null; var t = performance.now();
      etat.vx += -a.dx * 6; etat.vy += -a.dy * 6;
      if (!a.tire) {
        if (a.y > 330) { salve(6, ['❤️', '😍', '🔥', '👍']); humeur('coeurs', 1300); }
        else if (Math.abs(a.x - 200) < 20 && Math.abs(a.y - 238) < 20) { humeur('ferme', 260); setTimeout(function () { humeur('surpris', 600); coup(0, .35); bulle('💨', 200, 270, 'souffle', 900); }, 260); }
        else if (a.y < 150) humeur('fache', 1100);
        else if (Math.abs(a.x - 200) < 34 && Math.abs(a.y - 272) < 22) humeur('rire', 1100);
        else humeur('surpris', 900);
        coup(0, .3);
        return;
      }
      etat.tirages = etat.tirages.filter(function (x) { return t - x < 14000; }); etat.tirages.push(t);
      var n = etat.tirages.length, L = Math.hypot(a.dx, a.dy);
      humeur(n >= 8 ? 'pleure' : n >= 5 ? 'fache' : L > .15 ? 'etourdi' : 'moue', n >= 5 ? 2600 : 900);
    }
    window.addEventListener('pointermove', surMouvement, { passive: true });
    svg.addEventListener('pointerdown', surAppui);
    window.addEventListener('pointerup', surRelache);
    window.addEventListener('pointercancel', surRelache);
    window.addEventListener('scroll', function () { etat.defile = performance.now(); }, { passive: true });
    document.querySelectorAll('.ac-cta').forEach(function (b) {
      b.addEventListener('pointerenter', function () { humeur('coeurs', 1e7); });
      b.addEventListener('pointerleave', function () { humeur('rire', 700); });
    });

    /* rendu */
    function poser(el, attr, v) { if (el.getAttribute(attr) !== v) el.setAttribute(attr, v); }
    var dernier = performance.now();
    (function boucle(t) {
      if (!document.body.contains(boite)) {
        window.removeEventListener('pointermove', surMouvement); window.removeEventListener('pointerup', surRelache); window.removeEventListener('pointercancel', surRelache);
        return;
      }
      requestAnimationFrame(boucle);
      var dt = Math.min(.04, (t - dernier) / 1000); dernier = t;
      // inactivité
      var calme = t - Math.max(etat.souris, etat.entree);
      if (etat.acte) { if (t - etat.acteT > etat.acte[etat.acteI][1]) suivant(t); }
      else if (!CALME && !etat.appui && calme > etat.prochainIdle) {
        if (!rot.length) rot = ROTATION.slice();
        lancer(rot.shift(), t); etat.souris = t - 1; etat.prochainIdle = 14000 + Math.random() * 6000;
      }
      // quelle expression
      var ex = 'regard';
      if (etat.appui) ex = etat.appui.tire ? (Math.hypot(etat.appui.dx, etat.appui.dy) > .15 ? 'peur' : 'aie') : 'surpris';
      else if (etat.acte) ex = etat.acte[etat.acteI][0];
      else if (etat.humeur && t < etat.humeurFin) ex = etat.humeur;
      else if (etat.survol && t - etat.survolDepuis > 80) ex = { oeilG: 'clinG', oeilD: 'clinD', bouche: 'rire', tel: 'regard', visage: 'regard' }[etat.survol];
      // où regarder
      var actif = t - etat.souris < 2600, tx = etat.cibleX, ty = etat.cibleY;
      if (t - etat.defile < 600 || !actif) { tx = 0; ty = .95; }
      if (ex === 'gauche') { tx = -1; ty = 0; } else if (ex === 'droite') { tx = 1; ty = 0; }
      var k = 1 - Math.exp(-dt * 14);
      etat.regardX += (tx - etat.regardX) * k; etat.regardY += (ty - etat.regardY) * k;
      // clignement
      if (t > etat.prochainCligne) { etat.cligne = t; etat.prochainCligne = t + 2200 + Math.random() * 3400; }
      var c = (t - etat.cligne) / 150, cl = c < 1 ? Math.sin(c * Math.PI) : 0;
      var fermeG = cl, fermeD = cl, coeurs = ex === 'coeurs', larmes = ex === 'pleure';
      if (ex === 'ferme' || ex === 'dodo') { fermeG = fermeD = 1; }
      else if (ex === 'baille' || ex === 'etourdi') { fermeG = fermeD = .8; }
      else if (ex === 'clinG') fermeG = 1; else if (ex === 'clinD') fermeD = 1;
      else if (ex === 'malin' || ex === 'fache') { fermeG = Math.max(fermeG, .35); fermeD = Math.max(fermeD, .35); }
      else if (ex === 'surpris' || ex === 'peur' || ex === 'notif') { fermeG = fermeD = 0; }
      else if (ex === 'aie') { fermeG = fermeD = .6; }
      ['g', 'd'].forEach(function (s) {
        var f = s === 'g' ? fermeG : fermeD, x = EYES[s][0], y = EYES[s][1];
        var ix = etat.regardX * 10, iy = etat.regardY * 9;
        if (ex === 'etourdi') { ix = Math.cos(t / 120 + (s === 'g' ? 0 : 2)) * 6; iy = Math.sin(t / 120 + (s === 'g' ? 0 : 2)) * 6; }
        var iris = partie(s, '.viv-iris');
        iris.setAttribute('transform', 'translate(' + ix.toFixed(2) + ' ' + iy.toFixed(2) + ')' + (ex === 'surpris' || ex === 'peur' ? ' translate(' + x + ' ' + y + ') scale(.78) translate(' + (-x) + ' ' + (-y) + ')' : ''));
        iris.style.display = coeurs ? 'none' : '';
        partie(s, '.viv-coeur').style.display = coeurs ? '' : 'none';
        partie(s, '.viv-coeur').setAttribute('transform', coeurs ? 'translate(' + x + ' ' + y + ') scale(' + (1 + Math.sin(t / 140) * .08).toFixed(3) + ') translate(' + (-x) + ' ' + (-y) + ')' : '');
        partie(s, '.viv-paupiere').setAttribute('transform', 'translate(0 ' + (-(1 - f) * 56).toFixed(2) + ')');
        partie(s, '.viv-cils').setAttribute('transform', 'translate(0 ' + ((f - 1) * 26 + (f > .9 ? 0 : -1)).toFixed(2) + ')');
        partie(s, '.viv-cils').style.opacity = f > .1 ? 1 : 0;
        var sy = ex === 'surpris' || ex === 'peur' || ex === 'notif' ? -10 : ex === 'fache' ? 6 : ex === 'pleure' || ex === 'moue' ? -4 : 0;
        var rot = ex === 'fache' ? (s === 'g' ? 14 : -14) : ex === 'pleure' || ex === 'moue' ? (s === 'g' ? -12 : 12) : 0;
        partie(s, '.viv-sourcil').setAttribute('transform', 'translate(0 ' + sy + ') rotate(' + rot + ' ' + x + ' ' + (y - 44) + ')');
        partie(s, '.viv-larme').style.display = larmes ? '' : 'none';
        partie(s, '.viv-larme').setAttribute('transform', larmes ? 'translate(0 ' + ((t / 12) % 40).toFixed(1) + ')' : '');
      });
      // bouche
      var o = { surpris: [12, 14], peur: [14, 18], notif: [10, 12], baille: [20, 28], aie: [12, 8] }[ex];
      var ri = ex === 'rire' || ex === 'coeurs';
      boucheO.style.display = o ? '' : 'none';
      if (o) { boucheO.setAttribute('rx', o[0]); boucheO.setAttribute('ry', o[1] * (ex === 'baille' ? .8 + Math.sin(t / 300) * .2 : 1)); }
      rire.style.display = ri ? '' : 'none';
      bouche.style.display = o || ri ? 'none' : '';
      poser(bouche, 'd', BOUCHES[{ fache: 'fache', pleure: 'moue', moue: 'moue', etourdi: 'neutre', dodo: 'neutre', ferme: 'neutre', malin: 'malin', clinG: 'malin', clinD: 'malin', gauche: 'neutre', droite: 'neutre' }[ex] || 'sourire']);
      // zzz
      if (ex === 'dodo' && (!etat.zzz || t - etat.zzz > 900)) { etat.zzz = t; bulle('💤', 280, 120, 'zzz', 2200); }
      // téléphone : scrolle quand il le regarde
      boite.classList.toggle('scrolle', etat.regardY > .6 && ex !== 'dodo');
      // tête : penche vers la souris, s'étire quand on la tire (ressort amorti)
      var cx = 0, cy = 0;
      if (etat.appui && etat.appui.tire) { cx = etat.appui.dx; cy = etat.appui.dy; }
      var K = etat.appui ? 60 : 160, D = etat.appui ? 12 : 7;
      etat.vx += ((cx - etat.sx) * K - etat.vx * D) * dt; etat.vy += ((cy - etat.sy) * K - etat.vy * D) * dt;
      etat.sx += etat.vx * dt; etat.sy += etat.vy * dt;
      var ix2 = actif ? etat.cibleX * 6 : 0, iy2 = (etat.regardY > .6 ? 8 : 0) + (ex === 'dodo' ? 14 : 0);
      etat.inclX += (ix2 - etat.inclX) * k * .4; etat.inclY += (iy2 - etat.inclY) * k * .4;
      var L = Math.hypot(etat.sx, etat.sy), ang = Math.atan2(etat.sy, etat.sx) * 180 / Math.PI, s1 = 1 + L * 1.6, s2 = 1 - L * .7;
      tete.setAttribute('transform', 'translate(' + (etat.inclX + etat.sx * 120).toFixed(2) + ' ' + (etat.inclY + etat.sy * 120).toFixed(2) + ') ' +
        'rotate(' + (etat.inclX * .6 + Math.sin(t / 1300) * 1.2).toFixed(2) + ' 200 320) ' +
        'translate(200 205) rotate(' + ang.toFixed(2) + ') scale(' + s1.toFixed(4) + ' ' + s2.toFixed(4) + ') rotate(' + (-ang).toFixed(2) + ') translate(-200 -205)');
    })(dernier);
    // une notification de temps en temps quand il scrolle
    var minuteur = setInterval(function () {
      if (!document.body.contains(boite)) { clearInterval(minuteur); return; }
      if (boite.classList.contains('scrolle') && !CALME) bulle(NOTIFS[Math.floor(Math.random() * NOTIFS.length)], 200, 360);
    }, 1100);
  }
  window.Vivant = { monter: monter };
})();
