# ADR-0017 — Brouillons locaux après interruption

Statut : **décision proposée, fonctionnalité différée ; réserve du Lot 1 maintenue**. La mission Lot 7 autorise explicitement cette issue si une récupération suffisamment sûre ne peut être livrée. Aucun stockage persistant narratif supplémentaire n’est activé.

## Constat et périmètre

Le gestionnaire actuel isole les brouillons en mémoire par utilisateur/projet/scène, utilise des générations d’autosave et le CAS, expose les conflits et permet de télécharger le brouillon. Un arrêt du navigateur peut perdre le texte non confirmé. L’avertissement de départ ne couvre pas une panne électrique. Il faut conserver cette limite dans le rapport et les parcours humains.

## Alternatives

| Solution | Conséquence | Avis |
|---|---|---|
| Texte clair en localStorage/IndexedDB | Simple mais manuscrit lisible durablement sur navigateur partagé, quotas et suppressions implicites | Refusée |
| Clé AES stockée avec le texte chiffré | Ne protège pas contre la lecture du profil ; promesse de confidentialité trompeuse | Refusée |
| Clé de session serveur automatiquement réutilisée | Couplage au retour d’identité, révocation/restauration et expiration ; peut rendre le brouillon irrécupérable | Qualification supplémentaire indispensable |
| Coffre facultatif IndexedDB AES-GCM avec phrase secrète humaine | Secret uniquement en mémoire, liaison authentifiée utilisateur/projet/scène/baseRevision, dérivation coûteuse et versions ; récupération explicite après déverrouillage | Recommandée pour un chantier court distinct |
| Comportement actuel + téléchargement explicite | Pas de persistance cachée ni nouvelle fuite ; risque de perte non confirmé conservé | Maintenu dans ce lot |

## Conditions avant livraison du coffre recommandé

Activation volontaire désactivée par défaut ; phrase secrète jamais enregistrée/transmise ; clés effacées au changement de compte et à la déconnexion ; enregistrement chiffré avec TTL choisi, limite de stockage et nettoyage ; aucun inventaire d’un autre compte. À la reprise : afficher « brouillon retrouvé », lire la révision distante, comparer, restaurer dans l’éditeur ou ignorer, sans autosave avant choix. Conserver la baseRevision d’origine pour le CAS. Aucun remplacement serveur silencieux. Une session navigateur compromise peut lire le texte et la clé déverrouillée : aucune protection annoncée contre ce cas.

Le gestionnaire d’autosave est actuellement conservé entre montages de pages. Ajouter un coffre demande de qualifier ensemble les générations en vol, la perte de réponse, les références et le changement de compte ; livrer seulement le chiffrement ne suffirait pas. La revue actuelle privilégie la conservation du comportement qualifié. Cette décision maintient la réserve des brouillons non confirmés, distincte d’UX-08 (réduction des panneaux, déjà livrée). OBJ-09/EDIT-03/NFR-01 restent qualifiés pour les enregistrements confirmés, sans garantie nouvelle de récupération de saisie non confirmée.

## Validation humaine attendue

Accepter le maintien temporaire de la réserve ou autoriser le coffre avec phrase secrète, sa durée locale et son parcours de déverrouillage. Aucun calendrier ni activation automatique proposé.

## Critères d'acceptation du document

Avant clôture future : tests fermeture/crash, nouvelle session, phrase erronée, quota, expiration, changement d’utilisateur, conflit serveur, réponse perdue et CAS ; revue de confidentialité du profil navigateur. Les spécifications de ces tests ne sont pas présentées comme exécutées.

## Choix du propriétaire — 2 novembre 2026

Pendant la préparation UX-1, le propriétaire choisit explicitement « Garder les brouillons en mémoire pour le moment » après présentation du coffre facultatif et de ses modalités. Aucun coffre, TTL local ni persistance narrative n’est activé. L’atelier conserve l’avertissement de perte possible des textes non confirmés après interruption. Cette décision n’accepte pas l’implémentation du coffre proposé et ne clôt pas la réserve. [Rapport UX-1](../UX-1-REPORT.md).
