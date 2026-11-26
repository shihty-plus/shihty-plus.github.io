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
var FEUILLE_FORMS = 'Réponses (format Google Forms)';
var TAILLE_MAX = 60000;       // taille maximale d'un envoi (caractères)
var TEXTE_MAX = 200;          // longueur maximale d'une réponse en texte libre

var COLONNES = /*__COLONNES__*/[];
var NUMERIQUES = /*__NUMERIQUES__*/[];
var LIBELLES = /*__LIBELLES__*/{};
var DICTIONNAIRE = /*__DICTIONNAIRE__*/[];
var FORMS = /*__FORMS__*/[];   // colonnes de la feuille au format Google Forms
var ENTETES_FORMS = FORMS.map(function (f) { return f.t; });

/** À exécuter une fois : crée (ou met à jour) les feuilles, les en-têtes et le dictionnaire. */
function installer() {
  var classeur = SpreadsheetApp.getActiveSpreadsheet();
  feuillePrete_(classeur, FEUILLE_FORMS, ENTETES_FORMS);
  feuillePrete_(classeur, FEUILLE_REPONSES, COLONNES);
  feuillePrete_(classeur, FEUILLE_LIBELLES, COLONNES);
  var dico = classeur.getSheetByName(FEUILLE_DICTIONNAIRE) || classeur.insertSheet(FEUILLE_DICTIONNAIRE);
  dico.clear();
  var entetes = [['Variable', 'Texte de la question / description', 'Type', 'Valeurs et libellés', 'Partie', 'Condition d\'affichage', 'Remarque']];
  dico.getRange(1, 1, 1, 7).setValues(entetes).setFontWeight('bold');
  dico.getRange(2, 1, DICTIONNAIRE.length, 7).setValues(DICTIONNAIRE);
  dico.setFrozenRows(1);
  dico.setRightToLeft(false);
}

/** Prépare une feuille avec ses en-têtes. Si elle contient déjà des réponses avec d'autres colonnes
    (ancienne version du questionnaire), elle est renommée « … (ancien AAAA-MM-JJ) » et une feuille neuve est créée :
    aucune donnée n'est jamais effacée ni décalée. */
function feuillePrete_(classeur, nom, entetes) {
  var f = classeur.getSheetByName(nom);
  if (f) {
    var largeur = f.getLastColumn();
    var actuel = largeur ? f.getRange(1, 1, 1, largeur).getValues()[0] : [];
    if (actuel.join('|') === entetes.join('|')) return f;
    if (f.getLastRow() > 1) {
      f.setName(nom.slice(0, 60) + ' (ancien ' + Utilities.formatDate(new Date(), 'GMT', 'yyyy-MM-dd HH-mm') + ')');
      f = null;
    }
  }
  if (!f) f = classeur.insertSheet(nom);
  if (f.getMaxColumns() < entetes.length) f.insertColumnsAfter(f.getMaxColumns(), entetes.length - f.getMaxColumns());
  f.getRange(1, 1, 1, entetes.length).setValues([entetes]).setFontWeight('bold');
  f.setFrozenRows(1);
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
    if (donnees && donnees.evaluation) return evaluation_(donnees.evaluation);   // évaluation du site (étoiles)
    var ligne = donnees && donnees.ligne;
    if (!ligne || typeof ligne !== 'object') return json_({ ok: false, erreur: 'format' });
    var id = String(ligne.id_participation || '');
    if (!/^[0-9a-f-]{36}$/i.test(id)) return json_({ ok: false, erreur: 'identifiant' });
    if (Number(ligne.consentement) !== 1) return json_({ ok: false, erreur: 'consentement' });

    var estNumerique = {};
    NUMERIQUES.forEach(function (c) { estNumerique[c] = true; });
    var maintenant = new Date();
    var codes = [], textes = [], valeurs = {};
    COLONNES.forEach(function (c) {
      var v = c === 'horodatage' ? maintenant : nettoyer_(ligne[c], estNumerique[c]);
      valeurs[c] = v;
      codes.push(v);
      textes.push(libelle_(c, v));
    });
    // format Google Forms : réponse en texte, cases à cocher regroupées « A, B, C »
    var forms = FORMS.map(function (f) {
      if (f.m) return f.m.filter(function (p) { return Number(valeurs[p[0]]) === 1; }).map(function (p) { return p[1]; }).join(', ');
      return libelle_(f.k, valeurs[f.k] === undefined ? '' : valeurs[f.k]);
    });

    var verrou = LockService.getScriptLock();
    verrou.waitLock(30000);                       // envois simultanés : un à la fois
    try {
      var classeur = SpreadsheetApp.getActiveSpreadsheet();
      var feuille = feuillePrete_(classeur, FEUILLE_REPONSES, COLONNES);
      // Double envoi (bouton cliqué deux fois, réseau instable) : le même identifiant n'est enregistré qu'une fois.
      var dernier = feuille.getLastRow();
      if (dernier > 1) {
        var deja = feuille.getRange(2, 1, dernier - 1, 1).createTextFinder(id).matchEntireCell(true).findNext();
        if (deja) return json_({ ok: true, doublon: true });
      }
      feuillePrete_(classeur, FEUILLE_FORMS, ENTETES_FORMS).appendRow(forms);
      feuille.appendRow(codes);
      feuillePrete_(classeur, FEUILLE_LIBELLES, COLONNES).appendRow(textes);
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

function libelle_(c, v) {
  return LIBELLES[c] && v !== '' && LIBELLES[c][v] !== undefined ? LIBELLES[c][v] : v;
}

/** Évaluation du site : une ligne par participant dans la feuille « Évaluations ». */
function evaluation_(ev) {
  var id = String(ev.id_participation || '');
  var etoiles = Number(ev.etoiles);
  if (!(etoiles >= 1 && etoiles <= 5)) return json_({ ok: false, erreur: 'etoiles' });
  var verrou = LockService.getScriptLock();
  verrou.waitLock(30000);
  try {
    var classeur = SpreadsheetApp.getActiveSpreadsheet();
    var f = classeur.getSheetByName('Évaluations') || classeur.insertSheet('Évaluations');
    if (f.getLastRow() === 0) { f.appendRow(['Horodatage', 'id_participation', 'etoiles (1-5)', 'commentaire']); f.setFrozenRows(1); }
    if (id && f.getLastRow() > 1 && f.getRange(2, 2, f.getLastRow() - 1, 1).createTextFinder(id).matchEntireCell(true).findNext()) return json_({ ok: true, doublon: true });
    f.appendRow([new Date(), id, etoiles, nettoyer_(ev.commentaire, false)]);
  } finally {
    verrou.releaseLock();
  }
  return json_({ ok: true });
}

function json_(objet) {
  return ContentService.createTextOutput(JSON.stringify(objet)).setMimeType(ContentService.MimeType.JSON);
}
