# ADR-0002 — API métier unique pour les humains et les IA

**Statut :** Acceptée
**Date :** 2026-10-30

## Contexte

Le produit doit permettre des modifications depuis :

- l'interface web ;
- l'assistant IA intégré ;
- des clients IA externes via MCP.

Des implémentations distinctes pourraient entraîner des écarts de validation, de permissions ou d'historique.

## Options étudiées

### A. Accès direct des agents à la base

Rejeté en raison des risques de sécurité, de cohérence et de contournement des règles métier.

### B. API distincte pour les agents

Possible, mais risque de duplication et de divergence des règles.

### C. Services métier communs avec adaptateurs HTTP et MCP

Permet de centraliser les validations tout en exposant des interfaces adaptées.

## Décision proposée

Retenir une couche de cas d'usage métier commune.

L'interface web utilise l'API HTTP.

Le serveur MCP adapte un catalogue limité de ces mêmes cas d'usage.

L'assistant IA intégré utilise également les cas d'usage autorisés.

## Conséquences

- une seule implémentation des permissions ;
- une seule logique de propositions ;
- une traçabilité commune ;
- des tests de domaine réutilisables ;
- une surface MCP volontairement plus restreinte que l'API administrative.

## Règle de sécurité

Un client IA ne peut jamais obtenir plus de droits que l'intersection des permissions de l'utilisateur, du client et de la délégation.

## Critères de réexamen

Réexaminer la forme des adaptateurs si les standards MCP évoluent ou si de nouveaux clients nécessitent des transports supplémentaires.

La centralisation des règles métier reste un invariant.

## Consolidation du 30 octobre 2026

**Portée :** MVP et points de réexamen V1. **Références :** [PRD](../PRD.md), [audit](../DOCUMENT-AUDIT.md), [architecture](../ARCHITECTURE.md), [sources vérifiées](../RESEARCH-SOURCES.md). **Synthèse :** proposition initiale conservée, précisée ci-dessous ; principes acceptés par instruction du propriétaire du 31 octobre 2026.

### Forces / contraintes

Même autorisation et intégrité quel que soit le canal ; aucune voie d’écriture IA privilégiée.

### Options complémentaires

HTTP comme protocole interne systématique vs appels in-process des mêmes cas d’usage.

### Décision proposée précisée

MCP 2026-07-28 et SDK v2 vérifiés ; adaptateur moderne proposé, legacy à tester au spike C ; ADR-0008 pour identité.

### Alternatives rejetées

Duplication métier MCP et accès DB agent rejetés ; HTTP interne possible lors extraction, pas nécessaire MVP.

### Conséquences positives

Contrats explicites et preuves de validation communes ; décisions réversibles par ADR supersédant, sans réécriture silencieuse des exigences.

### Conséquences négatives

Un simple partage des types ne prouve pas le partage effectif des contrôles ; tests de parité requis.

### Risques

Les recommandations ne prouvent ni performance ni sécurité d'une application absente. Les spikes et tests du lot concerné sont des conditions d'utilisation.

### Niveau de confiance et autorité

Élevé ; principe imposé par PRD 17.1, forme recommandée.

### Conditions de réexamen

Échec d'un spike, changement d'exigence approuvé ou mesure montrant que les limites ci-dessus bloquent un parcours ; décision nouvelle explicitement reliée à cet ADR.

### Questions ouvertes

Versions exactes, limites mesurées et validation des politiques correspondantes dans le plan. Statut **Acceptée** pour les principes définis ci-dessous.

### Critères d'acceptation du document

Contexte et options initiaux conservés ; forces, recommandation, alternatives, conséquences, risques, confiance et conditions de réexamen identifiables ; aucune formulation ne prétend une acceptation inexistante.

## Validation du 31 octobre 2026

Décideur : propriétaire du projet, instruction explicite « Validation des décisions et implémentation du Lot 0 ». Principes acceptés : monolithe modulaire TypeScript, source de vérité PostgreSQL, cas d’usage communs, révisions optimistes, atomicité, historique/audit et outbox pour effets externes nécessaires. Les fonctions futures ne sont pas implémentées au Lot 0.
