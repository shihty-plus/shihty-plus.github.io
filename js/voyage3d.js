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

  /* ---------- Bitto, la mascotte : il sautille de dos d'une station à l'autre ----------
     Pendant le trajet : image de dos, petits sauts (étirement en l'air, écrasement à l'atterrissage).
     À l'arrivée : il se retourne vers la caméra et salue. */
  var CW = 360, CH = 400, HAUT = 2.8, charge = false;
  function etudiant() {
    var g = new T3.Group();
    var cv = document.createElement('canvas'); cv.width = CW; cv.height = CH;
    var tex = new T3.CanvasTexture(cv); tex.anisotropy = 4;
    var sp = new T3.Sprite(new T3.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    sp.center.set(.5, 0); sp.scale.set(HAUT * CW / CH, HAUT, 1); g.add(sp);
    g.userData = { sprite: sp, cv: cv, x: cv.getContext('2d'), tex: tex, img: {}, phase: 0, vue: 'dos', tour: 1, cible: 'dos', sautRepos: 0 };
    return g;
  }
  function chargerAvatar() {
    if (charge) return; charge = true;
    var u = etu.userData;
    ['dos', 'salut'].forEach(function (n) {
      var im = new Image(); im.onload = function () { u.img[n] = im; };
      im.src = window.Avatar ? window.Avatar.src(n) : 'assets/bitto/' + n + '.webp';
    });
  }
  function marcher(temps, vitesse, dt) {
    var u = etu.userData, x = u.x; dt = dt || .016;
    u.cible = anim && anim.fin !== null ? 'dos' : 'salut';
    if (u.cible !== u.vue && u.tour >= 1) u.tour = 0;
    if (u.tour < 1) { u.tour = Math.min(1, u.tour + dt / .4); if (u.tour >= .5) u.vue = u.cible; }
    // sauts : pendant le trajet, et de temps en temps à l'arrêt
    var enSaut = vitesse > .05;
    if (enSaut) u.phase += dt * 2.4 * Math.PI * Math.max(.6, vitesse);
    else if (u.sautRepos) { u.phase += dt * 2.6 * Math.PI; if (u.phase >= Math.PI) { u.phase = 0; u.sautRepos = 0; } }
    else { u.phase = 0; if (!CALME && Math.random() < .004) u.sautRepos = 1; }
    var s = Math.abs(Math.sin(u.phase)), haut = (enSaut || u.sautRepos) ? s : 0;
    u.sprite.position.y = haut * (enSaut ? .75 : .35);
    var etire = haut > .25 ? (haut - .25) * .12 : 0, ecrase = (enSaut || u.sautRepos) && haut < .25 ? (.25 - haut) * .5 : 0;
    var im = u.img[u.vue] || u.img.dos || u.img.salut;
    x.clearRect(0, 0, CW, CH);
    if (im) {
      var ih = CH * .96, iw = ih * im.width / im.height, sx = u.tour < 1 ? Math.max(.02, Math.abs(1 - 2 * u.tour)) : 1;
      x.save(); x.translate(CW / 2, CH);
      x.scale(sx * (1 - etire * .5 + ecrase), 1 + etire - ecrase + (u.vue === 'salut' ? Math.sin(temps * 2.4) * .01 : 0));
      x.rotate(enSaut ? Math.sin(u.phase * 2) * .04 : 0);
      x.drawImage(im, -iw / 2, -ih, iw, ih); x.restore();
    }
    u.tex.needsUpdate = true;
    if (ombre) ombre.scale.setScalar(1 - haut * .35);
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
    var cv = o.p.clone().addScaledVector(o.tg, arret ? 1.5 : 5).add(new T3.Vector3(0, arret ? -2.1 : 1.4, 0));
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
