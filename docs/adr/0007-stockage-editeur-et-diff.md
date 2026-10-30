# ADR-0007 — Stockage de l’éditeur et représentation des différences

**Statut :** Proposée
**Date :** 2026-10-30
**Portée :** conception MVP, aucune implémentation.
**Références :** [PRD](../PRD.md), [domaine](../DOMAIN-MODEL.md), [architecture](../ARCHITECTURE.md), [sources](../RESEARCH-SOURCES.md).

## Synthèse

B sous réserve du spike A ; remplacement complet de scène avec expectedRevision ; diff bloc/mot/marks calculé, avant/après conservés. Historique métier interne. Future migration unique par scène/epoch vers Yjs, puis binaire préservé.

## Contexte

La scène doit préserver texte riche, permettre restauration et revue humaine, puis évoluer vers CRDT sans dépendre d’une offre de snapshot hébergée.

## Forces / contraintes

Format stable/versionné, sécurité rendu, contenu français/Unicode, indépendance de l’historique métier, coût de migration.

## Options étudiées

A : Markdown canonique. B : JSON ProseMirror versionné dans PostgreSQL. C : Y.Doc binaire canonique dès MVP.

## Décision proposée

B sous réserve du spike A ; remplacement complet de scène avec expectedRevision ; diff bloc/mot/marks calculé, avant/après conservés. Historique métier interne. Future migration unique par scène/epoch vers Yjs, puis binaire préservé.

## Alternatives rejetées

A à réexaminer si rich text inutile ou spike échoue ; C reporté V1 selon périmètre, pas techniquement rejeté pour toujours.

## Conséquences positives

Transactions locales, snapshots compréhensibles, pas de dépendance payante cachée pour restaurer.

## Conséquences négatives

Revue d’une longue scène complète, conflits grossiers ; algorithme diff et normalisation à qualifier.

## Risques

Pertes de marks ou liens, schema drift, commentaire déplacé ; rendu sûr et fallback diff complet nécessaires.

## Niveau de confiance et autorité

Recommandée, confiance moyenne jusqu’au spike A ; format exact Q-07 à arbitrer.

## Conditions de réexamen

Échec round-trip/export ou besoin de coédition validé V1 ; vérifier garanties d’atomicité PostgreSQL/serveur CRDT avant bascule.

## Questions ouvertes

Algorithme diff exact, schéma autorisé, licences d’éventuelles extensions et bibliothèque de sérialisation.

## Critères d'acceptation du document

Options crédibles comparées ; recommandation distinguée du PRD ; statut non accepté ; conséquence durable et condition de réexamen explicites ; décisions ouvertes reliées au lot concerné.
