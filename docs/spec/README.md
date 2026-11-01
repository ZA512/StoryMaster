# Artefacts de contrat

**Statut :** Opérations HTTP `x-lot: 0/1/2/3` implémentées ; autres contrats et MCP proposés. **Portée :** MVP, sans serveur MCP aux Lots 0–3. **Références :** [contrats](../API-CONTRACTS.md), [sources](../RESEARCH-SOURCES.md).

## Synthèse et analyse

- `openapi.yaml` : HTTP minimal, OpenAPI 3.1.1 délibérément choisi pour compatibilité d'outillage.
- `operations.schema.json` : union fermée des neuf opérations MVP, JSON Schema 2020-12. La validation sémantique reste dans le domaine.
- `mcp-tools.json` : modèle de résultat `tools/list` MCP 2026-07-28 ; les inputSchema/outputSchema autonomes embarquent les définitions communes.
- `mcp-policy.json` : format local pour permissions, scopes, effets, idempotence, limites et erreurs, séparé des définitions officielles.
- `requirements.json` : inventaire normalisé v2, comparé au PRD, au backlog et à la traçabilité ; ne remplace pas le PRD.
- `requirements.schema.json` : schéma fermé du registre, avec valeurs autorisées et règles de couverture MVP/V1/V2+.

Les schémas n'imposent pas des UUID dans les fixtures ; en production, IDs générés serveur et opaques. Validation supplémentaire : type des nœuds/marks et attributs allowlist, bornes bytes/profondeur, absence de références interprojets, types des extrémités, unicité cibles et tempId, ensemble final cohérent. Le modèle métier stocke les ids résolus ; les entrées d'opération emploient des ObjectRef.

## Format du registre des exigences v2

| Champ | Sens et valeurs |
|---|---|
| requirementType | `objective`, `functional`, `non_functional`, `security`, `usability`, classification déterminée par la famille d'ID |
| priority | Priorité **produit** explicitement indiquée dans le PRD : `MUST`, `SHOULD`, `COULD`, ou `null` si non précisée |
| deliveryPriority | Priorité de **réalisation proposée** du backlog : `P0`, `P1`, `P2` ; ne promeut jamais un SHOULD en MUST |
| targetVersion | `MVP`, `V1`, `V2+`, séparé de priority |
| targetVersionBasis | `explicit` si portée par le marqueur PRD ; `section` si héritée du titre ; `cross_reference` pour OBJ-11 rapproché de §18.2 ; `proposed_mvp` si classement MVP proposé par le dossier |
| text | Texte intégral de l'exigence PRD, sans l'ID ni le marqueur de priorité ; pour une NFR : **Exigence cible**, pas seulement le domaine |
| domain | Domaine de la NFR, par exemple Fiabilité, ou `null` pour les autres lignes |
| section / sourceText | Section PRD et ligne Markdown d'origine, conservées pour rapprochement exact |
| lot | Entier `0..7` pour une cible MVP ; `null` pour V1/V2+, sans duplication de version dans le lot |

Les 150 IDs sont conservés. Les 12 NFR et les fonctionnalités uniquement marquées V1/V2+ ont une priorité produit `null`, sans nouvelle obligation inventée. Les cibles de §16 restent des objectifs initiaux à confirmer. PROP-10 est `MUST` depuis validation du 31 octobre 2026 ; sa promotion est une [décision séparée](../PRD-ALIGNMENT-PROPOSAL.md). Les anciens champs ambigus `need` et `phase` sont remplacés par `text`, `domain` et `targetVersion`.

La classification de type distingue les objectifs OBJ, la qualité NFR, la sécurité SEC/AI-SEC, l'utilisabilité UX et les autres exigences fonctionnelles. Les versions classées `proposed_mvp` ne sont pas présentées comme un marquage explicite du PRD.

Validation CI : voir [scripts/README.md](../../scripts/README.md). Le validateur est en lecture seule et compare les contenus, sans se contenter de compter les 150 IDs.

## Décisions proposées et alternatives

Contrats de schéma autonomes pour permettre validation sans réseau ; pas de génération de serveur. Une future source partagée pourra générer HTTP/MCP à l'implémentation, avec test de non-divergence. Les schémas ne prouvent pas les permissions ni l'atomicité.

## Risques et questions ouvertes

Sous-ensembles de JSON Schema supportés par chaque fournisseur à tester ; ne pas donner directement ce catalogue volumineux à un LLM intégré. Versions exactes de SDK, limites bytes et stratégie de génération à confirmer avant les lots concernés.

## Critères d'acceptation du document

Parsing JSON/YAML réussi ; références résolues ; OpenAPI valide ; schémas Draft 2020-12 valides et fixtures conformes ; exactement treize outils obligatoires et aucun merge ; chaque outil a sa politique séparée. Rapport de vérification dans `../SPECIFICATION-VALIDATION.md`.


## Contrats exécutés au Lot 0

OpenAPI distingue dix opérations implémentées par `x-lot: 0`, avec session humaine seule et CSRF pour mutations. Le DTO Project et les définitions MCP embarquées sont synchronisés ; les exemples de [lot0-http.json](../examples/lot0-http.json) sont validés. Les tests Fastify valident aussi six réponses réelles contre OpenAPI via `scripts/validate_runtime_contracts.py`, sans écrire les tokens sur disque. Le [rapport](../LOT-0-REPORT.md) précise ce qui fonctionne et ce qui reste spécifié.

## Éditeur et export du Lot 1

Les corps Zod et DTO éditoriaux sont synchronisés via `scripts/sync-editorial-contracts.mjs`, contrôlés par `npm run lint`. `EditorialJsonExport` décrit le contenu encodé du JSON éditorial v1 (structure, IDs/ordre, archives, texte riche courant, sans historique). Le validateur des réponses observées parse aussi ce texte JSON et le valide contre ce composant ; le wrapper HTTP seul ne suffit pas. Le JSON ProseMirror canonique reste `RichDocument` avec contentFormatVersion=1. Les 13 outils MCP demeurent spécifiés seulement.

## Ajouts Lot 2

OpenAPI 0.5.0, nouveaux DTOs et mutations humaines préconditionnées. `module-registry.v1.json` fige les trois modules, schémas JSON et règles des liens ; copie applicative strictement identique dans contracts. Le générateur et la CI détectent toute dérive avec Zod ; une évolution durable exige nouvelle version et migration, sans réécrire v1. `lot2-scenarios.json` sélectionne les parties applicables des CT, sans prétendre les exécuter ; [rapport Lot 2](../LOT-2-REPORT.md) contient les preuves. [Exemple HTTP](../examples/lot2-http.json) synthétique, complété par les réponses réellement observées. Les schémas communs gardent les anciennes fixtures opaques ; les entrées directes de production imposent UUID existants, sans tempId.

## Ajouts Lot 3

OpenAPI 0.6.0 contient les DTOs/corps JSON Schema de collaboration, session humaine vérifiée et seule préparation de lien anonyme sans données. `sync-collaboration-contracts.mjs --check` compare les schémas Zod exécutables, routes et DTOs ; les générateurs précédents préservent ces ajouts. Les 13 outils MCP restent inchangés. [Exemple synthétique](../examples/lot3-http.json), [portions CT applicables](lot3-scenarios.json) et [rapport exécuté](../LOT-3-REPORT.md) distinguent contrats de tests réels ; aucune exécution MCP/propositions revendiquée.


## Contrats et validation Lot 4

OpenAPI **0.7.0**, catalogue fermé de neuf opérations typées et 13 outils MCP conservés/synchronisés par `sync-proposal-contracts.mjs --check`. Chaque route Lot 4 est contrôlée : session humaine, Origin/CSRF, idempotence/CAS, rôles et interdiction IA, révisions/hash, version d’appartenance dans l’avis, mapping durable et ChangeSet. Preview et validation restent sans mutation. Les générateurs précédents préservent ces ajouts ; `npm run lint` compare Zod/JSON Schema/DTOs/HTTP/MCP et le registre.

Cinq mutations supplémentaires portent le total à **39 tests documentaires** : approbation avec permission de préparation, retrait de la précondition d’état, origine falsifiable, substitution du catalogue par SQL et mapping durable optionnel sont refusés. Les scénarios déclaratifs [Lot 4](../spec/lot4-scenarios.json) sont distincts des tests PostgreSQL/HTTP/navigateur réellement exécutés. Les enveloppes HTTP humaines des fixtures sont alignées sur Origin/CSRF/idempotence ; leurs variantes IA/MCP restent futures. B-06/B-07 merge et CT-33 sont exécutés dans l’application, sans revendiquer la délégation ou une outbox absente. [Rapport](../LOT-4-REPORT.md).


## Assistant phase A

`ai-tools.json` décrit 14 outils internes fermés, distincts des 13 futurs outils MCP ; génération Zod et check CI via sync-ai-contracts. OpenAPI 0.8.0 ajoute 19 opérations privées. `examples/ai-phase-a.json` contient uniquement des demandes synthétiques ; les réponses effectivement observées sont validées dans tests/ai-http.test.ts. `lot5-scenarios.json` identifie la portée exacte des CT, simulation et limites incluses. Le validateur sémantique refuse l’élargissement du fournisseur, la disparition du consentement, les DTOs exposant une capacité et l’ajout d’un outil de fusion.
