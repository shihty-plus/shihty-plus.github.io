/* etudiants.js — étudiants dessinés en SVG, style autocollant (contour blanc + ombre).
   Etudiant.svg({ genre: 'f' | 'h', pose: 'salut' | 'telephone' | 'manette' | 'livre' | 'laptop' | 'megaphone' | 'idee' | 'pancarte' | 'des', texte: '💤' }) */
(function () {
  'use strict';
  var n = 0;
  var C = { peau: '#F3C6A5', peauOmbre: '#E3A986', cheveux: '#5B3424', chemise: '#FBFAF7', chemiseOmbre: '#DCDAD3', cravate: '#2B3A67',
    bas: '#2A2D34', chaussure: '#1D1F24', joue: 'rgba(255,127,107,.35)', trait: '#3B2418' };

  function bras(x1, y1, x2, y2, x3, y3) {   // épaule → coude (manche) → main (peau)
    return '<path d="M' + x1 + ' ' + y1 + ' L' + x2 + ' ' + y2 + '" stroke="' + C.chemise + '" stroke-width="20" stroke-linecap="round"/>' +
      '<path d="M' + x1 + ' ' + y1 + ' L' + x2 + ' ' + y2 + '" stroke="' + C.chemiseOmbre + '" stroke-width="20" stroke-linecap="round" opacity=".35" transform="translate(1.500 1.500)"/>' +
      '<path d="M' + x2 + ' ' + y2 + ' L' + x3 + ' ' + y3 + '" stroke="' + C.peau + '" stroke-width="13" stroke-linecap="round"/>' +
      '<circle cx="' + x3 + '" cy="' + y3 + '" r="9" fill="' + C.peau + '"/>';
  }
  var POSES = {
    //        bras gauche (écran)              bras droit
    salut:     [[62, 128, 50, 168, 56, 200], [138, 128, 162, 100, 168, 66]],
    telephone: [[62, 128, 50, 168, 56, 200], [138, 128, 150, 162, 118, 140]],
    manette:   [[62, 128, 60, 168, 86, 168], [138, 128, 140, 168, 114, 168]],
    livre:     [[62, 128, 58, 166, 82, 160], [138, 128, 142, 166, 118, 160]],
    laptop:    [[62, 128, 56, 172, 78, 184], [138, 128, 144, 172, 122, 184]],
    megaphone: [[62, 128, 50, 168, 56, 200], [138, 128, 162, 116, 178, 104]],
    idee:      [[62, 128, 50, 168, 56, 200], [138, 128, 158, 110, 160, 74]],
    pancarte:  [[62, 128, 44, 92, 56, 52], [138, 128, 156, 92, 144, 52]],
    des:       [[62, 128, 50, 168, 56, 200], [138, 128, 156, 150, 150, 124]]
  };
  function accessoire(pose, texte) {
    switch (pose) {
      case 'telephone':
        return '<g transform="rotate(-12 112 132)"><rect x="98" y="108" width="30" height="50" rx="6" fill="#16213A"/><rect x="101" y="113" width="24" height="38" rx="3" fill="#2DD4BF"/>' +
          '<rect x="104" y="118" width="18" height="4" rx="2" fill="#fff" opacity=".8"/><rect x="104" y="126" width="12" height="4" rx="2" fill="#fff" opacity=".6"/>' +
          '<circle cx="126" cy="110" r="8" fill="#FF7F6B" stroke="#fff" stroke-width="2"/><text x="126" y="113.500" font-size="9" font-weight="800" text-anchor="middle" fill="#fff" font-family="sans-serif">9+</text></g>';
      case 'manette':
        return '<path d="M74 160 q26 -14 52 0 q12 6 8 22 q-4 12 -16 4 l-8 -6 h-20 l-8 6 q-12 8 -16 -4 q-4 -16 8 -22z" fill="#2B3A67"/>' +
          '<circle cx="88" cy="168" r="4" fill="#E2B970"/><circle cx="114" cy="166" r="3" fill="#FF7F6B"/><circle cx="120" cy="171" r="3" fill="#2DD4BF"/>';
      case 'livre':
        return '<path d="M100 150 l-30 -8 v34 l30 8z" fill="#7FA4E0"/><path d="M100 150 l30 -8 v34 l-30 8z" fill="#9DB8EA"/><path d="M100 150 v34" stroke="#4E6FAE" stroke-width="2"/>';
      case 'laptop':
        return '<path d="M72 150 h56 l-4 34 h-48z" fill="#BFC5CC"/><circle cx="100" cy="167" r="4" fill="#9AA1AA"/><rect x="62" y="184" width="76" height="6" rx="3" fill="#A9B0B8"/>';
      case 'megaphone':
        return '<g transform="rotate(-20 178 104)"><path d="M172 96 l30 -14 v40 l-30 -14z" fill="#FBFAF7" stroke="#C9C7C0" stroke-width="2"/><rect x="164" y="98" width="12" height="12" rx="3" fill="#2B3A67"/><path d="M202 82 v40" stroke="#2B3A67" stroke-width="5" stroke-linecap="round"/></g>';
      case 'idee':
        return '<g><circle cx="160" cy="42" r="16" fill="#FDE68A"/><circle cx="160" cy="42" r="10" fill="#FBBF24"/><rect x="154" y="56" width="12" height="8" rx="2" fill="#9CA3AF"/>' +
          '<path d="M160 14 v-8 M136 28 l-6 -5 M184 28 l6 -5 M134 46 h-8 M186 46 h8" stroke="#E2B970" stroke-width="3" stroke-linecap="round"/></g>';
      case 'pancarte':
        return '<rect x="40" y="12" width="120" height="50" rx="6" fill="#fff" stroke="#E0DCD2" stroke-width="2"/>' +
          '<text x="100" y="46" font-size="28" text-anchor="middle" font-family="sans-serif">' + (texte || '⭐') + '</text>';
      case 'des':
        return '<g transform="rotate(14 150 116)"><rect x="138" y="104" width="24" height="24" rx="5" fill="#fff" stroke="#D1D5DB" stroke-width="2"/>' +
          '<circle cx="145" cy="111" r="2.500" fill="#E0543F"/><circle cx="150" cy="116" r="2.500" fill="#1F2937"/><circle cx="155" cy="121" r="2.500" fill="#1F2937"/></g>';
      default: return '';
    }
  }
  function svg(o) {
    o = o || {};
    var id = 'stk' + (++n), f = o.genre === 'f', pose = POSES[o.pose] ? o.pose : 'salut', p = POSES[pose];
    var cheveuxDerriere = f ? '<path d="M60 70 C56 40 80 26 100 26 C122 26 146 40 140 72 C146 110 150 140 136 150 L64 150 C50 140 54 110 60 70Z" fill="' + C.cheveux + '"/>' : '';
    var cheveuxDevant = f
      ? '<path d="M62 70 C62 38 84 28 102 30 C124 30 140 44 138 68 C126 52 110 46 94 50 C84 52 72 60 62 70Z" fill="' + C.cheveux + '"/>'
      : '<path d="M60 72 C56 36 84 24 104 26 C128 28 144 44 140 72 C134 58 124 50 112 50 C100 44 88 50 80 48 C72 54 64 62 60 72Z" fill="' + C.cheveux + '"/>';
    var bas = f
      ? '<path d="M64 194 h72 l12 46 h-96z" fill="' + C.bas + '"/>' +
        '<rect x="80" y="238" width="12" height="40" rx="6" fill="' + C.peau + '"/><rect x="108" y="238" width="12" height="40" rx="6" fill="' + C.peau + '"/>' +
        '<path d="M74 280 h22 v8 h-24z M104 280 h22 l2 8 h-24z" fill="' + C.chaussure + '"/>'
      : '<path d="M66 194 h68 l-4 86 h-24 l-6 -60 l-6 60 h-24z" fill="' + C.bas + '"/>' +
        '<path d="M70 280 h28 v8 h-30z M102 280 h28 l2 8 h-30z" fill="' + C.chaussure + '"/>';
    var corps = '<path d="M60 124 C64 114 80 110 100 110 C120 110 136 114 140 124 L136 200 H64Z" fill="' + C.chemise + '"/>' +
      '<path d="M100 112 L88 112 L100 128 L112 112Z" fill="' + C.chemiseOmbre + '"/>' +
      '<rect x="62" y="190" width="76" height="8" rx="3" fill="#3A3D44"/><rect x="94" y="189" width="12" height="10" rx="2" fill="#B9BDC4"/>' +
      (f ? '' : '<path d="M100 116 l-6 6 l4 54 l2 6 l2 -6 l4 -54z" fill="' + C.cravate + '"/>');
    var tete = '<rect x="92" y="96" width="16" height="18" rx="6" fill="' + C.peauOmbre + '"/>' +
      '<circle cx="100" cy="70" r="38" fill="' + C.peau + '"/>' +
      '<circle cx="62" cy="74" r="7" fill="' + C.peau + '"/><circle cx="138" cy="74" r="7" fill="' + C.peau + '"/>' +
      '<ellipse cx="86" cy="76" rx="4" ry="5.500" fill="' + C.trait + '"/><ellipse cx="114" cy="76" rx="4" ry="5.500" fill="' + C.trait + '"/>' +
      '<circle cx="87.500" cy="74" r="1.400" fill="#fff"/><circle cx="115.500" cy="74" r="1.400" fill="#fff"/>' +
      '<circle cx="78" cy="88" r="6" fill="' + C.joue + '"/><circle cx="122" cy="88" r="6" fill="' + C.joue + '"/>' +
      '<path d="M90 90 Q100 100 110 90" stroke="' + C.trait + '" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      (f ? '<path d="M138 52 C152 56 152 78 140 90" stroke="' + C.cheveux + '" stroke-width="9" fill="none" stroke-linecap="round"/>' : '');
    // l'accessoire tenu en main passe devant ; la pancarte et l'ampoule au-dessus de la tête aussi
    var devant = accessoire(pose, o.texte);
    return '<svg class="etu-svg" viewBox="-14 -6 228 312" role="img" aria-hidden="true">' +
      '<defs><filter id="' + id + '" x="-20%" y="-20%" width="140%" height="140%">' +
      '<feMorphology in="SourceAlpha" operator="dilate" radius="5" result="m"/><feFlood flood-color="#fff"/><feComposite in2="m" operator="in" result="contour"/>' +
      '<feGaussianBlur in="m" stdDeviation="5" result="flou"/><feOffset in="flou" dy="6" result="ombre"/><feFlood flood-color="rgba(4,47,46,.28)"/><feComposite in2="ombre" operator="in" result="ombreC"/>' +
      '<feMerge><feMergeNode in="ombreC"/><feMergeNode in="contour"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>' +
      '<g filter="url(#' + id + ')">' + cheveuxDerriere + bas + corps + bras.apply(null, p[0]) + tete + cheveuxDevant + bras.apply(null, p[1]) + devant + '</g></svg>';
  }
  window.Etudiant = { svg: svg };
})();
