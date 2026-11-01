# Lot 7 — Consolidation et fiabilité

**Livraison locale à présenter à réception humaine avec réserves ; aucune réception implicite.** Archive complète et jobs, sauvegarde chiffrée et vraie restauration isolée, protection contre le retour d’anciens accès, supervision et qualification livrés. **Le MVP complet ne peut pas être déclaré satisfait : SEC-07 MUST reste non réalisé (TLS réseau complet).** GO-04 n’est pas accepté ; phase B commerciale du Lot 5 et GO-03 restent différés.

[Inventaire des fichiers](LOT-7-FILES.txt) · [Matrice des 150 exigences](MVP-EVIDENCE-MATRIX.md) · [Résultats mesurés](measurements/LOT-7-QUALIFICATION.json) · [Décisions GO-04](GO-04-DECISION-PROPOSAL.md) · [Runbook](OPERATIONS-RUNBOOK.md) · [Sécurité](LOT-7-SECURITY.md).

## Référence, réception du Lot 6 et Git

Main contient e9657b350afb78e4d72f97bc5d8e84eee5d82d8a ; [CI du Lot 6 sur main](https://github.com/ZA512/StoryMaster/actions/runs/41324705992) vérifiée terminée success. Dépôt initial propre, main/origin/main identiques. Ancienne codex/lot6-mcp-local supprimée localement et à distance après égalité explicite des quatre SHA, zéro commit unique et absence de worktree utilisateur. Aucune nouvelle branche ou PR ; aucun force push/réécriture. Lot 6 reçu techniquement avec réserves, ADR-0015 accepté strictement localement.

Les changements de ce lot sont effectués sur main uniquement. Au moment de rédaction initiale de ce rapport, les validations locales ci-dessous sont exécutées ; la nouvelle CI distante sera renseignée après push et observation de son résultat. Une réussite locale ne vaut pas CI distante verte. Les 150 exigences et 100 MUST MVP, leurs priorités et leurs versions restent inchangés.

## Capacités livrées

Archive ZIP à trois chemins fixes : project.json canonique riche, manuscript.md dérivé avec avertissements de pertes, manifest.json avec versions/inventaire/compteurs/hashes. Capture MVCC en une requête, 28 familles essentielles : structure éditoriale/historiques/snapshots, fiches/relations/références/chronologie/modules, commentaires/ancrages, propositions/révisions/revues/ChangeSets/audits attribués. Identifiants narratifs stables ; identités personnelles minimisées par pseudonymes de contributeurs. Sessions, grants, credentials/secrets et conversations IA privées exclus. Aucun réimport narratif annoncé.

Le manifeste décrit explicitement la portée : owner/admin peut obtenir l’archive complète du projet ; auteur reçoit seulement son propre historique de commentaires et aucun historique d’appartenance. Un déclassement interdit de télécharger une archive précédemment préparée avec une portée supérieure. Aucune omission de famille ne reste implicite. [Format, limites et exclusions](ARCHIVE-FORMAT.md).

Jobs durables : demande idempotente, suivi, bail/reprise, annulation CAS, expiration et téléchargement authentifié privé. Vérification de droits à la demande, au démarrage, avant publication et au téléchargement. Retrait du membre, révocation de session, déclassement ou changement d’installation invalident l’autorité. Pas de lien public ni chemin de stockage exposé. Snapshot 64 Mio / 100 000 lignes et traitement borné ; erreur explicite sans tronquer le contenu. Compression hors transaction, réponse perdue/rejeu sans double publication.

Sauvegarde opérateur : pg_basebackup cohérent de tout le cluster, dont données Keycloak ; composants cluster, secrets et métadonnées chiffrés séparément AES-256-GCM, sous-clés dérivées, manifeste authentifié, checksums et marqueur COMPLETE. Clé externe privée séparée du backup, destinations strictes, bornes/espace/symlinks, commandes à erreurs fiables sans secrets dans argv/logs. Versions, migrations, configuration et sources d’installation capturées ; un arbre sale est signalé et ne remplace pas un commit reproductible. Les archives temporaires sont reconstructibles et exclues du backup physique.

Restauration : volume neuf distinct, conteneur sans réseau ni port, aucun web/API/MCP/worker lancé ; vérification native pg_verifybackup puis vrai démarrage PostgreSQL. Migration/quarantaine automatiques des deux bases applicatives avant retour. Grants/sessions restaurés révoqués, capacités et login transactions neutralisés, exécutions ambiguës unknown sans relance, exports annulés. Le témoin externe durable comparé à PostgreSQL interdit qu’un rollback SQL seul rétablisse l’autorité. Scellement fichier fsync avant COMMIT pour les mutations de sécurité : un commit échoué après scellement ferme volontairement le service plutôt que de réactiver un accès. [ADR-0016](adr/0016-sauvegardes-restauration-et-epoque.md).

L’interface ajoute le suivi des archives et leurs erreurs, focus de navigation, préférences clair/sombre/système, taille du texte et raccourci facultatif vers la rédaction ; seules ces préférences non narratives persistent par utilisateur. Catalogue français typé initial des exports/dates, extraction générale future. Pas de refonte globale ni glisser-déposer.

## Vérifications réellement exécutées

| Commande/campagne | Résultat local observé | Limite |
|---|---|---|
| npm run lint ; npm run typecheck | Réussite, frontières et générateurs de contrats synchronisés | Contrôles statiques |
| python scripts/validate_specifications.py | JSON/Schema/OpenAPI, 13 outils MCP, liens, 150 IDs/100 MUST et lots conformes | Validation documentaire |
| python -m unittest discover -s scripts/tests | 53 tests réussis, dont mutations de contrats Lot 7 | Aucun test produit déduit de ces fixtures |
| npm test | 276 tests : 275 réussis, 0 échec, 1 skip physique explicite | Bases dédiées _test ; le skip est exécuté séparément ci-dessous |
| npm run test:recovery | 1 restauration physique réelle réussie après migration 0014 | Environnement séparé, réseau none ; aucun écrasement principal |
| npm run test:e2e, MCP_ENABLED=true | 27 parcours Chromium réussis, dont incident réel | Local Keycloak, pas de fournisseur réel |
| Spike A : typecheck, test, bench, test:browser | 48 tests PostgreSQL et 3 navigateur réussis ; mesures produites | Yjs reste isolé hors production |
| Spike B pertinent | Atomicité, kill de processus, réponse perdue et courses proposals-atomicity/concurrency réussis dans npm test | Vraie PostgreSQL, pas une spécification présentée comme preuve |
| Spike C / MCP | Suites OAuth/JWT/network/concurrency/spike réussies ; CLI deux protocoles 2026-07-28 et 2025-11-25 | Treize outils, client sans LLM, portée locale |
| Cinq benchs : contention/scenes/narrative/collaboration/proposals | Réussite, métriques et oracles conservés dans les mesures | Corpus et retries propres à chaque campagne |
| npm run bench:recovery | 15 ZIP réels, charge mixte, intégrité, 0 erreur/0 retry | Petit échantillon local, aucun SLA |
| ops:health avec clé et racine backup | Services sains, schéma/époque vérifiés, backup authentifié, aucun bail expiré | Outil opérateur, métadonnées uniquement |
| ops:retention-preview ; backup:scheduler -- --preview | Aperçus exécutés, aucune purge ni ordonnanceur activé | GO-04 reste ouvert |
| Nettoyage temporaire synthétique | Aperçu + accord environnement + digest exact, journalisation opérateur et canon intact | Seulement fixtures ; aucune suppression de données utilisateur |

Les journaux bruts restent dans artifacts/local ignoré ; les résultats utiles sont versionnés dans les mesures. Les échecs de préparation ne sont pas comptés comme succès. Les sélecteurs navigateur ambigus et un contraste insuffisant du bouton de déconnexion en thème sombre ont été corrigés, puis la campagne complète a passé. Pas de permission affaiblie pour rendre un test vert.

Les parcours couvrent écrire/organiser/restaurer une scène, bible/relations/chronologie/recherche, commentaires et propositions, assistance simulée, client MCP, révocation, export et inspection réelle du ZIP. Nouveaux cas : réponse de demande perdue/rejeu, ancien membre refusé, préférences/clavier/mobile/intercompte, incident réel avec restauration et reprise humaine fraîche. Axe ciblé sans violations observées ; lecteur d’écran, perception/fatigue sur manuscrit long et conformité WCAG 2.2 AA exhaustive restent à contrôler humainement.

La construction Docker des trois images API/web/MCP a réussi après les derniers ajouts. Le profil opérateur initialize-authority a refusé une seconde adoption sur l’installation existante, sans modifier le témoin externe.

## Restauration et conservation prouvées

Un backup principal chiffré a été créé et restauré avant les migrations nouvelles. Les migrations 0010..0014 sont additives ; 0001..0009 inchangées. Comparaison des anciennes colonnes/lignes sur les 51 tables préexistantes avant 0010..0013 : toutes empreintes inchangées ; même comparaison avant/après 0014 : inchangée. Les tests navigateur ont ensuite ajouté volontairement leurs projets et données synthétiques, sans réinitialiser la base principale. Aucun volume utilisateur supprimé. Les volumes temporaires de récupération restent conservés et arrêtés ; leur retrait futur exige un choix opérateur ciblé, aucun prune global.

Dernier exercice après 0014 : backup 2590a1d4-24ae-404b-b6f9-0185b6235c6e, **118 921 432 octets chiffrés**, **1 299 ms** de création ; **5 473 ms** de restauration/vérification/quarantaine, **11 408 ms** pour l’exercice global. Contrôle exact avant quarantaine : **55 tables / 234 lignes / 826 contraintes** applicatives, **6 tables d’identité Keycloak / 530 contraintes**, empreintes des lignes, scènes/snapshots, objets/liens/commentaires/propositions/ChangeSets/audits et conversation simulée complétée. Déchiffrement uniquement de credential fictive. Les données de l’installation principale sont restées identiques pendant l’exercice ; un vrai redémarrage est également traversé par les anciens parcours.

Le grant est actif dans le backup, révoqué après backup, puis observé actif dans le SQL restauré **avant quarantaine** : le témoin externe courant refuse déjà ce SQL ancien. Après quarantaine puis activation isolée explicite, ancien OAuth (toujours valide chez l’IdP d’origine), session et preuve restent refusés ; anciennes capacités nulles, jobs annulés, aucun fournisseur/contact externe. Une nouvelle session humaine peut lire ses données. Recopier un ancien témoin externe est interdit ; une sauvegarde SQL seule ne constitue jamais l’autorité.

**RPO mesuré :** une écriture synthétique après backup est absente au point restauré ; fenêtre supérieure observée de 1 072 ms entre début du backup et cette écriture. Aucun RPO temporel global n’est démontré sans fréquence/copie hors machine approuvées. **RTO mesuré :** 5,47 s pour l’outil local, pas le délai complet disque perdu/récupération clé/validation humaine. Les objectifs de 24 h restent provisoires et non garantis. Keycloak a ses données vérifiées, sans prétendre invalider globalement tous ses tokens ni qualifier tout un redémarrage IdP restauré en production.

## Performances et contention

Ryzen 5 3600X, 12 threads, 31,25 Gio RAM, PostgreSQL 18.6, Node 26.8.1 ; environ 20 Gio de disque disponibles pendant la clôture. Corpus 10 000 objets, 15 ZIP de 2,43–2,48 Mo ; 5 hors charge puis 10 avec 80 autosaves sur deux scènes indépendantes, 40 commentaires, 8 merges, 120 lectures et 120 recherches. Débit 14,945 commandes/s sur 25,293 s, zéro erreur/retry ; deux scènes r41 exactes et hashes des quinze ZIP contrôlés.

| Opération | n | p50 ms | p95 ms | p99 ms |
|---|---:|---:|---:|---:|
| Archive | 15 | 2 111,473 | 3 274,759 | non revendiqué |
| Téléchargement | 15 | 6,528 | 147,796 | non revendiqué |
| SHA-256 | 15 | 1,268 | 1,387 | non revendiqué |
| Autosave | 80 | 11,004 | 116,612 | non revendiqué |
| Commentaire | 40 | 10,958 | 117,602 | non revendiqué |
| Merge | 8 | 206,529 | 1 674,383 | non revendiqué |
| Lecture | 120 | 5,937 | 111,669 | 144,482 |
| Recherche | 120 | 27,055 | 309,176 | 440,711 |

Attente projet p95 3,826 ms/p99 428,017 ms/max 1 511,11 ms ; détention p95 154,524 ms/p99 1 689,826 ms/max 1 743,919 ms. Scènes indépendantes : attente p95 0,527 ms/détention p95 53,456 ms. Les seuils locaux NFR-02/03 sont respectés sur cet échantillon métier, sans extrapolation publique. L’archive retient une barrière partagée pendant sa capture et retarde merge/révocation exclusifs ; le merge exclusif bloque aussi les écritures sur des scènes indépendantes. **R-CONT-01 demeure ouvert.** L’[ADR-0018](adr/0018-contention-des-archives.md) propose une future capture dédiée sans relâcher atomicité, cohérence ni contrôle d’autorisation. Aucun p99 n’est inventé pour huit merges.

## Anomalies corrigées et fonctions reportées

Corrections : portée des historiques de commentaires et déclassement avant téléchargement ; admission OAuth avant coût d’introspection ; historique administratif réservé à members.admin ; bind API local par défaut ; bornes et rejeu de jobs ; restauration native et chemin Unix suffisamment court ; nettoyage journalisé dans une table opérateur distincte sans faux acteur humain ; contraste et sélecteurs des nouveaux parcours. Ajv/yaml mis à jour de façon ciblée. Production et Spike A : audit dépendances zéro ; onze entrées modérées d’outillage ESLint/minimatch restantes, aucune haute/critique, justification dans la synthèse sécurité.

Récupération persistante de brouillons non confirmés : **non livrée**, issue explicitement permise par la mission. [ADR-0017](adr/0017-recuperation-locale-des-brouillons.md) compare les solutions et recommande un coffre facultatif à phrase secrète avec revue séparée ; comportement mémoire/CAS/téléchargement préservé, risque de panne maintenu. Pas de faux chiffrement avec clé enregistrée à côté du texte.

Autres réserves : SEC-07 MUST, RLS/pool, révocation globale IdP, capacité/disponibilité de production, contrôles WCAG humains, internationalisation générale et modèles de projet/notifications SHOULD non livrés. Aucun fournisseur réel, transfert narratif tiers, DOCX/EPUB/réimport/CRDT/publication, branche ou PR introduits.

## Décisions encore nécessaires et arrêt

Le propriétaire doit recevoir ou refuser les capacités locales et leurs réserves, arbitrer SEC-07 et son chantier TLS/issuer/certificats, accepter ou reprendre le report du coffre de brouillons, et décider GO-04 : lieux/copie hors disque, fréquence et rétention, clés/opérateurs, objectifs RPO/RTO, reprise graduelle et logs. Ordonnanceur et suppressions réelles restent désactivés ; aucune restauration principale autorisée par ce rapport. GO-03 commercial reste séparé. MCP est arrêté après qualification ; API revient à MCP_ENABLED=false.

Arrêt après livraison et observation de la CI pour réception humaine, sans démarrer phase B, refonte UX ou opération destructive.

## Critères d'acceptation du document

Fichiers, oracles exécutés, données conservées, restaurations réelles, mesures et portée exposés ; Git/CI constatés et non supposés ; décisions humaines et MUST non satisfait visibles ; aucune réception ou qualification publique implicite.
