/**
 * صحيحتي+ — réception des réponses de l'enquête dans Google Sheets.
 * FICHIER GÉNÉRÉ par tools/generer-apps-script.js : ne pas modifier les listes à la main.
 *
 * Installation (voir GUIDE_DEPLOIEMENT.md) :
 *   1. Coller ce fichier dans Extensions → Apps Script du classeur Google Sheets.
 *   2. Exécuter une fois la fonction « installer » (crée les feuilles et le dictionnaire).
 *   3. Déployer → Nouveau déploiement → Application Web (Exécuter en tant que : moi ; Accès : tout le monde).
 *
 * Confidentialité : le script n'enregistre ni adresse IP, ni e-mail, ni aucune donnée identifiante.
 */

var FEUILLE_REPONSES = 'Réponses';
var FEUILLE_LIBELLES = 'Réponses_libellés';
var FEUILLE_DICTIONNAIRE = 'Dictionnaire';
var TAILLE_MAX = 60000;       // taille maximale d'un envoi (caractères)
var TEXTE_MAX = 200;          // longueur maximale d'une réponse en texte libre

var COLONNES = /*__COLONNES__*/[];
var NUMERIQUES = /*__NUMERIQUES__*/[];
var LIBELLES = /*__LIBELLES__*/{};
var DICTIONNAIRE = /*__DICTIONNAIRE__*/[];

/** À exécuter une fois : crée (ou met à jour) les feuilles, les en-têtes et le dictionnaire. */
function installer() {
  var classeur = SpreadsheetApp.getActiveSpreadsheet();
  preparerFeuille_(classeur, FEUILLE_REPONSES);
  preparerFeuille_(classeur, FEUILLE_LIBELLES);
  var dico = classeur.getSheetByName(FEUILLE_DICTIONNAIRE) || classeur.insertSheet(FEUILLE_DICTIONNAIRE);
  dico.clear();
  var entetes = [['Variable', 'Texte de la question / description', 'Type', 'Valeurs et libellés', 'Partie', 'Condition d\'affichage', 'Remarque']];
  dico.getRange(1, 1, 1, 7).setValues(entetes).setFontWeight('bold');
  dico.getRange(2, 1, DICTIONNAIRE.length, 7).setValues(DICTIONNAIRE);
  dico.setFrozenRows(1);
  dico.setRightToLeft(false);
}

function preparerFeuille_(classeur, nom) {
  var f = classeur.getSheetByName(nom) || classeur.insertSheet(nom);
  var existant = f.getLastColumn() ? f.getRange(1, 1, 1, f.getLastColumn()).getValues()[0] : [];
  if (f.getLastRow() > 1 && existant.join('|') !== COLONNES.join('|')) {
    throw new Error('La feuille « ' + nom + ' » contient déjà des réponses avec d\'autres colonnes. ' +
      'Renommez-la (ex. « ' + nom + '_ancien ») puis relancez installer().');
  }
  if (f.getMaxColumns() < COLONNES.length) f.insertColumnsAfter(f.getMaxColumns(), COLONNES.length - f.getMaxColumns());
  f.getRange(1, 1, 1, COLONNES.length).setValues([COLONNES]).setFontWeight('bold');
  f.setFrozenRows(1);
  f.setFrozenColumns(1);
  return f;
}

/** Test rapide dans le navigateur : l'adresse /exec doit afficher {"ok":true,...}. */
function doGet() {
  return json_({ ok: true, service: 'sihhaty-enquete', colonnes: COLONNES.length });
}

/** Réception d'une participation : une ligne ajoutée, dans l'ordre exact des en-têtes. */
function doPost(e) {
  try {
    var corps = e && e.postData && e.postData.contents;
    if (!corps || corps.length > TAILLE_MAX) return json_({ ok: false, erreur: 'envoi vide ou trop volumineux' });
    var donnees = JSON.parse(corps);
    var ligne = donnees && donnees.ligne;
    if (!ligne || typeof ligne !== 'object') return json_({ ok: false, erreur: 'format' });
    var id = String(ligne.id_participation || '');
    if (!/^[0-9a-f-]{36}$/i.test(id)) return json_({ ok: false, erreur: 'identifiant' });
    if (Number(ligne.consentement) !== 1) return json_({ ok: false, erreur: 'consentement' });

    var estNumerique = {};
    NUMERIQUES.forEach(function (c) { estNumerique[c] = true; });
    var maintenant = new Date();
    var codes = [], textes = [];
    COLONNES.forEach(function (c) {
      var v = c === 'horodatage' ? maintenant : nettoyer_(ligne[c], estNumerique[c]);
      codes.push(v);
      textes.push(LIBELLES[c] && v !== '' && LIBELLES[c][v] !== undefined ? LIBELLES[c][v] : v);
    });

    var verrou = LockService.getScriptLock();
    verrou.waitLock(30000);                       // envois simultanés : un à la fois
    try {
      var classeur = SpreadsheetApp.getActiveSpreadsheet();
      var feuille = classeur.getSheetByName(FEUILLE_REPONSES) || preparerFeuille_(classeur, FEUILLE_REPONSES);
      // Double envoi (bouton cliqué deux fois, réseau instable) : le même identifiant n'est enregistré qu'une fois.
      var dernier = feuille.getLastRow();
      if (dernier > 1) {
        var deja = feuille.getRange(2, 1, dernier - 1, 1).createTextFinder(id).matchEntireCell(true).findNext();
        if (deja) return json_({ ok: true, doublon: true });
      }
      feuille.appendRow(codes);
      var feuilleTexte = classeur.getSheetByName(FEUILLE_LIBELLES);
      if (feuilleTexte) feuilleTexte.appendRow(textes);
    } finally {
      verrou.releaseLock();
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, erreur: String(err && err.message || err) });
  }
}

/** Nombres pour les variables codées ; texte libre tronqué et neutralisé (pas de formule dans le tableur). */
function nettoyer_(v, numerique) {
  if (v === undefined || v === null || v === '') return '';
  if (numerique) {
    var n = Number(v);
    return isFinite(n) ? n : '';
  }
  var s = String(v).replace(/[\u0000-\u001f]/g, ' ').slice(0, TEXTE_MAX);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json_(objet) {
  return ContentService.createTextOutput(JSON.stringify(objet)).setMimeType(ContentService.MimeType.JSON);
}
