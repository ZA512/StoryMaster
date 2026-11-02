# UX-1 — Première tranche de l’atelier

**Date :** 2 novembre 2026.
**Statut :** première tranche implémentée et qualifiée localement, réception humaine attendue.
**Références :** [mission UX/UI](uxui.md), [ADR-0019](adr/0019-atelier-persistant-et-navigation-contextuelle.md), [PRD](PRD.md).

## Portée réalisée

| Ticket de la mission | Résultat de cette tranche | Limite |
|---|---|---|
| UX-1.1 | Plan, texte et inspecteur masquables ; largeurs mémorisées par utilisateur ; séparateurs pointeur/clavier et réglages de largeur | Lecture d’une scène en regard, pas deux éditeurs simultanés |
| UX-1.2 | Dernière scène par compte/projet ; six scènes récentes ; défilement et chapitres ouverts gardés en mémoire pendant navigation interne | Le dernier ID est relu par le serveur ; aucune donnée narrative persistée dans le navigateur |
| UX-1.3 | Créations manuscrit/chapitre/scène dans le plan ; titre de scène modifiable sur place ; validation/annulation clavier et erreurs visibles | Les formulaires avancés de métadonnées et déplacements restent disponibles |
| UX-1.4 | Repères, discussions, fiche liée, relations de la fiche et lecture d’une seconde scène dans l’inspecteur ; fiche épinglable | Pas d’inspecteur de proposition ni de graphe ; fiche complète disponible |
| UX-1.5 | Comportement en mémoire conservé sur choix explicite du propriétaire | Coffre local et garantie de récupération après crash non livrés |
| UX-1.6 | Palette Ctrl/⌘ K : scènes, actions autorisées, recherche serveur, fiches | Pas de nouvelle commande serveur |
| UX-1.7 | Mode concentration, plan/inspecteur indépendants, même instance de l’éditeur lors des changements de disposition | Raccourcis : Ctrl/⌘ K, Ctrl/⌘ \\, Ctrl/⌘ Alt 1/2/3 ; actions visibles équivalentes |

Les 150 exigences, les 100 MUST MVP et leurs priorités restent inchangés. Les réserves GO-03/GO-04, SEC-07, RLS, contention et brouillons non confirmés restent ouvertes. Aucun fournisseur réel, client externe ou nouvelle délégation. Main uniquement ; pas de branche ou PR.

## Fichiers et commandes

Implémentation : [atelier](../apps/web/components/writer/writer.tsx), [état de présentation](../apps/web/components/writer/workspace-state.ts), [contrôles des panneaux/créations](../apps/web/components/writer/workspace-controls.tsx), [palette](../apps/web/components/writer/command-palette.tsx), [contexte](../apps/web/components/writer/context-object.tsx), [éditeur](../apps/web/components/writer/text-editor.tsx), [repères](../apps/web/components/narrative/scene-references.tsx) et [styles](../apps/web/app/globals.css). Aucune migration ni modification des services métier ou des contrats.

Tests : [état local](../tests/workspace-state.test.ts), [parcours UX-1](../tests/e2e/ux1.spec.ts), [aides navigateur](../tests/e2e/workshop.helpers.ts) ; parcours des Lots 1/2/3/7 adaptés à la création inline, à l’inspecteur et à l’attente effective de navigation après création de fiche.

La suite UX entre dans la CI existante via `npm run test:e2e`. Les tests de données/permissions continuent dans `npm test`, sur PostgreSQL réelle en base dédiée `_test`. Les scénarios navigateur créent leurs propres projets de qualification ; le projet de présentation et les autres données existantes sont conservés.

## Validations effectivement exécutées

| Vérification | Résultat effectivement observé |
|---|---|
| `npm run typecheck` | Succès |
| `npm run lint` et générateurs `--check` | Succès ; frontières et contrats conservés |
| `validate_specifications.py` | Succès : JSON, schémas, OpenAPI/MCP, 150 exigences, priorités, lots, scénarios et liens |
| Tests du validateur Python | 53 tests réussis |
| `npm test` sur PostgreSQL/HTTP/MCP réels et IA simulée | 278 réussis, aucun échec, 1 test de restauration optionnel non lancé dans cette commande |
| Navigateur de production, Lot 1 et UX-1 | 5 parcours éditeur puis 5 parcours UX-1 réussis |
| Navigateur, bible Lot 2 | 3 parcours réussis, dont concurrence texte/références et lecteur |
| Navigateur, collaboration Lot 3 | 2 parcours réussis avec Keycloak, ancrages, réponses perdues et révocation |
| Navigateur, parcours intégrés Lot 7 | 4 parcours réussis, dont vraie restauration isolée et vérification de l’archive exportée |
| Construction Docker web | Compilation Next.js de production réussie, image locale servie sur loopback |
| Revue visuelle locale | Atelier, fiche contextuelle et concentration capturés sans modifier thème, police ou taille d’écran de la démonstration |

Soit **19 parcours navigateur distincts qualifiés localement**, exécutés par groupes. La suite complète distante est à observer sur le commit final : aucune ancienne CI n’est assimilée à sa preuve. Les campagnes de benchmark/Spike A et le navigateur complet des Lots 0/4/5/6 ne sont pas revendiqués comme rejoués localement par cette tranche ; ils restent dans le workflow distant. Aucun résultat ne vaut réception humaine ni audit WCAG exhaustif.

Anomalies corrigées : focus demandé avant la création effective de ProseMirror ; contraste des compteurs et statuts du plan ; remise à zéro du défilement lors du chargement d’une scène puis défilement déclenché par le focus ; clé UI d’une intention confirmée conservée inutilement. Les parcours de test attendent la navigation effective après création d’une fiche et respectent `Retry-After` lors d’une connexion refusée. Les limites serveur ne sont pas assouplies.

Une première passe a échoué faute d’environnement Python de validation ; les dépendances épinglées ont été installées dans `.venv`, puis la suite a été rejouée avec `DOCUMENT_PYTHON`. Un redémarrage de la machine a interrompu des commandes et supprimé les journaux temporaires ; les validations reprises sont conservées dans `artifacts/local/ux1-qualification/`. Les premiers échecs de démarrage/débit ne sont pas comptés comme réussites. Le test PostgreSQL optionnel est distingué de la restauration isolée effectivement passée dans le navigateur Lot 7.

## Réception et suite

Examiner le confort de rédaction, la densité du plan, l’inspecteur, les créations inline et la navigation au clavier. Les objectifs de temps du document restent des cibles de tests utilisateurs ; aucune session d’auteur ni performance p95 n’est inventée. La direction graphique finale reste à choisir avec le propriétaire.

Le maintien des brouillons en mémoire est décidé par le propriétaire le 2 novembre. La limite après interruption reste affichée dans le contexte de scène et dans ADR-0017. UX-1 reste partiel sur ce point ; le tableau de cartes et DnD UX-2 ne sont pas avancés implicitement. UX-3/4 restent après la réception humaine prévue dans la mission.

## Critères d'acceptation du document

Séparer fonctions livrées, tests réellement exécutés, cibles proposées et travail différé ; indiquer les limites de récupération et de confidentialité locale ; ne pas transformer une qualification automatisée en réception humaine.
