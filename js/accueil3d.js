/* accueil3d.js — tunnel 3D piloté par le défilement (three.js) :
   on traverse un tunnel d'écrans et de notifications (l'addiction), puis on ressort vers la lumière
   où un téléphone 3D flotte. Accueil3D.monter(section) ; s'arrête tout seul quand la section quitte la page. */
(function () {
  'use strict';
  var CALME = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var COUL = ['#2DD4BF', '#FF7F6B', '#E2B970', '#14B8A6', '#F0644F'];
  var NOTIFS = [['❤️', '128'], ['🔔', '9+'], ['💬', '37'], ['▶️', ''], ['📸', '12'], ['🎵', ''], ['🎮', '3'], ['🎲', ''], ['🤖', ''], ['⏰', '2h'], ['👍', '1.2k'], ['📩', '5']];

  function webglOk() { try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (e) { return false; } }

  function textureEcran(THREE, k) {
    var c = document.createElement('canvas'); c.width = 256; c.height = 400;
    var x = c.getContext('2d'), col = COUL[k % COUL.length], n = NOTIFS[k % NOTIFS.length];
    var g = x.createLinearGradient(0, 0, 256, 400); g.addColorStop(0, '#0E2A29'); g.addColorStop(1, '#173F3D');
    x.fillStyle = g; rond(x, 4, 4, 248, 392, 34); x.fill();
    x.strokeStyle = col; x.lineWidth = 6; rond(x, 4, 4, 248, 392, 34); x.stroke();
    x.globalAlpha = .9; x.fillStyle = col; rond(x, 30, 40, 196, 150, 22); x.fill(); x.globalAlpha = 1;
    x.font = '96px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(n[0], 128, 118);
    x.fillStyle = 'rgba(255,252,247,.85)'; rond(x, 30, 222, 196, 18, 9); x.fill(); rond(x, 30, 256, 130, 18, 9); x.fill();
    x.fillStyle = 'rgba(255,252,247,.35)'; rond(x, 30, 300, 170, 14, 7); x.fill(); rond(x, 30, 330, 110, 14, 7); x.fill();
    if (n[1]) { x.fillStyle = '#E11D48'; x.beginPath(); x.arc(206, 52, 34, 0, Math.PI * 2); x.fill(); x.fillStyle = '#fff'; x.font = 'bold 30px sans-serif'; x.fillText(n[1], 206, 54); }
    var t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
  }
  function rond(x, a, b, w, hgt, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + hgt, r); x.arcTo(a + w, b + hgt, a, b + hgt, r); x.arcTo(a, b + hgt, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }

  function textureTelephone(THREE) {
    var c = document.createElement('canvas'); c.width = 512; c.height = 1024;
    var x = c.getContext('2d');
    var g = x.createLinearGradient(0, 0, 512, 1024); g.addColorStop(0, '#2DD4BF'); g.addColorStop(.55, '#0D9488'); g.addColorStop(1, '#FF7F6B');
    x.fillStyle = g; x.fillRect(0, 0, 512, 1024);
    x.fillStyle = 'rgba(255,255,255,.92)'; x.textAlign = 'center';
    x.font = '800 92px Tajawal, sans-serif'; x.fillText('SHIHTY+', 256, 470);
    x.font = '170px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; x.fillText('💚', 256, 700);
    x.fillStyle = 'rgba(255,255,255,.6)'; rond(x, 186, 60, 140, 30, 15); x.fill();
    return new THREE.CanvasTexture(c);
  }
  function corpsTelephone(THREE) {
    var w = 1.5, hgt = 3, r = .28, s = new THREE.Shape();
    s.moveTo(-w / 2 + r, -hgt / 2); s.lineTo(w / 2 - r, -hgt / 2); s.quadraticCurveTo(w / 2, -hgt / 2, w / 2, -hgt / 2 + r);
    s.lineTo(w / 2, hgt / 2 - r); s.quadraticCurveTo(w / 2, hgt / 2, w / 2 - r, hgt / 2); s.lineTo(-w / 2 + r, hgt / 2);
    s.quadraticCurveTo(-w / 2, hgt / 2, -w / 2, hgt / 2 - r); s.lineTo(-w / 2, -hgt / 2 + r); s.quadraticCurveTo(-w / 2, -hgt / 2, -w / 2 + r, -hgt / 2);
    var geo = new THREE.ExtrudeGeometry(s, { depth: .16, bevelEnabled: true, bevelThickness: .05, bevelSize: .05, bevelSegments: 6, curveSegments: 16 });
    geo.center();
    var groupe = new THREE.Group();
    groupe.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x14201F, metalness: .7, roughness: .25 })));
    var ecran = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 2.84), new THREE.MeshBasicMaterial({ map: textureTelephone(THREE) }));
    ecran.position.z = .14; groupe.add(ecran);
    return groupe;
  }

  function monter(section) {
    var scene = section.querySelector('.tunnel-scene'), canvas = section.querySelector('canvas'), beats = section.querySelectorAll('.beat');
    function majTextes(p) {
      beats.forEach(function (b) {
        var a = Number(b.getAttribute('data-a')), z = Number(b.getAttribute('data-b')), m = (a + z) / 2, l = (z - a) / 2;
        var k = Math.max(0, 1 - Math.abs(p - m) / l), e = Math.min(1, k * 1.8);
        b.style.opacity = e.toFixed(3);
        b.style.transform = 'translate3d(0,' + ((1 - e) * (p < m ? 40 : -40)).toFixed(1) + 'px,0) scale(' + (0.96 + e * 0.04).toFixed(3) + ')';
        b.style.filter = 'blur(' + ((1 - e) * 10).toFixed(1) + 'px)';
      });
    }
    function progression() {
      var r = section.getBoundingClientRect(), tot = section.offsetHeight - window.innerHeight;
      return Math.max(0, Math.min(1, -r.top / Math.max(1, tot)));
    }
    if (CALME || !window.THREE || !webglOk()) {
      section.classList.add('statique');
      var f = function () { if (!document.body.contains(section)) { window.removeEventListener('scroll', f); return; } majTextes(progression()); };
      window.addEventListener('scroll', f, { passive: true }); f();
      return;
    }
    var THREE = window.THREE;
    var rendu = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    rendu.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    var sc = new THREE.Scene(), nuit = new THREE.Color('#04201F'), jour = new THREE.Color('#FBF6EE');
    sc.background = nuit.clone(); sc.fog = new THREE.FogExp2(nuit.clone(), .055);
    var cam = new THREE.PerspectiveCamera(70, 1, .1, 200);
    var L = 110;
    // écrans le long du tunnel
    var tunnel = new THREE.Group(); sc.add(tunnel);
    var textures = [];
    for (var k = 0; k < 12; k++) textures.push(textureEcran(THREE, k));
    for (var i = 0; i < 96; i++) {
      var z = -i * (L / 96) - 4, ang = i * 2.399 + Math.random() * .4, rad = 3.6 + Math.random() * 1.4;
      var m = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.72), new THREE.MeshBasicMaterial({ map: textures[i % 12], transparent: true, side: THREE.DoubleSide }));
      m.position.set(Math.cos(ang) * rad, Math.sin(ang) * rad, z);
      m.lookAt(0, 0, z); m.rotateZ((Math.random() - .5) * .6);
      m.userData.v = (Math.random() - .5) * .6;
      tunnel.add(m);
    }
    // anneaux lumineux
    for (var a = 0; a < 14; a++) {
      var anneau = new THREE.Mesh(new THREE.TorusGeometry(5.6, .025, 8, 90), new THREE.MeshBasicMaterial({ color: COUL[a % 3], transparent: true, opacity: .7, blending: THREE.AdditiveBlending }));
      anneau.position.z = -a * 8 - 6; tunnel.add(anneau);
    }
    // poussière lumineuse
    var nP = 900, pos = new Float32Array(nP * 3);
    for (var q = 0; q < nP; q++) { var an = Math.random() * Math.PI * 2, rr = 1 + Math.random() * 6; pos[q * 3] = Math.cos(an) * rr; pos[q * 3 + 1] = Math.sin(an) * rr; pos[q * 3 + 2] = -Math.random() * (L + 20); }
    var gP = new THREE.BufferGeometry(); gP.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    sc.add(new THREE.Points(gP, new THREE.PointsMaterial({ color: 0xE2B970, size: .05, transparent: true, opacity: .8, blending: THREE.AdditiveBlending })));
    // sortie : lumière + téléphone 3D
    var portail = new THREE.Mesh(new THREE.CircleGeometry(7, 64), new THREE.MeshBasicMaterial({ color: 0xFFF8E7, transparent: true, opacity: 0 }));
    portail.position.z = -L - 8; sc.add(portail);
    sc.add(new THREE.AmbientLight(0xffffff, .55));
    var spot = new THREE.DirectionalLight(0xffffff, 1.1); spot.position.set(3, 4, 5); sc.add(spot);
    var lumCorail = new THREE.PointLight(0xFF7F6B, 1.6, 12); sc.add(lumCorail);
    var tel = corpsTelephone(THREE); tel.position.set(0, 0, -L - 4); sc.add(tel);

    function taille() {
      var w = scene.clientWidth, hgt = scene.clientHeight;
      rendu.setSize(w, hgt, false); cam.aspect = w / hgt; cam.fov = w < 700 ? 82 : 70; cam.updateProjectionMatrix();
    }
    taille(); window.addEventListener('resize', taille);
    var sp = 0, mx = 0, my = 0, smx = 0, smy = 0, t0 = performance.now(), dernier = t0;
    window.addEventListener('pointermove', function (e) { mx = e.clientX / window.innerWidth - .5; my = e.clientY / window.innerHeight - .5; }, { passive: true });
    function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    (function boucle(t) {
      if (!document.body.contains(canvas)) { rendu.dispose(); textures.forEach(function (x) { x.dispose(); }); window.removeEventListener('resize', taille); return; }
      requestAnimationFrame(boucle);
      var dt = Math.min(64, t - dernier); dernier = t;
      var r = section.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;   // hors écran : pas de calcul
      var p = progression();
      sp += (p - sp) * (1 - Math.pow(.88, dt / 16.7)); if (Math.abs(p - sp) < .0002) sp = p;
      smx += (mx - smx) * .06; smy += (my - smy) * .06;
      var vol = ease(Math.min(1, sp / .86)), temps = (t - t0) / 1000;
      cam.position.set(Math.sin(temps * .5) * .25 + smx * 1.2, Math.cos(temps * .4) * .2 - smy * .8, 6 - vol * (L + 2));
      cam.rotation.set(-smy * .15, -smx * .2, Math.sin(vol * Math.PI * 2) * .25);
      tunnel.rotation.z = temps * .05 + vol * 1.2;
      tunnel.children.forEach(function (m) { if (m.userData.v) m.rotation.z += m.userData.v * dt / 1000; });
      // sortie vers la lumière
      var sortie = Math.max(0, Math.min(1, (sp - .72) / .2));
      sc.background.copy(nuit).lerp(jour, sortie); sc.fog.color.copy(sc.background); sc.fog.density = .055 * (1 - sortie * .85);
      portail.material.opacity = sortie * .9;
      tel.visible = sp > .7;
      tel.rotation.set(Math.sin(temps * .8) * .12 - smy * .4, Math.sin(temps * .6) * .35 + smx * .8 + (1 - sortie) * 2.4, Math.sin(temps * .5) * .05);
      var etroit = cam.aspect < 1;
      tel.position.x = etroit ? 0 : -3.4;
      tel.position.y = (etroit ? -2.9 : 0) + Math.sin(temps * 1.2) * .12;
      tel.scale.setScalar(etroit ? .62 : 1);
      lumCorail.position.set(Math.cos(temps) * 2, 1.5, cam.position.z - 3);
      rendu.render(sc, cam);
      majTextes(sp);
    })(t0);
  }
  window.Accueil3D = { monter: monter };
})();
