/* Tests du calcul des scores et des filtres :  node --test tests/  */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const Scoring = require('../js/scoring.js');
const Schema = require('../js/schema.js');
const Q = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/questions.json'), 'utf8'));

const pad = n => String(n).padStart(2, '0');
/** remplir('PHQ', 9, 2) → {PHQ_01: 2, …} ; la valeur peut être un tableau (items 1..n). */
function remplir(prefixe, n, valeur) {
  const r = {};
  for (let i = 1; i <= n; i++) r[`${prefixe}_${pad(i)}`] = Array.isArray(valeur) ? valeur[i - 1] : valeur;
  return r;
}

test('règle commune : un item manquant → score et niveau vides', () => {
  const rep = remplir('PHQ', 9, 1); delete rep.PHQ_04;
  const s = Scoring.calculer(rep);
  assert.equal(s.SCORE_PHQ9, ''); assert.equal(s.NIVEAU_PHQ9, '');
  assert.equal(Scoring.calculer({}).SCORE_BFI_E, '');
});

test('BFI-2-S : inversion, domaines, facettes, niveaux relatifs', () => {
  // Tout à 3 → tous les scores à 3, niveaux « proche »
  let s = Scoring.calculer(remplir('BFI', 30, 3));
  for (const d of 'EACNO') { assert.equal(s['SCORE_BFI_' + d], 3); assert.equal(s['SOMME_BFI_' + d], 18); assert.equal(s['NIVEAU_BFI_' + d], 2); }
  // Tout à 5 : chaque domaine a 3 items directs (5) et 3 inversés (6−5=1) → moyenne 3
  s = Scoring.calculer(remplir('BFI', 30, 5));
  assert.equal(s.SCORE_BFI_E, 3); assert.equal(s.SCORE_BFI_SOC, 3);
  // Extraversion maximale : items directs (2,3,4) à 5, inversés (1,5,6) à 1 ; le reste à 3
  const rep = remplir('BFI', 30, 3);
  Object.assign(rep, { BFI_01: 1, BFI_02: 5, BFI_03: 5, BFI_04: 5, BFI_05: 1, BFI_06: 1 });
  s = Scoring.calculer(rep);
  assert.equal(s.SCORE_BFI_E, 5); assert.equal(s.SOMME_BFI_E, 30);
  assert.equal(s.SCORE_BFI_SOC, 5); assert.equal(s.SCORE_BFI_ASS, 5); assert.equal(s.SCORE_BFI_ENE, 5);
  assert.equal(s.SCORE_BFI_MOYEN, 3.4);
  assert.equal(s.NIVEAU_BFI_E, 3);   // 5 > 3,4 + 0,25
  assert.equal(s.NIVEAU_BFI_A, 1);   // 3 < 3,4 − 0,25
  // Facette : BFI_19 (anxiété, direct)=5 et BFI_22 (anxiété, inversé)=2 → (5+4)/2
  const r2 = remplir('BFI', 30, 3); r2.BFI_19 = 5; r2.BFI_22 = 2;
  assert.equal(Scoring.calculer(r2).SCORE_BFI_ANX, 4.5);
});

test('clé BFI et PSS cohérentes avec les marques « inverse » de questions.json', () => {
  const items = {};
  Schema.elements(Q).forEach(x => { if (x.el.type === 'echelle') x.el.items.forEach(i => { items[i.var] = !!i.inverse; }); });
  Scoring.BFI_CLE.forEach((k, i) => assert.equal(items['BFI_' + pad(i + 1)], !!k[2], 'BFI_' + pad(i + 1)));
  for (let i = 1; i <= 10; i++) assert.equal(items['PSS_' + pad(i)], Scoring.PSS_INVERSES.includes(i), 'PSS_' + pad(i));
});

test('MSPSS : moyennes, sous-échelles, niveaux de Zimet', () => {
  const v = [7, 7, 1, 1, 7, 4, 4, 1, 4, 7, 1, 4]; // SO=7, FAM=1, AMIS=4
  const s = Scoring.calculer(remplir('MSPSS', 12, v));
  assert.equal(s.SCORE_MSPSS_SO, 7); assert.equal(s.SCORE_MSPSS_FAM, 1); assert.equal(s.SCORE_MSPSS_AMIS, 4);
  assert.equal(s.SCORE_MSPSS_TOTAL, 4); assert.equal(s.NIVEAU_MSPSS, 2);
  assert.equal(Scoring.calculer(remplir('MSPSS', 12, 2)).NIVEAU_MSPSS, 1);
  assert.equal(Scoring.calculer(remplir('MSPSS', 12, 5)).NIVEAU_MSPSS, 2);   // 5,0 = modéré
  assert.equal(Scoring.calculer(remplir('MSPSS', 12, 6)).NIVEAU_MSPSS, 3);
});

test('SMAS : somme simple, item 5 non inversé (décision de l\'équipe)', () => {
  const rep = remplir('SMAS', 14, 1); rep.SMAS_05 = 5;
  assert.equal(Scoring.calculer(rep).SCORE_SMAS, 18);
  assert.equal(Scoring.calculer(remplir('SMAS', 14, 2)).NIVEAU_SMAS, 1);   // 28
  assert.equal(Scoring.calculer(remplir('SMAS', 14, 3)).NIVEAU_SMAS, 2);   // 42
  assert.equal(Scoring.calculer(remplir('SMAS', 14, 4)).NIVEAU_SMAS, 3);   // 56
});

test('POGQ : seuil 65', () => {
  const rep = remplir('POGQ', 18, 3);                       // 54
  assert.equal(Scoring.calculer(rep).NIVEAU_POGQ, 2);
  for (let i = 1; i <= 10; i++) rep['POGQ_' + pad(i)] = 4;  // 64
  assert.equal(Scoring.calculer(rep).SCORE_POGQ, 64); assert.equal(Scoring.calculer(rep).NIVEAU_POGQ, 2);
  rep.POGQ_11 = 4;                                          // 65
  assert.equal(Scoring.calculer(rep).NIVEAU_POGQ, 3);
  assert.equal(Scoring.calculer(remplir('POGQ', 18, 2)).NIVEAU_POGQ, 1);  // 36
});

test('OGD-Q : 11 = aucun signe, 12–32, 33–55', () => {
  const rep = remplir('OGDQ', 11, 1);
  assert.equal(Scoring.calculer(rep).NIVEAU_OGDQ, 1);
  rep.OGDQ_03 = 2; assert.equal(Scoring.calculer(rep).NIVEAU_OGDQ, 2);
  assert.equal(Scoring.calculer(remplir('OGDQ', 11, 3)).NIVEAU_OGDQ, 3);  // 33
});

test('PPCS-18 : total, facteurs, seuil 76, pas de PPCS-6', () => {
  const v = [1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6, 1, 2, 3, 4, 5, 6];
  const s = Scoring.calculer(remplir('PPCS', 18, v));
  assert.equal(s.SCORE_PPCS18, 63);
  assert.deepEqual([s.SCORE_PPCS_SAIL, s.SCORE_PPCS_HUM, s.SCORE_PPCS_CONF, s.SCORE_PPCS_TOL, s.SCORE_PPCS_RECH, s.SCORE_PPCS_SEVR], [3, 6, 9, 12, 15, 18]);
  assert.equal(s.NIVEAU_PPCS18, 1);
  assert.equal('SCORE_PPCS6' in s, false);
  const rep = remplir('PPCS', 18, 4); rep.PPCS_01 = 7; rep.PPCS_02 = 5;   // 72 + 3 + 1 = 76
  assert.equal(Scoring.calculer(rep).SCORE_PPCS18, 76); assert.equal(Scoring.calculer(rep).NIVEAU_PPCS18, 2);
});

test('ChatGPT : tiers 11–21 / 22–32 / 33–44', () => {
  assert.equal(Scoring.calculer(remplir('CGPT', 11, 1)).NIVEAU_CGPT, 1);
  assert.equal(Scoring.calculer(remplir('CGPT', 11, 2)).NIVEAU_CGPT, 2);
  assert.equal(Scoring.calculer(remplir('CGPT', 11, 3)).NIVEAU_CGPT, 3);
  assert.equal(Scoring.calculer(remplir('CGPT', 11, 4)).SCORE_CGPT, 44);
});

test('activité physique : moyenne des deux questions', () => {
  let s = Scoring.calculer({ AP_semaine_passee: 4, AP_semaine_type: 5 });
  assert.equal(s.SCORE_AP, 4.5); assert.equal(s.NIVEAU_AP, 2);
  assert.equal(Scoring.calculer({ AP_semaine_passee: 5, AP_semaine_type: 5 }).NIVEAU_AP, 3);
  assert.equal(Scoring.calculer({ AP_semaine_passee: 0, AP_semaine_type: 0 }).NIVEAU_AP, 1);   // 0 est une vraie réponse
  assert.equal(Scoring.calculer({ AP_semaine_passee: 3 }).SCORE_AP, '');
});

test('DEQ-5, ISI : sommes et seuils', () => {
  assert.equal(Scoring.calculer(remplir('DEQ', 5, [4, 5, 4, 5, 4])).SCORE_DEQ5, 22);
  assert.equal(Scoring.calculer(remplir('DEQ', 5, [1, 1, 1, 1, 1])).NIVEAU_DEQ5, 1);
  assert.equal(Scoring.calculer(remplir('DEQ', 5, [2, 1, 1, 1, 1])).NIVEAU_DEQ5, 2);
  assert.equal(Scoring.calculer(remplir('DEQ', 5, [3, 3, 2, 2, 2])).NIVEAU_DEQ5, 3);
  assert.equal(Scoring.calculer(remplir('ISI', 7, 1)).NIVEAU_ISI, 1);   // 7
  assert.equal(Scoring.calculer(remplir('ISI', 7, 2)).NIVEAU_ISI, 2);   // 14
  assert.equal(Scoring.calculer(remplir('ISI', 7, 3)).NIVEAU_ISI, 3);   // 21
  assert.equal(Scoring.calculer(remplir('ISI', 7, 4)).NIVEAU_ISI, 4);   // 28
});

test('PSS-10 : items 4, 5, 7, 8 inversés', () => {
  assert.equal(Scoring.calculer(remplir('PSS', 10, 0)).SCORE_PSS, 16);   // 4 items inversés × 4
  assert.equal(Scoring.calculer(remplir('PSS', 10, 4)).SCORE_PSS, 24);   // 6 items directs × 4
  const pire = remplir('PSS', 10, 4); [4, 5, 7, 8].forEach(i => { pire['PSS_' + pad(i)] = 0; });
  assert.equal(Scoring.calculer(pire).SCORE_PSS, 40); assert.equal(Scoring.calculer(pire).NIVEAU_PSS, 3);
  const mieux = remplir('PSS', 10, 0); [4, 5, 7, 8].forEach(i => { mieux['PSS_' + pad(i)] = 4; });
  assert.equal(Scoring.calculer(mieux).SCORE_PSS, 0); assert.equal(Scoring.calculer(mieux).NIVEAU_PSS, 1);
});

test('PHQ-9 (0–27) et GAD-7 (sévère 15–21)', () => {
  assert.equal(Scoring.calculer(remplir('PHQ', 9, 3)).SCORE_PHQ9, 27);
  const niveaux = [[0, 1], [4, 1], [5, 2], [9, 2], [10, 3], [14, 3], [15, 4], [19, 4], [20, 5]];
  for (const [total, niv] of niveaux) {
    const v = Array(9).fill(0); let reste = total;
    for (let i = 0; i < 9 && reste > 0; i++) { v[i] = Math.min(3, reste); reste -= v[i]; }
    assert.equal(Scoring.calculer(remplir('PHQ', 9, v)).NIVEAU_PHQ9, niv, 'PHQ total ' + total);
  }
  assert.equal(Scoring.calculer(remplir('GAD', 7, 3)).NIVEAU_GAD7, 4);                    // 21
  assert.equal(Scoring.calculer(remplir('GAD', 7, [3, 3, 3, 3, 3, 0, 0])).NIVEAU_GAD7, 4); // 15
  assert.equal(Scoring.calculer(remplir('GAD', 7, 2)).NIVEAU_GAD7, 3);                    // 14
  assert.equal(Scoring.calculer(remplir('GAD', 7, [1, 1, 1, 1, 0, 0, 0])).NIVEAU_GAD7, 1); // 4
});

test('MINI : règle du protocole', () => {
  const mini = v => Scoring.calculer(remplir('MINI', 6, v)).NIVEAU_MINI;
  assert.equal(mini([0, 0, 0, 0, 0, 0]), 0);
  assert.equal(mini([1, 0, 0, 0, 0, 0]), 1);
  assert.equal(mini([0, 1, 0, 0, 0, 0]), 1);
  assert.equal(mini([0, 0, 0, 0, 0, 1]), 1);
  assert.equal(mini([0, 0, 1, 0, 0, 0]), 2);
  assert.equal(mini([0, 1, 0, 0, 0, 1]), 2);
  assert.equal(mini([0, 0, 1, 0, 0, 1]), 3);
  assert.equal(mini([0, 0, 0, 1, 0, 0]), 3);
  assert.equal(mini([0, 0, 0, 0, 1, 0]), 3);
});

test('MHC-SF 14 items : florissante / modérée / languissante', () => {
  let s = Scoring.calculer(remplir('MHC', 14, 5));
  assert.equal(s.SCORE_MHC, 70); assert.equal(s.SCORE_MHC_EMO, 15); assert.equal(s.SCORE_MHC_SOC, 25); assert.equal(s.SCORE_MHC_PSY, 30);
  assert.equal(s.NIVEAU_MHC, 3);
  assert.equal(Scoring.calculer(remplir('MHC', 14, 0)).NIVEAU_MHC, 1);
  assert.equal(Scoring.calculer(remplir('MHC', 14, 3)).NIVEAU_MHC, 2);
  // 1 item émotionnel haut + 6 items de fonctionnement hauts = florissante ; avec 5 seulement = modérée
  const v = [4, 2, 2, 4, 4, 4, 4, 4, 4, 2, 2, 2, 2, 2];
  assert.equal(Scoring.calculer(remplir('MHC', 14, v)).NIVEAU_MHC, 3);
  v[8] = 3;
  assert.equal(Scoring.calculer(remplir('MHC', 14, v)).NIVEAU_MHC, 2);
});

test('bloc de soutien : PHQ_09 ≥ 1 ou un item MINI = oui', () => {
  assert.equal(Scoring.besoinSoutien({}), false);
  assert.equal(Scoring.besoinSoutien(Object.assign(remplir('PHQ', 9, 0), remplir('MINI', 6, 0))), false);
  assert.equal(Scoring.besoinSoutien({ PHQ_09: 1 }), true);
  assert.equal(Scoring.besoinSoutien({ MINI_06: 1 }), true);
});

test('filtres : une question non affichée reste vide, même si une ancienne réponse existe', () => {
  // A répondu aux jeux vidéo, puis est revenu en arrière et a mis « jamais essayé »
  const rep = Object.assign({ JV_essaye: 0, JV_actuel: 1, JV_age: 12, JV_freq: 2 }, remplir('POGQ', 18, 5));
  const eff = Schema.effectives(Q, rep).rep;
  assert.equal(eff.JV_actuel, 0);            // valeur automatique
  assert.equal(eff.JV_age, undefined);
  assert.equal(eff.POGQ_01, undefined);
  assert.equal(Scoring.calculer(eff).SCORE_POGQ, '');
  // Pornographie : « jamais vu » masque tout le reste en cascade
  const e2 = Schema.effectives(Q, Object.assign({ PO_deja: 0, PO_6mois: 1, PO_mois: 1, PO_7jours: 1 }, remplir('PPCS', 18, 7))).rep;
  assert.equal(e2.PO_6mois, undefined); assert.equal(e2.PPCS_01, undefined); assert.equal(e2.PO_7jours, undefined);
  // Parents : les questions sur la mère/le père sont masquées seulement si les deux sont décédés
  assert.equal(Schema.effectives(Q, { SF_parents: 3, SF_deces: 2, SF_mere_prof: 1 }).rep.SF_mere_prof, undefined);
  assert.equal(Schema.effectives(Q, { SF_parents: 3, SF_deces: 1, SF_mere_prof: 1 }).rep.SF_mere_prof, 1);
  assert.equal(Schema.effectives(Q, { SF_parents: 1, SF_deces: 2, SF_mere_prof: 1 }).rep.SF_mere_prof, 1); // SF_deces masqué → ignoré
  // Retentissement PHQ : seulement si au moins un item ≥ 1 ; durée OGD-Q : au moins un item ≥ 3
  assert.equal(Schema.effectives(Q, Object.assign(remplir('PHQ', 9, 0), { PHQ_difficulte: 2 })).rep.PHQ_difficulte, undefined);
  assert.equal(Schema.effectives(Q, Object.assign(remplir('PHQ', 9, 0), { PHQ_03: 1, PHQ_difficulte: 2 })).rep.PHQ_difficulte, 2);
  assert.equal(Schema.effectives(Q, Object.assign({ JA_joue: 1 }, remplir('OGDQ', 11, 2), { OGDQ_duree: 3 })).rep.OGDQ_duree, undefined);
  assert.equal(Schema.effectives(Q, Object.assign({ JA_joue: 1 }, remplir('OGDQ', 11, 2), { OGDQ_04: 3, OGDQ_duree: 3 })).rep.OGDQ_duree, 3);
});

test('choix multiples : une colonne 0/1 par option ; réseaux « plus » / « moins » parmi les cochés', () => {
  const eff = Schema.effectives(Q, { RS_utilise_whatsapp: 1, RS_utilise_tiktok: 1, RS_plus: 4, RS_moins: 2 }).rep;
  assert.equal(eff.RS_utilise_whatsapp, 1); assert.equal(eff.RS_utilise_facebook, 0); assert.equal(eff.RS_utilise_x, 0);
  assert.equal(eff.RS_plus, 4);
  assert.equal(eff.RS_moins, undefined);     // Facebook n'est pas coché
  assert.equal(Schema.effectives(Q, { RS_utilise_whatsapp: 1, RS_plus: 1, RS_moins: 1 }).rep.RS_moins, undefined); // un seul réseau
  const jv = Schema.effectives(Q, { JV_essaye: 1, JV_actuel: 1, JV_type_action: 1 }).rep;
  assert.equal(jv.JV_type_action, 1); assert.equal(jv.JV_type_fiction, 0);
  assert.equal(Schema.effectives(Q, { JV_essaye: 0 }).rep.JV_type_action, undefined);
  assert.equal(Schema.effectives(Q, {}).rep.AP_pas_marche, 0);
});

test('colonnes du tableur : ordre, unicité, nombre d\'items par instrument', () => {
  const cols = Schema.colonnes(Q, Scoring.COLONNES);
  assert.deepEqual(cols.slice(0, 6), ['id_participation', 'horodatage', 'duree_minutes', 'mode', 'consentement', 'num_formulaire']);
  assert.equal(new Set(cols).size, cols.length, 'aucun code en double');
  assert.equal(cols[6], 'SD_sexe');
  assert.ok(cols.indexOf('MHC_14') < cols.indexOf('SCORE_BFI_E'), 'les scores viennent après toutes les variables');
  const attendu = { BFI: 30, MSPSS: 12, SMAS: 14, POGQ: 18, PPCS: 18, CGPT: 11, DEQ: 5, ISI: 7, PSS: 10, MINI: 6, MHC: 14 };
  for (const [p, n] of Object.entries(attendu)) assert.equal(cols.filter(c => new RegExp('^' + p + '_\\d\\d$').test(c)).length, n, p);
  assert.equal(cols.filter(c => /^OGDQ_\d\d$/.test(c)).length, 11);
  assert.equal(cols.filter(c => /^PHQ_\d\d$/.test(c)).length, 9);
  assert.equal(cols.filter(c => /^GAD_\d\d$/.test(c)).length, 7);
  // Aucune échelle de l'annexe B
  assert.equal(cols.some(c => /^(IAT|SAS|CPUI|RSES|NMP|IPAQ)/.test(c)), false);
});
