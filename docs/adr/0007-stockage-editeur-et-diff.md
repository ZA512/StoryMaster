# ADR-0007 — Stockage de l’éditeur et représentation des différences

**Statut :** Proposée — Spike A exécuté, GO technique recommandé, validation humaine attendue
**Date :** 2026-10-30
**Portée :** choix de stockage MVP et prototype isolé exécuté ; aucune implémentation de production du Lot 1.
**Références :** [PRD](../PRD.md), [domaine](../DOMAIN-MODEL.md), [architecture](../ARCHITECTURE.md), [sources](../RESEARCH-SOURCES.md).

## Synthèse

B recommandé après exécution du [Spike A](../SPIKE-A-REPORT.md), sous réserve d’acceptation du propriétaire ; remplacement complet de scène avec expectedRevision ; diff bloc/mot/marks calculé, avant/après conservés. Historique métier interne. Future migration unique par scène/epoch vers Yjs, puis binaire préservé.

## Contexte

La scène doit préserver texte riche, permettre restauration et revue humaine, puis évoluer vers CRDT sans dépendre d’une offre de snapshot hébergée.

## Forces / contraintes

Format stable/versionné, sécurité rendu, contenu français/Unicode, indépendance de l’historique métier, coût de migration.

## Options étudiées

A : Markdown canonique. B : JSON ProseMirror versionné dans PostgreSQL. C : Y.Doc binaire canonique dès MVP.

## Décision proposée

B recommandé après exécution du [Spike A](../SPIKE-A-REPORT.md), sous réserve d’acceptation du propriétaire ; remplacement complet de scène avec expectedRevision ; diff bloc/mot/marks calculé, avant/après conservés. Historique métier interne. Future migration unique par scène/epoch vers Yjs, puis binaire préservé.

## Alternatives rejetées

A à réexaminer si rich text inutile ou spike échoue ; C reporté V1 selon périmètre, pas techniquement rejeté pour toujours.

## Conséquences positives

Transactions locales, snapshots compréhensibles, pas de dépendance payante cachée pour restaurer.

## Conséquences négatives

Revue d’une longue scène complète, conflits grossiers ; algorithme diff et normalisation à qualifier.

## Risques

Pertes de marks ou liens, schema drift, commentaire déplacé ; rendu sûr et fallback diff complet nécessaires.

## Niveau de confiance et autorité

Recommandée après tests de conservation, transactions, diff et import Yjs. Confiance élevée sur le corpus exécuté, limitée pour les autres charges et l’UX ; Q-07 reste à arbitrer par le propriétaire.

## Conditions de réexamen

Échec du round-trip JSON, perte d’export non signalée, nouveau nœud/mark ou besoin de coédition validé V1 ; vérifier garanties d’atomicité PostgreSQL/serveur CRDT avant bascule.

## Questions ouvertes

Le prototype qualifie le schéma Tiptap, l’alignement jsdiff enrichi de la structure/marks et les licences libres des extensions utilisées. Restent à valider : bornes de production, acceptation de la présentation, intégration des invariants dans les services métier et autorisation du Lot 1.

## Critères d'acceptation du document

Options crédibles comparées ; recommandation distinguée du PRD ; statut non accepté ; conséquence durable et condition de réexamen explicites ; décisions ouvertes reliées au lot concerné.


## Résultat du Spike A — 31 octobre 2026

[Rapport exécuté](../SPIKE-A-REPORT.md), [mesures brutes](../SPIKE-A-MEASUREMENTS.json) et [prototype](../../spikes/editor/README.md). La CI du Lot 0 reçu est verte. Les tests JSON/éditeur/PG/Yjs ne détectent aucune perte autorisée ; restore crée une révision, les CAS obsolètes sont refusés. Le Markdown perd les marks de certains espaces et les doubles hardBreak : **export dérivé avec avertissement**, jamais canon. Le diff textuel manque les marks ; le diff riche les rend visibles et expose un fallback avant/après aux alignements ambigus.

Le JSON ProseMirror versionné est recommandé pour le MVP avec snapshots PostgreSQL internes ; aucun abonnement requis. Les noms `schemaVersion:1/2` de l’enveloppe `storymaster-scene-spike` sont expérimentaux : le contrat existant `Scene.contentFormatVersion:1` n’est pas modifié par cette expérience. La migration contrôlée d’anciens noms de marks est une preuve sur corpus fictif, pas la migration de données de production.

L’import unique Yjs conserve texte/structure/marks. Le rechargement binaire conserve vector/ancres ; une reconstruction depuis JSON détruit cette continuité. Epoch, fencing et coordination avec révisions métier restent à concevoir/tester pour V1. Le store isolé n’inclut pas les permissions/audit/barrière projet du futur Lot 1 et ne doit pas être intégré tel quel.

**Décision demandée : GO sur B**, diff d’affichage + fallback et Markdown avec avertissements ; Yjs reste hors production MVP. Statut maintenu **Proposée**. L’autorisation de production du Lot 1 constitue une décision distincte ; aucune acceptation automatique depuis les résultats du spike.
