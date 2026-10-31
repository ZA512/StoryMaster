# Rapport de réalisation du Lot 2

**Statut :** implémentation et vérifications locales terminées ; réception humaine attendue. **Date :** 31 octobre 2026. **Références :** [décisions humaines](HUMAN-DECISIONS.md), [ADR-0011](adr/0011-referentiel-narratif-et-references.md), [plan](IMPLEMENTATION-PLAN.md), [mesures](measurements/LOT-2-QUALIFICATION.md).

## Accords, prérequis et périmètre

Le dépôt était propre sur `4c169075bd4c976a76c32c1f94cbdbe24bace790`. Avant développement, la [GitHub Action du Lot 1](https://github.com/ZA512/StoryMaster/actions/runs/41217270049) était terminée avec succès, jobs `validate` et `spike-a`. Le propriétaire reçoit techniquement ce Lot 1 avec toutes ses réserves : audit UX manuel incomplet, brouillons non confirmés en mémoire sans récupération garantie après crash, mesures locales et exploitation publique non qualifiée. ADR-0005 est accepté **en principe**, sans acceptation implicite d’ADR-0004, des détails futurs d’ADR-0008 ou des autres propositions.

Lot 2 : bible intégrée au projet et à l’atelier, trois types connus, relations, références structurées, modules et recherche lexicale. Aucun Lot 3/4 commencé ; pas d’IA, faits/croyances, calendrier avancé, vecteurs, plugins, propositions multiobjets ni serveur MCP. Yjs reste isolé dans le spike. Les 150 identifiants du PRD, leurs textes, priorités et affectations aux lots ne changent pas ; MOD-07 COULD reste non réalisé.

## Fonctionnement livré

Depuis le projet ou l’atelier, ouvrir **Bible narrative**, puis **Modules** : owner/admin active Personnages, Lieux et Chronologie. Ils sont initialement désactivés, y compris dans les projets existants ; l’initialisation est attribuée au système. Une désactivation conserve toutes les fiches, archives, relations, références et versions ; lecture, recherche, historique et export restent soumis aux droits habituels. Les mutations du module sont suspendues, puis retrouvées après réactivation. Pas de dépendance dure arbitraire entre les trois modules ; chaque mutation d’un lien vérifie les modules concernés.

Les fiches ont ID stable, type, schéma v1, nom, résumé, attributs typés, notes partagées par projet, statut active/archived, révision et historique attribué. Personnages : alias, description, rôle, motivations, objectifs, conflits et caractéristiques. Lieux : description, catégorie, caractéristiques et parent facultatif ; graphe acyclique, enfants et scènes associés. Événements : description, repère unknown ou ordinal, statut et chronologie indépendante de l’ordre du manuscrit. Restaurer les champs d’une fiche active crée r+1 ; le statut actuel est conservé, une fiche archivée doit d’abord être réactivée par un responsable.

Catalogue exact : related_to symétrique canonique, knows social orienté, located_in personnage/événement → lieu avec une seule cible active, participates_in personnage → événement, precedes événement → événement acyclique et compatible avec deux ordinaux connus. Les relations ont versions/historique, retrait conservateur et rétablissement. Aucun texte descriptif n’est converti en fait canonique.

Sous le texte de la scène, **Repères de cette scène** permet Présence, Mention, Point de vue, Cadre et Événement raconté. Le remplacement explicite est préconditionné par la révision de scène et les versions des cibles ; il ne met à jour que revision/updatedAt de Scene. Texte, hash et compte de mots ne sont pas réécrits. Le snapshot cohérent conserve texte **et** références, dans la même transaction que ChangeSet direct, audit et idempotence. Retirer/réajouter un couple garde l’identité de la référence. Les liens directs et inverses survivent aux renommages et déplacements ; archives/modules off sont signalés inactifs.

Recherche PostgreSQL sur contenu courant des scènes, noms, alias, descriptions et notes autorisés ; filtres type/statut et projet porté par la route. Pagination signée liée à utilisateur/projet/rôle/requête/filtres, droits relus à chaque page. Aucun compteur global ni extrait interprojets. Extraits texte React, sans HTML exécutable ; anciennes versions consultables séparément. Export narratif JSON v1 actuel, archives/tombstones/modules compris, historyIncluded=false ; complète l’export éditorial v1 compatible, sans se prétendre archive complète ou sauvegarde d’exploitation.

## Transactions, contrats et conservation

Services communs NarrativeService/EditorialService, aucun SQL dans les routes. Lectures membres autorisés ; écritures humaines owner/admin/author ; archives de fiches et modules owner/admin ; export owner/admin/author. Refus de toute écriture directe IA, y compris sous identité owner. Session et droits relus après la barrière projet. PostgreSQL : FK composites, uniques de graphe, snapshots append-only et contraintes différées de cohérence réelle du contenu.

Migration additive `0004-narrative.sql`, empreinte protégée et rejeu vérifié ; aucun volume supprimé et aucune réinitialisation de la base principale. **61 scènes et 168 snapshots préexistants conservés à l’identique**, [empreintes SHA-256 avant/après comparées](measurements/LOT-2-MIGRATION.json). Les anciens snapshots restent reference_snapshot=NULL et conservent leur ancien format ; aucune référence historique n’est inventée rétroactivement. Une projection lexicale dérivée est calculée sans réécrire texte canonique ni versions.

OpenAPI **0.5.0**, schémas JSON et catalogue des **13 futurs outils MCP** synchronisés. Les nouvelles écritures directes imposent UUID existants, corps fermés, schéma v1, Origin/CSRF, idempotence et If-Match fort sur ressources existantes ; révisions des dépendances obligatoires. Le registre v1 publié est livré dans docs/contracts, comparé à Zod en CI et stocké en lecture seule pour le rôle applicatif. Son évolution demande version/migration nouvelles.

## Validations effectivement exécutées

| Contrôle | Résultat local observé |
|---|---|
| `npm run typecheck` | Réussi, API/packages et web |
| `npm run lint` | Réussi, ESLint, architecture et trois générateurs en `--check` |
| `DOCUMENT_PYTHON=… npm test` | **83 tests passés**, zéro échec ; Lots 0/1 et ajouts Lot 2 sur vraie PostgreSQL |
| Contrats HTTP observés | **46 réponses Lot 2 + 24 Lot 1** validées contre OpenAPI ; pas seulement des fixtures |
| `python scripts/validate_specifications.py` | Réussi, JSON/YAML/JSON Schema/OpenAPI/MCP, 150 IDs/100 MUST MVP, valeurs/texte/lots/parité/liens |
| `python -m unittest discover -s scripts/tests -v` | **29 tests du validateur passés**, distincts des tests produit |
| `docker compose … build` et `up -d --wait` | Réussis ; PostgreSQL/Keycloak/API/web fonctionnels, migration principale appliquée sans reset |
| `bench:contention`, `bench:scenes` | Rejoués avec succès ; intégrité et variantes de barrières du Lot 1 conservées |
| `bench:narrative` | 10 000 objets, 120 recherches ; charge mixte et invariants vérifiés, [résultats](measurements/LOT-2-QUALIFICATION.json) |
| `npm run test:e2e` | **11 parcours passés**, zéro échec ; OIDC réel, Lots 0/1/2, Axe, clavier, deux auteurs et redémarrage |
| Redémarrage sans suppression de volume | PostgreSQL puis Keycloak/API/web : texte, hash, références, snapshot, module off et recherche conservés ; nouvelle connexion OIDC réussie |

Les 83 tests incluent schémas des trois types, cycles de lieux sous concurrence, cardinalité de localisation, précédences opposées concurrentes, archive/historique/restauration, navigation inverse stable, isolation des projets/extraits/curseurs, rôles et IA, désactivation non destructive, rollback après échec audit et validation, contraintes DB et migration d’un Lot 1 rempli. Deux courses forcées texte/références observent l’attente PostgreSQL dans les deux ordres : une seule commande gagne, l’autre reçoit 412 ; texte et références du snapshot correspondent exactement au commit gagnant. Les six courses libres et les contrôles historiques des Lots 0/1 complètent cette preuve.

Navigateur réel Playwright/Keycloak : création des trois types, parent et cycle refusé avec champs conservés, chronologie, relations, scène↔objet, renommage/archive/historique, recherche au clavier, off/on, conflit de deux auteurs, brouillon et sélection préservés, réponse perdue rejouée avec la même clé sans seconde révision. Contrôles lecteurs, captures bureau/mobile, absence de débordement horizontal et Axe s’ajoutent aux parcours du Lot 1 ; ils ne constituent pas un audit UX manuel complet.

Le workflow GitHub Actions comprend les nouveaux tests et benchmark. **La nouvelle CI distante n’a pas été exécutée pour ces changements non commités/non poussés** ; aucun succès distant du Lot 2 n’est revendiqué. Les résultats locaux et la CI antérieure du Lot 1 sont distingués.

## Exigences et scénarios

| Exigences Lot 2 | Réalisation / preuve |
|---|---|
| OBJ-04/05/06, PROJ-09, MOD-01..04 | Registre, activations et conservation ; PostgreSQL + parcours modules |
| DATA-01..03/08/11 | Fiches typées, histoire et chronologie ; PostgreSQL, HTTP et navigateur |
| DATA-04..06/09, EDIT-08, UX-04 | Relations et références typées, liens stables/inactifs, inverse et révision cohérente ; concurrence, rollback et navigation |
| DATA-07, SEARCH-01..04 | Recherche courante, filtres, curseurs, snippets autorisés ; isolation PostgreSQL/HTTP et parcours clavier |
| MOD-05/06, DATA-10, SEARCH-05 | Dépendances de liens, schémas spécialisés et relations visibles ; réalisés sans modifier leur priorité SHOULD |
| MOD-07 COULD | Présélection par genre non réalisée ; aucune priorité modifiée |
| NFR-03 et NFR-11 | Mesure locale et socle versionné ; pas de certification production ni d’extension future déjà éprouvée |

Portions applicables : CT-03 recherche confidentielle, CT-16 liens interprojets directs, CT-25 désactivation, CT-31 curseurs, CT-42 FK/pool/contextes, CT-46 rename/move, CT-48 cycles/cardinalités concurrents. CT-10 reste validate/submit de **proposition** : seule la validation invalide transversale est exercée sur commandes directes, sa route future n’est pas exécutée. Les variantes proposition/tempId de CT-16/48 et le serveur MCP restent futurs. Les [scénarios déclaratifs](spec/lot2-scenarios.json) et exemples ne sont jamais comptés comme tests produit passés.

## Anomalies corrigées

- Migration sur base remplie : PostgreSQL refusait ALTER TABLE après un backfill déclenchant les contraintes différées. Première tentative intégralement annulée ; backfill déplacé après DDL, puis test de migration pré-Lot 2 rempli et comparaison des données principales ajoutés.
- `setEditable` déclenchait un onUpdate artificiel de Tiptap, créant un faux brouillon et empêchant une relecture après conflit. Émission supprimée, courses navigateur et non-régressions rejouées.
- Historique et panneau de références partageaient une clé React : affichages orphelins après plusieurs ouvertures. Clés distinctes et assertion d’un seul panneau dans le parcours Lot 1.
- Contraste du sous-titre de panneau corrigé après Axe. Références de comparaison/historique affichées avec nom courant autorisé, pas seulement un ID.
- Sélection de références gardée en mémoire par utilisateur/projet/scène pendant navigation interne et concentration ; aucun changement de base automatique ne remplace un brouillon de texte en attente.
- Rejeu d’une réponse perdue conserve même corps/clé ; après succès confirmé une nouvelle intention utilise une nouvelle clé. Les réponses HTTP exposent les références réelles, les anciens snapshots restent lisibles.
- La campagne de connexions dépasse légitimement 10 demandes/minute : attente bornée du Retry-After dans les tests, protection applicative conservée.

## Mesures, risques et limites résiduelles

Recherche : p50 **23,409 ms**, p95 **25,229 ms**, p99 **27,563 ms**, max 35,289 ms, zéro erreur sur corpus synthétique de 10 000 objets ; sous la cible NFR-03 < 2 s dans cette enveloppe. Charge mixte : 96 autosaves indépendants, 16 références et 16 bascules de module sans perte/retry/erreur ; autosave p95 **81,288 ms**, attente exclusive max **637,282 ms**, détention exclusive max **16,253 ms**. [Méthode et percentiles complets](measurements/LOT-2-QUALIFICATION.md).

**R-CONT-01 reste ouvert** : toute mutation narrative/graphe prend Project exclusif, donc attend et peut retarder les autosaves de toutes les scènes du projet. Le texte seul garde Project partagé puis Scene exclusif. Aucun invariant affaibli pour gagner en débit. Les lectures/indexations longues et les projets très denses demandent une qualification supplémentaire avant exploitation ; les mesures locales ne prouvent pas la performance réseau, multi-instance ou sur toute taille de document.

Brouillons de texte, formulaires et sélections non confirmés : mémoire du navigateur, sans récupération durable garantie après crash. Téléchargement de secours et avertissement de sortie ; aucune promesse hors ligne. Pagination non figée entre requêtes ; les changements peuvent modifier l’ordre des résultats. Bornes techniques : 100 éléments/page, 500 associations/scène, 32 MiB export direct ; extrait jusqu’à 4 000 caractères calculé sur les premiers 200 000 caractères, index sur texte complet. Schémas et modules connus seulement ; pas de champs arbitraires ni confidentialité par champ. Déploiement public, sauvegarde/restauration d’exploitation et audit UX manuel restent à qualifier, comme au Lot 1.

## Éléments à réceptionner par le propriétaire

Valider le parcours réel dans l’application : activer modules, créer et relier les trois types, retrouver leurs scènes, rechercher, consulter les versions, désactiver/réactiver et continuer l’écriture. Recevoir les détails formalisés dans ADR-0011 (modules initialement off, notes partagées par projet, révision Scene unique, restore du texte conservant les références courantes), avec les réserves de contention, performance locale et brouillons en mémoire. La réception ne vaut pas audit UX manuel complet, certification d’exploitation ni acceptation des autres ADR proposés.

**Arrêt avant Lot 3.** Son démarrage exige une nouvelle autorisation après réception humaine du Lot 2. Aucun accord humain n’est déduit de la présence de ce rapport ou d’un test réussi.

## Fichiers modifiés

L’inventaire ci-dessous comprend sources applicatives, migration, contrats générés, tests, mesures et documentation ; les journaux/captures locaux et `.env` restent ignorés. Aucun fichier du PRD ou du registre des 150 exigences n’a été modifié.

- `.github/workflows/validation.yaml`
- `AGENTS.md`
- `README.md`
- `apps/api/src/app.ts`
- `apps/api/src/narrative.ts`
- `apps/web/app/globals.css`
- `apps/web/app/projets/[projectId]/bible/[objectId]/page.tsx`
- `apps/web/app/projets/[projectId]/bible/page.tsx`
- `apps/web/app/projets/[projectId]/page.tsx`
- `apps/web/components/narrative/detail.tsx`
- `apps/web/components/narrative/history.tsx`
- `apps/web/components/narrative/home.tsx`
- `apps/web/components/narrative/object-form.tsx`
- `apps/web/components/narrative/scene-references.tsx`
- `apps/web/components/narrative/shared.tsx`
- `apps/web/components/writer/drafts.ts`
- `apps/web/components/writer/history.tsx`
- `apps/web/components/writer/text-editor.tsx`
- `apps/web/components/writer/writer.tsx`
- `docs/API-CONTRACTS.md`
- `docs/ARCHITECTURE.md`
- `docs/CONTRACT-TESTS.md`
- `docs/DOCUMENT-AUDIT.md`
- `docs/DOMAIN-MODEL.md`
- `docs/HUMAN-DECISIONS.md`
- `docs/IMPLEMENTATION-PLAN.md`
- `docs/LOT-2-REPORT.md`
- `docs/RESEARCH-TRACEABILITY.md`
- `docs/SECURITY-MODEL.md`
- `docs/SPECIFICATION-VALIDATION.md`
- `docs/adr/0005-modules-et-schemas-versionnes.md`
- `docs/adr/0011-referentiel-narratif-et-references.md`
- `docs/adr/README.md`
- `docs/examples/lot2-http.json`
- `docs/measurements/LOT-2-MIGRATION.json`
- `docs/measurements/LOT-2-QUALIFICATION.json`
- `docs/measurements/LOT-2-QUALIFICATION.md`
- `docs/spec/README.md`
- `docs/spec/lot2-scenarios.json`
- `docs/spec/mcp-tools.json`
- `docs/spec/module-registry.v1.json`
- `docs/spec/openapi.yaml`
- `docs/spec/operations.schema.json`
- `package.json`
- `packages/application/src/cursor.ts`
- `packages/application/src/editorial-ports.ts`
- `packages/application/src/editorial.ts`
- `packages/application/src/index.ts`
- `packages/application/src/narrative-ports.ts`
- `packages/application/src/narrative.ts`
- `packages/application/src/project-access.ts`
- `packages/contracts/src/editorial.ts`
- `packages/contracts/src/index.ts`
- `packages/contracts/src/module-registry.v1.json`
- `packages/contracts/src/narrative.ts`
- `packages/domain/src/index.ts`
- `packages/domain/src/narrative.ts`
- `packages/editor/src/document.ts`
- `packages/infrastructure/migrations/0004-narrative.sql`
- `packages/infrastructure/src/database.ts`
- `packages/infrastructure/src/editorial.ts`
- `packages/infrastructure/src/narrative.ts`
- `scripts/README.md`
- `scripts/measure-narrative.ts`
- `scripts/publish-narrative-registry.ts`
- `scripts/sync-editorial-contracts.mjs`
- `scripts/sync-narrative-contracts.mjs`
- `scripts/tests/test_validate_specifications.py`
- `scripts/validate_specifications.py`
- `tests/autosave.test.ts`
- `tests/e2e/lot1-restart.spec.ts`
- `tests/e2e/lot1.spec.ts`
- `tests/e2e/lot2.spec.ts`
- `tests/foundations.test.ts`
- `tests/narrative-http.test.ts`
- `tests/narrative-migration.test.ts`
- `tests/narrative.helper.ts`
- `tests/narrative.test.ts`

## Critères d'acceptation du document

Le propriétaire peut distinguer fonctionnalités opérationnelles, preuves effectivement exécutées, scénarios futurs, données préservées, limites techniques, risques et décisions restant à recevoir. Les résultats locaux ne se substituent ni à une CI distante nouvelle ni à sa réception humaine ; aucune intégrité/isolation/persistance défaillante ne peut être masquée par un décompte de tests.
