# ADR-0020 — Cartes et déplacements contrôlés

**Date :** 2 novembre 2026. **Statut :** choix d’implémentation de la mission UX-2, soumis à réception humaine ; aucune modification du domaine ou des autorisations. [Mission UX](../uxui.md), [ADR-0010](0010-atelier-ecriture-et-concurrence.md), [ADR-0019](0019-atelier-persistant-et-navigation-contextuelle.md), [rapport UX-1B](../UX-1B-REPORT.md).

## Contrat réel conservé

Les vues Écrire, Cartes et Plan présentent les mêmes identifiants et le même EditorialOutline, relu par le service existant dans un snapshot SQL. Aucune carte canonique ni liste d’ordre supplémentaire. La vue Cartes ne charge pas les textes riches pour décorer les cartes : titre, résumé, statut et nombre de mots proviennent du plan. Les propriétés absentes du DTO sont omises ; le contexte utilise les lectures de scène et de références existantes.

`POST /projects/{projectId}/scenes/{sceneId}/move` reçoit le corps strict EditorialMove : `expectedRevision`, `targetParentId`, `beforeId`, `expectedSourceStructureRevision`, `expectedTargetStructureRevision`, et éventuellement `targetStatus` dans le formulaire avancé existant. Il n’accepte pas un nouveau couple chapterId/position/dependencyRevisions ni un If-Match fictif. Les préconditions de structure sont dans le corps, avec Idempotency-Key et protections humaines Origin/CSRF habituelles. If-Match reste celui des routes qui le définissent, notamment la sauvegarde du texte.

La révision Scene est commune au texte et aux métadonnées dans le modèle réalisé : un déplacement la fait progresser avec un snapshot du même JSON riche et des mêmes références. Les révisions de structure des chapitres gouvernent l’ordre ; elles ne sont pas une révision textuelle des voisins. L’UI respecte ce modèle sans introduire une nouvelle sémantique de révision.

La préparation prend un snapshot du plan au début du drag ou à l’ouverture du choix de destination. Un autosave propre à cette instance peut avancer la précondition Scene connue après son acquittement ; les préconditions des deux chapitres restent celles du geste préparé. Le déplacement attend le flush des buffers de texte. Les écritures de texte sont temporairement désactivées pendant la commande et si sa réponse est inconnue. Un refus de flush conserve le brouillon et n’envoie pas le déplacement. Le serveur reste seul responsable d’autorisation, CAS, barrière projet, atomicité, snapshots et audit.

## Présentation et dépendances

Pragmatic Drag and Drop est retenu avec trois paquets exacts : core 4.0.0, auto-scroll 3.2.1 et hitbox 3.0.0. Le registre et les déclarations installées ont été vérifiés ; ces composants sont indépendants du cycle de rendu React. La compilation de production et les parcours réels qualifient leur intégration au projet. [Adaptateur officiel](https://atlassian.design/components/pragmatic-drag-and-drop/core-package/adapters/element/), [autoscroll officiel](https://atlassian.design/components/pragmatic-drag-and-drop/optional-packages/auto-scroll/code), [alternatives accessibles](https://atlassian.design/components/pragmatic-drag-and-drop/accessibility-guidelines/).

La bibliothèque fournit le drag natif, la détection des bords et l’autoscroll des deux conteneurs : tableau horizontal et colonnes verticales. L’application associe uniquement une cible à une commande `beforeId`, sans boucle d’autoscroll maison ni moteur de synchronisation. La poignée est aussi un bouton ouvrant le choix de destination. Le menu Déplacer vers propose chapitre, début/fin et avant/après une scène ; il constitue l’alternative clavier et tactile. Les positions et le chapitre sont annoncés avec la carte ; les zones décoratives de dépôt ne surchargent pas l’arbre accessible.

L’ordre reste celui du dernier plan serveur pendant l’envoi ; seule une indication de confirmation en cours est locale. Le résultat confirmé est suivi d’une relecture. Une indisponibilité de lecture retire le tableau périmé, sans fabriquer un nouvel ordre. Il n’y a pas de déplacement optimiste du canon. Les cartes ne sont pas des éditeurs riches. Les déplacements entre manuscrits restent dans le formulaire avancé préexistant ; les nouvelles destinations de cartes sont limitées au manuscrit sélectionné.

## Conflit, réponse inconnue et annulation

Un 412 conserve l’intention, relit plan et rôle, explique le changement et propose une nouvelle préparation humaine ; aucun rejeu automatique sur une base actualisée. Les formulaires de renommage/métadonnées gardent leur révision de préparation malgré les relectures périodiques. Une révocation produit le refus serveur ; une lecture refusée retire le tableau. Le rafraîchissement de l’UI ne constitue pas une garantie de révocation : les services la contrôlent immédiatement à chaque opération.

En cas de réponse perdue, l’UI conserve en mémoire le corps exact et la clé. « Vérifier et reprendre » renvoie cette même intention. Une relecture affichant un ordre apparent ne suffit pas à annoncer la confirmation. Une reprise dont les anciennes préconditions ne sont plus confirmables demande une nouvelle décision, sans affirmer le résultat initial. Aucun stockage narratif persistant n’est introduit ; fermeture forcée et rechargement restent des limites. Un avertissement navigateur protège les commandes non confirmées en vol.

L’annulation de la dernière commande confirmée est proposée pendant 60 secondes, ou jusqu’au prochain déplacement. Elle crée une commande inverse avec nouvelle clé, révision Scene confirmée, et révisions de chapitres produites par le déplacement. L’ancienne position relative est conservée, sans copie du texte. Toute modification ultérieure d’un chapitre ou de la scène peut faire refuser cette inverse. Le refus relit le plan et propose une nouvelle décision ; aucun retour local de l’ancien tableau, aucune restauration générale de projet.

## Continuité de rédaction et limites

Écrire, Cartes et Plan gardent le même Workshop et le même DraftManager. Le masquage du texte conserve Tiptap ; sa reprise restaure sa sélection et son défilement. Un acquittement de déplacement fait avancer uniquement un buffer propre à la révision attendue. Une relecture au texte identique préserve l’instance et son historique ; un texte distant différent ne remplace jamais un buffer sale, une réponse inconnue ou un conflit. Une lecture ancienne ne fait pas reculer la base d’un buffer propre. Les champs inline restent contrôlés dans l’atelier, avec une seule représentation active.

L’état de lecture des cartes et des colonnes est en mémoire par compte/projet/manuscrit ; aucune donnée narrative, titre ou résumé n’entre dans localStorage. La reprise d’ID et les préférences bornées d’ADR-0019 restent seules persistées. Les cartes relisent le plan et le rôle périodiquement, à la reprise de fenêtre et sur demande, hors geste/envoi ; ce sont des lectures de la source canonique, pas une nouvelle synchronisation temps réel.

Alternatives : DnD artisanal rejeté ; modèle de cartes indépendant rejeté ; réordonnancement optimiste complet non retenu pour cette tranche ; relâchement des préconditions ou du verrou projet interdit. Le coût de contention exclusif reste R-CONT-01 ; aucun benchmark n’est converti en capacité commerciale. Pas d’IA réelle, RLS, exposition publique, purge, graphe ou arc.

## Critères d'acceptation du document

Contrat effectif, ordre canonique, buffers, scopes, bibliothèques, inconnus, conflits et inverse explicités ; tests réels et objectifs humains distingués dans le rapport de livraison ; aucune réception produit ou autorisation d’exploitation implicite.
