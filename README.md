# SHIHTY+ (صحيحتي+) — site de l'enquête nationale

« Addictions comportementales liées à Internet et santé des étudiants marocains » — Laboratoire d'Épidémiologie et de Recherche en Sciences de la Santé, FMPM Fès (USMBA).

Site statique (HTML/CSS/JS, sans compilation), en arabe RTL, pensé d'abord pour le téléphone. Les réponses sont envoyées à Google Sheets par un script Google Apps Script.

**Mise en ligne : voir [GUIDE_DEPLOIEMENT.md](GUIDE_DEPLOIEMENT.md).**

## Arborescence

```
index.html                  page unique
css/style.css               charte graphique (dégradé #4ADE80 → #8B5CF6, Tajawal)
js/config.js                À MODIFIER : adresse du script Google, contact, code du mode saisie
js/schema.js                lecture de questions.json : filtres, variables, ordre des colonnes
js/scoring.js               calcul des scores et niveaux (+ seuils modifiables)
js/fx.js                    effets : formes flottantes, clics magiques, halo, vol des autocollants
js/app.js                   parcours : accueil → consentement → prénom → questionnaire → envoi → résultats
data/questions.json         TOUTES les questions : codes, texte arabe, options, codage, conditions
data/textes.json            textes de l'interface
data/feedback.json          niveaux, explications et conseils affichés à l'étudiant
data/ressources.json        bloc de soutien et ressources d'aide (à compléter par l'équipe)
assets/fonts/               police Tajawal hébergée avec le site (aucun appel à un service tiers)
apps-script/Code.gs         script à coller dans Google Sheets (généré)
tools/                      générateur de Code.gs
tests/scoring.test.js       tests du calcul des scores et des filtres
```

## Essayer en local

Le site charge des fichiers JSON : il faut le servir par HTTP (un double-clic sur `index.html` ne suffit pas).

```bash
python3 -m http.server 8000
```

Puis ouvrir <http://localhost:8000>. Sans `ENDPOINT_URL`, le site est en mode démonstration (rien n'est envoyé).

## Tests

```bash
node --test tests/scoring.test.js
```

## Décisions de l'équipe (section 8 du cahier des charges)

| # | Sujet | Décision appliquée |
|---|---|---|
| 1 | BFI-2-S | Clé du §5 (items regroupés par domaine) |
| 2 | MHC-SF | Item manquant réintégré en position 8 → 14 items, critères de Keyes standard |
| 3 | Pornographie | PPCS-18 seul (seuil 76) + 6 facteurs ; pas de PPCS-6 dérivé |
| 4 | ChatGPT | Codage 1–4, somme 11–44, tiers descriptifs 11–21 / 22–32 / 33–44 |
| 5 | SMAS item 5 | Non inversé |
| 6 | SMAS / POGQ | Codage 1–5 |
| 7 | PHQ-9 item 9 | 0–3 standard (total 0–27) |
| 8 | GAD-7 | « خلال الأسبوعين الأخيرين » ; sévère = 15–21 |
| 9 | Activité physique | Les deux cases issues de l'IPAQ sont conservées (`AP_pas_intense`, `AP_pas_marche`, 0/1) |
| 10 | Fréquence jeux | 4 options (1–4), la dernière fusionnée « كل يوم / كل أيام الأسبوع » |
| 11 | Parents | Libellé « متوفيان » conservé |
| 12 | Seuils sans référence | Propositions du §6 validées (SMAS, OGD-Q, activité physique) |
| 13 | Moins de 18 ans | Aucune restriction (âge 16–70, section 2E affichée à tous) |

## Choix d'implémentation à connaître

- Tableau des réseaux sociaux : au moins un réseau doit être coché ; « الأقل استخداما » n'est demandé que si deux réseaux ou plus sont cochés.
- Université : liste des 12 universités publiques (`SE_universite`, codes 1–12) + « أخرى » (13) avec saisie libre dans `SE_universite_autre`.
- Âges de première utilisation : refusés s'ils dépassent l'âge déclaré.
- `duree_minutes` : temps actif de remplissage (les pauses de plus de 5 minutes ne sont pas comptées).
- Niveaux exportés (`NIVEAU_…`) : voir la feuille « Dictionnaire » du tableur pour le sens de chaque code.
- Les échelles de l'annexe B (SAS-SV, IAT, CPUI-9, PPCS-6 séparé, IPAQ-SF, RSES, NMP-Q) ne sont pas implémentées.
- Parcours en aventure : chaque partie est une « station » sur une île flottante (vol d'arrivée, étudiant qui attend, route des 20 stations). Une échelle entière par page. Illustrations d'étudiants : `assets/etudiants/` + `data/textes.json` → `etudiants.images` (emojis tant que la liste est vide).
- Activité physique : seulement les 2 questions en jours (les cases IPAQ ont été supprimées).
- Icônes : jeu d'icônes dessiné pour le site (`js/icones.js`), qui remplace automatiquement les emojis (`js/emoji3d.js`). Logo : étoile khatam du zellige.
- Design SHIHTY+ : palette sarcelle · corail · sable, formes flottantes en parallaxe, clics magiques (éclats + petite vibration sur Android), album de 20 autocollants (un par partie terminée, bouton « ألبومي » en haut). Le résultat de chaque échelle est affiché juste après sa partie (`apres_partie` dans `data/feedback.json`), puis un récapitulatif complet à la fin. Le MINI n'affiche jamais de niveau : seulement le bloc de soutien si une réponse est « نعم ».
- Mascotte Dittou (ديتو, anciennement « Bitto » dans le code) (`assets/bitto/`, `js/avatar.js`) : un petit téléphone vivant. Accueil : ses pupilles, dessinées par code sur l'image « yeux », suivent la souris (ou le doigt sur téléphone) ; il cligne des yeux, se penche vers le curseur, sautille, et réagit (survol → rit, clic → surpris / rit / cœurs, 6 clics rapides → agacé, bouton « ابدأ » → cœurs, laissé seul → batterie faible puis endormi). Voyage 3D : il sautille de dos jusqu'à la station puis se retourne et salue. Images générées avec Gemini sur fond magenta, fond retiré par script.
- Mise à jour : à chaque publication, augmenter ensemble `version.json`, `SHIHTY_VERSION` et les `?v=` dans `index.html` ; les visiteurs dont le navigateur garde une ancienne page sont rechargés automatiquement.
- Parcours : 17 stations. Les 4 parties d'informations personnelles (1A démographique, 1B familial, 1C socio-économique et académique, 1D relationnel) forment une seule station « معلوماتك الشخصية » (id 1A), avec leur ancien titre en intertitre ; les variables et colonnes sont inchangées. La carte de toute la route s'affiche juste après le consentement.
- Dittou parle (bulles, `data/textes.json` → `ditto`) : accueil, réactions, carte de départ, une phrase par station, remerciement final. Marche : bonds de lapin (il n'avance que pendant le saut, nuage de poussière à l'atterrissage).
- Dittou compagnon (`js/compagnon.js`) : un seul Dittou fixe qui vole en courbe 3D — accueil au défilement (sections tunnel, texte, « كيف تجري الرحلة », bouton final), questionnaire (près de la carte ; sur téléphone il dépasse du bas de l'écran), réactions aux réponses, saut de joie quand la page est complète, transition 3D entre les pages (l'ancienne page pivote et part), résultats (expression et phrase selon le niveau). Caché sur les stations 3D, la carte et le mode saisie. Phrases : `data/textes.json` → `ditto.compagnon`.
- Troupe de Dittou sur l'accueil (`js/troupe.js`) : 5 Dittou (3 sur téléphone) changent de place, de taille, de rotation et d'expression d'une section à l'autre en suivant le défilement (effet « Morphose ») ; les scènes sont des listes de positions modifiables en haut du fichier.
