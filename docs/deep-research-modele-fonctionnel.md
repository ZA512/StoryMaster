# Recherche approfondie — Concevoir un « atelier d’écriture universel » multi-utilisateur

## Synthèse de la recherche

Le marché des logiciels d’écriture est beaucoup plus fragmenté qu’il n’y paraît. Les outils les plus connus — Scrivener, Plottr, Campfire, World Anvil, Dabble, bibisco, yWriter, Ulysses — ne couvrent en réalité chacun qu’une partie du processus. Scrivener excelle dans la manipulation d’un manuscrit complexe et de ses documents annexes ; Plottr dans la visualisation de l’intrigue ; Campfire et World Anvil dans le worldbuilding ; Aeon Timeline dans la cohérence temporelle ; NovelPad dans les vues croisées et le versionnage ; Fictionary, AutoCrit et ProWritingAid dans l’analyse éditoriale ; Inkarnate et Azgaar dans la cartographie ; Fantasy Calendar dans les calendriers fictifs ; Vulgarlang dans les langues construites. citeturn912616search0turn912616search1turn912616search2turn912616search3turn484145search5turn867814search2turn884101search6turn977418search2turn484145search13turn977418search11

La conclusion principale de cette étude est qu'un bon produit ne devrait **pas reproduire ces logiciels sous la forme de vingt modules indépendants**. Il devrait plutôt construire un **modèle de données unique du récit**, puis proposer plusieurs représentations de ces mêmes données : manuscrit, tableau de cartes, chronologie, graphe de relations, carte géographique, encyclopédie, fiches personnages, analyses, etc. C'est déjà partiellement ce que font les meilleurs produits : déplacer une carte dans le corkboard de Scrivener déplace le contenu correspondant ; NovelPad réutilise les mêmes scènes dans ses vues chapitre, intrigue, personnage ou chronologie ; Campfire relie ses éléments de worldbuilding au manuscrit ; LivingWriter relie les « story elements » aux scènes. citeturn912616search0turn867814search2turn912616search5turn867814search15

Autrement dit, **la scène doit être une donnée et non un fichier**. Un personnage doit également être une entité unique, et non une fiche copiée dans plusieurs endroits. Une scène pourrait être simultanément :

- le troisième élément du chapitre 8 ;
- le dix-septième événement chronologique ;
- une étape du subplot « complot politique » ;
- une apparition de trois personnages ;
- une scène située à Lyon ;
- une étape de l'arc émotionnel du protagoniste ;
- un événement daté du 14 Vendémiaire de l'an 327 du calendrier fictif ;
- un élément marqué « à réécrire ».

Cette approche est celle qui permettrait de dépasser réellement les logiciels existants plutôt que de simplement les additionner.

Un second enseignement important concerne la modularité. Campfire est particulièrement intéressant parce que son architecture est déjà organisée autour de modules : Characters, Cultures, Items, Locations, Philosophies, Religions, Species, Systems, Encyclopedia, Magic, Manuscript, Maps, Research, Timeline, Arcs, Calendar, Languages et Relationships. Un auteur de thriller réaliste n'a aucune raison de voir en permanence un module « espèces », « magie » ou « lunes », alors qu'un auteur de fantasy pourrait en avoir besoin quotidiennement. citeturn912616search2turn912616search5

Le produit envisagé devrait donc être **progressivement configurable** : un noyau réduit toujours disponible, auquel l'utilisateur ajoute des capacités par projet. L'interface pourrait par exemple proposer des profils « Roman généraliste », « Fantasy », « Science-fiction », « Policier », « Historique », « Romance », « Non-fiction », « Saga », « Scénario » ou « Configuration personnalisée ». Les modules activés ne changeraient pas le format interne du projet : ils ne feraient qu'afficher des vues et champs adaptés.

La collaboration constitue enfin une vraie occasion de différenciation. Dabble propose désormais la co-écriture ; NovelPad possède des rôles Viewer, Commenter et Editor ainsi que des fils de commentaires ; Reedsy Studio propose une collaboration en direct ; Atticus distingue Owner, Co-Writer, Editor et Beta Reader ; World Anvil permet des collaborateurs avec différents niveaux d'accès ; Novlr a introduit en octobre 2026 l'édition simultanée d'un même chapitre avec commentaires. citeturn867814search1turn867814search2turn849845search5turn849845search9turn912616search3turn867814search12

Cela valide directement ton modèle : **un utilisateur possède ses projets, mais peut aussi appartenir à autant de projets collaboratifs que nécessaire**. Il ne faut surtout pas modéliser « un projet solo » et « un projet groupe » comme deux objets différents. Un projet reste un projet ; seule sa liste de membres et de permissions change.

## Cartographie étendue des outils existants

Le recensement suivant n'est évidemment pas « exhaustif » au sens mathématique — des centaines de petits logiciels et plugins existent — mais couvre les grandes familles fonctionnelles et un ensemble significatif d'outils spécialisés dont les idées méritent d'être étudiées.

| Outil | Positionnement intéressant | Idées à récupérer |
|---|---|---|
| **Scrivener** | Manuscrits longs | Binder hiérarchique, corkboard, outliner, métadonnées personnalisées, Collections, snapshots/diff, éditeur fractionné, compilation/export. citeturn912616search0 |
| **Plottr** | Planification narrative | Timeline visuelle, lignes d'intrigue parallèles, cartes de scènes, templates narratifs, attributs personnalisés, filtres. citeturn912616search1 |
| **Campfire** | Écriture + worldbuilding | Modules spécialisés extrêmement riches : espèces, cultures, religions, magie, langues, relations, calendrier, timeline, cartes, encyclopédie. citeturn912616search2turn912616search5 |
| **World Anvil** | Encyclopédie de monde | Articles typés, liens bidirectionnels, cartes interactives, timelines parallèles, arbres généalogiques, calendriers, secrets et permissions. citeturn912616search3turn912616search4 |
| **LegendKeeper** | Wiki visuel collaboratif | Wiki + atlas + tableaux blancs infinis, cartes imbriquées, collaboration temps réel, fonctionnement hors ligne partiel. citeturn993322search0turn993322search31 |
| **Kanka** | Base de connaissances de monde | Entités fortement reliées : personnages, lieux, familles, organisations, objets, quêtes, journaux, calendriers, capacités, timelines. citeturn993322search1turn993322search2 |
| **Notebook.ai** | Fiches de worldbuilding | 29 types de pages, univers comme conteneurs, personnages, lieux, objets, créatures, dieux, flore, langues, religions, technologies, scènes. citeturn993322search7turn993322search14 |
| **Fantasia Archive** | Worldbuilding structuré hors ligne | Très nombreux types d'entités et surtout relations bidirectionnelles automatiques. citeturn993322search30turn993322search38 |
| **WorldForge** | Knowledge graph narratif | Navigation d'une entité vers ses factions, rivaux, lieux et événements via un graphe de connaissances vivant. citeturn993322search42 |
| **bibisco** | Roman structuré | Interviews de personnages, architecture du roman, fabula, storylines, mind maps, timeline et analyses du manuscrit. citeturn429248search5 |
| **yWriter** | Écriture par scènes | POV, objectif, conflit et résultat par scène ; storyboard ; personnages, objets et lieux associés aux scènes ; rapports transversaux. citeturn429248search0turn429248search2 |
| **Manuskript** | Planification open source | Méthode Snowflake, outline, index cards, personnages, plots, monde, objets, storyline et mode sans distraction. citeturn429248search3turn429248search4 |
| **Story Architect / STARC** | Écriture multi-format | Romans, scénarios, comics et pièces partageant une même bible ; corkboard, timeline, mind-map, relations et statistiques. citeturn429248search7turn429248search8 |
| **Dabble** | Écriture web | Plot Grid, Story Notes, objectifs, cloud/offline, co-écriture et commentaires. citeturn867814search0turn867814search1 |
| **NovelPad** | Organisation multidimensionnelle | Une même scène vue par chapitre, subplot, personnage, timeline ; versionnage, diff, révisions, backlinks et rôles de collaboration. citeturn867814search2turn867814search6 |
| **LivingWriter** | Manuscrit + story bible | Elements Board, Planning Board, Research Board, « Appears In » et relations entre éléments. citeturn867814search15turn867814search31 |
| **Novlr** | Écriture et productivité | Planning grid, notes latérales, sprints, objectifs, statistiques et collaboration simultanée récemment ajoutée. citeturn867814search4turn867814search12 |
| **Scribbook** | Écriture francophone | Actes/chapitres/scènes drag-and-drop, timeline, personnages et lieux reliés aux scènes, versions comparables, statistiques et méthodes guidées. citeturn925515search2 |
| **WriteControl** | Atelier francophone complet | Chapitres, personnages, recherche, mind map, statistiques, dictionnaires, répétitions, historique et mise en page. citeturn925515search3turn925515search4 |
| **Plumence** | Assistant auteur francophone | Cohérence globale, bible extraite du manuscrit, correction/reformulation, préparation à l'édition et EPUB. citeturn925515search0turn925515search1 |
| **oStoryBook** | Analyse structurelle classique | Storylines, chronologie, personnages/lieux par scène, objets possédés sur une plage de scènes, idées globales et tâches. citeturn925515search6turn925515search7 |
| **Ulysses** | Expérience d'écriture | Minimalisme, feuilles, groupes, mots-clés, pièces jointes, objectifs, historique des sessions, révision et export. citeturn884101search1turn884101search5turn884101search19 |
| **FocusWriter** | Concentration | Plein écran, thèmes, statistiques live, objectifs quotidiens et sons de machine à écrire. citeturn849845search18 |
| **Scapple** | Brainstorming libre | Notes sans hiérarchie imposée, connexions arbitraires, regroupements visuels, labels de relations. citeturn849845search16 |
| **Milanote** | Tableau d'idées | Canvas visuel, moodboards, recherche web, fiches personnages et outline spatial. citeturn484145search14turn484145search16 |
| **Reedsy Studio** | Écriture jusqu'à publication | Planning Boards, édition, collaboration, historique, objectifs et export PDF/EPUB typographié. citeturn484145search47turn849845search5turn849845search20 |
| **Atticus** | Production du livre | Écriture, objectifs, sprints, collaboration par rôles et surtout formatage professionnel print/ebook. citeturn849845search6turn849845search9turn849845search11 |
| **Aeon Timeline** | Chronologie complexe | Âge des personnages automatiquement calculé, calendriers fictifs, événements, dépendances et contraintes temporelles. citeturn484145search1turn484145search2turn484145search7 |
| **Fantasy Calendar** | Calendrier de monde | Moons, saisons, années, semaines non standards, météo, événements conditionnels et calendriers liés. citeturn484145search13turn484145search27 |
| **Inkarnate** | Cartographie artistique | Cartes de monde, régions, villes et intérieurs avec calques, assets et pinceaux. citeturn484145search0turn484145search33 |
| **Azgaar Fantasy Map Generator** | Génération de monde géopolitique | Biomes, États, provinces, cultures, religions, villes, routes, diplomatie, armées, commerce et population. citeturn977418search2turn977418search4 |
| **Watabou Procgen Arcana** | Génération de villes/régions | Génération rapide de villes, villages et régions ; intégration avec Azgaar. citeturn977418search0turn977418search23 |
| **Vulgarlang** | Langues construites | Phonologie, orthographe, dictionnaire, morphologie et grammaire de langues fictives. citeturn977418search11turn977418search18 |
| **donjon** | Générateurs rapides | Générateurs de noms, mondes et autres éléments de fantasy. citeturn977418search7 |
| **Fictionary** | Révision structurelle | Analyse scène par scène de 38 éléments répartis entre personnage, intrigue et décor ; story arc et détection des personnages. citeturn884101search6turn884101search40 |
| **ProWritingAid** | Analyse linguistique et narrative | Plus de 25 rapports : lisibilité, répétition, pacing, dialogue, sensations, structure, plus analyses complètes du manuscrit. citeturn884101search0turn884101search21 |
| **AutoCrit** | Révision fiction orientée genre | Pacing, dialogue, style, lisibilité et comparaison avec les habitudes de différents genres. citeturn884101search4turn884101search18 |

La première observation intéressante est qu'aucun de ces outils ne possède simultanément **l'éditeur de Scrivener, le graphe de World Anvil, les modules de Campfire, le Plot Grid de Plottr, la chronologie d'Aeon, le versionnage de NovelPad, l'analyse de Fictionary et la publication d'Atticus/Reedsy**. C'est précisément l'espace produit à viser. citeturn912616search0turn912616search1turn912616search5turn484145search7turn867814search2turn884101search40turn849845search20

## Les idées réellement remarquables à récupérer

### Le principe « une information, plusieurs vues »

C'est probablement la fonctionnalité la plus importante de tout le produit.

NovelPad permet de voir les mêmes scènes selon le chapitre, le subplot, le personnage ou la chronologie, tandis que Plottr organise les scènes selon des lignes narratives et des chapitres. LivingWriter rattache les story elements aux scènes, et yWriter associe personnages, lieux, objets, objectifs, conflits et résultats aux scènes. citeturn867814search2turn912616search1turn867814search15turn429248search0

**Ce qui plaît dans cette logique** est qu'une modification n'a pas à être répétée. Déplacer une scène sur la timeline ne crée pas une deuxième scène ; changer son lieu ou son POV modifie simplement ses métadonnées.

Il faudrait généraliser cette idée à tout le logiciel.

Une scène pourrait posséder nativement :

`titre — synopsis — texte — statut — date récit — position narrative — durée — POV — personnages — lieux — objets — intrigue(s) — arc(s) — thème(s) — objectif — conflit — issue — tension — notes — tags — version — auteurs`.

Toutes les vues seraient des projections de ce même objet.

### Une Story Bible qui est un véritable graphe

World Anvil, Kanka, Fantasia Archive, Notebook.ai et LegendKeeper montrent qu'une bible efficace ne doit pas être une simple collection de pages. Elle doit contenir des **entités reliées**. World Anvil propose notamment des liens rapides entre articles et des arbres familiaux ; Kanka relie personnages, lieux, familles, organisations et événements ; Fantasia Archive automatise des relations réciproques ; LegendKeeper permet de transformer ces liens en cartes et tableaux visuels. citeturn912616search3turn993322search1turn993322search38turn993322search25

Le bon modèle serait un **knowledge graph interne** :

`Entité → Relation → Entité`

Exemples :

`Arya — sœur de → Sansa`

`Arya — membre de → Maison Stark`

`Maison Stark — contrôle → Winterfell`

`Winterfell — situé dans → Nord`

`Épée Aiguille — appartient à → Arya`

`Arya — apparaît dans → scène 42`

Les relations devraient disposer de propriétés : début, fin, secret/public, commentaire, source, certitude et éventuellement évolution au cours du récit.

C'est particulièrement puissant pour un écrivain car certaines relations changent avec le temps :

`Paul → ami → Marc : scènes 1–24`

puis

`Paul → ennemi → Marc : scènes 25–48`.

Plumelin illustre justement l'intérêt de relations pouvant évoluer scène par scène. citeturn993322search39

### Un système d'entités extensible plutôt qu'une liste figée

Campfire, Notebook.ai et Fantasia Archive montrent qu'il existe énormément de catégories utiles : personnages, lieux, espèces, cultures, objets, religions, philosophies, systèmes de magie, technologies, langues, bâtiments, gouvernements, traditions, etc. citeturn912616search2turn993322search7turn993322search38

Mais coder chacune comme un module complètement indépendant deviendrait vite ingérable.

Le moteur devrait plutôt proposer un **type d'entité générique avec schémas configurables**.

Par exemple :

**Personnage**

nom, alias, dates naissance/mort, genre, apparence, personnalité, motivations, peur, objectif, arc, relations, portraits.

**Créature / bestiaire**

espèce, habitat, alimentation, comportement, reproduction, danger, capacités, faiblesses, aire géographique.

**Civilisation**

territoire, gouvernement, langues, monnaie, religions, technologies, armée, coutumes.

**Objet**

propriétaire, provenance, caractéristiques, historique, emplacement actuel.

L'utilisateur devrait pouvoir modifier le modèle ou créer :

> « Type d'entité : Vaisseau spatial »

avec ses propres champs.

C'est une idée fondamentale : **ne pas coder le monde de l'utilisateur à sa place**.

### La chronologie d'Aeon plutôt qu'une simple frise

Beaucoup d'applications possèdent une « timeline », mais celle d'Aeon introduit une idée nettement plus puissante : les événements sont soumis à des contraintes temporelles. Aeon sait par exemple calculer automatiquement l'âge d'un personnage lors d'un événement ou maintenir un délai fixe entre deux événements. citeturn484145search1turn484145search7

Une timeline ambitieuse devrait donc gérer :

**Temps du monde** : quand les événements ont réellement lieu.

**Temps narratif** : dans quel ordre le lecteur les découvre.

Cela permet immédiatement de gérer flashbacks, flashforwards et récits parallèles.

Elle devrait également afficher plusieurs « pistes » :

personnage A  
personnage B  
royaume A  
subplot politique  
subplot romance  
guerre  
événements historiques.

Plottr et World Anvil proposent déjà les prémices de ces timelines parallèles. citeturn912616search1turn912616search3

Une fonctionnalité très intéressante serait ensuite un **détecteur de contradictions temporelles** :

« Luc est présent à Paris à 18 h mais la scène précédente le place encore à Tokyo à 15 h. »

Ou :

« Anna a 14 ans dans cette scène alors que sa date de naissance lui donne 12 ans. »

Ou :

« Ce personnage est marqué mort depuis trois scènes. »

Ce type de vérification serait beaucoup plus utile qu'un énième générateur de texte.

### Les calendriers fictifs doivent être de vrais calendriers

Fantasy Calendar et Aeon montrent qu'un univers fictif peut nécessiter des calendriers qui n'ont rien de grégorien : nombre de jours variable, semaines personnalisées, années particulières, lunes, saisons, intercalaires et ères. Fantasy Calendar va jusqu'à modéliser cycles lunaires, météo et événements conditionnels. citeturn484145search13turn484145search17turn484145search34

Le module devrait donc permettre :

calendrier grégorien ou personnalisé ;  
ères ;  
années/mois/semaines/jours ;  
plusieurs lunes ;  
solstices et équinoxes ;  
saisons ;  
jours particuliers ;  
événements récurrents ;  
conversion date fictive ↔ timestamp interne.

La bonne architecture serait de stocker le temps sous une représentation absolue interne et d'afficher ensuite la date dans le calendrier choisi.

### Une carte qui connaît le monde

World Anvil, LegendKeeper et Campfire partagent une excellente idée : **les cartes comportent des points interactifs reliés aux informations du monde**. Campfire permet même d'imbriquer des cartes. citeturn912616search5turn993322search10turn912616search3

Pour une première version, il serait inutile de développer un concurrent complet d'Inkarnate. Il serait beaucoup plus rentable de permettre :

import PNG/JPEG/SVG ;  
zoom ;  
pins ;  
zones ;  
routes ;  
calques ;  
liaison pin ↔ entité ;  
cartes imbriquées.

Exemple :

Monde  
→ continent  
→ royaume  
→ ville  
→ château.

Ensuite seulement pourrait venir un générateur cartographique intégré ou des imports depuis Inkarnate/Azgaar. Azgaar montre jusqu'où peut aller cette logique avec ses couches États, cultures, religions, biomes, provinces, routes, commerce et armées. citeturn977418search2turn977418search4

### Le « Appears in » automatique

LivingWriter et NovelPad possèdent une idée extrêmement utile : depuis un personnage ou un lieu, voir immédiatement toutes les scènes où il apparaît. Fictionary automatise également la détection des personnages dans un manuscrit. citeturn867814search15turn867814search2turn884101search40

Il faut aller beaucoup plus loin :

**Personnage → apparaît dans**  
scènes, chapitres, intrigues, lieux, relations.

**Objet → apparaît dans**

**Lieu → scènes s'y déroulant**

**Faction → personnages membres**

**Événement → personnages présents**

Cela donnerait également des requêtes très puissantes :

« Toutes les scènes où Alice et Bob apparaissent ensemble »

« Toutes les scènes de l'acte II où le méchant n'apparaît pas »

« Tous les objets introduits mais jamais réutilisés ».

### Le brouillon libre doit coexister avec la structure

Scapple et Milanote montrent qu'au début d'un projet, l'utilisateur n'a pas forcément envie de remplir des formulaires. Il veut poser des idées sur un tableau et créer des liens librement. Scapple refuse volontairement d'imposer une hiérarchie aux notes. citeturn849845search16turn484145search14

Il faudrait donc un **canvas infini** dans lequel une note peut rester une simple note ou être transformée ensuite en :

personnage ;  
scène ;  
lieu ;  
événement ;  
intrigue ;  
objet.

Cette transformation est importante :

`Post-it "un sorcier aveugle"`  
→ clic « convertir en personnage »  
→ la note devient une véritable entité sans perdre son contenu.

### Les versions doivent être traitées comme Git, sans exposer Git

Scrivener propose les Snapshots ; Scribbook conserve des versions comparables mot à mot ; NovelPad dispose de version history, structural diff, text diff, snapshots, restauration et « scene takes ». citeturn912616search0turn925515search2turn867814search2

Pour un outil collaboratif, ce point devient essentiel.

Il faudrait :

autosave continu ;  
historique automatique ;  
snapshots manuels ;  
comparaison visuelle ;  
restauration ;  
auteur de chaque modification ;  
versions nommées ;  
branches légères éventuellement.

L'interface pourrait afficher :

> Version « avant correction éditeur »  
> 12 octobre 2026 — Jean

puis un diff à la manière de Git, mais présenté en langage d'écrivain.

### L'analyse structurelle est plus intéressante que la génération automatique

Fictionary analyse 38 éléments narratifs scène par scène ; ProWritingAid produit des rapports de pacing, dialogue, répétition, lisibilité et sensations ; AutoCrit compare notamment pacing et dialogue à des corpus de genre. citeturn884101search31turn884101search0turn884101search18

Cela suggère un module « Diagnostic » particulièrement intéressant :

répartition des POV ;  
longueur des scènes ;  
présence des personnages ;  
temps entre apparitions ;  
densité de dialogue ;  
rythme ;  
longueur des phrases ;  
répétitions ;  
distribution action/dialogue/description ;  
cinq sens utilisés ;  
personnages introduits puis oubliés ;  
objets introduits puis inutilisés ;  
arcs narratifs interrompus ;  
scènes sans conflit ou objectif ;  
chronologie incohérente.

Une grande partie de ces analyses pourrait être réalisée **sans IA générative**, à partir du graphe et du manuscrit.

C'est même un avantage produit : l'outil pourrait aider l'auteur à comprendre son texte sans prétendre l'écrire à sa place.

## Catalogue fonctionnel du produit cible

À partir des outils précédents, voici ce que je considérerais comme la cible fonctionnelle complète.

### Gestion des utilisateurs et des projets

Le système devrait être réellement multi-tenant.

Un compte peut :

créer autant de projets personnels que son abonnement le permet ;  
participer à plusieurs projets ;  
posséder un projet tout en étant simple lecteur d'un autre ;  
quitter un projet partagé sans affecter ses projets personnels.

Le projet possède :

propriétaire ;  
membres ;  
groupes éventuels ;  
rôles ;  
permissions.

Atticus offre une bonne inspiration avec Owner, Co-Writer, Editor et Beta Reader, tandis que NovelPad sépare Viewer, Commenter et Editor. citeturn849845search9turn867814search2

Je recommanderais :

**Owner** — contrôle complet.

**Administrator** — gère projet et utilisateurs mais ne peut transférer la propriété.

**Author** — modifie manuscrit et éléments narratifs.

**Worldbuilder** — modifie la bible mais éventuellement pas le manuscrit.

**Editor** — modifications avec suivi des changements.

**Commenter** — commentaires uniquement.

**Beta reader** — lecture et feedback.

**Viewer** — lecture seule.

Les permissions fines devraient pouvoir être accordées au niveau du projet **et éventuellement d'un document**.

### Architecture du manuscrit

La structure minimale devrait être :

Projet  
↳ Série éventuellement  
↳ Livre  
↳ Partie  
↳ Chapitre  
↳ Scène.

Scrivener, yWriter, NovelPad, Dabble et Scribbook convergent tous vers des modèles de hiérarchie semblables, avec déplacement par drag-and-drop. citeturn912616search0turn429248search0turn867814search6turn867814search1turn925515search2

Chaque scène doit pouvoir exister indépendamment de son chapitre afin d'être déplacée sans perdre ses relations.

Il faut également une zone :

**Scènes non classées**

pour les passages écrits avant de savoir où les placer.

### Éditeur de texte

Fonctions indispensables :

autosave ;  
formatage classique ;  
styles ;  
notes ;  
annotations ;  
commentaires ;  
footnotes/endnotes ;  
images ;  
liens ;  
recherche/remplacement ;  
mode plein écran ;  
mode machine à écrire ;  
raccourcis clavier ;  
statistiques en direct ;  
split view.

Scrivener reste une référence pour l'éditeur fractionné et la consultation simultanée de documentation ; FocusWriter illustre parfaitement l'intérêt du mode distraction-free ; Ulysses montre qu'un environnement d'écriture peut rester extrêmement sobre malgré de nombreuses fonctions. citeturn912616search0turn849845search18turn884101search13

Une excellente fonction serait :

**panneau contexte**

pendant l'écriture d'une scène :

Personnages  
Lieu  
Chronologie  
Notes  
Documents de recherche.

### Tableaux de scènes

Il faudrait au minimum cinq représentations :

**Outline**  
arbre manuscrit.

**Corkboard**  
cartes de scènes.

**Plot Grid**  
chapitres × lignes narratives.

**Timeline**  
ordre chronologique.

**Canvas**  
organisation complètement libre.

Plottr, Scrivener, NovelPad, LivingWriter, Scribbook et Story Architect montrent chacun l'intérêt d'une ou plusieurs de ces vues. citeturn912616search1turn912616search0turn867814search2turn867814search39turn925515search2turn429248search7

### Intrigues, arcs et beats

Il faut distinguer :

**Plot** — intrigue principale.

**Subplot** — intrigue secondaire.

**Character arc** — évolution d'un personnage.

**Theme arc** — évolution d'un thème.

**Relationship arc** — évolution d'une relation.

Une scène peut appartenir à plusieurs arcs.

Des templates peuvent ensuite être proposés :

Three Act Structure ;  
Save the Cat ;  
Hero's Journey ;  
Snowflake ;  
Story Circle ;  
Seven Point Story Structure ;  
Romance beats ;  
Mystery structure.

Plottr fournit plus de trente modèles de plot/scène ; Manuskript implémente Snowflake ; Scribbook propose notamment Flocon et Voyage du héros ; LivingWriter fournit des templates narratifs. citeturn912616search1turn429248search4turn925515search2turn867814search15

Il faut toutefois laisser l'utilisateur les désactiver complètement.

### Fiches personnages avancées

La fiche idéale devrait combiner bibisco, Campfire, Plottr et Notebook.ai.

Champs possibles :

identité ;  
alias/surnoms ;  
portrait ;  
apparence ;  
psychologie ;  
valeurs ;  
désirs ;  
besoins ;  
peurs ;  
secrets ;  
forces/faiblesses ;  
arc ;  
voix ;  
relations ;  
famille ;  
chronologie personnelle ;  
objets possédés ;  
lieux associés ;  
apparitions dans le texte.

bibisco a une idée particulièrement intéressante : au lieu de simples champs, il utilise une forme d'interview de personnage afin d'inciter l'auteur à réfléchir. citeturn429248search5

Il pourrait donc exister deux interfaces :

**Fiche rapide**

et

**Développement guidé**.

### Relations et généalogie

World Anvil gère les arbres familiaux ; Campfire et LegendKeeper proposent des graphes relationnels ; Story Architect possède un éditeur de relations entre personnages. citeturn912616search3turn912616search5turn993322search25turn429248search9

Le graphe devrait accepter toutes sortes de relations :

parent de ;  
enfant de ;  
ami de ;  
ennemi de ;  
amoureux de ;  
commande ;  
appartient à ;  
vassal de ;  
localisé dans ;  
créé par.

Certaines relations sont symétriques :

`A ami de B` ⇒ `B ami de A`.

D'autres sont inversées :

`A parent de B` ⇒ `B enfant de A`.

Le moteur pourrait gérer ces règles automatiquement.

### Lieux et géographie

Structure :

Monde  
→ continent  
→ pays  
→ région  
→ ville  
→ bâtiment  
→ pièce.

Mais cette hiérarchie ne devrait jamais être imposée.

Chaque lieu peut contenir :

description ;  
images ;  
coordonnées ;  
parent ;  
population ;  
climat ;  
culture ;  
gouvernement ;  
langues ;  
événements ;  
personnages présents ;  
scènes.

World Anvil, Notebook.ai et Kanka ont déjà des modèles très développés de lieux et structures géographiques. citeturn912616search3turn993322search17turn993322search1

### Bestiaire, espèces et écosystèmes

Le bestiaire devrait être un premier-class citizen, pas simplement une note.

Campfire possède un module Species ; Notebook.ai distingue notamment Creatures, Races et Floras. citeturn912616search2turn993322search7

Une espèce pourrait avoir :

classification ;  
apparence ;  
anatomie ;  
habitat ;  
régime ;  
cycle de vie ;  
reproduction ;  
comportement ;  
intelligence ;  
langages ;  
pouvoirs ;  
faiblesses ;  
relations avec d'autres espèces ;  
aire de répartition.

### Cultures, factions, gouvernements et religions

C'est une zone où les outils de worldbuilding sont nettement supérieurs aux logiciels d'écriture traditionnels.

Il faut pouvoir créer :

cultures ;  
civilisations ;  
ethnies ;  
familles ;  
guildes ;  
factions ;  
entreprises ;  
gouvernements ;  
religions ;  
philosophies ;  
écoles ;  
armées.

Campfire et Notebook.ai consacrent des types spécifiques à beaucoup de ces éléments ; Kanka dispose de familles et organisations. citeturn912616search2turn993322search7turn993322search1

### Magie, technologie et systèmes

Campfire possède des modules Magic et Systems ; Notebook.ai distingue Magic et Technologies. citeturn912616search2turn993322search7

Le moteur devrait permettre de décrire :

règles ;  
coûts ;  
limites ;  
ressources ;  
utilisateurs ;  
exceptions ;  
conséquences.

Le même mécanisme pourrait servir pour un système magique, une technologie FTL ou même les règles politiques d'un univers dystopique.

### Langues fictives

Pour la plupart des auteurs, une simple fiche suffit :

nom ;  
alphabet ;  
phonétique ;  
expressions ;  
lexique.

Pour les utilisateurs avancés, les idées de Vulgarlang sont très intéressantes : phonologie, orthographe, morphologie, parties du discours, grammaire et dictionnaire. citeturn977418search11turn977418search27

Je n'intégrerais pas immédiatement un générateur complet de langue. En revanche, le modèle de données devrait être capable de l'accueillir ultérieurement.

### Recherche documentaire

Campfire dispose d'un Research Module capable de stocker liens web, vidéos annotées, PDF, images et notes, tandis que Scrivener permet d'afficher la recherche à côté du manuscrit. Milanote possède un Web Clipper. citeturn912616search5turn912616search0turn484145search14

Il faudrait donc :

bibliothèque documentaire ;  
URL ;  
PDF ;  
images ;  
audio ;  
vidéo ;  
notes ;  
tags ;  
source ;  
citation ;  
association à n'importe quelle entité.

Un navigateur/clipping complet pourrait venir plus tard.

### Idées et inbox

oStoryBook possède une notion intéressante de « Global Ideas » avec les statuts Not Started, Started, Completed et Abandoned. LivingWriter possède un « Stash ». citeturn925515search7turn867814search40

Il faut une **Inbox universelle** :

« inspiration »

→ tape l'idée en deux secondes

→ plus tard, transforme-la en scène/personnage/lieu/tâche/note.

C'est typiquement une petite fonction avec énormément de valeur UX.

### Objectifs et statistiques

Les logiciels convergent presque tous vers :

objectif global ;  
deadline ;  
objectif journalier ;  
nombre de mots ;  
sprints ;  
historique ;  
streak.

Ulysses conserve même l'historique des sessions et permet son export CSV ; Atticus recalcule le nombre de mots nécessaire par jour à partir de la deadline. citeturn884101search1turn849845search11

La meilleure version pourrait afficher :

mots aujourd'hui ;  
mots semaine ;  
temps passé ;  
sessions ;  
vitesse moyenne ;  
progression livre ;  
projection date de fin.

### Révision et workflow

Chaque scène et chapitre devrait posséder un statut configurable :

Idée  
Planifié  
Premier jet  
À réécrire  
Révision  
Correction  
Beta reading  
Final.

Scrivener possède justement des métadonnées Status et Labels personnalisables. citeturn912616search0

Les utilisateurs devraient pouvoir créer leurs propres workflows.

### Commentaires, suggestions et validation

Le modèle idéal mélange Google Docs et GitHub :

commentaire sur sélection ;  
thread ;  
@mention ;  
assignation ;  
résolu/non résolu ;  
suggestion de remplacement ;  
accepter/refuser ;  
historique.

Novlr propose désormais commentaires et collaboration live ; NovelPad gère fils de commentaires et attribution ; Dabble dispose d'outils dédiés au partage avec co-auteurs et bêta-lecteurs. citeturn867814search12turn867814search2turn867814search1

### Recherche globale

Une recherche réellement bonne devrait indexer :

texte du manuscrit ;  
titres ;  
synopsis ;  
personnages ;  
alias ;  
tags ;  
notes ;  
relations ;  
documents.

NovelPad propose déjà recherche full-text et même cross-novel search. citeturn867814search2

À terme, on pourrait également proposer des requêtes structurées :

`type:scene character:"Alice" location:"Paris"`

ou une interface naturelle :

> « Montre-moi toutes les scènes avec Alice à Paris avant la mort de Paul. »

### Export et publication

Il faut éviter tout enfermement propriétaire.

Exports minimaux :

TXT / Markdown  
DOCX  
PDF  
EPUB  
HTML.

Scrivener possède un moteur de compilation particulièrement flexible ; Reedsy et Atticus excellent dans la transformation du manuscrit en livre prêt à publier. citeturn912616search0turn849845search20turn849845search1

L'idéal serait également un export **Projet complet** dans un format documenté, par exemple ZIP contenant JSON + Markdown + médias.

Pour un produit sérieux, c'est aussi une garantie de confiance : l'utilisateur doit toujours pouvoir récupérer tout son travail.

## Architecture fonctionnelle que je retiendrais

Le cœur du produit devrait être organisé autour de seulement quelques concepts fondamentaux.

**Workspace / Projet**

Le conteneur collaboratif.

**Document**

Un texte rédigé : manuscrit, note, recherche, article.

**Narrative Unit**

Livre, partie, chapitre, scène.

**Entity**

Personnage, lieu, objet, espèce, faction, religion, culture, langue, etc.

**Event**

Événement temporel.

**Relation**

Lien entre deux objets.

**Media**

Images, PDF, audio, documents.

**Tag**

Classification libre.

**Comment**

Discussion collaborative.

**Revision**

Historique/version.

C'est à partir de ces primitives que les modules apparaissent.

Ainsi, « Personnage » n'est pas un sous-système technique isolé : c'est une `Entity` utilisant le schema `character`.

Cela apporte un avantage énorme : l'utilisateur pourrait créer son propre type.

Par exemple :

`EntityType = Planète`

puis définir :

gravité  
atmosphère  
population  
étoile  
lunes  
gouvernement.

Ce principe reprend les forces des champs personnalisables de Scrivener et Plottr, mais l'étend à l'ensemble du monde narratif. citeturn912616search0turn912616search1

Les relations pourraient utiliser une structure voisine de :

`source_entity_id`

`relation_type`

`target_entity_id`

`start_event`

`end_event`

`properties`

La timeline n'aurait donc pas besoin de créer une copie des données : elle interrogerait les événements et relations déjà présents.

De la même manière, une carte ne contiendrait pas « un personnage ». Elle contiendrait une référence vers l'entité personnage.

Ce choix architectural est probablement le point le plus déterminant de tout le projet.

## Ce que je considérerais comme indispensable, important et différenciant

Il serait dangereux de tenter de développer immédiatement tout ce que font les quarante outils étudiés. La bonne stratégie consiste à construire le **socle qui rendra tous les modules futurs possibles**.

| Niveau | Fonction |
|---|---|
| **Indispensable dès le socle** | Comptes et projets multi-utilisateurs |
| **Indispensable dès le socle** | Permissions et rôles |
| **Indispensable dès le socle** | Livre → parties → chapitres → scènes |
| **Indispensable dès le socle** | Éditeur performant + autosave |
| **Indispensable dès le socle** | Drag & drop |
| **Indispensable dès le socle** | Versionnage / restauration |
| **Indispensable dès le socle** | Tags et métadonnées personnalisées |
| **Indispensable dès le socle** | Entités génériques configurables |
| **Indispensable dès le socle** | Relations entre entités |
| **Indispensable dès le socle** | Personnages, lieux et objets |
| **Indispensable dès le socle** | Association scène ↔ personnages ↔ lieux ↔ objets |
| **Indispensable dès le socle** | Recherche globale |
| **Très important** | Corkboard |
| **Très important** | Plot Grid |
| **Très important** | Timeline multi-pistes |
| **Très important** | Ordre narratif distinct de l'ordre chronologique |
| **Très important** | Storylines et arcs |
| **Très important** | Comments / mentions |
| **Très important** | Objectifs et statistiques |
| **Très important** | Inbox d'idées |
| **Très important** | Import/export DOCX |
| **Très important** | Export complet du projet |
| **Différenciant** | Calendriers fictifs |
| **Différenciant** | Calcul automatique âge/durée |
| **Différenciant** | Détection des incohérences temporelles |
| **Différenciant** | Relations évoluant dans le temps |
| **Différenciant** | Graphe de connaissances |
| **Différenciant** | Arbre généalogique automatique |
| **Différenciant** | Carte interactive imbriquée |
| **Différenciant** | Bestiaire |
| **Différenciant** | Cultures / religions / factions |
| **Différenciant** | Magie / technologie |
| **Différenciant** | Langues fictives |
| **Différenciant** | Canvas libre convertible en entités |
| **Différenciant** | Analyses de continuité |
| **Différenciant** | Analyse personnages / POV / arcs |
| **Différenciant** | Analyse pacing / dialogues / répétitions |
| **Plus tard** | Génération cartographique complète |
| **Plus tard** | Générateur de langues |
| **Plus tard** | Mise en page professionnelle |
| **Optionnel** | IA générative |

Le classement ne signifie pas que les fonctions « différenciantes » sont secondaires pour le produit final. Il signifie qu'elles reposent sur le modèle de données précédent.

Par exemple, si l'on implémente correctement dès le départ :

`Personnage + Relation + Événement + Date`

l'arbre généalogique devient principalement une **nouvelle vue**.

Si l'on dispose de :

`Scène + Date + Personnage`

la chronologie personnelle d'un personnage devient également une **vue**.

Si l'on dispose de :

`Scène + Storyline`

le Plot Grid est encore une **vue**.

C'est exactement cette propriété qui permettrait de construire un produit très riche sans créer un monolithe impossible à maintenir.

## Vision du produit résultant

Le meilleur résultat ne serait pas « un Scrivener avec plus de boutons ».

Il pourrait être décrit comme un **IDE pour écrivains**.

Un développeur dispose dans son IDE :

de son code ;  
de son arborescence ;  
de ses recherches ;  
de Git ;  
de tests ;  
d'un debugger ;  
de documentation ;  
de collaboration.

L'écrivain devrait disposer du même principe :

**texte** — manuscrit ;

**arborescence** — parties, chapitres, scènes ;

**modèle du domaine** — personnages, lieux, objets, factions, bestiaire ;

**graphe** — relations ;

**timeline** — événements ;

**cartographie** — géographie ;

**tests** — contrôles de cohérence ;

**Git** — historique et versions ;

**issues** — remarques et tâches ;

**collaboration** — auteurs, éditeurs, bêta-lecteurs ;

**build** — DOCX, EPUB, PDF.

Les produits étudiés montrent que toutes ces briques existent déjà séparément : Scrivener pour le manuscrit et la recherche, World Anvil/Campfire pour le monde, Aeon Timeline pour le temps, LegendKeeper pour le graphe visuel, NovelPad pour les vues multidimensionnelles et le versionnage, Fictionary/ProWritingAid pour l'analyse, Reedsy/Atticus pour la production finale. citeturn912616search0turn912616search3turn912616search5turn484145search7turn993322search25turn867814search2turn884101search6turn884101search0turn849845search20turn849845search1

La véritable innovation serait donc moins d'inventer cinquante fonctions nouvelles que de **faire communiquer parfaitement celles qui existent aujourd'hui dans cinquante outils différents**.

Le principe directeur que je retiendrais pour la conception est :

**Un univers. Une base de connaissances. Un manuscrit. Plusieurs auteurs possibles. Plusieurs représentations des mêmes données. Aucun doublon.**

Et derrière cette simplicité apparente, un modèle suffisamment générique pour qu'un utilisateur puisse écrire aussi bien un thriller de 250 pages qu'une saga fantasy comportant quinze royaumes, trois calendriers, deux lunes, cent personnages, six langues, une généalogie de cinq siècles et plusieurs romans partageant le même univers. Les outils spécialisés montrent que chacune de ces exigences existe déjà individuellement ; aucun des principaux produits étudiés ne les réunit aujourd'hui dans une architecture unifiée centrée sur le récit. citeturn912616search2turn912616search3turn484145search13turn977418search11turn993322search7