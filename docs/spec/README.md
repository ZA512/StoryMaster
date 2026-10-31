# Artefacts de contrat

**Statut :** Opérations HTTP `x-lot: 0` exécutées ; autres contrats et MCP proposés. **Portée :** MVP, sans serveur MCP au Lot 0. **Références :** [contrats](../API-CONTRACTS.md), [sources](../RESEARCH-SOURCES.md).

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
