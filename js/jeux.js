/* jeux.js — jeux de pause facultatifs : X O, mini-puzzle, mémoire, mini-UNO.
   Jeux.ouvrir(textes, fini) affiche le choix du jeu ; fini() est appelé quand on revient au questionnaire. */
(function () {
  'use strict';
  function h(tag, attrs, enfants) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k]; if (v === null || v === undefined || v === false) return;
      if (k === 'class') n.className = v; else if (k === 'text') n.textContent = v;
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), v); else n.setAttribute(k, v);
    });
    (enfants || []).forEach(function (e) { if (e) n.appendChild(typeof e === 'string' ? document.createTextNode(e) : e); });
    return n;
  }
  function melange(t) { for (var i = t.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = t[i]; t[i] = t[j]; t[j] = x; } return t; }
  function fete(el) { if (!window.FX) return; var r = el.getBoundingClientRect(); window.FX.eclat(r.left + r.width / 2, r.top + r.height / 2, 22); }

  var T, fond, zone, titre, fini;

  function ouvrir(textes, apres) {
    T = textes; fini = apres;
    titre = h('strong', { class: 'jx-titre', text: T.titre });
    zone = h('div', { class: 'jx-zone' });
    fond = h('div', { class: 'jx', role: 'dialog', 'aria-label': T.titre }, [
      h('div', { class: 'jx-tete' }, [titre, h('button', { type: 'button', class: 'jx-fermer', 'aria-label': T.retour, text: '✕', onclick: fermer })]),
      zone
    ]);
    document.body.appendChild(fond);
    choix();
  }
  function fermer() {
    if (!fond) return;
    fond.classList.add('sortie');
    var f = fond; fond = null;
    setTimeout(function () { f.remove(); }, 320);
    if (fini) fini();
  }
  function choix() {
    titre.textContent = T.titre;
    var jeux = [['xo', '❌⭕', T.xo], ['puzzle', '🧩', T.puzzle], ['memoire', '🃏', T.memoire], ['uno', '🎴', T.uno]];
    zone.replaceChildren(
      h('p', { class: 'jx-intro', text: T.intro }),
      h('div', { class: 'jx-choix' }, jeux.map(function (j, k) {
        return h('button', { type: 'button', class: 'jx-carte', style: '--k:' + k, onclick: function () { lancer(j[0], j[2].nom); } }, [
          h('span', { class: 'jx-carte-icone', 'aria-hidden': 'true', text: j[1] }),
          h('strong', { text: j[2].nom }), h('span', { text: j[2].desc })
        ]);
      })),
      h('button', { type: 'button', class: 'btn btn-fantome jx-retour', text: T.retour, onclick: fermer })
    );
  }
  function cadre(nom, plateau, statut, actions) {
    titre.textContent = nom;
    zone.replaceChildren(statut, plateau, h('div', { class: 'jx-actions' }, actions.concat([
      h('button', { type: 'button', class: 'btn btn-gris', text: T.autre, onclick: choix }),
      h('button', { type: 'button', class: 'btn btn-principal', text: T.retour, onclick: fermer })
    ])));
  }
  function lancer(id, nom) { ({ xo: xo, puzzle: puzzle, memoire: memoire, uno: uno })[id](nom); }

  /* ---------- X O contre l'ordinateur (qui joue simplement) ---------- */
  var LIGNES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  function gagnant(c) {
    for (var i = 0; i < LIGNES.length; i++) { var l = LIGNES[i]; if (c[l[0]] && c[l[0]] === c[l[1]] && c[l[1]] === c[l[2]]) return { s: c[l[0]], l: l }; }
    return c.every(Boolean) ? { s: 'nul' } : null;
  }
  function xo(nom) {
    var c = Array(9).fill(''), fin = false;
    var statut = h('p', { class: 'jx-statut', text: T.xo.tour });
    var cases = c.map(function (_, i) { return h('button', { type: 'button', class: 'xo-case', 'aria-label': String(i + 1), onclick: function () { jouer(i); } }); });
    var plateau = h('div', { class: 'xo' }, cases);
    function dessiner() { cases.forEach(function (b, i) { b.textContent = c[i] === 'X' ? '✕' : (c[i] === 'O' ? '◯' : ''); b.className = 'xo-case' + (c[i] ? ' ' + c[i] : ''); }); }
    function verifier() {
      var g = gagnant(c); if (!g) return false;
      fin = true;
      if (g.l) g.l.forEach(function (i) { cases[i].classList.add('gagne'); });
      statut.textContent = g.s === 'X' ? T.xo.gagne : (g.s === 'O' ? T.xo.perdu : T.xo.nul);
      if (g.s === 'X') fete(plateau);
      return true;
    }
    function ordi() {
      var libres = c.map(function (v, i) { return v ? -1 : i; }).filter(function (i) { return i >= 0; });
      function chercher(s) { for (var k = 0; k < libres.length; k++) { var t = c.slice(); t[libres[k]] = s; if (gagnant(t) && gagnant(t).s === s) return libres[k]; } return -1; }
      var i = chercher('O');
      if (i < 0 && Math.random() < .6) i = chercher('X');   // bloque seulement parfois : l'étudiant gagne souvent
      if (i < 0) i = c[4] ? libres[Math.floor(Math.random() * libres.length)] : 4;
      c[i] = 'O'; dessiner(); verifier() || (statut.textContent = T.xo.tour);
    }
    function jouer(i) {
      if (fin || c[i]) return;
      c[i] = 'X'; dessiner();
      if (verifier()) return;
      statut.textContent = T.xo.attente;
      setTimeout(ordi, 450);
    }
    cadre(nom, plateau, statut, [h('button', { type: 'button', class: 'btn btn-gris', text: T.rejouer, onclick: function () { xo(nom); } })]);
  }

  /* ---------- puzzle glissant 3×3 (mélange facile) ---------- */
  function puzzle(nom) {
    var EM = ['🌱', '📱', '🌙', '💚', '🎮', '🤝', '☀️', '🏃'];
    var t = [1, 2, 3, 4, 5, 6, 7, 8, 0], coups = 0, fin = false;
    function voisins(v) { var x = v % 3, y = Math.floor(v / 3), r = []; if (x > 0) r.push(v - 1); if (x < 2) r.push(v + 1); if (y > 0) r.push(v - 3); if (y < 2) r.push(v + 3); return r; }
    var vide = 8, prec = -1;
    for (var k = 0; k < 24; k++) { var n = voisins(vide).filter(function (v) { return v !== prec; }), cible = n[Math.floor(Math.random() * n.length)]; t[vide] = t[cible]; t[cible] = 0; prec = vide; vide = cible; }
    var statut = h('p', { class: 'jx-statut', text: T.puzzle.consigne });
    var plateau = h('div', { class: 'pz' });
    function dessiner() {
      plateau.replaceChildren.apply(plateau, t.map(function (v, i) {
        return v ? h('button', { type: 'button', class: 'pz-case', onclick: function () { bouger(i); } }, [h('span', { class: 'pz-num', text: String(v) }), h('span', { class: 'pz-em', text: EM[v - 1] })])
          : h('span', { class: 'pz-vide' });
      }));
    }
    function bouger(i) {
      if (fin) return;
      var v = t.indexOf(0); if (voisins(v).indexOf(i) < 0) return;
      t[v] = t[i]; t[i] = 0; coups++; dessiner();
      statut.textContent = T.puzzle.coups.replace('{n}', coups);
      if (t.join() === '1,2,3,4,5,6,7,8,0') { fin = true; statut.textContent = T.puzzle.gagne.replace('{n}', coups); fete(plateau); }
    }
    dessiner();
    cadre(nom, plateau, statut, [h('button', { type: 'button', class: 'btn btn-gris', text: T.rejouer, onclick: function () { puzzle(nom); } })]);
  }

  /* ---------- mémoire : 6 paires ---------- */
  function memoire(nom) {
    var EM = ['📱', '🎮', '🌙', '💚', '🤖', '🎧'];
    var cartes = melange(EM.concat(EM)), ouvertes = [], trouvees = 0, essais = 0, bloque = false;
    var statut = h('p', { class: 'jx-statut', text: T.memoire.consigne });
    var boutons = cartes.map(function (e, i) {
      return h('button', { type: 'button', class: 'mm-carte', 'aria-label': String(i + 1), onclick: function () { retourner(i); } }, [
        h('span', { class: 'mm-dos', text: '✦' }), h('span', { class: 'mm-face', text: e })
      ]);
    });
    var plateau = h('div', { class: 'mm' }, boutons);
    function retourner(i) {
      var b = boutons[i];
      if (bloque || b.classList.contains('ouverte') || b.classList.contains('trouvee')) return;
      b.classList.add('ouverte'); ouvertes.push(i);
      if (ouvertes.length < 2) return;
      essais++;
      var a = ouvertes[0], c = ouvertes[1]; ouvertes = [];
      if (cartes[a] === cartes[c]) {
        boutons[a].classList.add('trouvee'); boutons[c].classList.add('trouvee'); trouvees++;
        if (trouvees === EM.length) { statut.textContent = T.memoire.gagne.replace('{n}', essais); fete(plateau); }
        else statut.textContent = T.memoire.paires.replace('{n}', trouvees).replace('{t}', EM.length);
      } else {
        bloque = true;
        setTimeout(function () { boutons[a].classList.remove('ouverte'); boutons[c].classList.remove('ouverte'); bloque = false; }, 750);
      }
    }
    cadre(nom, plateau, statut, [h('button', { type: 'button', class: 'btn btn-gris', text: T.rejouer, onclick: function () { memoire(nom); } })]);
  }

  /* ---------- mini-UNO : même couleur ou même chiffre ---------- */
  function uno(nom) {
    var COUL = ['sarcelle', 'corail', 'sable', 'nuit'], paquet = [];
    COUL.forEach(function (c) { for (var n = 1; n <= 6; n++) { paquet.push({ c: c, n: n }); paquet.push({ c: c, n: n }); } });
    melange(paquet);
    var moi = paquet.splice(0, 5), lui = paquet.splice(0, 5), table = paquet.shift(), fin = false, monTour = true;
    var statut = h('p', { class: 'jx-statut', text: T.uno.tour });
    var adv = h('div', { class: 'uno-adv' }), centre = h('div', { class: 'uno-centre' }), main = h('div', { class: 'uno-main' });
    var pioche = h('button', { type: 'button', class: 'uno-carte dos', 'aria-label': T.uno.piocher, onclick: piocher }, [h('span', { text: 'SHIHTY+' })]);
    function carte(c, jouable, clic) {
      return h('button', { type: 'button', class: 'uno-carte c-' + c.c + (jouable ? ' jouable' : ''), disabled: !clic, onclick: clic }, [h('span', { class: 'uno-n', text: String(c.n) })]);
    }
    function ok(c) { return c.c === table.c || c.n === table.n; }
    function dessiner() {
      adv.replaceChildren.apply(adv, lui.map(function () { return h('span', { class: 'uno-carte dos petite' }); }).concat([h('span', { class: 'uno-compte', text: lui.length + ' ' + T.uno.cartes })]));
      centre.replaceChildren(pioche, carte(table, false, null));
      main.replaceChildren.apply(main, moi.map(function (c, i) { return carte(c, monTour && !fin && ok(c), monTour && !fin ? function () { poser(i); } : null); }));
    }
    function finir(gagne) { fin = true; statut.textContent = gagne ? T.uno.gagne : T.uno.perdu; dessiner(); if (gagne) fete(main); }
    function poser(i) {
      if (!monTour || fin || !ok(moi[i])) { if (!ok(moi[i])) statut.textContent = T.uno.interdit; return; }
      table = moi.splice(i, 1)[0];
      if (!moi.length) return finir(true);
      monTour = false; statut.textContent = T.uno.attente; dessiner();
      setTimeout(ordi, 650);
    }
    function piocher() {
      if (!monTour || fin) return;
      if (!paquet.length) { statut.textContent = T.uno.vide; return; }
      moi.push(paquet.shift());
      monTour = false; statut.textContent = T.uno.attente; dessiner();
      setTimeout(ordi, 650);
    }
    function ordi() {
      if (fin) return;
      var i = lui.findIndex(ok);
      if (i >= 0) { table = lui.splice(i, 1)[0]; if (!lui.length) return finir(false); }
      else if (paquet.length) lui.push(paquet.shift());
      monTour = true; statut.textContent = T.uno.tour; dessiner();
    }
    dessiner();
    cadre(nom, h('div', { class: 'uno' }, [adv, centre, main]), statut, [h('button', { type: 'button', class: 'btn btn-gris', text: T.rejouer, onclick: function () { uno(nom); } })]);
  }

  window.Jeux = { ouvrir: ouvrir };
})();
