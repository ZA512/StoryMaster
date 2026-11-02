# ADR-0019 — Atelier persistant et navigation contextuelle

**Statut :** choix d’implémentation UX-1 à réceptionner, direction graphique finale non validée.
**Date :** 2 novembre 2026.
**Sources :** demande du propriétaire d’avancer sur [uxui.md](../uxui.md), [PRD §14](../PRD.md), [feuille UX](../UX-FUTURE-ROADMAP.md), [ADR-0010](0010-atelier-ecriture-et-concurrence.md), [ADR-0017](0017-recuperation-locale-des-brouillons.md).

## Décision et portée

La première tranche concerne l’atelier d’écriture : plan, éditeur et inspecteur restent montés pendant le masquage des panneaux et le mode concentration. L’éditeur conserve son DraftManager, son document ProseMirror et ses préconditions. La fiche contextuelle, sa liste de relations et la lecture d’une seconde scène utilisent les lectures autorisées existantes. La seconde scène est explicitement une version enregistrée en lecture seule ; elle ne représente pas un second buffer éditable.

Créations manuscrit/chapitre/scène dans le plan, titre de scène modifiable sur place, palette de navigation/recherche et récents constituent des représentations des commandes existantes. Les commandes de déplacement, d’historique, de restauration et d’export restent accessibles. Aucun nouveau contrat HTTP, table, migration, droit ou domaine narratif n’est ajouté.

Le 2 novembre, le propriétaire choisit explicitement « Garder les brouillons en mémoire pour le moment ». Le coffre d’ADR-0017 reste différé. Cette tranche ne revendique pas l’absence de perte après crash et ne clôt pas UX-1.5. Les cartes, DnD, annulation structurelle, graphes et arcs ne sont pas livrés par ce changement.

## État local et confidentialité

Deux catégories seulement sont persistées dans localStorage : disposition bornée par utilisateur (panneaux visibles, largeurs du plan 240–320 px et de l’inspecteur 280–360 px) et ID opaque de dernière scène par utilisateur/projet. Aucun titre, texte, résumé, extrait, référence narrative, cookie, jeton ou brouillon n’y entre. Un stockage indisponible déclenche une information et conserve un fonctionnement en mémoire.

Défilement par scène, chapitres ouverts et six IDs récents restent dans la mémoire de l’onglet, isolés par utilisateur/projet. Les noms sont reconstruits depuis le plan relu. Un ID local n’est jamais une permission : la lecture serveur est exigée avant d’afficher un document. Un ID interprojet ou retiré ne donne aucun accès ; erreur visible, pas d’adoption d’un buffer comme canon.

Le masquage des panneaux et le changement d’onglet de l’inspecteur préservent leurs champs. Changer de scène garde les buffers de texte/références selon le mécanisme existant ; cela ne promet pas de conserver tous les formulaires après un rechargement. Les reprises de réponses perdues utilisent la même intention/clé ; une intention confirmée libère sa clé côté UI. Un conflit CAS garde le formulaire et nécessite une décision humaine.

## Alternatives et conséquences

Un gestionnaire de fenêtres arbitraire augmenterait les chemins de focus et les possibilités de buffers divergents. Une disposition déterministe avec séparateurs manipulables au pointeur/clavier et contrôles de largeur explicites est retenue pour cette première tranche. Sous 1280 px, l’inspecteur devient un panneau superposé masquable ; sous 761 px, le plan aussi. L’éditeur reste le centre de travail. Les apparences et taille de police existantes sont réutilisées, sans nouvelle identité de marque imposée.

La palette utilise le plan autorisé et la recherche serveur existante, avec annulation logique des réponses périmées. Elle présente des boutons accessibles au clavier, pas un moteur de commandes privilégié. La modification d’une fiche depuis l’inspecteur réutilise ObjectForm, ses validations et son CAS. Les listes complètes restent disponibles depuis la fiche ; l’inspecteur respecte la pagination des lectures existantes.

## Risques et qualification

Régressions possibles : perte de focus, remount d’éditeur, réponse tardive remplaçant la mauvaise scène, confusion entre scène en regard et texte en cours, contraste ou contrôle masqué. Vérifier ces parcours avec vraie API/Keycloak et les tests existants d’autosave/CAS, références, commentaires et rôles. Aucune amélioration de contention, qualification TLS SEC-07, RLS, IA commerciale ou sécurité publique n’est déduite de l’UX.

## Critères d'acceptation du document

Portée de présentation séparée du canon ; autorisations et révisions conservées ; stockage local décrit exactement ; limite après crash maintenue ; résultats exécutés et étapes restantes dans le [rapport UX-1](../UX-1-REPORT.md). Réception humaine de cette tranche et de la direction visuelle encore attendue.
