# Mesures locales du moteur de propositions — Lot 4

**Statut :** exécuté les 31 octobre–1er novembre 2026 ; qualification locale seulement. **Références :** [rapport](../LOT-4-REPORT.md), [ADR-0013](../adr/0013-moteur-de-propositions-et-fusion.md), [script](../../scripts/measure-proposals.ts), [résultats bruts](LOT-4-PROPOSALS.json).

## Méthode

`npm run bench:proposals`, base dédiée suffixée `_test`, rôles migrateur/applicatif distincts et mêmes services que l’API. Sessions humaines synthétiques de test, sans transport HTTP ni IdP ; vrais utilisateurs IdP éprouvés séparément au navigateur. Node 26.8.1, PostgreSQL 18.6, Ryzen 5 3600X, 31,25 Gio RAM, pool maximal 24. Horodatage brut 2026-11-01T02:08:00.262Z (03:08 heure de Paris).

Même projet : huit fusions successives de quatre ressources (scène, personnage, événement temporaire et relation) contre deux auteurs × quarante autosaves sur deux scènes indépendantes, environ 25 000 caractères par texte. Un admin distinct du créateur approuve ; bases actuelles explicitement préparées avant chaque soumission. Mesures de campagne arrêtées avant les vérifications finales/rejeux pour ne pas mélanger ces lectures/retries aux huit acquisitions exclusives mesurées. Durée globale inclut préparation/revue et autosaves, latence merge isolée depuis l’appel de fusion.

## Résultats observés

| Opération / verrou | n | p50 ms | p95 ms | p99 ms | max ms |
|---|---:|---:|---:|---:|---:|
| Fusion | 8 | 17,243 | 672,234 | 672,234 | 672,234 |
| Autosave | 80 | 18,215 | 22,687 | 38,255 | 38,255 |
| Attente Project exclusif | 8 | 0,150 | 648,771 | 648,771 | 648,771 |
| Détention Project exclusif | 8 | 16,573 | 22,590 | 22,590 | 22,590 |
| Attente Project partagé | 120 | 0,183 | 0,465 | 4,098 | 22,623 |

88 commandes canoniques en 1200,280 ms, soit 73,316/s sur cette rafale. Zéro erreur, zéro retry masqué. Huit ChangeSets uniques avec quatre événements chacun, scène ciblée r10/personnage r9 ; scènes autosave r41, contenus/hashes/snapshots exacts ; mapping et résultat identiques au rejeu durable.

## B-06 et B-07 déterministes

Les tests de concurrence sont distincts du benchmark. B-06 bloque le merge après écriture du ChangeSet, avant COMMIT, démarre deux vrais autosaves B/C et observe leur attente dans pg_stat_activity avant libération. Après commit ET après rollback injecté, les deux saves réussissent chacun en r+1 sans faux CAS ni perte. Une réussite ne dépend pas d’une temporisation arbitraire.

B-07 fait attendre le merge derrière une mutation de membership, observe le verrou puis commit la rétrogradation ou le retrait du fusionneur : droits relus, fusion refusée, canon inchangé. Une attente excède réellement le lock_timeout applicatif de cinq secondes : erreur transitoire 503, aucun acquittement de sauvegarde, retry borné même clé réussi après libération. Connexion PostgreSQL interrompue et processus applicatif réellement tué avant/après COMMIT : rollback ou résultat durable, jamais de seconde application.

Neuf points de faute (validation, première écriture, relation, snapshot narratif, snapshot scène, audit, ChangeSet, head et immédiatement avant commit), plus réponse perdue après commit. Comparaison d’empreintes de l’état canonique, révisions, snapshots, relations/références, audit, ChangeSet et idempotence ; zéro état partiel. Outbox non applicable, aucun effet externe à livrer.

## Risques et limites

**R-CONT-01 reste ouvert.** Une fusion exclusive attend ici jusqu’à 648,771 ms, bien que sa détention n’excède pas 22,590 ms. Elle bloque aussi les scènes indépendantes et les commentaires. Les previews et projections du graphe entier ont un coût sous barrière ; aucune absence de famine n’est démontrée par huit merges. p95/p99 sur huit échantillons valent le maximum, ce ne sont pas des estimations de queue de production.

Pas de SLA, capacité commerciale, charge soutenue, réseau distant, multi-instance ou qualification publique. Réexaminer la granularité et documenter un ADR si l’enveloppe future retenue ne respecte pas les cibles, sans affaiblir droits, atomicité ou CAS. Les benchmarks historiques sont rejoués pour régression mais leurs anciennes mesures versionnées restent datées.

## Critères d'acceptation du document

Commande, données synthétiques, environnement et enveloppe explicites ; attente/détention séparées ; p50/p95/p99, débit, erreurs et retries publiés ; intégrité prouvée au-delà des décomptes ; barrières/injections distinguées de la mesure ; limites locales maintenues.
