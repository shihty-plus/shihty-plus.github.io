/* scoring.js — calcul des scores et des niveaux (cahier des charges §6 + décisions de l'équipe §8).
   Règle commune : un score n'est calculé que si TOUS les items de l'échelle sont renseignés ;
   sinon SCORE_… et NIVEAU_… restent vides. Les réponses brutes ne sont jamais modifiées :
   l'inversion des items n'est appliquée qu'ici. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Scoring = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ------------------------------------------------------------------
     SEUILS — modifiables par l'équipe. « min » = borne inférieure incluse du niveau.
     Les niveaux sont lus de haut en bas : le premier dont le score >= min est retenu.
     ------------------------------------------------------------------ */
  var SEUILS = {
    MSPSS: [{ min: 5.01, niveau: 3 }, { min: 3, niveau: 2 }, { min: 1, niveau: 1 }],          // Zimet : 1–2,9 / 3–5 / 5,1–7
    SMAS:  [{ min: 52, niveau: 3 }, { min: 33, niveau: 2 }, { min: 14, niveau: 1 }],          // tiers, validés par l'équipe
    POGQ:  [{ min: 65, niveau: 3 }, { min: 40, niveau: 2 }, { min: 18, niveau: 1 }],          // >= 65 : à risque
    OGDQ:  [{ min: 33, niveau: 3 }, { min: 12, niveau: 2 }, { min: 11, niveau: 1 }],          // validés par l'équipe
    PPCS18:[{ min: 76, niveau: 2 }, { min: 18, niveau: 1 }],                                  // Bőthe et al.
    CGPT:  [{ min: 33, niveau: 3 }, { min: 22, niveau: 2 }, { min: 11, niveau: 1 }],          // tiers descriptifs
    AP:    [{ min: 5, niveau: 3 }, { min: 3, niveau: 2 }, { min: 0, niveau: 1 }],             // validés par l'équipe
    DEQ5:  [{ min: 12, niveau: 3 }, { min: 6, niveau: 2 }, { min: 0, niveau: 1 }],
    ISI:   [{ min: 22, niveau: 4 }, { min: 15, niveau: 3 }, { min: 8, niveau: 2 }, { min: 0, niveau: 1 }],
    PSS:   [{ min: 27, niveau: 3 }, { min: 14, niveau: 2 }, { min: 0, niveau: 1 }],
    PHQ9:  [{ min: 20, niveau: 5 }, { min: 15, niveau: 4 }, { min: 10, niveau: 3 }, { min: 5, niveau: 2 }, { min: 0, niveau: 1 }],
    GAD7:  [{ min: 15, niveau: 4 }, { min: 10, niveau: 3 }, { min: 5, niveau: 2 }, { min: 0, niveau: 1 }]
  };
  var BFI_ECART = 0.25; // au-dessus / en dessous de la moyenne personnelle des 5 domaines

  /* Clé BFI-2-S du §5 (items regroupés par domaine) : [domaine, facette, inversé]. */
  var BFI_CLE = [
    ['E', 'SOC', 1], ['E', 'ASS', 0], ['E', 'ENE', 0], ['E', 'SOC', 0], ['E', 'ASS', 1], ['E', 'ENE', 1],
    ['A', 'COM', 0], ['A', 'RES', 1], ['A', 'CONF', 0], ['A', 'COM', 1], ['A', 'RES', 0], ['A', 'CONF', 1],
    ['C', 'ORG', 1], ['C', 'PROD', 1], ['C', 'RESP', 0], ['C', 'ORG', 0], ['C', 'PROD', 0], ['C', 'RESP', 1],
    ['N', 'ANX', 0], ['N', 'DEP', 0], ['N', 'VOL', 1], ['N', 'ANX', 1], ['N', 'DEP', 1], ['N', 'VOL', 0],
    ['O', 'EST', 0], ['O', 'INT', 1], ['O', 'CRE', 0], ['O', 'EST', 1], ['O', 'INT', 0], ['O', 'CRE', 1]
  ];
  var BFI_DOMAINES = ['E', 'A', 'C', 'N', 'O'];
  var BFI_FACETTES = ['SOC', 'ASS', 'ENE', 'COM', 'RES', 'CONF', 'ORG', 'PROD', 'RESP', 'ANX', 'DEP', 'VOL', 'EST', 'INT', 'CRE'];
  var PSS_INVERSES = [4, 5, 7, 8];
  var PPCS_FACTEURS = { SAIL: [1, 7, 13], HUM: [2, 8, 14], CONF: [3, 9, 15], TOL: [4, 10, 16], RECH: [5, 11, 17], SEVR: [6, 12, 18] };

  /* Colonnes de scores, dans l'ordre du tableur, avec leur description (feuille « Dictionnaire »). */
  var D = [];
  function col(code, description, valeurs) { D.push({ code: code, description: description, valeurs: valeurs || '' }); }
  var NOMS_DOM = { E: 'Extraversion', A: 'Agréabilité', C: 'Conscienciosité', N: 'Émotionnalité négative', O: 'Ouverture d\'esprit' };
  BFI_DOMAINES.forEach(function (d) { col('SCORE_BFI_' + d, 'BFI-2-S ' + NOMS_DOM[d] + ' : moyenne des 6 items (1–5), items R inversés'); });
  BFI_DOMAINES.forEach(function (d) { col('SOMME_BFI_' + d, 'BFI-2-S ' + NOMS_DOM[d] + ' : somme des 6 items (6–30)'); });
  BFI_FACETTES.forEach(function (f) { col('SCORE_BFI_' + f, 'BFI-2-S facette ' + f + ' : moyenne des 2 items (1–5)'); });
  col('SCORE_BFI_MOYEN', 'BFI-2-S : moyenne des 5 scores de domaine');
  BFI_DOMAINES.forEach(function (d) { col('NIVEAU_BFI_' + d, 'BFI-2-S ' + NOMS_DOM[d] + ' par rapport à la moyenne personnelle (±0,25)', '3 = au-dessus ; 2 = proche ; 1 = en dessous'); });
  col('SCORE_MSPSS_TOTAL', 'MSPSS : moyenne des 12 items (1–7)');
  col('SCORE_MSPSS_FAM', 'MSPSS famille : moyenne des items 3, 4, 8, 11');
  col('SCORE_MSPSS_AMIS', 'MSPSS amis : moyenne des items 6, 7, 9, 12');
  col('SCORE_MSPSS_SO', 'MSPSS personne significative : moyenne des items 1, 2, 5, 10');
  col('NIVEAU_MSPSS', 'Soutien social perçu (Zimet)', '1 = faible (1,0–2,9) ; 2 = modéré (3,0–5,0) ; 3 = élevé (5,1–7,0)');
  col('SCORE_SMAS', 'SMAS : somme des 14 items (14–70), item 5 NON inversé (décision de l\'équipe)');
  col('NIVEAU_SMAS', 'Usage des réseaux sociaux (tiers, sans seuil validé)', '1 = 14–32 ; 2 = 33–51 ; 3 = 52–70');
  col('SCORE_POGQ', 'POGQ : somme des 18 items (18–90)');
  col('NIVEAU_POGQ', 'Jeux vidéo', '1 = < 40 ; 2 = 40–64 ; 3 = ≥ 65 (à risque de jeu problématique)');
  col('SCORE_OGDQ', 'OGD-Q : somme des 11 items (11–55)');
  col('NIVEAU_OGDQ', 'Jeux d\'argent en ligne (sans seuil validé)', '1 = 11 (aucun signe) ; 2 = 12–32 ; 3 = 33–55');
  col('SCORE_PPCS18', 'PPCS-18 : somme des 18 items (18–126)');
  col('SCORE_PPCS_SAIL', 'PPCS-18 saillance : items 1, 7, 13');
  col('SCORE_PPCS_HUM', 'PPCS-18 modification de l\'humeur : items 2, 8, 14');
  col('SCORE_PPCS_CONF', 'PPCS-18 conflit : items 3, 9, 15');
  col('SCORE_PPCS_TOL', 'PPCS-18 tolérance : items 4, 10, 16');
  col('SCORE_PPCS_RECH', 'PPCS-18 rechute : items 5, 11, 17');
  col('SCORE_PPCS_SEVR', 'PPCS-18 sevrage : items 6, 12, 18');
  col('NIVEAU_PPCS18', 'Pornographie (Bőthe et al.)', '1 = < 76 ; 2 = ≥ 76 (usage potentiellement problématique)');
  col('SCORE_CGPT', 'ChatGPT : somme des 11 items (11–44)');
  col('NIVEAU_CGPT', 'Usage de ChatGPT (tiers descriptifs, sans seuil validé)', '1 = 11–21 ; 2 = 22–32 ; 3 = 33–44');
  col('SCORE_AP', 'Activité physique : (AP_semaine_passee + AP_semaine_type) / 2 (0–7 jours)');
  col('NIVEAU_AP', 'Activité physique', '3 = ≥ 5 jours (suffisamment actif) ; 2 = 3–4,5 ; 1 = < 3');
  col('SCORE_DEQ5', 'DEQ-5 : somme des 5 items (0–22)');
  col('NIVEAU_DEQ5', 'Sécheresse oculaire', '1 = < 6 ; 2 = 6–11 (possible) ; 3 = ≥ 12 (symptômes importants)');
  col('SCORE_ISI', 'ISI : somme des 7 items (0–28)');
  col('NIVEAU_ISI', 'Insomnie', '1 = 0–7 ; 2 = 8–14 (sous-clinique) ; 3 = 15–21 (modérée) ; 4 = 22–28 (sévère)');
  col('SCORE_PSS', 'PSS-10 : somme des 10 items (0–40), items 4, 5, 7, 8 inversés');
  col('NIVEAU_PSS', 'Stress perçu', '1 = 0–13 ; 2 = 14–26 ; 3 = 27–40');
  col('SCORE_PHQ9', 'PHQ-9 : somme des 9 items (0–27)');
  col('NIVEAU_PHQ9', 'Dépression', '1 = 0–4 ; 2 = 5–9 ; 3 = 10–14 ; 4 = 15–19 ; 5 = 20–27');
  col('SCORE_GAD7', 'GAD-7 : somme des 7 items (0–21)');
  col('NIVEAU_GAD7', 'Anxiété', '1 = 0–4 ; 2 = 5–9 ; 3 = 10–14 ; 4 = 15–21');
  col('NIVEAU_MINI', 'MINI risque suicidaire (jamais affiché à l\'étudiant)', '0 = aucun ; 1 = léger ; 2 = moyen ; 3 = élevé');
  col('SCORE_MHC', 'MHC-SF : somme des 14 items (0–70)');
  col('SCORE_MHC_EMO', 'MHC-SF bien-être émotionnel : items 1–3');
  col('SCORE_MHC_SOC', 'MHC-SF bien-être social : items 4–8');
  col('SCORE_MHC_PSY', 'MHC-SF bien-être psychologique : items 9–14');
  col('NIVEAU_MHC', 'Santé mentale positive (Keyes)', '3 = florissante ; 2 = modérée ; 1 = languissante');
  var COLONNES = D.map(function (d) { return d.code; });

  /* ---------- utilitaires ---------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function manquant(v) { return v === undefined || v === null || v === '' || isNaN(Number(v)); }
  /* Renvoie le tableau des n réponses (index 1..n) ou null si une seule manque. */
  function items(rep, prefixe, n) {
    var t = [null];
    for (var i = 1; i <= n; i++) {
      var v = rep[prefixe + '_' + pad(i)];
      if (manquant(v)) return null;
      t.push(Number(v));
    }
    return t;
  }
  function somme(t, idx) {
    var s = 0;
    if (idx) idx.forEach(function (i) { s += t[i]; });
    else for (var i = 1; i < t.length; i++) s += t[i];
    return s;
  }
  function arrondi(x) { return Math.round(x * 100) / 100; }
  function niveau(cle, score) {
    var s = SEUILS[cle];
    for (var i = 0; i < s.length; i++) if (score >= s[i].min) return s[i].niveau;
    return s[s.length - 1].niveau;
  }

  /* ---------- calcul ---------- */
  function calculer(rep) {
    var r = {};
    COLONNES.forEach(function (c) { r[c] = ''; });
    var t, s;

    // BFI-2-S
    t = items(rep, 'BFI', 30);
    if (t) {
      var parDom = {}, parFac = {};
      BFI_CLE.forEach(function (k, i) {
        var v = k[2] ? 6 - t[i + 1] : t[i + 1];
        (parDom[k[0]] = parDom[k[0]] || []).push(v);
        (parFac[k[1]] = parFac[k[1]] || []).push(v);
      });
      var moyennes = {}, total = 0;
      BFI_DOMAINES.forEach(function (d) {
        var sm = parDom[d].reduce(function (a, b) { return a + b; }, 0);
        moyennes[d] = sm / 6; total += moyennes[d];
        r['SOMME_BFI_' + d] = sm;
        r['SCORE_BFI_' + d] = arrondi(moyennes[d]);
      });
      BFI_FACETTES.forEach(function (f) { r['SCORE_BFI_' + f] = arrondi((parFac[f][0] + parFac[f][1]) / 2); });
      var moy = total / 5;
      r.SCORE_BFI_MOYEN = arrondi(moy);
      BFI_DOMAINES.forEach(function (d) {
        var e = moyennes[d] - moy;
        r['NIVEAU_BFI_' + d] = e > BFI_ECART + 1e-9 ? 3 : (e < -BFI_ECART - 1e-9 ? 1 : 2);
      });
    }

    // MSPSS
    t = items(rep, 'MSPSS', 12);
    if (t) {
      var m = somme(t) / 12;
      r.SCORE_MSPSS_TOTAL = arrondi(m);
      r.SCORE_MSPSS_FAM = arrondi(somme(t, [3, 4, 8, 11]) / 4);
      r.SCORE_MSPSS_AMIS = arrondi(somme(t, [6, 7, 9, 12]) / 4);
      r.SCORE_MSPSS_SO = arrondi(somme(t, [1, 2, 5, 10]) / 4);
      r.NIVEAU_MSPSS = niveau('MSPSS', m);
    }

    // SMAS (item 5 non inversé — décision de l'équipe)
    t = items(rep, 'SMAS', 14);
    if (t) { r.SCORE_SMAS = somme(t); r.NIVEAU_SMAS = niveau('SMAS', r.SCORE_SMAS); }

    // POGQ
    t = items(rep, 'POGQ', 18);
    if (t) { r.SCORE_POGQ = somme(t); r.NIVEAU_POGQ = niveau('POGQ', r.SCORE_POGQ); }

    // OGD-Q
    t = items(rep, 'OGDQ', 11);
    if (t) { r.SCORE_OGDQ = somme(t); r.NIVEAU_OGDQ = niveau('OGDQ', r.SCORE_OGDQ); }

    // PPCS-18 (seul, sans PPCS-6 dérivé — décision de l'équipe)
    t = items(rep, 'PPCS', 18);
    if (t) {
      r.SCORE_PPCS18 = somme(t);
      Object.keys(PPCS_FACTEURS).forEach(function (f) { r['SCORE_PPCS_' + f] = somme(t, PPCS_FACTEURS[f]); });
      r.NIVEAU_PPCS18 = niveau('PPCS18', r.SCORE_PPCS18);
    }

    // ChatGPT
    t = items(rep, 'CGPT', 11);
    if (t) { r.SCORE_CGPT = somme(t); r.NIVEAU_CGPT = niveau('CGPT', r.SCORE_CGPT); }

    // Activité physique
    if (!manquant(rep.AP_semaine_passee) && !manquant(rep.AP_semaine_type)) {
      r.SCORE_AP = (Number(rep.AP_semaine_passee) + Number(rep.AP_semaine_type)) / 2;
      r.NIVEAU_AP = niveau('AP', r.SCORE_AP);
    }

    // DEQ-5
    t = items(rep, 'DEQ', 5);
    if (t) { r.SCORE_DEQ5 = somme(t); r.NIVEAU_DEQ5 = niveau('DEQ5', r.SCORE_DEQ5); }

    // ISI
    t = items(rep, 'ISI', 7);
    if (t) { r.SCORE_ISI = somme(t); r.NIVEAU_ISI = niveau('ISI', r.SCORE_ISI); }

    // PSS-10
    t = items(rep, 'PSS', 10);
    if (t) {
      s = 0;
      for (var i = 1; i <= 10; i++) s += PSS_INVERSES.indexOf(i) >= 0 ? 4 - t[i] : t[i];
      r.SCORE_PSS = s; r.NIVEAU_PSS = niveau('PSS', s);
    }

    // PHQ-9
    t = items(rep, 'PHQ', 9);
    if (t) { r.SCORE_PHQ9 = somme(t); r.NIVEAU_PHQ9 = niveau('PHQ9', r.SCORE_PHQ9); }

    // GAD-7
    t = items(rep, 'GAD', 7);
    if (t) { r.SCORE_GAD7 = somme(t); r.NIVEAU_GAD7 = niveau('GAD7', r.SCORE_GAD7); }

    // MINI — risque suicidaire (exporté, jamais affiché)
    t = items(rep, 'MINI', 6);
    if (t) {
      var c1 = t[1] === 1, c2 = t[2] === 1, c3 = t[3] === 1, c4 = t[4] === 1, c5 = t[5] === 1, c6 = t[6] === 1;
      if (c4 || c5 || (c3 && c6)) r.NIVEAU_MINI = 3;
      else if (c3 || (c2 && c6)) r.NIVEAU_MINI = 2;
      else if (c1 || c2 || c6) r.NIVEAU_MINI = 1;
      else r.NIVEAU_MINI = 0;
    }

    // MHC-SF 14 items (item 8 réintégré — décision de l'équipe) : critères de Keyes
    t = items(rep, 'MHC', 14);
    if (t) {
      r.SCORE_MHC = somme(t);
      r.SCORE_MHC_EMO = somme(t, [1, 2, 3]);
      r.SCORE_MHC_SOC = somme(t, [4, 5, 6, 7, 8]);
      r.SCORE_MHC_PSY = somme(t, [9, 10, 11, 12, 13, 14]);
      var emoHaut = 0, emoBas = 0, foncHaut = 0, foncBas = 0;
      for (var j = 1; j <= 14; j++) {
        var haut = t[j] >= 4, bas = t[j] <= 1;
        if (j <= 3) { emoHaut += haut; emoBas += bas; } else { foncHaut += haut; foncBas += bas; }
      }
      r.NIVEAU_MHC = (emoHaut >= 1 && foncHaut >= 6) ? 3 : ((emoBas >= 1 && foncBas >= 6) ? 1 : 2);
    }
    return r;
  }

  /* Bloc de soutien (§7) : PHQ_09 >= 1 ou au moins un item MINI = oui. */
  function besoinSoutien(rep) {
    if (!manquant(rep.PHQ_09) && Number(rep.PHQ_09) >= 1) return true;
    for (var i = 1; i <= 6; i++) if (Number(rep['MINI_' + pad(i)]) === 1) return true;
    return false;
  }

  return { SEUILS: SEUILS, COLONNES: COLONNES, DICTIONNAIRE: D, BFI_CLE: BFI_CLE, PSS_INVERSES: PSS_INVERSES,
    calculer: calculer, besoinSoutien: besoinSoutien };
});
