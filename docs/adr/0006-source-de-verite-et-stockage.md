# ADR-0006 — Source de vérité et frontières du stockage

**Statut :** Proposée
**Date :** 2026-10-30
**Portée :** conception MVP, aucune implémentation.
**Références :** [PRD](../PRD.md), [domaine](../DOMAIN-MODEL.md), [architecture](../ARCHITECTURE.md), [sources](../RESEARCH-SOURCES.md).

## Synthèse

A : données canoniques, révisions et propositions dans PostgreSQL ; JSONB pour propriétés validées et document riche ; FK composites, recherche lexicale et outbox dans le même périmètre. Fichiers objets uniquement dérivés/annexes.

## Contexte

Une proposition peut modifier texte, personnage, événement, relation et historique en une seule action. Les recherches suggèrent PostgreSQL mais cela doit être justifié.

## Forces / contraintes

Atomicité, isolation, récupération, coût petite équipe, recherches locales et évolution des types.

## Options étudiées

A : PostgreSQL pour état et snapshots, fichiers privés pour exports. B : base documents avec transactions multi-documents. C : base graphe et texte dans un stockage séparé.

## Décision proposée

A : données canoniques, révisions et propositions dans PostgreSQL ; JSONB pour propriétés validées et document riche ; FK composites, recherche lexicale et outbox dans le même périmètre. Fichiers objets uniquement dérivés/annexes.

## Alternatives rejetées

B reste crédible mais n’apporte pas ici de bénéfice démontré ; C impose coordination et restauration de plusieurs sources sans exigence correspondante.

## Conséquences positives

Transactions simples, recherche native, clés et historique cohérents.

## Conséquences négatives

Taille des snapshots et contention de stockage ; discipline sur index et rétention.

## Risques

Croissance historique, backups/objets désynchronisés si export traité comme canon ; vérifier manifeste et clés à restauration.

## Niveau de confiance et autorité

Recommandée, confiance élevée ; PostgreSQL non imposé par PRD.

## Conditions de réexamen

Corpus/latence ou nouveaux besoins prouvant limites, changement d’équipe ou rétention ; ne pas extraire le canon en microservices par préférence.

## Questions ouvertes

Rétention et configuration d’exploitation au lot 7, versions exactes et ORM au lot 0.

## Critères d'acceptation du document

Options crédibles comparées ; recommandation distinguée du PRD ; statut non accepté ; conséquence durable et condition de réexamen explicites ; décisions ouvertes reliées au lot concerné.
