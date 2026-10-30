# ADR-0005 — Modularité fonctionnelle et schémas narratifs versionnés

**Statut :** Proposée  
**Date :** 2026-10-30

## Contexte

Les genres littéraires nécessitent des objets et outils différents.

Un roman contemporain, une enquête policière et une saga de fantasy ne doivent pas imposer la même interface.

Le système doit cependant préserver un modèle commun de références, de permissions et d'historique.

## Options étudiées

### A. Schéma de base entièrement spécifique à chaque module

Avantages :
- forte spécialisation.

Inconvénients :
- nombreuses migrations ;
- duplication des mécanismes communs ;
- relations transversales plus complexes.

### B. Modèle entièrement générique et non typé

Avantages :
- flexibilité initiale.

Inconvénients :
- validation faible ;
- contraintes métier difficiles ;
- risque de données incohérentes.

### C. Modèle hybride avec registre de types et schémas versionnés

Combine un noyau relationnel avec des propriétés spécialisées validées.

## Décision proposée

Retenir un modèle hybride.

Les objets possèdent :

- identifiant stable ;
- projet ;
- type ;
- version de schéma ;
- propriétés validées ;
- révision ;
- historique.

Les modules déclarent leurs types, relations et dépendances.

## Conséquences

- nécessité d'un registre de schémas ;
- migrations explicites lors des évolutions ;
- relations et permissions communes ;
- désactivation non destructive des modules ;
- ajout progressif de modules spécialisés.

## Limite MVP

Ne pas permettre le chargement de code exécutable tiers.

Les modules sont des fonctionnalités connues de l'application.

## Critères de réexamen

Évaluer une architecture d'extensions tierces uniquement après stabilisation des contrats métier et de sécurité.

## Consolidation du 30 octobre 2026

**Portée :** MVP et points de réexamen V1. **Références :** [PRD](../PRD.md), [audit](../DOCUMENT-AUDIT.md), [architecture](../ARCHITECTURE.md), [sources vérifiées](../RESEARCH-SOURCES.md). **Synthèse :** proposition initiale conservée, précisée ci-dessous ; aucune acceptation humaine constatée.

### Forces / contraintes

Genre littéraire variable, intégrité transversale, désactivation non destructive.

### Options complémentaires

Types par tables vs JSON libre vs noyau relationnel et schémas JSON versionnés.

### Décision proposée précisée

Version publiée immuable ; migration explicite des objets et schemaVersion ; historique ancien lisible sans réécriture ; off conserve lecture/export mais refuse mutations du module. Les références restent stables.

### Alternatives rejetées

Code tiers arbitraire et JSON non validé rejetés MVP ; constructeur de type libre différé.

### Conséquences positives

Contrats explicites et preuves de validation communes ; décisions réversibles par ADR supersédant, sans réécriture silencieuse des exigences.

### Conséquences négatives

Migration de schémas et dépendances de modules peuvent invalider propositions en préparation.

### Risques

Les recommandations ne prouvent ni performance ni sécurité d'une application absente. Les spikes et tests du lot concerné sont des conditions d'utilisation.

### Niveau de confiance et autorité

Élevé ; modularité imposée PRD, stratégie hybride recommandée.

### Conditions de réexamen

Échec d'un spike, changement d'exigence approuvé ou mesure montrant que les limites ci-dessus bloquent un parcours ; décision nouvelle explicitement reliée à cet ADR.

### Questions ouvertes

Versions exactes, limites mesurées et validation des politiques correspondantes dans le plan. Statut maintenu **Proposée**.

### Critères d'acceptation du document

Contexte et options initiaux conservés ; forces, recommandation, alternatives, conséquences, risques, confiance et conditions de réexamen identifiables ; aucune formulation ne prétend une acceptation inexistante.
