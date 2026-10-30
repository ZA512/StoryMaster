# ADR-0003 — Propositions multi-objets et révisions optimistes

**Statut :** Proposée  
**Date :** 2026-10-30

## Contexte

Les utilisateurs et les IA doivent pouvoir préparer des modifications affectant simultanément une scène, un personnage, un événement et des relations.

Les changements doivent être examinables et ne pas écraser silencieusement des modifications concurrentes.

## Options étudiées

### A. Modifications immédiates sans proposition

Simple, mais insuffisant pour la revue IA et les changements coordonnés.

### B. Branches Git sur les données applicatives

Offre un modèle conceptuel intéressant, mais introduit une complexité importante pour les objets relationnels, les documents structurés et la collaboration.

### C. Propositions métier versionnées et fusion transactionnelle

Permet de gérer explicitement les opérations, préconditions, différences et approbations.

## Décision proposée

Créer un système natif de propositions métier.

Chaque proposition contient :

- une révision propre ;
- des opérations typées ;
- des révisions attendues ;
- une justification ;
- des commentaires ;
- des approbations liées à sa révision.

La fusion s'effectue dans une transaction PostgreSQL.

## Règles

1. Toute opération est validée avant application.
2. Une révision obsolète entraîne un conflit.
3. Une approbation devient invalide si la proposition change.
4. Une fusion ne peut pas être partielle.
5. Une fusion est idempotente.
6. Les changements appliqués sont historisés.
7. Les modifications IA nécessitent une validation humaine au MVP.

## Conséquences

- moteur de propositions à développer avant les écritures IA ;
- comparaison des documents structurés nécessaire ;
- gestion explicite des conflits ;
- possibilité future de branches narratives, sans dépendre de Git.

## Limites

Le MVP ne réalise pas de fusion automatique complexe entre deux modifications concurrentes du même texte.

Il préfère refuser un conflit et permettre une résolution explicite.

## Critères de réexamen

Évaluer des mécanismes de fusion plus fins lors de l'introduction de l'édition collaborative temps réel.

## Consolidation du 30 octobre 2026

**Portée :** MVP et points de réexamen V1. **Références :** [PRD](../PRD.md), [audit](../DOCUMENT-AUDIT.md), [architecture](../ARCHITECTURE.md), [sources vérifiées](../RESEARCH-SOURCES.md). **Synthèse :** proposition initiale conservée, précisée ci-dessous ; aucune acceptation humaine constatée.

### Forces / contraintes

Révisions exactes, état final de graphe valide, aucune fusion partielle et retry après réponse perdue.

### Options complémentaires

Verrou projet READ COMMITTED pour toute écriture vs SERIALIZABLE et reprises complètes.

### Décision proposée précisée

proposalRevision contenu distincte de stateVersion ; approval liée hash/révision ; IDs temporaires résolus au commit ; unicité durable proposalId→ChangeSet ; aucune sortie réseau transactionnelle. Le protocole complet est API §18.

### Alternatives rejetées

Locks des seules lignes modifiées rejetés comme protection unique contre write skew/cycles ; compensation après fusion rejetée.

### Conséquences positives

Contrats explicites et preuves de validation communes ; décisions réversibles par ADR supersédant, sans réécriture silencieuse des exigences.

### Conséquences négatives

Sérialisation autosave dans un projet, pertes de débit ; pas de merge textuel automatique.

### Risques

Les recommandations ne prouvent ni performance ni sécurité d'une application absente. Les spikes et tests du lot concerné sont des conditions d'utilisation.

### Niveau de confiance et autorité

Élevé sur atomicité imposée ; moyen sur granularité de verrou recommandée à mesurer.

### Conditions de réexamen

Échec d'un spike, changement d'exigence approuvé ou mesure montrant que les limites ci-dessus bloquent un parcours ; décision nouvelle explicitement reliée à cet ADR.

### Questions ouvertes

Versions exactes, limites mesurées et validation des politiques correspondantes dans le plan. Statut maintenu **Proposée**.

### Critères d'acceptation du document

Contexte et options initiaux conservés ; forces, recommandation, alternatives, conséquences, risques, confiance et conditions de réexamen identifiables ; aucune formulation ne prétend une acceptation inexistante.
