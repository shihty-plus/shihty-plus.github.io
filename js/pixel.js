/* pixel.js — personnages en pixel art pastel (style jeu vidéo), dessinés en basse résolution puis agrandis.
   Pixel.canvas('fille' | 'garcon' | 'coeur' | 'etoile', echelle) → <canvas> */
(function () {
  'use strict';
  var CONTOUR = [74, 52, 82];
  function hex(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }

  /* Rend les bords nets (alpha 0 ou 255) puis ajoute un contour sombre d'un pixel, comme un sprite. */
  function finir(ctx, w, h, contour) {
    var img = ctx.getImageData(0, 0, w, h), d = img.data, plein = new Uint8Array(w * h);
    for (var i = 0; i < w * h; i++) { plein[i] = d[i * 4 + 3] > 110 ? 1 : 0; d[i * 4 + 3] = plein[i] ? 255 : 0; }
    if (contour !== false) {
      var c = contour || CONTOUR;
      for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
        var k = y * w + x; if (plein[k]) continue;
        var voisin = (x > 0 && plein[k - 1]) || (x < w - 1 && plein[k + 1]) || (y > 0 && plein[k - w]) || (y < h - 1 && plein[k + w]);
        if (voisin) { d[k * 4] = c[0]; d[k * 4 + 1] = c[1]; d[k * 4 + 2] = c[2]; d[k * 4 + 3] = 255; }
      }
    }
    ctx.putImageData(img, 0, 0);
  }
  function ell(ctx, x, y, rx, ry, c) { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); }
  function px(ctx, x, y, c, w, h) { ctx.fillStyle = c; ctx.fillRect(x, y, w || 1, h || 1); }

  function fille(ctx) {
    var H = ['#FFF1D6', '#F7C6D9', '#C7DCF6', '#FFE3EC'];
    // hijab : motif en patchwork pastel
    var hij = document.createElement('canvas'); hij.width = 44; hij.height = 50;
    var hc = hij.getContext('2d');
    ell(hc, 22, 21, 16, 18, '#000'); ell(hc, 22, 35, 14, 8, '#000');
    var m = hc.getImageData(0, 0, 44, 50);
    for (var y = 0; y < 50; y++) for (var x = 0; x < 44; x++) {
      var k = (y * 44 + x) * 4; if (m.data[k + 3] < 110) continue;
      var c = hex(H[(Math.floor((x + Math.floor(y / 6) * 3) / 6) + Math.floor(y / 6) * 2) % 4]);
      m.data[k] = c[0]; m.data[k + 1] = c[1]; m.data[k + 2] = c[2]; m.data[k + 3] = 255;
    }
    hc.putImageData(m, 0, 0);
    // pull crème
    ctx.fillStyle = '#EFE1C8'; ctx.beginPath(); ctx.moveTo(6, 50); ctx.quadraticCurveTo(8, 38, 22, 38); ctx.quadraticCurveTo(36, 38, 38, 50); ctx.fill();
    for (var r = 41; r < 50; r += 2) px(ctx, 9, r, '#DCCBAE', 26, 1);
    ctx.drawImage(hij, 0, 0);
    // visage
    ell(ctx, 22, 22, 9, 10.500, '#FCE4D8');
    ctx.save(); ctx.beginPath(); ctx.ellipse(22, 13, 11, 5, 0, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(hij, 0, 0); ctx.restore();   // bandeau du hijab sur le front
    px(ctx, 13, 22, '#F3CDBE', 1, 5); px(ctx, 30, 22, '#F3CDBE', 1, 5);
    // yeux (grands, style poupée)
    [[16, 19], [25, 19]].forEach(function (p, k) {
      px(ctx, p[0], p[1] - 1, '#3B2A30', 3, 1); px(ctx, k ? p[0] + 3 : p[0] - 1, p[1] - 2, '#3B2A30', 1, 1);   // cils
      px(ctx, p[0], p[1], '#6B4A55', 3, 4); px(ctx, p[0] + 1, p[1] + 1, '#2A1D22', 1, 2);
      px(ctx, p[0], p[1], '#FFFFFF'); px(ctx, p[0] + 2, p[1] + 3, '#C9A3B0');
    });
    px(ctx, 15, 25, '#F59AB1', 3, 1); px(ctx, 25, 25, '#F59AB1', 3, 1); px(ctx, 16, 26, '#F8B4C5', 1, 1); px(ctx, 26, 26, '#F8B4C5', 1, 1);
    px(ctx, 21, 24, '#F0C2B2', 2, 1);
    px(ctx, 20, 27, '#E2788F', 4, 1); px(ctx, 21, 28, '#EE97A8', 2, 1);
    px(ctx, 12, 26, '#C9C9D2', 1, 2); px(ctx, 31, 26, '#C9C9D2', 1, 2);   // créoles
  }
  function garcon(ctx) {
    // sweat à capuche bleu nuit
    ctx.fillStyle = '#28305A'; ctx.beginPath(); ctx.moveTo(4, 50); ctx.quadraticCurveTo(6, 34, 22, 33); ctx.quadraticCurveTo(38, 34, 40, 50); ctx.fill();
    px(ctx, 18, 34, '#1E2547', 8, 3);
    // cou + tête
    px(ctx, 19, 29, '#E9B897', 6, 5);
    ell(ctx, 22, 20, 9.500, 10.500, '#F2C6A6');
    // cheveux en bataille
    ell(ctx, 22, 12, 11, 6, '#3A2A24'); px(ctx, 12, 12, '#3A2A24', 4, 7); px(ctx, 28, 12, '#3A2A24', 4, 6);
    px(ctx, 16, 15, '#3A2A24', 3, 3); px(ctx, 24, 15, '#3A2A24', 2, 2);
    // yeux baissés vers le téléphone
    px(ctx, 16, 21, '#2B1E1A', 4, 1); px(ctx, 24, 21, '#2B1E1A', 4, 1); px(ctx, 17, 22, '#2B1E1A', 2, 1); px(ctx, 25, 22, '#2B1E1A', 2, 1);
    px(ctx, 21, 24, '#DCA98A', 2, 1); px(ctx, 20, 27, '#B9786A', 4, 1);
    // reflet bleu de l'écran sur le menton
    px(ctx, 17, 28, '#BFE3E4', 10, 1); px(ctx, 19, 29, '#A9DCE0', 6, 1);
    // mains + téléphone
    px(ctx, 15, 40, '#F2C6A6', 5, 4); px(ctx, 24, 40, '#F2C6A6', 5, 4);
    px(ctx, 18, 37, '#111827', 8, 9); px(ctx, 19, 38, '#5EEAD4', 6, 7); px(ctx, 20, 39, '#FFFFFF', 3, 1); px(ctx, 24, 38, '#FF7F6B', 1, 1);
  }
  var MOTIFS = {
    coeur: ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'],
    etoile: ['...#...', '..###..', '#######', '.#####.', '..###..', '.##.##.', '##...##']
  };
  function motif(nom, couleur) {
    var g = MOTIFS[nom], c = document.createElement('canvas'); c.width = g[0].length + 2; c.height = g.length + 2;
    var x = c.getContext('2d');
    g.forEach(function (ligne, y) { for (var i = 0; i < ligne.length; i++) if (ligne[i] === '#') px(x, i + 1, y + 1, couleur); });
    finir(x, c.width, c.height, [255, 255, 255]);
    return c;
  }
  function canvas(nom, couleur) {
    if (MOTIFS[nom]) return motif(nom, couleur || '#C9A7F5');
    var c = document.createElement('canvas'); c.width = 44; c.height = 50;
    var x = c.getContext('2d');
    if (nom === 'garcon') garcon(x); else fille(x);
    finir(x, 44, 50);
    c.className = 'pixel-perso';
    return c;
  }
  window.Pixel = { canvas: canvas };
})();
