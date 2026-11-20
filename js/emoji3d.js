/* emoji3d.js — remplace les emojis du site par les icônes dessinées de SHIHTY+ (js/icones.js),
   partout dans la page (y compris ce qui est ajouté plus tard). Garde l'ancien nom d'API : Emoji3D.src(emoji). */
(function () {
  'use strict';
  var IGNORER = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, OPTION: 1, SELECT: 1, TITLE: 1 };
  var seg = window.Intl && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
  function graphemes(t) { return seg ? Array.from(seg.segment(t), function (s) { return s.segment; }) : Array.from(t); }
  function src(g) { return window.Icones ? window.Icones.src(g) : null; }
  function img(s) {
    var i = document.createElement('img');
    i.className = 'em3d'; i.alt = ''; i.setAttribute('aria-hidden', 'true'); i.draggable = false; i.src = s;
    return i;
  }
  var PIC = /[←-⯿⌀-⏿☀-➿\uD83C-\uD83E]/;
  function traiterTexte(noeud) {
    var t = noeud.nodeValue, parent = noeud.parentNode;
    if (!t || !parent || IGNORER[parent.nodeName] || !PIC.test(t)) return;
    if (parent.closest && parent.closest('svg')) return;
    var morceaux = graphemes(t);
    if (!morceaux.some(src)) return;
    var frag = document.createDocumentFragment(), tampon = '';
    morceaux.forEach(function (g) {
      var s = src(g);
      if (s) { if (tampon) { frag.appendChild(document.createTextNode(tampon)); tampon = ''; } frag.appendChild(img(s)); }
      else tampon += g;
    });
    if (tampon) frag.appendChild(document.createTextNode(tampon));
    parent.replaceChild(frag, noeud);
  }
  function balayer(racine) {
    if (!racine) return;
    if (racine.nodeType === 3) { traiterTexte(racine); return; }
    if (racine.nodeType !== 1 || IGNORER[racine.nodeName]) return;
    var w = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT), liste = [], n;
    while ((n = w.nextNode())) liste.push(n);
    liste.forEach(traiterTexte);
  }
  function demarrer() {
    balayer(document.body);
    new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        if (m.type === 'characterData') traiterTexte(m.target);
        else m.addedNodes.forEach(balayer);
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer); else demarrer();
  window.Emoji3D = { src: src, balayer: balayer };
})();
