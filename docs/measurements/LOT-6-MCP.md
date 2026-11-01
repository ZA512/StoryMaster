# Qualification locale MCP et régression des benchmarks

**Date :** 1er novembre 2026. **Portée :** services Docker locaux, projets synthétiques, client SDK 2.4.0, sans modèle IA. [Rapport Lot 6](../LOT-6-REPORT.md), [mesures brutes](LOT-6-MCP.json), [cinq benchmarks rejoués](LOT-6-REGRESSION.json).

## Protocole reproductible et résultats

Commande : `MCP_ENABLED=true npm run mcp:qualify`, après préenregistrement Keycloak et activation locale décrits au README. Le CLI crée ses seuls projets/grants synthétiques, effectue les deux cycles protocole, compare le canon, rejoue la même intention et révoque ses grants. Pas de stub AS dans cette mesure. JWT/introspection et preuve PostgreSQL traversés pour chaque requête protégée. Temps muraux du client Node, millisecondes, latences locales incluant réseau et sérialisation.

| Mesure | n | p50 ms | p95 ms |
|---|---:|---:|---:|
| Code + PKCE et consentement navigateur | 1 | 296.99 | 296.99 |
| Connexion MCP authentifiée | 5 | 22.71 | 339.42 |
| Contrôles OAuth/grant sans métier, GET /mcp → 405 | 5 | 9.20 | 9.33 |
| Métadonnées publiques PRM | 5 | 1.78 | 1.92 |
| Lecture de scène répétée | 10 | 17.61 | 21.19 |
| Recherche paginée | 10 | 18.54 | 21.73 |
| Création/rejeu de proposition | 4 | 23.83 | 43.97 |
| Révocation humaine HTTP | 2 | 10.01 | 10.01 |
| Huit lectures en parallèle, temps du lot | 1 | 62.85 | 62.85 |

La connexion inclut découverte/négociation et peut inclure l’amorçage JWKS ; le cycle OAuth inclut le navigateur. Le GET /mcp authentifié aboutit volontairement à 405, sans cas d’usage narratif : il mesure le chemin des contrôles et sa persistance de preuve. Les métadonnées publiques donnent un repère réseau local ; leur différence n’isole pas causalement un seul contrôle. Petits échantillons, p95 de qualification sans garantie statistique ni SLA. Huit lectures testent une rafale locale, pas une capacité soutenue ni une architecture multi-instance.

## Régression des cinq mesures antérieures

`bench:contention`, `bench:scenes`, `bench:narrative`, `bench:collaboration`, `bench:proposals` ont été rejoués sur la base `_test`, en conservant leurs oracles d’intégrité et leurs limites. Les résultats bruts regroupent environnement, taille du corpus, attentes/détentions et observations métier. La mesure narrative contient 10 000 objets ; le benchmark de propositions vérifie huit ChangeSets uniques, leurs événements et les autosaves de scènes indépendantes, sans faux conflit. Aucun seuil commercial ou résultat de production déduit.

R-CONT-01 reste ouvert : Project partagé de lecture/preview retarde Project exclusif de merge/révocation ; une fusion peut bloquer des scènes indépendantes. Les barrières garantissent l’ordre de droits et la cohérence, au prix de cette contention. Les tests déterministes couvrent aussi commit/rollback et retrait de droits ; aucune absence de famine démontrée.

## Critères d'acceptation du document

Commandes, frontières réelles, échantillons et coûts composites identifiés ; cinq benchmarks conservés ; risque de contention explicite ; aucune comparaison publique, promesse de débit ou intégration de modèle revendiquée.
