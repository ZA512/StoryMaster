# Mesures de contention des scènes — Lot 1

**Date :** 31 octobre 2026. **Statut :** mesure locale exécutée, enveloppe limitée ; pas de capacité commerciale garantie. **Références :** [données brutes](lot1-scene-contention.json), [rapport Lot 1](../LOT-1-REPORT.md), [ADR-0010](../adr/0010-atelier-ecriture-et-concurrence.md).

## Méthode et environnement

Commande `npm run bench:scenes` sur PostgreSQL réel, base dédiée suffixée `_test`. Services de production, validation stricte, comptage, CAS, idempotence, snapshots, changements et audit réels. Chaque auteur a une identité/session distincte ; une scène indépendante par auteur. Un seul processus Node, PostgreSQL loopback, même machine Ryzen 5 3600X (12 threads), RAM 31,25 Gio, Node 26.8.1, PostgreSQL 18.6 ; noyau et horodatage précis dans le JSON. Pas de mock, fournisseur IA, réseau distant ou données réelles. Les rafales synthétiques sont plus rapprochées que le debounce ; elles ne simulent pas tous les usages humains.

B-01 séquentiel : deux auteurs × huit écritures, huit blocs (2 442 octets). B-03 : 1/2/4/8/16 auteurs × huit écritures, 64 blocs (19 408 octets). B-05 : huit auteurs sur huit projets, huit écritures chacun. Stress long : huit auteurs × trois écritures, 3 000 blocs (913 916 octets). Les deux stratégies utilisent les mêmes services et corpus. Ordre : projet exclusif, puis partagé + scène ; caches/JIT et faible nombre de répétitions limitent la comparaison. Aucun build ou autre campagne de tests lancé pendant cette mesure finale. Les premières passes avec build/navigateur simultanés ont été écartées du tableau, leurs variations ne constituent pas une garantie.

Les latences incluent préparation du document, CPU, SQL et commit côté service ; elles excluent HTTP, debounce 600 ms et rendu web. Attente de verrou mesurée autour de la requête ; détention jusqu’après commit. Sous Node unique, la détention inclut le temps où l’event loop traite les autres documents. Le débit couvre toutes les sauvegardes du cas. Équité = indice de Jain des débits par auteur, complété par durées/latences/succès par auteur dans le JSON. Retries automatiques : zéro ; aucune erreur masquée.

## Résultats

Toutes les latences/attentes/détentions sont en millisecondes. **Zéro erreur inattendue** dans les 16 cas de charge ; tous les auteurs terminent toutes leurs écritures.

| Stratégie | Cas | Auteurs | Blocs | Latence p50 / p95 / p99 | Projet attente / détention p95 | Scène attente / détention p95 | Écritures/s | Jain |
|---|---|---:|---:|---|---|---|---:|---:|
| Projet exclusif | B-01 | 2 | 8 | 6.989 / 11.883 / 11.883 | 0.308 / 6.554 | 0.28 / 5.693 | 136.48 | 0.9915 |
| Projet exclusif | B-03-1 | 1 | 64 | 8.638 / 12.016 / 12.016 | 0.217 / 9.075 | 0.22 / 8.318 | 105.91 | 1 |
| Projet exclusif | B-03-2 | 2 | 64 | 17.624 / 28.115 / 28.115 | 13.311 / 11.463 | 0.485 / 9.426 | 103.04 | 0.9998 |
| Projet exclusif | B-03-4 | 4 | 64 | 36.031 / 44.825 / 44.952 | 33.855 / 9.733 | 0.319 / 8.694 | 107.37 | 0.9992 |
| Projet exclusif | B-03-8 | 8 | 64 | 66.078 / 78.9 / 88.459 | 69.245 / 8.278 | 0.354 / 7.315 | 116.6 | 0.9992 |
| Projet exclusif | B-03-16 | 16 | 64 | 132.033 / 152.999 / 159.353 | 144.241 / 9.301 | 0.37 / 8.326 | 118.01 | 0.9991 |
| Projet exclusif | B-05 | 8 | 64 | 28.668 / 35.315 / 38.097 | 0.913 / 27.328 | 2.404 / 23.455 | 269.76 | 0.9994 |
| Projet exclusif | B-03-long | 8 | 3000 | 1005.909 / 1309.463 / 1632.02 | 1009.562 / 141.807 | 0.297 / 83.049 | 7.07 | 0.9939 |
| Projet partagé + scène | B-01 | 2 | 8 | 5.646 / 6.823 / 6.823 | 0.259 / 5.463 | 0.354 / 4.669 | 170.77 | 0.9994 |
| Projet partagé + scène | B-03-1 | 1 | 64 | 7.175 / 11.374 / 11.374 | 0.233 / 9.612 | 0.189 / 9.108 | 123.58 | 1 |
| Projet partagé + scène | B-03-2 | 2 | 64 | 10.933 / 12.187 / 12.187 | 0.364 / 9.545 | 0.272 / 8.855 | 180.84 | 1.0 |
| Projet partagé + scène | B-03-4 | 4 | 64 | 15.424 / 20.95 / 22.408 | 0.754 / 16.18 | 1.651 / 14.895 | 239.01 | 0.9997 |
| Projet partagé + scène | B-03-8 | 8 | 64 | 26.216 / 50.089 / 64.824 | 0.867 / 47.65 | 1.626 / 46.99 | 245.08 | 0.9937 |
| Projet partagé + scène | B-03-16 | 16 | 64 | 42.194 / 150.295 / 240.273 | 1.043 / 147.451 | 2.225 / 145.41 | 236.11 | 0.9729 |
| Projet partagé + scène | B-05 | 8 | 64 | 25.992 / 34.721 / 39.104 | 1.824 / 24.523 | 1.576 / 21.953 | 291.52 | 0.9995 |
| Projet partagé + scène | B-03-long | 8 | 3000 | 659.803 / 1118.705 / 1143.021 | 61.1 / 761.35 | 3.154 / 760.264 | 10.58 | 0.995 |

B-02 exclusif : T1 retenue après sa barrière, T2 observée en attente effective dans `pg_stat_activity`, puis deux commits r2 après libération. B-02 indépendant : T1 retenue après verrou de sa scène, une autre scène atteint r2 **avant** sa libération, T1 encore r1 visible jusqu’au commit. B-04 production : deux auteurs, même scène/révision ; un succès et exactement un `REVISION_CONFLICT`, aucun retry.

L’intégrité ne repose pas seulement sur les décomptes : comparaison du document final normalisé au corps attendu du dernier succès de chaque auteur, vérification du hash canonique, égalité du dernier snapshot, séquence exacte r1..rN, et un changement/audit/snapshot par révision. Les tests PostgreSQL complètent par rollback, interruption réelle de connexion, révocation pendant attente, archive exclusive attendant les sauvegardes et refus après archivage.

## Interprétation et limites

Le verrou global montre un goulot concret : attente p95 d’environ 1 010 ms sur les longues scènes indépendantes. La barrière partagée ramène cette attente à 61 ms, améliore débit long (7,07 → 10,58 écritures/s) et p95 (1 309 → 1 119 ms). Le gain n’est pas uniforme : à 16 auteurs de scènes courtes, p95 voisin (153 / 150 ms), **p99 plus élevé** avec la stratégie fine (240 / 159 ms), malgré débit doublé et Jain 0,9729. Le CPU/JSON, les snapshots et le compteur final restent des coûts ; ce raffinement n’est pas une promesse de latence bornée sur toute charge.

NFR-04 : ajouter le debounce de 600 ms à ces mesures donne une estimation de service, pas une mesure web de bout en bout. Les parcours Chromium mesurent séparément un autosave visible court et un de 1 200 paragraphes sous 2 s en local ; résultats dans le rapport. GO technique limité à l’enveloppe observée et aux invariants prouvés. Réexaminer sur réseau réel, corpus plus large, autosaves soutenus et mélange d’archives/structures/exports ; aucune qualification de l’exploitation publique ou de NFR-06 disponibilité. B-06 propositions et la variante B-07 pendant merge restent à leur lot ; B-07 autosave (révocation et timeout réel de 5 s, reprise idempotente) est exécuté dans les tests PostgreSQL ; aucun moteur futur n’est simulé pour les déclarer réussis.

## Critères d'acceptation du document

Commande, environnement, corpus, ordre des stratégies et limites explicites ; p50/p95/p99, attentes/détentions, débit, erreurs/retries, équité et preuve du contenu disponibles. Toute généralisation à un nouveau domaine exige de préserver la barrière projet, les révocations et les invariants transactionnels.
