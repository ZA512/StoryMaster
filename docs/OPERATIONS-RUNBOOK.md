# Exploitation locale et récupération

Portée : Docker Compose personnel, PostgreSQL 18 épinglé, Keycloak local, simulateur IA seul. GO-04 reste proposé. Aucune commande de ce document n’autorise une restauration sur la base principale, une purge utilisateur ou une exposition publique.

## Première installation et montée de version

Configurer `.env` depuis `.env.example`, avec secrets locaux privés. `AUTHORIZATION_EPOCH_DIRECTORY_HOST` doit être un répertoire hors sauvegarde historique, possédé par le même UID que l’API/MCP (`APP_RUNTIME_UID`/`APP_RUNTIME_GID`, 1000 par défaut). Garder ses permissions 0700. Ce témoin évolue aux révocations : le monter en répertoire, pas comme ancien fichier figé. Le service `prepare-exports` prépare uniquement le nouveau volume d’artefacts temporaires, sans réseau.

Avant migration : vérifier disque et services, capturer les empreintes (`scripts/capture-project-data.ts`), sauvegarder et éprouver la copie isolée. Ne jamais modifier une migration déjà appliquée ni lancer `down --volumes` sur l’installation personnelle.

Pour une installation initiale, ou la première adoption du Lot 7 après backup vérifié :

```sh
docker compose -f compose.yaml -f compose.test.yaml up -d --build --wait postgres keycloak migrate
npm run authority:init -- /chemin/prive/storymaster-authority/current.json
docker compose -f compose.yaml -f compose.test.yaml up -d --build --wait api web
```

Le chemin doit correspondre aux deux variables de fichier/répertoire d’époque de `.env`. L’adoption initiale refuse un état SQL déjà initialisé et n’invalide pas les données existantes. **Ne jamais utiliser cette adoption pour contourner une restauration ou un désaccord de témoin.** Après adoption, une montée de version ordinaire ne relance pas cette commande. MCP demeure désactivé par défaut.

Arrêt normal : `docker compose stop`, sans suppression de volume. Démarrage ordinaire après adoption : `docker compose up -d --wait`. Contrôler readiness et migrations ; une erreur d’époque exige investigation, pas copie d’un ancien témoin.

## Backup local reproductible

Choisir une destination privée hors dépôt et hors disque source si possible. Aucun nettoyage de backup n’est automatique. Les clés ne vont jamais dans le même répertoire que les sauvegardes.

```sh
npm run backup -- keygen /chemin/prive/cles/backup-v1.key
npm run backup -- create /chemin/prive/sauvegardes /chemin/prive/cles/backup-v1.key
npm run backup -- verify /chemin/prive/sauvegardes/UUID /chemin/prive/cles/backup-v1.key
npm run backup -- restore-isolated /chemin/prive/sauvegardes/UUID /chemin/prive/cles/backup-v1.key /chemin/prive/qualification
```

`create` prend un backup physique cohérent de tout le cluster (application, base de test locale et Keycloak) avec WAL nécessaires. Tablespaces externes, bases inattendues, version/image différente, destination indirecte, place insuffisante et limite dépassée sont refusés. Trois composants chiffrés séparés : cluster, secrets requis, configuration/dépendances/référence de code. AES-256-GCM avec sous-clés HKDF distinctes ; manifeste authentifié HMAC et SHA-256 des ciphertexts ; marqueur COMPLETE durable. La clé externe de backup n’y figure jamais. Aucun texte narratif ou secret en paramètres/logs.

`verify` authentifie intégralement tous les composants mais **ne prouve pas la restauration PostgreSQL**. `restore-isolated` extrait dans un nouveau volume, vérifie le manifeste natif et les WAL avec `pg_verifybackup`, démarre réellement PostgreSQL sans réseau, ports, API, Keycloak, MCP ou worker ; applique les migrations compatibles, renouvelle l’époque externe et invalide les accès hérités dans les bases applicatives. Des sockets locaux courts évitent la limite Linux des chemins Unix. Le résultat indique le projet Compose et le répertoire du rapport ; aucun secret n’est affiché.

Arrêt de la copie : `npm run backup -- stop-isolated PROJET_ISOLE SOCKET`. Les volumes isolés restent conservés ; aucune suppression générique n’est fournie. L’exercice automatisé utilise des données synthétiques dans la base `_test` et vérifie aussi les empreintes de la base principale.

## Remise en service après incident

1. Isoler/arrêter les services et préserver les traces techniques minimales. Ne pas effacer le volume défaillant pour masquer une corruption.
2. Choisir un backup COMPLETE, sa clé historique séparée et le code/image référencés. Vérifier les composants, puis restaurer une copie isolée.
3. Comparer schéma/contraintes/empreintes, liens, snapshots, propositions/ChangeSets, conversations simulées et audit. Déchiffrer uniquement les credentials fictifs du test. Une version de migration inconnue ou checksum différent arrête la procédure.
4. Vérifier nouvelle époque en quarantaine, sessions révoquées, grants révoqués, capacités invalides, jobs annulés et aucun ancien envoi. L’état `unknown` d’une exécution interrompue reste incertain ; ses réservations de budget sont conservées pour revue, sans remise à zéro qui effacerait une incertitude.
5. Obtenir une autorisation humaine distincte avant toute substitution de l’installation principale. Préparer les nouvelles clés et le témoin hors sauvegarde. Ne jamais réadopter un ancien témoin pour débloquer les accès.
6. Activer d’abord les nouvelles connexions humaines après vérification. Chaque client MCP doit recevoir une nouvelle autorisation humaine. Fournisseurs externes toujours fermés ; workers uniquement après revue des états hérités. Vérifier les droits et la conservation après redémarrage.

`activateIsolatedRecovery` est une primitive opérateur utilisée par la qualification après les contrôles, sans démarrer de service. Elle ne ressuscite aucun grant/session et ne vaut pas autorisation de remettre la machine principale en service. Les comptes/sessions Keycloak appartiennent à une frontière distincte : une ancienne preuve IdP encore valide ne suffit pas à utiliser un grant restauré. L’invalidation globale IdP n’est pas promise.

## Diagnostic ciblé

| Incident | Réaction sûre |
|---|---|
| Disque perdu | Récupérer copie hors machine et clés historiques séparées ; si elles manquent, récupération non garantie |
| Corruption PostgreSQL | Arrêter écritures, conserver volume, backup sain vers nouvelle copie ; jamais effacer les lignes en erreur |
| Backup incomplet/manifeste altéré/mauvaise clé | Refus ; conserver l’échec et choisir une autre copie/clé, aucune extraction ou mise en service |
| Migration incompatible | Reprendre code/image référencés ; corriger par migration additive après qualification, jamais éditer les checksums appliqués |
| Keycloak indisponible | Connexions/OAuth échouent ; aucun contournement par identité client déclarée, vérifier sa DB et readiness |
| Témoin absent/incohérent ou commit interrompu après scellement | API/MCP/worker restent fermés ; préserver fichier et SQL, qualifier une reprise avec nouvelle époque et invalidation, pas de recopie ancienne |
| Job bloqué | Consulter statut/bail, espace et logs par code/correlation ; bail dépassé repris avec nouveaux droits, aucune publication forcée |
| Incident de confidentialité | Arrêter exposition locale concernée, révoquer clients/grants et sessions, préserver audit, inventorier archives déjà téléchargées ; elles ne peuvent être retirées du disque destinataire |
| Révocation MCP urgente | Interface Délégations → révoquer, vérifier refus du token ; si indisponible arrêter le service MCP. Ne pas modifier SQL en cachette sans sceller le témoin |

## Rotation et récupération des clés

Pour le backup, générer `backup-v2.key`, tester create/restore avec cette nouvelle clé, conserver v1 tant qu’une copie v1 est retenue ; ne jamais écraser le fichier de clé. Deux copies protégées séparées sont proposées à GO-04, sans emplacement ni opérateur validé automatiquement. Le manifeste désigne la clé par empreinte, sans la contenir.

Pour les credentials du simulateur : ajouter une version au keyring, passer la nouvelle version active et utiliser le rewrap existant ; conserver anciennes versions jusqu’à vérification des copies historiques. Un backup ancien contient son composant de secrets chiffré ; sa clé externe reste nécessaire. Remplacer une clé sans conserver la version historique rend la copie concernée inutilisable. Les secrets de session remplacés invalident le déchiffrement des anciennes preuves ; reprendre via nouvelles sessions en quarantaine. Toute clé réelle de fournisseur reste hors périmètre GO-03.

## Rétention et supervision

`scripts/operations/retention-preview.ts` est en lecture seule. Le nettoyage des seuls ZIP temporaires expose un aperçu et reste effectif désactivé tant que GO-04 n’a pas autorisé la commande. Aucun snapshot, commentaire retiré, proposition, audit, conversation privée, session/grant, backup ou clé n’est purgé automatiquement. Voir [proposition GO-04](GO-04-DECISION-PROPOSAL.md).

La supervision n’enregistre que santé, versions/checksums, compteurs, délais, codes d’erreur et espace. Aucune scène, prompt, clé, token, email ou payload privé. Les durées locales de restauration ne sont ni un RTO contractuel ni un SLA. Le témoin externe ajoute une section de verrouillage pour les mutations de sécurité ; la mesurer dans la campagne mixte et conserver R-CONT-01 tant que la charge cible n’est pas qualifiée.

## Critères d'acceptation du document

Une personne autorisée sait sauvegarder sans suppression, vérifier une copie réellement restaurée, refuser les erreurs, retrouver les clés et identifier les décisions humaines nécessaires. Les commandes de production destructives et la politique GO-04 ne sont pas activées par ce document.

Les métadonnées signalent un arbre Git modifié. Une sauvegarde de qualification réalisée pendant le développement récupère le cluster et les secrets ; le commit référencé seul ne reconstruit pas du code non committé. Pour une copie d’exploitation après livraison, vérifier Git propre et conserver le commit livré ainsi que les images épinglées. Ne pas présenter une copie de travail en cours comme une release reproductible.

Ordonnanceur local : `npm run backup:scheduler -- --preview` ne lance rien. Après décision GO-04 explicite, l’opérateur peut configurer BACKUP_ROOT/BACKUP_KEY_FILE/BACKUP_INTERVAL_SECONDS et activer son processus avec BACKUP_SCHEDULE_APPROVED=true. Il fonctionne sans suppression, sans chevauchement d’exécutions, journalise seulement résultat/durée/identifiant et traite les échecs explicitement. Aucune installation automatique en service/cron n’est faite. Les sous-processus d’exploitation ont une limite technique de 15 minutes ; une interruption laisse un backup incomplet refusé à la reprise.

Le bootstrap Docker équivalent à la commande hôte est `docker compose --profile operations run --rm initialize-authority`, après préparation du répertoire privé et exécution de migrate. Le profile n’est jamais démarré automatiquement ; l’état déjà initialisé doit être refusé.
