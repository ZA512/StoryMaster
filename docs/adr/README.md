# Registre des décisions d’architecture

**Statut :** Huit ADR proposés, aucun accepté. **Portée :** socle et contrats MVP. **Références :** [plan](../IMPLEMENTATION-PLAN.md), [audit](../DOCUMENT-AUDIT.md).

## Synthèse et analyse

Les cinq ADR initiaux sont préservés et complétés. ADR-0001 compare le style architectural ; ADR-0006 isole la décision durable de stockage. ADR-0007 reste conditionné au spike A. ADR-0008 formalise identité, permissions et valeurs proposées.

| ID | Décision | Statut |
|---|---|---|
| ADR-0001 | [Monolithe modulaire et PostgreSQL](0001-monolithe-modulaire-postgresql.md) | Proposée |
| ADR-0002 | [API métier unique pour les humains et les IA](0002-api-metier-unique-et-mcp.md) | Proposée |
| ADR-0003 | [Propositions multi-objets et révisions optimistes](0003-propositions-transactionnelles.md) | Proposée |
| ADR-0004 | [Édition asynchrone avant collaboration temps réel](0004-edition-asynchrone-au-mvp.md) | Proposée |
| ADR-0005 | [Modularité fonctionnelle et schémas narratifs versionnés](0005-modules-et-schemas-versionnes.md) | Proposée |
| ADR-0006 | [Source de vérité et frontières du stockage](0006-source-de-verite-et-stockage.md) | Proposée |
| ADR-0007 | [Stockage de l’éditeur et représentation des différences](0007-stockage-editeur-et-diff.md) | Proposée |
| ADR-0008 | [Identité déléguée, autorisation et politiques par défaut](0008-identite-delegation-et-politiques.md) | Proposée |

## Décisions proposées et alternatives

Accepter/refuser chaque proposition explicitement avec date et auteur de validation. Un changement durable ajoute un ADR supersédant et met à jour les contrats ; aucune recommandation ne devient acceptée par sa seule présence dans le dépôt.

## Risques et questions ouvertes

Voir GO-00..04 et Q-01..15 au plan ; validation de rôle et stockage avant lot 0, format éditeur avant lot 1, modalités OAuth avant lot 6.

## Critères d'acceptation du document

Tous les ADR sont liés, numéros stables et statuts explicites ; décisions couvrent style, stockage, API/MCP, propositions, concurrence, modules, éditeur et délégation.
