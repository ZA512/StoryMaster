# Consignes du dépôt StoryMaster

## Portée et documents à lire

Avant toute modification, lire dans cet ordre `docs/PRD.md`, `docs/deep-research-analyse-fonction.md`, `docs/deep-research-modele-fonctionnel.md`, puis `docs/DOCUMENT-AUDIT.md` et `docs/RESEARCH-TRACEABILITY.md`. Pour le domaine concerné lire `docs/DOMAIN-MODEL.md`, `docs/ARCHITECTURE.md`, `docs/API-CONTRACTS.md`, `docs/SECURITY-MODEL.md`, `docs/IMPLEMENTATION-PLAN.md`, `docs/CONTRACT-TESTS.md`, les artefacts `docs/spec/` et les ADR applicables.

Le PRD prime sur les recherches pour le produit, sous réserve d'une instruction utilisateur explicite qui le modifie. Aucun document ni ADR n’est accepté par sa seule présence. Le propriétaire a validé GO-00..02 et PROP-10 MUST le 31 octobre 2026, avec portée indiquée dans HUMAN-DECISIONS.md. Le propriétaire a approuvé la réception du Lot 0 sous réserve du fonctionnement et de la CI, vérifiée verte sur ea27725 le 31 octobre 2026. Le propriétaire accepte explicitement ADR-0007 et autorise l’implémentation complète du Lot 1 MVP le 31 octobre 2026. Le propriétaire réceptionne techniquement le Lot 1 avec ses réserves documentées et accepte le principe ADR-0005 ; le Lot 2 est autorisé après CI verte de 4c16907, vérifiée le 31 octobre 2026. Le propriétaire reçoit techniquement le Lot 2 avec les réserves de sa mission du 31 octobre 2026 et autorise le Lot 3 ; CI verte de 6a58641 vérifiée. Le propriétaire reçoit techniquement le Lot 3 avec ses réserves, accepte les principes ADR-0012 et autorise le Lot 4 par instruction distincte ; clôture définitive du Lot 3 conditionnée à CI verte de 41762fb. Le propriétaire reçoit techniquement le Lot 4 avec réserves, accepte les principes ADR-0013 et autorise la phase A sécurisée du Lot 5 ; CI verte de 9c2df0b vérifiée le 1er novembre 2026. GO-03 reste non validé : simulateurs et clés fictives uniquement, aucun fournisseur réel, transfert narratif externe ou appel facturable avant accord explicite. Arrêt à GO-03 puis avant Lot 6 ; Yjs reste isolé hors production.

## Périmètre et décisions

Respecter MVP / V1 / V2+ ; coédition CRDT, faits/croyances/lecteur et recherche sémantique sont V1, branches/retcons/plugins/multi-agents avancés V2+. Ne jamais modifier silencieusement une exigence. Documenter divergence, source, options et recommandation dans l'audit/traçabilité et un ADR pour tout impact durable. Pas de calendrier ni quotas commerciaux inventés.

En cas d'ambiguïté, progresser sur le travail indépendant, consigner l'hypothèse et ses conséquences ; ne pas figer une décision produit durable sans validation explicite au jalon indiqué dans le plan. Les invariants déjà imposés ne requièrent pas de nouvelle validation à chaque modification.

## Architecture et sécurité

Une API métier unique : web, assistant intégré, MCP et worker appellent les mêmes cas d'usage. Aucun adaptateur/agent ne possède un accès DB narratif privilégié. Le projet est frontière de sécurité, privé par défaut ; contrôles serveur sur lecture, écriture, recherche, extraits, historique, export, IA, jobs et MCP. Refus par défaut ; identifiants opaques jamais une preuve d'autorisation ; pas de référence interprojets MVP.

Les grants sont limités par humain/client/projet/scopes et plafond IA ; identité serveur distincte du clientInfo autodéclaré. IA : lecture ou proposition uniquement au MVP, aucune approbation/fusion ni écriture canonique directe, y compris via une route HTTP. Contenu narratif et sorties LLM non fiables ; aucun secret dans contexte, logs, export ou navigateur ; minimiser les transferts et informer l'utilisateur.

## Données, concurrence et historique

IDs stables ; toutes mutations importantes révisionnées et auditées. If-Match/expectedRevision obligatoires ; aucun écrasement silencieux. Les écritures respectent la barrière projet et l'ordre de verrous documentés. Une proposition a un contenu immuable par proposalRevision et un stateVersion distinct ; toute modification du contenu invalide approvals. Merge atomique : ressources, snapshots, ChangeSet, audit et outbox dans une transaction, effets externes après commit, idempotence durable par proposition. Restore crée une nouvelle révision. Désactivation module non destructive.

## Travail incrémental et vérification

Implémenter uniquement le lot autorisé après validation de ses prérequis. Ne pas introduire des fonctions futures par commodité technique. Avant changement de contrat, mettre à jour schémas, exemples, tests déclaratifs et ADR concernés ensemble. Vérifier JSON/YAML/OpenAPI et liens ; lors d'une future implémentation, exécuter tests de permissions, concurrence et transactions sur vraie PostgreSQL pour les invariants critiques, puis tests du lot. Ne jamais présenter des spécifications de tests comme des tests produit exécutés.

## Critères d'acceptation du document

Les contributeurs peuvent identifier sources prioritaires, périmètre, invariants, procédure d'ambiguïté et tests nécessaires sans inventer un nouveau chemin d'autorisation. Toute modification significative de ces consignes est expliquée dans l'audit.
