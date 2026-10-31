# Contrats API et MCP

**Version :** 0.6
**Statut :** HTTP Lots 0–3 exécutables, réception Lot 3 attendue pour sessions humaines ; MCP et autres opérations spécifiés seulement
**Références :** `PRD.md`, `DOMAIN-MODEL.md`, `ARCHITECTURE.md`

## 1. Principes

L'API métier constitue l'unique point d'entrée applicatif pour les opérations sur les projets.

Les interfaces HTTP et MCP exposent les mêmes cas d'usage sous des formes adaptées à leurs clients.

Les contrôles de sécurité ne doivent pas être implémentés uniquement dans les adaptateurs.

## 2. Conventions générales

### 2.1 Versionnement

Préfixe HTTP proposé :

`/api/v1`

Les changements incompatibles nécessitent une nouvelle version de contrat ou une stratégie de migration explicite.

### 2.2 Identifiants

Les ressources utilisent des identifiants opaques, par exemple UUID.

Un client ne doit pas déduire l'appartenance à un projet à partir de l'identifiant.

### 2.3 Pagination

Les collections importantes utilisent une pagination par curseur.

Paramètres :

- `limit`
- `cursor`

Réponse :

- `items`
- `nextCursor`
- `hasMore`

Les limites maximales sont définies côté serveur.

### 2.4 Révisions

Les ressources modifiables exposent une révision.

Les modifications HTTP utilisent `If-Match` ou une précondition équivalente documentée.

Une révision obsolète entraîne une erreur explicite.

### 2.5 Idempotence

Les opérations de création ou de fusion sensibles aux répétitions acceptent une clé d'idempotence lorsque pertinent.

Une même requête rejouée avec la même clé ne doit pas produire deux créations ou deux fusions.

### 2.6 Erreurs

Format recommandé :

- `error.code`
- `error.message`
- `error.details`
- `error.correlationId`

Codes métier :

- `UNAUTHENTICATED`
- `FORBIDDEN`
- `NOT_FOUND`
- `VALIDATION_FAILED`
- `REVISION_CONFLICT`
- `PROPOSAL_CONFLICT`
- `INVALID_STATE_TRANSITION`
- `MODULE_DISABLED`
- `RATE_LIMITED`
- `PROVIDER_UNAVAILABLE`
- `BUDGET_EXCEEDED`
- `INTERNAL_ERROR`

Pour une ressource privée, le serveur peut retourner `404` plutôt que révéler son existence à un acteur non autorisé.

## 3. Contexte d'autorisation

Chaque opération reçoit un contexte d'acteur déterminé côté serveur :

- `actorType`
- `userId`
- `clientId`, si applicable
- `grantId`, si applicable
- `projectId`
- `permissions`
- `correlationId`

Le client ne peut pas s'attribuer lui-même ces valeurs en les envoyant dans un corps JSON.

Les droits effectifs sont l'intersection :

1. des droits de l'utilisateur ;
2. des droits du client ;
3. des droits de la délégation ;
4. des restrictions applicables au projet et à l'opération.

## 4. Projets

### 4.1 Lister les projets

`GET /api/v1/projects`

Retourne uniquement les projets visibles par l'utilisateur.

### 4.2 Créer un projet

`POST /api/v1/projects`

Corps :

- `name`
- `description` facultatif
- `templateKey` facultatif

Résultat :

- projet créé ;
- rôle owner attribué ;
- visibilité privée.

### 4.3 Consulter un projet

`GET /api/v1/projects/{projectId}`

### 4.4 Modifier un projet

`PATCH /api/v1/projects/{projectId}`

Nécessite une permission administrative et une précondition de révision.

### 4.5 Membres

- `GET /api/v1/projects/{projectId}/members`
- `POST /api/v1/projects/{projectId}/invitations`
- `PATCH /api/v1/projects/{projectId}/members/{userId}`
- `DELETE /api/v1/projects/{projectId}/members/{userId}`

Ces opérations ne sont pas exposées aux agents IA via les outils MCP du MVP.

## 5. Manuscrits

### 5.1 Manuscrits et chapitres

- `GET /api/v1/projects/{projectId}/manuscripts`
- `POST /api/v1/projects/{projectId}/manuscripts`
- `GET /api/v1/projects/{projectId}/manuscripts/{manuscriptId}`
- `POST /api/v1/projects/{projectId}/manuscripts/{manuscriptId}/chapters`
- `PATCH /api/v1/projects/{projectId}/chapters/{chapterId}`

### 5.2 Scènes

- `POST /api/v1/projects/{projectId}/chapters/{chapterId}/scenes`
- `GET /api/v1/projects/{projectId}/scenes/{sceneId}`
- `PUT /api/v1/projects/{projectId}/scenes/{sceneId}/content`
- `PATCH /api/v1/projects/{projectId}/scenes/{sceneId}/metadata`
- `POST /api/v1/projects/{projectId}/scenes/{sceneId}/move`
- `GET /api/v1/projects/{projectId}/scenes/{sceneId}/revisions`

### 5.3 Sauvegarde de contenu

`PUT /api/v1/projects/{projectId}/scenes/{sceneId}/content`

Précondition :

- `If-Match` contenant la révision courante connue du client.

Corps :

- `content`
- `contentFormatVersion`

Réponse :

- `sceneId`
- `revision`
- `savedAt`
- `wordCount`

Si la révision est périmée :

- HTTP `412 Precondition Failed` ;
- code `REVISION_CONFLICT` ;
- aucune écriture ;
- le client conserve son brouillon.

### 5.4 Historique

Une révision de scène peut être consultée sans devenir la version courante.

La restauration crée une nouvelle révision.

## 6. Objets narratifs

### 6.1 Collections

- `GET /api/v1/projects/{projectId}/objects`
- `POST /api/v1/projects/{projectId}/objects`
- `GET /api/v1/projects/{projectId}/objects/{objectId}`
- `PATCH /api/v1/projects/{projectId}/objects/{objectId}`
- `POST /api/v1/projects/{projectId}/objects/{objectId}/archive`
- `GET /api/v1/projects/{projectId}/objects/{objectId}/revisions`

### 6.2 Recherche

`GET /api/v1/projects/{projectId}/search`

Paramètres :

- `q`
- `types`
- `limit`
- `cursor`

Les résultats peuvent contenir :

- `resourceType`
- `resourceId`
- `title`
- `excerpt`
- `revision`
- `relevance`

Les extraits sont calculés uniquement à partir de données autorisées.

### 6.3 Relations

- `GET /api/v1/projects/{projectId}/objects/{objectId}/relations`
- `POST /api/v1/projects/{projectId}/relations`
- `PATCH /api/v1/projects/{projectId}/relations/{relationId}`
- `DELETE /api/v1/projects/{projectId}/relations/{relationId}`

Le serveur vérifie le type de relation et l'appartenance des deux objets au projet.

## 7. Propositions

### 7.1 Créer

`POST /api/v1/projects/{projectId}/proposals`

Corps :

- `title`
- `description`
- `operations` facultatif

Le serveur détermine l'identité réelle de l'acteur et `origin` ; ils ne sont jamais acceptés du corps de création. La sortie porte `createdByActor`, la révision et les reviews effectives.

### 7.2 Consulter

`GET /api/v1/projects/{projectId}/proposals/{proposalId}`

### 7.3 Modifier les opérations

`PUT /api/v1/projects/{projectId}/proposals/{proposalId}/operations`

Précondition : révision de proposition attendue.

La modification crée une nouvelle révision de proposition et invalide les approbations précédentes.

### 7.4 Prévisualiser

`POST /api/v1/projects/{projectId}/proposals/{proposalId}/preview`

Retourne :

- `proposalRevision`
- `affectedResources`
- `diffs`
- `validationFindings`
- `conflicts`
- `estimatedImpact`

La prévisualisation ne modifie pas les ressources cibles.

### 7.5 Valider

`POST /api/v1/projects/{projectId}/proposals/{proposalId}/validate`

Retourne :

- `valid`
- `errors`
- `warnings`
- `conflicts`
- `validatedAgainst`

Une validation réussie n'est pas une réservation des ressources.

### 7.6 Soumettre

`POST /api/v1/projects/{projectId}/proposals/{proposalId}/submit`

Nécessite le droit de soumettre une proposition.

### 7.7 Examiner

- `POST /api/v1/projects/{projectId}/proposals/{proposalId}/reviews`
- `POST /api/v1/projects/{projectId}/proposals/{proposalId}/approve`
- `POST /api/v1/projects/{projectId}/proposals/{proposalId}/reject`

Une approbation référence explicitement la révision approuvée.

### 7.8 Fusionner

`POST /api/v1/projects/{projectId}/proposals/{proposalId}/merge`

Préconditions :

- acteur autorisé ;
- proposition approuvée ;
- approbation encore valable ;
- versions cibles compatibles ;
- invariants métier respectés.

Résultat :

- `changeSetId`
- `mergedAt`
- `resourceRevisions`
- `proposalStatus`

En cas de conflit, aucune modification partielle n'est appliquée.

## 8. Schéma des opérations de proposition

### 8.1 Structure commune

Chaque opération comporte :

- `operationId`
- `kind`
- `targetId` facultatif
- `expectedRevision` si nécessaire
- `payload`
- `reason` facultatif

### 8.2 Opérations initiales

**create_object**

Crée un objet narratif avec un type et des propriétés validées.

**update_object**

Modifie des champs explicitement désignés, sans remplacement implicite de l'objet complet.

**archive_object**

Archive un objet après vérification des dépendances.

**create_relation**

Crée une relation typée.

**update_relation**

Modifie une relation existante.

**remove_relation**

Retire une relation de façon historisée.

**replace_scene_content**

Remplace le document structuré d'une scène à partir d'une révision de base.

**update_scene_metadata**

Modifie les métadonnées d'une scène.

**move_scene**

Change le chapitre ou la position d'une scène.

### 8.3 Choix important pour le texte

Le MVP n'utilise pas de patch arbitraire sur des positions de caractères ou sur des chemins JSON internes de l'éditeur.

Une proposition de remplacement de scène doit contenir :

- l'identifiant de scène ;
- la révision attendue ;
- le document proposé ;
- sa version de format.

Le serveur calcule le diff affiché à l'utilisateur.

Cette stratégie est moins sophistiquée qu'un merge textuel automatique, mais beaucoup plus prévisible pour un premier moteur transactionnel.

### 8.4 Identifiants temporaires

Une opération de création peut déclarer un identifiant local à la proposition.

Une opération ultérieure peut le référencer.

Le serveur vérifie :

- unicité ;
- existence de la création correspondante ;
- absence de cycle interdit ;
- compatibilité des types ;
- résolution atomique lors de la fusion.

## 9. Collaboration asynchrone — Lot 3

Les routes exécutées sont marquées `x-lot: 3` dans [OpenAPI 0.6.0](spec/openapi.yaml), qui décrit chaque entrée, DTO, code et précondition. Toutes les routes métier exigent une session humaine et une autorisation serveur fraîche. Mutations : Origin exact, CSRF, Idempotency-Key ; If-Match sur la ressource existante (membership, invitation, fil ou commentaire). L’édition/retrait d’un commentaire ajoute expectedThreadRevision. Créations : pas de fausse révision de scène pour le commentaire global ; une ancre cite explicitement sa SceneRevision.

| Parcours | Routes principales |
|---|---|
| Membres | GET `/projects/{projectId}/members`, GET `/members/self`, PATCH/DELETE `/members/{userId}`, POST `/members/leave` |
| Invitations | GET/POST `/projects/{projectId}/invitations`, DELETE `/invitations/{invitationId}` |
| Préparation de lien | POST `/auth/invitations/prepare` (anonyme, Origin, aucune consultation de données), cookie chiffré temporaire |
| Réponse destinataire | GET `/api/v1/invitations/current`, POST `/current/respond`, DELETE `/current` pour effacer le contexte |
| Discussions | GET/POST `/projects/{projectId}/comments`, GET `/comment-threads/{threadId}`, POST `/comment-threads/{threadId}/replies`, PATCH `/comment-threads/{threadId}/state` |
| Messages | PATCH/DELETE `/projects/{projectId}/comments/{commentId}` |
| Historique | GET des sous-routes `/revisions` de membership, invitation, fil et commentaire |

Les routes métier abrégées dans ce tableau sont préfixées `/api/v1` ; les sous-routes restent sous le même projet. Pagination bornée et curseurs liés au compte/projet/rôle/filtres ; historique par beforeRevision. Owner unique non modifiable ; admin limité aux rôles author/reviewer/reader. Aucun hash ni secret dans les DTO. Création d’invitation : lien révélé une fois ; rejeu `{link:null,linkRevealed:false}`. Réponse acceptée rejouée ne restaure pas un accès retiré.

ThreadView contient le commentaire racine, l’origine immuable et sa résolution courante étiquetée par révision. ThreadDetail ajoute une page de messages. Incertitude : positions null, origine lisible sous les mêmes droits. Texte brut rendu sans HTML actif. Corps retiré null ; historique privé aux auteurs encore membres et modérateurs. Résoudre/rouvrir vise le fil, pas un endpoint resolve de commentaire. Cibles de production : scène ou fiche ; propositions futures. [Exemples synthétiques](examples/lot3-http.json), [scénarios déclaratifs](spec/lot3-scenarios.json), [preuves d’exécution](LOT-3-REPORT.md).

## 10. Assistant IA intégré

### 10.1 Conversations

- `POST /api/v1/projects/{projectId}/ai/conversations`
- `GET /api/v1/projects/{projectId}/ai/conversations/{conversationId}`
- `POST /api/v1/projects/{projectId}/ai/conversations/{conversationId}/messages`

### 10.2 Exécution

Une demande IA peut être traitée de façon asynchrone.

Réponse initiale possible :

- `executionId`
- `status`
- `conversationId`

La progression peut être transmise par flux d'événements ou récupérée par consultation de statut.

### 10.3 Contrôle

L'API doit permettre :

- d'interrompre une exécution si possible ;
- de consulter son état ;
- d'identifier les ressources utilisées ;
- de retrouver les propositions produites ;
- de consulter les erreurs et limites.

### 10.4 Fournisseurs

La configuration d'un fournisseur IA doit être une opération dédiée, distincte de l'API narrative.

Les secrets ne sont jamais renvoyés en clair après enregistrement.

## 11. Catalogue MCP initial

Les noms définitifs seront versionnés, mais les capacités MVP sont les suivantes.

| Outil MCP | Cas d'usage métier | Permission minimale |
|---|---|---|
| `project_list` | Lister les projets délégués | projects:read |
| `project_get_context` | Consulter une synthèse bornée | project:read |
| `entity_search` | Rechercher des objets | project:read |
| `entity_get` | Lire un objet | project:read |
| `scene_read` | Lire une scène | project:read |
| `relation_list` | Consulter les relations | project:read |
| `timeline_list` | Consulter les événements | project:read |
| `proposal_create` | Créer un brouillon | proposal:write |
| `proposal_set_operations` | Préparer des opérations | proposal:write |
| `proposal_preview` | Prévisualiser | proposal:read |
| `proposal_validate` | Vérifier les opérations | proposal:read |
| `proposal_submit` | Soumettre à revue | proposal:submit |
| `proposal_get` | Consulter l'état | proposal:read |

Tous les outils portant sur des données narratives exigent un `projectId` explicite ou un contexte de projet non ambigu validé par le serveur.

### 11.1 Exclusions MCP du MVP

Ne pas exposer :

- modification des rôles ;
- gestion des invitations ;
- accès aux clés IA ;
- suppression définitive ;
- modification de la politique de sécurité ;
- fusion automatique ;
- exécution de code serveur arbitraire ;
- requêtes SQL libres.

## 12. Scopes et permissions

Scopes proposés :

- `projects:read`
- `project:read`
- `proposal:read`
- `proposal:write`
- `proposal:submit`

Ces scopes représentent des plafonds d'autorisation, pas des permissions suffisantes à eux seuls.

Un utilisateur sans droit de lecture sur un projet ne peut pas le lire même si son jeton possède `project:read`.

Les permissions du projet restent déterminantes.

## 13. Contrats d'export

`POST /api/v1/projects/{projectId}/exports`

Paramètres :

- `format`
- `includeHistory`
- `includeComments`

Réponse :

- `exportJobId`
- `status`

Une archive complète contient :

- manifeste ;
- version du format ;
- manuscrits ;
- chapitres ;
- scènes ;
- objets ;
- relations ;
- références ;
- métadonnées essentielles.

L'export doit respecter les permissions et les politiques de confidentialité.

## 14. Tests de contrat

Tests obligatoires :

1. un accès à un projet non autorisé échoue ;
2. une sauvegarde sans précondition de version est refusée selon la politique ;
3. une version obsolète ne peut pas écraser une scène ;
4. une relation interprojets est rejetée ;
5. une proposition invalide ne peut pas être fusionnée ;
6. une fusion répétée ne duplique pas les changements ;
7. une approbation ancienne est invalidée après modification ;
8. un client MCP lecture seule ne peut pas créer de proposition ;
9. un client MCP peut soumettre mais pas fusionner au MVP ;
10. les erreurs ne révèlent ni secrets ni données d'autres projets.

## 15. Livrables techniques attendus

Avant implémentation des routes, produire :

- une spécification OpenAPI versionnée ;
- les schémas de validation partagés ;
- le catalogue MCP machine lisible ;
- une matrice permissions/opérations ;
- des tests de contrat automatisés.

Les contrats doivent être suffisamment précis pour permettre des tests indépendants de l'interface graphique.

## 16. Conventions consolidées du contrat proposé

**Portée :** API v1 MVP, contrats sans serveur. **Références :** [OpenAPI](spec/openapi.yaml), [opérations](spec/operations.schema.json), [catalogue MCP](spec/mcp-tools.json), [politique MCP](spec/mcp-policy.json), [tests](CONTRACT-TESTS.md), [sources](RESEARCH-SOURCES.md).

### Synthèse

Les tableaux ci-dessous précisent les sections initiales. Les formes machine et fixtures sont la même proposition de contrat. Une différence entre artefacts bloque leur utilisation ; elle ne doit pas être résolue par une implémentation ad hoc. Permissions métier `project.read`, `narrative.write`, `proposal.write`, `proposal.review`, `proposal.approve`, `proposal.merge`, `export.create`, `comment.write` ; les scopes OAuth avec `:` sont des plafonds supplémentaires.

### Règles applicables à chaque ligne des catalogues

- Paramètres et bodies en camelCase ; identifiants opaques, sensibles à la casse ; origine/acteur/permissions fournis par le serveur. Les champs non déclarés sont refusés aux entrées de commande.
- Collections : `limit` 1..100, défaut 20, cursor signé lié au projet/requête/droits ; sortie `{items,nextCursor,hasMore}` sans total privé global. Les bornes sont des protections techniques proposées, pas des quotas commerciaux.
- GET ressource : `{data: resource}` et ETag fort `"r7"` ; proposition : `"p2-s5"`, où proposalRevision est contenu et stateVersion état. `currentProposalRevision` du modèle interne est sérialisé `proposalRevision`.
- Écriture existante : If-Match obligatoire, absence → HTTP 428 `PRECONDITION_REQUIRED`, obsolète → 412 `REVISION_CONFLICT`. Pour une proposition, body `expectedProposalRevision` et ETag complet doivent être cohérents. MCP transmet `expectedStateVersion` et l'adaptateur construit la même précondition.
- POST de commande et créations exigent Idempotency-Key, sauf preview/validate sans effet de bord. PUT/PATCH/DELETE existants la supportent et conservent leurs CAS ; retry après succès perdu avec la même clé retourne le succès initial. Une création sans clé → 400 VALIDATION_FAILED ; clé différente n'autorise pas de dupliquer un merge déjà exécuté.
- Audit A0 : accès/échec minimal de sécurité (ids et résultat, jamais contenu) ; A1 : événement durable de commande avec acteur complet ; A2 : ChangeSet, révisions et ChangeEvents. Les lectures ne modifient pas le canon. Les journaux de sécurité ne sont pas les snapshots métier.
- TX0 : lecture cohérente autorisée ; TX1 : transaction sous barrière projet, CAS et audit ; TX2 : TX1 + snapshots/ChangeSet/outbox. Toutes les vérifications de rôles/grants/modules sont relues sous barrière d'écriture.
- Erreurs communes E : 401 UNAUTHENTICATED, 403 FORBIDDEN, 404 NOT_FOUND uniforme pour projet absent/inaccessible, 422 VALIDATION_FAILED, 429 RATE_LIMITED, 500 INTERNAL_ERROR. Détails de conflit seulement si la ressource est lisible. Codes stables, messages français non destinés au parsing.

### Catalogue lecture

Préfixe P = `/api/v1/projects/{projectId}`. E s'applique à chaque opération ; toutes sont naturellement idempotentes et n'exigent aucune révision d'entrée, sauf sélection historique optionnelle. Audit A0 / TX0 partout.

| HTTP / outil MCP | Permission | Entrée | Sortie | Erreurs spécifiques |
|---|---|---|---|---|
| GET /api/v1/projects / project_list | membership + projects:read en MCP | limit,cursor | Page<Project> ; intersection projets délégués | cursor invalide 422 |
| GET P / project_get_context via GET P/context | project.read | projectId ; context bounded, include autorisé | Project ou ProjectContext {project,manuscripts,moduleVersions} | 404 uniforme |
| GET P/search / entity_search | project.read | q,types,limit,cursor | Page<SearchHit> avec révision et extrait autorisés | q vide/trop long 422 |
| GET P/objects/{objectId} / entity_get | project.read | objectId, revision? | NarrativeObject | historique purgé 404 sans fuite |
| GET P/scenes/{sceneId} / scene_read | project.read | sceneId,revision? | Scene, doc et références, ETag | révision introuvable 404 |
| GET P/objects/{objectId}/relations / relation_list | project.read | objectId,limit,cursor | Page<Relation> extrémités autorisées | objet invisible 404 |
| GET P/timeline / timeline_list | project.read | limit,cursor | Page<Event>, ordre ordinal, unknown explicite | aucun événement daté obligatoire |
| GET P/proposals/{proposalId} / proposal_get | project.read + proposal.read | proposalId | Proposal + reviews effectives | 404 uniforme |

`entity_search` recherche scènes et fiches, avec filtre `types` ; il n'est pas limité aux seuls NarrativeObject malgré son nom hérité. Références inverses via GET P/objects/{objectId}/references, mêmes permissions/pagination/audit. Une lecture de projet ne révèle ni membres hors besoin ni identifiants de credentials/grants.

### Catalogue d'écriture humaine directe

Les appels suivants requièrent actorType=human ET narrative.write (sauf paramètres projet : project.admin). Aucun jeton IA ne gagne cette capacité en appelant HTTP. Erreurs E + 412/428 ; MODULE_DISABLED 409 si type désactivé ; TX2/A2 pour narration, TX1/A1 pour administration. Sortie ressource avec nouvelle revision/ETag ; création r1, mutation r+1. Remplacer une ressource entière implicitement est interdit.

| HTTP | Entrée / préconditions | Idempotence / résultat particulier |
|---|---|---|
| PUT P/scenes/{sceneId}/content | If-Match ; {content,contentFormatVersion} | clé supportée ; SceneSave {sceneId,revision,savedAt,wordCount} |
| PATCH P/scenes/{sceneId}/metadata | If-Match ; {set:{title?,summary?,status?,references?}} | références typées dans même agrégat scène |
| POST P/scenes/{sceneId}/move | If-Match ; {chapterId,position,dependencyRevisions} | clé obligatoire ; CAS des parents concernés |
| PATCH P | If-Match ; {set:{name?,description?,language?}} | clé supportée ; paramètres narratifs ≠ permissions |
| POST P/objects | {typeKey,schemaVersion,name,attributes,...} | clé obligatoire ; NarrativeObject r1 |
| PATCH P/objects/{objectId} | If-Match ; {set:{name?,summary?,notes?,attributes?}} | attributes remplacés en totalité après validation du schéma |
| POST P/relations | {sourceRef:{id},targetRef:{id},relationType,attributes} | clé obligatoire ; pas de tempId hors proposition |
| PATCH P/relations/{relationId} | If-Match ; {set:{attributes?,relationType?}} | retargeting exclu ; retirer puis créer dans une proposition |
| DELETE P/relations/{relationId} | If-Match | suppression logique r+1, jamais cascade |
| POST P/scenes/{sceneId}/restore | If-Match ; {sourceRevision} | clé obligatoire ; snapshot relu/validé, r+1 |

Création/rename/move/archive manuscrits, chapitres et scènes : `POST P/manuscripts`, `POST P/manuscripts/{id}/chapters`, `POST P/chapters/{id}/scenes`, `PATCH P/manuscripts/{id}`, `PATCH P/chapters/{id}`, `POST P/{manuscripts|chapters|scenes}/{id}/archive`. Les créations prennent un titre et une position avec CAS de structure parent (`dependencyRevisions`) ; les mutations prennent If-Match ; la suppression d'un conteneur exige `includeDescendants:true` explicite et prévisualisation de la liste. Même narrative.write, A2/TX2 ; aucun effacement physique MVP. Les compteurs mots agrégés sont calculés depuis les scènes courantes autorisées, pas depuis toutes les versions.

### Catalogue propositions

Préfixe Q = P/proposals/{proposalId}. Chaque opération est soumise à E ; commandes existantes exigent If-Match et expectedProposalRevision sauf GET. Permission proposal.write pour créateur ou humain owner/admin ; un client IA ne modifie que ses propres propositions sous le même grant. Un relecteur peut proposer un texte qu'il ne peut pas écrire directement ; le merge humain détient à la fois proposal.merge et narrative.write. Une proposition ne confère aucun droit administratif.

| Opération HTTP / MCP | Permission | Entrée | Sortie | Version / idempotence | Erreurs propres | Audit / transaction |
|---|---|---|---|---|---|---|
| POST P/proposals / proposal_create | proposal.write + lecture des cibles | title,description,operations[],dependencyRevisions[] | Proposal draft r1,s1 | nouvelle ; clé obligatoire | 409 MODULE_DISABLED ; 422 références/ops invalides | A1/TX1 ; aucun canon changé |
| PATCH Q | proposal.write | expectedProposalRevision,set:{title?,description?} | nouvelle révision draft | If-Match ; clé supportée | état terminal 409 | A1/TX1 ; approvals invalidées |
| PUT Q/operations / proposal_set_operations | proposal.write | expectedProposalRevision,operations[],dependencyRevisions[] | nouvelle révision draft | If-Match ; clé supportée | 409 PROPOSAL_CONFLICT/état terminal ; 422 kind/type | A1/TX1 ; remplace ensemble, approvals invalidées |
| POST Q/preview / proposal_preview | proposal.read | expectedProposalRevision | Preview | contenu exact ; pas de clé, lecture répétable | 412 contenu demandé obsolète | A0/TX0 ; aucun ID canonique réservé |
| POST Q/validate / proposal_validate | proposal.read | expectedProposalRevision | ValidationReport | contenu exact ; pas de clé | rapport valid=false si règles échouent ; 412 si contenu obsolète | A0/TX0 ; aucun statut modifié |
| POST Q/submit / proposal_submit | proposal.submit | expectedProposalRevision | Proposal submitted | If-Match ; clé obligatoire | 422 VALIDATION_FAILED ; 409 conflit/transition | A1/TX1 ; revalidation complète |
| POST Q/reviews | proposal.review + human | expectedProposalRevision,decision:comment ou request_changes,body | Review + Proposal | If-Match ; clé obligatoire | 409 état terminal | A1/TX1 ; in_review si submitted |
| POST Q/approve | proposal.approve + human | expectedProposalRevision,comment? | Review + Proposal approved | If-Match ; clé obligatoire | 409 conflit ; 422 invalide | A1/TX1 ; hash exact, stateVersion+1 |
| POST Q/reject | proposal.approve + human | expectedProposalRevision,reason | Review + Proposal rejected | If-Match ; clé obligatoire | 409 transition | A1/TX1 ; aucun canon changé |
| POST Q/merge | proposal.merge + narrative.write + human | expectedProposalRevision | MergeResult | If-Match ; clé obligatoire + unicité durable | 409 PROPOSAL_CONFLICT/transition ; 412 ETag obsolète | A2/TX2 ; toutes ressources ou aucune |
| GET Q / proposal_get | proposal.read | proposalId | Proposal/status/reviews | aucune précondition | 404 inaccessible | A0/TX0 |

Retrait humain : `POST Q/withdraw`, permission proposal.write et auteur ou owner/admin, body `{expectedProposalRevision,reason}`, If-Match et clé obligatoires ; A1/TX1, réponse Proposal withdrawn, 409 si état terminal. Cette route secondaire n’est pas incluse dans l’OpenAPI minimal ; aucun outil MCP de retrait n’est exposé.

Submit et approve n'utilisent pas un rapport de validate comme preuve ; ils refont les contrôles. Un draft vide peut être conservé mais ne peut être soumis. L'auteur humain doit encore disposer de proposal.write au merge ; une proposition externe dont le grant a été révoqué ne peut être fusionnée sans nouvelle préparation humaine explicite. Un résultat IA intégré reste proposable même si son exécution est terminée, mais son initiateur doit encore être autorisé.

## 17. Modèles détaillés : lecture et preview

### Lecture de scène

```http
GET /api/v1/projects/prj_demo/scenes/scn_quai
Authorization: Bearer <access-token-pour-cette-API>
```

```json
{"data":{"id":"scn_quai","projectId":"prj_demo","chapterId":"chp_08","title":"Sur le quai","revision":7,"contentFormatVersion":1,"content":{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Élise descend du train."}]}]},"references":[]}}
```

Réponse 200, `ETag: "r7"`, `Cache-Control: private,no-store`. Résolution du projet puis membership/grant, lecture par clé composite ; projet non autorisé ou scène absente donnent tous deux 404 NOT_FOUND sans currentRevision ni titre. Le serveur de production web peut utiliser cookie de session à la place du bearer proposé pour clients API.

### Preview multi-objets

```http
POST /api/v1/projects/prj_demo/proposals/prp_maladie/preview
Content-Type: application/json
```

```json
{"expectedProposalRevision":1}
```

```json
{"data":{"proposalId":"prp_maladie","proposalRevision":1,"validatedAgainst":[{"resourceType":"scene","resourceId":"scn_quai","revision":7}],"temporaryIds":{"illness":{"tempId":"illness"}},"affectedResources":[{"resourceType":"scene","resourceId":"scn_quai","change":"update"}],"diffs":[{"resourceId":"scn_quai","kind":"rich_text","beforeText":"Élise descend du train.","afterText":"Fiévreuse, Élise descend du train.","baseRevision":7}],"validationFindings":[],"conflicts":[],"valid":true}}
```

Ce modèle réduit illustre le contrat ; la fixture maladie contient l'ensemble des opérations et bases. Preview charge les snapshots de base, les têtes actuelles et les versions de modules dans un snapshot cohérent ; distingue diff de l'intention base→proposé et conflit base→courant. Aucun ID définitif, état, review ou changeSequence n'est modifié. Les diffs riches transportent des documents avant/après et un rendu sûr ; des offsets seuls ne suffisent pas. ValidationReport expose les mêmes conflits avec `valid`, `errors[]`, `warnings[]`, `validatedAgainst[]`. Un code de diagnostic n'est pas nécessairement un code d'erreur de transport.

## 18. Modèle détaillé : fusion atomique et idempotente

```http
POST /api/v1/projects/prj_demo/proposals/prp_maladie/merge
If-Match: "p1-s3"
Idempotency-Key: merge-maladie-01
Content-Type: application/json
```

```json
{"expectedProposalRevision":1}
```

Préconditions : acteur human ; owner/admin selon politique proposée ; proposition approved ; revue humaine valide du même contenu ; permission actuelle de l'auteur de proposer ; grant externe non révoqué si applicable ; projet actif ; tous les types de modules modifiés activés ; ressources et dépendances aux bonnes révisions. Une auto-approbation par owner humain du projet solo est proposée ; ce choix ne s'étend jamais à un agent.

Pseudo-protocole obligatoire, sans implémentation :

1. Authentifier et identifier projet sans fuite ; contrôler bornes requête.
2. BEGIN ; verrou Project puis autorisations, proposition et ressources dans ordre déterministe. Relire tout état après la barrière.
3. Refaire l'autorisation avant toute restitution d'idempotence. Si merge déjà exécuté sur cette proposalRevision, retourner le MergeResult durable (même si l'ancien ETag est devenu obsolète). Une autre révision terminale n'est pas fusionnable.
4. Vérifier If-Match, expectedProposalRevision, hash du contenu et reviewers encore habilités ; toute modification invalide les approvals.
5. Vérifier l'ensemble `expectedRevision` des cibles et `dependencyRevisions` des dépendances ; construire le graphe complet d'opérations ; refuser un tempId absent/dupliqué, un lien interprojets ou un champ interdit.
6. Allouer IDs définitifs des créations en mémoire/transaction, résoudre seulement les champs de référence typés ; produire l'état final ; vérifier types, schémas, cardinalités, cycles, structure et bornes.
7. Écrire TOUTES les ressources et leurs snapshots, un ChangeSet, les ChangeEvents, l'état merged et stateVersion+1, la réponse idempotente et l'outbox. Incrémenter project.changeSequence une fois ; ce compteur ne remplace pas les CAS par ressource.
8. COMMIT ; renvoyer résultat durable. Aucun fournisseur, notification, stockage objet ou réseau dans cette transaction. Livraison outbox après commit.

```json
{"data":{"proposalId":"prp_maladie","proposalRevision":1,"proposalStatus":"merged","stateVersion":4,"changeSetId":"chg_maladie","mergedAt":"2026-10-30T21:00:00Z","temporaryIds":{"illness":"evt_fievre","care_relation":"rel_soigne"},"resourceRevisions":[{"resourceType":"object","resourceId":"evt_fievre","revision":1},{"resourceType":"scene","resourceId":"scn_quai","revision":8}]}}
```

Sur erreur, ROLLBACK inclut canon, nouvelles révisions, audit de succès, changeset, outbox et état merged : rien de partiel. Un événement minimal d'échec peut être écrit hors transaction dans le journal de sécurité. Une réponse de conflit porte `effectiveStatus:conflicted` calculé ; pas de statut conflictuel écrit au milieu d'un rollback. Perte réseau après commit : retry même clé ou relecture du statut retrouve le ChangeSet ; ne jamais appliquer une deuxième fois. Timeout de lock/interblocage devient 503 TEMPORARILY_UNAVAILABLE, retryable=true ; pas de retry métier automatique sur bases obsolètes. Le client conserve sa proposition et doit réviser puis resoumettre.

## 19. Erreurs stables

```json
{"error":{"code":"PROPOSAL_CONFLICT","message":"Une ressource a changé depuis la préparation.","correlationId":"req_demo","retryable":false,"details":{"proposalId":"prp_meurtre","effectiveStatus":"conflicted","conflicts":[{"resourceType":"object","resourceId":"evt_crime","expectedRevision":4,"currentRevision":5}]}}}
```

| Code | HTTP | Reprise / sémantique |
|---|---|---|
| UNAUTHENTICATED | 401 | Réauthentifier ; challenge OAuth en MCP |
| FORBIDDEN | 403 | Ressource connue/visible mais action refusée, jamais révéler projet privé |
| NOT_FOUND | 404 | Absent ou inaccessible, corps uniforme |
| VALIDATION_FAILED | 422 | Corriger les paramètres/règles ; chemins de champs autorisés seulement |
| PRECONDITION_REQUIRED | 428 | Ajouter If-Match |
| REVISION_CONFLICT | 412 | Ressource directe ou ETag proposition obsolète ; relire avant nouvelle intention |
| PROPOSAL_CONFLICT | 409 | Bases, dépendances ou état final de proposition incompatible ; réviser |
| INVALID_STATE_TRANSITION | 409 | État courant ne permet pas la commande |
| MODULE_DISABLED | 409 | Réactiver par humain autorisé ou retirer les opérations concernées |
| IDEMPOTENCY_KEY_REUSED | 409 | Nouvelle intention exige nouvelle clé ; aucune exécution |
| RATE_LIMITED | 429 | Retry-After, limite technique |
| PROVIDER_UNAVAILABLE | 503 | Réessai explicite, canon inchangé ; coût éventuel connu/unknown |
| BUDGET_EXCEEDED | 429 | Ne pas retry sans budget disponible ; détails sans secret |
| TEMPORARILY_UNAVAILABLE | 503 | Verrou/incident transitoire ; retry borné même clé |
| INTERNAL_ERROR | 500 | correlationId seulement, pas de stack ou SQL |

## 20. Profil MCP normatif et adaptation applicative

Profil cible : MCP `2026-07-28`, JSON-RPC 2.0, POST `/mcp`, Streamable HTTP, JSON/SSE par requête ; `server/discover` et `tools/list` conformes à la version déclarée. Métadonnées `_meta.io.modelcontextprotocol/protocolVersion` et `clientCapabilities` requises ; clientInfo recommandé mais non authentifié. Headers `MCP-Protocol-Version`, `Mcp-Method`, `Mcp-Name` quand requis, comparés au corps. Pas de handshake initialize ni de session transport dans ce profil moderne. Les détails proviennent des sources S02/S03/S04 ; les documents locaux ne redéfinissent pas la norme.

```json
{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"scene_read","arguments":{"projectId":"prj_demo","sceneId":"scn_quai"},"_meta":{"io.modelcontextprotocol/protocolVersion":"2026-07-28","io.modelcontextprotocol/clientCapabilities":{},"io.modelcontextprotocol/clientInfo":{"name":"client-exemple","version":"1.0"}}}}
```

Résultat complet : `resultType:"complete"`, `structuredContent` contenant `{data:...}` conforme à outputSchema, `content` textuel sérialisant le même résultat pour clients compatibles. Erreur métier : `isError:true`, structuredContent `{error:...}` et contenu textuel sûr. Erreur d'enveloppe/outils inconnu : JSON-RPC standard ; défaut d'auth HTTP 401 avant exécution. Aucun code JSON-RPC privé n'est inventé dans les plages réservées. S05.

`mcp-tools.json` est une réponse modèle `tools/list` avec uniquement les définitions d'outils officielles. `mcp-policy.json` contient les permissions, scopes, effets, idempotence et erreurs propres à StoryMaster ; ce fichier est un format de spécification local, pas un nouveau standard MCP. `tools/list` filtre suivant l'autorisation présentée, ordre stable et cache privé lié au grant ; ce filtrage ne dispense pas de contrôler `tools/call`.

Scopage : `projects:read` permet de lister uniquement les projets du grant et encore accessibles ; `project:read` pour lectures ; `proposal:read` plus project:read pour lecture de proposition ; `proposal:write` pour création/révision, `proposal:submit` pour soumission. Les droits effectifs restent intersection droits humains, politique client, grant, projet et plafond acteur IA. Aucune entrée de catalogue approve/reject/merge ni d'écriture canonique directe. La protection s'applique aussi si l'agent appelle une URL HTTP non publiée dans son catalogue.

Resources et prompts MCP : facultatifs, non requis pour le MVP ; les tools suffisent. Si ajoutés, URI opaque et même ReadResource autorisé, jamais URL publique de manuscrit. Le statut d'une proposition est un état métier durable indépendant de toute session protocolaire. Support de clients legacy 2025-11-25 à décider après spike C ; éventuel adaptateur de compatibilité, aucun second moteur métier. Les approbations OpenAI/Claude d'un appel outil ne remplacent ni ProposalReview ni merge humain.

## 21. Alternatives, risques et questions ouvertes

Le contrat refuse JSON Patch arbitraire et offsets riches comme primitives de fusion ; alternative texte Markdown seul réduit complexité mais perd des informations éditoriales (spike A). Les délais de rétention des clés d'idempotence et versions exactes de SDK seront confirmés avant lot concerné. Les limites de payload, opérations et diff sont configurables techniques ; valeurs initiales à tester, pas un engagement commercial. Les API secondaires esquissées ne sont pas toutes dans l'OpenAPI minimal : aucun frontend de production ne doit inventer leur forme avant extension du contrat.

## Critères d'acceptation du document

Chaque opération demandée a entrée, sortie, permission, version, idempotence, erreurs, audit et transaction ; OpenAPI se valide syntaxiquement et ses références se résolvent ; catalogue MCP est machine lisible et sans outil de fusion ; les deux exemples sont conformes aux schémas ; tests HTTP/MCP partagent les mêmes oracles métier et les erreurs n'exposent aucun projet interdit.


## 21. Contrats exécutés au Lot 0 — 31 octobre 2026

Les opérations `x-lot: 0` d’[OpenAPI](spec/openapi.yaml) sont les seules implémentées : login/callback OIDC hors préfixe API ; `/me`, logout, liste/création/lecture/modification/archivage/réactivation des projets sous `/api/v1`. Sécurité session humaine uniquement ; aucune route bearer ou MCP au Lot 0. Le cookie hors local est `__Host-sm_session` ; en HTTP local seulement `sm_session_local`. Les autres opérations de ce document restent des spécifications futures.

Le DTO Project inclut description, langue, rôle courant et dates ; statut actif/archivé. La création accepte name, description et language, jamais ownerId/role/visibility client. PATCH accepte `{set:{name?,description?,language?}}`, au moins un champ. Archive/restore prennent un corps `{}` ; restore réactive avec nouvelle révision sans supprimer l’historique. `If-Match: "rN"` obligatoire pour ces trois mutations ; Idempotency-Key obligatoire à la création et aux changements de statut, facultative sur PATCH. Les mutations exigent Origin exact et X-CSRF-Token retourné par `/me` ; clés et révisions restent vérifiées dans les cas d’usage communs.

Le projet inconnu ou non autorisé produit la même erreur 404. Seuls owner/admin humains modifient les métadonnées ; tous les rôles actifs peuvent lire. Les DTO excluent le propriétaire interne, secrets et identifiants de session. Erreurs JSON normalisées avec correlationId, aucune query string/token/contenu dans les logs applicatifs. Une erreur réseau du transport Next produit 503 sans journaliser l’URL. Schémas MCP Project synchronisés, sans implémenter un serveur MCP. Exemples et tests : [scénarios Lot 0](examples/lot0-http.json), [rapport](LOT-0-REPORT.md), [ADR de mise en œuvre](adr/0009-socle-executable-lot-0.md).

## Contrats exécutés au Lot 1

Les opérations `x-lot: 1` de l’[OpenAPI](spec/openapi.yaml) sont implémentées pour une session humaine, via EditorialService : plan, création/metadata/move/archive, lecture/save de scène, historique/compare/restore, exports Markdown/JSON éditorial. Les mutations exigent CSRF et Idempotency-Key ; save/restore exigent If-Match fort `"rN"`, les autres corps portent expectedRevision et les versions structurelles nécessaires. Une réponse 412 n’est jamais un save confirmé. Le DTO d’acquittement compact est enregistré avec le snapshot et rejoué à l’identique après réponse perdue.

La comparaison HTTP retourne deux snapshots ; le diff coûteux est calculé hors chemin de frappe/sauvegarde. Scene n’expose pas de position : le plan et ses versions structurelles portent l’ordre. Le catalogue MCP reste spécifié seulement et ses définitions partagées sont synchronisées ; aucune route d’écriture IA n’est active. [Exemples synthétiques](examples/lot1-http.json), tests réels `tests/editorial-http.test.ts`, [ADR-0010](adr/0010-atelier-ecriture-et-concurrence.md).

## Extension HTTP Lot 2 — version 0.5.0

Les opérations `x-lot: 2` de [OpenAPI](spec/openapi.yaml) passent par NarrativeService/EditorialService, sans SQL dans l’adaptateur. GET/POST `/projects/{projectId}/objects`, GET/PATCH d’une fiche, detail, archive/restore, history/revision, relations et références inverses paginées ; POST/PATCH/DELETE/restore des relations ; GET modules et PATCH moduleKey ; GET timeline/search/narrative-export ; GET/PUT references d’une scène. [Exemple](examples/lot2-http.json), [registre immutable v1](spec/module-registry.v1.json), [scénarios déclaratifs](spec/lot2-scenarios.json) et [preuves réelles](LOT-2-REPORT.md).

Mutations : session humaine, Origin/CSRF et clé d’idempotence ; If-Match fort sur chaque ressource existante. Création/modification d’une relation impose les révisions de ses deux extrémités ; remplacement des références impose les révisions de l’union des anciennes/nouvelles cibles. Aucune tempId dans ces écritures directes. Une nouvelle base doit être choisie explicitement après 412. Références : metadata fermé vide en v1, max 500 associations, un seul POV. Les types d’attributs sont fermés et schemaVersion=1 obligatoire ; les évolutions futures exigent nouveau schéma et migration.

Scene.revision couvre texte, métadonnées et références. PUT references renvoie SceneSaveAck et ne modifie ni contenu, ni hash, ni wordCount. SceneRevision ajoute deux champs optionnels liés : referenceSnapshotVersion=1 et references. Leur absence signale un ancien snapshot inchangé ; une liste vide n’est pas inventée rétroactivement. Restore du texte conserve les références actuelles.

Les listes utilisent des curseurs HMAC liés à utilisateur/projet/rôle/filtres, expiration technique 15 minutes et droits relus à chaque page. Limit 1–100, défaut 20 ; statut active par défaut, archived/all explicites. Pas de compteur global. La recherche courante inclut scènes/fiches/modules off autorisés ; historique consulté séparément. Extraits texte sans HTML, bornés à 4 000 caractères, source analysée limitée aux premiers 200 000 caractères pour protéger le calcul du snippet ; l’index porte le contenu complet. Export narratif JSON v1 limité techniquement à 32 MiB, historyIncluded=false ; aucun changement de l’ancien format éditorial v1. Le catalogue de 13 outils MCP reste synchronisé sans serveur MCP implémenté.
