# Audit des documents de référence

**Statut :** Audit initial du 30 octobre, complété par décisions humaines et réalisation Lots 0/1 le 31 octobre 2026 ; Lot 1 reçu avec réserves ; Lot 2 autorisé et réception attendue.
**Portée :** audit initial documentaire, puis suivi des réalisations autorisées ; historique conservé. **Références :** [PRD](PRD.md), [R-A](deep-research-analyse-fonction.md), [R-M](deep-research-modele-fonctionnel.md), [sources](RESEARCH-SOURCES.md).

## Synthèse

À l’ouverture de l’audit initial : AGENTS.md absent ; trois références lues dans l'ordre demandé. Architecture, domaine, API, sécurité et cinq ADR déjà présents et cohérents dans leurs grandes lignes. Traçabilité encore « NON_ANALYSE ». Plan, contrats machine, fixtures et tests de contrat absents. Aucun ADR accepté. Les fichiers étaient non suivis par Git ; leur présence ne vaut pas validation.

Attention aux noms : R-A expose surtout le modèle central, API et IA ; R-M expose surtout la comparaison des logiciels et le catalogue produit. La présente analyse se fonde sur les titres réels, sans inverser les fichiers.

## Analyse intégrale par section significative

| Document / sections | Lecture critique et traitement |
|---|---|
| PRD 1–2 | Hiérarchie et vision cohérentes ; PRD lui-même provisoire, aucune acceptation inventée |
| PRD 3–4 | Objectifs et acteurs ; multi-projets/rôles par projet retenus ; restriction par document reportée |
| PRD 5 | Identité scène/objet/relation et proposition conservée ; préciser versions et cardinalités |
| PRD 6 | Modules connus au MVP ; types arbitraires et plugins non assimilés à la modularité |
| PRD 7.1 | Tous PROJ MUST tracés, ownership/transfert encore à valider |
| PRD 7.2 | Tous EDIT MUST tracés ; notes, compte des mots et plan aussi nécessaires que l'éditeur |
| PRD 7.3–7.4 | Références invalides, recherche filtrée, temporalité simple ; DATA-12 et sémantique V1 |
| PRD 7.5 | Markdown + archive JSON documentée MVP ; DOCX/EPUB/import V1 |
| PRD 8 | Matrice partiellement configurable ; proposition de valeurs par défaut explicites dans sécurité |
| PRD 9.1–9.7 | IA et MCP obligatoires comme capacités MVP, facultatifs à l'usage ; secrets hors contexte |
| PRD 10 | Cycle de vie incomplet sur révision après approbation ; contrôle de concurrence et atomicité prioritaires |
| PRD 11 | Trois niveaux de vérité ; aucune croyance automatiquement déduite du texte ; pas de calendrier forcé |
| PRD 12 | Comité critique V1, malgré intérêt des exemples ; diagnostics de spécification sans livrer le module |
| PRD 13.1–13.5 | Cinq parcours repris par lots, fixtures et tests ; scénario temporel peut rester interprétatif MVP |
| PRD 14 | Parcours clavier et états d'enregistrement MUST ; pas de choix CSS prématuré |
| PRD 15 | Révocation, confidentialité, export/audit ; rétention reste ouverte avant production |
| PRD 16–16.1 | Objectifs mesurables à confirmer ; distinction durabilité courante / RPO incident majeur |
| PRD 17 | Une seule logique métier ; proposition ne donne aucun droit supplémentaire |
| PRD 18 | Autorité de périmètre MVP/V1/V2+ conservée |
| PRD 19 | Six lots initiaux ; huit lots demandés par la mission, correspondance explicite au plan |
| PRD 20 | AC-01 à AC-12 conservés et complétés, pas renumérotés |
| PRD 21 | Mesures utiles, télémétrie minimale sans texte ni objectifs commerciaux arbitraires |
| PRD 22–23 | Risques et DEC provisoires repris par ADR proposés |
| PRD 24 | Q-01 à Q-15 toutes reprises dans le registre des décisions du plan |
| PRD 25–28 | Livrables et définition de terminé vérifiés ; aucun commencement de produit |
| R-A Executive summary | API commune pertinente ; AUTO_APPLY incompatible IA MVP |
| R-A Modèle narratif central | Identité/version utiles ; faits/connaissances/révélations V1 |
| R-A Relations, contraintes et moteur | Relations de première classe retenues ; solveur et savoirs différés |
| R-A API métier, propositions et Pull Request | Preview/validation/merge retenus ; fusion 6/7 de la maquette interdite MVP |
| R-A Identité, permissions, audit et MCP/IA | Bonne séparation des acteurs ; versions MCP/SDK revérifiées via sources officielles |
| R-A Module critique et expérience collaborative | Observations subjectives distinguées ; comité/presence V1, pas de score vérité |
| R-A Architecture et roadmap | PostgreSQL/monolithe adaptés ; Redis/vectoriel/CRDT immédiats non retenus |
| R-M Synthèse / cartographie étendue | Comparaison de besoins utile ; promesses produits non considérées comme normes |
| R-M Idées remarquables (toutes sous-sections) | Vues communes, bible, extensibilité, temps, calendriers, carte, apparitions, canvas, versions, analyse classés dans traçabilité |
| R-M Catalogue fonctionnel (toutes sous-sections) | Comptes/manuscrit/éditeur/cartes/arcs/personnages/relations/lieux/bestiaire/cultures/magie/langues/recherche/inbox/statistiques/workflow/commentaires/recherche/export classés ; aucun ensemble « indispensable » ajouté automatiquement au MVP |
| R-M Architecture fonctionnelle | Entité générique typée retenue ; configuration libre réservée à une évolution |
| R-M Indispensable / important / différenciant | Priorités de recherche non équivalentes aux MUST du PRD |
| R-M Vision résultante | Vision long terme ; aucun clone ni interdépendance de tous les modules |

## Divergences, décisions proposées et alternatives

| ID | Divergence ou manque | Recommandation et raison | Échéance / statut |
|---|---|---|---|
| D01 | R-A roadmap CRDT immédiat vs PRD 8/18 | Optimiste MVP, CRDT V1 (ADR-0004) | Imposé par mission |
| D02 | AUTO_VALIDATED/AUTO_APPLY IA vs AI-11/DEC-06 | Aucun merge IA MVP, quel que soit le canal | Imposé |
| D03 | Maquette fusion partielle vs PROP-07 | Une proposition entière ; découpage futur en nouvelles propositions cohérentes | Imposé |
| D04 | R-M IA « optionnel » vs AI-01..11 MUST | Facultative pour l'auteur, capacité livrée dans le MVP | Clarification proposée |
| D05 | R-M DOCX/PDF/EPUB minimaux vs EXPORT-05 V1 | Archive ouverte MVP, formats éditoriaux V1 | PRD prévaut |
| D06 | Objets, parties, séries, canvas et types libres dits indispensables par R-M | Personnages/lieux/événements MVP ; autres versions dans matrice | PRD prévaut |
| D07 | PRD 19 six lots vs mission huit | Huit lots, correspondance conservée au plan | Mission explicite |
| D08 | Révision proposition SHOULD vs invalidation obligatoire | Révision de contenu MVP nécessaire ; proposer promotion PROP-10 MUST | À valider avant lot 4 |
| D09 | Permissions configurables sans règle merge/export | Valeurs sûres : owner/admin approuvent et fusionnent ; export owner/admin/author ; auteur seul owner s'auto-approuve | À valider avant lot 0 |
| D10 | Notes « privées auteur » du domaine vs permissions projet | Notes lisibles par membres ; aucune confidentialité par champ promise | À valider avant lot 2 |
| D11 | `create_event` domaine absent du contrat | Alias supprimé ; `create_object` avec typeKey event, une seule voie | Clarification proposée |
| D12 | Délégation « projet » / clientInfo non authentifié | Token, client enregistré, grant et membership ; champs du prompt exclus | ADR-0008 proposé |
| D13 | Incohérence temporelle illustrée avant moteur avancé | Exemple avec contrainte explicite de fixture, cible V1 pour calcul avancé ; pas de solveur MVP caché | Clarification proposée |
| D14 | Immutabilité historique vs purge/confidentialité | Append-only sous rétention ; purge autorisée documentée, jamais modification silencieuse | Avant lot 7 |
| D15 | Propositions référant des objets supprimés / modules désactivés | Tombstones, lecture autorisée, écritures module refusées, contraintes état final | Avant lots 2/4 |
| D16 | SDK moderne ≠ support universel fournisseurs | Spike C avec versions clients ; compatibilité historique éventuelle sans second domaine | Avant lot 6 |
| D17 | R-M suggère temps absolu et conversion calendrier↔timestamp ; PRD admet temps incomplet/relatif | unknown/ordinal MVP, axes et ticks propres aux calendriers ensuite ; pas de conversion grégorienne forcée | PRD prévaut |

## Exigences PRD insuffisamment justifiées par les recherches

SEC-07..14, AI-SEC, objectifs chiffrés NFR, invitations sécurisées, accessibilité clavier et restauration de sauvegarde reposent principalement sur le PRD et les contraintes de confiance du produit. Les recherches les motivent partiellement mais n'apportent ni mesure ni preuve opérationnelle. Leur nécessité est conservée ; aucune fausse citation concurrentielle n'est ajoutée.

## Modifications des documents existants

PRD et recherches conservés sans modification. Traçabilité initiale remplacée car elle déclarait les recherches non analysées. Domaine, architecture, API et sécurité enrichis en sections de consolidation qui précisent leurs règles ouvertes ; seules les contradictions D10/D11 sont corrigées dans les passages d'origine. Cinq ADR conservés, complétés ; nouveaux ADR séparant stockage, éditeur et délégation. Tous restent Proposée.

## Passe de correction et préparation des décisions humaines

Anomalie corrigée : l'extraction initiale assimilait le troisième champ des tableaux NFR à une priorité, alors qu'il contient l'objectif ; le texte intégral manquait donc aussi dans les lignes NFR du backlog et de la matrice. Le registre v2 distingue type, priorité produit, priorité de réalisation, version, texte et domaine ; les priorités absentes restent `null`. Les 150 IDs et toutes les priorités explicites du PRD sont conservés. Les séparations vides internes au tableau de backlog ont été retirées pour rétablir son rendu Markdown.

L'outillage de validation est désormais versionné dans `scripts/`, avec dépendances épinglées et tests de mutations ; aucune fonctionnalité applicative n'a été développée. [Deux patchs PRD](PRD-ALIGNMENT-PROPOSAL.md) restent non appliqués, [GO-00..02](HUMAN-DECISIONS.md) non décidés. Le risque R-CONT-01 explicite la sérialisation des scènes indépendantes ; le spike B est étendu, pas exécuté. PROP-10 demeure SHOULD.

## Risques et questions ouvertes

Sur-spécification des modules, coût du moteur de propositions, contrats OAuth/client évolutifs. Les questions produit du PRD restent visibles dans le plan ; aucun arbitrage durable n'est présenté comme accepté.

## Passage au Lot 5 — 1er novembre 2026

Instruction explicite : réception technique du Lot 4 sous réserve de sa CI et des réserves documentées ; principes ADR-0013 acceptés. Départ propre 9c2df0ba811652a48d1454eea7535f12d423bb71 ; [CI 41291953747](https://github.com/ZA512/StoryMaster/actions/runs/41291953747) vérifiée terminée avec succès validate/spike-a. Cela ne clôt ni UX, brouillons après crash, R-CONT-01, RLS, révocation IdP, sauvegardes ni qualification publique.

Autorisation en deux phases : phase A complète locale avec simulateurs, tests et UI ; phase B arrêtée jusqu’à GO-03 explicite, sans clé personnelle réelle ni appel facturable. [GO-03](GO-03-DECISION-PROPOSAL.md) présente options, sources officielles consultées et éléments à valider. ADR-0014 décrit capacité serveur, contexte/consentement bornés, BYOK enveloppe et budget prudent. Les principes ne deviennent pas un accord produit par présence d’un fichier. AGENTS, décisions et plan actualisés sans ouvrir Lot 6.

Aucun des 150 identifiants/textes/priorités/cibles ni des 100 MUST MVP et huit lots n’est modifié ; PRD, requirements et backlog conservés. Proposition IA via le moteur commun, provenance immuable et initiateur humain distinct. La règle d’auto-approbation conserve owner individuel et compare cet initiateur. Les 13 contrats MCP sont synchronisés sans serveur ; 14 outils internes ont un catalogue distinct. Migration 0008 additive ; anciennes migrations gelées, comparaison des 28 tables/colonnes préexistantes sans contenu exporté. Réserves et qualification réelle explicitement distinctes dans [rapport Phase A](LOT-5-REPORT.md).

## Alignements minimaux du Lot 6 local

Source : mission explicite de réception Lot 5 phase A et autorisation Lot 6 sans modèle. Aucun des 150 IDs, textes, priorités, versions ou lots principaux du PRD/registre/backlog n’a changé. Le séquencement commercial est dérogé explicitement, pas par inférence d’un ADR.

Écarts de contrats corrigés : scène historique renvoyée comme SceneRevision via SceneRead ; EntityRead permet une page de références inverses, incompatible avec une révision historique. HTTP/MCP emploient les mêmes paramètres/services et les treize noms restent identiques. Les grants personnels, leur provenance et leurs protections sont décrits par les schémas/générateurs et ADR-0015. L’exemple de maladie garde ses ressources/opérations narratives ; les identités synthétiques externes sont mises au format UUID et une provenance complète est ajoutée. Aucune fiction de fournisseur/modèle attesté.

Keycloak Resource Indicators émet une audience URL tandis que l’introspection contrôle clientId ∈ audience ; client ressource préenregistré identifié par cette URL, sans désactiver la vérification. La fonctionnalité reste expérimentale. Les règles publique/dynamique restent non approuvées. Refus des acteurs délégués placé avant la disponibilité de l’assistant pour produire 403, et écoute des erreurs de connexions inactives MCP ajoutée pour reprise après redémarrage PostgreSQL. Les indisponibilités IdP transitoires restent des refus 503, puis un grant révoqué reste 403 après récupération.

Le risque R-CONT-01 est explicite : lectures/préviews et merges peuvent retarder révocations et scènes indépendantes. Tests, benchmarks et limites sont reliés au rapport ; aucun test documentaire n’est compté comme test produit. Les nouveaux documents restent soumis à réception humaine, la future UX est seulement inventoriée.

## Critères d'acceptation du document

Les 28 sections du PRD et toutes les grandes sections des deux recherches ont une conclusion ; divergences identifiées sans résolution silencieuse ; le registre des sources permet de distinguer vérifié, inaccessible et hypothétique ; les livrables existants ont été lus avant modification.

## Autorisation de réalisation du 31 octobre 2026

Le propriétaire accepte GO-00..02, les deux patchs PRD et PROP-10 MUST. Ils sont appliqués, avec 150 IDs et 100 MUST MVP. Auto-hébergement Docker Compose prioritaire (remplace la recommandation SaaS initiale), Keycloak local, TypeScript/Fastify/Next.js. ADR-0001/0002/0006 acceptés, ADR-0003 accepté sur invariants avec verrou provisoire ; ADR-0008 validé uniquement pour les principes GO-02. Lot 0 seul autorisé ; aucun autre ADR accepté automatiquement. L’exigence de conception seule d’AGENTS est actualisée conformément à cette instruction utilisateur.


## Résultat de réalisation du Lot 0

Le [rapport du 31 octobre](LOT-0-REPORT.md) remplace les mentions historiques « sans application » pour le socle uniquement. Les deux patchs PRD approuvés sont appliqués ; registre/backlog/matrice et contrats sont synchronisés. ADR-0009 documente les choix d’exécution, la portée de PROJ-10 et l’absence d’outbox sans effet externe. Les contrôles de contrats nouveaux, exemples, tests et état de la CI sont versionnés ensemble. La première qualification B porte sur les métadonnées, jamais sur de fausses scènes ; les tests futurs restent futurs. La modification d’AGENTS est limitée à l’autorisation explicite reçue. Aucun autre changement de priorité produit ni acceptation implicite d’une décision n’est introduit.


## Réception du Lot 0 et Spike A — 31 octobre 2026

Instruction explicite du propriétaire : réception sous réserve de fonctionnement et CI, puis prototype A isolé. Départ Git propre sur ea27725 ; la CI GitHub correspondante est terminée avec succès et les services locaux sont sains. L’accord de réception est enregistré, les risques résiduels maintenus, sans modifier GO-00..02. AGENTS est actualisé uniquement pour refléter cette autorisation de spike et l’interdiction persistante du Lot 1 en production.

Le [rapport du Spike A](SPIKE-A-REPORT.md) consigne prototype, corpus, tests, pertes Markdown, mesures, limites et décision proposée. L’enveloppe du laboratoire et sa migration v1/v2 fictive sont distinguées du contrat Scene inchangé ; aucune décision de version de production n’est prise implicitement. ADR-0007 reste Proposée avec une recommandation GO étayée. Les dépendances restent dans spikes/editor, isolées des workspaces/images applicatives ; aucune API/authentification/permission applicative modifiée. La PostgreSQL du spike est en tmpfs, aucun volume persistant ni donnée applicative du Lot 0 réinitialisé.

## Exécution autorisée du Lot 1 — 31 octobre 2026

Le propriétaire accepte explicitement ADR-0007 et autorise Lot 1 après CI verte du commit Spike A 3f0134c. AGENTS, registre, plan et ADR sont alignés sur cette nouvelle portée ; leur ancienne interdiction du Lot 1 est remplacée, pas celle du Lot 2. Aucun autre ADR proposé n’est accepté automatiquement. JSON ProseMirror v1 conservé, Markdown dérivé, Yjs isolé. Les contrats, exemples et contrôles CI sont synchronisés avec les routes réellement implémentées.

Le risque R-CONT-01 est mesuré sur scènes indépendantes/plusieurs auteurs, gros textes et projets distincts. [ADR-0010](adr/0010-atelier-ecriture-et-concurrence.md) documente une barrière partagée limitée au texte des scènes, verrou de scène et compteur séparé ; tous changements structurels et futurs traitements multi-objets restent sous exclusivité projet. Pas de généralisation à une capacité commerciale ni d’affirmation que B-06 est testé. [Rapport](LOT-1-REPORT.md) et inventaire recensent les preuves et limitations. Les 150 exigences et leurs priorités sont conservées.

## Passage au Lot 2 — 31 octobre 2026

Le propriétaire reçoit techniquement le Lot 1 avec toutes ses réserves et accepte le principe d’ADR-0005. Prérequis vérifié avant développement : [CI 41217270049](https://github.com/ZA512/StoryMaster/actions/runs/41217270049) verte sur 4c169075bd4c976a76c32c1f94cbdbe24bace790. AGENTS.md et plan sont alignés sur cette autorisation explicite, sans accepter les autres ADR proposés. Les 150 exigences, leurs textes/priorités et lots restent inchangés ; MOD-07 COULD (présélection par genre) reste non réalisé, aucun MUST silencieusement différé.

Bible de production reliée aux scènes existantes via services communs, migration additive 0004, schémas/registre versionnés, recherche lexicale et modules non destructifs. [ADR-0011](adr/0011-referentiel-narratif-et-references.md) explicite les choix : modules initialement off, notes partagées par projet, dépendances dynamiques des liens, restauration des champs conservant le statut et révision Scene unique. Ces détails sont présentés pour réception, sans attribuer une acceptation humaine automatique à l’ADR.

Anomalies corrigées pendant vérification : migration sur base remplie refusée par PostgreSQL à cause des triggers différés (backfill déplacé après DDL, rollback initial intégral) ; notification de `setEditable` créant un faux brouillon lors du passage en lecture seule (émission supprimée) ; collision de clés React entre historique et panneau de références (clés distinctes), contraste insuffisant du panneau (corrigé). Les snapshots anciens restent absents de référence_snapshot, jamais réinterprétés comme historiques v1. Conservation effective des 61 scènes et 168 snapshots préexistants vérifiée par empreintes avant/après. Preuves, fichiers, risques et réserves dans [LOT-2-REPORT](LOT-2-REPORT.md), mesures dans [qualification](measurements/LOT-2-QUALIFICATION.md). Aucun Lot 3/4 commencé, aucune récupération durable des brouillons après crash ni audit UX manuel complet revendiqué.

## Passage au Lot 3 — 31 octobre 2026

Instruction explicite du propriétaire : réception technique du Lot 2 avec toutes les réserves maintenues et implémentation complète de la collaboration asynchrone. Départ Git propre sur 6a5864165e7db1fedfc8e10fbe96f2bb0323289d ; [CI 41231438707](https://github.com/ZA512/StoryMaster/actions/runs/41231438707) terminée avec succès avant implémentation. Ce constat ne clôt pas automatiquement la réserve de réception liée à la CI : l’utilisateur demande expressément de garder les réserves ouvertes. AGENTS/HUMAN-DECISIONS/plan sont alignés sur cette autorisation ; arrêt avant Lot 4. Aucun des 150 IDs, texte d’exigence, priorité ou lot n’est modifié.

[ADR-0012](adr/0012-collaboration-asynchrone-et-ancrages.md) décrit les choix d’exécution pour réception : lien secret en fragment puis cookie temporaire chiffré, hash seul en stockage, email IdP vérifié par session, bornes admin, invalidation transactionnelle d’anciennes invitations, historique distinct, fils/messages hors canon, ancre originale immuable et projection conservatrice bornée. ADR-0004 reste proposé, aucun nouvel ADR accepté par sa seule présence. Les passages initiaux du domaine/API/verrouillage ont été alignés sur les structures réellement implémentées pour éviter deux contrats concurrents.

Migration 0005 additive rejouée, testée depuis une vraie base 0004 remplie puis appliquée au volume existant sans suppression. Empreintes avant/après : 87 projets, 121 scènes, 337 snapshots de scène, 41 fiches, 6 relations, 28 références, 398 snapshots narratifs, 261 activations et 106 appartenances identiques sur leurs anciens champs. La migration appliquée est ensuite figée. Anciennes sessions sans preuve d’email : réauthentification requise pour accepter, sans falsifier rétroactivement l’attestation.

Anomalies corrigées pendant vérification : paramètre SQL de création de session absent ; déchiffrement d’invitation soumis à un parse strict contenant les métadonnées d’enveloppe ; cookie d’invitation non effacé après ouverture du projet ; cohérence du détail racine/fil sous lecture concurrente ; rejeu idempotent conservant un ancien corps retiré ; limite de calcul d’ancre sur gros texte ; contraste des textes d’état ; ancien lien pendant retrait contournable par un autre subject ayant le même email (liens désormais révoqués atomiquement). Les deux nouveaux tests OIDC non vérifié/string true ont d’abord attendu undefined au lieu du null contractuel, assertion corrigée sans affaiblir la vérification stricte.

[Rapport Lot 3](LOT-3-REPORT.md) distingue vérifications réelles, portions CT, fichiers, risques et décisions humaines. [Mesure mixte](measurements/LOT-3-COLLABORATION.md) conserve R-CONT-01 ouvert : attente des commandes exclusives même avec commentaires/autosaves partagés. Aucun moteur de propositions, assistant, SMTP ou serveur MCP introduit ; Yjs reste isolé. Les réserves de revue UX manuelle, brouillons en mémoire, qualification locale et absence de déploiement public restent ouvertes.


## Passage au Lot 4 — 31 octobre–1er novembre 2026

Instruction explicite du propriétaire : réception technique du Lot 3 avec réserves, acceptation des principes ADR-0012 et implémentation complète du moteur de propositions. Départ Git propre sur 41762fb760a6d10a377542cb70a6c055f16cb2cd ; [CI 41243880880](https://github.com/ZA512/StoryMaster/actions/runs/41243880880) d’abord en cours puis terminée avec succès (validate/spike-a). La condition CI du Lot 3 est constatée satisfaite ; les réserves UX, brouillons en mémoire, charge locale et absence d’exploitation publique restent ouvertes. AGENTS/HUMAN-DECISIONS/plan actualisés sur cette autorisation, sans réapprouver ADR-0004 ou les autres décisions proposées. Arrêt avant Lot 5.

Les 150 IDs, textes, priorités, cibles et lots restent inchangés, notamment 100 MUST MVP et PROP-10 MUST. Pas de modification du PRD ou du registre/backlog. [ADR-0013](adr/0013-moteur-de-propositions-et-fusion.md) explicite les alignements avec le canon existant : statuts rédactionnels configurables, rang entier de déplacement, validations partagées, preview cohérente sous verrous partagés plutôt qu’un snapshot d’autorisation antérieur, avis liés à la version d’appartenance et ChangeSet durable. Aucun langage de patch arbitraire ni moteur de règles parallèle.

Migrations additives 0006/0007, anciennes migrations 0001..0005 inchangées. Une première campagne navigateur a révélé que reconstruire seulement API/web avait laissé l’image du service migrate au Lot 3 : les tables de propositions manquaient et les appels échouaient 500. Les premières empreintes identiques ne prouvaient donc pas encore l’application de 0006. Correction : reconstruire migrate/API/web ensemble, appliquer réellement 0006, puis ajouter 0007 pour la lecture seule des métadonnées de migration et le refus d’un schéma incomplet/checksum divergent au démarrage. Comparaison réelle après ces migrations : 22 tables intégralement identiques, [preuve versionnée](measurements/LOT-4-MIGRATION.json). Les migrations appliquées sont ensuite figées ; aucun volume persistant supprimé.

Autres corrections : URL de plan /manuscripts, alias YAML générés supprimés pour rester lisibles par le validateur strict, contrastes et libellés de revue, aperçu stable avec références et base historique, message réseau « non confirmé » après résultat inconnu, identifiants d’opérations distincts dans l’historique de plusieurs déplacements. Les assertions de tests ont aussi été ajustées au contrat (null/labels/annonceur Next), sans affaiblir les règles. Les tests d’observation/terminaison de connexion utilisent le rôle applicatif propriétaire de ces connexions, sans lui accorder des privilèges supplémentaires.

Le [rapport Lot 4](LOT-4-REPORT.md) distingue les portions humaines de CT-07..16/29/33/45/48 des variantes IA/MCP non développées. Les preuves transactionnelles incluent neuf points de faute, arrêt réel du processus avant/après COMMIT, réponse perdue, concurrence/révocation/timeout, B-06 commit/rollback et B-07 merge. [Mesures locales](measurements/LOT-4-PROPOSALS.md) : attente exclusive significative malgré courte détention, R-CONT-01 maintenu. Aucun nouveau commit/CI distante Lot 4 revendiqué avant exécution correspondante ; réception humaine attendue.


## Dérogation de séquencement et Lot 6 local — 1er novembre 2026

Instruction explicite du propriétaire : Lot 5 phase A reçu techniquement avec réserves ; priorité aux parcours humains, phase B commerciale différée et GO-03 maintenu ouvert ; Lot 6 local sans LLM autorisé séparément. [CI de 58ec5a9](https://github.com/ZA512/StoryMaster/actions/runs/41303083199) vérifiée verte, départ propre. AGENTS/décisions/plan actualisés sur cette autorité ; aucune exigence, priorité ou ID changé. Ce changement de séquencement n’accepte pas tous les détails d’ADR-0008 ; exposition publique, clients non enregistrés et exploitation restent à arbitrer. Spike C réel en premier, puis catalogue/UI et qualification ; pas de refonte graphique, Ollama ou fournisseur commercial. Réception avant Lot 7.

## Instruction Lot 7 — portée et prérequis

La mission distincte reçoit Lot 6 et ADR-0015 strictement locaux et impose main uniquement. CI main e9657b3 vérifiée success, références comparées et ancienne branche sans commit unique supprimée. Le plan est corrigé : GO-04 proposé ne bloque pas développement non destructif et qualification isolée autorisés explicitement ; sa validation reste nécessaire avant politique destructive, restauration principale ou exposition publique. Aucun changement des 150 IDs, priorités, versions ou 100 MUST MVP. Les choix locaux de récupération et risques sont documentés séparément ; aucune réception finale ni approbation GO-04 déduite.

## Lot 7 — décisions, limites et corrections de consolidation

La mission autorise les outils locaux non destructifs et la vraie restauration isolée, sans approuver GO-04. L’adoption initiale de l’époque conserve toutes les données préexistantes ; les reprises créent une nouvelle époque et invalident l’autorité héritée. Le scellement write-ahead est une exception documentée pour une barrière de refus, pas un effet externe métier avant commit. Les ADR-0016..18 restent soumis à réception dans leur portée, jamais acceptés par simple présence.

Les spécifications d’archives, OpenAPI, scripts CI, runbook, proposition GO-04 et matrice de preuves sont synchronisés. La revue indépendante a révélé puis motivé la correction de deux défauts runtime, sans changement de priorité : historique administratif par acteur externe et admission trop tardive de l’authentification HTTP. Les correctifs de dépendances sont ciblés (Ajv 8.18.0, yaml 2.8.3) ; la chaîne lint minimatch reste analysée et signalée, sans migration majeure aveugle.

Les brouillons persistants chiffrés sont différés conformément à l’alternative explicitement autorisée ; le risque de perte non confirmée reste ouvert. TLS complet/SEC-07 et l’activation de l’exploitation GO-04 restent à décider, ainsi que les risques IdP/RLS/capacité/WCAG. Aucun texte du PRD ni des 150 exigences n’est modifié pour masquer ces réserves.

## Correctifs de clôture du Lot 7

Une passe de charge supplémentaire a révélé une lecture du témoin scellé avant le COMMIT : revalidation courte de la paire exacte, sans rejeu métier, avec refus durable conservé ; ADR-0016 et test PostgreSQL déterministe complétés. La première CI sur 07c8efa a échoué sur l’annulation IA simulée (26/27 navigateur). Le conflit CAS d’annulation est désormais actualisé et expliqué à l’humain ; le test force ce conflit et exige un second clic. Les échecs ne sont pas présentés comme succès. Consommation CPU/RSS du processus de benchmark ajoutée, mesures après correction distinctes des précédentes et d’une passe avec construction Docker simultanée. Aucun changement des exigences, migration appliquée ou décision produit durable.

## Première tranche UX-1 — 2 novembre 2026

Le propriétaire ajoute [uxui.md](uxui.md) et demande d’avancer dessus. La tranche commence par l’atelier : panneaux, navigation, créations inline, inspecteur et palette, sans avancer cartes, arcs ou graphe. Il choisit ensuite explicitement de garder les brouillons en mémoire : ADR-0017 et la réserve après crash restent ouverts. [ADR-0019](adr/0019-atelier-persistant-et-navigation-contextuelle.md) décrit préférences/IDs persistés et état de navigation en mémoire ; le [rapport](UX-1-REPORT.md) distingue réalisation, tests et réception.

Aucun changement des 150 exigences, du PRD, de leurs priorités ou des contrats métier. Les citations `turn…` du document utilisateur ne sont pas assimilées à des sources revérifiées ; son lien sandbox non portable est remplacé par l’emplacement local du dossier de captures. Main et travail utilisateur préservés, sans branche/PR. Aucune modification significative des consignes AGENTS.
