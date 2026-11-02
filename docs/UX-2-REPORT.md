# UX-2 — Manipuler les scènes dans l’atelier

**Mission :** 2 novembre 2026 ; qualification locale dans la nuit du 2 au 3 novembre. **Statut :** réalisé et qualifié localement ; CI de livraison à observer, réception humaine attendue. Mission UX-1B puis UX-2 exclusivement sur main. [UX-1B](UX-1B-REPORT.md), [ADR-0020](adr/0020-cartes-et-deplacements-controles.md), [mission et suivi](uxui.md).

## Capacités réalisées

Écrire, Cartes et Plan sont trois vues du même atelier et des mêmes scènes. Le plan peut devenir l’explorateur principal ; un second clic sur Plan revient au texte. Le volet du plan reste masquable depuis Disposition. La palette conserve navigation et recherche, avec accès aux trois vues. Panneaux, références, discussions, fiche épinglée et lecture en regard sont conservés. Le texte reste monté pendant les changements de vue ; sa sélection, son undo et son DraftManager ne sont pas remplacés par une copie.

Le tableau présente un chapitre par colonne et les scènes dans leur ordre serveur. Titre, résumé court, statut et mots enregistrés viennent d’EditorialOutline. Il n’y a pas de nouvel objet Carte, de nouveau champ narratif ni de nouveau chemin de données. Les informations de personnages/lieux et commentaires ne sont pas inventées dans ce DTO ; le menu « Consulter le contexte » ouvre l’inspecteur existant. L’état d’enregistrement du texte reste identifiable depuis les cartes si un brouillon attend confirmation.

Création de scène dans une colonne, création de chapitre, renommage inline, informations avancées et actions secondaires restent dans l’atelier. Les formulaires inline partagent leur valeur en mémoire avec une seule représentation active. Un renommage garde la révision de préparation malgré une relecture du tableau ; un conflit conserve la saisie. Le choix du manuscrit et l’affichage des archives sont accessibles dans les cartes.

La poignée permet un vrai drag avant/après une carte et vers les emplacements de début/fin/chapitre vide. Les cibles affichent texte et repère visuel. Le tableau et les longues colonnes défilent automatiquement par la bibliothèque dédiée ; Échap avant dépôt annule sans écriture. La poignée est aussi un bouton : le choix chapitre + début/fin/avant/après fonctionne au clavier et au toucher sans drag. Une carte annonce titre, chapitre, position et actions ; après confirmation le focus rejoint la carte déplacée. Le défilement du tableau et de chaque colonne est conservé en mémoire lors des changements de vue.

## Conservation et concurrence

La commande existante `POST /projects/{projectId}/scenes/{sceneId}/move` est réutilisée avec son contrat réel, décrit dans ADR-0020. Le corps contient expectedRevision, targetParentId, beforeId et les deux préconditions structurelles ; aucun nouvel endpoint, If-Match fictif ou position numérique n’est introduit. Le service prend toujours sa barrière de projet, relit l’autorisation et applique la mutation atomique avec snapshots/audit/idempotence. Aucune migration ou logique serveur n’a été modifiée.

Le déplacement conserve identité, JSON riche, références et discussions. Il crée la nouvelle révision Scene prévue par le modèle réalisé ; l’ordre est protégé par les versions de chapitre, sans provoquer de révision textuelle des voisins. Le déplacement attend l’autosave en vol et les générations ultérieures déjà saisies. Une confirmation structurelle fait avancer la base connue d’un buffer propre sans réinitialiser Tiptap. Les lectures au texte identique préservent son instance ; une lecture ancienne ne fait pas reculer une base. Brouillons sales et conflits restent protégés.

Pendant l’envoi, l’ordre affiché reste le dernier ordre serveur, avec une indication d’attente. Après confirmation, le plan est relu. Sur 412 : intention conservée, relecture, explication simple et nouvelle décision requise ; aucun déplacement rejoué automatiquement sur une structure actualisée. Sur réponse perdue : corps et clé identiques conservés en mémoire ; « Vérifier et reprendre » retrouve le résultat idempotent sans nouvelle révision. Une relecture seule n’annonce pas une confirmation. Une lecture impossible retire le tableau périmé. Un retrait de membre produit 404 ; un auteur déclassé lecteur reçoit 403, garde la lecture autorisée et perd les commandes d’écriture.

« Annuler le déplacement » reste disponible 60 secondes pour la dernière commande confirmée, jusqu’au prochain déplacement. C’est une commande inverse avec nouvelle clé et préconditions des structures confirmées. Une autre modification peut la faire refuser ; l’UI relit alors le plan et ne simule aucun retour local. Les déplacements intermanuscrits restent dans le formulaire avancé préexistant ; les nouvelles cibles visuelles restent dans le manuscrit sélectionné.

## Fichiers et composants réutilisés

Nouveaux : [tableau](../apps/web/components/writer/scene-board.tsx), [choix de destination](../apps/web/components/writer/move-scene-dialog.tsx), [intention et inverse](../apps/web/components/writer/scene-move-intent.ts), [coordination des demandes](../apps/web/components/writer/use-scene-moves.ts), [parcours UX-2](../tests/e2e/ux2.spec.ts), [fixtures autorisées](../tests/e2e/scene-board.helpers.ts), [tests d’intention](../tests/scene-move-intent.test.ts).

Adaptés : [atelier](../apps/web/components/writer/writer.tsx), [DraftManager](../apps/web/components/writer/drafts.ts), [éditeur](../apps/web/components/writer/text-editor.tsx), [contrôles](../apps/web/components/writer/workspace-controls.tsx), [état de présentation](../apps/web/components/writer/workspace-state.ts), [styles](../apps/web/app/globals.css), tests d’autosave et de reprise. Dépendances et lockfile épinglent Pragmatic core 4.0.0, auto-scroll 3.2.1, hitbox 3.0.0. API, contrats, services métier, PostgreSQL, snapshots et permissions des Lots 0–7 réutilisés.

## Preuves et validations

La [galerie avant/après et états](../artifacts/ux12-2026-11-02/INDEX.html) rassemble les tailles demandées et les captures natives. La démonstration sombre « Les Cartographes de brume » conserve ses réglages ; les scénarios de tests utilisent leurs propres projets fictifs, en apparence initiale de leurs contextes isolés. Les captures de conflit, drag, choix de destination et confirmation proviennent d’actions et de réponses serveur réelles. Aucune retouche ni reconstruction de l’interface.

| Commande / preuve | Résultat observé |
|---|---|
| Construction Docker web de production | Réussie ; image servie en loopback |
| TypeScript, lint et contrôles de frontières/générateurs | Réussis |
| `DOCUMENT_PYTHON="$PWD/.venv/bin/python" npm test` | 281 réussis, 0 échec, 1 test optionnel de restauration non lancé dans cette commande |
| Navigateur de production, Lots 1/2/3/7 + UX-1/1B/2 | 34 parcours distincts réussis, dont les 12 nouveaux UX-2 ; vraie restauration isolée et archive exportée contrôlées dans Lot 7 |
| Reprise d’une longue scène après initialisation | 5 répétitions ciblées réussies, après les 34 parcours ; aucune assertion d’ordre ou de contenu assouplie |
| Validateur documentaire et ses tests | JSON/Schema/OpenAPI/MCP, 150 exigences, priorités/lots/liens : succès ; 54 tests Python réussis |

La CI complète comporte 47 parcours navigateur ; les Lots 0/4/5/6 et le redémarrage ne sont pas présentés comme rejoués localement par cette dernière campagne ciblée. La CI les exécute sur le SHA de livraison. Les vérifications PostgreSQL/HTTP/MCP de `npm test` sont bien des tests applicatifs réels ; les tests Python restent documentaires.

Les scénarios A à I sont reliés aux parcours UX-2 : création par plan/colonnes, ordre après rechargement, drag avant/après, chapitre vide, conservation du texte/références/commentaire/ID, inverse autorisée, deux auteurs et structure périmée, révocation, clavier, autosave en vol, tailles 1280/1440/1920/1000 et reflow 640. Les compléments vérifient réponse perdue après COMMIT avec une seule révision, annulation concurrente refusée, autoscroll horizontal/vertical et Échap sans mutation, tactile et déclassement lecteur, création/renommage distants par relecture, formulaire de renommage périmé conservé après refus.

L’audit npm de production ne signale aucune vulnérabilité. L’audit complet conserve onze alertes modérées d’outillage ESLint/minimatch déjà documentées au Lot 7, aucune haute/critique ; les nouveaux paquets DnD ne figurent pas parmi les paquets signalés. Cela ne constitue pas un audit de sécurité exhaustif ni une clôture des réserves existantes.

## Échecs observés et corrections

La première passe UX-2 a révélé quatre échecs : doublon de formulaire de renommage actif/inactif ; cible de drag mesurée avant autoscroll dans le test ; nom ARIA interdit sur les zones décoratives ; capture d’une position de défilement avant stabilisation de l’autoscroll. Les formulaires ont désormais une seule représentation contrôlée, le test suit la géométrie courante, les zones décoratives sont retirées de l’arbre accessible, et le test attend la fin du mouvement avant de comparer la reprise. Les cinq parcours ciblés de correction ont ensuite passé, sans assouplir les assertions d’ordre, de conservation ou d’absence de mutation.

Une régression de style héritait du footer des cartes de projets : tailles et séparateurs sont désormais bornés aux cartes de scène. Les résumés de chapitre sont bornés visuellement sans petit ascenseur parasite. Une relecture de métadonnées ou l’état occupé pouvait remonter inutilement l’éditeur : continuité de montage et préservation des buffers propres au texte identique corrigées et testées. Les formulaires gardent leur révision préparée, même après arrivée d’une modification distante.

Les deux CI de préparation UX-1B ont chacune passé 34/35 parcours : [c78c7bb](https://github.com/ZA512/StoryMaster/actions/runs/41517914305) a révélé le test de concentration non adapté ; [6541944](https://github.com/ZA512/StoryMaster/actions/runs/41521411721) a révélé une course d’initialisation du défilement. Le mode de concentration est rejoint par son menu ; l’éditeur annonce son état occupé jusqu’à la fin de l’initialisation/restauration, que le test attend avant de simuler un défilement. Ces CI échouées ne sont pas assimilées à des CI vertes. Le résultat distant de livraison est vérifié après push sur le SHA final et fourni dans le compte rendu ; [exécutions main](https://github.com/ZA512/StoryMaster/actions?query=branch%3Amain).

## Limites et réception humaine

Brouillons et intentions non confirmées restent en mémoire ; fermeture forcée ou coupure n’est pas couverte par un coffre persistant. Aucun objectif de temps d’une tâche humaine, SUS, plaisir d’écriture ou audit WCAG complet n’est déduit de Playwright/axe. Zoom visuel Chromium et reflow sont distingués du contrôle humain des navigateurs/lecteurs d’écran. Pas de nouvelle préférence de densité : réglage compact unique pour limiter les modes à apprendre.

Les 150 exigences, 100 MUST, textes, priorités et versions sont conservés. SEC-07, GO-03, GO-04, RLS et R-CONT-01 restent ouverts. Pas de volume supprimé, base utilisateur réinitialisée, restauration principale, IA réelle ou exposition publique. Pas d’UX-3/4 ni de nouvelle charte.

Demander au propriétaire de réceptionner UX-1B/UX-2 après essai de la rédaction, de la découvrabilité des menus, du drag et de son alternative, de l’annulation et de la compréhension du conflit. Les objectifs « moins de 15 secondes », déplacement interchapitre sans administration et retour immédiat au texte restent à mesurer par un humain. Le travail s’arrête après UX-2.

## Critères d'acceptation du document

Capacités livrées et réutilisées, contrat réel, fichiers, tests, captures, échecs corrigés et limites identifiables ; état CI vérifié après push ; aucune réception humaine ou performance d’usage inventée.
