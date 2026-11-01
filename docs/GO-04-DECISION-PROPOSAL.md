# GO-04 — Exploitation personnelle auto-hébergée

**Statut : proposé, aucun accord implicite.** Mission Lot 7 autorise développement sûr et restauration isolée ; elle n’approuve pas purge, suppression irréversible, restauration principale ou exposition publique. [Décisions](HUMAN-DECISIONS.md), [ADR récupération](adr/0016-sauvegardes-restauration-et-epoque.md).

## Choix proposés au propriétaire

| Sujet | Recommandation pour une première installation personnelle | Alternatives / conséquences | Validation requise |
|---|---|---|---|
| Sauvegarde | Sauvegarde chiffrée complète PostgreSQL et manifeste, secrets dans un composant chiffré séparé ; copie hors du disque source | Dump logique par base plus portable, coordination Keycloak/app à démontrer ; snapshot physique exige même version majeure et image compatible | Méthode, emplacement séparé et responsable |
| Fréquence | Quotidienne et avant migration/intervention, proposition à activer seulement après accord | Plus fréquent réduit la perte possible et augmente stockage/I/O | Horaire, machine et surveillance |
| Rétention backups | Proposition : 7 quotidiennes, 4 hebdomadaires, 3 mensuelles ; aucune suppression activée | Tout conserver consomme plus de disque ; fenêtres plus courtes réduisent récupération historique | Durées, limite de disque, purge et preuve d’une copie récupérable |
| Historique narratif | Conserver snapshots/avis/ChangeSets/audits sans purge automatique au MVP local | Compression/déduplication future après mesure ; suppression compromet traçabilité et références | Politique distincte des fichiers temporaires |
| Suppressions | Archivage logique existant ; export avant toute future suppression définitive | Propager une suppression aux backups exige une politique spécifique, ne pas annoncer un effacement instantané | Portée, délai, obligations et accès aux anciennes copies |
| Exports temporaires | Expiration technique proposée 24 h, téléchargement toujours authentifié, nettoyage contrôlé des seuls artefacts temporaires | Conservation plus courte peut gêner l’utilisateur ; ne touche pas les sources ni historiques | Durée finale, aperçu et éventuelle automatisation |
| Clés | Clé de backup hors archive, permissions locales strictes et copie de récupération hors machine ; versions des clés applicatives conservées sous protection séparée | Perdre une ancienne clé peut rendre une sauvegarde illisible ; sauvegarder une clé à côté du dump en clair annule sa protection | Gardien, lieu de récupération, rotation et test |
| Keycloak | Sauvegarder données d’identité et configuration avec l’installation ; runbook de récupération et test local | Restaurer seulement l’application ne révoque pas globalement l’IdP | Responsable, mises à jour et accès d’urgence |
| Opérateurs | Rôle local d’exploitation distinct des permissions littéraires ; aucun privilège opérateur dans un outil IA/MCP | Un administrateur de machine peut lire ses données ; frontière de confiance explicite | Personnes autorisées et journalisation |
| Restauration | Environnement isolé d’abord ; nouvelle époque externe à la DB, invalidation des accès restaurés, remise en service graduelle | Revenir au snapshot sans cette barrière peut ressusciter accès et tâches | Procédure et autorisation distincte avant écrasement principal |
| RPO/RTO | Objectifs provisoires 24 h ; valeurs mesurées séparément lors des exercices | Un temps de test court ne garantit pas récupération en incident réel ni fréquence effective | Objectifs après mesures et calendrier approuvé |
| Logs/métriques | Métadonnées techniques sans texte/prompt/token ; proposition de rétention 14 jours des seuls logs techniques | Plus de traces aide le diagnostic mais accroît la collecte | Catégories, accès, durées et purge |
| Public | Aucune ouverture dans ce lot ; TLS, domaine, identité, sauvegarde, capacité et revue des risques à valider avant ouverture | Le succès local ne vaut pas SLA, conformité WCAG ou exploitation SaaS | Décision humaine distincte |

## Arbitrage SEC-07 — préalable à une réception complète du MVP

SEC-07 reste **MUST non satisfait** : HTTP local et PostgreSQL privé ne chiffrent pas le réseau. Le chiffrement des sauvegardes ne satisfait pas cette exigence. Aucun abaissement de priorité n’est proposé implicitement. Recommandation : autoriser un chantier TLS local couvrant navigateur/web, web/API, Keycloak/OIDC, MCP et PostgreSQL, avec autorité de certification locale, distribution de confiance, noms/issuer stables, rotation et tests de refus d’un certificat invalide. Alternative : recevoir seulement les capacités locales du Lot 7 avec cette réserve bloquante de complétude ; aucune qualification publique. Le propriétaire doit valider le choix de certificats, la migration des URL/issuer et l’effet sur les clients/sessions avant activation engageant l’exploitation. Aucun TLS complet n’a été activé pendant cette mission.

## Mesures disponibles pour décider

Le dernier exercice après migration 0014 a restauré réellement 55 tables applicatives (234 lignes de fixture, 826 contraintes) et vérifié six tables d’identité Keycloak plus ses 530 contraintes. Sauvegarde 1,30 s et restauration isolée avec vérification/quarantaine 5,47 s sur la machine locale ; une écriture synthétique postérieure au backup n’est pas récupérée (fenêtre supérieure observée 1 072 ms). Ces nombres décrivent un exercice, pas un engagement RPO/RTO. La fréquence reste désactivée : l’objectif provisoire de 24 h n’est donc pas une garantie opérationnelle. Voir le [rapport](LOT-7-REPORT.md).

## Ce qui reste fermé tant que GO-04 n’est pas accepté

Aucune politique de purge destructive ou suppression définitive utilisateur activée. Pas de restauration sur la base principale. Pas de déploiement public ni de changement de confiance opérateur implicite. Les commandes locales de sauvegarde, validation et restauration isolée restent reproductibles et non destructives pour l’installation principale. L’échec de vérification d’époque, clé ou manifeste interdit la remise en service concernée.

## Réserves à examiner

R-CONT-01 et charge soutenue ; RLS/pool ; révocation globale IdP ; disponibilité réelle ; sécurité des clés hors machine ; récupération de brouillons ; restauration de versions incompatibles ; rétention des données privées et temporaires. Aucun risque n’est accepté parce qu’il figure dans ce document. GO-03 commercial et phase B restent différés.

## Critères d'acceptation du document

Le propriétaire peut approuver/refuser méthode, fréquence, rétentions, récupération des clés, accès opérateurs, objectifs et conditions de remise en service séparément ; propositions distinguées des mesures et des activations effectives.
