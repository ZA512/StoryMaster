# ADR-0003 — Propositions multi-objets et révisions optimistes

**Statut :** Acceptée
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

**Portée :** MVP et points de réexamen V1. **Références :** [PRD](../PRD.md), [audit](../DOCUMENT-AUDIT.md), [architecture](../ARCHITECTURE.md), [sources vérifiées](../RESEARCH-SOURCES.md). **Synthèse :** proposition initiale conservée, précisée ci-dessous ; principes acceptés par instruction du propriétaire du 31 octobre 2026.

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

### Risque de contention à qualifier

Le verrou exclusif projet sérialise aussi des écritures de scènes indépendantes et des commentaires. Une transaction longue peut retarder tous les auteurs du projet ; ajouter des workers ne garantit pas davantage de débit. La stratégie reste proposée et conditionnelle aux cas B-01..07 du [spike B](../IMPLEMENTATION-PLAN.md), avec attente/détention mesurées séparément et contrôle interprojets. Des ressources indépendantes ne doivent pas subir un faux conflit de version dû au seul compteur global. Voir R-CONT-01 de l'architecture et [GO-01](../HUMAN-DECISIONS.md).

Sans enveloppe de charge et mesures, aucune capacité n'est qualifiée. Si les cibles NFR sont incompatibles avec cette granularité, étudier verrous d'agrégats/contraintes ou SERIALIZABLE avant généralisation, sans affaiblir les invariants. L'acceptation du principe transactionnel ne vaut pas acceptation définitive de ce verrou.

### Niveau de confiance et autorité

Élevé sur atomicité imposée ; moyen sur granularité de verrou recommandée à mesurer.

### Conditions de réexamen

Échec d'un spike, changement d'exigence approuvé ou mesure montrant que les limites ci-dessus bloquent un parcours ; décision nouvelle explicitement reliée à cet ADR.

### Questions ouvertes

Versions exactes, limites mesurées et validation des politiques correspondantes dans le plan. Statut **Acceptée** pour les principes définis ci-dessous.

### Critères d'acceptation du document

Contexte et options initiaux conservés ; forces, recommandation, alternatives, conséquences, risques, confiance et conditions de réexamen identifiables ; aucune formulation ne prétend une acceptation inexistante.

## Validation du 31 octobre 2026

Décideur : propriétaire du projet, instruction explicite « Validation des décisions et implémentation du Lot 0 ». Principes acceptés : monolithe modulaire TypeScript, source de vérité PostgreSQL, cas d’usage communs, révisions optimistes, atomicité, historique/audit et outbox pour effets externes nécessaires. Les fonctions futures ne sont pas implémentées au Lot 0.

Le verrou exclusif par projet reste **provisoire**, à mesurer ; seule l’obligation d’atomicité et de contrôle de concurrence est définitivement acceptée. Premières mesures dès Lot 0 sur métadonnées de projets ; spike B complet idéalement avant généralisation des sauvegardes du Lot 1.

## Adaptation mesurée du Lot 1 — 31 octobre 2026

L’[ADR-0010](0010-atelier-ecriture-et-concurrence.md) précise la barrière : les sauvegardes/restaurations du texte d’une seule scène prennent Project partagé puis Scene exclusif ; structure, métadonnées, archivage et futurs traitements multi-objets restent exclusifs au projet. Les verrous des seules scènes ne remplacent pas la frontière projet. Le [rapport Lot 1](../LOT-1-REPORT.md) compare les deux stratégies sur PostgreSQL avec contrôle de contenu/snapshots, conflits légitimes et révocations. Cette adaptation du verrou provisoire est autorisée par la mission Lot 1 ; elle ne valide pas les propositions encore absentes.
