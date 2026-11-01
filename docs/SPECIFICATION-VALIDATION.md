# Vérification des artefacts de spécification

**Statut :** contrôles documentaires rejoués le 31 octobre 2026, après décisions GO-00..02 et réalisation Lot 0. **Portée :** syntaxe, schémas, cohérence et traçabilité. [Résultats applicatifs distincts](LOT-0-REPORT.md) · [Commandes](../scripts/README.md).

## Anomalies corrigées et décisions approuvées

Le registre v2 sépare type, priorité produit, priorité de réalisation, version, texte intégral, domaine, section, source et lot. Les NFR-01..12 ont leur objectif complet dans `text` et `priority:null` car le PRD ne leur donne pas de priorité produit explicite. Les 150 identifiants sont conservés et vérifiés individuellement contre PRD, backlog et matrice ; les autres priorités absentes restent null.

PROP-10 était SHOULD lors de la passe initiale. Le propriétaire a explicitement approuvé sa promotion MUST le 31 octobre ; les deux patchs PRD sont désormais appliqués. Le registre, le backlog, la traçabilité, les rapports et le test de divergence suivent la nouvelle référence : **100 MUST MVP**. Les recherches ne sont pas modifiées. Les patchs sont conservés comme historique, sans les réappliquer.

OpenAPI 0.4.0 comprend 46 opérations sur 41 chemins, dont dix opérations du Lot 0 et vingt du Lot 1 réellement implémentées et marquées `x-lot`. Les autres contrats restent proposés. Le DTO Project est complété et synchronisé dans les schémas MCP embarqués ; aucun serveur MCP n’est livré.

## Contrôles effectivement exécutés

Environnement Python 3.14.8 isolé avec les dépendances épinglées de `scripts/requirements-validation.txt` : jsonschema 4.26.0, openapi-spec-validator 0.9.0 et PyYAML 6.0.3. Exécution locale ; aucune exécution distante GitHub n’est revendiquée.

| Contrôle | Résultat |
|---|---|
| JSON stricts / schémas | Clés dupliquées et NaN interdits, Draft 2020-12, références locales résolues avant tout validateur susceptible de fetch réseau |
| Registre / PRD / backlog / matrice | Chaque ID, texte, type, section, ligne source, priorité, version et affectation rapproché ; huit lots contrôlés sans se limiter au décompte |
| OpenAPI | Document valide, operationId uniques, préconditions et corps fermés Lots 0/1 vérifiés |
| Catalogue MCP | 13 outils attendus ; mapping HTTP, scopes, permissions, audit, transactions, erreurs, bornes, entrées/sorties et définitions synchronisées |
| Fixtures propositions | Bases/révisions, mapping temporaire, états finaux, MergeResult, invalidation des anciennes approbations et oracles de rollback cohérents ; aucune exécution d’un moteur métier futur |
| Exemples Lot 0 | Huit exemples de requêtes/réponses, y compris CAS, CSRF et idempotence, validés contre les contrats |
| Scénarios / documents | 50 scénarios JSON/Markdown rapprochés champ par champ, références abrégées et liens locaux contrôlés |
| Tests du validateur | 25 tests réussis ; mutations d’IDs/outils à décompte constant, priorité, texte, version, lot, références, permissions, révisions/approvals et invariants de contrat Lot 0 |
| Diff | `git diff --check` réussi |

Les trois nouvelles mutations protègent l’authentification par session au Lot 0, le CAS obligatoire et le refus d’un rôle client dans le contrat de création. Les contrôles existants ne sont pas supprimés ni affaiblis. Le test de PROP-10 détecte désormais un retour isolé à SHOULD contraire au PRD approuvé.

## Reproduction

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r scripts/requirements-validation.txt
python -m pip check
python scripts/validate_specifications.py
python -m unittest discover -s scripts/tests -v
git diff --check
```

`--root` permet de valider une copie indépendante. Les tests de mutation travaillent dans une copie temporaire. Codes : 0 succès, 1 écart documentaire, 2 dépendance manquante. Aucune correction de priorité ni application de patch automatique.

La [GitHub Action](../.github/workflows/validation.yaml) ajoute lint, TypeScript, Docker, tests PostgreSQL et navigateur ; elle dispose uniquement de `contents: read`. Le [validateur des réponses observées](../scripts/validate_runtime_contracts.py) est appelé depuis les tests applicatifs pour contrôler les réponses réelles des Lots 0/1 contre OpenAPI sans imprimer leur contenu ni écrire de tokens dans un fichier.

## Limites et autorité

Une CI documentaire verte ne prouve pas l’exécution des 50 CT, la satisfaction de toutes les NFR ou la compatibilité MCP runtime. Les preuves métier sont dans les rapports des [Lots 0](LOT-0-REPORT.md) et [1](LOT-1-REPORT.md) ; Spike A et B-01..05/B-07 autosave sont exécutés ; B-06 propositions et C restent futurs. Le consentement humain vient de l’instruction du propriétaire enregistrée dans HUMAN-DECISIONS, jamais de la seule présence d’un fichier ou d’une CI verte.

## Critères d'acceptation du document

Résultats documentaires distingués des tests applicatifs exécutés ; commandes reproductibles ; contrôles sémantiques démontrés par mutations ; priorités modifiées uniquement après accord explicite ; limites de validation et autorité des décisions identifiables.

## Extension exécutée du Lot 1

Le validateur contrôle chaque opération Lot 1 attendue, session humaine, CSRF/idempotence, CAS texte/metadata et versions des deux parents lors des déplacements, format JSON v1 et snapshot riche. Deux exemples éditoriaux synthétiques sont validés ; les réponses HTTP observées le sont séparément depuis `tests/editorial-http.test.ts`. Trois mutations nouvelles retirent le CAS du parent cible, autorisent un bearer sur save ou retirent CSRF sur restore : elles échouent comme attendu. `npm run lint` contrôle aussi que les corps Zod et définitions partagées HTTP/MCP correspondent au générateur versionné ; aucun serveur MCP n’est actif.

## Extension de validation Lot 2

OpenAPI 0.5.0 et catalogue de 13 outils MCP synchronisés, registre v1 rapproché des schémas Zod et empreintes, anciens SceneRevision conservés. Nouveaux exemples HTTP et scénarios déclaratifs des portions applicables. Les 29 tests de mutation du validateur sont documentaires ; le [rapport Lot 2](LOT-2-REPORT.md) distingue les  preuves PostgreSQL/HTTP/navigateur et les parties de propositions/MCP non exécutées.

## Extension de validation Lot 3

OpenAPI 0.6.0, composants de collaboration synchronisés aux Zod/DTOs, catalogue MCP conservé sans nouvel outil. Vérification du mapping de chaque opération Lot 3, session humaine et préparation anonyme sans exposition de données, CSRF/Origin/idempotence/CAS, exclusion owner, identité destinataire serveur et absence de hash dans les réponses. Positions actuelles nulles pour ambiguous/orphaned, origine obligatoire. Cinq mutations supplémentaires portent le total documentaire à 34. Exemples synthétiques distincts des 34 réponses HTTP réelles observées et conformes. Les scénarios CT-02/06/20/30/36/45/49 ne revendiquent que leurs portions de collaboration humaine ; propositions et délégation MCP restent non exécutées. Voir [rapport Lot 3](LOT-3-REPORT.md).


## Contrats et validation Lot 4

OpenAPI **0.7.0**, catalogue fermé de neuf opérations typées et 13 outils MCP conservés/synchronisés par `sync-proposal-contracts.mjs --check`. Chaque route Lot 4 est contrôlée : session humaine, Origin/CSRF, idempotence/CAS, rôles et interdiction IA, révisions/hash, version d’appartenance dans l’avis, mapping durable et ChangeSet. Preview et validation restent sans mutation. Les générateurs précédents préservent ces ajouts ; `npm run lint` compare Zod/JSON Schema/DTOs/HTTP/MCP et le registre.

Cinq mutations supplémentaires portent le total à **39 tests documentaires** : approbation avec permission de préparation, retrait de la précondition d’état, origine falsifiable, substitution du catalogue par SQL et mapping durable optionnel sont refusés. Les scénarios déclaratifs [Lot 4](spec/lot4-scenarios.json) sont distincts des tests PostgreSQL/HTTP/navigateur réellement exécutés. Les enveloppes HTTP humaines des fixtures sont alignées sur Origin/CSRF/idempotence ; leurs variantes IA/MCP restent futures. B-06/B-07 merge et CT-33 sont exécutés dans l’application, sans revendiquer la délégation ou une outbox absente. [Rapport](LOT-4-REPORT.md).
