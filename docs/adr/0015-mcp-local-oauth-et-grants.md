# ADR-0015 — MCP local, OAuth et délégations persistantes

**Statut :** mise en œuvre locale autorisée par la mission Lot 6 ; réception attendue. **Date :** 1er novembre 2026. [Décisions](../HUMAN-DECISIONS.md), [ADR-0002](0002-api-metier-unique-et-mcp.md), [ADR-0008 partiel](0008-identite-delegation-et-politiques.md).

## Contexte et choix à qualifier par le Spike C

Lot 5 phase A reçu avec réserves ; phase B commerciale et GO-03 différés par instruction explicite. Le client de qualification utilise OAuth/MCP sans LLM. SDK officiel serveur/client 2.4.0, intégration Fastify 2.0.1 et Node 2.1.2 épinglées après consultation du registre npm et des [documents officiels](https://github.com/modelcontextprotocol/typescript-sdk). Les versions réellement compatibles seront limitées à celles exercées, cible 2026-07-28 et compatibilité 2025-11-25 sans session transport persistante.

Une factory SDK commune pour les deux générations ; Streamable HTTP officiel, aucun protocole recréé. Découverte moderne server/discover et enveloppe par requête ; génération 2025 initialize/initialized puis outils, sans session porteuse d’autorité. Un ancien identifiant de session ne remplace jamais OAuth et grant. Résultats structurés conformes au catalogue de treize outils, erreurs métier sûres et bornes de taille. Resources/prompts, sampling, tâches et abonnements non requis et non activés.

Keycloak local reste AS, Code+PKCE S256, redirects exacts et clients préenregistrés. JWT signé RS256, issuer/audience/type access-token/subject/client/temps/scopes contrôlés, introspection pour révocation avant chaque requête, sans cache positif de droits. Métadonnées PRM RFC 9728 publiques et non sensibles pour bootstrap ; découverte MCP et outils protégés. Aucune récupération d’URL de client dynamique ou de prompt. Destinations AS/JWKS/introspection épinglées, redirections réseau refusées. [Configuration Keycloak MCP officielle](https://www.keycloak.org/securing-apps/mcp-authz-server) : Resource Indicators est expérimental ; disponibilité et refus invalid_target à démontrer sur l’image installée, jamais simulés si absents. Exposition publique et exploitation restent non qualifiées.

## Résolution du Spike C

Les échanges réels ont passé les deux versions. Sur Keycloak 26.8.1, Resource Indicators émet l’audience URL, alors que l’introspection conserve un contrôle clientId ∈ audience. Le client ressource préenregistré utilise donc http://localhost:3500/mcp comme clientId et resource_url, avec secret confidentiel local, sans activer le contournement d’audience. Les clients publics ciblent ce client par leur mapper d’audience. Les requêtes avec ressource inconnue ou ressource modifiée lors de l’échange du code sont refusées invalid_target. La fonctionnalité reste expérimentale et limitée au local.

Écarts minimaux de contrats : SceneRead = scène actuelle OU snapshot SceneRevision pour revision ; EntityRead ajoute une page de références inverses optionnelle. HTTP porte les mêmes paramètres et services. Les noms des treize outils ne changent pas. Les schémas, générateurs et tests restent synchronisés.

## Délégation et invariants

Grant persistant lié à humain/client, projets explicitement sélectionnés, scopes, expiration, révision et historique ; lecture par défaut, préparation/soumission par consentement supplémentaire. Un sélecteur de grant `StoryMaster-Grant-Id` peut désigner une délégation connue : cet ID n’est jamais une preuve, le token authentifié doit correspondre au propriétaire/client et tous les droits sont revérifiés. Cela permet plusieurs délégations indépendantes du même client, sans révoquer celles de l’utilisateur lors des fixtures de qualification.

L’adaptateur ne transmet pas de bearer à la couche narrative ; preuve serveur opaque, liée au token validé et à la délégation, jamais exposée dans un DTO. Même barrière Project que les services existants ; mutations de grants verrouillent projets concernés triés, puis autorisation. Lecture/publication engagée avant révocation peut finir dans l’ordre sérialisé ; après commit, nouvelles commandes refusées. Introspection AS hors transaction métier ; aucun appel réseau sous Project. Une révocation distante intervenant après l’introspection d’une requête déjà admise ne peut pas être synchronisée atomiquement avec PostgreSQL ; la requête suivante réintrospecte.

Plafond external_ai : lecture et ses propres propositions sous même humain/client/grant ; aucun canon, commentaire, secret, administration, approve/reject/merge, y compris HTTP caché ou cas d’usage direct. Moteur Lot 4 commun. Provenance persistante client authentifié, grant/version, initiateur, requête/exécution ; modèle externe non attesté. Au merge humain, grant d’origine encore actif/non expiré, projet/scopes/client et rôle courant exigés ; sinon duplication humaine explicite en nouvelle intention sans reprendre les avis. Historique antérieur conservé.

Idempotence externe liée à humain/client/grant/projet/commande/corps/préconditions, indépendante de la requête réseau ; portée historique humaine/IA intégrée conservée. Proposition, révision, provenance et audit atomiques. Coupure après commit : même intention, même résultat, pas de seconde mutation ; autorisation fraîche avant rejeu.

## Alternatives et limites

Clé statique globale ou confiance en clientInfo rejetées. Second moteur MCP rejeté. Clients dynamiques/tunnels/TLS public reportés. Docker profile MCP désactivé par défaut, port publié seulement sur loopback ; binding interne du conteneur sur réseau privé, aucune publication Internet. Contrôles Host avec port exact et Origin fermé, limites payload/profondeur/résultat/débit. Qualification locale et mesures ne valent pas capacité publique ; R-CONT-01, RLS, restauration et UX hérités restent ouverts. Future refonte UX documentée seulement.

## Critères d'acceptation du document

Spike C doit démontrer réseau/OAuth/SDK/services communs, parité et refus sous autorisation fraîche. SDK/versions, risques expérimentaux, choix locaux et décisions de production différées identifiables ; aucune autorisation commerciale ni Lot 7 déduite.
