# ADR-0001 — Monolithe modulaire et PostgreSQL

**Statut :** Acceptée
**Date :** 2026-10-30

## Contexte

Le produit doit gérer des manuscrits, des objets narratifs, des relations, des permissions, des propositions et des révisions.

Une proposition peut modifier plusieurs ressources interdépendantes.

Le système doit garantir l'atomicité de ces modifications.

## Options étudiées

### A. Microservices indépendants

Avantages :
- déploiement indépendant ;
- isolation de certaines charges.

Inconvénients :
- complexité opérationnelle ;
- transactions distribuées ;
- cohérence plus difficile ;
- coût de développement initial élevé.

### B. Monolithe modulaire avec PostgreSQL

Avantages :
- transactions ACID ;
- cohérence des opérations multi-objets ;
- exploitation plus simple ;
- frontières métier internes ;
- évolution progressive.

Inconvénients :
- discipline nécessaire sur les dépendances entre modules ;
- déploiement principal moins indépendant ;
- risque de monolithe désorganisé si les frontières sont ignorées.

## Décision proposée

Retenir un monolithe modulaire avec PostgreSQL comme source de vérité.

Séparer clairement :

- domaine ;
- cas d'usage ;
- adaptateurs ;
- infrastructure.

Prévoir un worker pour les traitements asynchrones.

## Conséquences

- les modifications narratives coordonnées utilisent une transaction PostgreSQL ;
- les modules ne communiquent pas par accès direct non contrôlé aux tables des autres modules ;
- les effets externes sont déclenchés après validation transactionnelle ;
- une extraction future en service indépendant reste possible si un besoin réel apparaît.

## Critères de réexamen

Réexaminer cette décision si les besoins de charge, d'isolation opérationnelle ou d'organisation des équipes justifient clairement une séparation physique.

## Consolidation du 30 octobre 2026

**Portée :** MVP et points de réexamen V1. **Références :** [PRD](../PRD.md), [audit](../DOCUMENT-AUDIT.md), [architecture](../ARCHITECTURE.md), [sources vérifiées](../RESEARCH-SOURCES.md). **Synthèse :** proposition initiale conservée, précisée ci-dessous ; principes acceptés par instruction du propriétaire du 31 octobre 2026.

### Forces / contraintes

Atomicité multi-objets, petite équipe, coûts d’exploitation et extraction future.

### Options complémentaires

Services séparés avec saga ; backend géré avec transaction serveur partagée.

### Décision proposée précisée

ADR-0006 précise stockage, fichiers, recherche et outbox ; diagramme architecture §19.

### Alternatives rejetées

Services rejetés au MVP faute de charge ou équipes indépendantes ; backend géré reste compatible si même couche métier.

### Conséquences positives

Contrats explicites et preuves de validation communes ; décisions réversibles par ADR supersédant, sans réécriture silencieuse des exigences.

### Conséquences négatives

Risque de contention ; monolithe exige discipline des dépendances.

### Risques

Les recommandations ne prouvent ni performance ni sécurité d'une application absente. Les spikes et tests du lot concerné sont des conditions d'utilisation.

### Niveau de confiance et autorité

Élevé ; recommandée, non imposée par stack PRD.

### Conditions de réexamen

Échec d'un spike, changement d'exigence approuvé ou mesure montrant que les limites ci-dessus bloquent un parcours ; décision nouvelle explicitement reliée à cet ADR.

### Questions ouvertes

Versions exactes, limites mesurées et validation des politiques correspondantes dans le plan. Statut **Acceptée** pour les principes définis ci-dessous.

### Critères d'acceptation du document

Contexte et options initiaux conservés ; forces, recommandation, alternatives, conséquences, risques, confiance et conditions de réexamen identifiables ; aucune formulation ne prétend une acceptation inexistante.

## Validation du 31 octobre 2026

Décideur : propriétaire du projet, instruction explicite « Validation des décisions et implémentation du Lot 0 ». Principes acceptés : monolithe modulaire TypeScript, source de vérité PostgreSQL, cas d’usage communs, révisions optimistes, atomicité, historique/audit et outbox pour effets externes nécessaires. Les fonctions futures ne sont pas implémentées au Lot 0.
