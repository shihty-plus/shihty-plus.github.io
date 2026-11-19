/* emoji3d.js — remplace automatiquement les emojis du site par leur version 3D (Fluent Emoji, licence MIT)
   dans les zones décoratives (icônes, réponses, badges…). Les images sont dans assets/emoji3d/,
   la correspondance emoji → fichier dans data/emoji3d.json (régénérée par tools/emoji3d.py). */
(function () {
  'use strict';
  var CARTE = null;
  var SELECTEURS = ['.opt-emoji', '.q-mini', '.q-badge', '.titre-partie-icone', '.rond', '.bt-heros', '.bt-perso', '.bt-p', '.resultat-icone',
    '.sticker-emoji', '.mission-icone', '.jx-carte-icone', '.etape-icone', '.ac-carte-em', '.route-noeud.ici', '.station-titre > span',
    '.opts-emoji .emoji', '.cote', '.autocollant-emoji', '.satellite', '.ac-chip-tel span', '.album-icone', '.sph-em', '.sph-perso', '.sph-bulle-em',
    '.monde-em', '.badges li > span:first-child', '.reseau-emoji', '.mm-face', '.pz-em', '.pe-emoji', '.atout-icone', '.encouragement-em'].join(',');
  var seg = window.Intl && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
  function graphemes(t) { return seg ? Array.from(seg.segment(t), function (s) { return s.segment; }) : Array.from(t); }
  function fichier(g) { return CARTE && (CARTE[g] || CARTE[g.replace(/️/g, '')] || CARTE[g + '️']); }
  function img(f) {
    var i = document.createElement('img');
    i.className = 'em3d'; i.alt = ''; i.setAttribute('aria-hidden', 'true'); i.decoding = 'async'; i.draggable = false;
    i.src = 'assets/emoji3d/' + f + '.webp';
    return i;
  }
  function traiterTexte(noeud) {
    var t = noeud.nodeValue; if (!t || !/[←-⯿\uD83C-\uD83E]/.test(t)) return;
    var morceaux = graphemes(t), utile = morceaux.some(fichier);
    if (!utile) return;
    var frag = document.createDocumentFragment(), tampon = '';
    morceaux.forEach(function (g) {
      var f = fichier(g);
      if (f) { if (tampon) { frag.appendChild(document.createTextNode(tampon)); tampon = ''; } frag.appendChild(img(f)); }
      else tampon += g;
    });
    if (tampon) frag.appendChild(document.createTextNode(tampon));
    noeud.parentNode.replaceChild(frag, noeud);
  }
  function traiterElement(el) {
    var marcheur = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), liste = [], n;
    while ((n = marcheur.nextNode())) liste.push(n);
    liste.forEach(traiterTexte);
  }
  function balayer(racine) {
    if (!CARTE || !racine || racine.nodeType !== 1) return;
    if (racine.matches && racine.matches(SELECTEURS)) traiterElement(racine);
    racine.querySelectorAll(SELECTEURS).forEach(traiterElement);
  }
  function demarrer() {
    balayer(document.body);
    new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        m.addedNodes.forEach(function (x) { if (x.nodeType === 1) balayer(x); else if (x.nodeType === 3 && x.parentNode && x.parentNode.matches && x.parentNode.matches(SELECTEURS)) traiterTexte(x); });
        if (m.type === 'characterData' && m.target.parentNode && m.target.parentNode.matches && m.target.parentNode.matches(SELECTEURS)) traiterTexte(m.target);
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  fetch('data/emoji3d.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (c) {
    CARTE = c;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer); else demarrer();
  }).catch(function () { /* sans la carte, les emojis restent en texte */ });
  window.Emoji3D = { src: function (g) { var f = fichier(g); return f ? 'assets/emoji3d/' + f + '.webp' : null; }, balayer: balayer };
})();
