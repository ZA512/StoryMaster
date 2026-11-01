# Lot 6 — MCP local sans modèle IA

**État :** implémenté et qualifié localement ; réception humaine attendue avant Lot 7. **Date :** 1er novembre 2026. [ADR-0015](adr/0015-mcp-local-oauth-et-grants.md), [décisions](HUMAN-DECISIONS.md), [inventaire complet](LOT-6-FILES.txt).

Le propriétaire reçoit Lot 5 phase A avec réserves, CI 58ec5a9 verte vérifiée, et autorise séparément Lot 6 local avant phase B. GO-03 commercial, fournisseurs, dépenses, exposition publique et clients non préenregistrés restent ouverts. Aucun modèle, poids, clé fournisseur réelle, transfert narratif externe ou appel facturable utilisé. Aucun Lot 7 commencé.

## Capacités livrées et protocoles

Serveur Streamable HTTP utilisant les SDK officiels épinglés : serveur/client 2.4.0, Fastify 2.0.1 et Node 2.1.2. Deux générations exercées réellement : 2026-07-28, découverte moderne et enveloppes SDK ; 2025-11-25, initialize/initialized et requêtes stateless. Aucun ancien transport SSE distinct, aucune session porteuse d’autorité, sampling, abonnement ou tâche durable. Réponses structurées data OU error et repli textuel JSON ; la borne de 4 Mio inclut les deux représentations avec réserve pour l’enveloppe SDK, avant COMMIT.

Catalogue de treize noms conservé, mêmes services métier que HTTP et l’assistant intégré. Lecture des projets accordés, contexte borné, recherche paginée, scènes/fiches/révisions, relations, chronologie et références inverses. Préparation/révision, validation/preview et soumission de ses propositions sous le même humain/client/grant. Aucun canon, administration, approbation ou fusion délégués. Interface /delegations : lecture par défaut, consentement supplémentaire, durée, périmètre, historique, CAS et révocation. Provenance externe visible et proposition réellement revue puis fusionnée par un humain dans le navigateur.

Keycloak local réalise Code+PKCE S256, Resource Indicators expérimental, audience URL et introspection par requête. Le client ressource préenregistré porte l’URL comme clientId pour satisfaire aussi l’audience de l’introspection, sans désactiver ce contrôle. Issuer/signature/type/subject/client/scopes/temps vérifiés. PRM publique non sensible pour bootstrap ; découverte/outils protégés, redirects exacts, aucune découverte dynamique ni fetch d’URL narrative. Serveur désactivé par défaut, profile explicite et publication 127.0.0.1:3500 uniquement. Activation/refermeture dans le [README](../README.md).

## Vérifications effectivement exécutées

| Vérification | Résultat local final |
|---|---|
| Typage et lint, frontières architecturales/IA/MCP, générations de contrats | Succès |
| JSON strict, JSON Schema, OpenAPI, parité des treize outils, liens et traçabilité | Succès ; 150 IDs et 100 MUST MVP conservés |
| Tests de mutation du validateur documentaire | 48/48, dont 44 historiques et quatre nouveaux |
| Suite applicative complète Lots 0–6 | 257/257, dont 201 antérieurs et 56 du Lot 6 |
| Campagne navigateur complète | 23/23, dont 20 antérieurs et trois du Lot 6 ; Axe, mobile et clavier inclus |
| Spike A isolé | Typage, 48/48 tests PostgreSQL, benchmark et 3/3 tests navigateur |
| Cinq benchmarks antérieurs | Rejoués avec leurs oracles d’intégrité |
| Client CLI MCP sans LLM | Deux versions, lectures/recherche/propositions/rejeu/soumission/révocation et mesures réussis |
| Migration 0008 remplie vers 0009 | Toutes colonnes préexistantes comparées, données et rejouabilité conservées |
| Migration sur base principale | 38 tables préexistantes inchangées après 0009, avant redémarrage applicatif |

Les 56 tests du Lot 6 comprennent 18 vérifications cryptographiques sur AS/JWKS contrôlé et cinq tests ciblés de métadonnées/configuration ; ces 23 vérifications ne sont **pas** présentées comme Keycloak réel. Le Spike C et les tests réseau traversent véritablement OAuth Keycloak, SDK, HTTP et PostgreSQL. Les spécifications CT ne sont pas comptées comme tests produit exécutés. Les journaux sont dans artifacts/local ; ce dossier est exclu de Git et des images.

Spike C réalisé avant l’extension du catalogue/UI : acteur humain auteur et délégation, deux versions officielles, lecture égale HTTP, previews normalisées, révisions/audit, proposition/soumission sans canon, refus scope, absence de merge et révocation. Le CLI de qualification fait ensuite le parcours sur l’instance Docker principale avec des projets synthétiques ; tokens en mémoire, grants créés par lui révoqués en fin de parcours.

Tests PostgreSQL : dix courses demandées, attente de verrou observée avec le rôle applicatif, perte de réponse réseau après COMMIT puis rejeu sans double proposition, deux clients isolés, plafond applicatif direct, réduction du grant/CAS, expiration entre outils et révocation terminale. Tests réseau : ID token, mauvaise signature, mauvais humain/client, scope absent, clientInfo usurpé sans effet, ressource inconnue/modifiée invalid_target, token révoqué, mauvais Host/Origin/version, JSON/arguments invalides, profondeur, 101 opérations, pagination, huit admissions simultanées puis neuvième 429 et débit avec Retry-After. Un résultat trop grand rollback proposition, audit, ledger et idempotence avant COMMIT.

Le CT-27 rejoue les workers simulés existants ; aucune variante job MCP n’est implémentée ni prétendue exécutée. Le CT-32 intégré est rejoué dans sa définition ; le plafond externe est exercé séparément. [Sélection exacte et limites](spec/lot6-scenarios.json).

Après fusion humaine d’une proposition MCP, un redémarrage réel de PostgreSQL est traversé : l’application retrouve le grant révoqué et les nouvelles requêtes restent refusées. Pendant la reprise de l’IdP, 503 fermé ; après récupération, 403 pour le grant révoqué. Aucune réactivation ni perte de provenance.

## Données, fichiers et mesures

Migrations 0001..0008 inchangées. Migration additive 0009 : clients, grants/projets/événements, preuves internes hachées, ledger/références, provenance externe des propositions/révisions/audits et contraintes d’immutabilité. Aucun bearer conservé. Projets, scènes, snapshots, graphes, commentaires, memberships, propositions/avis/ChangeSets et conversations/exécutions simulées ont été comparés sur leurs colonnes d’origine. [Empreintes avant/après](measurements/LOT-6-MIGRATION.json). Aucun volume supprimé ni base principale réinitialisée ; les tests destructifs visent uniquement `_test` et le Spike A isolé.

L’[inventaire](LOT-6-FILES.txt) liste tous les fichiers de ce lot : nouveau serveur MCP, services/ports/stockage de délégation, migration, intégration bearer HTTP et gestion humaine, écran de délégation/provenance, client CLI, contrats/générateurs/validateurs/tests, Docker/CI et documentation. PRD et registre requirements.json inchangés. Le découpage reste en huit lots et les priorités ne changent pas.

Les [mesures MCP](measurements/LOT-6-MCP.md) détaillent connexion authentifiée, chemin des contrôles sans métier, lecture de scène, recherche paginée, création/révision/validation/soumission, révocation et huit lectures concurrentes. Petits échantillons locaux ; aucun SLA ni capacité publique déduits. Les [cinq benchmarks](measurements/LOT-6-REGRESSION.json) conservent leurs oracles. En clôture locale : environ 33 Gio disque disponibles et 20 Gio mémoire disponible, valeurs instantanées après les campagnes, aucune saturation observée dans ces tests.

## Anomalies corrigées

- Liaison audience URL/introspection Keycloak résolue avec client ressource préenregistré portant cette URL, sans option de contournement.
- SceneRead historique et page de références EntityRead alignés entre HTTP/MCP, exemples et générateurs ; pas de second moteur métier.
- Provenance externe complète, révisions/audits liés à une preuve serveur ; audit de refus lui-même protégé contre l’usurpation de preuve.
- Plafond externe appliqué sur services et HTTP caché ; refus humain placé avant disponibilité de l’assistant pour éviter 503 à la place de 403.
- Portée historique d’idempotence humaine/IA intégrée préservée ; portée externe indépendante de la requête réseau mais liée à humain/client/grant.
- Reprise des connexions PostgreSQL inactives MCP gérée sans crash ; indisponibilité IdP traitée en refus fermé.
- Borne réelle du résultat calculée avec texte et structure avant COMMIT ; rollback vérifié sur réponse volumineuse.

Les campagnes échouées pendant préparation ne sont pas comptées comme réussites. Le test de contention observe pg_stat_activity avec le même rôle que les requêtes, faute de quoi PostgreSQL masque légitimement les activités d’un autre rôle. Le test de reprise attend le retour de l’introspection avant d’exiger 403, sans autoriser de lecture pendant 503.

## CI et réception

CI du Lot 5 vérifiée : [run 41303083199](https://github.com/ZA512/StoryMaster/actions/runs/41303083199), success sur 58ec5a98f3c09de59ae2c2f4511cf5d9ffe9e178. Le workflow du Lot 6 installe Chromium avant les tests OAuth, préenregistre Keycloak local, rejoue tests et benchmarks, puis active explicitement MCP pour CLI et navigateur ; Spike A reste isolé. Le statut distant de la branche publiée se consulte dans [Actions](https://github.com/ZA512/StoryMaster/actions?query=branch%3Acodex%2Flot6-mcp-local) : aucune réussite distante ne se déduit des seuls résultats locaux.

R-CONT-01 reste ouvert : lectures/préviews sous Project partagé retardent merge et révocation exclusifs ; le merge bloque aussi des scènes indépendantes. Les mesures locales ne prouvent ni charge soutenue, absence de famine ni multi-instance. Une révocation IdP entre introspection et COMMIT d’une requête déjà admise n’est pas atomique avec PostgreSQL ; la requête suivante réintrospecte.

Réserves : RLS non activée ; rétention/purge et rotation d’exploitation ; récupération complète des brouillons ; sauvegardes/restauration historique ; TLS/publication ; clients dynamiques. Le redémarrage est qualifié, la restauration d’une sauvegarde antérieure à une révocation ne l’est pas : MCP doit rester désactivé et toutes les délégations restaurées invalidées avant toute remise en service. Cette procédure d’exploitation reste à qualifier au Lot 7 ; aucune sauvegarde ancienne n’est autorisée à réactiver implicitement un grant. Resource Indicators reste expérimental.

Décisions restant au propriétaire : réception du Lot 6 avec ces réserves et portée locale d’ADR-0015 ; éventuelle autorisation distincte du Lot 7. Lot 5 phase B et GO-03 commercial demeurent différés. La [future UX](UX-FUTURE-ROADMAP.md) est un inventaire ; direction graphique et arbitrages majeurs restent humains, aucune bibliothèque lourde ajoutée.

## Critères d'acceptation du document

Capacités locales, versions, contrôles et limites identifiés ; preuves réelles distinguées des fixtures et spécifications ; fichiers et données conservés ; réserves et accord de réception explicites ; aucune réception humaine, intégration commerciale ou qualification publique anticipée.
