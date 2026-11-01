# ADR-0014 — Assistant intégré, contexte consenti et exécutions bornées

**Statut :** mise en œuvre phase A du Lot 5 autorisée ; réception et GO-03 attendus. **Date :** 1er novembre 2026. **Références :** [GO-03 proposé](../GO-03-DECISION-PROPOSAL.md), [ADR-0002](0002-api-metier-unique-et-mcp.md), [ADR-0008](0008-identite-delegation-et-politiques.md), [ADR-0013](0013-moteur-de-propositions-et-fusion.md).

## Décision et alternatives

Module applicatif IA dans le monolithe, ports PostgreSQL et chiffrement enveloppe ; orchestrateur indépendant de HTTP. Simulateur local seul avant GO-03, aucun adaptateur réel ou URL libre. ProviderAdapter déclare capacités, usage et limites ; aucune équivalence universelle des fournisseurs promise. Alternative chatbot séparé/second moteur de propositions rejetée, comme accès SQL narratif par un outil ou impersonation humaine de l’IA.

AIConversation privée par initiateur ET membership courant ; messages/sources/exécutions restent privés. L’inventaire de contexte est sélectionné par les services de lecture existants, avec raisons, révisions/hash et plafonds. Consentement lié à son contenu et sa configuration ; les outils ne lisent que ce périmètre. Réponses générées distinguées des sources canoniques, aucun lien source inventé accepté. Pas de transcript dans un export narratif ou une proposition.

Actor integrated_ai constitué par le serveur pour une exécution, lié à utilisateur/session/projet/configuration et capacité secrète d’exécution. Vérification persistante à chaque lecture/préparation ; le simple actorType ne suffit pas. Plafond : lecture et ses propositions uniquement ; jamais canon, administration, avis humains ou merge. ProposalService commun conservé, provenance de l’exécution immuable. L’humain initiateur ne contourne pas la règle d’auto-approbation par l’origine IA : comparaison de son identité humaine, owner individuel seulement. Une proposition déjà publiée reste une intention consultable et révisable par les humains ; merge recontrôle rôle actuel de l’initiateur et provenance, pas la survie d’une boucle IA terminée.

## Transactions, révocation et résilience

Transactions courtes pour admission, budget, messages/sources, appels d’outils et publication ; aucun await réseau fournisseur sous transaction métier. Autorisation d’envoi persistée avant appel ; après cette admission, un appel engagé ne peut être effacé à distance. Contrôle frais avant chaque nouvelle étape et annulation best-effort pendant attente. Révocation de session/membership/consentement/configuration bloque toute nouvelle étape ou publication. Rotation/retrait de credential invalide les exécutions liées à l’ancienne version.

Queue PostgreSQL durable, claim exclusif et bail ; pas de reprise automatique d’un appel running après crash. Bail expiré ou réponse d’envoi inconnue → unknown, réservation prudente conservée et reprise explicite en nouvelle intention. Clés idempotentes pour demandes et outils ; publication d’une proposition et enregistrement de son résultat dans la même transaction. Aucun effet canonique à compenser.

Budget réservé atomiquement, limites par exécution et concurrence contrôlées ; usage connu distinct d’estimation/coût inconnu. Erreur certaine avant envoi libère la réservation, après envoi sans usage confirmé ne suppose jamais zéro. Annulation ne garantit pas absence de dépense. Les montants des simulateurs sont des fixtures ; tarifs réels et rétention restent soumis à GO-03.

Credentials BYOK enveloppe AES-256-GCM, AAD liée au propriétaire/configuration/fournisseur, clé de protection versionnée hors base. DTOs sans secret, déchiffrement réservé à l’admission fournisseur, rotation et révocation préconditionnées. Serveur compromis et récupération des anciennes clés de sauvegarde restent des risques d’exploitation.

## Conséquences et qualification

Plus de métadonnées et d’étapes explicites, mais aucune dépendance distribuée ou réseau tiers nouvelle en phase A. La frontière projet reste commune ; captures et lectures bornées peuvent attendre les mutations, R-CONT-01 conservé. Tests PostgreSQL vrais sur confidentialité, budgets parallèles, révocation/annulation/pannes et publication ; navigateur avec sessions Keycloak réelles et fournisseur simulé. Aucun succès simulé ne qualifie une intégration réelle ou une protection absolue contre prompt injection.

## Critères d'acceptation du document

Provenance serveur, outils bornés et moteur commun identifiables ; absence de secret dans contexte/log/DTO ; transactions sans appel réseau ; budgets et unknown prudents ; simulation réelle distincte ; arrêt GO-03 puis avant Lot 6 sans accord implicite.
