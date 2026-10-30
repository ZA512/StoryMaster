# Artefacts de contrat

**Statut :** Proposés. **Portée :** spécifications sans serveur. **Références :** [contrats](../API-CONTRACTS.md), [sources](../RESEARCH-SOURCES.md).

## Synthèse et analyse

- `openapi.yaml` : HTTP minimal, OpenAPI 3.1.1 délibérément choisi pour compatibilité d'outillage.
- `operations.schema.json` : union fermée des neuf opérations MVP, JSON Schema 2020-12. La validation sémantique reste dans le domaine.
- `mcp-tools.json` : modèle de résultat `tools/list` MCP 2026-07-28 ; les inputSchema/outputSchema autonomes embarquent les définitions communes.
- `mcp-policy.json` : format local pour permissions, scopes, effets, idempotence, limites et erreurs, séparé des définitions officielles.
- `requirements.json` : inventaire extrait du PRD, version cible et lot principal ; ne remplace pas le texte du PRD.

Les schémas n'imposent pas des UUID dans les fixtures ; en production, IDs générés serveur et opaques. Validation supplémentaire : type des nœuds/marks et attributs allowlist, bornes bytes/profondeur, absence de références interprojets, types des extrémités, unicité cibles et tempId, ensemble final cohérent. Le modèle métier stocke les ids résolus ; les entrées d'opération emploient des ObjectRef.

## Décisions proposées et alternatives

Contrats de schéma autonomes pour permettre validation sans réseau ; pas de génération de serveur. Une future source partagée pourra générer HTTP/MCP à l'implémentation, avec test de non-divergence. Les schémas ne prouvent pas les permissions ni l'atomicité.

## Risques et questions ouvertes

Sous-ensembles de JSON Schema supportés par chaque fournisseur à tester ; ne pas donner directement ce catalogue volumineux à un LLM intégré. Versions exactes de SDK, limites bytes et stratégie de génération à confirmer avant les lots concernés.

## Critères d'acceptation du document

Parsing JSON/YAML réussi ; références résolues ; OpenAPI valide ; schémas Draft 2020-12 valides et fixtures conformes ; exactement treize outils obligatoires et aucun merge ; chaque outil a sa politique séparée. Rapport de vérification dans `../SPECIFICATION-VALIDATION.md`.
