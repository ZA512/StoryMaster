# ADR-0013 — Moteur de propositions et fusion atomique

**Statut :** principes acceptés et Lot 4 reçu techniquement avec réserves par instruction Lot 5, CI 9c2df0b vérifiée verte. **Date :** 31 octobre 2026. **Références :** [ADR-0003](0003-propositions-transactionnelles.md), [décisions humaines](../HUMAN-DECISIONS.md), [plan](../IMPLEMENTATION-PLAN.md).

## Décision et invariants

Proposition = intention ; seul merge humain owner/admin modifie le canon. Révisions de contenu immuables (titre, justification, opérations, dépendances, version de politique) et hash canonique, distinctes de stateVersion. Avis humains immuables liés à cette révision/hash et à la version d’appartenance de l’approbateur ; validité calculée sur droits actuels, aucune approbation ancienne restaurée après retrait/réactivation. Auto-approbation du créateur uniquement owner humain d’un projet encore individuel ; au Lot 4 aucun agent activé ; extension integrated_ai sous capacité serveur au Lot 5 décrite par [ADR-0014](0014-assistant-integre-et-executions-bornees.md).

Validateurs canoniques extraits des services existants et partagés par commandes directes et projection finale. Aucun second langage de patch. Neuf opérations typées du catalogue conservées ; refs temporaires résolues uniquement dans les champs typés et après création. Opérations complémentaires sur une même scène partagent la base et avancent une seule révision ; doublon du même kind/cible refusé. Mutations de relations/references préparées dans un état final, retrait des liens remplacés avant ajout pour respecter les uniques PostgreSQL sans état intermédiaire visible.

Prévisualisation en mémoire, sans écriture ni ID réservé. Project partagé, proposition partagée, puis scènes ciblées partagées triées : les graphes/droits/structures sont figés par Project et les textes lus par les verrous Scene. Ce protocole remplace la suggestion initiale REPEATABLE READ : il garantit un état pertinent cohérent tout en relisant les droits après la barrière, sans réutiliser un snapshot d’autorisation antérieur à une révocation. Pas d’upgrade ; merge Project exclusif → proposition → scènes triées → idempotence → ressources/snapshots/ChangeSet/audit. Temps sous verrou mesuré, risque R-CONT-01 conservé.

Une fusion revalide l’auteur, l’approbateur et le fusionneur, toutes les bases explicites et dépendances de modules/parents/extrémités, puis le graphe final. Résultat durable unique par proposition, indépendamment de l’expiration des clés d’idempotence ordinaires. Après réponse perdue : même mapping et ChangeSet, aucune seconde application. Les événements historiques par ressource des lots précédents restent utilisés ; un ChangeSet de proposition les regroupe, sans effacer les anciens formats de snapshots. Aucun effet externe à livrer dans ce lot : index lexical transactionnel, donc aucune outbox fictive.

## Alignements et limites

Le statut de scène proposé suit les statuts configurables du manuscrit déjà livrés au Lot 1 ; l’ancien enum draft/revising/final du schéma documentaire est remplacé par une chaîne bornée contrôlée par le validateur commun. Position de move_scene = rang entier positif dans le chapitre, explicite. Ce sont des alignements avec le canon existant, sans modification de priorité ni d’exigence PRD. Archive conserve les liens descriptifs existants comme l’édition directe ; toute nouvelle référence incompatible ou cible archivée est refusée.

Conflit : rollback intégral, effectiveStatus conflicted calculé dans l’erreur ; mark_conflicted explicite séparé. Aucun rebase automatique. Rejected/withdrawn/merged terminaux ; nouvelle intention par duplication explicite. Les adaptateurs IA/MCP et leurs délégations restent absents : leur absence n’est jamais remplacée par actor.type autodéclaré ou une fausse identité.

## Critères d'acceptation du document

Preuves PG de non-mutation avant merge, révisions/avis immuables, rôles, rollback et rejeu durable ; cas B-06/B-07 avec barrières ; navigateur multi-utilisateur, données préexistantes conservées et arrêt avant Lot 5. Mesures locales distinctes de qualification publique et réception humaine.


La prévisualisation signale les impacts structurels potentiels des fiches modifiées : relations, scènes et fiches liées avant/après à relire, sans diagnostic sémantique ni écriture supplémentaire. Ce contrôle soutient PROP-11 et ne prétend pas résoudre automatiquement la cohérence narrative.
