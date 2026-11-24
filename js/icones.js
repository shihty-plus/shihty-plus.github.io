/* icones.js — jeu d'icônes SHIHTY+ (dessiné pour le site) : trait encre, aplats sarcelle/corail/sable,
   ombre décalée. Icones.svg(emoji) → texte SVG, ou null si l'emoji n'a pas d'icône. */
(function () {
  'use strict';
  var K = '#17302F', W = '#FFFFFF', T = '#5EEAD4', t = '#CCFBF1', C = '#FF8A75', c = '#FFE1DA', S = '#F2C46B', s = '#FBEBCB',
    B = '#7CC4F2', b = '#DCEFFC', G = '#7BD389', g = '#DDF5E1', P = '#C4A7F5', R = '#E5484D', Y = '#FFD45E', N = '#9A6B4B', Q = '#C9CED3', F = '#FFD9A8';

  function C_(cx, cy, r, f) { return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + (f || 'none') + '"/>'; }
  function E_(cx, cy, rx, ry, f) { return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + (f || 'none') + '"/>'; }
  function R_(x, y, w, h, r, f) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (r || 0) + '" fill="' + (f || 'none') + '"/>'; }
  function P_(d, f) { return '<path d="' + d + '" fill="' + (f || 'none') + '"/>'; }
  function L_(d) { return '<path d="' + d + '" fill="none"/>'; }
  function X_(x, y, txt, taille, f) { return '<text x="' + x + '" y="' + y + '" font-family="Arial,sans-serif" font-weight="800" font-size="' + taille + '" text-anchor="middle" fill="' + (f || K) + '" stroke="none">' + txt + '</text>'; }
  function env(corps) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><style>.o *{fill:' + K + '!important;stroke:none!important}text{stroke:none}</style>' +
      '<g class="o" opacity=".13" transform="translate(2.200 2.600)">' + corps + '</g>' +
      '<g stroke="' + K + '" stroke-width="2.300" stroke-linejoin="round" stroke-linecap="round">' + corps + '</g></svg>';
  }

  /* ---------- visages ---------- */
  function visage(o) {
    o = o || {};
    var f = o.peau || Y, z = C_(24, 25, 17, f);
    if (o.joues) z += E_(15, 30, 3.400, 2, C) + E_(33, 30, 3.400, 2, C);
    var yeux = o.yeux || 'point';
    if (yeux === 'point') z += C_(18, 22, 1.800, K) + C_(30, 22, 1.800, K);
    else if (yeux === 'ferme') z += L_('M15 22 q3 2.500 6 0 M27 22 q3 2.500 6 0');
    else if (yeux === 'heureux') z += L_('M15 23 q3 -3 6 0 M27 23 q3 -3 6 0');
    else if (yeux === 'serre') z += L_('M15 20 l5 2.500 -5 2.500 M33 20 l-5 2.500 5 2.500');
    else if (yeux === 'coeur') z += P_('M18 25 l-4 -4 a2.300 2.300 0 0 1 4 -2.300 a2.300 2.300 0 0 1 4 2.300z', R) + P_('M30 25 l-4 -4 a2.300 2.300 0 0 1 4 -2.300 a2.300 2.300 0 0 1 4 2.300z', R);
    else if (yeux === 'spirale') z += L_('M18 22 m-3 0 a3 3 0 1 0 3 -3 a1.600 1.600 0 1 1 -1.600 1.600 M30 22 m-3 0 a3 3 0 1 0 3 -3 a1.600 1.600 0 1 1 -1.600 1.600');
    else if (yeux === 'ronds') z += C_(18, 22, 3, W) + C_(30, 22, 3, W) + C_(18, 22.500, 1.300, K) + C_(30, 22.500, 1.300, K);
    else if (yeux === 'etoile') z += P_('M18 17.500 l1.400 2.900 3.200 .4 -2.300 2.200 .6 3.100 -2.900 -1.500 -2.900 1.500 .6 -3.100 -2.300 -2.200 3.200 -.4z', R) + P_('M30 17.500 l1.400 2.900 3.200 .4 -2.300 2.200 .6 3.100 -2.900 -1.500 -2.900 1.500 .6 -3.100 -2.300 -2.200 3.200 -.4z', R);
    else if (yeux === 'mi') z += L_('M15 23 h6 M27 23 h6') + P_('M15.500 23 q2.500 2.200 5 0z M27.500 23 q2.500 2.200 5 0z', K);
    if (o.sourcils === 'fache') z += L_('M14 16 l7 3 M34 16 l-7 3');
    if (o.sourcils === 'triste') z += L_('M14 18 l6 -2.500 M34 18 l-6 -2.500');
    var m = o.bouche || 'sourire';
    if (m === 'sourire') z += L_('M18 31 q6 5 12 0');
    else if (m === 'grand') z += P_('M16 29 h16 q-1 9 -8 9 q-7 0 -8 -9z', W);
    else if (m === 'plat') z += L_('M18 32 h12');
    else if (m === 'triste') z += L_('M18 34 q6 -5 12 0');
    else if (m === 'ouvert') z += E_(24, 33, 3.500, 4, K);
    else if (m === 'baille') z += E_(24, 33, 4.500, 5.500, K) + E_(24, 35.500, 2.800, 2, R);
    else if (m === 'vague') z += L_('M17 33 q2 -2.500 3.500 0 t3.500 0 t3.500 0 t3.500 0');
    if (o.larmes) z += P_('M13 25 q-2.500 4 0 6 q2.500 -2 0 -6z', B) + P_('M35 25 q-2.500 4 0 6 q2.500 -2 0 -6z', B);
    if (o.goutte) z += P_('M37 12 q-3 4.500 0 6.500 q3 -2 0 -6.500z', B);
    if (o.z) z += X_(40, 13, 'z', 11, K);
    if (o.mains) z += E_(9, 36, 5, 4, F) + E_(39, 36, 5, 4, F);
    if (o.doigt) z += R_(22, 28, 4, 10, 2, F);
    if (o.cache) z += E_(18, 22, 6, 4.500, N) + E_(30, 22, 6, 4.500, N);
    return z;
  }
  /* ---------- personnes (buste) ---------- */
  function buste(o) {
    o = o || {};
    var habit = o.habit || T, z = '';
    if (o.cheveux === 'long') z += P_('M11 24 q-1 -15 13 -15 q14 0 13 15 v12 h-26z', o.couleur || N);
    z += P_('M8 46 q2 -13 16 -13 q14 0 16 13z', habit);
    z += C_(24, 20, 9, o.peau || F);
    if (o.cheveux === 'court' || !o.cheveux) z += P_('M15 18 q1 -9 9 -9 q8 0 9 9 q-4 -4 -9 -3 q-5 -1 -9 3z', o.couleur || N);
    if (o.cheveux === 'long') z += P_('M15 18 q1 -9 9 -9 q8 0 9 9 q-6 -3 -9 -1 q-4 -2 -9 1z', o.couleur || N);
    if (o.cheveux === 'chignon') z += C_(24, 9, 4, Q) + P_('M15 18 q1 -8 9 -8 q8 0 9 8 q-4 -3 -9 -2 q-5 -1 -9 2z', Q);
    if (o.cheveux === 'bebe') z += L_('M24 11 q2 -3 0 -4');
    z += C_(21, 20, 1, K) + C_(27, 20, 1, K) + L_('M21.500 24 q2.500 2 5 0');
    if (o.toque) z += P_('M12 12 l12 -6 12 6 -12 6z', K) + L_('M33 13 v6');
    if (o.lunettes) z += C_(21, 20, 2.800) + C_(27, 20, 2.800) + L_('M23.800 20 h0.400');
    if (o.beret) z += E_(24, 11, 10, 3.500, C);
    if (o.chapeau) z += P_('M12 13 h24 l-4 -7 h-16z', K);
    if (o.sorcier) z += P_('M13 13 h22 l-9 -12z', P);
    if (o.noeud) z += P_('M20 36 l4 2 4 -2 v4 l-4 -2 -4 2z', K);
    if (o.portable) z += R_(13, 34, 22, 12, 2, Q) + C_(24, 40, 1.300, W);
    if (o.tableau) z += R_(30, 28, 14, 10, 1, G);
    if (o.main) z += E_(38, 12, 3.500, 4.500, F) + L_('M36 16 l-3 14');
    if (o.tel) z += R_(33, 26, 7, 12, 1.500, K) + E_(36, 38, 3.500, 3, F);
    if (o.bras === 'cercle') z += L_('M10 34 q-4 -26 14 -26 q18 0 14 26');
    if (o.bras === 'hausse') z += L_('M8 36 l-4 -8 M40 36 l4 -8');
    return z;
  }
  function duo(o1, o2, coeur) {
    var a = buste(o1).replace(/<(\w+) /g, '<$1 transform="translate(-4 6) scale(.78)" '), bb = buste(o2).replace(/<(\w+) /g, '<$1 transform="translate(14.500 6) scale(.78)" ');
    return a + bb + (coeur ? P_('M24 13 l-3.500 -3.500 a2 2 0 0 1 3.500 -2 a2 2 0 0 1 3.500 2z', R) : '');
  }
  function famille() {
    return buste({ cheveux: 'court' }).replace(/<(\w+) /g, '<$1 transform="translate(-5 4) scale(.7)" ') +
      buste({ cheveux: 'long', habit: C }).replace(/<(\w+) /g, '<$1 transform="translate(19 4) scale(.7)" ') +
      buste({ cheveux: 'court', habit: S }).replace(/<(\w+) /g, '<$1 transform="translate(13 16) scale(.55)" ');
  }
  /* ---------- familles paramétriques ---------- */
  function lune(phase) {   // 0 = nouvelle, 1 = pleine
    var z = C_(24, 24, 16, '#2A3F5F');
    if (phase >= 1) return C_(24, 24, 16, S) + C_(19, 20, 2.500, '#E5B45A') + C_(29, 29, 3, '#E5B45A');
    if (phase <= 0) return z + C_(24, 24, 16);
    var k = Math.cos(phase * Math.PI) * 16;
    return z + P_('M24 8 a16 16 0 0 1 0 32 a' + Math.abs(k).toFixed(1) + ' 16 0 0 ' + (k > 0 ? 1 : 0) + ' 0 -32z', S);
  }
  function horloge(h) {
    var a = (h % 12) / 12 * Math.PI * 2;
    return C_(24, 25, 16, W) + L_('M24 25 v-10') + L_('M24 25 l' + (Math.sin(a) * 8).toFixed(1) + ' ' + (-Math.cos(a) * 8).toFixed(1)) + C_(24, 25, 1.800, K);
  }
  function chiffre(n) { return R_(8, 8, 32, 32, 8, T) + X_(24, 32, n, 20); }
  function coeur(f, casse) { return P_('M24 40 l-13 -13 a8 8 0 0 1 13 -11 a8 8 0 0 1 13 11z', f) + (casse ? L_('M24 16 l-3 7 5 4 -3 7') : ''); }
  function pastille(f, carre) { return carre ? R_(9, 9, 30, 30, 4, f) : C_(24, 24, 15, f); }
  function etoile(f, n) {
    var d = '';
    for (var i = 0; i < 10; i++) { var a = i * Math.PI / 5 - Math.PI / 2, r = i % 2 ? 7 : 16; d += (i ? 'L' : 'M') + (24 + Math.cos(a) * r).toFixed(1) + ' ' + (25 + Math.sin(a) * r).toFixed(1); }
    return P_(d + 'z', f || S) + (n ? C_(39, 10, 2, f || S) + C_(9, 12, 1.500, f || S) : '');
  }
  function etoile8(f) {   // étoile du zellige (khatam)
    return R_(13, 13, 22, 22, 0, f) + '<rect x="13" y="13" width="22" height="22" fill="' + f + '" transform="rotate(45 24 24)"/>';
  }
  function pouce(bas) {
    var z = P_('M14 22 h6 l5 -11 q4 0 4 4 l-1 6 h9 q3 0 3 3 l-3 13 q-1 3 -4 3 h-13z', F) + R_(8, 22, 7, 20, 2, T);
    return bas ? '<g transform="rotate(180 24 26)">' + z + '</g>' : z;
  }

  var I = {
    // visages
    '😊': visage({ joues: 1, yeux: 'heureux' }), '🙂': visage(), '😄': visage({ yeux: 'heureux', bouche: 'grand' }), '😂': visage({ yeux: 'heureux', bouche: 'grand', larmes: 1 }),
    '😅': visage({ yeux: 'heureux', bouche: 'grand', goutte: 1 }), '😍': visage({ yeux: 'coeur', bouche: 'grand' }), '😐': visage({ bouche: 'plat' }),
    '😞': visage({ yeux: 'ferme', bouche: 'triste', sourcils: 'triste' }), '🙁': visage({ bouche: 'triste' }), '😣': visage({ yeux: 'serre', bouche: 'vague' }),
    '😡': visage({ peau: '#FF9B82', sourcils: 'fache', bouche: 'triste' }), '😢': visage({ bouche: 'triste', sourcils: 'triste', larmes: 1 }),
    '😰': visage({ yeux: 'ronds', bouche: 'ouvert', goutte: 1 }), '😴': visage({ yeux: 'ferme', bouche: 'ouvert', z: 1 }), '😵‍💫': visage({ yeux: 'spirale', bouche: 'vague' }),
    '😮': visage({ yeux: 'ronds', bouche: 'ouvert' }), '🥱': visage({ yeux: 'mi', bouche: 'baille', sourcils: 'triste' }),
    '😠': visage({ peau: '#FF9B82', sourcils: 'fache', bouche: 'triste' }), '🤩': visage({ yeux: 'etoile', bouche: 'grand' }),
    '🤗': visage({ yeux: 'heureux', mains: 1 }), '🤫': visage({ bouche: 'plat', doigt: 1 }), '🙈': visage({ cache: 1, bouche: 'grand' }),
    // personnes
    '👨': buste({ cheveux: 'court' }), '👩': buste({ cheveux: 'long', habit: C }), '🧑': buste({ cheveux: 'court', habit: S }), '👶': buste({ cheveux: 'bebe', habit: b }),
    '👵': buste({ cheveux: 'chignon', habit: P }), '🧑‍🎓': buste({ toque: 1 }), '👨‍🎓': buste({ toque: 1, habit: B }), '👩‍🎓': buste({ toque: 1, cheveux: 'long', habit: C }),
    '👨‍🏫': buste({ lunettes: 1, tableau: 1 }), '👩‍🏫': buste({ lunettes: 1, cheveux: 'long', habit: C, tableau: 1 }), '🧑‍🏫': buste({ lunettes: 1, tableau: 1, habit: S }),
    '👩‍💻': buste({ cheveux: 'long', habit: C, portable: 1 }), '🧑‍💻': buste({ portable: 1 }), '🧑‍🎨': buste({ beret: 1, habit: S }), '🤵': buste({ habit: K, noeud: 1 }),
    '💁': buste({ cheveux: 'long', habit: P, main: 1 }), '🙋': buste({ cheveux: 'long', habit: C, main: 1 }), '🙋‍♂️': buste({ main: 1 }), '🙆': buste({ cheveux: 'long', habit: G, bras: 'cercle' }),
    '🤷': buste({ habit: S, bras: 'hausse' }), '🧍': buste({ habit: B }), '🕵️': buste({ chapeau: 1, habit: N }), '🧙': buste({ sorcier: 1, habit: P }), '🤳': buste({ tel: 1 }),
    '🧑‍🤝‍🧑': duo({}, { cheveux: 'long', habit: C }), '👫': duo({}, { cheveux: 'long', habit: C }), '💑': duo({}, { cheveux: 'long', habit: C }, 1),
    '👪': famille(), '👨‍👩‍👦': famille(), '👨‍👩‍👧': famille(),
    '🧘': C_(24, 12, 6, F) + P_('M14 30 q10 -12 20 0z', T) + P_('M6 38 q18 -10 36 0 q-18 6 -36 0z', T),
    '🏃': C_(30, 9, 5, F) + L_('M28 15 l-4 12 -8 6 M24 27 l8 4 0 10 M27 18 l9 4 M26 18 l-8 2'),
    '🚴': C_(12, 36, 7) + C_(36, 36, 7) + L_('M12 36 l8 -12 h10 l6 12 M20 24 l4 12 h6') + C_(29, 12, 4, F),
    // lunes, pastilles, horloges, chiffres
    '🌑': lune(0), '🌒': lune(.25), '🌓': lune(.5), '🌔': lune(.75), '🌕': lune(1),
    '🌙': P_('M30 8 a16 16 0 1 0 10 26 a13 13 0 1 1 -10 -26z', S),
    '🟢': pastille(G), '🟡': pastille(Y), '🟠': pastille('#FFA65C'), '🔴': pastille(R), '🟥': pastille(R, 1), '⚪': pastille(W),
    '🕐': horloge(1), '🕓': horloge(4), '🕖': horloge(7), '🕙': horloge(10), '🕛': horloge(0),
    '⏰': L_('M10 12 l6 -4 M38 12 l-6 -4') + horloge(2) + L_('M14 40 l-3 4 M34 40 l3 4'),
    '⏱️': R_(21, 4, 6, 5, 1, K) + horloge(1.500),
    '1️⃣': chiffre(1), '3️⃣': chiffre(3), '5️⃣': chiffre(5), '7️⃣': chiffre(7),
    // cœurs, mains, signes
    '❤️': coeur(R), '💙': coeur(B), '💚': coeur(G), '💛': coeur(Y), '🧡': coeur('#FFA65C'), '🤍': coeur(W), '💔': coeur(R, 1),
    '💞': '<g transform="translate(-6 -4) scale(.7)">' + coeur(R) + '</g><g transform="translate(14 10) scale(.6)">' + coeur(C) + '</g>',
    '👍': pouce(), '👎': pouce(1),
    '✋': P_('M15 26 v-12 a2.500 2.500 0 0 1 5 0 v8 v-12 a2.500 2.500 0 0 1 5 0 v12 v-10 a2.500 2.500 0 0 1 5 0 v12 v-6 a2.500 2.500 0 0 1 5 0 v10 q0 12 -12 12 q-8 0 -11 -7 l-3 -7 q2 -3 5 0z', F),
    '👋': '<g transform="rotate(-20 24 26)">' + P_('M15 26 v-12 a2.500 2.500 0 0 1 5 0 v8 v-12 a2.500 2.500 0 0 1 5 0 v12 v-10 a2.500 2.500 0 0 1 5 0 v12 v-6 a2.500 2.500 0 0 1 5 0 v10 q0 12 -12 12 q-8 0 -11 -7 l-3 -7 q2 -3 5 0z', F) + '</g>' + L_('M38 8 q4 3 4 8 M6 30 q0 5 4 8'),
    '🙏': P_('M23 6 q-3 0 -4 4 l-5 16 q-2 6 -6 10 l6 8 q6 -4 8 -10 l1 -2z', F) + P_('M25 6 q3 0 4 4 l5 16 q2 6 6 10 l-6 8 q-6 -4 -8 -10 l-1 -2z', F) + L_('M24 8 v24'),
    '💪': P_('M10 38 q-2 -14 8 -18 l2 -8 q3 -4 7 -1 l-3 9 q12 -2 16 8 q2 10 -10 10z', F),
    '🤝': P_('M4 22 l10 -4 10 6 10 -6 10 4 v8 l-12 8 q-3 2 -6 0 l-14 -8z', F) + L_('M18 28 l6 5 M22 25 l6 5'),
    '✅': R_(8, 8, 32, 32, 8, G) + L_('M15 24 l6 6 12 -12'), '✔': L_('M12 25 l8 8 16 -18'), '✖️': L_('M13 13 l22 22 M35 13 l-22 22'),
    '❌': L_('M12 12 l24 24 M36 12 l-24 24').replace('fill="none"', 'fill="none" stroke="' + R + '" stroke-width="5"'),
    '⭕': C_(24, 24, 14).replace('fill="none"', 'fill="none" stroke="' + R + '" stroke-width="5"'),
    '🚫': C_(24, 24, 16, W) + L_('M13 13 l22 22').replace('fill="none"', 'fill="none" stroke="' + R + '" stroke-width="4"'),
    '⚠️': P_('M24 7 l18 32 h-36z', Y) + L_('M24 19 v10') + C_(24, 34, 1.500, K),
    '➡️': R_(6, 6, 36, 36, 9, T) + L_('M14 24 h20 M27 17 l7 7 -7 7'), '⬆️': R_(6, 6, 36, 36, 9, T) + L_('M24 34 v-20 M17 21 l7 -7 7 7'),
    '⬇️': R_(6, 6, 36, 36, 9, T) + L_('M24 14 v20 M17 27 l7 7 7 -7'), '🔁': R_(6, 6, 36, 36, 9, T) + L_('M14 22 q0 -6 6 -6 h14 l-4 -4 M34 26 q0 6 -6 6 h-14 l4 4'),
    '▶️': R_(6, 6, 36, 36, 9, C) + P_('M19 15 l13 9 -13 9z', W),
    '⭐': etoile(S), '🌟': etoile(Y, 1), '✨': P_('M20 8 q2 12 12 14 q-10 2 -12 14 q-2 -12 -12 -14 q10 -2 12 -14z', S) + P_('M36 28 q1 6 6 7 q-5 1 -6 7 q-1 -6 -6 -7 q5 -1 6 -7z', Y),
    '🏅': L_('M17 4 l7 14 M31 4 l-7 14') + C_(24, 30, 11, S) + etoile(W).replace('<path', '<path transform="translate(9.600 13) scale(.6)"'),
    '🎖️': P_('M16 4 h16 l-4 14 h-8z', C) + C_(24, 30, 11, S), '🏆': P_('M14 8 h20 v10 q0 10 -10 10 q-10 0 -10 -10z', S) + L_('M14 12 h-6 q0 8 7 9 M34 12 h6 q0 8 -7 9 M24 28 v6') + R_(15, 34, 18, 8, 2, N),
    // nature & temps
    '☀️': C_(24, 24, 9, Y) + L_('M24 5 v5 M24 38 v5 M5 24 h5 M38 24 h5 M10.500 10.500 l3.500 3.500 M34 34 l3.500 3.500 M37.500 10.500 l-3.500 3.500 M14 34 l-3.500 3.500'),
    '☁️': P_('M12 36 a8 8 0 0 1 2 -15.700 a10 10 0 0 1 19 -2 a8 8 0 0 1 3 17.700z', W),
    '🌦️': C_(16, 16, 7, Y) + P_('M14 34 a7 7 0 0 1 2 -13.700 a9 9 0 0 1 17 -1.500 a7 7 0 0 1 3 15.200z', W) + L_('M18 39 l-2 5 M26 39 l-2 5 M34 39 l-2 5'),
    '⚡': P_('M27 4 l-14 24 h10 l-4 16 16 -24 h-10z', Y), '🌀': L_('M24 24 m-3 0 a3 3 0 1 1 3 3 a6 6 0 1 1 6 -6 a10 10 0 1 1 -10 -10 a14 14 0 1 1 -14 14'),
    '🌈': L_('M6 36 a18 18 0 0 1 36 0').replace('fill="none"', 'fill="none" stroke="' + R + '" stroke-width="4"') + L_('M12 36 a12 12 0 0 1 24 0').replace('fill="none"', 'fill="none" stroke="' + Y + '" stroke-width="4"') + L_('M18 36 a6 6 0 0 1 12 0').replace('fill="none"', 'fill="none" stroke="' + B + '" stroke-width="4"'),
    '🌊': P_('M4 30 q6 -10 12 -4 q4 -10 12 -6 q6 -6 16 0 v18 h-40z', B) + L_('M4 36 q5 -4 10 0 t10 0 t10 0 t10 0'),
    '🌍': C_(24, 24, 17, B) + P_('M14 13 q6 2 4 8 q-6 2 -4 8 q-6 -6 0 -16z M28 9 q6 4 8 12 q-6 0 -8 6 q-2 -8 0 -18z', G), '🌐': C_(24, 24, 17, t) + E_(24, 24, 7, 17) + L_('M7 24 h34 M10 15 h28 M10 33 h28'),
    '🌱': L_('M24 42 v-16') + P_('M24 28 q-14 2 -14 -12 q12 0 14 12z', G) + P_('M24 24 q12 0 14 -10 q-12 -2 -14 10z', G),
    '🌲': P_('M24 4 l12 16 h-6 l8 12 h-28 l8 -12 h-6z', G) + R_(21, 32, 6, 10, 1, N), '🌳': C_(24, 18, 13, G) + R_(21, 28, 6, 14, 1, N),
    '🌴': L_('M24 44 q-2 -16 2 -26').replace('fill="none"', 'fill="none" stroke-width="4"') + P_('M26 18 q-10 -10 -20 0 q10 -4 20 0z M26 18 q10 -10 18 0 q-8 -4 -18 0z M26 18 q-2 -12 8 -14 q-6 4 -8 14z', G),
    '🌵': R_(19, 8, 10, 34, 5, G) + P_('M19 26 h-6 q-3 0 -3 -3 v-6', 'none') + P_('M29 22 h6 q3 0 3 -3 v-5', 'none'),
    '🌸': [0, 1, 2, 3, 4].map(function (i) { var a = i * 1.2566 - Math.PI / 2; return C_((24 + Math.cos(a) * 9).toFixed(1), (24 + Math.sin(a) * 9).toFixed(1), 7, '#F9B4CB'); }).join('') + C_(24, 24, 4, Y),
    '🌼': [0, 1, 2, 3, 4, 5, 6, 7].map(function (i) { var a = i * .785; return E_((24 + Math.cos(a) * 10).toFixed(1), (24 + Math.sin(a) * 10).toFixed(1), 5, 5, W); }).join('') + C_(24, 24, 6, Y),
    '🌾': L_('M24 44 v-34') + [0, 1, 2, 3].map(function (i) { return E_(20, 14 + i * 7, 3, 4.500, S) + E_(28, 14 + i * 7, 3, 4.500, S); }).join(''),
    '🌿': L_('M10 40 q10 -12 28 -30') + P_('M16 32 q-6 -8 2 -12 q4 6 -2 12z M24 24 q-4 -10 4 -12 q2 8 -4 12z M22 34 q8 -4 12 2 q-6 4 -12 -2z', G),
    '🍃': P_('M8 40 q0 -26 32 -32 q2 30 -32 32z', G) + L_('M8 40 q12 -12 24 -24'),
    '🍋': E_(24, 26, 15, 11, Y) + C_(10, 26, 2, Y), '🍒': L_('M18 30 q2 -16 14 -22 M30 30 q-2 -12 2 -22') + C_(16, 34, 7, R) + C_(32, 34, 7, R),
    '⛰️': P_('M4 40 l14 -24 6 8 6 -12 14 28z', T) + P_('M26 20 l4 -8 3 6 -3 2z', W), '🪨': P_('M6 38 l6 -16 12 -8 14 6 4 18z', Q), '💧': P_('M24 6 q14 18 0 34 q-14 -16 0 -34z', B),
    '🦋': P_('M24 24 q-14 -18 -18 -4 q0 8 18 4z M24 24 q14 -18 18 -4 q0 8 -18 4z M24 26 q-12 4 -12 12 q8 0 12 -12z M24 26 q12 4 12 12 q-8 0 -12 -12z', P) + L_('M24 16 v20'),
    '🕊️': P_('M6 26 q10 -2 16 4 q10 -16 22 -18 q-4 14 -14 20 q-10 6 -24 -6z', W) + C_(15, 26, 1, K),
    '🐢': E_(24, 26, 14, 10, G) + C_(40, 26, 4, G) + L_('M14 34 l-2 5 M34 34 l2 5'), '👻': P_('M10 42 v-20 a14 14 0 0 1 28 0 v20 l-5 -4 -4 4 -5 -4 -5 4 -4 -4z', W) + C_(19, 22, 2, K) + C_(29, 22, 2, K),
    '👾': R_(10, 14, 28, 20, 3, P) + R_(16, 20, 4, 4, 0, K) + R_(28, 20, 4, 4, 0, K) + L_('M14 34 l-4 6 M34 34 l4 6 M16 14 l-4 -6 M32 14 l4 -6'),
    '🤖': R_(10, 14, 28, 24, 6, Q) + C_(18, 25, 3, B) + C_(30, 25, 3, B) + L_('M24 14 v-6') + C_(24, 6, 2, R) + L_('M18 32 h12'),
    '🧠': P_('M24 10 q-4 -4 -10 0 q-6 2 -6 9 q-4 4 0 10 q2 8 10 8 q4 4 6 -1z', '#F9B4CB') + P_('M24 10 q4 -4 10 0 q6 2 6 9 q4 4 0 10 q-2 8 -10 8 q-4 4 -6 -1z', '#F9B4CB') + L_('M24 10 v26'),
    // maison & lieux
    '🏠': P_('M8 22 l16 -14 16 14 v20 h-32z', c) + R_(20, 30, 8, 12, 1, N) + P_('M5 23 l19 -17 19 17', 'none'),
    '🏡': P_('M8 22 l16 -14 16 14 v20 h-32z', s) + R_(20, 30, 8, 12, 1, C) + C_(40, 34, 5, G), '🏘️': P_('M4 26 l10 -10 10 10 v16 h-20z', c) + P_('M24 22 l10 -10 10 10 v20 h-20z', s),
    '🏢': R_(12, 6, 24, 36, 2, b) + [0, 1, 2, 3].map(function (i) { return R_(17, 11 + i * 7, 4, 4, 0, W) + R_(27, 11 + i * 7, 4, 4, 0, W); }).join(''),
    '🏙️': R_(6, 16, 12, 26, 1, b) + R_(18, 6, 12, 36, 1, t) + R_(30, 20, 12, 22, 1, s),
    '🏛️': P_('M6 16 l18 -10 18 10z', s) + R_(6, 38, 36, 4, 0, s) + L_('M11 18 v18 M19 18 v18 M29 18 v18 M37 18 v18'),
    '🏫': P_('M6 20 l18 -12 18 12 v22 h-36z', s) + R_(20, 30, 8, 12, 1, T) + C_(24, 20, 3, W) + L_('M24 8 v-5 h6'),
    '🏝️': E_(24, 38, 18, 5, S) + L_('M24 36 q-2 -14 2 -22') + P_('M26 14 q-10 -8 -18 0 q8 -2 18 0z M26 14 q8 -8 16 0 q-8 -2 -16 0z', G),
    '🏖️': E_(24, 40, 20, 4, S) + P_('M8 22 q16 -16 32 0z', C) + L_('M24 16 l2 24'), '🏕️': P_('M6 40 l18 -30 18 30z', S) + P_('M24 22 l-6 18 h12z', N),
    '🗺️': P_('M6 12 l12 -4 12 4 12 -4 v28 l-12 4 -12 -4 -12 4z', s) + L_('M18 8 v28 M30 12 v28') + L_('M10 28 q6 -8 12 -2 t14 -6').replace('fill="none"', 'fill="none" stroke="' + R + '" stroke-dasharray="2 3"'),
    '🧭': C_(24, 24, 17, W) + P_('M24 10 l5 14 -5 14 -5 -14z', R) + C_(24, 24, 2, K), '📍': P_('M24 44 q-14 -16 -14 -24 a14 14 0 0 1 28 0 q0 8 -14 24z', R) + C_(24, 20, 5, W),
    '🚩': L_('M12 44 v-38') + P_('M12 8 h24 l-6 8 6 8 h-24z', R),
    // écrans & internet
    '📱': R_(14, 4, 20, 40, 5, K) + R_(17, 9, 14, 28, 2, T) + C_(24, 40, 1.300, W), '📲': R_(16, 4, 20, 40, 5, K) + R_(19, 9, 14, 28, 2, T) + L_('M4 24 h10 M10 20 l4 4 -4 4'),
    '🤳': R_(30, 4, 14, 24, 3, K) + buste({}).replace(/<(\w+) /g, '<$1 transform="translate(-6 6) scale(.85)" '),
    '💻': R_(9, 10, 30, 20, 3, K) + R_(12, 13, 24, 14, 1, T) + P_('M4 34 h40 l-3 5 h-34z', Q), '🖥️': R_(6, 8, 36, 24, 3, K) + R_(9, 11, 30, 18, 1, T) + L_('M24 32 v6 M16 40 h16'),
    '⌨️': R_(4, 14, 40, 20, 4, Q) + [0, 1, 2].map(function (r) { return [0, 1, 2, 3, 4, 5].map(function (k) { return R_(8 + k * 6, 18 + r * 5, 4, 3, .5, W); }).join(''); }).join(''),
    '📺': R_(6, 12, 36, 26, 4, Q) + R_(10, 16, 22, 18, 2, T) + L_('M18 12 l-5 -6 M30 12 l5 -6') + C_(37, 21, 1.500, K) + C_(37, 28, 1.500, K),
    '📸': R_(4, 14, 40, 26, 5, Q) + C_(24, 27, 8, W) + C_(24, 27, 4, K) + R_(14, 9, 10, 5, 1, Q) + C_(37, 20, 2, Y), '📡': P_('M8 30 a16 16 0 0 0 20 -20z', W) + L_('M18 20 l12 -12 M18 34 l-4 10 h16 l-4 -10'),
    '📶': R_(8, 32, 6, 10, 1, T) + R_(18, 24, 6, 18, 1, T) + R_(28, 16, 6, 26, 1, T) + R_(38, 8, 6, 34, 1, Q),
    '💬': P_('M8 10 h32 q4 0 4 4 v16 q0 4 -4 4 h-18 l-8 7 v-7 h-6 q-4 0 -4 -4 v-16 q0 -4 4 -4z', W) + C_(17, 22, 2, K) + C_(24, 22, 2, K) + C_(31, 22, 2, K),
    '📩': R_(6, 14, 36, 24, 4, W) + L_('M6 16 l18 12 18 -12') + L_('M24 2 v10 M20 8 l4 4 4 -4').replace('fill="none"', 'fill="none" stroke="' + R + '"'),
    '🔔': P_('M12 34 q2 -4 2 -12 a10 10 0 0 1 20 0 q0 8 2 12z', Y) + C_(24, 38, 3, Y) + L_('M24 8 v4'), '🔍': C_(20, 20, 11, b) + L_('M28 28 l12 12').replace('fill="none"', 'fill="none" stroke-width="4"'),
    '🔒': R_(10, 20, 28, 22, 5, S) + L_('M16 20 v-6 a8 8 0 0 1 16 0 v6') + C_(24, 31, 2.500, K), '🔐': R_(10, 20, 28, 22, 5, S) + L_('M16 20 v-6 a8 8 0 0 1 16 0 v6') + C_(24, 31, 2.500, K) + C_(38, 12, 5, Y),
    '🔑': C_(16, 18, 8, Y) + C_(16, 18, 2.500, W) + L_('M22 24 l16 16 M32 34 l4 -4 M36 38 l4 -4'), '🛡️': P_('M24 4 l16 6 v12 q0 14 -16 22 q-16 -8 -16 -22 v-12z', T),
    '🔥': P_('M24 44 q-14 0 -14 -14 q0 -10 8 -16 q0 8 6 8 q-2 -12 8 -18 q0 10 6 16 q4 4 4 10 q0 14 -18 14z', '#FF9A4C') + P_('M24 44 q-6 0 -6 -6 q0 -5 6 -10 q6 5 6 10 q0 6 -6 6z', Y),
    '💥': P_('M24 4 l4 12 12 -6 -6 12 12 4 -12 4 6 12 -12 -6 -4 12 -4 -12 -12 6 6 -12 -12 -4 12 -4 -6 -12 12 6z', '#FF9A4C'),
    '💡': C_(24, 20, 12, Y) + R_(19, 32, 10, 8, 2, Q) + L_('M20 22 l4 4 4 -4'), '💤': X_(16, 38, 'Z', 18, B) + X_(30, 26, 'Z', 13, B) + X_(40, 16, 'Z', 9, B),
    '👀': E_(16, 24, 7, 10, W) + E_(32, 24, 7, 10, W) + C_(18, 26, 3, K) + C_(34, 26, 3, K), '👁️': P_('M4 24 q20 -22 40 0 q-20 22 -40 0z', W) + C_(24, 24, 7, B) + C_(24, 24, 3, K),
    // école, travail, argent
    '🎓': P_('M4 18 l20 -10 20 10 -20 10z', K) + P_('M12 22 v10 q12 8 24 0 v-10 l-12 6z', N) + L_('M40 20 v12'), '🎒': R_(12, 14, 24, 28, 8, C) + R_(17, 26, 14, 10, 3, c) + L_('M18 14 v-4 a6 6 0 0 1 12 0 v4'),
    '📚': R_(8, 30, 32, 8, 2, T) + R_(10, 22, 28, 8, 2, C) + R_(8, 14, 30, 8, 2, S), '📗': R_(12, 6, 24, 36, 3, G) + L_('M17 6 v36'), '📘': R_(12, 6, 24, 36, 3, B) + L_('M17 6 v36'),
    '📜': P_('M12 8 h22 q4 0 4 4 v26 q0 4 -4 4 h-22 q4 0 4 -4 v-26 q0 -4 -4 -4z', s) + L_('M18 16 h12 M18 22 h12 M18 28 h8'), '📝': R_(10, 6, 26, 34, 3, W) + L_('M15 14 h16 M15 20 h16 M15 26 h10') + P_('M30 38 l12 -16 3 3 -12 16 -4 1z', Y),
    '✏️': P_('M8 40 l4 -12 22 -22 8 8 -22 22z', Y) + P_('M8 40 l4 -12 8 8z', F), '📰': R_(6, 10, 36, 30, 3, W) + R_(11, 15, 12, 10, 1, b) + L_('M27 16 h10 M27 22 h10 M11 30 h26 M11 35 h20'),
    '📅': R_(6, 10, 36, 32, 4, W) + R_(6, 10, 36, 9, 4, R) + L_('M15 6 v8 M33 6 v8') + X_(24, 37, '17', 13), '📆': R_(6, 10, 36, 32, 4, W) + R_(6, 10, 36, 9, 4, T) + L_('M15 6 v8 M33 6 v8') + X_(24, 37, '30', 13),
    '🗓️': R_(6, 10, 36, 32, 4, W) + R_(6, 10, 36, 9, 4, S) + L_('M15 6 v8 M33 6 v8 M12 26 h24 M12 33 h24'),
    '📈': R_(6, 6, 36, 36, 4, W) + L_('M12 34 l8 -8 6 4 10 -14 M30 16 h6 v6').replace('fill="none"', 'fill="none" stroke="' + R + '"'), '📊': R_(6, 6, 36, 36, 4, W) + R_(12, 24, 6, 12, 1, T) + R_(21, 16, 6, 20, 1, C) + R_(30, 20, 6, 16, 1, S),
    '💼': R_(6, 16, 36, 24, 4, N) + L_('M18 16 v-4 h12 v4 M6 26 h36'), '💰': P_('M18 10 h12 l-3 6 q13 6 13 16 q0 10 -16 10 q-16 0 -16 -10 q0 -10 13 -16z', S) + X_(24, 36, '$', 14),
    '💸': R_(8, 18, 28, 16, 3, G) + C_(22, 26, 4) + P_('M36 20 q6 -8 10 -4 q-4 2 -10 4z M8 20 q-6 -8 -10 -4 q4 2 10 4z', W),
    '💳': R_(4, 12, 40, 26, 4, B) + R_(4, 18, 40, 5, 0, K) + R_(9, 28, 10, 4, 1, W), '🪙': C_(24, 24, 16, S) + C_(24, 24, 11) + X_(24, 30, '¤', 16), '💎': P_('M8 18 l8 -8 h16 l8 8 -16 22z', b) + L_('M8 18 h32 M18 10 l-2 8 8 22 8 -22 -2 -8'),
    '💍': C_(24, 30, 12) + P_('M18 14 l6 -8 6 8 -6 6z', b), '🩺': L_('M14 6 v12 a8 8 0 0 0 16 0 v-12 M22 26 v6 a8 8 0 0 0 16 0 v-4') + C_(38, 24, 4, T), '🔬': L_('M14 42 h24 M20 42 v-6 M18 36 h12 M26 34 q8 -6 2 -14') + R_(20, 6, 8, 18, 2, T).replace('<rect', '<rect transform="rotate(-20 24 15)"'),
    '⚖️': L_('M24 6 v34 M14 42 h20 M8 12 h32') + P_('M2 26 l6 -14 6 14z', s) + P_('M34 26 l6 -14 6 14z', s), '🪑': R_(12, 6, 24, 18, 3, N) + R_(10, 24, 28, 6, 2, N) + L_('M14 30 v14 M34 30 v14'),
    '🧩': P_('M8 16 h10 a4 4 0 1 1 8 0 h10 v10 a4 4 0 1 1 0 8 v10 h-28z', T), '🎯': C_(24, 24, 17, W) + C_(24, 24, 11, R) + C_(24, 24, 5, W) + L_('M24 24 l14 -14 M34 8 l4 2 2 4'),
    // loisirs & jeux
    '🎮': P_('M10 18 h28 q8 0 8 10 q0 10 -6 10 q-4 0 -8 -6 h-16 q-4 6 -8 6 q-6 0 -6 -10 q0 -10 8 -10z', P) + L_('M14 25 v6 M11 28 h6') + C_(32, 25, 2, Y) + C_(36, 30, 2, C),
    '🕹️': R_(8, 32, 32, 10, 4, P) + L_('M24 32 v-14') + C_(24, 14, 6, R),
    '🎲': R_(8, 8, 32, 32, 7, W) + C_(16, 16, 2.500, K) + C_(24, 24, 2.500, R) + C_(32, 32, 2.500, K) + C_(32, 16, 2.500, K) + C_(16, 32, 2.500, K),
    '🎰': R_(8, 10, 32, 30, 5, R) + R_(12, 16, 24, 12, 2, W) + X_(16, 26, '7', 10, R) + X_(24, 26, '7', 10, R) + X_(32, 26, '7', 10, R) + L_('M40 18 h4 v-8') + C_(44, 8, 2, Y),
    '🃏': R_(12, 6, 24, 36, 4, W) + X_(24, 30, 'J', 18, R), '🎴': R_(12, 6, 24, 36, 4, C) + C_(24, 24, 7, W), '🎟️': P_('M6 14 h36 v6 a4 4 0 0 0 0 8 v6 h-36 v-6 a4 4 0 0 0 0 -8z', S) + L_('M30 14 v20'),
    '🎧': L_('M8 30 v-6 a16 16 0 0 1 32 0 v6') + R_(6, 26, 8, 14, 3, C) + R_(34, 26, 8, 14, 3, C), '🎵': L_('M18 36 v-26 l18 -4 v24') + C_(14, 36, 5, K) + C_(32, 32, 5, K),
    '🎬': R_(6, 18, 36, 24, 3, K) + P_('M6 10 l34 -4 1 8 -34 4z', W), '🎨': P_('M24 6 a18 18 0 1 0 0 36 q4 0 4 -4 q-2 -6 4 -6 h6 q4 0 4 -6 a18 18 0 0 0 -18 -20z', s) + C_(16, 20, 3, R) + C_(24, 14, 3, B) + C_(32, 18, 3, G) + C_(16, 30, 3, Y),
    '🎭': P_('M6 10 h18 v12 q0 12 -9 12 q-9 0 -9 -12z', W) + P_('M24 16 h18 v12 q0 12 -9 12 q-9 0 -9 -12z', C), '♟️': C_(24, 12, 6, K) + P_('M18 40 l3 -18 h6 l3 18z', K) + R_(12, 38, 24, 6, 2, K),
    '⚽': C_(24, 24, 17, W) + P_('M24 16 l7 5 -3 8 h-8 l-3 -8z', K), '👟': P_('M4 34 v-12 q6 2 10 -2 q10 8 22 8 q8 0 8 6 v4 h-40z', C) + L_('M4 38 h40'),
    '🏎️': P_('M4 32 l6 -10 h14 l6 -6 h8 l6 10 v6z', R) + C_(14, 34, 5, K) + C_(36, 34, 5, K),
    '🎈': E_(24, 18, 12, 14, R) + L_('M24 32 q-4 6 0 12'), '🎉': P_('M6 42 l10 -26 16 16z', S) + L_('M28 10 l2 -6 M36 16 l6 -2 M34 8 l4 -4') + C_(40, 26, 2, R) + C_(22, 8, 2, B),
    '🎁': R_(8, 18, 32, 24, 3, C) + R_(6, 12, 36, 8, 2, R) + L_('M24 12 v30') + P_('M24 12 q-10 -10 -12 -2 q2 4 12 2z M24 12 q10 -10 12 -2 q-2 4 -12 2z', S),
    '🎂': R_(8, 24, 32, 18, 3, s) + P_('M8 30 q4 4 8 0 t8 0 t8 0 t8 0', 'none') + R_(22, 14, 4, 10, 1, B) + P_('M24 6 q4 4 0 7 q-4 -3 0 -7z', Y),
    '☕': P_('M8 18 h26 v10 q0 12 -13 12 q-13 0 -13 -12z', W) + L_('M34 22 h4 a4 4 0 0 1 0 8 h-4 M16 6 q-3 4 0 8 M24 6 q-3 4 0 8'),
    '⌛': L_('M10 6 h28 M10 42 h28') + P_('M14 6 h20 q0 12 -10 18 q-10 -6 -10 -18z', b) + P_('M14 42 h20 q0 -12 -10 -18 q-10 6 -10 18z', S), '⏳': L_('M10 6 h28 M10 42 h28') + P_('M14 6 h20 q0 12 -10 18 q-10 -6 -10 -18z', S) + P_('M14 42 h20 q0 -12 -10 -18 q-10 6 -10 18z', b),
    '🚀': P_('M24 4 q10 8 10 22 l-4 8 h-12 l-4 -8 q0 -14 10 -22z', W) + C_(24, 18, 4, B) + P_('M18 34 l-6 6 2 -12z M30 34 l6 6 -2 -12z', C) + P_('M20 36 q4 10 8 0z', '#FF9A4C'),
    '🚻': R_(6, 6, 36, 36, 6, B) + C_(16, 14, 3, W) + C_(32, 14, 3, W) + P_('M13 20 h6 v18 h-6z', W) + P_('M28 20 h8 l2 12 h-12z', W) + L_('M24 10 v30'),
    '🛒': L_('M4 8 h6 l5 22 h22 l4 -16 h-28') + C_(17, 38, 3, K) + C_(34, 38, 3, K), '📍x': ''
  };
  I['🪪'] = R_(4, 10, 40, 28, 4, b) + C_(15, 22, 4, F) + P_('M9 33 q6 -8 12 0z', T) + L_('M26 19 h12 M26 25 h12 M26 31 h8');
  I['🍃'] = I['🍃']; delete I['📍x'];

  var cache = {};
  function svg(g) {
    if (!g) return null;
    var k = I[g] !== undefined ? g : (I[g.replace(/️/g, '')] !== undefined ? g.replace(/️/g, '') : (I[g + '️'] !== undefined ? g + '️' : null));
    if (!k) return null;
    return cache[k] || (cache[k] = env(I[k]));
  }
  function src(g) { var s2 = svg(g); return s2 ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s2) : null; }
  window.Icones = { svg: svg, src: src, liste: function () { return Object.keys(I); } };
})();
