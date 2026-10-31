# Mesures locales de collaboration — Lot 3

**Statut :** exécuté le 31 octobre 2026 ; qualification locale seulement. **Références :** [ADR-0012](../adr/0012-collaboration-asynchrone-et-ancrages.md), [rapport](../LOT-3-REPORT.md), [script reproductible](../../scripts/measure-collaboration.ts).

## Méthode

`npm run bench:collaboration`, base dédiée suffixée `_test`, migrations réelles et rôle applicatif limité, services communs sans transport HTTP ni IdP. Sessions de test attestées explicitement par fixture ; le parcours IdP est éprouvé séparément dans Chromium. Environnement : v26.8.1, PostgreSQL 18.6, AMD Ryzen 5 3600X 6-Core Processor, 31.25 Gio RAM. Horodatage brut : 2026-10-31T21:19:38.674Z.

Même projet : quatre auteurs enregistrent chacun une scène indépendante 16 fois ; deux reviewers répondent chacun 16 fois à leur fil et changent quatre fois son état ; propriétaire alterne huit fois le rôle d’un autre membre ; 24 lectures sont simultanées. Chaque flux garde sa propre révision, aucun retry ni erreur masquée. Total 112 mutations. Vérification finale : quatre scènes r18, contenu exact, hash canonique et snapshot exact ; deux fils r21/17 messages attribués ; origines immuables ; appartenance r9 et neuf snapshots.

[Résultats numériques versionnés](LOT-3-COLLABORATION.json), sans texte narratif, cookie ni jeton.

## Résultats observés

| Opération | Échantillons | p50 ms | p95 ms | maximum ms |
|---|---:|---:|---:|---:|
| Autosave | 64 | 26.062 | 45.276 | 57.152 |
| Réponse | 32 | 28.326 | 47.118 | 49.501 |
| Résolution/réouverture | 8 | 20.006 | 46.468 | 46.468 |
| Rôle | 8 | 6.542 | 588.65 | 588.65 |
| Lecture de fil | 24 | 19.799 | 50.544 | 65.056 |

112 mutations en 692.7 ms, soit 161.7/s sur cette rafale. Zéro erreur, aucun contenu perdu ni doublon. Attente Project partagé : p95 2.978 ms, max 4.462 ms ; exclusif : p95/max 561.532 ms sur huit acquisitions. Détention exclusive : p95/max 9.69 ms.

## Scène longue et coût borné

939986 caractères, 1 000 paragraphes, ancre à la position UTF-16 895760, au-delà du budget de matérialisation LCS. Ajout d’un paragraphe de préface : seul le bloc complet inchangé et unique autorise relocated. Vingt lectures : p50 49.817 ms, p95 65.014 ms, maximum 66.282 ms. Positions vérifiées exactement et origine inchangée ; révision de scène 3 après commentaires. Ce cas ne démontre pas tous les déplacements possibles ; les cas sans preuve restent explicitement incertains.

## Contention et limites

R-CONT-01 reste ouvert. Les commentaires/lectures et autosaves partagent Project, mais les changements de droits/structure/graphe prennent Project exclusif. Ici une administration attend 561.532 ms alors que sa détention reste sous 9.69 ms : la file des transactions partagées compte aussi. Un calcul d’ancre ou une longue lecture autorisée peut prolonger l’attente ; aucune borne de latence de révocation n’est garantie avant son commit. Pas de qualification réseau, multi-instance, charge soutenue, ni seuil commercial inventé. L’enveloppe d’exploitation doit être décidée et éprouvée avant déploiement public.

Les courses forcées en tests PostgreSQL vérifient séparément les deux ordres de commit invitation/révocation, le commentaire/autosave bloqués avant retrait, la conservation d’un commentaire commitant avant le retrait, le rollback d’audit et l’absence d’accès après commit. Elles ne mesurent pas une capacité de production. Les benchmarks des Lots 0–2 ont aussi été rejoués sans erreur ; leurs mesures historiques restent datées et ne sont pas remplacées silencieusement.

## Critères d'acceptation du document

Commande reproductible, base dédiée, données synthétiques, environnement et taille explicites ; latences, attente et détention séparées ; contrôle de contenu/révisions au-delà des décomptes ; limites locales et risque de contention maintenus.
