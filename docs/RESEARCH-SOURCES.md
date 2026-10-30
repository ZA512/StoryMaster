# Registre des sources techniques vérifiées

**Statut :** Recherche consolidée, décisions proposées. **Date :** 30 octobre 2026, Europe/Paris.
**Portée :** vérification documentaire publique, sans essai de SDK ni de fournisseur. **Références :** [audit](DOCUMENT-AUDIT.md), [traçabilité](RESEARCH-TRACEABILITY.md).

## Synthèse

Les deux recherches locales sont conservées comme contexte produit. Leurs marqueurs de citations `turn…` ne permettent pas de retrouver les sources : ils ne constituent pas une preuve vérifiable. Les liens ci-dessous ont été ouverts le 30 octobre 2026. « Courant » signifie constaté dans les pages accessibles à cette date, sans garantie de disponibilité contractuelle ou de compatibilité d'un client installé.

## Analyse des sources primaires

| ID | Source officielle et version | Constat utile | Conséquence de conception |
|---|---|---|---|
| S01 | [MCP 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28), confirmé par redirection de [latest](https://modelcontextprotocol.io/specification/latest) | Cœur à requêtes autonomes | Ne pas reconstruire le protocole à partir du handshake historique |
| S02 | [Versioning MCP](https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning) | Version par requête, `server/discover`, erreur `-32022` | Compatibilité clients à tester, pas à présumer |
| S03 | [Base MCP](https://modelcontextprotocol.io/specification/2026-07-28/basic) | `_meta` contient version et capacités obligatoires ; `clientInfo` facultatif et autodéclaré | L'identité de sécurité vient du token et du registre client |
| S04 | [Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http) | POST ; réponse JSON ou SSE par requête ; pas de session protocolaire ; en-têtes miroir validés | Profil distant moderne, validation Origin et cohérence corps/en-têtes |
| S05 | [Tools MCP](https://modelcontextprotocol.io/specification/2026-07-28/server/tools) | `inputSchema`, `outputSchema`, résultats structurés ; erreurs métier `isError` ; `resultType` | Catalogue de définitions officielles, métadonnées métier séparées |
| S06 | [Authorization MCP](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization) | Serveur de ressources OAuth ; métadonnées protégées ; découverte de l'émetteur | Auth obligatoire pour StoryMaster, même si facultative dans le protocole général |
| S07 | [SDK TypeScript officiel](https://github.com/modelcontextprotocol/typescript-sdk/blob/main/packages/server/README.md) | Ligne v2 stable annoncée pour cette révision | Pinner version exacte et vérifier types pendant le spike C |
| S08 | [OpenAI function calling](https://developers.openai.com/api/docs/guides/function-calling) | Appels de fonctions et schémas stricts avec contraintes propres | Adaptateur dédié, validation métier indépendante |
| S09 | [OpenAI MCP](https://developers.openai.com/api/docs/guides/tools-connectors-mcp) | MCP distant, `allowed_tools`, `require_approval` | Approbation fournisseur distincte de l'approbation narrative |
| S10 | [OpenAI conversation state](https://developers.openai.com/api/docs/guides/conversation-state) | Gestion explicite de l'état conversationnel | Conversation applicative source de vérité ; pas de dépendance à un identifiant fournisseur |
| S11 | [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data) | Conservation variable selon endpoint et configuration | `store:false` ne prouve pas une absence de toute rétention |
| S12 | [Claude tool use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview) | Blocs `tool_use` et `tool_result` | Préserver les différences de boucle et de streaming |
| S13 | [Claude MCP connector](https://platform.claude.com/docs/en/agents-and-tools/mcp-connector) | Bêta ; tools distants ; jeton obtenu/rafraîchi par l'appelant ; headers selon plateforme ; non éligible ZDR dans la page consultée | Ne pas en faire une dépendance de l'assistant intégré ; réexaminer confidentialité avant activation |
| S14 | [Claude Code MCP](https://code.claude.com/docs/en/mcp) | Runtimes v1/v2, disponibilité du moderne liée à version/configuration | Matrice de clients réellement testés avant lot 6 |
| S15 | [Tiptap 3.x JSON/HTML](https://tiptap.dev/docs/guides/output-json-html) | Sérialisation JSON et HTML disponibles | JSON validé candidat principal, HTML projection |
| S16 | [Tiptap snapshots](https://tiptap.dev/docs/collaboration/documents/snapshot) | Extension dans registre privé et prérequis d'offre | Historique métier indépendant, licence à examiner |
| S17 | [Hocuspocus collaboration](https://tiptap.dev/docs/hocuspocus/guides/collaborative-editing) | Yjs, historique collaboratif, attention aux schémas clients | Migration CRDT explicitement préparée, V1 |
| S18 | [Yjs updates](https://docs.yjs.dev/api/document-updates) | Updates binaires commutatifs, associatifs, idempotents ; vectors d'état | Un JSON reconstitué ne conserve pas les identifiants CRDT |
| S19 | [PostgreSQL isolation](https://www.postgresql.org/docs/18/transaction-iso.html) | Transactions sérialisables peuvent nécessiter une reprise complète | Stratégie MVP de verrou projet explicite ; aucune transaction externe |
| S20 | [PostgreSQL RLS](https://www.postgresql.org/docs/18/ddl-rowsecurity.html) | Propriétaire/superuser peuvent contourner certaines politiques | Rôle applicatif dédié et tests de pool ; RLS défense complémentaire |
| S21 | [PostgreSQL recherche](https://www.postgresql.org/docs/18/textsearch.html) | Recherche textuelle et index natifs | Recherche lexicale MVP, vecteurs V1 |
| S22 | [OIDC Core 1.0, errata 2](https://openid.net/specs/openid-connect-core-1_0.html) | Identité au-dessus d'OAuth | Distinguer ID token, access token et session web |
| S23 | [RFC 9700, janvier 2025](https://www.rfc-editor.org/rfc/rfc9700.html) | Bonnes pratiques de sécurité OAuth | Code + PKCE S256, validation redirections/émetteur |
| S24 | [RFC 9728, avril 2025](https://www.rfc-editor.org/rfc/rfc9728.html) | Métadonnées de ressource protégée | Publier découverte OAuth ; aucune clé IA utilisée comme token MCP |
| S25 | [Scrivener organisation](https://www.literatureandlatte.com/blog/integrating-scriveners-binder-corkboard-and-outliner) | Binder, Corkboard, Outliner : vues d'organisation | Besoin de plan MVP ; cartes après MVP |
| S26 | [Scrivener révision](https://scrivener.tenderapp.com/help/kb/general/revising-in-scrivener) | Snapshots et outils de révision | Restaurer et comparer sans confondre sauvegarde et snapshot |
| S27 | [Plottr fonctions](https://plottr.com/features/) et [timeline](https://docs.plottr.com/article/54-timeline-overview) | Cartes, pistes, personnages/lieux, séries, filtres | Bible reliée MVP ; planification avancée V1 |
| S28 | [Campfire applications](https://www.campfirewriting.com/apps) | Modules et capacités différant selon plateforme, calendrier/relations/collaboration listés | Modularité pertinente ; ne pas inférer de garantie de coédition temps réel |
| S29 | [OpenAPI 3.1.1](https://spec.openapis.org/oas/v3.1.1.html) | Version stable choisie délibérément pour ce contrat | Pas présentée comme dernière version ; JSON Schema 2020-12 |
| S30 | [OpenAI migration Responses](https://developers.openai.com/api/docs/guides/migrate-to-responses) et [génération texte](https://developers.openai.com/api/docs/guides/text) | Responses recommandé pour les nouveaux projets de génération texte dans les pages consultées | Base proposée de l’adaptateur OpenAI, sans imposer un modèle ni les services Agents |

## Limites et questions ouvertes

Les pages ProseMirror guide/référence ont renvoyé 403 lors de cette recherche ; les conclusions sur la sérialisation reposent sur S15/S17 et seront vérifiées dans le spike A. Les URL de tutoriels Campfire calendrier/collaboration renvoient une coquille sans contenu exploitable : aucun détail de permission ni de simultanéité n'en est déduit. Aucun tarif, engagement de non-entraînement ni localisation contractuelle n'est présumé. Les versions exactes de bibliothèques restent à pinner avant les spikes.

## Décisions proposées et alternatives

Vérifier les normes puis réaliser les spikes ; alternative de figer une stack sur les recherches locales seules rejetée faute de liens auditables. Confiance élevée sur les invariants ; moyenne sur l'interopérabilité clients, non testée.

## Risques

Documentation évolutive, exemples abrégés, divergences des SDK et offres commerciales. Toute mise en œuvre devra revalider versions et conditions applicables.

## Critères d'acceptation du document

Chaque affirmation normative renvoie à une source primaire ouverte ; chaque indisponibilité est signalée ; les choix applicatifs sont distingués des obligations des standards ; un contributeur peut refaire les vérifications à partir des URL.
