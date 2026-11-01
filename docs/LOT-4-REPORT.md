# Rapport de réalisation du Lot 4 — Moteur de propositions

**Statut :** implémenté et vérifié localement sur la vraie application ; techniquement présenté à réception humaine. **Période :** 31 octobre–1er novembre 2026. **Références :** [autorisation](HUMAN-DECISIONS.md), [ADR-0013](adr/0013-moteur-de-propositions-et-fusion.md), [plan](IMPLEMENTATION-PLAN.md), [inventaire complet](LOT-4-FILES.txt).

## Référence, autorité et périmètre

Départ Git propre sur **41762fb760a6d10a377542cb70a6c055f16cb2cd**, Lot 3. Sa [CI GitHub 41243880880](https://github.com/ZA512/StoryMaster/actions/runs/41243880880), initialement en cours, a été vérifiée terminée avec succès avant la poursuite du moteur (jobs validate/spike-a). L’instruction du propriétaire reçoit techniquement le Lot 3 avec ses réserves et accepte les principes ADR-0012. La condition CI de ce lot est donc constatée satisfaite ; les réserves UX, brouillons en mémoire, mesures seulement locales et absence de qualification publique restent ouvertes.

Lot 4 complet réalisé dans les services de production, PostgreSQL, HTTP et interface actuelle. **150 identifiants, textes, priorités et affectations inchangés ; 100 MUST MVP, PROP-10 MUST conservé.** PRD, registre d’exigences et backlog non modifiés. Aucun autre ADR proposé accepté par proximité. Aucun assistant IA, serveur MCP, OAuth délégué, CRDT, branche, approbation partielle ou fusion textuelle automatique. Arrêt avant Lot 5.

## Fonctionnalités réalisées

- Liste projet avec filtres état/auteur, pagination et accès depuis projet/atelier ; création humaine, titre et justification, constitution de propositions multi-objets avec les formulaires existants et un éditeur riche proposé distinct sans autosave canonique.
- Catalogue fermé des neuf opérations existantes : create/update/archive_object, create/update/remove_relation, replace_scene_content, update_scene_metadata (références comprises) et move_scene. Validateurs canoniques partagés avec les commandes directes des lots précédents, pas de moteur de règles parallèle.
- ChangeProposal, ProposalRevision, ProposedOperation, ProposalReview et ChangeSet matérialisés. `proposalRevision` identifie contenu immuable et hash SHA-256 canonique (titre, justification, opérations ordonnées, dépendances, politique v1) ; `stateVersion` protège transitions/avis concurrents. Nouvelle intention enregistrée → nouvelle révision draft, anciens avis conservés mais invalidés.
- Cycle draft/submitted/in_review/approved/rejected/withdrawn/conflicted/merged, commentaires et demandes de révision. Rejected/withdrawn/merged terminaux ; duplication explicite en nouveau brouillon sans avis hérités. Révisions et historique paginés, attribution/date et consultation du ChangeSet final.
- Preview/validate sans mutation canonique ni réservation d’ID : créations, changements, archives/retraits, ressources touchées, bases/dépendances, diff riche Lot 1 avec fallback et champs structurés avant/après. Avertissements des relations, scènes et fiches liées à relire (PROP-11), sans déduction sémantique ni édition supplémentaire. Base historique utilisée si la cible a changé ; absence de références dans un ancien snapshot explicitement signalée.
- Rebase jamais automatique : préparation explicite d’une nouvelle révision avec les bases affichées, intention conservée, nouvelle revue nécessaire. Preview réussie et approbation ne valent pas autorisation définitive de fusion.
- tempId uniques, créés avant usage, références typées exclusivement ; inconnus, doublons, mauvaise famille/type et références interprojets refusés. UUID canoniques alloués dans le merge, mapping et résultat conservés durablement. Jamais de substitution dans le texte libre.
- Owner/admin approuve, rejette et fusionne ; author/reviewer prépare/soumet et commente ; reader lit. Auto-approbation réservée à l’owner humain créateur d’un projet encore individuel. Origines IA refusées jusqu’à présence d’un adaptateur et d’une délégation serveur vérifiés ; aucun acteur IA ne peut approuver/fusionner, aucune identité d’agent simulée.
- Avis liés à proposition/révision/hash, identité, rôle, date, stateVersion et révision d’appartenance. Merge recontrôle auteur/fusionneur/réviseur et droits actuels ; retrait/rétrogradation/réintégration ne ressuscitent pas un ancien avis. Une demande de révision rend les approbations antérieures inopérantes.
- Confirmation explicite de fusion, distinction visible proposé/approuvé/fusionné, erreurs et brouillons conservés en cas de conflit ou résultat réseau non confirmé. Rejeu de la même intention réseau avec la même clé, accès au résultat durable après réponse perdue.

## Transaction, verrouillage et historique

Preview : Project partagé → proposition partagée → scènes ciblées partagées triées ; droits relus après la barrière, graphes/structures/modules figés par Project et textes ciblés par Scene. Ce protocole remplace la suggestion documentaire REPEATABLE READ pour ne pas réutiliser un snapshot d’autorisation antérieur à une révocation. Aucun upgrade de verrou.

Merge : **Project exclusif → droits/session relus → proposition → scènes triées → idempotence → écritures/snapshots/audit/ChangeSet/état/publication → COMMIT**. Validation complète de l’état final avant la première écriture. Contrôle de toutes les bases, modules, parents et extrémités ; révisions périmées refusées. Relations/references remplacées retirées des index uniques avant ajout final, sans visibilité d’un état intermédiaire.

Opérations complémentaires d’une même scène partagent une base et avancent sa révision une seule fois ; déplacements avancent chaque parent structurel une seule fois, opérations associées distinctes. Recherche lexicale mise à jour dans la même transaction. Snapshots et événements directs des Lots 1/2 conservés pour leurs liens internes, regroupés dans un ChangeSet de proposition unique. Audit et attribution dans la même transaction, compteur éditorial publié une fois. Aucune sortie réseau ou effet externe à livrer : aucune outbox artificielle.

Le lien durable proposalId → ChangeSet est unique et indépendant de l’expiration des clés ordinaires. Après commit, un rejeu autorisé de la même révision retourne exactement le même ChangeSet/mapping/versions, même avec l’ETag d’état d’origine ; jamais de seconde application. Un acteur retiré ne récupère pas un résultat auquel il n’a plus accès. Un conflit annule tout ; `effectiveStatus: conflicted` dans l’erreur ne prétend pas avoir persisté cet état. `mark_conflicted` reste une commande humaine distincte.

## Migrations et conservation des données

Migrations **0006-proposals.sql** (propositions, révisions, avis, événements et ChangeSets) et **0007-schema-readiness.sql** (SELECT des métadonnées de migrations pour contrôle de démarrage) additives, appliquées et ensuite figées. 0001..0005 inchangées. Rôle applicatif sans DDL, historiques append-only, clés composites projet/révision/hash, état merged terminal renforcé en base. Vérification des noms/checksums au démarrage de l’API ; schéma incomplet ou divergent refusé.

Espace disque et conteneurs contrôlés avant builds/migrations ; aucun volume persistant supprimé. [Comparaison versionnée](measurements/LOT-4-MIGRATION.json) sur 22 tables : empreintes SHA-256 des lignes complètes triées et compteurs strictement identiques avant/après migrations réelles. Notamment **120 projets, 156 memberships, 104 manuscrits, 115 chapitres, 161 scènes, 446 snapshots de scène, 63 fiches, 8 relations, 39 références, 574 snapshots narratifs, 13 invitations, 13 fils, 20 commentaires, 6 ancres et 1 514 audits** conservés. Les projets de démonstration créés ensuite par le navigateur modifient naturellement ces compteurs ; cette preuve porte sur la migration à l’instant enregistré, pas sur l’absence de nouvelles écritures ultérieures.

`scripts/capture-project-data.ts` rend cette comparaison reproductible en transaction READ ONLY/REPEATABLE READ, sans exporter les textes. Un test PostgreSQL construit également une vraie base 0005 remplie (textes, références, modules off, invitations, commentaires/ancres/historiques), migre deux fois et compare exactement les anciennes lignes. Le parcours de redémarrage conserve textes/snapshots/liens/commentaires/invitations et désormais proposition fusionnée/ChangeSet/mapping, puis rejoue la fusion sans doublon.

Les tests destructifs et benchmarks utilisent exclusivement `storymaster_test`, suffixe `_test` imposé et verrou de suite. Les parcours navigateur utilisent l’application locale et ses vrais comptes de démonstration ; ils créent des projets, sans purge du volume.

## Vérifications effectivement exécutées

Commandes depuis la racine, Node 26.8.1, PostgreSQL 18.6 réel, Python 3.14.8 et dépendances documentaires épinglées ; Chromium fourni par Playwright. `DOCUMENT_PYTHON=/tmp/storymaster-ci-check/bin/python` utilisé pour confronter les réponses HTTP observées à OpenAPI. Conteneurs PostgreSQL/Keycloak/API/web sains après construction, migrations et redémarrage ; 35 Go de disque disponibles au contrôle final.

| Vérification | Résultat local |
|---|---|
| `npm run typecheck` | Réussi, backend et frontend |
| `npm run lint` | Réussi : ESLint, architecture, cinq générateurs/registre et parité contrats |
| `python scripts/validate_specifications.py` | Réussi : JSON/YAML, schémas, OpenAPI, catalogue MCP, exigences/valeurs/lots et liens |
| `python -m unittest discover -s scripts/tests -v` | **39 réussis**, mutations sémantiques comprises |
| `DOCUMENT_PYTHON=… npm test` | **151 réussis**, zéro échec/skipped ; fondations et Lots 1–4 sur PostgreSQL |
| Test ciblé concurrence Lot 4 après ajustement final de l’oracle de cycle | **9 réussis**, barrières et timeout réels |
| `bench:contention`, `bench:scenes`, `bench:narrative`, `bench:collaboration` | Rejoués avec succès, intégrité contrôlée ; recherche sur 10 000 fiches comprise |
| `npm run bench:proposals` | Réussi : 8 fusions × 4 ressources face à 80 autosaves, zéro erreur/retry, contenus/hashes/snapshots exacts |
| `docker compose -f compose.yaml -f compose.test.yaml build migrate api web`, puis `up -d --wait` | Réussis ; images complètes et schéma compatibles |
| `npm run test:e2e` | **16 réussis**, redémarrage et parcours multi-utilisateurs compris |
| Spike A isolé : typecheck, PostgreSQL dédiée, tests, bench et browser | **48 tests et 3 parcours navigateur réussis**, laboratoire ensuite arrêté sans toucher au volume applicatif |
| `git diff --check`, invariance anciennes migrations et registre produit | Réussi ; anciennes migrations et référence produit inchangées |

Les réponses HTTP observées des Lots 0–3 sont rejouées ; **26 réponses Lot 4** couvrent cycle, préconditions, erreurs, non-mutation et historique et sont conformes à OpenAPI. Les corps et secrets ne sont pas imprimés pour cette validation.

CT-07..16 humains : préparation sans canon, preview/validation, erreurs de dépendance/tempId/types, avis liés au contenu, invalidation, merge atomique et historique durable. CT-29 : création K/B rejouée sans doublon, K/B2 refusée et retrait avant rejeu. CT-33 : **processus applicatif réellement tué par SIGKILL avant/après COMMIT**, état et reprise contrôlés. CT-45 : avis invalidé après retrait/rétrogradation, non restauré lors du retour des droits. CT-48 : graphe final acyclique, inversion de précédence sans faux conflit intermédiaire, modification créant un cycle refusée, tempId et invariants partagés. [Sélection exacte et fichiers exécutables](spec/lot4-scenarios.json). Les variantes assistant/MCP/grants et consommation d’outbox absente ne sont jamais déclarées exécutées.

## Spike B applicable : B-06, B-07 et fautes

B-06 commit **et** rollback : merge A/personnage/événement/relation arrêté par barrière après ChangeSet avant COMMIT ; autosaves B/C indépendants démarrés, attente réelle observée dans PostgreSQL, puis libération. Les deux sauvegardes réussissent en r+1 sans texte perdu ni faux CAS. Le canon du merge est intégralement appliqué ou intégralement annulé.

B-07 : merge arrêté derrière un retrait/rétrogradation de son fusionneur, attente réelle observée, droits relus après commit de la révocation et fusion refusée. Timeout applicatif de cinq secondes effectivement dépassé → 503 sans mutation ; même clé réessayée après libération → une seule fusion. Connexion PostgreSQL interrompue avant commit, puis processus applicatif tué avant/après commit : rollback ou résultat durable récupérable. Ces barrières évitent de conclure une course à partir d’un simple sleep.

Neuf points d’échec injectés dans de vraies transactions : validation, première opération, relation, snapshot narratif, snapshot scène, audit, ChangeSet, mise à jour de tête et juste avant commit. Après chaque rollback, empreinte complète identique des ressources, révisions/snapshots/historiques, relations/références, audit, proposition/avis/événements, ChangeSet et idempotence. Perte de réponse après COMMIT réel : rejeu même mapping/résultat, zéro seconde application. Aucun effet externe/outbox à tester.

Concurrence également vérifiée : merges simultanés de la même proposition → même résultat unique ; deux propositions sur même base → une gagnante, une en conflit ; deux scènes indépendantes → deux réussites sans conflit global artificiel ; avis concurrents → un CAS gagnant sans avis fantôme ; fiche modifiée/archivée et références de scène remplacées depuis l’approbation → conflit, canon courant conservé et aucun événement créé partiellement.

## Mesures locales et risque résiduel

[Campagne et limites détaillées](measurements/LOT-4-PROPOSALS.md), [résultats numériques](measurements/LOT-4-PROPOSALS.json). Même projet, textes ~25 000 caractères, deux auteurs × 40 saves et 8 merges successifs de 4 ressources : 88 commandes canoniques en **1 200,280 ms**, soit **73,316/s** sur cette rafale. Merge p50 **17,243 ms**, p95/p99 **672,234 ms** ; autosave p50 **18,215 ms**, p95 **22,687 ms**, p99 **38,255 ms**. Zéro erreur, zéro retry automatique.

Project exclusif : attente p95/max **648,771 ms**, détention p95/max **22,590 ms**. **R-CONT-01 reste ouvert** : un merge exclusif attend les lectures/autosaves engagées puis bloque aussi des scènes indépendantes et des commentaires. Preview/projection du graphe entier coûte sous barrière ; aucune absence de famine n’est démontrée. Huit échantillons donnent p95/p99=max ; pas de SLA ou capacité commerciale. Réseau distant, charge soutenue, enveloppe d’exploitation, multi-instance et exploitation publique restent non qualifiés.

## Parcours et vérifications d’interface

Les trois parcours Lot 4 ont réussi séparément, puis de nouveau avec les treize parcours précédents dans la campagne finale de 16 tests réussis. Alice owner, Bob author/reviewer et **Carol admin par invitation**, vraies sessions Keycloak. Carol est ajouté aux fixtures du realm et créé localement uniquement si absent par `demo:ensure-users` ; aucun compte/mot de passe existant modifié, aucun rôle projet global ni faux agent.

1. Bob compose quatre opérations par l’interface (texte, personnage, événement temporaire, relation), prévisualise et prépare explicitement les bases, puis soumet. Carol compare et approuve : canon encore inchangé. Son premier merge commite mais la réponse est volontairement perdue ; retry même clé retrouve quatre événements et deux identifiants créés. L’autosave local de Bob, retenu avant envoi, reçoit ensuite 412 : son brouillon est conservé. Historique/ChangeSet consultables. Duplication explicite contrôlée sans héritage des avis.
2. Après approbation, Bob révise la justification : ancien avis invalidé. Nouvelle soumission/revue, puis modification canonique de la scène par Alice ; merge refusé, fiche inchangée et aucun ChangeSet. Conflit marqué explicitement, preview conserve base historique et intention.
3. Reviewer prépare mais ne peut écrire directement le texte ni approuver/fusionner ; module désactivé après approbation → merge refusé sans état partiel. Puis retrait de Carol : session encore valide mais projet inaccessible, ancien avis invalidé et owner sans approbation actuelle ne peut fusionner.

Contrôles Axe ciblés, création au clavier et absence de débordement à 390 px ; captures desktop/mobile locales inspectées lors de la revue finale. Cette vérification partielle ne clôt pas l’audit ergonomique/accessibilité humain complet. Les champs et brouillons non confirmés restent en mémoire, sans récupération garantie après crash/fermeture forcée.

## Anomalies corrigées et limites des campagnes

La première campagne navigateur Lot 4 a révélé l’image `migrate` restée au Lot 3 lors d’une reconstruction limitée à API/web : tables absentes et erreurs 500. Les premiers hashes identiques ne prouvaient donc pas l’application de 0006. Reconstruction de **migrate/API/web ensemble**, migrations réellement appliquées, comparaison renouvelée et contrôle de schéma au démarrage avec 0007. Aucun reset principal, aucune migration déjà appliquée réécrite.

Autres corrections : URL /manuscripts du plan, alias YAML générés évités sans assouplir le parseur, bases historiques et références dans les diffs, preview stable, message réseau « résultat non confirmé », contraste/libellés, liens vers ressources et identifiants d’opérations distincts lors de plusieurs déplacements. Les erreurs de sélection de l’annonceur Next, de label et d’oracle symétrique de relation dans les tests ont été corrigées, sans modifier les règles métier. La validation TypeScript a également corrigé un appel IPC optionnel du processus de test.

Les tentatives échouées sont des diagnostics et ne comptent pas comme validations réussies ; résultats ci-dessus issus des campagnes rejouées. Tests/benchmarks PostgreSQL exécutés avant le navigateur qui redémarre les services. Les métriques excluent les rejeux de vérification postérieurs à la campagne. Le Chromium système précédemment instable n’a pas été employé ; navigateur fourni par Playwright utilisé.

## Fichiers, CI et réception humaine

[Inventaire complet](LOT-4-FILES.txt) : domain/contracts (politique, modèles et neuf opérations), application (projection, service, port et validateurs partagés), infrastructure (store, deux migrations et garde de schéma), API (routes), web (propositions/compositeur/diff et intégrations projet/atelier), tests/scripts (barrières, fautes, IPC, migration, contrats, navigateur, mesures/conservation), documentation/ADR/traçabilité et workflow CI.

La GitHub Action est actualisée pour les Lots 0–4, bench:proposals et les parcours ; Spike A reste isolé. **Aucun nouveau commit poussé ni nouvelle CI distante Lot 4 exécutée.** Le succès distant vérifié concerne exclusivement le commit Lot 3 41762fb. Les résultats locaux ne sont pas présentés comme une CI GitHub verte.

À valider par le propriétaire : réception technique du Lot 4 et revue des choix d’exécution [ADR-0013](adr/0013-moteur-de-propositions-et-fusion.md), parcours multi-objets valide/conflit dans son usage, ergonomie et enveloppe de charge avant généralisation. Les règles imposées (atomicité, CAS, interdiction IA et validation humaine) ne sont pas rouvertes. Réserves héritées conservées : UX manuelle complète, brouillons en mémoire, RLS non activée, révocation IdP non globale, sauvegardes/restauration/TLS et exploitation publique à qualifier. Aucune acceptation implicite des ADR proposés et **aucun Lot 5 commencé**.

## Critères d'acceptation du document

Fonctionnalités exécutables, fichiers, migrations et données conservées identifiables ; commandes et résultats réellement exécutés distingués des scénarios ; B-06/B-07 et fautes prouvent zéro état partiel ; mesures locales et limites explicites ; réception humaine et CI distante restantes sans affirmation d’accord ou de succès inexistant.
