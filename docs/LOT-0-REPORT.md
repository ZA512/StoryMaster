# Rapport de réalisation du Lot 0

**Date :** 31 octobre 2026, Europe/Paris. **Statut :** socle local implémenté et vérifié ; réception approuvée par le propriétaire sous réserve de fonctionnement et CI, contrôles confirmés le 31 octobre 2026. Aucun démarrage du Lot 1 ni déploiement public. **Références :** [démarrage et tests](../README.md), [décisions](HUMAN-DECISIONS.md), [plan](IMPLEMENTATION-PLAN.md), [ADR de mise en œuvre](adr/0009-socle-executable-lot-0.md), [inventaire des fichiers](LOT-0-FILES.txt).

## Résultat et décisions appliquées

GO-00..02 et PROP-10 MUST appliqués selon l’instruction explicite du propriétaire. Les deux patchs PRD sont appliqués une fois ; **150 IDs conservés, 100 MUST MVP**. Les NFR gardent objectif complet, type, priorité null et version séparés. ADR-0001/0002/0006 acceptés ; ADR-0003 accepté pour les invariants avec verrou projet provisoire ; ADR-0008 reste partiellement validé pour GO-02. Les autres décisions ne sont pas acceptées automatiquement.

L’application Docker Compose fonctionne en local : PostgreSQL, Keycloak, API Fastify et web Next.js. Le migrateur s’exécute avant l’API. Connexion réelle OIDC, accueil/liste, création de projets privés, consultation, modification selon rôle, archive/réactivation et déconnexion sont utilisables. Interface responsive, cohérence visuelle papier/sauge, formulaires étiquetés, navigation clavier, états de chargement/erreur et brouillon conservé lors d’un conflit.

PROJ-10 : trois points de départ préremplissent uniquement titre/intention (libre, roman, nouvelle) ; aucune structure de scènes ni fonctionnalité d’éditeur anticipée. Toutes les métadonnées restent modifiables. Archive et réactivation conservent les données et produisent des révisions ; aucune suppression définitive ni restauration d’ancien snapshot n’est exposée.

## Fichiers créés et modifiés

L’[inventaire exhaustif](LOT-0-FILES.txt) distingue nouveaux fichiers et modifications du dossier initial. Principaux groupes :

| Groupe | Fichiers / rôle |
|---|---|
| Monorepo | `package.json`, `package-lock.json`, `tsconfig.json`, `eslint.config.mjs`, manifests des six workspaces |
| Domaine et application | `packages/domain/src/index.ts`, `packages/application/src/index.ts` : politique centrale, projets, identité, CAS, idempotence et ports transactionnels |
| Contrats exécutables | `packages/contracts/src/index.ts`, `docs/spec/openapi.yaml`, définitions Project du catalogue MCP, `docs/examples/lot0-http.json` |
| PostgreSQL et identité | `packages/infrastructure/src/{database,sessions,oidc,index}.ts`, `migrations/0001-foundations.sql` |
| API | `apps/api/src/{app,config,server}.ts` : adaptation HTTP, session, CSRF, erreurs, corrélation, logs et santé |
| Web | `apps/web/app/`, `components/`, `proxy.ts`, `next.config.mjs`, configuration TS : interface, CSP et transport vers API |
| Environnement | `Dockerfile`, `compose.yaml`, `compose.test.yaml`, `.env.example`, `.dockerignore`, `.gitignore`, `infra/postgres/`, `infra/keycloak/` |
| Validation | `tests/foundations.test.ts`, `tests/oidc.test.ts`, helper PostgreSQL, `tests/e2e/lot0.spec.ts`, `playwright.config.ts`, scripts de migration/architecture/contention/contrats HTTP |
| CI | `.github/workflows/validation.yaml` : documentation, tests du validateur, lint, TypeScript, build Compose, PostgreSQL, contention, navigateur |
| Sources et décisions | PRD, registre, traçabilité, audit, plan, HUMAN-DECISIONS, alignement, architecture, domaine, sécurité, contrats, ADR concernés + ADR-0009 |
| Livraison | README, rapport présent, résultats de contention, rapport de validation documentaire, rapport consolidé et index des artefacts |

Aucun secret réel commité. `.env`, dépendances, caches, captures et traces sont ignorés. Les patchs approuvés restent conservés comme historique ; ne pas les réappliquer sur le PRD courant.

## Commandes exécutées et résultats

Les commandes sont exécutées localement, sur les vraies instances PostgreSQL et Keycloak. À la livraison initiale, les étapes étaient vérifiées localement sans exécution distante revendiquée. Depuis la réception, la [CI GitHub de ea27725](https://github.com/ZA512/StoryMaster/actions/runs/41148886995) est terminée et réussie.

| Commande / contrôle | Résultat final |
|---|---|
| Installation npm verrouillée et dépendances Python épinglées | Réussite |
| `python scripts/validate_specifications.py` | Réussite : JSON, schémas, OpenAPI, MCP, exigences, lots, exemples, liens |
| `python -m unittest discover -s scripts/tests -v` | 22 tests documentaires réussis |
| `npm run lint` | Réussite, y compris direction des dépendances |
| `npm run typecheck` | Réussite, API/packages/web/scripts/tests navigateur |
| `npm test` avec Python du venv pour les contrats | 25 tests réussis ; vraie PostgreSQL, tests cryptographiques OIDC, réponses observées contre OpenAPI |
| `docker compose -f compose.yaml -f compose.test.yaml up -d --build --wait` | Images construites, quatre services sains, migration code 0 |
| Migration rejouée et empreinte contrôlée | Réussite ; migration altérée refusée |
| `npm run bench:contention` | Deux cas terminés, 320 écritures validées, aucun interblocage/échec final |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e` | 2 parcours réussis, vrai Keycloak et vraie application Docker |
| axe WCAG 2/2.1 A/AA sur connexion, détail et liste mobile | Aucune violation détectée dans les pages analysées ; ne remplace pas un audit humain complet |
| Captures desktop/mobile et clavier | Vues et vérifiées ; pas de débordement à 390 px, accès au contenu au clavier |
| `git diff --check` | Réussite |

Le test de contrat HTTP transmet six réponses effectivement reçues par Fastify à `validate_runtime_contracts.py`, via stdin sans fichier de tokens : identité, création, refus interprojets, modification, conflit et logout. Les huit exemples synthétiques sont aussi validés par le validateur documentaire. Les opérations futures de propositions/MCP ne sont pas présentées comme des tests produit exécutés.

## Scénarios critiques réellement testés

- Identité OIDC créée une seule fois sous concurrence, réutilisée par issuer/subject ; même email sur deux sujets n’amalgame pas les comptes ; issuer non configuré et compte suspendu refusés.
- Flux Code + PKCE réel avec Keycloak. Tests cryptographiques négatifs : state, nonce, issuer, audience, expiration, signature, mauvais vérificateur PKCE et rejeu de code. Transaction de login chiffrée, expirante et consommée une fois.
- Création privée, owner automatique, plusieurs projets par utilisateur, pagination et curseur lié à l’utilisateur ; cinq rôles effectifs, refus des acteurs IA/système au Lot 0.
- A ne lit/modifie pas le projet de B ; changement d’ID ne donne aucun droit ; même 404 pour inconnu et inaccessible ; role/ownerId du navigateur refusés.
- Sessions expirées/révoquées/cookies altérés refusés ; révocation pendant attente du verrou et rôle admin rétrogradé pendant attente relus avant écriture.
- CSRF/Origin, authentification obligatoire, précondition 428, conflit 412, corps invalide 400/422 et taille excessive 413 ; erreurs normalisées sans titre privé ; corrélation et absence de token/cookie/CSRF/contenu/query string dans les logs applicatifs capturés.
- Contraintes FK, propriétaire unique obligatoire, privé imposé en DB, rôle DB non privilégié et audit/snapshots non modifiables par le rôle applicatif.
- Échecs injectés dans l’insertion owner puis audit : rollback complet des mutations et snapshots ; retry possible. Même clé concurrente : un seul projet/révision ; clé réutilisée avec autre corps : 409. Huit CAS concurrents : une victoire, sept conflits, aucun écrasement silencieux.
- Navigateur : modification persistée après rechargement, autre utilisateur refusé, deux onglets en conflit sans perte de brouillon, archive/réactivation, logout applicatif et IdP, callback falsifié refusé.

## Anomalies détectées et corrigées

Deux premiers tests PostgreSQL ont échoué : typage SQL ambigu text/varchar lors d’une reconnexion et observation de verrou avec un rôle ne voyant pas les détails d’une autre session. Casts SQL explicites et observation depuis le bon rôle corrigés ; les tests passent ensuite.

Le premier transport Next avait une destination compilée localhost incompatible avec Docker et pouvait journaliser une URL de callback lors d’un échec réseau. Il est remplacé par un transport serveur explicite, à destination interne configurable au runtime, sans règle métier ni logs d’URL sensibles. Les sélecteurs navigateur ont aussi été précisés pour distinguer les alertes produit de l’annonceur de navigation Next. Les contrastes de libellés connexion/sidebar détectés par axe ont été corrigés sans désactiver les règles.

Les plantages de la session ont interrompu les builds. Les traces npm et PostgreSQL contenaient **ENOSPC / No space left on device** ; PostgreSQL s’était arrêté faute d’écriture WAL. Le propriétaire a libéré de l’espace (environ 45 Go disponibles au contrôle initial, puis environ 43 Go après builds). Après nettoyage des endpoints réseau laissés par le crash et recréation des conteneurs **sans suppression du volume**, PostgreSQL récupère et les quatre services redémarrent. Les builds et les tests passent ensuite. Cela confirme le blocage disque pour ces échecs ; sans core exploitable, la cause exacte du SIGBUS de l’application desktop et du crash JVM initial n’est pas prouvée individuellement. Aucun réglage système global modifié.

Le benchmark initial borné à 100 reprises pouvait abandonner une opération affamée par les autres auteurs. Le plafond de l’essai est désormais lié au nombre total d’écritures, et ses reprises sont mesurées. Une exécution chevauchée avec la réinitialisation des tests a été invalidée ; un verrou de suite partagé sérialise désormais les accès destructifs de test et le benchmark. Ces exécutions échouées ne sont pas présentées comme mesures valides.

## Contention préliminaire et limites

Résultats bruts : [LOT-0-CONTENTION.json](LOT-0-CONTENTION.json). Environnement Linux local, Node 26.8.1, PostgreSQL 18.6 Docker, 12 CPU logiques, 31,3 Gio RAM ; pool de 24 connexions, 8 workers concurrents sous la même session de propriétaire, 20 modifications de métadonnées par worker. Une mesure courte par cas, sans latence réseau externe ni scène. Les temps de verrou sont instrumentés autour du SQL et du commit ; les latences globales incluent lectures/pool/reprises. L’attente chronométrée côté client inclut aussi le temps du round-trip SQL ; ce n’est pas un temps de blocage PostgreSQL isolé. Pas de contenu privé dans les métriques.

| Mesure | Même projet | 8 projets distincts |
|---|---:|---:|
| Écritures validées | 160 | 160 |
| Conflits CAS repris | 608 | 0 |
| Débit observé, écritures/s | 94,12 | 630,35 |
| Latence opération p95, ms | 30,881 | 18,043 |
| Latence opération p99, ms | 1367,742 | 21,240 |
| Attente de verrou p95, ms | 13,544 | 0,594 |
| Détention de verrou p95, ms | 4,251 | 9,867 |
| Interblocages / échecs finaux | 0 / 0 | 0 / 0 |

Pour chaque projet : owner unique, révision finale = snapshots = événements d’audit, révisions de 1 au maximum sans trou. Un projet atteint 161 révisions ; chaque projet du contrôle en atteint 21. Le compteur PostgreSQL d’interblocages est également contrôlé, en complément de l’absence d’erreur transactionnelle ; ses statistiques peuvent être asynchrones.

L’écart démontre une contention et une équité dégradée sur la même ressource. Les conflits de métadonnées partagent légitimement la même révision ; ils ne prédisent pas les conflits entre scènes. **Aucune capacité cible, garantie SLA ni approbation définitive du verrou** n’est tirée de ces chiffres. Les sept cas B-01..07, dont scènes indépendantes d’un même projet, longues transactions et graphe, restent à exécuter lorsque les ressources existeront, idéalement avant généralisation des sauvegardes au Lot 1.

## Limites, sécurité restante et écarts au PRD

Aucun écart produit durable supplémentaire. Les fonctionnalités V1/V2+ et les lots futurs ne sont pas implémentés. Les exigences transversales affectées au Lot 0 continuent à s’appliquer aux prochains adaptateurs : pas de revendication d’achèvement de toute la sécurité du MVP ni des 50 scénarios CT.

Le rôle applicatif a accès aux tables via l’application ; pas de RLS à ce stade. L’hôte/administrateur DB reste une frontière de confiance. L’audit est en ajout seul pour l’application, pas immuable face au migrateur. Pas de MFA, gestion des invitations, UI de membres, révocation globale IdP/back-channel logout, refresh token, sauvegarde/restauration d’exploitation ou purge automatique de l’audit. La session expire selon sa durée absolue et la révocation applicative est effective ; une déconnexion IdP effectuée ailleurs ne révoque pas instantanément toutes les sessions locales.

Les logs PostgreSQL sont limités en verbosité pour ne pas recopier les paramètres/valeurs de lignes en erreur ; les métriques opérationnelles restent des hooks, sans stack de supervision. Les vérifications des logs applicatifs sont fondées sur canaris, sans prétendre auditer tous les logs du système hôte/IdP. Les clés de démonstration, Keycloak start-dev et HTTP sont exclusivement loopback. Les images sont épinglées, l’exécution Node est non-root ; l’optimisation/hardening des images de déploiement et la politique TLS/backup publique restent au Lot 7.

L’outbox n’est pas matérialisée car aucune mutation de projet ne produit d’effet externe ; elle est requise au premier cas qui en dépend. Les métriques ne suffisent pas à accepter une enveloppe de charge. L’accessibilité automatique et les captures ne couvrent pas tous les lecteurs d’écran ou navigateurs.

## État des critères de sortie et validation attendue

| Critère Lot 0 | État |
|---|---|
| Application locale démarrable, Docker et migrations | Vérifié |
| Identité réelle, projets privés créables/consultables/modifiables | Vérifié |
| Permissions centrales, refus interprojets et sessions | Vérifié sur PostgreSQL et navigateur |
| Atomicité, CAS, idempotence, contraintes et historique | Vérifié sur PostgreSQL |
| CI versionnée, documentation et commandes reproductibles | Fournies ; CI ea27725 terminée avec succès |
| Qualification préliminaire du verrou | Mesurée ; granularité toujours provisoire |
| ADR de socle validés, pas de bypass DB depuis les routes | Appliqué et vérifié |
| Validation de sortie par le propriétaire | Reçue sous réserve de fonctionnement et CI ; CI ea27725 réussie, voir HUMAN-DECISIONS |

La réception du Lot 0 est approuvée sous réserve de fonctionnement et CI ; la CI de ea27725 est [réussie](https://github.com/ZA512/StoryMaster/actions/runs/41148886995). L’autorisation de production du Lot 1 reste à votre accord. Le Spike A isolé seul est maintenant autorisé. Avant celui-ci, arbitrage du stockage éditeur (ADR-0007/spike A) ; avant généralisation des scènes, résultat du spike B complet. GO-03/04, décisions fonctionnelles ultérieures et exploitation publique restent ouverts. Le présent rapport ne demande pas de réapprouver GO-00..02 ni PROP-10.

## Critères d'acceptation du document

Résultats exécutés et limites identifiables, échecs intermédiaires expliqués, inventaire des fichiers et commandes reproductibles, réserves de contention conservées et décisions humaines restantes explicites. Aucune fonctionnalité future présentée comme livrée.
