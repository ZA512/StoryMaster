# Lot 7 — Consolidation et fiabilité

**Livraison locale à présenter à réception humaine avec réserves ; aucune réception implicite.** Archive complète et jobs, sauvegarde chiffrée et vraie restauration isolée, protection contre le retour d’anciens accès, supervision et qualification livrés. **Le MVP complet ne peut pas être déclaré satisfait : SEC-07 MUST reste non réalisé (TLS réseau complet).** GO-04 n’est pas accepté ; phase B commerciale du Lot 5 et GO-03 restent différés.

[Inventaire des fichiers](LOT-7-FILES.txt) · [Matrice des 150 exigences](MVP-EVIDENCE-MATRIX.md) · [Résultats mesurés](measurements/LOT-7-QUALIFICATION.json) · [Décisions GO-04](GO-04-DECISION-PROPOSAL.md) · [Runbook](OPERATIONS-RUNBOOK.md) · [Sécurité](LOT-7-SECURITY.md).

## Référence, réception du Lot 6 et Git

Main contient e9657b350afb78e4d72f97bc5d8e84eee5d82d8a ; [CI du Lot 6 sur main](https://github.com/ZA512/StoryMaster/actions/runs/41324705992) vérifiée terminée success. Dépôt initial propre, main/origin/main identiques. Ancienne codex/lot6-mcp-local supprimée localement et à distance après égalité explicite des quatre SHA, zéro commit unique et absence de worktree utilisateur. Aucune nouvelle branche ou PR ; aucun force push/réécriture. Lot 6 reçu techniquement avec réserves, ADR-0015 accepté strictement localement.

Implémentation committée et poussée sur main : 07c8efacfb780ccc1af0160c309d3a0f47c381e3. La [première CI Lot 7](https://github.com/ZA512/StoryMaster/actions/runs/41359553421) a échoué sur l’annulation lente simulée : 26 parcours sur 27 réussis, autres campagnes et Spike A verts. Cet échec est conservé comme tel. La révision affichée peut devenir périmée avant le clic ; un test force désormais ce cas 412 et vérifie une actualisation suivie d’une nouvelle décision humaine, sans rejeu automatique. Le correctif de revalidation du témoin et ce parcours sont livrés dans le commit de clôture suivant. Une réussite locale ne vaut pas CI distante verte.

La preuve distante de clôture se consulte par SHA dans les [exécutions push de main](https://github.com/ZA512/StoryMaster/actions?query=branch%3Amain+event%3Apush) ; le compte rendu de réception fournit le SHA et le lien daté après observation. Le statut courant reste visible dans le [badge CI de main](https://github.com/ZA512/StoryMaster/actions/workflows/validation.yaml/badge.svg?branch=main), plutôt qu’une affirmation permanente de réussite inscrite avant exécution. Les 150 exigences et 100 MUST MVP, leurs priorités et leurs versions restent inchangés.

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
| npm test | 277 tests : 276 réussis, 0 échec, 1 skip physique explicite | Bases dédiées _test ; le skip est exécuté séparément ci-dessous |
| npm run test:recovery | 1 restauration physique réelle réussie après migration 0014 | Environnement séparé, réseau none ; aucun écrasement principal |
| npm run test:e2e, MCP_ENABLED=true | Campagne initiale : 27 réussis ; reprise après correctifs : 26 + annulation ciblée, puis campagne distante de clôture | Local Keycloak, pas de fournisseur réel ; échecs de préparation conservés |
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

Exercice de référence après 0014 et correctif du témoin : backup 8919ccf4-17ff-4841-8d8b-ee5340a4aea4, **134 108 888 octets chiffrés**, **2 440 ms** de création ; **6 506 ms** de restauration/vérification/quarantaine, **12 676 ms** pour l’exercice global. Contrôle exact avant quarantaine : **55 tables / 234 lignes / 826 contraintes** applicatives, **6 tables d’identité Keycloak / 530 contraintes**, empreintes des lignes, scènes/snapshots, objets/liens/commentaires/propositions/ChangeSets/audits et conversation simulée complétée. Déchiffrement uniquement de credential fictive. Les données de l’installation principale sont restées identiques pendant l’exercice ; un vrai redémarrage est également traversé par les anciens parcours.

Le grant est actif dans le backup, révoqué après backup, puis observé actif dans le SQL restauré **avant quarantaine** : le témoin externe courant refuse déjà ce SQL ancien. Après quarantaine puis activation isolée explicite, ancien OAuth (toujours valide chez l’IdP d’origine), session et preuve restent refusés ; anciennes capacités nulles, jobs annulés, aucun fournisseur/contact externe. Une nouvelle session humaine peut lire ses données. Recopier un ancien témoin externe est interdit ; une sauvegarde SQL seule ne constitue jamais l’autorité.

**RPO mesuré :** une écriture synthétique après backup est absente au point restauré ; fenêtre supérieure observée de 2 201 ms entre début du backup et cette écriture. Aucun RPO temporel global n’est démontré sans fréquence/copie hors machine approuvées. **RTO mesuré :** 6,51 s pour l’outil local, pas le délai complet disque perdu/récupération clé/validation humaine. Les objectifs de 24 h restent provisoires et non garantis. Keycloak a ses données vérifiées, sans prétendre invalider globalement tous ses tokens ni qualifier tout un redémarrage IdP restauré en production.

Après commit, un second backup principal **31cc63d9-e032-4423-9573-896701adec91** (121 688 732 octets) référence exactement 07c8efacfb780ccc1af0160c309d3a0f47c381e3 avec sourceWorkingTreeDirty=false. Sa restauration isolée native et sa quarantaine ont réussi en 6 043 ms ; conteneur arrêté, volume conservé. Il complète l’exercice détaillé de fixture sans prétendre en répéter chaque assertion d’accès. Le contrôle de santé final authentifie ce nouveau backup, avec MCP désactivé et les quatre services locaux sains.

## Performances et contention

Ryzen 5 3600X, 12 threads, 31,25 Gio RAM, PostgreSQL 18.6, Node 26.8.1 ; environ 18.5 Gio de disque disponibles pendant cette mesure. Les capacités sont celles de l’hôte. Le processus Node de mesure a consommé 23,477 s CPU utilisateur + 2,228 s système pour cinq archives hors charge puis la charge mixte ; pic RSS 682,6 Mio sur toute sa vie et RSS finale 447,4 Mio. Ces mesures ne comprennent pas les processus PostgreSQL/Keycloak ; aucun pic CPU/RAM de ces composants ni endurance de production revendiqués. Reproduction : bench:narrative puis bench:recovery, qui publie désormais resources.

Référence après correction du témoin, sans construction Docker simultanée : corpus 10 000 objets, 15 ZIP de 2,47–2,50 Mo ; 5 hors charge puis 10 avec 80 autosaves sur deux scènes indépendantes, 40 commentaires, 8 merges, 120 lectures et 120 recherches. Débit 13,796 commandes/s sur 27,400 s, zéro erreur/retry métier ; deux scènes r41 exactes et hashes des quinze ZIP contrôlés. La première référence et une passe instrumentée simultanée à une construction Docker sont conservées séparément dans les mesures, sans mélanger leurs percentiles.

| Opération | n | p50 ms | p95 ms | p99 ms |
|---|---:|---:|---:|---:|
| Archive | 15 | 2 325,048 | 3 610,073 | non revendiqué |
| Téléchargement | 15 | 6,908 | 21,084 | non revendiqué |
| SHA-256 | 15 | 1,287 | 1,395 | non revendiqué |
| Autosave | 80 | 11,516 | 149,567 | non revendiqué |
| Commentaire | 40 | 10,984 | 148,684 | non revendiqué |
| Merge | 8 | 173,480 | 1 860,066 | non revendiqué |
| Lecture | 120 | 6,193 | 97,543 | 147,865 |
| Recherche | 120 | 26,784 | 302,113 | 538,843 |

Attente projet p95 1,345 ms/p99 549,208 ms/max 1 694,717 ms ; détention p95 164,253 ms/p99 1 881,012 ms/max 1 924,358 ms. Scènes indépendantes : attente p95 0,989 ms/détention p95 59,834 ms. Les seuils locaux NFR-02/03 sont respectés sur cet échantillon métier, sans extrapolation publique. L’archive retient une barrière partagée pendant sa capture et retarde merge/révocation exclusifs ; le merge exclusif bloque aussi les écritures sur des scènes indépendantes. **R-CONT-01 demeure ouvert.** L’[ADR-0018](adr/0018-contention-des-archives.md) propose une future capture dédiée sans relâcher atomicité, cohérence ni contrôle d’autorisation. Aucun p99 n’est inventé pour huit merges.

## Anomalies corrigées et fonctions reportées

Une passe complémentaire instrumentée a révélé un 503 transitoire lorsque le fichier d’époque était déjà scellé et le COMMIT encore en vol. Correction : relecture bornée de la seule paire témoin/SQL (250 ms/25 lectures au plus), jamais acceptation d’une discordance ou rejeu métier. Test déterministe PostgreSQL ajouté ; régression complète et restauration après révocation rejouées. Cette passe échouée n’est pas comptée comme succès.

Le parcours d’annulation IA traite désormais le conflit de révision en actualisant la carte et en demandant un nouveau clic explicite ; son test force un CAS périmé, prouve l’absence d’annulation automatique puis termine l’annulation humaine. La première CI échouée n’est pas comptée parmi les succès.

Corrections : portée des historiques de commentaires et déclassement avant téléchargement ; admission OAuth avant coût d’introspection ; historique administratif réservé à members.admin ; bind API local par défaut ; bornes et rejeu de jobs ; restauration native et chemin Unix suffisamment court ; nettoyage journalisé dans une table opérateur distincte sans faux acteur humain ; contraste et sélecteurs des nouveaux parcours. Ajv/yaml mis à jour de façon ciblée. Production et Spike A : audit dépendances zéro ; onze entrées modérées d’outillage ESLint/minimatch restantes, aucune haute/critique, justification dans la synthèse sécurité.

Récupération persistante de brouillons non confirmés : **non livrée**, issue explicitement permise par la mission. [ADR-0017](adr/0017-recuperation-locale-des-brouillons.md) compare les solutions et recommande un coffre facultatif à phrase secrète avec revue séparée ; comportement mémoire/CAS/téléchargement préservé, risque de panne maintenu. Pas de faux chiffrement avec clé enregistrée à côté du texte.

Autres réserves : SEC-07 MUST, RLS/pool, révocation globale IdP, capacité/disponibilité de production, contrôles WCAG humains, internationalisation générale et modèles de projet/notifications SHOULD non livrés. Aucun fournisseur réel, transfert narratif tiers, DOCX/EPUB/réimport/CRDT/publication, branche ou PR introduits.

## Décisions encore nécessaires et arrêt

Le propriétaire doit recevoir ou refuser les capacités locales et leurs réserves, arbitrer SEC-07 et son chantier TLS/issuer/certificats, accepter ou reprendre le report du coffre de brouillons, et décider GO-04 : lieux/copie hors disque, fréquence et rétention, clés/opérateurs, objectifs RPO/RTO, reprise graduelle et logs. Ordonnanceur et suppressions réelles restent désactivés ; aucune restauration principale autorisée par ce rapport. GO-03 commercial reste séparé. MCP est arrêté après qualification ; API revient à MCP_ENABLED=false.

Arrêt après livraison et observation de la CI pour réception humaine, sans démarrer phase B, refonte UX ou opération destructive.

## Critères d'acceptation du document

Fichiers, oracles exécutés, données conservées, restaurations réelles, mesures et portée exposés ; Git/CI constatés et non supposés ; décisions humaines et MUST non satisfait visibles ; aucune réception ou qualification publique implicite.
