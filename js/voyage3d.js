/* voyage3d.js — le monde 3D du questionnaire (three.js).
   Un chemin sinueux traverse 3 mondes ; chaque partie est une station (arche + panneau).
   L'étudiant marche d'une station à la suivante, la caméra le suit de derrière ; mini-carte en coin.
   Voyage3D.init({ parties, couleur(p), icone(p), monde(p) }) ; Voyage3D.monter(conteneur, de, a, arrivee) */
(function () {
  'use strict';
  var CALME = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var T3, opts, parties = [], N = 0;
  var rendu, scene, cam, courbe, pts = [], etu, ombre, panneaux = [], arches = [], anneau, flotteurs = [];
  var canvas, actif = false, enBoucle = false, anim = null, dernier = 0, carteSvg = null, carteMarq = null;
  var camPos, camVise, MONDES = { S1: 0, S2: 1, S3: 2 }, dtCourant = .016;

  function webglOk() { try { var c = document.createElement('canvas'); return !!(c.getContext('webgl') || c.getContext('experimental-webgl')); } catch (e) { return false; } }
  function aleatoire(g) { return function () { g = (g * 16807) % 2147483647; return (g - 1) / 2147483646; }; }

  /* ---------- textures de panneaux (emoji 3D + numéro) ---------- */
  function rond(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
  function texturePanneau(emoji, num, couleur, fait) {
    var c = document.createElement('canvas'); c.width = 256; c.height = 300;
    var x = c.getContext('2d'), tex = new T3.CanvasTexture(c);
    function dessiner(img) {
      x.clearRect(0, 0, 256, 300);
      x.fillStyle = 'rgba(23,48,47,.18)'; rond(x, 14, 22, 228, 228, 52); x.fill();
      x.fillStyle = '#FFFCF7'; rond(x, 10, 10, 228, 228, 52); x.fill();
      x.lineWidth = 10; x.strokeStyle = couleur; rond(x, 10, 10, 228, 228, 52); x.stroke();
      if (img) x.drawImage(img, 52, 44, 144, 144);
      else { x.font = '120px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(emoji, 124, 120); }
      x.fillStyle = couleur; x.beginPath(); x.arc(206, 214, 34, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#fff'; x.font = '800 36px Tajawal, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(fait ? '✓' : String(num), 206, 216);
      x.fillStyle = couleur; x.beginPath(); x.moveTo(104, 238); x.lineTo(144, 238); x.lineTo(124, 290); x.closePath(); x.fill();
      tex.needsUpdate = true;
    }
    dessiner(null);
    (function charger(essai) {
      var src = window.Emoji3D && window.Emoji3D.src(emoji);
      if (!src) { if (essai < 20) setTimeout(function () { charger(essai + 1); }, 300); return; }
      var im = new Image(); im.onload = function () { dessiner(im); }; im.src = src;
    })(0);
    tex.redessiner = function (f) { fait = f; dessiner(tex.image2 || null); };
    return tex;
  }
  function textureEmoji(emoji) {
    var c = document.createElement('canvas'); c.width = c.height = 128;
    var x = c.getContext('2d'), tex = new T3.CanvasTexture(c);
    x.font = '96px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(emoji, 64, 70); tex.needsUpdate = true;
    (function charger(essai) {
      var src = window.Emoji3D && window.Emoji3D.src(emoji);
      if (!src) { if (essai < 20) setTimeout(function () { charger(essai + 1); }, 300); return; }
      var im = new Image(); im.onload = function () { x.clearRect(0, 0, 128, 128); x.drawImage(im, 8, 8, 112, 112); tex.needsUpdate = true; }; im.src = src;
    })(0);
    return tex;
  }

  /* ---------- l'étudiant(e) : l'avatar 3D (assets/avatars/), animé en morceaux sur un canvas ----------
     De dos pendant la marche : les jambes (ou la jupe et les pieds) bougent vraiment, le corps se balance.
     À l'arrivée, il/elle se retourne vers la caméra (image de face) et respire. */
  var CW = 300, CH = 930;
  /* repères mesurés sur les images (fractions de l'image) */
  var GEO = {
    h: { hanche: .54, milieu: .485, jambeG: .18, jambeD: .9, main: .17, mainBas: .64 },
    f: { taille: .555, ourlet: .915, milieu: .5, main: .17, mainBas: .62 }
  };
  var genreCharge = null;
  function etudiant() {
    var g = new T3.Group();
    var cv = document.createElement('canvas'); cv.width = CW; cv.height = CH;
    var tex = new T3.CanvasTexture(cv); tex.anisotropy = 4;
    var sp = new T3.Sprite(new T3.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    sp.center.set(.5, 0); sp.scale.set(3.3 * CW / CH, 3.3, 1); g.add(sp);
    g.userData = { sprite: sp, cv: cv, x: cv.getContext('2d'), tex: tex, img: {}, phase: 0, vue: 'dos', tour: 1, cible: 'dos' };
    return g;
  }
  function chargerAvatar() {
    var gg = window.Avatar ? window.Avatar.genre() : 'f';
    if (gg === genreCharge) return; genreCharge = gg;
    var u = etu.userData; u.img = {}; u.genre = gg;
    ['dos', 'face'].forEach(function (n) {
      var im = new Image();
      im.onload = function () { if (gg === genreCharge) u.img[n] = im; };
      im.src = window.Avatar ? window.Avatar.src(n, gg) : 'assets/avatars/fille-' + n + '.webp';
    });
  }
  function boite(im) {   // l'image posée en bas, centrée, à la hauteur du canvas
    var ih = CH * .97, iw = ih * im.width / im.height;
    return { x: (CW - iw) / 2, y: CH - ih, w: iw, h: ih };
  }
  function morceau(x, im, b, clip, transfo) {
    x.save(); x.beginPath();
    clip.forEach(function (r) { x.rect(b.x + r[0] * b.w, b.y + r[1] * b.h, (r[2] - r[0]) * b.w, (r[3] - r[1]) * b.h); });
    x.clip(); if (transfo) transfo(x);
    x.drawImage(im, b.x, b.y, b.w, b.h); x.restore();
  }
  function dessinerDos(x, im, b, ph, v) {
    var s = Math.sin(ph), levG = Math.max(0, s) * v, levD = Math.max(0, -s) * v;
    var balance = s * .022 * v;
    if (etu.userData.genre === 'h') {
      var G = GEO.h, yh = b.y + G.hanche * b.h;
      [[G.jambeG, G.milieu, levG, 1], [G.milieu, G.jambeD, levD, -1]].forEach(function (j) {
        morceau(x, im, b, [[j[0], G.hanche - .01, j[1], 1.01]], function (c) {
          var cx = b.x + (j[0] + j[1]) / 2 * b.w;
          c.translate(cx + j[3] * j[2] * .02 * b.w, yh); c.scale(1, 1 - .15 * j[2]); c.translate(-cx, -yh);
        });
      });
      morceau(x, im, b, [[-.1, -.1, 1.1, G.hanche + .012], [-.1, G.hanche, G.main, G.mainBas]], function (c) {
        var cx = b.x + G.milieu * b.w; c.translate(cx, yh); c.rotate(balance); c.translate(-cx, -yh);
      });
    } else {
      var F = GEO.f, yt = b.y + F.taille * b.h;
      [[0, F.milieu, levG], [F.milieu, 1, levD]].forEach(function (j) {   // pieds sous la jupe
        morceau(x, im, b, [[j[0], F.ourlet - .03, j[1], 1.01]], function (c) { c.translate(0, -j[2] * .035 * b.h); });
      });
      morceau(x, im, b, [[F.main, F.taille - .005, 1.1, F.ourlet + .004], [-.1, F.mainBas, F.main, F.ourlet + .004]], function (c) {
        var k = s * .06 * v, cx = b.x + F.milieu * b.w;
        c.translate(cx, yt); c.transform(1, 0, k, 1, 0, 0); c.scale(1 + Math.abs(s) * .015 * v, 1); c.translate(-cx, -yt);
      });
      morceau(x, im, b, [[-.1, -.1, 1.1, F.taille + .004], [-.1, F.taille, F.main, F.mainBas]], function (c) {
        var cx = b.x + F.milieu * b.w; c.translate(cx, yt); c.rotate(balance); c.translate(-cx, -yt);
      });
    }
  }
  function marcher(temps, vitesse, dt) {
    var u = etu.userData, x = u.x;
    u.cible = anim && anim.fin !== null ? 'dos' : 'face';
    if (u.cible !== u.vue && u.tour >= 1) u.tour = 0;
    if (u.tour < 1) { u.tour = Math.min(1, u.tour + (dt || .016) / .45); if (u.tour >= .5) u.vue = u.cible; }
    u.phase += (dt || .016) * 11 * vitesse;
    var im = u.img[u.vue] || u.img.dos || u.img.face;
    x.clearRect(0, 0, CW, CH);
    if (!im) { u.tex.needsUpdate = true; return; }
    var b = boite(im), sx = u.tour < 1 ? Math.max(.02, Math.abs(1 - 2 * u.tour)) : 1;
    var bob = -(1 - Math.abs(Math.sin(u.phase))) * .014 * CH * vitesse;
    x.save();
    x.translate(CW / 2, CH); x.scale(sx, u.vue === 'face' ? 1 + Math.sin(temps * 2.2) * .006 : 1); x.translate(-CW / 2, -CH + bob);
    if (u.vue === 'dos') dessinerDos(x, im, b, u.phase, Math.min(1, vitesse * 1.3));
    else x.drawImage(im, b.x, b.y, b.w, b.h);
    x.restore();
    u.tex.needsUpdate = true;
  }

  /* ---------- construction du monde ---------- */
  function construire() {
    rendu = new T3.WebGLRenderer({ antialias: true, alpha: true });
    rendu.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    canvas = rendu.domElement; canvas.className = 'v3d-canvas';
    scene = new T3.Scene();
    scene.fog = new T3.Fog(0xF3EEE4, 26, 70);
    cam = new T3.PerspectiveCamera(55, 1, .1, 200);
    scene.add(new T3.HemisphereLight(0xFFFFFF, 0xCFEDE6, .7));
    var soleil = new T3.DirectionalLight(0xFFF1DC, .75); soleil.position.set(8, 14, 6); scene.add(soleil);

    // points du chemin : départ (index 0) puis 20 stations
    for (var k = -1; k < N; k++) pts.push(new T3.Vector3(Math.sin((k + 1) * .85) * 7 + Math.sin((k + 1) * .31) * 3, 0, -(k + 1) * 13));
    courbe = new T3.CatmullRomCurve3(pts, false, 'centripetal');
    var zMin = pts[pts.length - 1].z - 40, zMax = 30;
    function mondeDeZ(z) {
      for (var k = 0; k < N; k++) if (z > pts[k + 1].z - 6.5) return MONDES[opts.monde(parties[k])] || 0;
      return 2;
    }
    // sol coloré par monde
    var COUL = [new T3.Color(0x8FD6B4), new T3.Color(0xF2AFA2), new T3.Color(0xE8C788)];
    var solG = new T3.PlaneGeometry(140, zMax - zMin, 30, 160); solG.rotateX(-Math.PI / 2); solG.translate(0, 0, (zMax + zMin) / 2);
    var cols = [], p = solG.attributes.position, tmp = new T3.Color();
    for (var i = 0; i < p.count; i++) {
      var z = p.getZ(i), m = mondeDeZ(z), m2 = mondeDeZ(z - 8);
      tmp.copy(COUL[m]).lerp(COUL[m2], .5); cols.push(tmp.r, tmp.g, tmp.b);
    }
    solG.setAttribute('color', new T3.Float32BufferAttribute(cols, 3));
    scene.add(new T3.Mesh(solG, new T3.MeshLambertMaterial({ vertexColors: true })));
    // ruban du chemin
    var S = 700, pos = [], idx = [], larg = 1.25, haut = new T3.Vector3(0, 1, 0);
    for (var s = 0; s <= S; s++) {
      var t = s / S, c = courbe.getPoint(t), tg = courbe.getTangent(t), cote = new T3.Vector3().crossVectors(tg, haut).normalize();
      pos.push(c.x + cote.x * larg, .03, c.z + cote.z * larg, c.x - cote.x * larg, .03, c.z - cote.z * larg);
      if (s < S) { var a = s * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    var chG = new T3.BufferGeometry(); chG.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); chG.setIndex(idx); chG.computeVertexNormals();
    scene.add(new T3.Mesh(chG, new T3.MeshLambertMaterial({ color: 0xFFF8EC, side: T3.DoubleSide })));
    // pointillés au centre
    for (var d = 0; d < 260; d++) {
      var td = d / 260, pd = courbe.getPoint(td), tgd = courbe.getTangent(td);
      var dash = new T3.Mesh(new T3.PlaneGeometry(.16, .7), new T3.MeshBasicMaterial({ color: 0xE2B970 }));
      dash.rotation.x = -Math.PI / 2; dash.rotation.z = Math.atan2(tgd.x, tgd.z) * -1 + Math.PI; dash.position.set(pd.x, .05, pd.z); scene.add(dash);
    }
    // décor
    var r = aleatoire(7), echant = [];
    for (var e = 0; e <= 300; e++) echant.push(courbe.getPoint(e / 300));
    function loinDuChemin(x, z) { for (var q = 0; q < echant.length; q++) { var dx = echant[q].x - x, dz = echant[q].z - z; if (dx * dx + dz * dz < 12) return false; } return true; }
    var tronc = new T3.MeshStandardMaterial({ color: 0x8A5A3C, roughness: .9 }), feuilles = [0x2DD4BF, 0x14B8A6, 0x5EC28F].map(function (c) { return new T3.MeshStandardMaterial({ color: c, roughness: .8 }); });
    var ecranMat = [0xFF7F6B, 0x2DD4BF, 0x8B5CF6, 0xE2B970].map(function (c) { return new T3.MeshStandardMaterial({ color: 0x1F2937, emissive: c, emissiveIntensity: .55, roughness: .4 }); });
    var palme = new T3.MeshStandardMaterial({ color: 0x3FAE7A, roughness: .8 }), fleurs = [0xFF7F6B, 0xF9A8D4, 0xFDE68A].map(function (c) { return new T3.MeshStandardMaterial({ color: c }); });
    for (var n = 0; n < 420; n++) {
      var x = (r() - .5) * 90, zz = zMin + 20 + r() * (zMax - zMin - 20);
      if (!loinDuChemin(x, zz)) continue;
      var monde = mondeDeZ(zz), obj = new T3.Group(), sc = .7 + r() * .8;
      if (monde === 0) {
        var tr = new T3.Mesh(new T3.CylinderGeometry(.15, .2, 1.2, 8), tronc); tr.position.y = .6; obj.add(tr);
        var cone = new T3.Mesh(r() < .5 ? new T3.ConeGeometry(.9, 2.2, 10) : new T3.SphereGeometry(1, 12, 10), feuilles[n % 3]); cone.position.y = 2; obj.add(cone);
      } else if (monde === 1) {
        var h = 1.2 + r() * 2.4, bloc = new T3.Mesh(new T3.BoxGeometry(.9, h, .12), ecranMat[n % 4]); bloc.position.y = h / 2; bloc.rotation.y = r() * Math.PI; obj.add(bloc);
      } else {
        if (r() < .55) {
          var tp = new T3.Mesh(new T3.CylinderGeometry(.12, .18, 2.6, 8), tronc); tp.position.y = 1.3; tp.rotation.z = .12; obj.add(tp);
          for (var f = 0; f < 5; f++) { var fe = new T3.Mesh(new T3.ConeGeometry(.25, 1.6, 6), palme); fe.position.set(Math.cos(f * 1.25) * .6, 2.55, Math.sin(f * 1.25) * .6); fe.rotation.z = Math.cos(f * 1.25) * 1.2; fe.rotation.x = -Math.sin(f * 1.25) * 1.2; obj.add(fe); }
        } else {
          var tige = new T3.Mesh(new T3.SphereGeometry(.22, 10, 8), fleurs[n % 3]); tige.position.y = .25; obj.add(tige);
          var buis = new T3.Mesh(new T3.SphereGeometry(.45, 10, 8), feuilles[2]); buis.position.set(.35, .3, .1); obj.add(buis);
        }
      }
      obj.position.set(x, 0, zz); obj.scale.setScalar(sc); scene.add(obj);
    }
    // icônes flottantes dans le monde « internet »
    var flottE = ['❤️', '👍', '🔔', '💬', '📸', '🎮', '🎲', '🤖', '😂', '▶️'];
    for (var fl = 0; fl < 40; fl++) {
      var zf = zMin + r() * (zMax - zMin); if (mondeDeZ(zf) !== 1) continue;
      var sp = new T3.Sprite(new T3.SpriteMaterial({ map: textureEmoji(flottE[fl % flottE.length]), transparent: true }));
      sp.position.set((r() - .5) * 26, 2.5 + r() * 4, zf); sp.scale.setScalar(1.1); sp.userData.y = sp.position.y; sp.userData.p = r() * 6; scene.add(sp); flotteurs.push(sp);
    }
    // stations : arche + panneau
    parties.forEach(function (pa, k) {
      var pt = pts[k + 1], tg = courbe.getTangent((k + 1) / N), ang = Math.atan2(tg.x, tg.z), coul = new T3.Color(opts.couleur(pa));
      var arche = new T3.Group(), mat = new T3.MeshStandardMaterial({ color: coul, roughness: .5 });
      [-1.9, 1.9].forEach(function (x) { var pil = new T3.Mesh(new T3.CylinderGeometry(.2, .24, 3.2, 12), mat); pil.position.set(x, 1.6, 0); arche.add(pil); });
      var arc = new T3.Mesh(new T3.TorusGeometry(1.9, .2, 10, 30, Math.PI), mat); arc.position.y = 3.2; arche.add(arc);
      arche.position.copy(pt); arche.rotation.y = ang; scene.add(arche); arches.push(arche);
      var tex = texturePanneau(opts.icone(pa), k + 1, opts.couleur(pa), false);
      var pan = new T3.Sprite(new T3.SpriteMaterial({ map: tex, transparent: true }));
      pan.scale.set(2.1, 2.46, 1); pan.position.set(pt.x, 6.3, pt.z); pan.userData.tex = tex; scene.add(pan); panneaux.push(pan);
    });
    // départ
    var drap = new T3.Sprite(new T3.SpriteMaterial({ map: textureEmoji('🚩'), transparent: true })); drap.position.set(pts[0].x + 1.6, 1.2, pts[0].z); drap.scale.setScalar(1.6); scene.add(drap);
    // anneau lumineux de la station visée
    anneau = new T3.Mesh(new T3.RingGeometry(1.4, 1.75, 48), new T3.MeshBasicMaterial({ color: 0xFF7F6B, transparent: true, opacity: .8, side: T3.DoubleSide }));
    anneau.rotation.x = -Math.PI / 2; anneau.position.y = .06; scene.add(anneau);
    // étudiant + ombre
    etu = etudiant(); scene.add(etu);
    ombre = new T3.Mesh(new T3.CircleGeometry(.75, 24), new T3.MeshBasicMaterial({ color: 0x17302F, transparent: true, opacity: .18 }));
    ombre.rotation.x = -Math.PI / 2; ombre.position.y = .04; scene.add(ombre);
    camPos = new T3.Vector3(); camVise = new T3.Vector3();
  }

  /* ---------- mini-carte ---------- */
  function miniCarte(de, a) {
    var NS = 'http://www.w3.org/2000/svg', xs = pts.map(function (p) { return p.x; }), zs = pts.map(function (p) { return p.z; });
    var minX = Math.min.apply(null, xs) - 3, maxX = Math.max.apply(null, xs) + 3, minZ = Math.min.apply(null, zs) - 4, maxZ = Math.max.apply(null, zs) + 4;
    var W = 100, H = 100 * (maxZ - minZ) / (maxX - minX);
    function P(v) { return [((v.x - minX) / (maxX - minX) * W), ((maxZ - v.z) / (maxZ - minZ) * H)]; }
    var d = '';
    for (var s = 0; s <= 200; s++) { var q = P(courbe.getPoint(s / 200)); d += (s ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); }
    var svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H.toFixed(1)); svg.setAttribute('class', 'v3d-carte-svg');
    var html = '<path d="' + d + '" fill="none" stroke="#E8E2D6" stroke-width="4" stroke-linecap="round"/>';
    parties.forEach(function (pa, k) {
      var q = P(pts[k + 1]), st = k < a ? 'fait' : (k === a ? 'ici' : 'apres');
      html += '<circle cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="' + (st === 'ici' ? 5 : 3.4) + '" fill="' + (st === 'apres' ? '#DCD3C2' : opts.couleur(pa)) + '"' + (st === 'ici' ? ' stroke="#fff" stroke-width="1.6"' : '') + '/>';
    });
    html += '<circle class="v3d-carte-moi" r="4.6" fill="#FF7F6B" stroke="#fff" stroke-width="2"/>';
    svg.innerHTML = html;
    carteSvg = { P: P, H: H }; carteMarq = svg.querySelector('.v3d-carte-moi');
    return svg;
  }

  /* ---------- animation ---------- */
  function tDe(i, avant) { return Math.max(0, Math.min(1, (i + 1) / N - (avant ? .3 / N : 0))); }   // i = -1 : départ
  function poserEtudiant(t, vitesse, temps) {
    t = Math.max(0, Math.min(1, t || 0));
    var p = courbe.getPoint(t), tg = courbe.getTangent(t);
    etu.position.set(p.x, 0, p.z); etu.rotation.y = Math.atan2(tg.x, tg.z); ombre.position.set(p.x, .04, p.z);
    marcher(temps, vitesse, dtCourant);
    if (carteMarq) { var q = carteSvg.P(p); carteMarq.setAttribute('cx', q[0].toFixed(2)); carteMarq.setAttribute('cy', q[1].toFixed(2)); }
    return { p: p, tg: tg };
  }
  function boucle(now) {
    if (!actif || !document.body.contains(canvas)) { enBoucle = false; actif = false; return; }
    requestAnimationFrame(boucle);
    var dt = Math.min(.05, (now - dernier) / 1000); dernier = now; dtCourant = dt;
    var temps = now / 1000, t, vitesse = 0;
    if (anim.fin === null) t = anim.t1;
    else {
      var x = Math.max(0, Math.min(1, (now - anim.debut) / anim.duree)), e = x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
      t = anim.t0 + (anim.t1 - anim.t0) * e; vitesse = x < 1 ? Math.min(1, Math.sin(x * Math.PI) * 2.2) : 0;
      if (x >= 1) { anim.fin = null; if (anim.arrivee) { var f = anim.arrivee; anim.arrivee = null; f(); } }
    }
    var o = poserEtudiant(t, vitesse, temps);
    // caméra : derrière l'étudiant en marche, de trois-quarts à l'arrivée
    var cote = new T3.Vector3().crossVectors(o.tg, new T3.Vector3(0, 1, 0)).normalize();
    var arret = vitesse < .05 && anim.fin === null;
    var cp = arret ? o.p.clone().addScaledVector(o.tg, -8).addScaledVector(cote, 3).add(new T3.Vector3(0, 6, 0))
      : o.p.clone().addScaledVector(o.tg, -7.5).add(new T3.Vector3(0, 4.6, 0));
    var cv = o.p.clone().addScaledVector(o.tg, arret ? 1.5 : 5).add(new T3.Vector3(0, arret ? -.6 : 1.4, 0));
    var k = 1 - Math.exp(-dt * (anim.saut ? 60 : 3));
    anim.saut = false;
    camPos.lerp(cp, k); camVise.lerp(cv, k);
    cam.position.copy(camPos); cam.lookAt(camVise);
    anneau.position.x = pts[anim.a + 1].x; anneau.position.z = pts[anim.a + 1].z; anneau.scale.setScalar(1 + Math.sin(temps * 3) * .06);
    flotteurs.forEach(function (s) { s.position.y = s.userData.y + Math.sin(temps * 1.4 + s.userData.p) * .35; });
    panneaux.forEach(function (s, i) { s.position.y = 6.3 + Math.sin(temps * 1.6 + i) * .15; });
    rendu.render(scene, cam);
  }
  function taille() {
    if (!canvas || !canvas.parentNode) return;
    var w = canvas.parentNode.clientWidth, h = canvas.parentNode.clientHeight;
    rendu.setSize(w, h, false); cam.aspect = w / Math.max(1, h); cam.fov = w < 600 ? 66 : 55; cam.updateProjectionMatrix();
  }

  function init(o) {
    if (T3 || !window.THREE || !webglOk()) return;
    T3 = window.THREE; opts = o; parties = o.parties; N = parties.length;
    construire();
    window.addEventListener('resize', taille);
  }
  /* de, a : index des stations (0..19) ; de = -1 pour le départ ; de === a : pas de marche. */
  function monter(boite, de, a, arrivee) {
    if (!T3) { if (arrivee) arrivee(); return false; }
    boite.appendChild(canvas);
    chargerAvatar();
    var mini = boite.parentNode.querySelector('.v3d-carte');
    if (mini) { mini.replaceChildren(miniCarte(de, a)); }
    panneaux.forEach(function (s, i) { s.material.opacity = i < a ? .75 : 1; });
    var marche = de !== a && !CALME;
    anim = { t0: tDe(de, de >= 0), t1: tDe(a, true), debut: performance.now() + 350, duree: marche ? 2600 + Math.abs(a - de) * 500 : 0, fin: marche ? 1 : null, a: a, arrivee: arrivee, saut: true };
    if (!marche) { anim.fin = null; setTimeout(function () { if (anim.arrivee) { var f = anim.arrivee; anim.arrivee = null; f(); } }, 30); }
    taille();
    // on met la caméra directement en place au départ
    var o = poserEtudiant(anim.t0, 0, 0);
    camPos.copy(o.p).addScaledVector(o.tg, -7.5).add(new T3.Vector3(0, 4.6, 0)); camVise.copy(o.p).addScaledVector(o.tg, 5).add(new T3.Vector3(0, 1.4, 0));
    actif = true; dernier = performance.now();
    if (!enBoucle) { enBoucle = true; requestAnimationFrame(boucle); }
    boite.onclick = function () { if (anim && anim.fin !== null) anim.debut = performance.now() - anim.duree; };   // toucher = arriver tout de suite
    return true;
  }
  window.Voyage3D = { init: init, monter: monter, avatarCanvas: function () { return etu ? etu.userData.cv : null; } };
})();
