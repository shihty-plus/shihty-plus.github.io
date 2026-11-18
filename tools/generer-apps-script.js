/* Génère apps-script/Code.gs à partir de data/questions.json et js/scoring.js.
   À relancer uniquement si l'on ajoute/supprime une question ou une option :  node tools/generer-apps-script.js
   (corriger un simple texte ne change pas les colonnes : inutile de relancer, sauf pour mettre à jour le dictionnaire). */
'use strict';
const fs = require('fs');
const path = require('path');
const racine = path.join(__dirname, '..');
const Schema = require(path.join(racine, 'js/schema.js'));
const Scoring = require(path.join(racine, 'js/scoring.js'));
const Q = JSON.parse(fs.readFileSync(path.join(racine, 'data/questions.json'), 'utf8'));

const vars = Schema.variables(Q);
const colonnes = Schema.colonnes(Q, Scoring.COLONNES);

const systeme = {
  id_participation: ['Identifiant unique de participation (UUID généré par le site)', ''],
  horodatage: ['Date et heure de réception (ajoutées par le script)', ''],
  duree_minutes: ['Durée active de remplissage, en minutes (les pauses de plus de 5 min ne sont pas comptées)', ''],
  mode: ['Mode de recueil', 'en ligne ; papier (saisie chercheur)'],
  consentement: ['Consentement donné', '1 = oui'],
  num_formulaire: ['رقم الاستمارة – خاص بالباحث (questionnaires papier uniquement)', '']
};

// Feuille « Dictionnaire » : code, texte, type, valeurs et libellés, partie, condition d'affichage, remarque
const dictionnaire = [];
Schema.COLONNES_SYSTEME.forEach(c => dictionnaire.push([c, systeme[c][0], 'système', systeme[c][1], '', '', '']));
vars.forEach(v => dictionnaire.push([
  v.code, v.texte, v.type,
  v.valeurs.length ? v.valeurs.map(o => o.c + ' = ' + o.t).join(' ; ') : (v.bornes || ''),
  v.partie, v.condition || '',
  v.inverse ? 'Item inversé dans le score (la colonne contient la réponse brute)' : ''
]));
Scoring.DICTIONNAIRE.forEach(d => dictionnaire.push([d.code, d.description, 'score calculé', d.valeurs, '', '', 'Vide si l\'échelle est incomplète ou non passée']));

// Libellés pour la feuille « Réponses_libellés »
const libelles = {};
vars.forEach(v => { if (v.valeurs.length) { libelles[v.code] = {}; v.valeurs.forEach(o => { libelles[v.code][o.c] = o.t; }); } });
const numeriques = vars.filter(v => v.type !== 'texte').map(v => v.code).concat(Scoring.COLONNES, ['duree_minutes', 'consentement']);

const gabarit = fs.readFileSync(path.join(__dirname, 'Code.gabarit.gs'), 'utf8');
const sortie = gabarit
  .replace('/*__COLONNES__*/[]', JSON.stringify(colonnes))
  .replace('/*__NUMERIQUES__*/[]', JSON.stringify(numeriques))
  .replace('/*__LIBELLES__*/{}', JSON.stringify(libelles))
  .replace('/*__DICTIONNAIRE__*/[]', JSON.stringify(dictionnaire));
fs.writeFileSync(path.join(racine, 'apps-script/Code.gs'), sortie);
console.log('apps-script/Code.gs généré : ' + colonnes.length + ' colonnes (' + vars.length + ' variables du questionnaire, ' + Scoring.COLONNES.length + ' colonnes de scores).');
