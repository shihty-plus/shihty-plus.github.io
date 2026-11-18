/* schema.js — lecture de questions.json : variables, conditions d'affichage, colonnes du tableur.
   Utilisé par le site (navigateur) et par les outils/tests (Node). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Schema = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var COLONNES_SYSTEME = ['id_participation', 'horodatage', 'duree_minutes', 'mode', 'consentement', 'num_formulaire'];

  function vide(v) { return v === undefined || v === null || v === ''; }

  function options(q, ref) {
    if (Array.isArray(ref)) return ref;
    if (typeof ref === 'string' && q.options[ref]) return q.options[ref];
    return [];
  }

  /* Variables portées par un élément (dans l'ordre des colonnes). */
  function varsElement(el) {
    switch (el.type) {
      case 'choix': case 'nombre': case 'texte': case 'liste': return [el.var];
      case 'multiple': return el.choix.map(function (c) { return c.var; });
      case 'echelle': return el.items.map(function (i) { return i.var; });
      case 'reseaux': return el.reseaux.map(function (r) { return r.var; }).concat([el.var_plus, el.var_moins]);
      default: return [];
    }
  }

  /* Liste à plat de tous les éléments, avec leur section et leur partie. */
  function elements(q) {
    var out = [];
    q.sections.forEach(function (s) {
      s.parties.forEach(function (p) {
        p.ecrans.forEach(function (ecran, iEcran) {
          ecran.forEach(function (el) { out.push({ el: el, section: s, partie: p, iEcran: iEcran }); });
        });
      });
    });
    return out;
  }

  function evalCondition(c, rep) {
    if (!c) return true;
    if (c.tous) return c.tous.every(function (x) { return evalCondition(x, rep); });
    if (c.un_parmi) {
      return c.un_parmi.some(function (v) { return !vide(rep[v]) && Number(rep[v]) >= c.min; });
    }
    var v = rep[c.var];
    if ('eq' in c) return !vide(v) && Number(v) === c.eq;
    if ('ne' in c) return vide(v) || Number(v) !== c.ne;
    return true;
  }

  /* Réponses « effectives » : on parcourt le questionnaire dans l'ordre ; toute question dont la
     condition n'est pas remplie est vidée (ou reçoit sa valeur automatique), ce qui masque aussi
     en cascade les questions qui en dépendent. Renvoie { rep, visibles }. */
  function effectives(q, reponses) {
    var rep = {};
    var visibles = new Set();
    elements(q).forEach(function (x) {
      var el = x.el;
      var vars = varsElement(el);
      if (evalCondition(el.si, rep)) {
        visibles.add(el);
        vars.forEach(function (v) { if (!vide(reponses[v])) rep[v] = reponses[v]; });
        // Cases à cocher affichées : non cochée = 0
        if (el.type === 'multiple') vars.forEach(function (v) { if (vide(rep[v])) rep[v] = 0; });
        if (el.type === 'reseaux') {
          var coches = el.reseaux.filter(function (r) {
            if (vide(rep[r.var])) rep[r.var] = 0;
            return Number(rep[r.var]) === 1;
          }).map(function (r) { return r.c; });
          // « plus » et « moins » doivent rester parmi les réseaux cochés
          [el.var_plus, el.var_moins].forEach(function (v) {
            if (!vide(rep[v]) && coches.indexOf(Number(rep[v])) < 0) delete rep[v];
          });
          if (coches.length < 2) delete rep[el.var_moins];
        }
      } else if ('valeur_si_masque' in el && el.si.var && !vide(rep[el.si.var])) {
        // valeur automatique seulement si la question filtre a bien reçu une réponse
        rep[el.var] = el.valeur_si_masque;
      }
    });
    return { rep: rep, visibles: visibles };
  }

  /* Dictionnaire des variables du questionnaire (ordre des colonnes). */
  function variables(q) {
    var out = [];
    function cond(el) { return el.si ? JSON.stringify(el.si) : ''; }
    elements(q).forEach(function (x) {
      var el = x.el, partie = x.partie.id + ' ' + x.partie.titre;
      if (el.type === 'choix' || el.type === 'liste') {
        out.push({ code: el.var, texte: el.texte, type: 'choix', valeurs: options(q, el.options), partie: partie, condition: cond(el) });
      } else if (el.type === 'nombre') {
        out.push({ code: el.var, texte: el.texte, type: 'nombre', valeurs: [], bornes: el.min + '–' + el.max, partie: partie, condition: cond(el) });
      } else if (el.type === 'texte') {
        out.push({ code: el.var, texte: el.texte, type: 'texte', valeurs: [], partie: partie, condition: cond(el) });
      } else if (el.type === 'multiple') {
        el.choix.forEach(function (c) {
          out.push({ code: c.var, texte: (el.texte ? el.texte + ' — ' : '') + c.t, type: 'case 0/1',
            valeurs: [{ c: 1, t: 'نعم (coché)' }, { c: 0, t: 'لا (non coché)' }], partie: partie, condition: cond(el) });
        });
      } else if (el.type === 'echelle') {
        el.items.forEach(function (it) {
          out.push({ code: it.var, texte: (el.consigne ? el.consigne + ' — ' : '') + it.texte, type: 'item ' + el.instrument,
            valeurs: options(q, it.options || el.options), inverse: !!it.inverse, partie: partie, condition: cond(el) });
        });
      } else if (el.type === 'reseaux') {
        el.reseaux.forEach(function (r) {
          out.push({ code: r.var, texte: el.colonne_utilise + ' — ' + r.t, type: 'case 0/1',
            valeurs: [{ c: 1, t: 'نعم (coché)' }, { c: 0, t: 'لا (non coché)' }], partie: partie, condition: '' });
        });
        var liste = el.reseaux.map(function (r) { return { c: r.c, t: r.t }; });
        out.push({ code: el.var_plus, texte: el.colonne_plus, type: 'choix', valeurs: liste, partie: partie, condition: '' });
        out.push({ code: el.var_moins, texte: el.colonne_moins, type: 'choix', valeurs: liste, partie: partie, condition: 'au moins 2 réseaux cochés' });
      }
    });
    return out;
  }

  /* Ordre exact des colonnes de la feuille « Réponses ». */
  function colonnes(q, colonnesScores) {
    return COLONNES_SYSTEME.concat(variables(q).map(function (v) { return v.code; }), colonnesScores || []);
  }

  return {
    COLONNES_SYSTEME: COLONNES_SYSTEME, vide: vide, options: options, varsElement: varsElement,
    elements: elements, evalCondition: evalCondition, effectives: effectives, variables: variables, colonnes: colonnes
  };
});
