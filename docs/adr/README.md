# Registre des décisions d’architecture

**Statut :** ADR-0001/0002/0006/0007 acceptés ; ADR-0003 accepté sur atomicité/concurrence, verrou provisoire ; ADR-0008 partiellement validé GO-02 ; ADR-0005 accepté en principe ; ADR-0009/0010/0011 décrivent la mise en œuvre des lots autorisés ; autres ADR proposés. **Portée :** socle et contrats MVP. **Références :** [plan](../IMPLEMENTATION-PLAN.md), [audit](../DOCUMENT-AUDIT.md).

## Synthèse et analyse

Les cinq ADR initiaux sont préservés et complétés. ADR-0001 compare le style architectural ; ADR-0006 isole la décision durable de stockage. ADR-0007 est accepté par le propriétaire le 31 octobre 2026 après le Spike A. ADR-0008 formalise identité, permissions et valeurs proposées.

| ID | Décision | Statut |
|---|---|---|
| ADR-0001 | [Monolithe modulaire et PostgreSQL](0001-monolithe-modulaire-postgresql.md) | Acceptée |
| ADR-0002 | [API métier unique pour les humains et les IA](0002-api-metier-unique-et-mcp.md) | Acceptée |
| ADR-0003 | [Propositions multi-objets et révisions optimistes](0003-propositions-transactionnelles.md) | Acceptée (verrou provisoire) |
| ADR-0004 | [Édition asynchrone avant collaboration temps réel](0004-edition-asynchrone-au-mvp.md) | Proposée |
| ADR-0005 | [Modularité fonctionnelle et schémas narratifs versionnés](0005-modules-et-schemas-versionnes.md) | Principe accepté, 31 octobre 2026 |
| ADR-0006 | [Source de vérité et frontières du stockage](0006-source-de-verite-et-stockage.md) | Acceptée |
| ADR-0007 | [Stockage de l’éditeur et représentation des différences](0007-stockage-editeur-et-diff.md) | Acceptée |
| ADR-0009 | [Socle exécutable Lot 0](0009-socle-executable-lot-0.md) | Mise en œuvre GO-00..02 |
| ADR-0008 | [Identité déléguée, autorisation et politiques par défaut](0008-identite-delegation-et-politiques.md) | Proposée |
| ADR-0010 | [Atelier et barrière des écritures de texte](0010-atelier-ecriture-et-concurrence.md) | Mise en œuvre Lot 1 ; reçu avec réserves |

| ADR-0011 | [Référentiel narratif et références de scènes](0011-referentiel-narratif-et-references.md) | Mise en œuvre Lot 2 ; réception humaine attendue |

## Décisions proposées et alternatives

Accepter/refuser chaque proposition explicitement avec date et auteur de validation. Un changement durable ajoute un ADR supersédant et met à jour les contrats ; aucune recommandation ne devient acceptée par sa seule présence dans le dépôt.

## Risques et questions ouvertes

Voir GO-00..04 et Q-01..15 au plan ; rôles et stockage validés pour lot 0, format éditeur avant lot 1, modalités OAuth avant lot 6.

## Critères d'acceptation du document

Tous les ADR sont liés, numéros stables et statuts explicites ; décisions couvrent style, stockage, API/MCP, propositions, concurrence, modules, éditeur et délégation.
