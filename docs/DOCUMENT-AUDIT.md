# Audit des documents de référence

**Statut :** Audit terminé ; arbitrages proposés, non validés. **Date :** 30 octobre 2026.
**Portée :** documents présents, aucune application existante. **Références :** [PRD](PRD.md), [R-A](deep-research-analyse-fonction.md), [R-M](deep-research-modele-fonctionnel.md), [sources](RESEARCH-SOURCES.md).

## Synthèse

AGENTS.md absent à l'ouverture ; trois références lues dans l'ordre demandé. Architecture, domaine, API, sécurité et cinq ADR déjà présents et cohérents dans leurs grandes lignes. Traçabilité encore « NON_ANALYSE ». Plan, contrats machine, fixtures et tests de contrat absents. Aucun ADR accepté. Les fichiers étaient non suivis par Git ; leur présence ne vaut pas validation.

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

## Critères d'acceptation du document

Les 28 sections du PRD et toutes les grandes sections des deux recherches ont une conclusion ; divergences identifiées sans résolution silencieuse ; le registre des sources permet de distinguer vérifié, inaccessible et hypothétique ; les livrables existants ont été lus avant modification.

## Autorisation de réalisation du 31 octobre 2026

Le propriétaire accepte GO-00..02, les deux patchs PRD et PROP-10 MUST. Ils sont appliqués, avec 150 IDs et 100 MUST MVP. Auto-hébergement Docker Compose prioritaire (remplace la recommandation SaaS initiale), Keycloak local, TypeScript/Fastify/Next.js. ADR-0001/0002/0006 acceptés, ADR-0003 accepté sur invariants avec verrou provisoire ; ADR-0008 validé uniquement pour les principes GO-02. Lot 0 seul autorisé ; aucun autre ADR accepté automatiquement. L’exigence de conception seule d’AGENTS est actualisée conformément à cette instruction utilisateur.


## Résultat de réalisation du Lot 0

Le [rapport du 31 octobre](LOT-0-REPORT.md) remplace les mentions historiques « sans application » pour le socle uniquement. Les deux patchs PRD approuvés sont appliqués ; registre/backlog/matrice et contrats sont synchronisés. ADR-0009 documente les choix d’exécution, la portée de PROJ-10 et l’absence d’outbox sans effet externe. Les contrôles de contrats nouveaux, exemples, tests et état de la CI sont versionnés ensemble. La première qualification B porte sur les métadonnées, jamais sur de fausses scènes ; les tests futurs restent futurs. La modification d’AGENTS est limitée à l’autorisation explicite reçue. Aucun autre changement de priorité produit ni acceptation implicite d’une décision n’est introduit.
