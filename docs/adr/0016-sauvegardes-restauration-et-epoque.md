# ADR-0016 — Archives, sauvegarde et restauration fermée par défaut

**Statut : choix techniques locaux à implémenter et qualifier dans le Lot 7 autorisé ; réception attendue.** GO-04 non approuvé. [Mission et portée](../HUMAN-DECISIONS.md), [GO-04](../GO-04-DECISION-PROPOSAL.md).

## Séparer portabilité et récupération d’installation

L’archive narrative v1 est un ZIP documenté avec JSON riche, Markdown dérivé, schémas, manifeste SHA-256 et attribution minimale. Elle contient les familles métier essentielles et leurs historiques, modules désactivés compris ; exclut secrets, sessions, grants/capacités, invitations d’accès et conversations privées. Aucun réimport complet promis. Le job utilise les mêmes contrôles applicatifs que les autres canaux : humain autorisé à la demande, au démarrage, avant publication et au téléchargement ; aucun outil MCP d’export.

Capture cohérente par un unique énoncé PostgreSQL sous barrière projet et autorisation fraîche ; compression/fichiers hors transaction. Ainsi les autosaves peuvent continuer sans mélange de snapshots entre les familles. Publication finale idempotente, aucune archive partielle disponible. Stockage privé, taille/durée bornées, noms de fichiers maîtrisés, expiration et nettoyage des seuls temporaires distingués de toute purge de sources.

La sauvegarde d’exploitation couvre PostgreSQL complet, identité Keycloak, migrations, versions/configuration et références de récupération des secrets. Choix à qualifier : pg_basebackup du cluster PostgreSQL 18 épinglé, manifeste SHA-256 et WAL inclus ; données chiffrées en flux, inventaire et composant des secrets chiffré séparé, clé de récupération hors sauvegarde. [Documentation PostgreSQL](https://www.postgresql.org/docs/18/app-pgbasebackup.html). Alternative dumps logiques : portable entre versions, mais cohérence application/IdP et rôles à coordonner explicitement. Une sauvegarde physique complète simplifie la preuve locale de cette cohérence et implique une compatibilité de version stricte.

L’intégrité native est vérifiée avec pg_verifybackup puis par démarrage et requêtes réelles sur copie isolée. Cette commande seule ne prouve pas que le serveur saura récupérer : [limites officielles](https://www.postgresql.org/docs/18/app-pgverifybackup.html). Absence de WAL, mauvais tag de chiffrement, clé manquante, fichier/manifeste altéré ou migration incompatible : refus, jamais suppression des données pour masquer l’erreur.

## Époque d’autorisation hors de la base restaurée

Un état d’autorisation local indépendant de la DB, exclu des restaurations historiques, lie l’instance et une époque aléatoire. La DB, les sessions, grants, capacités et jobs doivent correspondre à cet état. État absent, incohérent ou illisible : service privé/worker concerné fermé. Le premier provisionnement sur l’installation existante doit préserver les données et droits actuels ; une restauration crée au contraire une **nouvelle** époque et une quarantaine avant toute remise en service.

Les accès restaurés ne sont pas réactivés : sessions invalidées, grants hérités inutilisables, anciennes preuves incapables de retrouver leur autorité ; jobs/exécutions restaurés ne sont jamais automatiquement envoyés ou publiés. Un humain peut se réauthentifier après vérification opérateur et donner une nouvelle autorisation explicite ; un ancien token ne suffit pas. La rotation est sérialisée avec les autorisations ; les procédures de restauration ne doivent jamais recopier l’ancien état externe depuis un backup.

Cette garantie porte sur les services StoryMaster et leur modèle de confiance opérateur. Restaurer PostgreSQL ne révoque pas magiquement les sessions gérées par un autre IdP ; Keycloak et son état externe sont documentés et testés séparément. Un opérateur compromis contrôlant machine, clés et état d’époque reste hors de la garantie de révocation applicative.

## Qualification prioritaire et limites

D’abord backup puis vraie restauration sur DB/volumes distincts, réseau local fermé, MCP et fournisseurs désactivés, workers en quarantaine. Comparer sources/historiques/FK/ChangeSets/conversations simulées ; déchiffrer seulement les credentials fictives du test. Scénario obligatoire : grant actif → backup → révocation → restore antérieur → ancien grant/session refusés. Mesurer durée, données réellement perdues dans le scénario et dépendances aux clés ; aucun SLA déduit.

Pas de purge réelle avant GO-04. RLS non activée par simple présence de cet ADR ; ses coûts de pool/contexte exigent leur propre preuve. R-CONT-01 est mesuré avec export, autosave, commentaire et merge ; pas d’abandon de l’atomicité pour une latence. La récupération locale de brouillons est une décision distincte facultative, sans écriture canonique automatique ni promesse contre un navigateur compromis.

## Critères d'acceptation du document

Archives et backups distingués ; absence de secrets applicatifs ; cohérence, chiffrement, clés externes, quarantaine et époque hors DB vérifiables ; restauration réelle et invalidation des accès exigées ; aucune décision GO-04 ni autorisation publique implicite.

## Témoin durable contre le retour SQL seul

Une époque renouvelée uniquement par le script de restauration serait insuffisante : un backup peut précéder une révocation tout en contenant encore l’époque courante. Les mutations de sécurité (sessions, délégations, appartenances, statut utilisateur/projet, credentials, consentements/capacités et annulations de jobs) marquent donc la transaction SQL. Le runtime de confiance scelle une nouvelle valeur externe avec fichier temporaire, fsync, renommage et fsync du répertoire, puis écrit la même valeur dans la transaction avant COMMIT. Ce répertoire privé est persistant, distinct du volume PostgreSQL et exclu de la sauvegarde historique. API et MCP ont accès au même répertoire ; seul le runtime de confiance le manipule. Les adaptateurs externes n’ont aucun outil de gestion de ce témoin.

Le verrou de la ligne SQL d’autorisation sérialise ces changements. Les lectures et autosaves ordinaires ne changent pas le témoin. Les jobs sont liés à l’identifiant d’installation/reprise stable, distinct de cette valeur de révocation qui évolue. Restaurer seulement SQL laisse un désaccord avec le témoin courant et ferme l’installation. L’époque de reprise et les témoins ne doivent **jamais** être recopiés depuis une sauvegarde pour rétablir le service.

Ce scellement de sécurité est volontairement préalable au commit, contrairement aux effets externes métier/notifications qui restent après commit. C’est une barrière de refus conservatrice, pas un envoi de données. Une erreur/rollback après scellement laisse un désaccord et bloque les services : l’opérateur doit qualifier une reprise en quarantaine avec invalidation des anciens accès. Une courte fenêtre peut renvoyer 503 aux requêtes concurrentes pendant le scellement. Cette conséquence d’exploitation doit être validée dans GO-04 ; ne jamais la masquer en réadoptant l’ancien état.

La confiance exclut un administrateur de la machine capable de modifier simultanément DB, fichiers et code. Aucune solution locale ne protège contre cet opérateur malveillant. Une restauration faite par l’outil applique les migrations et met les deux bases applicatives restaurées en quarantaine avant de rendre la main ; aucun service sortant n’est démarré. Un hook interne de qualification lit le snapshot avant ces invalidations pour comparer les empreintes, sans exposer de service.

## Revalidation courte pendant un scellement concurrent

Une passe de charge supplémentaire a observé un 503 lorsque le fichier était déjà scellé alors que le COMMIT SQL correspondant était encore en vol. La garde relit désormais uniquement la paire témoin/SQL de la même installation active : au plus 25 lectures, espacées de 10 ms, avec fenêtre de 250 ms hors latence des requêtes. Elle n’accepte que l’égalité exacte, ne rejoue aucune commande métier et n’ajoute aucun verrou global aux transactions narratives. Fichier absent/corrompu/quarantainé, installation différente ou état SQL fermé restent immédiatement refusés. Un SQL ancien durablement discordant reste refusé après cette fenêtre. Le test PostgreSQL synchronise la première lecture antérieure au COMMIT et prouve ensuite la convergence ; les cas de rollback/révocation/restauration sont rejoués séparément.
