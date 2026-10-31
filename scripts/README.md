# Validation documentaire et des contrats

**Statut :** Outillage documentaire exécutable, complété par la CI et les tests applicatifs du Lot 0. **Portée :** CI ou exécution locale en lecture seule des documents. **Références :** [artefacts](../docs/spec/README.md), [preuves de validation](../docs/SPECIFICATION-VALIDATION.md).

## Synthèse et exécution CI

Python 3.14, testé avec 3.14.8. Les dépendances de validation et leurs dépendances transitives sont épinglées dans `requirements-validation.txt`. Elles sont isolées de dépendances applicatives Node. L'installation télécharge ces paquets ; la validation elle-même n'utilise ni réseau, ni base, ni secret, ni fournisseur IA.

Depuis la racine du dépôt, dans un shell CI configuré pour arrêter au premier échec :

```bash
set -euo pipefail
python -m venv /tmp/storymaster-validation
/tmp/storymaster-validation/bin/python -m pip install -r scripts/requirements-validation.txt
/tmp/storymaster-validation/bin/python -m pip check
/tmp/storymaster-validation/bin/python scripts/validate_specifications.py
PYTHONDONTWRITEBYTECODE=1 /tmp/storymaster-validation/bin/python -m unittest discover -s scripts/tests -v
```

Le script calcule sa racine depuis son emplacement ; `--root /chemin/du/dépôt` permet de valider une copie. Codes de sortie : 0 succès, 1 écart avec diagnostic localisé, 2 dépendance absente. Ces commandes sont indépendantes du fournisseur de CI ; aucun workflow distant n'a été exécuté ni déployé pendant cette tâche.

## Analyse : contrôles de contenu

- Tous les JSON sont strictement parsés : clés dupliquées et NaN interdits ; YAML OpenAPI avec clés uniques.
- JSON Schema Draft 2020-12 et toutes les références locales sont vérifiés, y compris les références inutilisées. Les `$ref` distantes sont refusées avant le validateur OpenAPI, afin d'éviter un accès réseau implicite.
- Le PRD est relu comme source : ses deux formats de tableau sont distingués ; texte intégral, section, ligne source, type, priorité et version sont comparés pour chaque ID. IDs dupliqués, inconnus, ajoutés ou absents sont signalés.
- Le registre suit son propre schéma à valeurs fermées. Les priorités non spécifiées restent null ; les lots MVP sont des entiers 0..7, les versions futures ont `lot:null`. Chaque affectation est comparée au backlog, à la matrice et aux exigences de la fiche de lot, avec contrôle des huit titres.
- OpenAPI est validé ; operationId uniques, schémas d'opérations autonomes et définitions HTTP/MCP sont comparés. Les entrées complètes MCP sont comparées aux paramètres, préconditions et corps HTTP, pas seulement à leurs `$defs`.
- Les 13 noms d'outils attendus, leur mapping HTTP, scopes, permissions, audit, transaction, limites et enveloppes de sortie sont contrôlés ; un outil de fusion ajouté en remplacement d'un outil de lecture est refusé même si le décompte reste identique.
- Toutes les requêtes et opérations des fixtures sont validées ; bases initiales/révisées, mapping temporaire, états finaux, MergeResult, oracle d'audit et invalidation de review sont rapprochés. Ce sont des contrôles d'oracles documentaires, pas un moteur d'application des propositions.
- Les scénarios JSON/Markdown sont comparés champ par champ ; les références abrégées telles que SEC-01/02 ou SEARCH-01..04 sont résolues. Les liens locaux et critères d'acceptation des documents produits sont contrôlés.

## Décisions proposées et alternatives

La CI doit échouer sur les divergences ; aucune correction automatique ni promotion de priorité n'est effectuée. Si un changement produit est accepté, mettre à jour les documents et le registre ensemble. Ajouter un standard ou une référence externe exige de rendre le schéma disponible localement et de revoir cette politique explicite, pas d'autoriser un fetch arbitraire.

## Risques et questions ouvertes

Les 22 tests de non-régression injectent notamment des erreurs à nombre d'IDs/outils constant, une divergence de PROP-10 par rapport au PRD approuvé, une base obsolète et une approbation non invalidée. Une CI verte ne prouve ni autorisation métier effective, ni transactions PostgreSQL, ni contention, ni compatibilité MCP runtime. Le spike B complet demeure à réaliser ; la mesure préliminaire sur métadonnées est dans le rapport du Lot 0. La preuve de consentement humain est enregistrée dans les fiches GO ; le script ne peut pas attester seul de l'identité du décideur.

## Critères d'acceptation du document

Installation isolée reproductible ; commande CI sans secret ; erreurs entraînant un code non nul ; contrôles sémantiques démontrés par mutations ; périmètre documentaire clairement séparé des futurs tests applicatifs.


## Tests de l’application et contrats observés

Voir le [README racine](../README.md) et le [rapport Lot 0](../docs/LOT-0-REPORT.md). `validate_runtime_contracts.py` reçoit uniquement via stdin des réponses Fastify réelles ; il les valide contre les chemins, méthodes et codes d’OpenAPI, sans afficher le contenu en cas d’erreur. Les tests Node appellent l’interpréteur `DOCUMENT_PYTHON` ou `python3` : activer le venv avant `npm test`. Le script documentaire reste indépendant des services et ne devient pas une simulation de tests métier.

## Contrats et qualification du Lot 1

`npm run lint` exécute l’architecture et `node --import tsx scripts/sync-editorial-contracts.mjs --check`. Le générateur sans `--check` met à jour les schémas des corps Zod, routes et DTO OpenAPI puis les définitions partagées MCP ; examiner son diff avant adoption. `npm run bench:scenes` compare les deux barrières sur de vraies scènes/auteurs en base `_test`, vérifie contenu/hashes/snapshots/révisions et publie les métriques dans `artifacts/local/scene-contention.json`. Les [mesures versionnées](../docs/measurements/LOT-1-CONTENTION.md) déclarent limites et environnement ; B-06 propositions est absent. Les tests navigateur chargent `.env` et le scénario de durabilité redémarre seulement PostgreSQL/API/web locaux, sans suppression de volume.

## Générateurs et vérifications Lot 2

`npm run lint` rapproche désormais `sync-editorial-contracts.mjs --check`, `sync-narrative-contracts.mjs --check` et `publish-narrative-registry.ts --check` des sources exécutables. Le validateur Python contrôle les opérations attendues du Lot 2, session humaine, droits admin des modules, CSRF/idempotence/If-Match, bases de dépendances, ancien format de snapshots, schemas/checksums du registre et scénarios applicables. Les réponses réelles de Fastify sont validées par `validate_runtime_contracts.py`, distinctes des exemples synthétiques. Les tests de mutation du validateur restent documentaires.

`npm run bench:narrative` crée 10 000 objets via les services sur la base `_test`, mesure recherche et écritures mixtes sans mocks, et écrit `artifacts/local/narrative-qualification.json`. Exécuter les tests PostgreSQL/benchmarks avant le navigateur : le scénario de persistance redémarre PostgreSQL/Keycloak/API/web. Ne jamais réinitialiser la base applicative principale. Voir [méthode et résultats](../docs/measurements/LOT-2-QUALIFICATION.md).
