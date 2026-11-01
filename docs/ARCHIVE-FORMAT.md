# Archive narrative de projet, format 1

Contrat du Lot 7 : ZIP avec `manifest.json`, `project.json` et `manuscript.md`. Le JSON UTF-8 est canonique : `format=storymaster-project-archive`, `formatVersion=1`, `projectId`, `capturedAt` et `families`. Les familles sont les projections versionnées des tables métier, avec noms de colonnes SQL ; les identifiants narratifs restent stables. Les contenus riches et snapshots conservent leurs versions de format. Aucun réimport applicatif n’est fourni.

Le manifeste décrit le projet, les versions, les compteurs par famille et chaque fichier de données avec taille et SHA-256. Son propre hash n’est pas inclus dans son inventaire pour éviter une dépendance circulaire. `manuscript.md` est une lecture dérivée avec perte possible de présentation. Les archives ne sont pas chiffrées : une fois téléchargées, leur protection relève du propriétaire.

Le snapshot SQL unique couvre projet/révisions, appartenances minimisées, manuscrits, chapitres, scènes/révisions/changements/horloges, objets/relations/références/révisions/changements/modules/définitions, discussions/commentaires/ancrages/révisions/horloge, propositions/révisions/revues/événements/ChangeSets/événements de ressources et audits narratifs. Les références utilisateur sont pseudonymisées dans le projet ; les noms d’attribution saisis restent lisibles. La pseudonymisation ne rend pas le texte littéraire anonyme.

Sont exclus : identités externes, emails de comptes, invitations et leurs historiques, sessions, secrets, credentials, grants et preuves MCP, capacités, budgets et conversations IA privées, jobs et journaux techniques. L’intention IA explicitement publiée en proposition reste narrative. La provenance indique le canal et le modèle/client compréhensible, sans délégation ni preuve d’authentification.

Bornes techniques, sans quota commercial : 100 000 lignes et 64 Mio de JSON/ZIP, 60 secondes par tentative, bail 90 secondes. Dépassement explicite, aucune troncature. Au plus deux jobs en attente par utilisateur et vingt artefacts vivants par projet. Les fichiers temporaires expirent après 24 h ; cette durée technique ne purge aucun historique et ne vaut pas acceptation de GO-04.

La demande est réservée aux humains owner/admin/author avec session active. Le cas d’usage métier commun vérifie ces droits à la demande, au démarrage et avant publication. Le téléchargement recontrôle l’utilisateur demandeur, la session actuelle et les droits courants. Aucun chemin de stockage n’est fourni au navigateur. Les workers utilisent uniquement l’intention persistée pour le même export et aucune autorité canonique. Une restauration annule les jobs hérités avant toute activation.

## Critères d'acceptation du document

Les tests doivent examiner le contenu réel, les liens et hashes, la cohérence concurrente, les exclusions, les quatre contrôles d’autorisation, les limites, l’annulation, l’expiration et la reprise sans double publication. Ce document ne prouve pas l’exécution de ces tests.

## Nettoyage local

`temporaryExportCleanup` inventorie les seuls ZIP privés dont le job appartient à l’époque courante. L’aperçu est le défaut. Les fichiers inconnus, liens symboliques et permissions ouvertes arrêtent le nettoyage. L’application effective exige l’approbation opérateur `TEMP_EXPORT_CLEANUP_APPROVED=true` et n’est pas activée dans ce lot. Les essais abandonnés doivent avoir plus de trois minutes. Les sauvegardes et historiques ne sont jamais concernés.

## Visibilité de l’historique

Le champ `access` du JSON et du manifeste indique la portée : owner/admin disposent de l’historique complet des commentaires et appartenances ; un auteur reçoit seulement ses propres historiques de commentaires et aucun historique d’appartenances. Les discussions et états courants restent présents. Ce masquage est réalisé dans le même SELECT, avant toute lecture de ces corps privés. `completeForProject=false` empêche de présenter une copie auteur comme l’archive historique complète d’un responsable. Un déclassement des droits entre préparation, publication ou téléchargement interdit de récupérer le fichier plus privilégié ; demander une nouvelle archive avec les droits actuels.

La commande opérateur est `npm run ops:cleanup-exports -- --preview`. Son digest doit être fourni identiquement à `--apply DIGEST`, en plus de l’accord d’exploitation explicite. Chaque demande et suppression effective est journalisée sans nom de fichier ni contenu dans operational_events avec UID opérateur/corrélation/digest ; aucun faux acteur humain n’est attribué à cette opération de machine. Le test de suppression utilise exclusivement un répertoire et un projet synthétiques `_test`.
