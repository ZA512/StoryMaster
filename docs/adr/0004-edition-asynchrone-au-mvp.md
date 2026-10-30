# ADR-0004 — Édition asynchrone avant collaboration temps réel

**Statut :** Proposée  
**Date :** 2026-10-30

## Contexte

La collaboration temps réel est souhaitée, mais les documents structurés, l'historique et les propositions multi-objets introduisent déjà une complexité importante.

Un système CRDT ajouterait des questions de synchronisation, de révisions et de fusion.

## Options étudiées

### A. CRDT dès le MVP

Avantages :
- édition simultanée fluide ;
- gestion native de certaines modifications concurrentes.

Inconvénients :
- complexité d'intégration avec les propositions ;
- nécessité de définir des snapshots métier ;
- coût de conception plus élevé.

### B. Concurrence optimiste au MVP

Avantages :
- comportement déterministe ;
- historique simple ;
- intégration directe aux propositions ;
- tests plus faciles.

Inconvénients :
- conflits nécessitant une résolution utilisateur ;
- absence de coédition simultanée fluide.

## Décision proposée

Utiliser la concurrence optimiste au MVP.

Chaque sauvegarde de scène transmet la révision attendue.

Une sauvegarde obsolète est refusée et le brouillon local est conservé.

Prévoir une évolution vers un moteur CRDT en V1.

## Conséquences

- l'interface doit gérer correctement les échecs d'enregistrement ;
- les conflits ne peuvent pas être masqués ;
- les révisions de scènes restent des objets métier indépendants ;
- le format de document doit être compatible avec une évolution collaborative.

## Critères de réexamen

Réexaminer cette décision après stabilisation du moteur de propositions et validation des besoins réels de coédition.

## Consolidation du 30 octobre 2026

**Portée :** MVP et points de réexamen V1. **Références :** [PRD](../PRD.md), [audit](../DOCUMENT-AUDIT.md), [architecture](../ARCHITECTURE.md), [sources vérifiées](../RESEARCH-SOURCES.md). **Synthèse :** proposition initiale conservée, précisée ci-dessous ; aucune acceptation humaine constatée.

### Forces / contraintes

MVP asynchrone et évolutivité V1 ; préservation du texte et audit avant fluidité temps réel.

### Options complémentaires

Snapshots JSON optimistes vs binaire CRDT dès le socle.

### Décision proposée précisée

Yjs updates et Hocuspocus vérifiés S17/S18 ; gate CRDT projeté à V1 ; spike A documente compatibilité sans l’implémenter.

### Alternatives rejetées

CRDT immédiat rejeté par périmètre, pas par incapacité technique ; collaboration synchrone et propositions sont deux problèmes différents.

### Conséquences positives

Contrats explicites et preuves de validation communes ; décisions réversibles par ADR supersédant, sans réécriture silencieuse des exigences.

### Conséquences négatives

Migration future nécessite epoch et checkpoints, pas simple activation d’une extension.

### Risques

Les recommandations ne prouvent ni performance ni sécurité d'une application absente. Les spikes et tests du lot concerné sont des conditions d'utilisation.

### Niveau de confiance et autorité

Élevé ; périmètre imposé PRD DEC-08, stockage recommandé.

### Conditions de réexamen

Échec d'un spike, changement d'exigence approuvé ou mesure montrant que les limites ci-dessus bloquent un parcours ; décision nouvelle explicitement reliée à cet ADR.

### Questions ouvertes

Versions exactes, limites mesurées et validation des politiques correspondantes dans le plan. Statut maintenu **Proposée**.

### Critères d'acceptation du document

Contexte et options initiaux conservés ; forces, recommandation, alternatives, conséquences, risques, confiance et conditions de réexamen identifiables ; aucune formulation ne prétend une acceptation inexistante.
