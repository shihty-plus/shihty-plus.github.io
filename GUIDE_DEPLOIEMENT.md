# Guide de mise en ligne — SHIHTY+ (صحيحتي+)

Ce guide s'adresse à une personne qui n'est pas développeuse. Comptez environ 30 minutes.
Vous aurez besoin : d'un compte Google (celui de l'équipe, qui possédera les données) et du dossier `sihhaty-enquete`.

Le principe : le site est un simple dossier de fichiers hébergé gratuitement. Quand un étudiant termine, son téléphone envoie ses réponses à un petit script Google, qui ajoute une ligne dans un tableur Google Sheets. Vous téléchargez ensuite ce tableur en Excel, comme avec Google Forms.

---

## Étape 1 — Créer le tableur qui recevra les réponses

1. Connectez-vous au compte Google de l'équipe et ouvrez <https://sheets.new> : un tableur vide s'ouvre.
2. Donnez-lui un nom, par exemple « Enquête SIHHATY – réponses ».
3. Menu **Extensions → Apps Script**. Un éditeur de code s'ouvre dans un nouvel onglet.
4. Supprimez tout le texte présent dans l'éditeur.
5. Ouvrez le fichier `apps-script/Code.gs` du dossier (avec le Bloc-notes ou TextEdit), sélectionnez tout (Ctrl+A), copiez (Ctrl+C), puis collez dans l'éditeur (Ctrl+V).
6. Cliquez sur l'icône de disquette (**Enregistrer**).
7. En haut, dans la liste déroulante des fonctions, choisissez **installer**, puis cliquez sur **Exécuter**.
   - Google demande une autorisation : **Examiner les autorisations** → choisissez votre compte → **Paramètres avancés** → **Accéder à … (non sécurisé)** → **Autoriser**. C'est normal : c'est votre propre script qui demande à écrire dans votre propre tableur.
8. Retournez dans le tableur : trois feuilles ont été créées.
   - **Réponses** : une ligne par participant, en codes numériques (prêt pour SPSS).
   - **Réponses_libellés** : les mêmes lignes avec le texte des réponses (format Google Forms).
   - **Dictionnaire** : chaque variable, le texte arabe de la question, les valeurs et leurs libellés.

## Étape 2 — Publier le script et obtenir son adresse

1. Dans l'éditeur Apps Script : **Déployer → Nouveau déploiement**.
2. Cliquez sur la roue dentée à côté de « Sélectionner le type » → **Application Web**.
3. Réglez :
   - **Exécuter en tant que** : *Moi*
   - **Qui a accès** : *Tout le monde*
4. Cliquez sur **Déployer**, puis copiez l'**URL de l'application Web** (elle se termine par `/exec`).
5. Vérification : collez cette adresse dans un nouvel onglet du navigateur. Vous devez voir `{"ok":true,"service":"sihhaty-enquete",...}`.

> « Tout le monde » signifie seulement que le site peut *envoyer* une ligne. Personne ne peut lire le tableur, sauf les comptes avec lesquels vous le partagez.

## Étape 3 — Indiquer cette adresse au site

1. Ouvrez le fichier `js/config.js` avec le Bloc-notes.
2. Collez l'adresse entre les guillemets de la ligne `ENDPOINT_URL` :

   ```js
   ENDPOINT_URL: 'https://script.google.com/macros/s/XXXXXXXX/exec',
   ```

3. Enregistrez. (Tant que cette ligne est vide, le site affiche un bandeau jaune « وضع تجريبي » et n'envoie rien.)

## Étape 4 — Compléter les ressources d'aide (obligatoire)

Ouvrez `data/ressources.json`. Il contient le message de soutien affiché aux étudiants qui en ont besoin et le lien « تحتاج مساعدة؟ » présent sur toutes les pages.

- Remplacez le message par le texte approuvé par le comité d'éthique.
- Pour chaque ressource, écrivez le nom, la description en arabe et le numéro de téléphone, **vérifiez le numéro en l'appelant**, puis remplacez `"verifie": false` par `"verifie": true`.
- Une ressource marquée `false` n'est **pas** affichée sur le site : rien de non vérifié ne peut apparaître par accident.

## Étape 5 — Mettre le site en ligne (Netlify, gratuit, sans rien installer)

1. Créez un compte sur <https://app.netlify.com> (avec l'adresse de l'équipe).
2. Allez sur <https://app.netlify.com/drop>.
3. Faites glisser **le dossier `sihhaty-enquete` entier** dans la zone indiquée.
4. Après quelques secondes, Netlify affiche l'adresse du site (ex. `https://nom-au-hasard.netlify.app`). Vous pouvez la renommer : **Site configuration → Change site name** (ex. `sihhaty-enquete`).
5. Le site est en HTTPS automatiquement.

Pour mettre à jour le site plus tard (texte corrigé, ressource ajoutée) : dans Netlify, onglet **Deploys**, faites glisser de nouveau le dossier.

*Autres possibilités équivalentes : GitHub Pages ou Vercel. Le site ne demande aucune compilation : il suffit de publier le dossier tel quel.*

## Étape 6 — Tester avant de diffuser

1. Ouvrez l'adresse du site sur votre téléphone et remplissez le questionnaire en entier.
2. Vérifiez qu'une ligne apparaît dans la feuille **Réponses**, puis supprimez cette ligne de test (dans les deux feuilles).
3. Testez aussi : refuser le consentement (rien ne doit être enregistré), fermer la page au milieu puis revenir (la reprise est proposée), la page de résultats et le bouton « تحميل / طباعة نتائجي (PDF) ».

## Télécharger les données

Dans le tableur : **Fichier → Télécharger → Microsoft Excel (.xlsx)**.

- Les cellules vides correspondent aux questions non affichées (filtres), jamais à « 0 ».
- Les items des échelles sont enregistrés bruts ; l'inversion n'est appliquée que dans les colonnes `SCORE_…`.
- `NIVEAU_MINI` est exporté pour l'équipe mais n'est jamais montré à l'étudiant.
- Aucune adresse IP, aucun e-mail, aucun nom n'est enregistré. Le prénom facultatif reste dans le téléphone de l'étudiant.

## Saisir les questionnaires papier

Ouvrez le site en ajoutant `?saisie=1` à la fin de l'adresse (ex. `https://sihhaty-enquete.netlify.app/?saisie=1`).

- Un bandeau jaune confirme le mode saisie ; on vous demande le « رقم الاستمارة ».
- Les questions peuvent être laissées vides (réponse manquante sur le papier) : un message demande confirmation.
- Aucun feedback n'est affiché ; après l'enregistrement, vous passez directement au formulaire suivant.
- La ligne arrive dans le même tableur avec `mode = papier` et `num_formulaire`.

Pour un lien plus discret, changez `CODE_SAISIE` dans `js/config.js` (ex. `'fmpm2026'` → `?saisie=fmpm2026`).

## Corriger un texte

| Je veux modifier… | Fichier |
|---|---|
| une question, une option de réponse | `data/questions.json` |
| l'accueil, le consentement, les boutons, les messages | `data/textes.json` |
| les niveaux, explications et conseils du feedback | `data/feedback.json` |
| le message de soutien et les numéros d'aide | `data/ressources.json` |
| les seuils des niveaux | début de `js/scoring.js` (bloc `SEUILS`) |

Règles : ne modifiez que le texte entre guillemets ; ne touchez jamais aux champs `"var"` ni aux codes `"c"` (ce sont les colonnes et les valeurs du tableur). Republiez ensuite le dossier (étape 5).

Si vous **ajoutez ou supprimez** une question ou une option, les colonnes changent : il faut régénérer le script (`node tools/generer-apps-script.js`), le recoller dans Apps Script, relancer `installer`, puis **Déployer → Gérer les déploiements → Modifier → Version : Nouvelle version**. Demandez de l'aide pour cette opération.

## Avant la diffusion : liste de contrôle

- [ ] `data/ressources.json` complété, chaque numéro vérifié, message approuvé par le comité d'éthique.
- [ ] Texte de consentement (`data/textes.json`) conforme à la version approuvée.
- [ ] Textes du feedback (`data/feedback.json`) relus et validés par l'équipe : ce sont des propositions.
- [ ] Item MHC n°8 (`MHC_08` dans `data/questions.json`) : formulation vérifiée dans le protocole (le cahier des charges n'en donnait qu'un extrait).
- [ ] `ENDPOINT_URL` renseignée et test complet réussi sur téléphone.
- [ ] Ligne(s) de test supprimée(s) du tableur.
