# StoryMaster

Atelier littéraire privé. Le **Lot 0** fournit l’identité OIDC et la gestion des projets ; les lots suivants restent soumis à validation. [Rapport du Lot 0](docs/LOT-0-REPORT.md) · [Décisions approuvées](docs/HUMAN-DECISIONS.md) · [PRD](docs/PRD.md).

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
npx playwright install chromium
npm run test:e2e
```

L’overlay de test publie PostgreSQL sur **127.0.0.1:55432**. Le benchmark et la suite PostgreSQL se sérialisent par verrou de test. Le benchmark écrit `artifacts/local/contention.json` ; ses paramètres bornés sont `BENCH_WORKERS` (8 par défaut), `BENCH_WRITES` (20), `BENCH_OUTPUT`. Il utilise de nouveaux projets de test, sans scènes fictives. Les essais navigateur passent par Keycloak réel et créent des projets de démonstration dans l’application locale. Captures et traces restent dans des dossiers ignorés ; ne pas publier une trace contenant des cookies ou codes de connexion. Avec Chromium déjà installé : `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e`.

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

`apps/web` : Next.js/React, transport HTTP et interface. `apps/api` : Fastify et adaptateur OIDC. `packages/domain` : invariants/politique ; `application` : cas d’usage communs ; `contracts` : validation des DTO ; `infrastructure` : PostgreSQL, migrations, sessions et OIDC. Les routes n’accèdent pas directement aux données narratives. Aucun éditeur, scène, assistant IA ou serveur MCP n’est implémenté.

Les détails de concurrence, de sécurité, les limites locales et les résultats réellement obtenus figurent dans le rapport. L’approbation de la sortie du Lot 0 et tout démarrage du Lot 1 appartiennent au propriétaire.


## Laboratoire préalable au Lot 1

Le [Spike A isolé](spikes/editor/README.md) évalue l’éditeur, le stockage JSON, les révisions, les diffs et une future migration Yjs sur corpus fictif. Ses dépendances et sa PostgreSQL en mémoire sont séparées des applications. [Rapport et décision proposée](docs/SPIKE-A-REPORT.md). Aucun éditeur de production n’est ajouté au Lot 0 ; la décision ADR-0007 et le lancement du Lot 1 restent soumis au propriétaire.
