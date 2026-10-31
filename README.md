# StoryMaster

Atelier littéraire privé. Le **Lot 0** fournit l’identité OIDC et la gestion des projets ; le **Lot 1** ajoute manuscrits, scènes, éditeur riche, autosave CAS et historique. Lot 1 reçu avec réserves ; le **Lot 2** ajoute bible narrative, liens de scènes, modules et recherche lexicale. Lot 2 reçu techniquement avec réserves maintenues ; le **Lot 3** ajoute invitations, membres, discussions et ancrages versionnés. Réception humaine du Lot 3 attendue ; Lot 4 non commencé. [Rapport du Lot 3](docs/LOT-3-REPORT.md) · [Rapport du Lot 2](docs/LOT-2-REPORT.md) · [Rapport du Lot 1](docs/LOT-1-REPORT.md) · [Rapport du Lot 0](docs/LOT-0-REPORT.md) · [Décisions approuvées](docs/HUMAN-DECISIONS.md) · [PRD](docs/PRD.md).

## Démarrage local

Prérequis : Docker Engine avec Compose et suffisamment de disque libre pour les images et les données (prévoir plusieurs Go). Les ports locaux 3000 et 8080 doivent être libres.

```bash
cp .env.example .env
docker compose up -d --build --wait
```

Ouvrir **http://localhost:3000** puis « Se connecter ». Comptes de démonstration : **alice** ou **bob**, mot de passe **local-only-storymaster**. Ces identifiants, le realm sans TLS et tous les mots de passe de `.env.example` sont exclusivement locaux. Aucun secret réel n’est fourni. `.env` est ignoré par Git et exclu des images.

Les projets sont persistés dans le volume `postgres_data`. Au premier démarrage, PostgreSQL crée les rôles distincts, Keycloak importe le realm et le conteneur `migrate` applique la migration avant le démarrage de l’API. Une relance rejoue la migration sans réinitialiser les données.

```bash
docker compose ps
docker compose stop
docker compose up -d --wait
```

Seuls web (127.0.0.1:3000) et Keycloak (127.0.0.1:8080) sont publiés. L’API et PostgreSQL sont sur le réseau interne. Le réseau `edge` permet les ports loopback de web/Keycloak ; `private` est interne. Aucun environnement public n’est configuré. Les valeurs d’origine/issuer doivent correspondre exactement à `localhost`, y compris dans le navigateur.

L’import Keycloak ignore un realm déjà présent : modifier le JSON ne modifie pas silencieusement les comptes existants. Son administration locale est disponible sur http://localhost:8080/admin (admin-local, mot de passe `KEYCLOAK_ADMIN_PASSWORD` de `.env`).

## Bible narrative

Depuis un projet ou l’atelier, ouvrir **Bible narrative**, puis **Modules**. Le propriétaire ou un administrateur active Personnages, Lieux et Chronologie ; ils sont désactivés au départ, y compris dans les projets existants. Créer les fiches, choisir un parent géographique ou un repère chronologique facultatif et ajouter leurs relations. Les notes sont partagées avec les membres autorisés du projet.

Dans l’atelier, ouvrir **Repères de cette scène** sous le texte : choisir Présence, Mention, Point de vue, Cadre ou Événement raconté, puis une fiche existante et enregistrer les références. Le texte reste intact. Les fiches affichent les scènes associées ; ces liens survivent aux renommages et déplacements. En cas de conflit, texte et sélection restent disponibles dans l’onglet, avec choix explicite et téléchargement. La relecture d’une sélection demande confirmation avant son abandon. Les brouillons non confirmés ne survivent pas nécessairement à un crash/fermeture du navigateur.

La recherche porte sur scènes et fiches courantes de ce projet, avec filtres de type et d’archive. Un module désactivé conserve lecture, recherche, export et historique ; ses liens sont signalés inactifs, ses modifications suspendues jusqu’à réactivation. L’export JSON narratif conserve les fiches, liens et modules actuels, archives comprises ; il complète l’export éditorial, sans constituer une archive complète de l’historique ou une sauvegarde d’exploitation.

## Développement et vérifications

Prérequis supplémentaires : **Node 26.8.1**, npm et **Python 3.14**. Depuis la racine :

```bash
npm ci --no-audit --no-fund
python -m venv .venv
source .venv/bin/activate
python -m pip install -r scripts/requirements-validation.txt
python scripts/validate_specifications.py
python -m unittest discover -s scripts/tests -v
npm run lint
npm run typecheck
```

Les tests critiques utilisent une vraie base dédiée `storymaster_test`, avec les rôles migrateur et applicatif. Ils réinitialisent **uniquement cette base** ; les URL doivent se terminer par `_test`. Ils ne touchent pas aux projets de l’application. Le test des réponses HTTP appelle Python depuis le même environnement virtuel (`DOCUMENT_PYTHON` permet de choisir explicitement l’interpréteur).

```bash
docker compose -f compose.yaml -f compose.test.yaml up -d --build --wait
npm test
npm run bench:contention
npm run bench:scenes
npm run bench:narrative
npm run bench:collaboration
npx playwright install chromium
npm run test:e2e
```

L’overlay de test publie PostgreSQL sur **127.0.0.1:55432**. Les benchmarks et la suite PostgreSQL se sérialisent par verrou de test. Exécuter la suite navigateur ensuite : son test de durabilité redémarre PostgreSQL et les services locaux, dont Keycloak pour rétablir son pool. `bench:narrative` crée 10 000 fiches synthétiques dans la base dédiée, puis mesure recherche et contention mixte ; résultat dans `artifacts/local/narrative-qualification.json`. Le benchmark de métadonnées écrit `artifacts/local/contention.json` ; ses paramètres bornés sont `BENCH_WORKERS` (8 par défaut), `BENCH_WRITES` (20), `BENCH_OUTPUT`. Ce premier benchmark utilise de nouveaux projets de test sans scènes. `bench:scenes` mesure de vraies scènes et auteurs synthétiques ; ses résultats sont dans `artifacts/local/scene-contention.json`. Les essais navigateur passent par Keycloak réel et créent des projets de démonstration dans l’application locale. Captures et traces restent dans des dossiers ignorés ; ne pas publier une trace contenant des cookies ou codes de connexion. Le navigateur fourni par Playwright est recommandé pour correspondre à la CI. Le Chromium système de cette machine a précédemment planté ; utiliser ici le navigateur fourni par Playwright.

Pour exécuter les processus Node sur l’hôte, conserver PostgreSQL/Keycloak avec l’overlay puis lancer dans deux terminaux :

```bash
npm run db:migrate
npm run dev:api
# Dans l’autre terminal
npm run dev:web
```

Arrêter auparavant les conteneurs `web` et `api` pour libérer le port 3000. Ne pas exécuter la suite navigateur contre un environnement contenant des données réelles. La CI exécute les mêmes contrôles avec des permissions GitHub limitées à `contents: read` ; elle ne déploie rien.

## Réinitialisation locale volontaire

**La commande suivante détruit les projets locaux, comptes Keycloak et données de test du volume de ce projet Compose.** Elle est destinée à un environnement jetable et ne fait pas partie du démarrage normal.

```bash
docker compose -f compose.yaml -f compose.test.yaml down --volumes --remove-orphans
docker compose -f compose.yaml -f compose.test.yaml up -d --build --wait
```

Changer les mots de passe `.env` après initialisation ne change pas ceux des rôles déjà créés dans le volume. Adapter les rôles existants ou repartir explicitement d’un volume jetable.

## Organisation

`apps/web` : Next.js/React, transport HTTP et interface. `apps/api` : Fastify et adaptateur OIDC. `packages/domain` : invariants/politique ; `application` : cas d’usage communs ; `contracts` : validation des DTO ; `infrastructure` : PostgreSQL, migrations, sessions et OIDC. Les routes n’accèdent pas directement aux données narratives. Éditeur, scènes, référentiel et collaboration asynchrone utilisent les mêmes services ; assistant IA et serveur MCP restent futurs.

Les détails de concurrence, de sécurité, les limites locales et les résultats réellement obtenus figurent dans le rapport. La réception du Lot 3 et toute autorisation du Lot 4 appartiennent au propriétaire.


## Laboratoire préalable au Lot 1

Le [Spike A isolé](spikes/editor/README.md) évalue l’éditeur, le stockage JSON, les révisions, les diffs et une future migration Yjs sur corpus fictif. Ses dépendances et sa PostgreSQL en mémoire sont séparées des applications. [Rapport et décision proposée](docs/SPIKE-A-REPORT.md). Ce laboratoire reste isolé. ADR-0007 a ensuite été accepté explicitement avant la réalisation du Lot 1 ; Yjs reste hors production.

## Atelier d’écriture — Lot 1

Ouvrir un projet puis **Ouvrir l’atelier d’écriture**. Créer un manuscrit, un chapitre et des scènes ; les boutons du plan modifient titre/résumé/statut, déplacent et ordonnent sans changer les identifiants. L’archivage est confirmé et réversible pour les responsables. Le texte riche s’enregistre après une pause de 600 ms ; Ctrl/⌘ S force l’enregistrement. Attendre **Enregistré** avant de quitter. Une erreur conserve le brouillon dans l’onglet ; réessayer rejoue la même demande. Un conflit montre les versions et impose un choix explicite. Le navigateur avertit avant fermeture avec brouillon non confirmé ; aucune conservation hors ligne ou après fermeture forcée n’est garantie.

Historique : auteur, date, lecture/comparaison de versions, restauration du texte en nouvelle révision. Export Markdown dérivé avec avertissements ; JSON éditorial versionné avec structure/archives/textes courants, sans historique ni archive complète de projet. Les compteurs enregistrés viennent du serveur ; le compteur de brouillon est calculé en Worker. Mode concentration et raccourcis de mise en forme disponibles. Limites et qualification : [rapport](docs/LOT-1-REPORT.md), [ADR-0010](docs/adr/0010-atelier-ecriture-et-concurrence.md).

Les migrations 0002/0003 sont additives et rejouables, sans réinitialisation des données existantes. Ne jamais supprimer le volume persistant pour les appliquer. CI : documentation/contrats, tests du validateur, architecture, TypeScript, tests sur PostgreSQL, comparaison de contention des deux stratégies et navigateur réel ; Spike A reste isolé.

## Collaborer — Lot 3

Depuis le projet, ouvrir **Collaborateurs**. Le propriétaire peut inviter un admin/auteur/relecteur/lecteur ; un admin gère seulement les trois derniers rôles et ne peut cibler owner/admin. L’owner unique ne peut ni partir ni être rétrogradé par ce parcours. Un membre non propriétaire peut quitter le projet.

Saisir l’adresse vérifiée du destinataire, choisir son rôle, puis créer et copier le lien. Le lien est révélé une seule fois : si la réponse est perdue, révoquer l’invitation et en recréer une. Transmettre ce lien par un canal privé au destinataire, sans ticket public ni capture partagée. Aucun email n’est envoyé par StoryMaster. Le destinataire ouvre le lien, se connecte via Keycloak avec cette adresse **vérifiée**, puis accepte ou refuse. Un ancien compte local non vérifié doit être vérifié dans l’IdP puis reconnecté ; saisir une adresse dans l’interface ne suffit pas. La durée est configurable par `INVITATION_TTL_SECONDS` : 172800 s par défaut, bornes techniques 300–604800 s.

Sous le texte, ouvrir **Discussions de cette scène**, ou sélectionner un passage puis **Commenter la sélection**. Le relecteur sélectionne le texte dans un éditeur en lecture seule. Les discussions globales et les commentaires de fiches sont disponibles dans les panneaux correspondants. Répondre, résoudre/rouvrir, modifier son message, retirer logiquement un message et consulter les historiques selon les droits. Les commentaires restent attachés aux IDs après renommage, archive ou désactivation de module, sans modifier les révisions du canon.

Après modification du texte, actualiser les discussions : un passage confirmé peut être surligné uniquement dans la révision correspondante. Un passage ambigu ou absent garde son extrait et sa version d’origine ; aucun nouvel emplacement n’est inventé. Le brouillon doit être enregistré avant création d’une ancre. Les champs non publiés restent en mémoire dans l’onglet ; une fermeture forcée peut les perdre. Les modifications de droits invalident aussi les anciennes invitations en attente liées au membre. Un retrait bloque les nouveaux appels après son commit ; il ne peut effacer un texte déjà reçu par un navigateur.

Migration additive 0005, sans suppression de volume. `bench:collaboration` mesure autosaves/commentaires/administration et lecture d’ancres sur scène longue, exclusivement en base `_test` ; [résultats et limites](docs/measurements/LOT-3-COLLABORATION.md). Pas de CRDT, SMTP, propositions ou serveur MCP. Les réserves des lots précédents restent ouvertes, y compris la qualification publique et la revue UX manuelle.
