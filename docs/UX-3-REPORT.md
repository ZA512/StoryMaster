# UX-3 — Personnages progressifs et relations visuelles

**Date :** 3 novembre 2026. **Réception humaine :** attendue. Mission UX-3 explicitement autorisée, arrêt avant UX-4/5. Départ main propre et synchronisé à `febf35d9dc8f7c011504c2587b503e3824059403`, [CI initiale verte vérifiée](https://github.com/ZA512/StoryMaster/actions/runs/41544838238). [ADR-0021](adr/0021-fiches-progressives-et-relations-narratives.md), [suivi UX](uxui.md), [décisions humaines](HUMAN-DECISIONS.md).

## Réalisation et périmètre

Une fiche unique et trois profondeurs de présentation : Essentiel, Approfondi, Complet. Création intégrée à la Bible, seul le nom obligatoire ; enrichissement par section, listes modifiables et réordonnables, détails repliables. Essentiel montre le premier objectif/trait sans supprimer les suivants. Les mêmes composants et commandes servent dans la Bible et l’inspecteur de l’atelier. La fiche utilise la barre compacte existante, sans refonte de la charte.

Character v2 ajoute seulement background (20 000 caractères) et speakingStyle (4 000), facultatifs. Les schémas restent fermés. Une édition capture sa base et préserve les propriétés masquées ; changer de profondeur n’écrit rien. Les brouillons, demandes inconnues et préférences de profondeur restent en mémoire dans cet onglet, isolés par humain/projet/fiche. Une réponse reçue après démontage réveille la vue remontée. Rien de narratif n’est enregistré dans localStorage ou IndexedDB. Une fermeture forcée ou coupure peut toujours perdre une saisie non confirmée.

Cinq types canoniques ajoutés : parent_of, sibling_of, ally_of, rival_of, mentor_of. Une seule identité par lien ; inverse de parent/mentor et lecture symétrique dans les deux fiches. parent_of est orienté, acyclique toutes qualifications confondues ; nature biologique/adoptive/sociale/tutelle/non précisée et rôle père/mère/parent explicitement choisis. Aucune inférence de genre, de fraternité ou de chronologie, aucune limite arbitraire à deux parents, aucune conversion des anciens related_to. La liste, le détail, les confirmations de retrait, l’historique et la restauration par nouvelle révision utilisent le moteur existant.

Carte interactive React Flow 12.12.1, layout Dagre 3.1.3, MIT, choix comparé dans l’ADR. Sélection de fiches/liens, détail, ouverture de fiche, expansion, filtres, pan/zoom, recentrage et retour au point initial. Les liens parallèles restent distincts et leurs libellés sont séparés. L’expansion recalcule les positions automatiques, garde les déplacements manuels et recadre les nouvelles fiches. Déplacer une fiche ne modifie que son dessin. Tirer une connexion prépare le formulaire : aucun lien automatique, annuler n’enregistre rien. La vue Liste propose les mêmes commandes essentielles, sans parcours obligatoire du graphe et avec phrases/qualifications textuelles.

Chargement progressif : 20 relations par page, au plus 60 fiches, 200 liens et 30 pages développées ; mention permanente « exploration partielle ». Le détail de fiche préexistant peut déjà lire jusqu’à 100 liens ; ce plafond reste distinct de la première page de la carte. Ces bornes sont techniques, pas des quotas métier. Positions et viewport en mémoire uniquement. Les données affichées sont des projections des GET autorisés, pas un second référentiel. Une commande confirmée déclenche une relecture ciblée, y compris de l’arête créée entre deux voisins.

## Fichiers modifiés

| Ensemble | Fichiers principaux |
|---|---|
| Fiches et atelier | [character-fields.tsx](../apps/web/components/narrative/character-fields.tsx), [character-create.tsx](../apps/web/components/narrative/character-create.tsx), detail/home/history/shared, [inspecteur](../apps/web/components/writer/context-object.tsx), Shell et CSS |
| Relations et carte | [relation-section.tsx](../apps/web/components/narrative/relation-section.tsx), relation-form/detail/presentation, [relation-workspace.tsx](../apps/web/components/narrative/relation-workspace.tsx), [relations-graph.tsx](../apps/web/components/narrative/relations-graph.tsx), graph-data, mémoire et hooks de commandes/lecture |
| Modèle et contrats | packages/domain, contracts, application et infrastructure/narrative ; migrations [0015](../packages/infrastructure/migrations/0015-character-profiles.sql) / [0016](../packages/infrastructure/migrations/0016-character-relations.sql), registres v2, OpenAPI, opérations, catalogues IA/MCP et générateurs |
| Qualification | Tests UX-3 PostgreSQL/HTTP/unitaires/navigateur, anciens oracles de migration et parcours UI adaptés, archives et restauration physique, validateur documentaire et ses mutations |
| Documentation | ADR-0021, ce rapport, uxui, décisions humaines, audit/traçabilité, domaine/API/archives/tests, roadmap et README ; galerie et relevé synthétique des résultats |

Le registre v1, les migrations antérieures à 0015, le PRD et le registre des exigences ne sont pas modifiés. Les dépendances graphiques épinglées et leur verrou npm concernent le web.

## Contrats, concurrence et sécurité

Même API métier et mêmes cas d’usage pour web, assistant, MCP et worker. Aucun endpoint ou scope ajouté. Les révisions de ressources et des deux extrémités, les modules actifs, les permissions fraîches, le refus interprojet, les contraintes SQL et la barrière projet restent imposés côté serveur. Le cycle de filiation est contrôlé dans le graphe final, également lors d’une proposition temporaire. Les conflits ne changent pas automatiquement une base locale : comparer, adopter explicitement puis confirmer. Une réponse inconnue conserve exactement corps, révision et clé jusqu’à reprise explicite ; relire n’est pas confirmer.

Les formulaires avancés préexistants gardent aussi leur base capturée. Relectures initiales, au focus, après commande et toutes les 12 secondes visibles ; une réponse de lecture tardive ne remplace pas une lecture plus récente. Une erreur d’autorisation retire la projection ; un incident réseau désactive les nouvelles commandes tout en conservant la saisie. Les réponses inconnues restent inconnues si une reprise ne peut plus être autorisée.

Les propositions v2, leur projection finale, les snapshots, exports et catalogues fermés assistant/MCP comprennent les nouveaux schémas et types. Les acteurs IA ne gagnent aucun droit sur le canon, l’approbation ou la fusion. Registre v1, PRD, 150 exigences, priorités, versions et 100 MUST conservés. La mission avance seulement cette parenté et ce graphe malgré la généalogie spécialisée V2+ du PRD ; aucun moteur généalogique complet ni fonction temporelle ajouté.

## Migrations et protection de l’installation

0015 publie characters/2 et étend les CHECK. Les activations characters passent à la nouvelle définition avec révision et snapshot système explicites, en gardant enabled/off. Les anciennes fiches restent v1 jusqu’à une édition explicite utilisant v2 ; textes et anciens snapshots ne sont pas réécrits. Les nouveaux projets initialisent une activation par module sur la dernière définition publiée.

0016 ajoute les cinq types et qualifications, l’ordre symétrique, deux colonnes calculées et des clés étrangères composites de type character. Elle ne convertit ni ne supprime les relations existantes. Les deux migrations appliquées sont désormais immuables. Une restauration ancienne reprend le schéma de son snapshot dans une nouvelle révision.

Avant migration personnelle : sauvegarde chiffrée `e1b1a5a4-96b9-49a5-a335-a5d375f61dc4`, 128 177 601 octets, hors dépôt, clé séparée. Restauration native isolée et quarantaine en 5 992 ms, copie arrêtée et volume conservé. Après 0015, les 50 tables non concernées sont identiques par empreintes avant/après ; les modifications d’activations sont vérifiées précisément par le test de migration remplie. Après 0016, les anciennes colonnes des 54 tables contrôlées sont toutes identiques. Aucun reset de la base personnelle, suppression de volume ou restauration sur l’installation principale.

Le test physique post-évolution restaure réellement une fiche v2 détaillée et un lien parent_of : 55 tables, 247 lignes, 829 contraintes et les six tables Keycloak contrôlées, snapshot natif vérifié, réseau désactivé. Sauvegarde 138 174 579 octets ; restauration 7 172 ms lors de la passe dédiée. Anciennes sessions/OAuth/grants et jobs hérités sont mis en quarantaine ; une nouvelle session humaine est qualifiée. Installation principale inchangée. Les tests navigateur peuvent rejouer cette preuve et produire d’autres durées locales ; aucune promesse de RPO/RTO global.

## Scénarios A–O et preuves

| Scénario | Vérification exécutée |
|---|---|
| A — Création | Nom seul, consultation, description puis motivation, aucune propriété effacée |
| B — Profondeurs | Zéro PATCH au changement de niveau ; rechargement Essentiel ; listes, voix, attributs et notes conservés |
| C/D/E — Liens | Inverse unique, père/mère biologiques et troisième parent adoptif, fraternité explicite symétrique, pas de fraternité déduite |
| F — Intégrité | PostgreSQL/HTTP : auto-lien, types, référence absente/interprojet, doublon, qualification invalide et cycle refusés sans mutation partielle ; cycles concurrents |
| G/H — Carte | Sélection réelle, détail, déplacement sans écriture, connexion annulée puis confirmée ; liste et fiches relues ; liens parallèles distincts |
| I — Clavier | Créer/modifier/retirer et rétablir une version depuis la liste, noms/focus/annonces, Escape et axe ; pas de certification lecteur d’écran globale |
| J — Concurrence | Deux vrais auteurs, base locale figée malgré actualisation, 412, saisie conservée, comparaison/adoption/reconfirmation explicites |
| K/L — Droits | Interface volontairement périmée : révocation refusée côté serveur ; module off conserve les fiches et liens en lecture |
| M — Propositions | Créations temporaires v2 et parenté, cycle final refusé, fusion humaine, histoires anciennes lisibles, IA sans nouveau pouvoir |
| N — Archives | ZIP réel, valeurs/version/identité/histoire/hashes et schémas ; vraie restauration physique isolée post-évolution |
| O — Charge | 72 personnages, 201 relations, 12 lectures, premier affichage et expansion bornés, pas d’erreur navigateur ; aucun SLA extrapolé |

Autres cas : réponse perdue après COMMIT de fiche/relation, corps et clé de reprise identiques, une seule révision ; changement de fiche pendant l’acquittement et retour au brouillon non confirmé après démontage ; création depuis l’inspecteur, passage à la carte puis retour au même texte, hash et révision de scène inchangés.

## Validations et anomalies rencontrées

Validation documentaire : JSON, JSON Schema, OpenAPI, catalogue MCP et cohérence/traçabilité ; 57 tests du validateur, dont mutations de sens, définition historique et qualification à décomptes constants. TypeScript, lint, frontières architecturales et tous les générateurs synchronisés. Build de production Next.js dans Docker.

Passe applicative complète exécutée en série : 300 tests, 299 réussis, une restauration volontairement séparée ; celle-ci a réussi dans sa commande dédiée. Six campagnes de mesures historiques (contention, scènes, recherche narrative, collaboration, propositions, recovery) réussies ; Spike A isolé : TypeScript, tests PostgreSQL, mesures et trois tests navigateur réussis. Qualification MCP locale sans LLM : deux versions de protocole, treize outils, lecture/proposition/rejeu/révocation. Aucune clé ni appel fournisseur réel.

Qualification navigateur : 57/58 réussites à la passe globale ; le dernier défaut de sélection a été corrigé, puis les onze scénarios UX-3 ont tous réussi lors des rejeux ciblés (10 succès, puis le geste graphique adapté à son nouveau bouton accessible et réussi séparément). Les Lots 0–7, UX-1/1B et UX-2 sont ainsi couverts, avec le résultat de chaque passe conservé. Le compte rendu final de la mission indique le SHA publié et le résultat réellement observé de sa CI complète ; une passe locale ciblée ne remplace pas cette CI. La première campagne n’est pas une preuve verte : ancienne attente de formulaire complet dans des tests Lot 3/7, limites de requêtes, et interférence d’une passe applicative avec le redémarrage réel de PostgreSQL/port MCP ont été identifiés. Les campagnes dépendantes sont désormais séquentielles. Les préparations navigateur respectent Retry-After ; aucun 401/403 ignoré ni protection serveur relâchée.

Corrections effectivement effectuées pendant le travail : erreurs de validation manuelles auparavant rendues 500 au lieu de 422 ; null d’attributs distingué de l’absence ; comparaison snapshot canonique/DTO ; conservation des attributs v1 et propriétés masquées ; sélection du dernier registre publié ; acquittement observable après démontage ; lecture tardive et base de formulaire figée ; boucle React à la sélection d’une arête ; focus à la fermeture ; contraste des onglets ; séparation des libellés parallèles et couche HTML accessible pour éviter leur interception par les zones SVG d’autres liens. Les anciens tests de migration vérifient précisément les nouveaux snapshots système, tout en comparant toutes les anciennes données. Les sélecteurs des tests suivent les nouveaux accès sans retirer les assertions de sécurité ou conservation.

## Mesures locales

Corpus synthétique : 72 personnages, 201 liens. Douze lectures HTTP de 20 relations : médiane et p95 consignés dans le relevé, avec temps d’ouverture de la carte. Le comptage des requêtes de carte exclut le GET de détail de fiche préexistant. La première page affiche 21 nœuds et 20 liens ; deux expansions atteignent 60 nœuds et 59 liens, avec borne explicitement annoncée et aucune erreur navigateur. La borne de 200 arêtes est exercée dans le test unitaire de projection, pas présentée comme 200 arêtes visibles dans cette mesure navigateur.

La somme des chunks référencés par l’import graphique dynamique, CSS compris, est mesurée séparément des tailles npm : valeurs dans le relevé. Le gzip y est calculé sur les fichiers du build ; il ne s’agit pas d’un transfert réseau mesuré ni d’un SLA. Les résultats sont locaux, sans extrapolation de disponibilité, de charge de production ou de performances humaines.

## Captures et réception humaine

[Galerie native](../artifacts/ux3-2026-11-03/index.html) et [relevé des validations](../artifacts/ux3-2026-11-03/validation-results.json) dans `artifacts/ux3-2026-11-03`, aux dimensions demandées 1280 × 720, 1440 × 900, 1920 × 1080 et 1000 × 720. Images non retouchées ; préférences actuelles conservées. Comparaisons avant/après de la même fiche ancienne, puis univers synthétique de revue avec fiches, parents, sœur/frère, mentor, rival, allié et manuscrit. Les dimensions réellement encodées sont consignées dans le manifeste, les dimensions natives différant parfois du viewport demandé. Aucune donnée utilisateur remplacée pour fabriquer une capture.

Restent humains : réception d’UX-3, formulations, lisibilité et confort des fiches/relations/carte, parcours clavier et lecteurs d’écran réels, objectifs proposés de création <60 s, parenté <30 s, accès depuis une scène <10 s. Aucun temps humain inventé. Brouillons après crash, SEC-07/TLS, GO-03 commercial, GO-04, RLS et R-CONT-01 restent ouverts. Pas de CharacterArc/CharacterBeat, faits/croyances, temporalité implicite, purge ou exposition publique. Arrêt après cette livraison, avant UX-4/5.

## Critères d'acceptation du document

Capacités, schémas et migrations, protection de l’installation, tests exécutés, échecs corrigés, limites de mesure et de récupération, captures et décisions humaines identifiables ; aucune réception ou CI déduite de la présence du rapport.
