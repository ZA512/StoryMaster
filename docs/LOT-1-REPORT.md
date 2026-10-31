# Rapport de réalisation du Lot 1

**Date :** 31 octobre 2026, Europe/Paris. **Statut :** Lot 1 implémenté et vérifié localement ; réception humaine attendue avant Lot 2. **Arrêt :** aucun Lot 2 commencé. **Références :** [démarrage](../README.md), [décisions humaines](HUMAN-DECISIONS.md), [plan](IMPLEMENTATION-PLAN.md), [ADR-0007 accepté](adr/0007-stockage-editeur-et-diff.md), [ADR-0010](adr/0010-atelier-ecriture-et-concurrence.md), [inventaire exhaustif](LOT-1-FILES.txt).

## Résultat livré

L’atelier fonctionne sur les mêmes identité, projets privés, permissions, API métier et PostgreSQL que le Lot 0. Ouvrir un projet puis **Ouvrir l’atelier d’écriture** : plusieurs manuscrits, chapitres et scènes, plan, ouverture directe par `?scene=ID`, création, titre/résumé/statut, réordonnancement, déplacement entre parents, archivage confirmé et réactivation. Les identifiants et textes sont conservés ; les versions structurelles des deux parents protègent les déplacements. Les statuts rédactionnels sont configurables par manuscrit pour owner/admin, sans retirer un statut utilisé.

L’éditeur production utilise Tiptap/ProseMirror JSON v1 : paragraphes, titres 1–6, gras/italique/barré, liens autorisés, listes, citations et sauts de ligne ; clavier, historique undo/redo local et mode concentration. L’interface reprend papier/sauge et typographie littéraire, adapte le plan sur mobile et rend les états de sauvegarde visibles. Les compteurs enregistrés sont calculés depuis le JSON canonique côté serveur ; ceux de chapitre/manuscrit totalisent les scènes actives. Le compteur du brouillon et les diffs sont calculés en Worker, hors chemin de saisie/sauvegarde.

L’historique affiche auteur, date, révision et provenance, lit les snapshots et compare deux versions. Diff riche avec détails de structure/marques/destination de lien ; fallback explicite si alignement ambigu ou budget dépassé, avec versions intégrales avant/après. **Restaurer le texte** crée r+1 et conserve titre/statut/emplacement actuels ; le libellé l’explique. Les exports fournissent Markdown ordonné avec avertissements de pertes et JSON éditorial v1 avec structure, IDs, ordre, archives et contenu courant. Ce JSON n’inclut ni historique ni archive complète de projet ; son contenu encodé est validé contre `EditorialJsonExport` dans les tests HTTP.

Aucune entité/référence narrative du Lot 2, proposition, commentaire, IA, adaptateur MCP, coédition CRDT, recherche vectorielle, DOCX/EPUB ou import n’est ajouté. `references: []` reste vide. Le paquet production partage les utilitaires éprouvés du spike, sans importer son serveur, magasin, format expérimental ou Yjs.

## Exigences couvertes et preuves

| Exigences du lot | Réalisation et limites | Preuves |
|---|---|---|
| OBJ-03, EDIT-01/05/06 | Hiérarchie multi-manuscrits, métadonnées, plan, déplacements/ordre et archive ; IDs stables. Liens narratifs futurs absents et à vérifier au Lot 2. | Tests PostgreSQL d’organisation/déplacement ; parcours navigateur de réorganisation |
| EDIT-02/07/10/11, UX-01/08 | Éditeur riche/long, compteurs trois niveaux, accès direct, statuts et concentration | Corpus serveur/PG, longue scène et interface clavier/mobile |
| OBJ-09, EDIT-03, COLLAB-03, UX-02/03, NFR-01 | Autosave, CAS, générations, idempotence, brouillons et snapshots durables ; garanties limitées aux saves confirmés et fonctionnement/restart testés | 8 tests du contrôleur, concurrence PG, réponse perdue, 412, coupure PG et redémarrage réel |
| EDIT-04/12 | Historique auteur/date, comparaison riche/fallback, restore du texte r+1 avec provenance | Tests PG, corpus de diff et parcours historique/restore |
| EXPORT-01 | Markdown ordonné avec avertissements et JSON éditorial versionné ; pas d’archive complète | Validation HTTP du JSON encodé, égalité du contenu canonique et téléchargements navigateur |
| UX-05, SEC-13 | Confirmation d’archive/restauration, droits serveur, schéma fermé et rendu sans HTML actif | Rôles/interprojets/IA sur PG/HTTP, corpus riche et liens dangereux refusés |
| NFR-04 | Retour visible local mesuré sous 2 s ; pas de garantie générale sous réseau distant/charge soutenue | Mesures Chromium et comparaison B-01..05 avec enveloppe explicite |

## Sauvegarde, concurrence et sécurité

Autosave après 600 ms de pause ; une demande en vol par scène. Une réponse ne confirme que sa génération, sans écraser une frappe ultérieure ni le texte d’une autre scène. Les brouillons non confirmés survivent aux changements de scène et à la navigation interne dans l’onglet. Une réponse perdue se rejoue avec corps/révision/clé identiques ; un 412 arrête l’automatisme, conserve le brouillon, charge la version serveur et impose un choix explicite. Réenregistrer le texte réconcilié utilise la révision serveur affichée ; une nouvelle modification concurrente produit un nouveau 412. Les erreurs proposent réessai et téléchargement du brouillon. Les requêtes web expirent au bout de 20 s ; aucune réponse inconnue n’est traitée comme succès.

Le navigateur avertit avant fermeture/rechargement avec modifications non confirmées ; la déconnexion demande confirmation avant de révoquer la session. Les brouillons restent en mémoire, sans localStorage/sessionStorage. **Pas de garantie hors ligne, après fermeture forcée, crash du navigateur ou extinction avant acquittement.** Une sauvegarde confirmée possède déjà son snapshot durable ; la vérification de redémarrage contrôle contenu/hash/révision et snapshot via les API réelles.

Chaque mutation est authentifiée, autorisée, révisionnée et auditée dans le projet. Les cinq rôles humains lisent ; owner/admin/author écrivent/restaurent/exportent ; owner/admin archivent et configurent les statuts. Une identité IA est refusée même par HTTP. Les sessions et droits sont relus après la barrière. JSON strict : nœuds/marques/attributs inconnus refusés, liens limités à http/https/mailto sûrs, aucune suppression silencieuse ; Unicode composé/décomposé, emoji, espaces et ponctuation sont conservés. Le rendu readonly utilise React, sans HTML narratif injecté. CSP reste active.

Transaction de save/restore : scène, hash/compteur, révision, snapshot, ChangeSet éditorial direct, audit, compteur de publication et réponse d’idempotence sont atomiques. Les snapshots/audits sont append-only pour le rôle applicatif ; une contrainte différée vérifie l’égalité du snapshot courant avec contenu et métadonnées au commit. Aucun effet externe ne requiert d’outbox dans ce lot. Ces événements directs n’implémentent pas le moteur de propositions futur.

## Contention et choix du verrou

[Mesures détaillées et données brutes](measurements/LOT-1-CONTENTION.md). B-01..05 exécutés sur les services de production et PostgreSQL 18.6 : auteurs distincts, scènes indépendantes, 1/2/4/8/16 auteurs, témoin interprojets, stress de huit scènes de 3 000 blocs (913 916 octets), conflit légitime sur une scène. Zéro erreur inattendue et zéro retry dans les cas de charge ; tous les auteurs terminent. Vérification des contenus attendus/hashes/snapshots et séquences exactes de révisions, pas seulement des décomptes.

La comparaison montre la contention du verrou global : attente projet p95 de 1 010 ms sur les gros textes indépendants. La stratégie retenue est **Project partagé puis Scene exclusive** uniquement pour save/restore du texte ; structure/métadonnées/archive et futurs traitements multi-objets restent sous **Project exclusif**. Le compteur de publication est dans une table séparée pour éviter une conversion de verrou projet et des deadlocks. Plan/export lisent scènes et compteur sur un même snapshot SQL. La barrière de sécurité, les révocations et les futures écritures multi-objets sont préservées ; ADR-0003 est précisé par ADR-0010.

| Cas | Projet exclusif | Projet partagé + scène |
|---|---:|---:|
| 8 auteurs, 64 blocs : latence p95 | 78,9 ms | 50,1 ms |
| 16 auteurs, 64 blocs : p95 / p99 | 153,0 / 159,4 ms | 150,3 / 240,3 ms |
| 8 auteurs, 3 000 blocs : latence p95 | 1 309,5 ms | 1 118,7 ms |
| Stress long : attente projet p95 | 1 009,6 ms | 61,1 ms |
| Stress long : débit | 7,07 écritures/s | 10,58 écritures/s |

Le gain n’est pas uniforme : à 16 auteurs, le p99 est plus élevé avec la stratégie fine malgré débit doublé. CPU/JSON, snapshots/WAL et compteur final restent coûteux. Pas de famine observée dans ces rafales finies ; cela ne prouve pas l’absence de famine sous toute charge soutenue. Environnement local unique, corpus synthétique, ordre exclusif puis fin, effets de cache/JIT et peu de répétitions : **qualification limitée à cette enveloppe technique**, sans promesse commerciale ou de réseau distant. Les limites déclarées doivent être réceptionnées par le propriétaire avant élargissement.

B-02 constate réellement l’attente globale puis le commit d’une scène indépendante avant libération de l’autre sous la stratégie fine. B-07 autosave vérifie révocations pendant attente et timeout PostgreSQL réel de 5 s, erreur 503 explicite et reprise idempotente. **B-06 propositions, ainsi que sa variante de révocation/timeout pendant merge, ne sont pas exécutés** ; ils restent au Lot 4.

## Fichiers modifiés

L’[inventaire exhaustif](LOT-1-FILES.txt) est établi depuis l’état Git final, sans dépendances/caches/captures locaux. Principaux groupes :

| Groupe | Fichiers et rôle |
|---|---|
| Production éditeur | `packages/editor/` : schéma, validation, Unicode, comptage, diff et Markdown ; pins libres identiques au spike qualifié |
| Métier et contrats | `packages/domain/src/index.ts`, `packages/application/src/editorial*.ts`, `packages/contracts/src/editorial.ts` : types, permissions, cas d’usage et ports communs |
| PostgreSQL | `packages/infrastructure/src/editorial.ts`, `database.ts`, migrations additives `0002-editorial.sql` et `0003-editorial-clock.sql` ; 0001 préservée |
| API et web | `apps/api/src/editorial.ts`, `app.ts`, atelier `apps/web/components/writer/`, route d’écriture, shell/session, style et lien depuis le projet |
| Contrats et outillage | OpenAPI 0.4.0, définitions partagées MCP, exemples Lot 1, générateur de contrats, validateurs documentaire/runtime et leurs mutations |
| Tests | autosave, corpus riche de production, PostgreSQL éditorial, réponses HTTP, parcours Chromium et redémarrage réel |
| Environnement/CI | manifests/lockfile, Dockerfile, TypeScript, garde d’architecture, Playwright et workflow complet Lots 0/1 + Spike A isolé |
| Références et livraison | AGENTS, décisions, ADR-0003/0007/0010, plan, architecture, domaine, sécurité, API, traçabilité/audit, README et rapports |

Les 150 IDs, textes, priorités et versions cibles du registre/PRD sont inchangés. Les migrations sont incrémentales, rejouables et appliquées au volume principal existant ; aucune réinitialisation de ce volume ni `down --volumes`. Seule la base dédiée `_test` est réinitialisée par les tests. Disque vérifié avant builds : environ 44 Gio disponibles, environ 43 Gio après vérifications.

## Validations effectivement exécutées

Les campagnes finales ci-dessous sont exécutées ; PostgreSQL et redémarrage sont lancés séquentiellement. Environnement réel local : PostgreSQL, Keycloak, Fastify, Next.js, Chromium système puis Chrome for Testing fourni par Playwright pour la campagne finale ; aucun mock de permissions/concurrence/persistance. Les 50 CT déclaratifs ne sont pas tous des tests produit exécutés.

| Commande / preuve | Résultat final |
|---|---|
| `python scripts/validate_specifications.py` | Réussi : JSON/Schema/OpenAPI/MCP, 150 IDs/100 MUST MVP, valeurs, lots, cohérence et liens |
| `python -m unittest discover -s scripts/tests -v` | 25 tests du validateur réussis ; mutations Lot 1 incluses |
| `npm run lint` et `npm run typecheck` | Réussi sur état final |
| Docker Compose `up -d --build --wait` | Build production réussi ; migrations appliquées, services sains |
| `DOCUMENT_PYTHON=… npm test` | 60 tests réussis lors de la campagne séquentielle ; PostgreSQL réel, OIDC, autosave et corpus inclus |
| Réponses HTTP observées | 24 réponses éditoriales observées conformes, plus contrôles Lot 0 ; JSON encodé exporté aussi validé |
| `npm run bench:scenes` | Deux stratégies comparées ; résultats versionnés, zéro erreur de charge inattendue |
| `npm run test:e2e` | 8 parcours réussis avec Chrome for Testing 156.0.8078.4 fourni par Playwright ; restart et nouvelle connexion OIDC inclus |
| `git diff --check` | Réussi sur état final |

NFR-04, mesures web locales effectives incluant le debounce : **797 ms** pour la scène courte et **820 ms** pour 1 200 paragraphes dans la campagne finale. Deux observations, pas un p95 sous charge réseau distante. Les 8 parcours couvrent aussi les erreurs/réponses tardives, les conflits, les permissions, les exports, la restauration, le clavier, les contrastes automatisés, la largeur mobile et le corpus riche (structure/marques préservées, HTML narratif littéral non exécuté, lien actif refusé).

Le scénario de durabilité redémarre PostgreSQL puis l’IdP de développement/API/web, sans supprimer de volume, vérifie le texte et son snapshot, puis une **nouvelle connexion OIDC**. Une première passe avait révélé des connexions du pool Keycloak rompues après redémarrage du seul PostgreSQL ; relancer l’IdP local rétablit son pool avant contrôle. Cela ne qualifie pas une exploitation publique hautement disponible. Les campagnes PostgreSQL et redémarrage utilisent le même serveur et doivent être exécutées séquentiellement ; une tentative en parallèle a été invalidée et rejouée.

Incident du navigateur système : `coredumpctl` confirme un SIGSEGV de Chromium à l’ouverture d’un second contexte du test Lot 0 (11:08:51 CET). La pile est non symbolisée ; cause précise non établie, aucun événement OOM trouvé, environ 43 Gio de disque disponibles. Aucun diagnostic ne permet d’attribuer ce crash au disque ou à StoryMaster. Pas d’extraction ni publication du core, aucune reconfiguration système. La campagne complète a ensuite réussi avec le navigateur Playwright utilisé par la CI.

Pas d’exécution distante revendiquée pour ces changements non poussés. La [CI du commit de départ 3f0134c](https://github.com/ZA512/StoryMaster/actions/runs/41187721831) était verte et satisfait le prérequis. Le workflow est étendu pour exécuter les nouveaux tests après commit/push ; il conserve les contrôles du Lot 0 et du Spike A.

## Anomalies corrigées et limites

- Autosave : générations d’acquittement, demandes en vol par scène, conservation du corps et de la clé après réponse perdue, absence de succès sur 412 et conservation du brouillon.
- Concurrence : sérialisation de scènes indépendantes sous exclusivité globale ; risque de conversion de verrou évité par compteur séparé, CAS de scène indépendant des versions d’ordre des voisins.
- Transactions : rollback sur échec audit et interruption réelle de connexion ; connexion cassée retirée du pool, erreur transitoire normalisée, même clé réutilisable sans doublon.
- Contrats : DTO d’acquittement compact, corps stricts, deux versions parent exigées, exemples et MCP synchronisés, JSON éditorial encodé validé au-delà du wrapper HTTP.
- Accessibilité : trois petits libellés du plan insuffisamment contrastés corrigés ; contrôles automatiques/clavier et largeurs mobile vérifiés. Cela ne remplace pas un audit manuel exhaustif avec lecteur d’écran.
- Gouvernance : ADR-0007 et autorisation du Lot 1 correctement répercutés ; aucune priorité modifiée, aucun autre ADR proposé accepté tacitement.

Limites techniques explicites : JSON canonique 2 Mio/scène, profondeur 32, 50 000 nœuds, 1 000 000 unités UTF-16/nœud texte ; refus sans troncature. Export direct plafonné à 32 Mio de contenu canonique cumulé ; JSON éditorial conserve les archives, Markdown exclut les chapitres et scènes archivés. Ces bornes doivent être réévaluées sur nouveaux corpus ; aucun quota commercial inventé. Diff détaillé borné à 2 000 blocs avec fallback intégral. Le comptage utilise les segments de mots français d’Intl.Segmenter.

Restent hors qualification : capacité multi-machine ou réseau distant, longues campagnes mixtes, durabilité matérielle/backups/reprise après sinistre, accès public, disponibilité NFR-06, audit complet WCAG, sémantique/V1 et propositions/MCP futurs. Les réserves héritées du Lot 0 (dont RLS non activée et révocation IdP non globale des sessions applicatives) restent documentées ; aucun contournement introduit pour réussir les tests.

## Éléments à réceptionner par le propriétaire

1. Présentation et ergonomie de l’atelier, plan, statuts, mode concentration et affichage des différences/fallbacks.
2. Comportement de conflit : choix explicite, téléchargement du brouillon, limites de conservation dans l’onglet ; restauration du texte avec métadonnées actuelles.
3. Portée des exports et bornes techniques ; enveloppe locale de contention, coûts/p99 résiduels et stratégie limitée aux écritures de texte.
4. Réception du Lot 1 et **autorisation distincte du Lot 2**. Aucun démarrage automatique de ce dernier ; aucun nouvel accord demandé pour les invariants déjà approuvés.

## Critères d'acceptation du document

Sources d’autorisation, résultat concret, fichiers, commandes exécutées, mesures et limites distingués ; anomalies reliées aux tests ; décisions humaines restantes explicites. Aucune promesse de capacité universelle, d’exécution des CT futurs ou de CI distante non réalisée.
