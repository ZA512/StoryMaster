# PRD — Plateforme modulaire de création littéraire

**Version :** 0.1  
**Statut :** Proposition initiale — à consolider avec les recherches fonctionnelles  
**Date :** 30 octobre 2026  
**Nature :** Product Requirements Document (PRD)  
**Public cible :** Responsable produit, concepteurs, développeurs, Codex, futurs contributeurs

---

## 1. Objet du document

Ce document définit les objectifs, le périmètre, les comportements attendus, les exigences fonctionnelles et non fonctionnelles d'une plateforme web dédiée à la création littéraire.

Il sert de référence pour :

- cadrer les fonctionnalités du produit ;
- organiser les développements par étapes ;
- guider les choix de conception ;
- produire les spécifications techniques ;
- définir les critères de validation ;
- éviter les divergences fonctionnelles au fil des développements.

Le PRD décrit **ce que le produit doit permettre de faire**, et non l'implémentation technique détaillée de chaque composant.

### 1.1 Documents de référence

Les documents suivants doivent être présents dans le répertoire `docs/` :

- `deep-research-analyse-fonction.md` : analyse comparative des logiciels d'écriture et de leurs fonctionnalités ;
- `deep-research-modele-fonctionnel.md` : étude du modèle fonctionnel, des objets narratifs, de la collaboration et de l'intégration des IA ;
- `PRD.md` : présent document.

Les deux recherches sont des **sources de contexte et de justification**. Le présent PRD constitue la base des exigences produit après validation.

Toute contradiction ou fonctionnalité importante identifiée dans les recherches mais absente du PRD doit être documentée. Elle ne doit pas entraîner automatiquement un développement.

### 1.2 Convention de priorité

Les exigences utilisent trois niveaux :

- **MUST** : indispensable au périmètre de la version concernée ;
- **SHOULD** : fortement recommandé, mais pouvant être reporté après arbitrage ;
- **COULD** : amélioration facultative.

Les versions sont désignées par :

- **MVP** : première version utilisable de bout en bout ;
- **V1** : version fonctionnellement mature pour un usage régulier ;
- **V2+** : capacités avancées et extensions.

La priorité et la version sont deux notions distinctes : une fonctionnalité peut être obligatoire pour V1 sans appartenir au MVP.

---

## 2. Vision du produit

### 2.1 Proposition de valeur

Créer une plateforme web permettant à un auteur ou à un collectif d'auteurs de **concevoir, organiser, écrire, réviser et faire évoluer une œuvre littéraire au sein d'un environnement cohérent**.

La plateforme doit réunir :

1. un espace de rédaction ;
2. un référentiel structuré de l'univers narratif ;
3. des outils de planification et de visualisation ;
4. des mécanismes de collaboration et de révision ;
5. une IA capable d'exploiter le contexte réel du projet et de proposer des modifications contrôlées ;
6. une architecture fonctionnelle modulaire adaptée à différents types d'œuvres.

Le produit ne doit pas imposer à tous les auteurs une méthode unique de travail.

Un auteur de roman contemporain peut se contenter du manuscrit, des personnages et d'une chronologie simple. Un auteur de fantasy peut activer des modules supplémentaires : peuples, factions, bestiaire, magie, cartes, généalogies, encyclopédie, etc.

### 2.2 Principe directeur

**Le manuscrit et les connaissances structurées sur l'œuvre doivent former un ensemble relié, sans être confondus.**

Une scène raconte des événements. Une fiche personnage décrit une entité narrative. Une chronologie situe des faits. Une proposition de modification peut affecter ces différents éléments simultanément.

L'utilisateur doit pouvoir passer de l'un à l'autre sans ressaisir plusieurs fois la même information.

### 2.3 Différenciation recherchée

La différenciation ne repose pas sur l'accumulation de fonctionnalités.

Elle repose principalement sur :

- l'interconnexion des objets narratifs ;
- la cohérence entre le manuscrit et le référentiel du projet ;
- la modularité de l'interface et des fonctionnalités ;
- la collaboration contrôlée ;
- l'intégration d'une IA agissant sur les mêmes objets métier que les utilisateurs ;
- la capacité à examiner, comprendre, approuver ou rejeter des changements complexes.

### 2.4 Positionnement de l'IA

L'IA est un **collaborateur logiciel soumis aux règles du projet**, et non une autorité autonome.

Elle peut assister la réflexion, rechercher des informations dans le projet, analyser des incohérences, proposer des textes et préparer des modifications.

Elle ne doit pas modifier silencieusement le canon narratif, supprimer des données ou contourner les permissions.

---

## 3. Objectifs et non-objectifs

### 3.1 Objectifs

| ID | Objectif | Priorité |
|---|---|---|
| OBJ-01 | Permettre à un utilisateur de gérer plusieurs projets littéraires indépendants | MUST |
| OBJ-02 | Permettre des projets individuels ou collaboratifs | MUST |
| OBJ-03 | Fournir un environnement de rédaction structuré en manuscrits, chapitres et scènes | MUST |
| OBJ-04 | Centraliser les informations relatives aux personnages, lieux et événements | MUST |
| OBJ-05 | Relier les éléments du manuscrit aux objets narratifs | MUST |
| OBJ-06 | Permettre l'activation progressive de modules spécialisés | MUST |
| OBJ-07 | Fournir à l'IA un accès contrôlé aux objets du projet, via l'application et MCP | MUST |
| OBJ-08 | Proposer, examiner et appliquer des changements multi-objets avec traçabilité | MUST |
| OBJ-09 | Prévenir les pertes de données et permettre la récupération des versions antérieures | MUST |
| OBJ-10 | Détecter et expliquer certaines incohérences narratives | SHOULD |
| OBJ-11 | Faciliter la collaboration simultanée sur le texte | SHOULD |
| OBJ-12 | Permettre l'export et la récupération des données dans des formats ouverts | MUST |

### 3.2 Non-objectifs initiaux

Le produit ne cherche pas, dans son MVP, à :

- remplacer un logiciel de mise en page professionnelle ;
- proposer un outil complet de publication commerciale et de distribution ;
- générer automatiquement un roman entier sans intervention humaine ;
- garantir la qualité littéraire d'un texte par un score algorithmique ;
- fournir immédiatement tous les modules spécialisés identifiés dans les recherches ;
- exécuter des extensions arbitraires fournies par des tiers ;
- permettre à des agents IA de prendre des décisions irréversibles sans politique d'autorisation explicite.

Ces fonctions pourront être réévaluées ultérieurement.

---

## 4. Utilisateurs et acteurs

### 4.1 Profils humains

**Auteur individuel**

Crée ses propres projets, organise ses idées, rédige et utilise éventuellement l'IA. Ses projets sont privés par défaut.

**Auteur collaborateur**

Participe à un ou plusieurs projets collectifs. Peut être autorisé à modifier le manuscrit, certaines fiches ou uniquement des parties du projet.

**Responsable de projet**

Définit la structure du projet, invite les membres, active les modules et configure les politiques de validation.

**Relecteur ou bêta-lecteur**

Consulte les contenus autorisés, laisse des commentaires et soumet des suggestions sans nécessairement disposer de droits de modification directe.

**Éditeur littéraire**

Analyse le manuscrit, formule des demandes de modification et participe aux validations selon ses permissions.

### 4.2 Acteurs logiciels

**Assistant IA intégré**

Accessible depuis l'interface de la plateforme, avec accès contextuel aux informations autorisées du projet.

**Assistant IA externe**

Client utilisant une interface MCP sécurisée pour consulter le projet et proposer des opérations. Exemples de catégories de clients : assistant de développement, agent conversationnel ou orchestrateur d'agents.

**Moteur de validation**

Composant non conversationnel chargé de vérifier les règles métier, les permissions, les versions et les contraintes déterministes.

**Moteur d'analyse narrative**

Ensemble de traitements déterministes et/ou assistés par IA permettant d'identifier des anomalies et de formuler des diagnostics.

### 4.3 Hypothèse de départ

Une même personne peut être propriétaire de plusieurs projets privés, auteur dans un projet collectif et relecteur dans un autre.

Les permissions sont donc **définies par projet**, et non uniquement par compte utilisateur.

---

## 5. Concepts fondamentaux

### 5.1 Projet

Le projet est l'unité principale d'organisation, de confidentialité et d'autorisation.

Il contient :

- ses membres et leurs rôles ;
- un ou plusieurs manuscrits ;
- les objets narratifs ;
- les modules activés ;
- les paramètres ;
- les commentaires ;
- les propositions de modification ;
- les versions et événements d'audit.

Un projet appartient à un périmètre de sécurité explicite.

Aucun accès à un projet ne doit découler automatiquement de l'appartenance à un autre projet.

### 5.2 Manuscrit

Un manuscrit est une structure ordonnée de chapitres, contenant des scènes ou unités rédactionnelles.

Le modèle initial est :

**Projet → Manuscrit → Chapitre → Scène**

Une scène contient le texte éditable et peut posséder des métadonnées :

- titre ;
- résumé ;
- point de vue ;
- statut ;
- ordre dans le manuscrit ;
- personnages présents ;
- lieux ;
- événements associés ;
- notes ;
- objectifs narratifs.

Le déplacement d'une scène ne doit pas modifier son identité.

### 5.3 Objet narratif

Un objet narratif représente une information structurée réutilisable.

Exemples :

- personnage ;
- lieu ;
- événement ;
- objet ;
- organisation ;
- créature ;
- règle d'univers ;
- intrigue ;
- arc narratif ;
- indice ;
- révélation.

Chaque objet possède au minimum :

- un identifiant stable ;
- un type ;
- un projet de rattachement ;
- un nom ou titre ;
- des propriétés structurées ;
- un contenu descriptif facultatif ;
- une version ;
- des informations de création et de modification ;
- un état de suppression logique, si applicable.

### 5.4 Relation

Une relation relie deux objets ou un objet et une scène.

Exemples :

- un personnage appartient à une faction ;
- un personnage connaît un autre personnage ;
- un événement se déroule dans un lieu ;
- une scène met en jeu un événement ;
- un indice prépare une révélation.

Les relations doivent pouvoir porter leurs propres métadonnées, notamment un type, une description et éventuellement une période de validité.

### 5.5 Fait narratif

Un fait narratif est une assertion concernant l'univers du projet.

Exemple : « Le personnage A est le frère du personnage B ».

Un fait n'est pas nécessairement :

- connu de tous les personnages ;
- connu du lecteur ;
- vrai à toutes les périodes de l'histoire ;
- confirmé par l'auteur.

Le modèle doit pouvoir évoluer vers la distinction entre **canon, hypothèse, croyance, mensonge, information révélée et information obsolète**.

### 5.6 Proposition de modification

Une proposition est un ensemble cohérent de changements préparés mais non nécessairement appliqués.

Elle peut affecter simultanément :

- une ou plusieurs scènes ;
- une fiche personnage ;
- un événement ;
- une relation ;
- une chronologie ;
- un arc narratif.

Elle conserve la justification, les différences proposées, les impacts identifiés, les commentaires et son état de validation.

### 5.7 Version et historique

Une version permet de savoir quel état d'un objet a servi de base à une modification.

L'historique doit distinguer :

- les modifications effectivement appliquées ;
- les propositions non fusionnées ;
- les commentaires ;
- les validations ;
- les refus ;
- les restaurations.

---

## 6. Architecture fonctionnelle modulaire

### 6.1 Principe

Le produit comprend un **socle permanent** et des **modules fonctionnels activables**.

L'activation d'un module détermine les capacités et interfaces proposées dans le projet.

La désactivation d'un module ne doit jamais entraîner, par défaut, la destruction de ses données.

### 6.2 Socle permanent

Le socle comprend :

- identité et authentification ;
- gestion des projets ;
- membres et permissions ;
- manuscrits et rédaction ;
- objets narratifs génériques ;
- liens entre objets ;
- recherche ;
- commentaires ;
- historique ;
- propositions de modification ;
- API métier ;
- intégration IA contrôlée ;
- export.

### 6.3 Modules envisagés

| Module | Fonction principale | Version cible |
|---|---|---|
| Personnages | Fiches, caractéristiques, relations, évolution | MVP |
| Lieux | Fiches de lieux, hiérarchies simples, scènes associées | MVP |
| Chronologie | Événements et ordre temporel | MVP limité, V1 avancé |
| Intrigues et arcs | Objectifs, progression, conflits, résolution | V1 |
| Encyclopédie | Concepts, terminologie, règles d'univers | V1 |
| Objets et artefacts | Inventaire narratif, possession, transmission | V1 |
| Factions et organisations | Membres, alliances, oppositions | V1 |
| Bestiaire | Créatures, espèces, caractéristiques | V1 |
| Cartographie | Cartes et positionnement d'éléments | V2+ |
| Généalogies | Relations familiales et représentations | V2+ |
| Systèmes de magie / technologie | Règles, capacités, limitations | V2+ |
| Enquête et indices | Indices, suspects, révélations, fausses pistes | V2+ |
| Comité de lecture IA | Analyses critiques contextualisées | V1 |
| Publication | Exports avancés et préparation éditoriale | V1/V2+ |

Cette liste est provisoire et doit être rapprochée du catalogue des recherches.

### 6.4 Règles de modularité

**MOD-01 — MUST :** un projet peut activer ou désactiver un module autorisé.

**MOD-02 — MUST :** un module désactivé conserve ses données, sauf suppression explicitement demandée et autorisée.

**MOD-03 — MUST :** les références entre modules utilisent des identifiants stables.

**MOD-04 — MUST :** la désactivation d'un module ne doit pas invalider silencieusement les objets d'autres modules.

**MOD-05 — SHOULD :** un module peut déclarer ses dépendances fonctionnelles.

**MOD-06 — SHOULD :** les objets spécialisés reposent autant que possible sur des capacités transversales communes : propriétés, relations, recherche, versionnement, permissions.

**MOD-07 — COULD :** des modèles de projets peuvent présélectionner des modules selon le genre littéraire.

La modularité fonctionnelle n'impose pas de développer immédiatement une architecture de plugins exécutables.

---

## 7. Exigences fonctionnelles du MVP

### 7.1 Comptes et projets

| ID | Exigence | Priorité |
|---|---|---|
| PROJ-01 | Créer un compte et ouvrir une session sécurisée | MUST |
| PROJ-02 | Créer plusieurs projets depuis un même compte | MUST |
| PROJ-03 | Rendre tout nouveau projet privé par défaut | MUST |
| PROJ-04 | Consulter les projets dont l'utilisateur est membre | MUST |
| PROJ-05 | Modifier les informations générales d'un projet | MUST |
| PROJ-06 | Inviter et retirer des membres selon les permissions | MUST |
| PROJ-07 | Attribuer un rôle par projet | MUST |
| PROJ-08 | Archiver un projet sans détruire immédiatement son contenu | MUST |
| PROJ-09 | Activer les modules disponibles | MUST |
| PROJ-10 | Proposer des modèles de projets prédéfinis | SHOULD |

Aucune limite fonctionnelle arbitraire du nombre de projets ne doit être codée dans le modèle métier. Des limites d'exploitation ou de tarification pourront être introduites séparément.

### 7.2 Rédaction

| ID | Exigence | Priorité |
|---|---|---|
| EDIT-01 | Créer, renommer, déplacer et supprimer logiquement des manuscrits, chapitres et scènes | MUST |
| EDIT-02 | Modifier le texte d'une scène dans un éditeur adapté à l'écriture longue | MUST |
| EDIT-03 | Enregistrer automatiquement les modifications | MUST |
| EDIT-04 | Restaurer une version antérieure d'une scène | MUST |
| EDIT-05 | Réorganiser les scènes sans perdre leurs liens | MUST |
| EDIT-06 | Afficher le plan du manuscrit | MUST |
| EDIT-07 | Compter les mots au niveau scène, chapitre et manuscrit | MUST |
| EDIT-08 | Associer des personnages, lieux et événements à une scène | MUST |
| EDIT-09 | Ajouter des commentaires et notes | MUST |
| EDIT-10 | Proposer un mode de rédaction sans distraction | SHOULD |
| EDIT-11 | Gérer des statuts rédactionnels configurables | SHOULD |
| EDIT-12 | Comparer visuellement deux versions d'un texte | SHOULD |

Le format de stockage doit préserver les informations nécessaires aux évolutions futures. Le choix exact de l'éditeur et du format interne relève de la conception technique.

### 7.3 Référentiel narratif

| ID | Exigence | Priorité |
|---|---|---|
| DATA-01 | Créer et modifier une fiche personnage | MUST |
| DATA-02 | Créer et modifier une fiche lieu | MUST |
| DATA-03 | Créer et modifier un événement | MUST |
| DATA-04 | Créer des relations entre objets | MUST |
| DATA-05 | Associer des objets à des scènes | MUST |
| DATA-06 | Naviguer depuis un objet vers ses références | MUST |
| DATA-07 | Rechercher les objets par nom, type et contenu | MUST |
| DATA-08 | Conserver un historique des modifications | MUST |
| DATA-09 | Détecter les références devenues invalides | MUST |
| DATA-10 | Ajouter des propriétés spécifiques à certains types d'objets | SHOULD |
| DATA-11 | Afficher une chronologie simple des événements | MUST |
| DATA-12 | Gérer les dates partielles, durées et contraintes temporelles complexes | V1 — MUST |

### 7.4 Recherche et navigation

**SEARCH-01 — MUST :** rechercher dans le manuscrit et les fiches accessibles.

**SEARCH-02 — MUST :** filtrer les résultats par projet et type d'objet.

**SEARCH-03 — MUST :** ouvrir directement un résultat.

**SEARCH-04 — MUST :** respecter les permissions dans les résultats, extraits et suggestions.

**SEARCH-05 — SHOULD :** afficher les objets liés à l'élément courant.

**SEARCH-06 — V1 :** proposer une recherche sémantique et contextuelle.

### 7.5 Export

**EXPORT-01 — MUST :** exporter le texte du manuscrit en Markdown ou dans un autre format textuel ouvert documenté.

**EXPORT-02 — MUST :** exporter les données structurées d'un projet dans un format machine lisible, avec identifiants et relations.

**EXPORT-03 — MUST :** inclure dans l'export la version du schéma et une description des formats.

**EXPORT-04 — MUST :** permettre l'export uniquement aux utilisateurs autorisés.

**EXPORT-05 — V1 :** proposer des formats éditoriaux supplémentaires, notamment DOCX et EPUB.

**EXPORT-06 — V1 :** permettre la réimportation d'une archive produite par la plateforme.

L'utilisateur ne doit pas être enfermé dans un format propriétaire impossible à récupérer.

---

## 8. Collaboration et permissions

### 8.1 Rôles initiaux

| Capacité | Propriétaire | Administrateur | Auteur | Relecteur | Lecteur |
|---|---|---|---|---|---|
| Lire le contenu autorisé | Oui | Oui | Oui | Oui | Oui |
| Modifier le manuscrit | Oui | Oui | Oui | Non | Non |
| Modifier les objets narratifs | Oui | Oui | Oui | Non | Non |
| Commenter | Oui | Oui | Oui | Oui | Non |
| Soumettre une proposition | Oui | Oui | Oui | Oui | Non |
| Approuver une proposition | Oui | Configurable | Configurable | Configurable | Non |
| Inviter des membres | Oui | Oui | Non | Non | Non |
| Configurer les modules | Oui | Oui | Non | Non | Non |
| Modifier les rôles | Oui | Oui, avec restrictions | Non | Non | Non |
| Supprimer définitivement un projet | Oui | Non par défaut | Non | Non | Non |

La matrice est une base. Les autorisations effectives doivent être vérifiées par le serveur, opération par opération.

### 8.2 Collaboration

**COLLAB-01 — MUST :** plusieurs utilisateurs peuvent participer au même projet.

**COLLAB-02 — MUST :** les contributions sont attribuées à leur auteur.

**COLLAB-03 — MUST :** les modifications concurrentes ne doivent pas écraser silencieusement des données.

**COLLAB-04 — MUST :** les commentaires peuvent être associés à un objet ou à un passage du manuscrit.

**COLLAB-05 — MUST :** les permissions sont appliquées à toutes les interfaces, y compris API et MCP.

**COLLAB-06 — V1 :** plusieurs auteurs peuvent éditer simultanément une scène avec synchronisation en temps réel.

**COLLAB-07 — V1 :** l'interface peut afficher la présence des autres contributeurs.

**COLLAB-08 — SHOULD :** une notification informe les utilisateurs concernés des propositions, commentaires et validations.

### 8.3 Choix de périmètre

Pour le MVP, la collaboration asynchrone est suffisante si les modifications concurrentes sont protégées par des versions et des contrôles de conflit.

L'édition simultanée en temps réel est prévue pour V1.

Cette distinction évite de rendre le MVP dépendant, dès le départ, d'un système complet de synchronisation collaborative de texte.

---

## 9. Intelligence artificielle et accès MCP

### 9.1 Principe d'intégration

L'IA utilise les mêmes opérations métier que les autres acteurs.

Elle ne dispose pas d'un accès direct privilégié à la base de données.

Le système doit distinguer :

1. l'identité de l'utilisateur ;
2. l'identité du client ou agent IA ;
3. les permissions accordées ;
4. le projet ciblé ;
5. les opérations réellement effectuées.

Une IA externe ne reçoit jamais, par défaut, un accès global à tous les projets de l'utilisateur.

### 9.2 Modes d'utilisation

**Mode A — Assistant intégré**

L'utilisateur ouvre une conversation dans l'application et sélectionne le projet concerné.

L'assistant peut exploiter le contexte autorisé, répondre aux questions, identifier les objets pertinents et préparer des propositions.

**Mode B — Assistant externe via MCP**

L'utilisateur connecte un client compatible MCP.

Le client découvre les capacités exposées et utilise des outils de lecture, recherche et proposition, dans les limites de ses autorisations.

Les mêmes règles de validation et de fusion s'appliquent aux deux modes.

### 9.3 Capacités IA du MVP

| ID | Exigence | Priorité |
|---|---|---|
| AI-01 | Interroger l'IA depuis le contexte d'un projet | MUST |
| AI-02 | Sélectionner un fournisseur/modèle pris en charge | MUST |
| AI-03 | Utiliser des identifiants de fournisseur configurés de manière sécurisée | MUST |
| AI-04 | Rechercher les scènes et objets pertinents pour une demande | MUST |
| AI-05 | Fournir à l'IA des références identifiables aux sources du projet | MUST |
| AI-06 | Permettre à l'IA de préparer une proposition multi-objets | MUST |
| AI-07 | Exposer un ensemble contrôlé d'opérations via MCP | MUST |
| AI-08 | Empêcher toute opération dépassant les permissions déléguées | MUST |
| AI-09 | Conserver la provenance des propositions IA | MUST |
| AI-10 | Afficher les modifications avant leur application | MUST |
| AI-11 | Imposer une validation humaine des propositions IA par défaut | MUST |
| AI-12 | Permettre de limiter les dépenses ou appels IA | SHOULD |
| AI-13 | Permettre l'annulation d'une opération IA en cours | SHOULD |
| AI-14 | Afficher les données transmises au fournisseur IA ou leur périmètre | SHOULD |

### 9.4 Opérations métier exposables

Le catalogue exact des outils MCP sera défini dans la spécification API, mais devra couvrir au minimum :

**Lecture et exploration**

- lister les projets autorisés ;
- consulter la structure d'un projet ;
- rechercher des objets ;
- lire une scène ;
- consulter une fiche ;
- récupérer les relations d'un objet ;
- consulter les événements d'une chronologie ;
- récupérer les versions nécessaires à une proposition.

**Préparation des modifications**

- créer une proposition ;
- ajouter une création d'objet ;
- ajouter une modification d'objet ;
- ajouter une modification de texte ;
- ajouter une relation ;
- proposer une suppression ;
- soumettre la proposition à validation ;
- consulter les erreurs et conflits.

**Analyse**

- rechercher les références d'un objet ;
- analyser les impacts potentiels ;
- consulter les contraintes temporelles ;
- obtenir le résultat des validations disponibles.

L'approbation et la fusion ne doivent pas être automatiquement accordées à un agent parce qu'il a lui-même créé la proposition.

### 9.5 Politique par défaut

La politique initiale est :

- lecture IA autorisée uniquement dans les périmètres explicitement accordés ;
- modification IA sous forme de proposition ;
- validation humaine avant fusion ;
- journalisation de toutes les opérations ;
- révocation possible des accès externes.

Les modes de fusion automatique pourront être ajoutés ultérieurement avec des conditions strictes.

### 9.6 Gestion du contexte

L'application doit sélectionner les informations pertinentes plutôt que transmettre systématiquement l'intégralité du projet au modèle.

Le mécanisme doit prendre en compte :

- la demande de l'utilisateur ;
- la scène ou l'objet courant ;
- les relations entre objets ;
- les droits d'accès ;
- la taille du contexte ;
- les coûts ;
- les sources des informations transmises.

Les résumés produits par l'IA doivent être identifiés comme tels et ne pas être confondus avec les données canoniques du projet.

### 9.7 Risques spécifiques

Le texte d'un manuscrit, les notes et les documents importés constituent des données potentiellement non fiables.

Ils peuvent contenir des instructions destinées à détourner un assistant IA.

**AI-SEC-01 — MUST :** les contenus narratifs ne doivent jamais être interprétés comme des instructions de sécurité ou d'autorisation.

**AI-SEC-02 — MUST :** les autorisations sont appliquées indépendamment du contenu des prompts.

**AI-SEC-03 — MUST :** les secrets et jetons ne doivent pas être inclus dans les contextes IA.

**AI-SEC-04 — MUST :** les appels externes sont soumis à des limites et à une journalisation adaptées.

**AI-SEC-05 — MUST :** les utilisateurs sont informés lorsque des contenus sont envoyés à un fournisseur IA tiers.

---

## 10. Propositions, revue et fusion

### 10.1 Objectif

Permettre de préparer un changement narratif cohérent, d'en examiner les conséquences, puis de l'appliquer de manière contrôlée.

Le mécanisme s'inspire des Pull Requests, sans imposer à l'utilisateur le vocabulaire ni la complexité de Git.

### 10.2 Cycle de vie

Une proposition suit les états suivants :

1. **Brouillon** : modifications en préparation.
2. **Soumise** : prête à être examinée.
3. **En revue** : commentaires et éventuelles demandes de correction.
4. **Approuvée** : conditions de validation satisfaites.
5. **Fusionnée** : changements appliqués au projet.
6. **Refusée** : proposition rejetée.
7. **Abandonnée** : proposition retirée.
8. **En conflit** : au moins une précondition de fusion n'est plus satisfaite.

Une proposition en conflit peut être révisée puis soumise à nouveau.

### 10.3 Exigences

| ID | Exigence | Priorité |
|---|---|---|
| PROP-01 | Créer une proposition contenant plusieurs opérations | MUST |
| PROP-02 | Associer une justification et un auteur à la proposition | MUST |
| PROP-03 | Conserver la version de base des objets modifiés | MUST |
| PROP-04 | Afficher les différences proposées avant fusion | MUST |
| PROP-05 | Vérifier les permissions à la création et à la fusion | MUST |
| PROP-06 | Vérifier les conflits de version avant fusion | MUST |
| PROP-07 | Appliquer de manière atomique les modifications interdépendantes | MUST |
| PROP-08 | Conserver un historique des validations et refus | MUST |
| PROP-09 | Permettre les commentaires de revue | MUST |
| PROP-10 | Permettre la révision d'une proposition | SHOULD |
| PROP-11 | Détecter les impacts potentiels sur les objets liés | SHOULD |
| PROP-12 | Permettre l'approbation partielle d'une proposition | V1 — SHOULD |
| PROP-13 | Permettre des variantes narratives concurrentes | V2+ |
| PROP-14 | Configurer des règles de fusion automatique | V2+ |

### 10.4 Règle d'atomicité

Une proposition qui modifie plusieurs objets interdépendants doit être appliquée intégralement ou pas du tout.

Exemple : si une proposition ajoute un événement et référence cet événement dans trois scènes, l'événement ne doit pas être créé si la modification de l'une des scènes échoue.

L'approbation partielle future devra découper la proposition en sous-ensembles cohérents, puis revérifier toutes les contraintes.

### 10.5 Contrôle des conflits

Chaque opération de modification doit préciser la version attendue de l'objet cible.

Si l'objet a changé depuis la préparation de la proposition :

- la fusion est interrompue pour les éléments concernés ;
- le conflit est signalé ;
- aucune modification incompatible n'est écrasée silencieusement ;
- l'utilisateur peut réexaminer ou régénérer la proposition.

### 10.6 Réversibilité

Les modifications fusionnées restent traçables.

Le MVP doit permettre de restaurer une version antérieure d'un objet ou d'une scène.

La restauration coordonnée d'un ensemble complexe de modifications peut être progressive, mais aucune opération ne doit rendre l'historique inaccessible.

---

## 11. Cohérence narrative et modèle de connaissance

### 11.1 Trois dimensions à distinguer

La plateforme doit pouvoir représenter trois catégories d'information.

**Vérité de l'univers**

Ce qui est considéré comme vrai dans le monde fictif, à une période donnée et dans une version donnée du projet.

**Connaissance des personnages**

Ce qu'un personnage sait, croit, ignore ou pense savoir à un moment de l'histoire.

**Connaissance du lecteur**

Ce que le texte a effectivement révélé au lecteur jusqu'à une scène donnée.

Ces catégories ne sont pas interchangeables.

### 11.2 Exemple

Dans l'univers du roman, le personnage A a assassiné le personnage B.

Au chapitre 4 :

- l'auteur connaît l'identité du meurtrier ;
- le personnage C soupçonne à tort le personnage D ;
- le lecteur ne connaît pas encore le meurtrier ;
- le personnage A ment sur son emploi du temps.

Le système doit pouvoir conserver ces distinctions.

Une vérification de cohérence ne doit pas considérer automatiquement le mensonge du personnage A comme une erreur du manuscrit.

### 11.3 Périmètre par version

**MVP**

- objets narratifs ;
- événements ordonnés ;
- liens entre scènes et événements ;
- références croisées ;
- détection des liens invalides ;
- vérification de quelques contraintes déterministes.

**V1**

- faits narratifs structurés ;
- statut canonique ou hypothétique ;
- périodes de validité ;
- savoirs et croyances des personnages ;
- révélations au lecteur ;
- contraintes temporelles ;
- diagnostic d'incohérences avec références.

**V2+**

- variantes narratives ;
- narrateurs non fiables ;
- retcons complexes ;
- analyse approfondie de la circulation de l'information ;
- simulation de conséquences narratives.

### 11.4 Temps narratif

Le système doit distinguer :

- l'ordre de lecture des scènes ;
- l'ordre chronologique des événements dans l'univers ;
- la durée d'un événement ;
- les relations temporelles entre événements.

Le temps narratif peut être incomplet, relatif ou reposer sur un calendrier fictif.

Il ne faut donc pas imposer à tous les événements une date grégorienne complète.

### 11.5 Règles de validation

Les validations déterministes doivent être séparées des jugements littéraires.

Exemples de contrôles déterministes :

- référence vers un objet inexistant ;
- événement antérieur à la naissance d'un personnage, lorsque les dates sont connues ;
- déplacement physiquement impossible au regard de contraintes explicites ;
- deux événements incompatibles impliquant le même personnage ;
- violation d'une règle d'univers formalisée.

Exemples d'analyses subjectives :

- rythme insuffisant ;
- dialogue peu naturel ;
- personnage peu attachant ;
- twist prévisible ;
- tension dramatique faible.

Une analyse subjective doit être présentée comme une appréciation argumentée, non comme une vérité mesurée.

---

## 12. Comité de lecture IA

### 12.1 Objectif

Fournir une assistance critique structurée, contextualisée et exploitable.

Le comité de lecture ne doit pas se limiter à reformuler des conseils génériques.

Il doit pouvoir identifier les passages concernés, expliquer son diagnostic et proposer des pistes de correction.

### 12.2 Axes d'analyse envisagés

- cohérence des personnages ;
- continuité des événements ;
- cohérence temporelle ;
- cohérence du point de vue ;
- rythme ;
- tension dramatique ;
- progression des arcs ;
- répétitions ;
- homogénéité stylistique ;
- lisibilité ;
- dialogues ;
- indices et préparation des révélations ;
- contradictions avec les règles de l'univers ;
- écarts de style entre contributeurs.

### 12.3 Structure d'un diagnostic

Chaque diagnostic devrait contenir :

- un identifiant ;
- un type d'analyse ;
- une description ;
- les scènes ou objets concernés ;
- des références précises aux passages ;
- un niveau de gravité ou d'importance ;
- un niveau de confiance, lorsque pertinent ;
- une distinction entre constat vérifiable et appréciation subjective ;
- une ou plusieurs suggestions ;
- un statut de traitement.

### 12.4 Exigences V1

**CRIT-01 — MUST :** lancer une analyse sur une scène, un chapitre ou un manuscrit.

**CRIT-02 — MUST :** conserver les références aux éléments analysés.

**CRIT-03 — MUST :** distinguer observations objectives et interprétations.

**CRIT-04 — MUST :** présenter des suggestions sans les appliquer automatiquement.

**CRIT-05 — MUST :** convertir une suggestion en proposition de modification.

**CRIT-06 — SHOULD :** permettre de marquer un diagnostic comme accepté, ignoré ou résolu.

**CRIT-07 — SHOULD :** comparer les résultats avant et après correction.

**CRIT-08 — SHOULD :** éviter de répéter indéfiniment des critiques explicitement écartées par l'auteur.

---

## 13. Parcours utilisateur de référence

### 13.1 Création d'un projet individuel

1. L'utilisateur se connecte.
2. Il crée un projet privé.
3. Il choisit un modèle minimal ou un ensemble de modules.
4. Il crée un manuscrit.
5. Il ajoute des chapitres et scènes.
6. Il crée ses premières fiches personnages.
7. Il associe des personnages à une scène.
8. Il rédige son texte.
9. Il retrouve son travail après fermeture et réouverture de l'application.

**Résultat attendu :** le projet est immédiatement exploitable sans configuration technique.

### 13.2 Collaboration sur un roman

1. Le propriétaire crée un projet.
2. Il invite un second auteur et un relecteur.
3. Le second auteur modifie une scène autorisée.
4. Le relecteur ajoute un commentaire.
5. Un auteur soumet une proposition affectant plusieurs scènes.
6. Le responsable consulte les différences et approuve.
7. La proposition est fusionnée.
8. Chaque contribution reste attribuable.

**Résultat attendu :** la collaboration ne compromet ni les permissions ni l'historique.

### 13.3 Modification narrative assistée par IA

Demande utilisateur :

« Ce serait intéressant que le personnage principal tombe malade à ce moment de l'histoire. »

Comportement attendu :

1. L'IA identifie le personnage et la période concernés.
2. Elle recherche les scènes, événements et informations pertinentes.
3. Elle peut poser des questions si la maladie ou ses conséquences sont trop ambiguës.
4. Elle présente des options narratives.
5. L'utilisateur choisit une option.
6. L'IA prépare une proposition pouvant modifier une fiche personnage, ajouter un événement et suggérer des adaptations de scènes.
7. Le système vérifie les permissions, références et versions.
8. L'utilisateur examine les différences.
9. La proposition est approuvée puis fusionnée.
10. Le projet présente le nouvel état cohérent.

**Résultat attendu :** la modification ne se limite pas à une réponse textuelle dans le chat.

### 13.4 Analyse d'une incohérence temporelle

Demande utilisateur :

« Le meurtrier n'a pas assez de temps entre ces deux événements. »

Comportement attendu :

1. L'assistant identifie les événements concernés.
2. Il consulte les contraintes temporelles connues.
3. Il distingue les données établies des hypothèses.
4. Il explique la contradiction si elle peut être démontrée.
5. Il propose plusieurs résolutions possibles.
6. Il indique les objets et scènes impactés.
7. Il prépare, sur demande, une proposition de modification.

**Résultat attendu :** une contrainte déterministe est vérifiée par le système lorsque les données le permettent ; l'IA n'invente pas des durées manquantes.

### 13.5 Utilisation depuis un client MCP

1. L'utilisateur configure un accès MCP au projet.
2. Il accorde les permissions nécessaires.
3. Le client externe découvre les opérations disponibles.
4. Il recherche des scènes et des objets.
5. Il prépare une proposition.
6. La proposition apparaît dans l'interface web.
7. L'utilisateur la valide ou la refuse.
8. L'accès MCP peut être révoqué à tout moment.

**Résultat attendu :** le client externe ne bénéficie d'aucun privilège supérieur à ceux qui lui ont été délégués.

---

## 14. Interface et expérience utilisateur

### 14.1 Principes

L'interface doit rester centrée sur l'écriture.

Les outils avancés doivent être accessibles sans encombrer systématiquement l'espace de rédaction.

L'utilisateur doit pouvoir travailler sans activer l'IA.

### 14.2 Zones fonctionnelles principales

**Tableau de bord**

Liste des projets, accès récents, activités et invitations.

**Espace projet**

Navigation dans les manuscrits, objets narratifs, modules et paramètres.

**Éditeur**

Zone principale de rédaction, plan du manuscrit, métadonnées et accès au contexte.

**Référentiel**

Fiches, relations, recherche et navigation transversale.

**Chronologie**

Vue des événements et de leurs liens avec les scènes.

**Propositions**

Liste des changements en cours, différences, commentaires, validations et historique.

**Assistant IA**

Conversation contextualisée, sources consultées, propositions générées et coûts éventuels.

### 14.3 Exigences UX

**UX-01 — MUST :** permettre d'accéder à une scène depuis le tableau de bord du projet avec un nombre raisonnable d'actions.

**UX-02 — MUST :** distinguer visuellement les modifications enregistrées, en cours d'enregistrement et en erreur.

**UX-03 — MUST :** ne jamais masquer un échec d'enregistrement.

**UX-04 — MUST :** permettre de retrouver facilement les références d'un personnage ou d'un lieu.

**UX-05 — MUST :** rendre les opérations destructives explicites et confirmables.

**UX-06 — MUST :** proposer une interface utilisable au clavier pour les parcours essentiels.

**UX-07 — SHOULD :** proposer un mode clair et un mode sombre.

**UX-08 — SHOULD :** permettre de réduire les panneaux périphériques pendant la rédaction.

**UX-09 — SHOULD :** permettre une personnalisation raisonnable des vues et des raccourcis.

**UX-10 — SHOULD :** prévoir une architecture internationalisable, avec le français comme langue initiale possible.

---

## 15. Exigences de sécurité et de confidentialité

La plateforme héberge des œuvres potentiellement inédites et confidentielles.

La confidentialité et l'intégrité des contenus constituent des exigences centrales du produit.

### 15.1 Authentification et autorisation

**SEC-01 — MUST :** authentifier les utilisateurs avant tout accès privé.

**SEC-02 — MUST :** appliquer les permissions côté serveur sur chaque opération.

**SEC-03 — MUST :** empêcher tout accès interprojets non autorisé.

**SEC-04 — MUST :** vérifier également les permissions lors de la recherche, de l'export, des traitements IA et des accès MCP.

**SEC-05 — MUST :** permettre la révocation des sessions et accès externes.

**SEC-06 — SHOULD :** proposer l'authentification multifacteur.

### 15.2 Protection des données

**SEC-07 — MUST :** chiffrer les communications réseau.

**SEC-08 — MUST :** protéger les secrets et clés API au repos.

**SEC-09 — MUST :** exclure les secrets des journaux applicatifs.

**SEC-10 — MUST :** limiter les données personnelles et contenus narratifs collectés dans les journaux.

**SEC-11 — MUST :** prévoir des sauvegardes et vérifier leur restauration.

**SEC-12 — MUST :** assurer la traçabilité des modifications importantes.

**SEC-13 — MUST :** protéger l'éditeur et les rendus contre les contenus actifs malveillants.

**SEC-14 — MUST :** prévoir des limites d'usage et de débit sur les API exposées.

### 15.3 IA et fournisseurs externes

L'utilisateur doit savoir si son contenu est transmis à un fournisseur IA externe.

Les politiques de conservation et d'utilisation des données dépendent du fournisseur et des conditions contractuelles effectivement applicables.

Le produit ne doit pas promettre une absence d'entraînement sur les données sans garantie vérifiable.

Les clés API doivent pouvoir être remplacées ou révoquées.

### 15.4 Suppression et conservation

Le système doit définir explicitement :

- les modalités d'archivage ;
- la suppression logique ;
- la suppression définitive ;
- la durée de conservation des sauvegardes ;
- le traitement des données d'audit ;
- les modalités d'export avant suppression.

Les paramètres définitifs de conservation et les obligations réglementaires seront précisés avant la mise en production.

---

## 16. Exigences non fonctionnelles

Les valeurs ci-dessous sont des **objectifs initiaux de conception et de validation**, à confirmer par les premiers essais de charge.

| ID | Domaine | Exigence cible |
|---|---|---|
| NFR-01 | Fiabilité | Aucun enregistrement confirmé ne doit être perdu silencieusement |
| NFR-02 | Performance | Réponse p95 inférieure à 500 ms pour les lectures métier simples, hors IA |
| NFR-03 | Recherche | Réponse p95 inférieure à 2 s sur un projet de référence de 10 000 objets, hors génération IA |
| NFR-04 | Édition | Retour visible d'enregistrement ou d'erreur dans un délai cible de 2 s en conditions normales |
| NFR-05 | Résilience | Sauvegardes automatisées et test de restauration documenté |
| NFR-06 | Disponibilité | Objectif initial de 99,5 % après stabilisation de la version de production |
| NFR-07 | Portabilité | Export complet des données métier essentielles dans des formats documentés |
| NFR-08 | Accessibilité | Viser WCAG 2.2 AA pour les parcours principaux |
| NFR-09 | Observabilité | Traces techniques et métriques sans exposition inutile des manuscrits |
| NFR-10 | Maintenabilité | Tests automatisés des règles métier et des permissions |
| NFR-11 | Évolutivité | Ajout de nouveaux types d'objets et modules sans refonte du socle |
| NFR-12 | Interopérabilité | API métier documentée et intégration MCP versionnée |

Les tests de performance devront définir précisément leur environnement, leur jeu de données et leurs conditions de mesure.

### 16.1 Sauvegardes

Pour le MVP, les objectifs provisoires sont :

- perte maximale de données visée après incident majeur : 24 heures ;
- délai de restauration visé : 24 heures.

Ces valeurs sont des hypothèses de départ, pas des garanties de service. Elles devront être réévaluées avant l'ouverture à des utilisateurs réels.

---

## 17. Principes de conception à préserver

Ces principes doivent guider les spécifications techniques.

### 17.1 Une seule logique métier

L'interface web, le chat IA et le serveur MCP doivent utiliser les mêmes services métier et contrôles d'autorisation.

Il ne doit pas exister un chemin d'écriture privilégié réservé à l'IA.

### 17.2 Identifiants stables

Les objets doivent conserver leur identité lorsqu'ils sont renommés, déplacés ou réorganisés.

Les relations doivent pointer vers des identifiants, et non dépendre uniquement des noms affichés.

### 17.3 Contrôle de concurrence

Toute modification doit éviter l'écrasement silencieux d'une version plus récente.

Les stratégies techniques pourront différer entre texte collaboratif et objets métier structurés.

### 17.4 Historique indépendant de l'interface

Le fait qu'un utilisateur dispose d'un mode d'édition directe ne supprime pas l'obligation de conserver l'historique des modifications.

### 17.5 Modules sans dépendance circulaire incontrôlée

Les modules spécialisés doivent utiliser des capacités transversales communes et déclarer leurs dépendances.

### 17.6 Séparation du texte et du référentiel

Le texte littéraire ne doit pas être transformé automatiquement en une base de faits supposés vrais.

Toute extraction de faits par IA doit être identifiable, vérifiable et validable.

### 17.7 Aucune magie implicite

L'utilisateur doit pouvoir distinguer :

- une donnée qu'il a saisie ;
- une donnée calculée ;
- une hypothèse ;
- une proposition IA ;
- une modification effectivement appliquée.

---

## 18. Stratégie de livraison

### 18.1 MVP — Socle utilisable

**Objectif :** permettre de créer un projet, écrire, structurer son univers, collaborer de manière asynchrone et utiliser l'IA pour préparer des modifications contrôlées.

Le MVP comprend :

1. comptes et projets ;
2. rôles et invitations ;
3. manuscrits, chapitres et scènes ;
4. éditeur avec enregistrement automatique ;
5. fiches personnages, lieux et événements ;
6. relations et références croisées ;
7. chronologie simple ;
8. recherche ;
9. commentaires ;
10. historique et restauration élémentaire ;
11. propositions multi-objets ;
12. validation et fusion atomique ;
13. assistant IA intégré ;
14. accès MCP contrôlé ;
15. export des contenus et données ;
16. journalisation et protections de sécurité de base.

Le MVP ne doit pas être considéré comme terminé si l'IA peut seulement répondre dans un chat sans produire de propositions exploitables.

### 18.2 V1 — Cohérence et collaboration avancées

**Objectif :** faire évoluer le produit vers un environnement de création littéraire réellement interconnecté.

Fonctionnalités :

- édition simultanée en temps réel ;
- gestion avancée des faits et du canon ;
- connaissances par personnage ;
- informations connues du lecteur ;
- contraintes temporelles avancées ;
- arcs et intrigues ;
- encyclopédie ;
- factions, objets et bestiaire ;
- comité de lecture IA ;
- recherche sémantique ;
- analyses d'impact améliorées ;
- formats d'export éditoriaux ;
- import de projets ;
- vues de travail personnalisables.

### 18.3 V2+ — Studio narratif avancé

**Objectif :** permettre la gestion d'univers complexes et de variantes narratives.

Fonctionnalités candidates :

- branches narratives et scénarios alternatifs ;
- retcons complexes ;
- cartographie interactive ;
- généalogies ;
- systèmes de magie et de technologie ;
- enquêtes, indices et révélations ;
- simulations de contraintes narratives ;
- collaboration IA multi-agents ;
- règles d'approbation et de fusion configurables ;
- extensions et intégrations tierces avancées ;
- publication et préparation éditoriale approfondies.

Le contenu de V2+ doit rester ajustable selon les usages constatés.

---

## 19. Ordre recommandé des lots de développement

Les lots ci-dessous décrivent un ordre logique, sans imposer de durée.

### Lot 0 — Fondations

- initialisation du dépôt ;
- architecture applicative ;
- environnement de développement ;
- tests et intégration continue ;
- authentification ;
- modèle de projets ;
- permissions ;
- journalisation de base.

**Condition de sortie :** un utilisateur peut créer un projet privé et les tests prouvent qu'un autre utilisateur ne peut pas y accéder.

### Lot 1 — Écriture

- manuscrits ;
- chapitres ;
- scènes ;
- éditeur ;
- sauvegarde ;
- réorganisation ;
- historique ;
- export textuel.

**Condition de sortie :** un utilisateur peut rédiger un manuscrit, quitter l'application, revenir et retrouver l'intégralité de son travail.

### Lot 2 — Référentiel narratif

- personnages ;
- lieux ;
- événements ;
- relations ;
- références croisées ;
- recherche ;
- chronologie simple.

**Condition de sortie :** une scène peut référencer des objets stables, et l'utilisateur peut retrouver toutes les scènes liées à un personnage.

### Lot 3 — Collaboration et propositions

- invitations ;
- rôles ;
- commentaires ;
- propositions ;
- différences ;
- validation ;
- conflits ;
- fusion atomique.

**Condition de sortie :** deux utilisateurs peuvent travailler sur un projet sans écrasement silencieux, et une proposition multi-objets peut être revue puis fusionnée.

### Lot 4 — IA intégrée et MCP

- configuration des fournisseurs ;
- contexte IA ;
- conversation intégrée ;
- outils métier ;
- serveur MCP ;
- autorisations déléguées ;
- propositions IA ;
- traçabilité.

**Condition de sortie :** une IA externe ou intégrée peut lire les données autorisées et soumettre une proposition, mais ne peut pas contourner la validation.

### Lot 5 — Consolidation MVP

- tests de sécurité ;
- tests de charge ;
- sauvegardes et restauration ;
- export complet ;
- accessibilité ;
- documentation ;
- correction des anomalies bloquantes.

**Condition de sortie :** le MVP est exploitable de bout en bout avec un jeu de données représentatif.

---

## 20. Critères d'acceptation transversaux

Les scénarios suivants doivent être couverts par des tests automatisés lorsque cela est pertinent.

### AC-01 — Isolation des projets

**Étant donné** deux utilisateurs sans projet commun,  
**lorsque** le second tente d'accéder à une scène du premier par son identifiant,  
**alors** l'accès est refusé, y compris via API et MCP.

### AC-02 — Persistance

**Étant donné** une scène contenant un texte modifié,  
**lorsque** l'application confirme l'enregistrement,  
**alors** le texte reste disponible après reconnexion et redémarrage du service.

### AC-03 — Références stables

**Étant donné** un personnage lié à plusieurs scènes,  
**lorsque** le personnage est renommé,  
**alors** les liens restent valides.

### AC-04 — Conflit de modification

**Étant donné** une proposition préparée sur une version ancienne d'une fiche,  
**lorsque** une autre modification incompatible est appliquée avant sa fusion,  
**alors** la proposition ne peut pas écraser silencieusement la version récente.

### AC-05 — Atomicité

**Étant donné** une proposition contenant plusieurs modifications interdépendantes,  
**lorsque** une opération échoue lors de la validation finale,  
**alors** aucune partie de la proposition n'est appliquée.

### AC-06 — IA sans permission d'écriture

**Étant donné** un client MCP autorisé uniquement à lire,  
**lorsqu'il** tente de créer ou modifier un objet,  
**alors** l'opération est refusée par le serveur.

### AC-07 — IA avec permission de proposition

**Étant donné** un client MCP autorisé à soumettre des propositions,  
**lorsqu'il** propose une modification de scène,  
**alors** cette modification reste non appliquée jusqu'à validation autorisée.

### AC-08 — Traçabilité

**Étant donné** une proposition IA fusionnée,  
**lorsqu'un** utilisateur consulte son historique,  
**alors** il peut identifier l'initiateur, l'agent utilisé, les objets concernés, les validations et le moment de la fusion.

### AC-09 — Désactivation d'un module

**Étant donné** un module contenant des données,  
**lorsqu'il** est désactivé,  
**alors** ses données sont conservées et aucune relation n'est supprimée silencieusement.

### AC-10 — Export

**Étant donné** un projet contenant un manuscrit, des personnages et des relations,  
**lorsqu'un** utilisateur autorisé demande un export complet,  
**alors** l'archive contient les textes, les objets et les références nécessaires à leur interprétation.

### AC-11 — Confidentialité des recherches

**Étant donné** un utilisateur ne disposant pas d'accès à un projet,  
**lorsqu'il** effectue une recherche,  
**alors** aucun titre, extrait, résumé ou métadonnée privée de ce projet n'apparaît.

### AC-12 — Défaillance d'un fournisseur IA

**Étant donné** un fournisseur IA indisponible,  
**lorsqu'une** demande échoue,  
**alors** le projet et les modifications enregistrées restent intacts, et l'erreur est signalée à l'utilisateur.

---

## 21. Mesure du succès produit

Les indicateurs doivent mesurer l'utilité réelle du produit.

### 21.1 Adoption

- nombre de projets effectivement utilisés ;
- proportion de projets ayant au moins un manuscrit et une scène ;
- rétention des auteurs actifs ;
- fréquence de retour à un projet.

### 21.2 Usage de l'écriture

- sessions de rédaction ;
- scènes modifiées ;
- manuscrits poursuivis dans le temps ;
- utilisation des références entre scènes et objets.

### 21.3 Collaboration

- projets comportant plusieurs contributeurs actifs ;
- commentaires traités ;
- propositions examinées ;
- taux de propositions fusionnées ou refusées.

### 21.4 IA

- propositions IA réellement examinées ;
- taux de propositions acceptées après revue ;
- taux de corrections nécessaires ;
- coûts par opération utile ;
- incidents de permissions ou de modifications non désirées.

Le nombre de tokens consommés ou de messages envoyés à l'IA n'est pas, à lui seul, un indicateur de valeur.

---

## 22. Risques majeurs

| Risque | Conséquence | Réponse recommandée |
|---|---|---|
| Périmètre fonctionnel excessif | MVP interminable | Développement par lots avec critères de sortie |
| Modèle narratif trop rigide | Difficulté à gérer différents genres | Socle générique et modules spécialisés |
| Modèle trop abstrait | Complexité excessive pour les auteurs | Parcours simples et modèles de projet |
| IA non fiable | Modifications incohérentes | Propositions, références, validation et audit |
| Confusion entre canon et hypothèses | Diagnostics incorrects | Modèle explicite de statut des faits |
| Concurrence mal gérée | Perte ou écrasement de texte | Versionnement et contrôles de conflits |
| Fuite de manuscrits | Perte de confiance majeure | Isolation des projets et sécurité de bout en bout |
| Dépendance à un fournisseur IA | Coûts et indisponibilité | Abstraction des fournisseurs |
| Coûts IA incontrôlés | Produit difficile à exploiter | Budgets, limites et visibilité |
| Complexité des modules | Maintenance coûteuse | Contrats communs et dépendances explicites |
| Trop de diagnostics littéraires | Rejet de l'outil par les auteurs | Analyses ciblées, justifiées et désactivables |

---

## 23. Décisions produit provisoires

Les décisions suivantes sont recommandées pour démarrer.

**DEC-01 — Projet privé par défaut.**  
Aucun partage implicite.

**DEC-02 — Projet comme frontière de sécurité.**  
Toutes les opérations sont contextualisées par projet.

**DEC-03 — Rédaction structurée en scènes.**  
Les scènes constituent les unités principales de rédaction et de liaison narrative.

**DEC-04 — Objets identifiés et reliés.**  
Les noms affichés ne servent pas d'identifiants techniques.

**DEC-05 — IA soumise à la logique métier.**  
Aucune écriture directe en base par un assistant.

**DEC-06 — Proposition obligatoire pour les modifications IA dans le MVP.**  
La fusion automatique est reportée.

**DEC-07 — Historique systématique.**  
Les éditions directes restent versionnées.

**DEC-08 — Collaboration asynchrone au MVP.**  
Le temps réel arrive en V1.

**DEC-09 — Modularité fonctionnelle avant extensibilité exécutable.**  
Ne pas développer prématurément un système de plugins tiers.

**DEC-10 — Portabilité des données.**  
Un export documenté fait partie du MVP.

**DEC-11 — Séparation entre règles déterministes et critiques IA.**  
Les jugements littéraires ne sont pas présentés comme des erreurs factuelles.

**DEC-12 — Compatibilité avec plusieurs fournisseurs IA.**  
Le produit ne doit pas dépendre structurellement d'un fournisseur unique.

---

## 24. Questions ouvertes à arbitrer

Les points suivants nécessitent une décision explicite avant ou pendant la conception.

| ID | Question | Proposition provisoire |
|---|---|---|
| Q-01 | SaaS uniquement ou auto-hébergement ? | Concevoir un déploiement web standard sans promettre l'auto-hébergement dès le MVP |
| Q-02 | Langue initiale de l'interface ? | Français, avec internationalisation prévue |
| Q-03 | Périmètre des permissions ? | Rôles par projet au MVP ; permissions fines ultérieurement |
| Q-04 | Propriété des projets collectifs ? | Propriétaire explicite et règles de transfert à définir |
| Q-05 | Fournisseurs IA prioritaires ? | Sélection restreinte au MVP, abstraction commune |
| Q-06 | Gestion des clés IA ? | Clés personnelles au MVP, clés de projet ultérieurement |
| Q-07 | Format interne du manuscrit ? | À décider après prototype d'éditeur et d'export |
| Q-08 | Conservation des versions et sauvegardes ? | Politique documentée avant production |
| Q-09 | Quotas et tarification ? | Hors MVP fonctionnel, mais prévoir les points de contrôle |
| Q-10 | Accès invité sans compte ? | Non au MVP |
| Q-11 | Mode hors ligne ? | Non au MVP |
| Q-12 | Application mobile native ? | Non ; interface web adaptée autant que possible |
| Q-13 | Bibliothèque de modèles de genres ? | Quelques modèles simples après validation du socle |
| Q-14 | Gestion de séries de livres partageant un univers ? | V1 ou V2, à étudier explicitement |
| Q-15 | Politique de publication des données vers les IA ? | Consentement et périmètre explicites |

Les questions ouvertes ne doivent pas être résolues silencieusement par Codex lorsqu'elles affectent durablement le modèle métier.

---

## 25. Attentes envers la phase de conception technique

Après validation du PRD, les documents suivants devront être produits.

### 25.1 Architecture

`docs/ARCHITECTURE.md`

Décrire :

- composants logiques ;
- flux entre interface, API, stockage et services IA ;
- séparation des responsabilités ;
- stratégie de déploiement ;
- sécurité ;
- sauvegardes ;
- observabilité.

### 25.2 Modèle de domaine

`docs/DOMAIN-MODEL.md`

Décrire :

- entités ;
- propriétés ;
- relations ;
- cardinalités ;
- invariants ;
- versions ;
- événements métier ;
- règles de suppression ;
- dépendances entre modules.

### 25.3 Contrats API et MCP

`docs/API-CONTRACTS.md`

Décrire :

- opérations métier ;
- authentification ;
- autorisations ;
- schémas d'entrée et de sortie ;
- erreurs ;
- idempotence ;
- contrôle de concurrence ;
- outils MCP ;
- versionnement des contrats.

### 25.4 Sécurité

`docs/SECURITY-MODEL.md`

Décrire :

- modèle de menaces ;
- frontières de confiance ;
- isolation des projets ;
- gestion des secrets ;
- permissions IA ;
- audit ;
- protections contre les injections de prompts ;
- protection des manuscrits.

### 25.5 Plan de réalisation

`docs/IMPLEMENTATION-PLAN.md`

Décrire :

- lots et dépendances ;
- décisions techniques ;
- migrations ;
- tests ;
- critères de sortie ;
- ordre de livraison ;
- risques et points bloquants.

### 25.6 Registre des décisions

`docs/adr/`

Les décisions techniques ou fonctionnelles structurantes doivent faire l'objet de documents ADR numérotés, avec contexte, options, décision et conséquences.

---

## 26. Consignes pour l'exploitation des recherches existantes

Avant de figer l'architecture ou de démarrer le développement, il faudra :

1. lire intégralement `deep-research-analyse-fonction.md` ;
2. lire intégralement `deep-research-modele-fonctionnel.md` ;
3. comparer leurs recommandations avec les exigences du présent PRD ;
4. relever les fonctionnalités importantes manquantes ;
5. identifier les contradictions ;
6. distinguer les compléments utiles au MVP des fonctionnalités à reporter ;
7. proposer des modifications du PRD lorsqu'elles sont justifiées.

Le résultat devra être consigné dans :

`docs/RESEARCH-TRACEABILITY.md`

Ce document devra relier les fonctionnalités retenues aux recherches et aux identifiants d'exigences du PRD.

Il ne s'agit pas de reproduire toutes les fonctionnalités des produits étudiés. Chaque fonctionnalité retenue doit contribuer à un besoin utilisateur identifiable.

---

## 27. Définition de terminé du MVP

Le MVP sera considéré comme fonctionnellement terminé lorsque :

- un utilisateur peut créer et gérer un projet privé ;
- plusieurs membres peuvent participer à un projet selon leurs rôles ;
- un manuscrit complet peut être structuré et rédigé ;
- les textes sont enregistrés et récupérables ;
- les personnages, lieux et événements peuvent être gérés et reliés ;
- les références restent valides après renommage ou déplacement ;
- les recherches respectent les permissions ;
- les commentaires et propositions sont utilisables ;
- une proposition multi-objets peut être validée et fusionnée sans application partielle ;
- les conflits de versions sont détectés ;
- un assistant IA intégré peut consulter le contexte autorisé et proposer des modifications ;
- un client MCP externe peut effectuer les opérations autorisées ;
- aucun client IA ne peut contourner les permissions ou la validation ;
- les données peuvent être exportées ;
- les sauvegardes et restaurations ont été testées ;
- les scénarios d'acceptation critiques sont automatisés ;
- les principaux risques de sécurité ont été examinés ;
- les fonctionnalités sont documentées.

Le MVP n'est pas terminé parce que toutes les pages prévues existent. Il est terminé lorsque les parcours fondamentaux fonctionnent réellement de bout en bout.

---

## 28. Conclusion

Le produit doit être conçu comme un **environnement de création littéraire structuré, collaboratif et assisté par IA**.

Ses fondations les plus importantes sont :

1. un modèle de projet clair ;
2. un manuscrit structuré et fiable ;
3. des objets narratifs reliés ;
4. des permissions robustes ;
5. un historique exploitable ;
6. des propositions de modification multi-objets ;
7. une API métier commune aux humains et aux IA ;
8. une modularité permettant d'enrichir le produit sans rendre les usages simples inutilement complexes.

Le principal risque est de chercher à développer trop tôt l'ensemble des capacités avancées.

La priorité est de construire un **socle métier fiable et extensible**, puis de l'enrichir par des modules narratifs et des outils d'analyse de plus en plus spécialisés.

**Fin du PRD — version 0.1**
