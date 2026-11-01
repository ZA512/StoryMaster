# StoryMaster

Atelier littéraire privé. Le **Lot 0** fournit l’identité OIDC et la gestion des projets ; le **Lot 1** ajoute manuscrits, scènes, éditeur riche, autosave CAS et historique. Lot 1 reçu avec réserves ; le **Lot 2** ajoute bible narrative, liens de scènes, modules et recherche lexicale. Lot 2 reçu techniquement avec réserves maintenues ; le **Lot 3** ajoute invitations, membres, discussions et ancrages versionnés. Lot 3 reçu techniquement avec réserves et CI verte ; le **Lot 4** ajoute les propositions humaines, la revue et la fusion atomique multi-objets. Lot 4 reçu techniquement avec réserves et CI verte ; le **Lot 5 phase A** ajoute un assistant intégré simulé local. Le **Lot 6** ajoute MCP local et délégations révocables sans modèle ; réception humaine attendue. Lot 5 phase B reste différé et GO-03 reste à valider avant tout fournisseur réel. [Rapport phase A](docs/LOT-5-REPORT.md) · [Décision GO-03](docs/GO-03-DECISION-PROPOSAL.md). [Rapport du Lot 4](docs/LOT-4-REPORT.md) · [Rapport du Lot 3](docs/LOT-3-REPORT.md) · [Rapport du Lot 2](docs/LOT-2-REPORT.md) · [Rapport du Lot 1](docs/LOT-1-REPORT.md) · [Rapport du Lot 0](docs/LOT-0-REPORT.md) · [Décisions approuvées](docs/HUMAN-DECISIONS.md) · [PRD](docs/PRD.md).

## Démarrage local

Prérequis : Docker Engine avec Compose et suffisamment de disque libre pour les images et les données (prévoir plusieurs Go). Les ports locaux 3000 et 8080 doivent être libres.

```bash
cp .env.example .env
docker compose up -d --build --wait
```

Ouvrir **http://localhost:3000** puis « Se connecter ». Comptes de démonstration : **alice**, **bob** ou **carol**, mot de passe **local-only-storymaster**. Ces identifiants, le realm sans TLS et tous les mots de passe de `.env.example` sont exclusivement locaux. Aucun secret réel n’est fourni. `.env` est ignoré par Git et exclu des images.

Les projets sont persistés dans le volume `postgres_data`. Au premier démarrage, PostgreSQL crée les rôles distincts, Keycloak importe le realm et le conteneur `migrate` applique la migration avant le démarrage de l’API. Une relance rejoue la migration sans réinitialiser les données.

```bash
docker compose ps
docker compose stop
docker compose up -d --wait
```

Par défaut, seuls web (127.0.0.1:3000) et Keycloak (127.0.0.1:8080) sont publiés ; le profile MCP activé explicitement ajoute 127.0.0.1:3500. L’API et PostgreSQL sont sur le réseau interne. Le réseau `edge` permet les ports loopback de web/Keycloak ; `private` est interne. Aucun environnement public n’est configuré. Les valeurs d’origine/issuer doivent correspondre exactement à `localhost`, y compris dans le navigateur.

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
npm run bench:proposals
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

`apps/web` : Next.js/React, transport HTTP et interface. `apps/api` : Fastify et adaptateur OIDC. `packages/domain` : invariants/politique ; `application` : cas d’usage communs ; `contracts` : validation des DTO ; `infrastructure` : PostgreSQL, migrations, sessions et OIDC. Les routes n’accèdent pas directement aux données narratives. Éditeur, scènes, référentiel, collaboration asynchrone et propositions utilisent les mêmes services ; assistant IA et serveur MCP restent futurs.

Les détails de concurrence, de sécurité, les limites locales et les résultats réellement obtenus figurent dans le rapport. La CI du Lot 4 sur 9c2df0b est terminée avec succès ; la phase A du Lot 5 est autorisée séparément. Les validations locales du Lot 5 ne constituent pas une nouvelle CI distante.


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

Migration additive 0005, sans suppression de volume. `bench:collaboration` mesure autosaves/commentaires/administration et lecture d’ancres sur scène longue, exclusivement en base `_test` ; [résultats et limites](docs/measurements/LOT-3-COLLABORATION.md). Pas de CRDT, SMTP ou serveur MCP. Les propositions sont livrées séparément au Lot 4 ci-dessous. Les réserves des lots précédents restent ouvertes, y compris la qualification publique et la revue UX manuelle.


## Proposer, revoir et fusionner — Lot 4

Depuis le projet ou l’atelier, ouvrir **Propositions**. Un auteur ou relecteur peut créer un brouillon, préparer des fiches, relations, références, métadonnées, déplacements et textes de scènes dans la même intention. Le texte proposé possède un éditeur distinct, sans autosauvegarde canonique. Chaque enregistrement des opérations ou de la justification crée une révision immuable et invalide les anciens avis.

**Prévisualiser les changements** affiche les différences riches et structurées, les bases et les erreurs. Au besoin, préparer explicitement une nouvelle révision avec les bases affichées, puis relire avant soumission. Aucun changement canonique n’est effectué par ces actions. Un owner/admin différent du créateur approuve ; l’auto-approbation est réservée à l’owner d’un projet encore individuel. **Approuvé** signifie encore **non appliqué**. **Fusionner cette proposition** demande confirmation et revalide droits, avis, bases et contraintes dans une transaction unique.

Après fusion, le ChangeSet montre attribution, versions et identifiants des créations. Une réponse perdue se réessaie avec la même intention ; le résultat durable est retrouvé sans seconde application. Un conflit conserve l’intention et le brouillon de scène, impose une révision explicite et une nouvelle revue. Rejetées, retirées et fusionnées sont terminales ; **Dupliquer dans un nouveau brouillon** copie l’intention sans avis, avec des bases à revérifier. Les champs non publiés restent dans l’onglet, sans promesse de récupération après fermeture forcée.

Migrations additives **0006/0007** : tables de propositions/ChangeSets puis lecture seule des métadonnées de migrations pour vérifier la compatibilité au démarrage. Les anciennes migrations appliquées sont figées. **Reconstruire aussi le service `migrate`** lors d’une mise à jour : `docker compose -f compose.yaml -f compose.test.yaml up -d --build --wait`. Reconstruire seulement API/web peut laisser une ancienne image de migration ; l’API refuse maintenant un schéma incomplet ou un checksum divergent. Aucun volume à supprimer.

Sur un realm local déjà importé, `npm run demo:ensure-users` crée uniquement le compte Carol manquant, sans modifier les comptes ou mots de passe existants. Il exige APP_ENV=local et l’issuer localhost prévu ; les parcours passent par de vraies sessions Keycloak et invitations, aucun agent simulé. Sur une base neuve, les trois comptes sont importés directement. Alice/Bob/Carol n’ont pas de rôle projet global : les invitations du projet déterminent leurs droits.

`bench:proposals` mesure huit fusions de quatre ressources face à deux auteurs × quarante autosaves indépendants dans la base `_test`. [Résultats et limites](docs/measurements/LOT-4-PROPOSALS.md). Les tests de faute vérifient séparément rollback, attente, révocation, timeout et arrêt du processus avant/après COMMIT. [Inventaire des fichiers](docs/LOT-4-FILES.txt). Le Lot 5 phase A ci-dessous réutilise ce moteur ; MCP/OAuth délégué reste futur.


## Assistant IA intégré — Lot 5 phase A

Depuis un projet, l’atelier ou une fiche, ouvrir **Assistant IA**. Ajouter une configuration avec « Utiliser une valeur fictive », puis choisir un scénario simulé et ouvrir une conversation privée. Sélectionner scène/fiche, écrire la demande, examiner l’inventaire de contexte et confirmer cette demande simulée. Le scénario « Proposition narrative simulée » prépare une intention multi-objets dans l’interface commune de revue ; seul un humain autorisé peut approuver et fusionner. La simulation est déterministe et n’analyse pas réellement la qualité littéraire.

`.env.example` active uniquement le simulateur local et contient une clé de protection **de démonstration**, réservée à cet environnement. Après mise à jour, reconstruire `migrate api web` ensemble puis `docker compose -f compose.yaml -f compose.test.yaml up -d --wait`. Pas de suppression de volume ni de modification des migrations déjà appliquées. Si l’environnement local existant n’a pas ces variables, ajouter AI_SIMULATION_ENABLED=true, AI_ACTIVE_KEY_VERSION et AI_KEYRING_JSON de démonstration avant redémarrage. Le serveur refuse l’activation de cette simulation hors APP_ENV=local.

Les conversations restent privées à leur initiateur encore membre ; un owner ne lit pas celles des autres. Clés fictives chiffrées par enveloppe, remplacement/révocation/rotation disponibles. Le contexte est limité aux versions enregistrées, sources sélectionnées/révisions et historique récent borné. Conversations exclues des exports narratifs. Rétention souhaitée configurable sans purge. Les plafonds du budget sont personnels par projet ; les montants sont synthétiques, unknown conserve une réservation et ne provoque aucun renvoi automatique. Les brouillons non enregistrés restent en mémoire.

OpenAI et Anthropic sont des candidats documentés, aucun adaptateur réel ni clé réelle accepté en phase A. **GO-03 doit être explicitement validé avant phase B, tout transfert narratif externe ou essai facturable**. [Choix proposés](docs/GO-03-DECISION-PROPOSAL.md), [ADR-0014](docs/adr/0014-assistant-integre-et-executions-bornees.md), [rapport](docs/LOT-5-REPORT.md), [inventaire](docs/LOT-5-FILES.txt). Lot 6 local autorisé séparément ; arrêt avant Lot 7 pour réception humaine.

## MCP local sans modèle — Lot 6

Le Lot 5 phase A est reçu avec réserves ; sa phase B commerciale et GO-03 restent différés. Le Lot 6 local est autorisé séparément : [rapport](docs/LOT-6-REPORT.md), [ADR-0015](docs/adr/0015-mcp-local-oauth-et-grants.md), [future UX documentaire](docs/UX-FUTURE-ROADMAP.md). Arrêt avant Lot 7 pour réception humaine. Aucun LLM, fournisseur, clé réelle ou appel payant requis.

MCP est désactivé par défaut (`MCP_ENABLED=false`, profile `mcp` facultatif). Pour un `.env` existant, ajouter le secret local fictif MCP de `.env.example` sans remplacer vos autres valeurs. Les commandes suivantes qualifient les services locaux et des projets synthétiques ; elles conservent les comptes existants :

```bash
npm ci --no-audit --no-fund
npx playwright install chromium
npm run mcp:ensure-keycloak
MCP_ENABLED=true docker compose -f compose.yaml -f compose.test.yaml --profile mcp up -d --build --wait api web mcp
MCP_ENABLED=true npm run mcp:qualify
```

Point d’accès : `http://localhost:3500/mcp`, publié seulement sur 127.0.0.1. Keycloak local utilise Resource Indicators expérimental. Seuls les clients `storymaster-mcp-cli` et `storymaster-mcp-secondary` sont préenregistrés ; callbacks exacts 127.0.0.1:8765/callback et :8766/callback. Le client de qualification ouvre des navigateurs locaux pour Code/PKCE S256 et consentement, avec Alice de démonstration. Les tokens restent en mémoire, les projets/propositions synthétiques restent traçables et les grants du CLI sont révoqués en fin de parcours.

Dans **Délégations locales**, sélectionner le client, les projets et la durée. Lecture seule initialement ; cocher explicitement le droit de préparer/soumettre pour le permettre. La configuration du client fournit le header `StoryMaster-Grant-Id` de votre délégation, avec son bearer OAuth destiné à cette ressource. L’ID du grant et le clientInfo ne sont jamais des preuves d’identité. Réduire le périmètre ou révoquer ne modifie aucun texte ; un grant d’origine révoqué/expiré bloque la fusion de sa proposition externe. Nouvelle intention humaine explicite possible sans reprendre les avis.

Le CLI exerce les deux versions `2026-07-28` et `2025-11-25`, lecture/recherche, refus de proposition sans scope, préparation/révision/preview/validation/soumission, canon intact, rejeu idempotent et révocation. Mesures locales dans `artifacts/local/lot6-mcp-qualification.json` ; aucune capacité publique déduite. Pour les tests PostgreSQL/protocole, arrêter d’abord le conteneur MCP qui occuperait le même port :

```bash
docker compose -f compose.yaml -f compose.test.yaml --profile mcp stop mcp
npm run test:mcp
```

Pour refermer l’accès délégué après qualification :

```bash
docker compose -f compose.yaml -f compose.test.yaml --profile mcp stop mcp
MCP_ENABLED=false docker compose -f compose.yaml -f compose.test.yaml up -d --wait api web
```

Pas de tunnel, TLS public, découverte de clients distants, enregistrement dynamique, sampling, tâche durable ou nouveau moteur de propositions. Les mêmes cas d’usage bloquent canon/approve/merge par HTTP ou appel direct, même pour un humain propriétaire sous-jacent. Les limites locales et la contention sont documentées dans le rapport. La refonte visuelle reste à arbitrer ultérieurement.
