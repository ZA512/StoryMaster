# Qualification locale du Lot 2

**Statut :** mesures exécutées le 31 octobre 2026, réception humaine attendue. **Portée :** services communs et vraie PostgreSQL locale, corpus synthétique ; aucune qualification réseau/production. **Références :** [rapport](../LOT-2-REPORT.md), [ADR-0011](../adr/0011-referentiel-narratif-et-references.md), [contention Lot 1](LOT-1-CONTENTION.md).

## Méthode reproductible

`npm run bench:narrative` utilise uniquement les URL suffixées `_test`, avec verrou de suite. Création par les services réels de 9 000 personnages, 500 lieux et 500 événements ; 120 recherches séquentielles de 20 résultats au maximum, alternant nom/alias/description/notes, absence et canari présent dans un autre projet. Aucun SQL de peuplement ne contourne snapshots, audit ou autorisations. ANALYZE après peuplement. Durée d’amorçage observée : 78,85 secondes. Sortie détaillée locale : `artifacts/local/narrative-qualification.json` ; [copie chiffrée conservée](LOT-2-QUALIFICATION.json), sans contenu narratif ni identifiant de personne.

Node 26.8.1, PostgreSQL 18.6 Docker loopback, Ryzen 5 3600X, 31,25 GiB RAM, un processus Node et pools PostgreSQL. Ces temps incluent service/SQL et validation serveur, sans transport HTTP ou réseau distant, et ne simulent pas la taille maximale de chaque fiche. Une campagne dédiée sur réseau/déploiement cible reste nécessaire.

| Mesure | Échantillons | p50 | p95 | p99 / max |
|---|---:|---:|---:|---:|
| Recherche sur 10 000 objets | 120 | 23,409 ms | 25,229 ms | 27,563 / 35,289 ms |
| Autosave dans charge mixte | 96 | 31,730 ms | 81,288 ms | 127,845 / 127,845 ms |
| Paire références + bascule module | 16 | 19,196 ms | 694,454 ms | 694,454 / 694,454 ms |
| Attente Project partagé | 110 | 0,179 ms | 0,349 ms | 9,234 / 15,849 ms |
| Attente Project exclusif | 32 | 0,164 ms | 10,080 ms | 637,282 / 637,282 ms |
| Détention Project exclusif | 32 | 9,385 ms | 11,198 ms | 16,253 / 16,253 ms |

Aucune erreur de recherche ni fuite du canari. La cible initiale NFR-03 p95 < 2 s est respectée **dans cette enveloppe locale**, sans transformation en garantie générale ni priorité produit nouvelle.

## Écritures mixtes et intégrité

Six boucles de 16 autosaves sur six scènes indépendantes, simultanées à 16 remplacements de références sur une septième scène et 16 bascules du module Lieux dans le même projet. 96 sauvegardes + 16 références + 16 activations confirmées, zéro retry et zéro erreur ; rafale totale 1,113 s. Chaque scène est relue et comparée à son snapshot courant : révision exacte, texte/références exacts, hash canonique égal, aucun écrasement. La même scène texte/références est éprouvée séparément par les tests PostgreSQL et le navigateur avec 412 attendu et choix humain.

**R-CONT-01 reste ouvert.** Les écritures de graphe utilisent la barrière Project exclusive et attendent les autosaves engagés sur toutes les scènes ; elles bloquent ensuite les nouveaux autosaves, même indépendants. L’attente exclusive ponctuelle de 637 ms et la latence de 694 ms de la paire ne sont pas masquées par une moyenne. Les mesures de contention des Lots 0/1 sont rejouées séparément (`bench:contention`, `bench:scenes`) ; ne pas mélanger ces campagnes ni promettre absence de contention. Aucun verrou ni contrôle d’intégrité n’a été retiré pour améliorer ces chiffres.

## Critères d'acceptation du document

Commande, corpus, environnement, percentiles, erreurs, attentes et détentions sont explicités. Les temps concernent des services locaux et les invariants sont vérifiés sur PostgreSQL réel. L’enveloppe réseau/production reste à qualifier ; aucune mesure ne valide les futurs merges de propositions ou la coédition Yjs.
