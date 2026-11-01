# Matrice des exigences et des preuves MVP — Lot 7

Référence inchangée : 150 identifiants, dont 100 MUST ciblés MVP. Cette matrice ne modifie aucune priorité ni version. « Local qualifié » décrit les campagnes exécutées sur installation locale ; il ne signifie ni réception humaine, ni conformité générale, ni capacité publique. Pour une exigence composite, les limites ci-dessous priment sur le statut. Le [rapport](LOT-7-REPORT.md) donne les commandes, résultats, mesures et réserves ; les [mesures archivées](measurements/LOT-7-QUALIFICATION.json) évitent de dépendre des journaux locaux ignorés.

Les liens de suite identifient les oracles exécutés, pas une association automatique de tous les tests à tous les IDs. Les exigences futures sont conservées afin de vérifier la correspondance exhaustive, avec statut hors périmètre. Les SHOULD/COULD non livrés restent visibles.

| ID | Priorité / cible / lot | État et limite | Preuve exécutée ou référence |
|---|---|---|---|
| OBJ-01 | MUST / MVP / 0 | **Local qualifié** — Projets multiples privés ; foundations + navigateur. | [foundations.test.ts](../tests/foundations.test.ts) |
| OBJ-02 | MUST / MVP / 3 | **Local qualifié** — Invitations/rôles/commentaires ; collaboration + navigateur. | [collaboration.test.ts](../tests/collaboration.test.ts) |
| OBJ-03 | MUST / MVP / 1 | **Local qualifié** — Capacités selon le lot ; voir précision individuelle. | [editorial.test.ts](../tests/editorial.test.ts) |
| OBJ-04 | MUST / MVP / 2 | **Local qualifié** — Trois types de fiches ; narrative + navigateur Lot 7. | [narrative.test.ts](../tests/narrative.test.ts) |
| OBJ-05 | MUST / MVP / 2 | **Local qualifié** — Références stables scènes/objets ; narrative + navigateur. | [narrative.test.ts](../tests/narrative.test.ts) |
| OBJ-06 | MUST / MVP / 2 | **Local qualifié** — Modules et désactivation non destructive ; narrative. | [narrative.test.ts](../tests/narrative.test.ts) |
| OBJ-07 | MUST / MVP / 6 | **Local qualifié, portée limitée** — MCP deux protocoles, treize outils, grants ; IA intégrée simulée seulement. | [mcp-network.test.ts](../tests/mcp-network.test.ts) |
| OBJ-08 | MUST / MVP / 4 | **Local qualifié** — proposals-atomicity/concurrency et parcours humain/MCP ; aucune fusion IA. | [proposals-atomicity.test.ts](../tests/proposals-atomicity.test.ts) |
| OBJ-09 | MUST / MVP / 1 | **Réserve** — Versions confirmées restaurées, CAS ; saisie non confirmée perdable après panne (ADR-0017). | [editorial.test.ts](../tests/editorial.test.ts) |
| OBJ-10 | SHOULD / MVP / 5 | **Différé** — Pas de moteur critique narratif qualifié ; simulateur de dialogue n’en tient pas lieu. | [Plan](IMPLEMENTATION-PLAN.md) |
| OBJ-11 | SHOULD / V1 / — | **Hors périmètre** — V1/V2+ non implémenté ; aucune preuve produit revendiquée. | [Plan](IMPLEMENTATION-PLAN.md) |
| OBJ-12 | MUST / MVP / 7 | **Local qualifié** — ZIP/JSON riche/Markdown et restauration physique distincte ; aucun réimport narratif. | [archives.test.ts](../tests/archives.test.ts) |
| MOD-01 | MUST / MVP / 2 | **Local qualifié** — Activation, dépendances, données conservées, registre fermé à trois types. | [narrative.test.ts](../tests/narrative.test.ts) |
| MOD-02 | MUST / MVP / 2 | **Local qualifié** — Activation, dépendances, données conservées, registre fermé à trois types. | [narrative.test.ts](../tests/narrative.test.ts) |
| MOD-03 | MUST / MVP / 2 | **Local qualifié** — Activation, dépendances, données conservées, registre fermé à trois types. | [narrative.test.ts](../tests/narrative.test.ts) |
| MOD-04 | MUST / MVP / 2 | **Local qualifié** — Activation, dépendances, données conservées, registre fermé à trois types. | [narrative.test.ts](../tests/narrative.test.ts) |
| MOD-05 | SHOULD / MVP / 2 | **Local qualifié** — Activation, dépendances, données conservées, registre fermé à trois types. | [narrative.test.ts](../tests/narrative.test.ts) |
| MOD-06 | SHOULD / MVP / 2 | **Local qualifié** — Activation, dépendances, données conservées, registre fermé à trois types. | [narrative.test.ts](../tests/narrative.test.ts) |
| MOD-07 | COULD / MVP / 2 | **Non livré** — Modèles par genre non implémentés. | [Plan](IMPLEMENTATION-PLAN.md) |
| PROJ-01 | MUST / MVP / 0 | **Local qualifié** — Projets privés, session et CAS ; invitations/rôles via collaboration.test.ts. | [foundations.test.ts](../tests/foundations.test.ts) |
| PROJ-02 | MUST / MVP / 0 | **Local qualifié** — Projets privés, session et CAS ; invitations/rôles via collaboration.test.ts. | [foundations.test.ts](../tests/foundations.test.ts) |
| PROJ-03 | MUST / MVP / 0 | **Local qualifié** — Projets privés, session et CAS ; invitations/rôles via collaboration.test.ts. | [foundations.test.ts](../tests/foundations.test.ts) |
| PROJ-04 | MUST / MVP / 0 | **Local qualifié** — Projets privés, session et CAS ; invitations/rôles via collaboration.test.ts. | [foundations.test.ts](../tests/foundations.test.ts) |
| PROJ-05 | MUST / MVP / 0 | **Local qualifié** — Projets privés, session et CAS ; invitations/rôles via collaboration.test.ts. | [foundations.test.ts](../tests/foundations.test.ts) |
| PROJ-06 | MUST / MVP / 3 | **Local qualifié** — Projets privés, session et CAS ; invitations/rôles via collaboration.test.ts. | [collaboration.test.ts](../tests/collaboration.test.ts) |
| PROJ-07 | MUST / MVP / 3 | **Local qualifié** — Projets privés, session et CAS ; invitations/rôles via collaboration.test.ts. | [collaboration.test.ts](../tests/collaboration.test.ts) |
| PROJ-08 | MUST / MVP / 0 | **Local qualifié** — Projets privés, session et CAS ; invitations/rôles via collaboration.test.ts. | [foundations.test.ts](../tests/foundations.test.ts) |
| PROJ-09 | MUST / MVP / 2 | **Local qualifié** — Projets privés, session et CAS ; invitations/rôles via collaboration.test.ts. | [foundations.test.ts](../tests/foundations.test.ts) |
| PROJ-10 | SHOULD / MVP / 0 | **Non livré** — Pas de modèles de projets prédéfinis ; SHOULD inchangé. | [Plan](IMPLEMENTATION-PLAN.md) |
| EDIT-01 | MUST / MVP / 1 | **Local qualifié** — Édition riche, autosave, CAS, ordre, restauration ; navigateur Lots 1/7. | [editorial.test.ts](../tests/editorial.test.ts) |
| EDIT-02 | MUST / MVP / 1 | **Local qualifié** — Édition riche, autosave, CAS, ordre, restauration ; navigateur Lots 1/7. | [editorial.test.ts](../tests/editorial.test.ts) |
| EDIT-03 | MUST / MVP / 1 | **Local qualifié** — Édition riche, autosave, CAS, ordre, restauration ; navigateur Lots 1/7. | [editorial.test.ts](../tests/editorial.test.ts) |
| EDIT-04 | MUST / MVP / 1 | **Local qualifié** — Édition riche, autosave, CAS, ordre, restauration ; navigateur Lots 1/7. | [editorial.test.ts](../tests/editorial.test.ts) |
| EDIT-05 | MUST / MVP / 1 | **Local qualifié** — Édition riche, autosave, CAS, ordre, restauration ; navigateur Lots 1/7. | [editorial.test.ts](../tests/editorial.test.ts) |
| EDIT-06 | MUST / MVP / 1 | **Local qualifié** — Édition riche, autosave, CAS, ordre, restauration ; navigateur Lots 1/7. | [editorial.test.ts](../tests/editorial.test.ts) |
| EDIT-07 | MUST / MVP / 1 | **Local qualifié** — Édition riche, autosave, CAS, ordre, restauration ; navigateur Lots 1/7. | [editorial.test.ts](../tests/editorial.test.ts) |
| EDIT-08 | MUST / MVP / 2 | **Local qualifié** — Édition riche, autosave, CAS, ordre, restauration ; navigateur Lots 1/7. | [narrative.test.ts](../tests/narrative.test.ts) |
| EDIT-09 | MUST / MVP / 3 | **Local qualifié** — Édition riche, autosave, CAS, ordre, restauration ; navigateur Lots 1/7. | [collaboration.test.ts](../tests/collaboration.test.ts) |
| EDIT-10 | SHOULD / MVP / 1 | **Local qualifié** — Édition riche, autosave, CAS, ordre, restauration ; navigateur Lots 1/7. | [editorial.test.ts](../tests/editorial.test.ts) |
| EDIT-11 | SHOULD / MVP / 1 | **Local qualifié** — Édition riche, autosave, CAS, ordre, restauration ; navigateur Lots 1/7. | [editorial.test.ts](../tests/editorial.test.ts) |
| EDIT-12 | SHOULD / MVP / 1 | **Local qualifié** — Édition riche, autosave, CAS, ordre, restauration ; navigateur Lots 1/7. | [editorial.test.ts](../tests/editorial.test.ts) |
| DATA-01 | MUST / MVP / 2 | **Local qualifié** — Fiches, relations, références, historique et chronologie simple ; HTTP/navigateur Lot 2/7. | [narrative.test.ts](../tests/narrative.test.ts) |
| DATA-02 | MUST / MVP / 2 | **Local qualifié** — Fiches, relations, références, historique et chronologie simple ; HTTP/navigateur Lot 2/7. | [narrative.test.ts](../tests/narrative.test.ts) |
| DATA-03 | MUST / MVP / 2 | **Local qualifié** — Fiches, relations, références, historique et chronologie simple ; HTTP/navigateur Lot 2/7. | [narrative.test.ts](../tests/narrative.test.ts) |
| DATA-04 | MUST / MVP / 2 | **Local qualifié** — Fiches, relations, références, historique et chronologie simple ; HTTP/navigateur Lot 2/7. | [narrative.test.ts](../tests/narrative.test.ts) |
| DATA-05 | MUST / MVP / 2 | **Local qualifié** — Fiches, relations, références, historique et chronologie simple ; HTTP/navigateur Lot 2/7. | [narrative.test.ts](../tests/narrative.test.ts) |
| DATA-06 | MUST / MVP / 2 | **Local qualifié** — Fiches, relations, références, historique et chronologie simple ; HTTP/navigateur Lot 2/7. | [narrative.test.ts](../tests/narrative.test.ts) |
| DATA-07 | MUST / MVP / 2 | **Local qualifié** — Fiches, relations, références, historique et chronologie simple ; HTTP/navigateur Lot 2/7. | [narrative.test.ts](../tests/narrative.test.ts) |
| DATA-08 | MUST / MVP / 2 | **Local qualifié** — Fiches, relations, références, historique et chronologie simple ; HTTP/navigateur Lot 2/7. | [narrative.test.ts](../tests/narrative.test.ts) |
| DATA-09 | MUST / MVP / 2 | **Local qualifié** — Fiches, relations, références, historique et chronologie simple ; HTTP/navigateur Lot 2/7. | [narrative.test.ts](../tests/narrative.test.ts) |
| DATA-10 | SHOULD / MVP / 2 | **Local qualifié** — Fiches, relations, références, historique et chronologie simple ; HTTP/navigateur Lot 2/7. | [narrative.test.ts](../tests/narrative.test.ts) |
| DATA-11 | MUST / MVP / 2 | **Local qualifié** — Fiches, relations, références, historique et chronologie simple ; HTTP/navigateur Lot 2/7. | [narrative.test.ts](../tests/narrative.test.ts) |
| DATA-12 | MUST / V1 / — | **Hors périmètre** — V1/V2+ non implémenté ; aucune preuve produit revendiquée. | [Plan](IMPLEMENTATION-PLAN.md) |
| SEARCH-01 | MUST / MVP / 2 | **Local qualifié** — Recherche textuelle filtrée et permissions, ouverture/références dans le navigateur. | [narrative.test.ts](../tests/narrative.test.ts) |
| SEARCH-02 | MUST / MVP / 2 | **Local qualifié** — Recherche textuelle filtrée et permissions, ouverture/références dans le navigateur. | [narrative.test.ts](../tests/narrative.test.ts) |
| SEARCH-03 | MUST / MVP / 2 | **Local qualifié** — Recherche textuelle filtrée et permissions, ouverture/références dans le navigateur. | [narrative.test.ts](../tests/narrative.test.ts) |
| SEARCH-04 | MUST / MVP / 2 | **Local qualifié** — Recherche textuelle filtrée et permissions, ouverture/références dans le navigateur. | [narrative.test.ts](../tests/narrative.test.ts) |
| SEARCH-05 | SHOULD / MVP / 2 | **Local qualifié** — Recherche textuelle filtrée et permissions, ouverture/références dans le navigateur. | [narrative.test.ts](../tests/narrative.test.ts) |
| SEARCH-06 | — / V1 / — | **Hors périmètre** — V1/V2+ non implémenté ; aucune preuve produit revendiquée. | [Plan](IMPLEMENTATION-PLAN.md) |
| EXPORT-01 | MUST / MVP / 1 | **Local qualifié** — ZIP réel, 28 familles, rich JSON/Markdown/manifeste/hashes, droits et cohérence ; archives-http.test.ts et navigateur Lot 7. | [archives.test.ts](../tests/archives.test.ts) |
| EXPORT-02 | MUST / MVP / 7 | **Local qualifié** — ZIP réel, 28 familles, rich JSON/Markdown/manifeste/hashes, droits et cohérence ; archives-http.test.ts et navigateur Lot 7. | [archives.test.ts](../tests/archives.test.ts) |
| EXPORT-03 | MUST / MVP / 7 | **Local qualifié** — ZIP réel, 28 familles, rich JSON/Markdown/manifeste/hashes, droits et cohérence ; archives-http.test.ts et navigateur Lot 7. | [archives.test.ts](../tests/archives.test.ts) |
| EXPORT-04 | MUST / MVP / 7 | **Local qualifié** — ZIP réel, 28 familles, rich JSON/Markdown/manifeste/hashes, droits et cohérence ; archives-http.test.ts et navigateur Lot 7. | [archives.test.ts](../tests/archives.test.ts) |
| EXPORT-05 | — / V1 / — | **Hors périmètre** — V1/V2+ non implémenté ; aucune preuve produit revendiquée. | [Plan](IMPLEMENTATION-PLAN.md) |
| EXPORT-06 | — / V1 / — | **Hors périmètre** — V1/V2+ non implémenté ; aucune preuve produit revendiquée. | [Plan](IMPLEMENTATION-PLAN.md) |
| COLLAB-01 | MUST / MVP / 3 | **Local qualifié** — Rôles, attribution, commentaires/ancrages et courses PostgreSQL ; navigateur Lot 3. | [collaboration.test.ts](../tests/collaboration.test.ts) |
| COLLAB-02 | MUST / MVP / 3 | **Local qualifié** — Rôles, attribution, commentaires/ancrages et courses PostgreSQL ; navigateur Lot 3. | [collaboration.test.ts](../tests/collaboration.test.ts) |
| COLLAB-03 | MUST / MVP / 1 | **Local qualifié** — Autosave CAS et conflits visibles ; autosave/editorial + navigateur, sans CRDT. | [autosave.test.ts](../tests/autosave.test.ts) |
| COLLAB-04 | MUST / MVP / 3 | **Local qualifié** — Rôles, attribution, commentaires/ancrages et courses PostgreSQL ; navigateur Lot 3. | [collaboration.test.ts](../tests/collaboration.test.ts) |
| COLLAB-05 | MUST / MVP / 0 | **Local qualifié** — Contrôles communs HTTP/MCP, grants et acteurs IA plafonnés ; mcp-network/concurrency. | [mcp-network.test.ts](../tests/mcp-network.test.ts) |
| COLLAB-06 | — / V1 / — | **Hors périmètre** — V1/V2+ non implémenté ; aucune preuve produit revendiquée. | [Plan](IMPLEMENTATION-PLAN.md) |
| COLLAB-07 | — / V1 / — | **Hors périmètre** — V1/V2+ non implémenté ; aucune preuve produit revendiquée. | [Plan](IMPLEMENTATION-PLAN.md) |
| COLLAB-08 | SHOULD / MVP / 3 | **Non livré** — Actualisation des vues disponible ; aucune notification ciblée livrée. | [Plan](IMPLEMENTATION-PLAN.md) |
| AI-01 | MUST / MVP / 5 | **Phase A locale seulement** — Phase A : simulateurs sans transport fournisseur ; confidentialité, sources, provenance et propositions humaines. | [ai-security.test.ts](../tests/ai-security.test.ts) |
| AI-02 | MUST / MVP / 5 | **Phase B différée** — Choix de modèles simulés seulement ; GO-03 commercial ouvert. | [ai-security.test.ts](../tests/ai-security.test.ts) |
| AI-03 | MUST / MVP / 5 | **Phase B différée** — Envelope chiffrée/déchiffrement de credential fictive éprouvés ; fournisseur réel non connecté. | [ai-security.test.ts](../tests/ai-security.test.ts) |
| AI-04 | MUST / MVP / 5 | **Phase A locale seulement** — Phase A : simulateurs sans transport fournisseur ; confidentialité, sources, provenance et propositions humaines. | [ai-security.test.ts](../tests/ai-security.test.ts) |
| AI-05 | MUST / MVP / 5 | **Phase A locale seulement** — Phase A : simulateurs sans transport fournisseur ; confidentialité, sources, provenance et propositions humaines. | [ai-security.test.ts](../tests/ai-security.test.ts) |
| AI-06 | MUST / MVP / 5 | **Phase A locale seulement** — Phase A : simulateurs sans transport fournisseur ; confidentialité, sources, provenance et propositions humaines. | [ai-security.test.ts](../tests/ai-security.test.ts) |
| AI-07 | MUST / MVP / 6 | **Phase A locale seulement** — Phase A : simulateurs sans transport fournisseur ; confidentialité, sources, provenance et propositions humaines. | [ai-security.test.ts](../tests/ai-security.test.ts) |
| AI-08 | MUST / MVP / 6 | **Phase A locale seulement** — Phase A : simulateurs sans transport fournisseur ; confidentialité, sources, provenance et propositions humaines. | [ai-security.test.ts](../tests/ai-security.test.ts) |
| AI-09 | MUST / MVP / 5 | **Phase A locale seulement** — Phase A : simulateurs sans transport fournisseur ; confidentialité, sources, provenance et propositions humaines. | [ai-security.test.ts](../tests/ai-security.test.ts) |
| AI-10 | MUST / MVP / 5 | **Phase A locale seulement** — Phase A : simulateurs sans transport fournisseur ; confidentialité, sources, provenance et propositions humaines. | [ai-security.test.ts](../tests/ai-security.test.ts) |
| AI-11 | MUST / MVP / 5 | **Phase A locale seulement** — Phase A : simulateurs sans transport fournisseur ; confidentialité, sources, provenance et propositions humaines. | [ai-security.test.ts](../tests/ai-security.test.ts) |
| AI-12 | SHOULD / MVP / 5 | **Phase A locale seulement** — Phase A : simulateurs sans transport fournisseur ; confidentialité, sources, provenance et propositions humaines. | [ai-security.test.ts](../tests/ai-security.test.ts) |
| AI-13 | SHOULD / MVP / 5 | **Phase A locale seulement** — Phase A : simulateurs sans transport fournisseur ; confidentialité, sources, provenance et propositions humaines. | [ai-security.test.ts](../tests/ai-security.test.ts) |
| AI-14 | SHOULD / MVP / 5 | **Phase A locale seulement** — Phase A : simulateurs sans transport fournisseur ; confidentialité, sources, provenance et propositions humaines. | [ai-security.test.ts](../tests/ai-security.test.ts) |
| AI-SEC-01 | MUST / MVP / 5 | **Phase A locale seulement** — Phase A simulée et MCP local ; aucun appel fournisseur tiers réel qualifié. | [ai-security.test.ts](../tests/ai-security.test.ts) |
| AI-SEC-02 | MUST / MVP / 6 | **Phase A locale seulement** — Phase A simulée et MCP local ; aucun appel fournisseur tiers réel qualifié. | [ai-security.test.ts](../tests/ai-security.test.ts) |
| AI-SEC-03 | MUST / MVP / 5 | **Phase A locale seulement** — Phase A simulée et MCP local ; aucun appel fournisseur tiers réel qualifié. | [ai-security.test.ts](../tests/ai-security.test.ts) |
| AI-SEC-04 | MUST / MVP / 5 | **Qualification partielle** — Budgets, limites, interruptions et audit simulés ; aucun appel fournisseur réel autorisé. | [ai-security.test.ts](../tests/ai-security.test.ts) |
| AI-SEC-05 | MUST / MVP / 5 | **Qualification partielle** — Périmètre/consentement affichés en simulation ; transfert tiers réel non autorisé. | [ai-security.test.ts](../tests/ai-security.test.ts) |
| PROP-01 | MUST / MVP / 4 | **Local qualifié** — Révisions immuables/approvals invalidés, revue et fusion atomique ; atomicity/concurrency/HTTP/navigateur Lot 4. | [proposals.test.ts](../tests/proposals.test.ts) |
| PROP-02 | MUST / MVP / 4 | **Local qualifié** — Révisions immuables/approvals invalidés, revue et fusion atomique ; atomicity/concurrency/HTTP/navigateur Lot 4. | [proposals.test.ts](../tests/proposals.test.ts) |
| PROP-03 | MUST / MVP / 4 | **Local qualifié** — Révisions immuables/approvals invalidés, revue et fusion atomique ; atomicity/concurrency/HTTP/navigateur Lot 4. | [proposals.test.ts](../tests/proposals.test.ts) |
| PROP-04 | MUST / MVP / 4 | **Local qualifié** — Révisions immuables/approvals invalidés, revue et fusion atomique ; atomicity/concurrency/HTTP/navigateur Lot 4. | [proposals.test.ts](../tests/proposals.test.ts) |
| PROP-05 | MUST / MVP / 4 | **Local qualifié** — Révisions immuables/approvals invalidés, revue et fusion atomique ; atomicity/concurrency/HTTP/navigateur Lot 4. | [proposals.test.ts](../tests/proposals.test.ts) |
| PROP-06 | MUST / MVP / 4 | **Local qualifié** — Révisions immuables/approvals invalidés, revue et fusion atomique ; atomicity/concurrency/HTTP/navigateur Lot 4. | [proposals.test.ts](../tests/proposals.test.ts) |
| PROP-07 | MUST / MVP / 4 | **Local qualifié** — Révisions immuables/approvals invalidés, revue et fusion atomique ; atomicity/concurrency/HTTP/navigateur Lot 4. | [proposals.test.ts](../tests/proposals.test.ts) |
| PROP-08 | MUST / MVP / 4 | **Local qualifié** — Révisions immuables/approvals invalidés, revue et fusion atomique ; atomicity/concurrency/HTTP/navigateur Lot 4. | [proposals.test.ts](../tests/proposals.test.ts) |
| PROP-09 | MUST / MVP / 4 | **Local qualifié** — Révisions immuables/approvals invalidés, revue et fusion atomique ; atomicity/concurrency/HTTP/navigateur Lot 4. | [proposals.test.ts](../tests/proposals.test.ts) |
| PROP-10 | MUST / MVP / 4 | **Local qualifié** — Révisions immuables/approvals invalidés, revue et fusion atomique ; atomicity/concurrency/HTTP/navigateur Lot 4. | [proposals.test.ts](../tests/proposals.test.ts) |
| PROP-11 | SHOULD / MVP / 4 | **Local qualifié** — Révisions immuables/approvals invalidés, revue et fusion atomique ; atomicity/concurrency/HTTP/navigateur Lot 4. | [proposals.test.ts](../tests/proposals.test.ts) |
| PROP-12 | SHOULD / V1 / — | **Hors périmètre** — V1/V2+ non implémenté ; aucune preuve produit revendiquée. | [Plan](IMPLEMENTATION-PLAN.md) |
| PROP-13 | — / V2+ / — | **Hors périmètre** — V1/V2+ non implémenté ; aucune preuve produit revendiquée. | [Plan](IMPLEMENTATION-PLAN.md) |
| PROP-14 | — / V2+ / — | **Hors périmètre** — V1/V2+ non implémenté ; aucune preuve produit revendiquée. | [Plan](IMPLEMENTATION-PLAN.md) |
| CRIT-01 | MUST / V1 / — | **Hors périmètre** — V1/V2+ non implémenté ; aucune preuve produit revendiquée. | [Plan](IMPLEMENTATION-PLAN.md) |
| CRIT-02 | MUST / V1 / — | **Hors périmètre** — V1/V2+ non implémenté ; aucune preuve produit revendiquée. | [Plan](IMPLEMENTATION-PLAN.md) |
| CRIT-03 | MUST / V1 / — | **Hors périmètre** — V1/V2+ non implémenté ; aucune preuve produit revendiquée. | [Plan](IMPLEMENTATION-PLAN.md) |
| CRIT-04 | MUST / V1 / — | **Hors périmètre** — V1/V2+ non implémenté ; aucune preuve produit revendiquée. | [Plan](IMPLEMENTATION-PLAN.md) |
| CRIT-05 | MUST / V1 / — | **Hors périmètre** — V1/V2+ non implémenté ; aucune preuve produit revendiquée. | [Plan](IMPLEMENTATION-PLAN.md) |
| CRIT-06 | SHOULD / V1 / — | **Hors périmètre** — V1/V2+ non implémenté ; aucune preuve produit revendiquée. | [Plan](IMPLEMENTATION-PLAN.md) |
| CRIT-07 | SHOULD / V1 / — | **Hors périmètre** — V1/V2+ non implémenté ; aucune preuve produit revendiquée. | [Plan](IMPLEMENTATION-PLAN.md) |
| CRIT-08 | SHOULD / V1 / — | **Hors périmètre** — V1/V2+ non implémenté ; aucune preuve produit revendiquée. | [Plan](IMPLEMENTATION-PLAN.md) |
| UX-01 | MUST / MVP / 1 | **Local qualifié** — Tableau projet → atelier/scène ; navigateur Lot 1/7, ergonomie humaine à apprécier. | [e2e/lot7.spec.ts](../tests/e2e/lot7.spec.ts) |
| UX-02 | MUST / MVP / 1 | **Local qualifié** — États confirmé/en cours/erreur et retry ; autosave + navigateur Lot 1. | [e2e/lot7.spec.ts](../tests/e2e/lot7.spec.ts) |
| UX-03 | MUST / MVP / 1 | **Local qualifié** — Échecs visibles et conflit CAS ; navigateur/autosave. | [e2e/lot7.spec.ts](../tests/e2e/lot7.spec.ts) |
| UX-04 | MUST / MVP / 2 | **Local qualifié** — Références de fiches et ouverture ; navigateur Lot 2/7. | [e2e/lot7.spec.ts](../tests/e2e/lot7.spec.ts) |
| UX-05 | MUST / MVP / 1 | **Local qualifié** — Confirmations explicites et suppression logique ; navigateur/editorial. | [e2e/lot7.spec.ts](../tests/e2e/lot7.spec.ts) |
| UX-06 | MUST / MVP / 7 | **Qualification partielle** — Parcours essentiels navigateur/clavier et contrôles Axe ciblés ; pas de conformité WCAG exhaustive. | [e2e/lot7.spec.ts](../tests/e2e/lot7.spec.ts) |
| UX-07 | SHOULD / MVP / 7 | **Local qualifié** — Clair/sombre/système, persistance de préférences par utilisateur ; navigateur Lot 7. | [e2e/lot7.spec.ts](../tests/e2e/lot7.spec.ts) |
| UX-08 | SHOULD / MVP / 1 | **Local qualifié** — Mode concentration existant ; aucune relation avec la réserve de brouillons. | [e2e/lot7.spec.ts](../tests/e2e/lot7.spec.ts) |
| UX-09 | SHOULD / MVP / 7 | **Local qualifié, portée limitée** — Taille du texte et raccourci facultatif Alt+Maj+E/W vers atelier ; pas d’éditeur général de raccourcis. | [e2e/lot7.spec.ts](../tests/e2e/lot7.spec.ts) |
| UX-10 | SHOULD / MVP / 7 | **Préparé partiellement** — Catalogue français typé des exports et dates ; extraction générale/traductions futures non livrées. | [e2e/lot7.spec.ts](../tests/e2e/lot7.spec.ts) |
| SEC-01 | MUST / MVP / 0 | **Local qualifié** — Permissions et isolement serveur ; suites HTTP/AI/MCP/archives et régression de sécurité Lot 7. | [foundations.test.ts](../tests/foundations.test.ts) |
| SEC-02 | MUST / MVP / 0 | **Local qualifié** — Permissions et isolement serveur ; suites HTTP/AI/MCP/archives et régression de sécurité Lot 7. | [foundations.test.ts](../tests/foundations.test.ts) |
| SEC-03 | MUST / MVP / 0 | **Local qualifié** — Permissions et isolement serveur ; suites HTTP/AI/MCP/archives et régression de sécurité Lot 7. | [foundations.test.ts](../tests/foundations.test.ts) |
| SEC-04 | MUST / MVP / 0 | **Local qualifié** — Permissions et isolement serveur ; suites HTTP/AI/MCP/archives et régression de sécurité Lot 7. | [foundations.test.ts](../tests/foundations.test.ts) |
| SEC-05 | MUST / MVP / 0 | **Local qualifié, réserve IdP** — Révocation applicative et témoin externe/restauration ; aucune irrévocabilité globale IdP revendiquée. | [installation-recovery.test.ts](../tests/installation-recovery.test.ts) |
| SEC-06 | SHOULD / MVP / 0 | **Non qualifié** — MFA possible dans Keycloak mais parcours/configuration non qualifiés ici. | [Plan](IMPLEMENTATION-PLAN.md) |
| SEC-07 | MUST / MVP / 7 | **NON SATISFAIT — MUST** — HTTP loopback et réseau PostgreSQL privé sans TLS complet ; décision GO-04 explicite requise. Aucune baisse de priorité. | [foundations.test.ts](../tests/foundations.test.ts) |
| SEC-08 | MUST / MVP / 5 | **Local qualifié, portée limitée** — Secrets chiffrés au repos et clé séparée ; credential fictive restaurée, aucun secret fournisseur réel. | [installation-recovery.test.ts](../tests/installation-recovery.test.ts) |
| SEC-09 | MUST / MVP / 0 | **Local qualifié** — Permissions et isolement serveur ; suites HTTP/AI/MCP/archives et régression de sécurité Lot 7. | [foundations.test.ts](../tests/foundations.test.ts) |
| SEC-10 | MUST / MVP / 0 | **Local qualifié** — Permissions et isolement serveur ; suites HTTP/AI/MCP/archives et régression de sécurité Lot 7. | [foundations.test.ts](../tests/foundations.test.ts) |
| SEC-11 | MUST / MVP / 7 | **Local qualifié** — Backup physique chiffré, pg_verifybackup et vrai démarrage isolé ; installation-recovery + backup-crypto. | [installation-recovery.test.ts](../tests/installation-recovery.test.ts) |
| SEC-12 | MUST / MVP / 0 | **Local qualifié** — Permissions et isolement serveur ; suites HTTP/AI/MCP/archives et régression de sécurité Lot 7. | [foundations.test.ts](../tests/foundations.test.ts) |
| SEC-13 | MUST / MVP / 1 | **Local qualifié** — Permissions et isolement serveur ; suites HTTP/AI/MCP/archives et régression de sécurité Lot 7. | [editor-document.test.ts](../tests/editor-document.test.ts) |
| SEC-14 | MUST / MVP / 6 | **Local qualifié** — Admission IP avant OAuth, huit authentifications simultanées, limites API/MCP ; http-admission/mcp-network. | [http-admission.test.ts](../tests/http-admission.test.ts) |
| NFR-01 | objectif NFR / MVP / 1 | **Local qualifié, réserve saisie** — Atomicité/CAS pour confirmé ; brouillons non confirmés en mémoire uniquement. | [autosave.test.ts](../tests/autosave.test.ts) |
| NFR-02 | objectif NFR / MVP / 7 | **Mesuré localement** — 120 lectures : p95 111,669 ms, p99 144,482 ms ; services + vraie PG, pas SLA HTTP/public. | [archives.test.ts](../tests/archives.test.ts) |
| NFR-03 | objectif NFR / MVP / 7 | **Mesuré localement** — 10 000 objets, 120 recherches : p95 309,176 ms, p99 440,711 ms ; pas SLA public. | [archives.test.ts](../tests/archives.test.ts) |
| NFR-04 | objectif NFR / MVP / 1 | **Qualification partielle** — Retour visible autosave testé ; cible 2 s non garantie sous toute charge/panne. | [autosave.test.ts](../tests/autosave.test.ts) |
| NFR-05 | objectif NFR / MVP / 7 | **Réserve GO-04** — Ordonnanceur livré désactivé, aperçu exécuté ; restauration réelle réussie, automatisation non activée. | [installation-recovery.test.ts](../tests/installation-recovery.test.ts) |
| NFR-06 | objectif NFR / MVP / 7 | **Non qualifié** — Disponibilité 99,5 % de production non mesurée ; aucun SLA déduit. | [Plan](IMPLEMENTATION-PLAN.md) |
| NFR-07 | objectif NFR / MVP / 7 | **Local qualifié, portée précisée** — 28 familles essentielles ; auteur limité à son historique de commentaires, manifeste access explicite ; archive complète projet par owner/admin. | [archives.test.ts](../tests/archives.test.ts) |
| NFR-08 | objectif NFR / MVP / 7 | **Qualification partielle** — Axe et clavier/mobile ciblés ; lecteur d’écran et audit WCAG 2.2 AA humain restent nécessaires. | [archives.test.ts](../tests/archives.test.ts) |
| NFR-09 | objectif NFR / MVP / 0 | **Local qualifié** — Health/logs techniques sans contenu ; pas de télémétrie de manuscrit ; tests de redaction. | [archives.test.ts](../tests/archives.test.ts) |
| NFR-10 | objectif NFR / MVP / 0 | **Local qualifié** — Suites métier/permissions PostgreSQL, HTTP, navigateur ; liste exacte dans le rapport. | [archives.test.ts](../tests/archives.test.ts) |
| NFR-11 | objectif NFR / MVP / 2 | **Qualification partielle** — Registre déclaratif validé à trois types et modules ; pas de plugins/arbitraire à chaud. | [narrative.test.ts](../tests/narrative.test.ts) |
| NFR-12 | objectif NFR / MVP / 6 | **Local qualifié** — OpenAPI et 13 outils MCP ; deux versions de protocole qualifiées sans LLM. | [mcp-network.test.ts](../tests/mcp-network.test.ts) |

## Conditions de réception

Le MUST SEC-07 non satisfait empêche d’annoncer les 100 MUST MVP comme tous réalisés. Les réserves IA commerciale, brouillons non confirmés, RLS, IdP global, R-CONT-01, automatisation/rétention et disponibilité restent explicitement ouvertes. [GO-04](GO-04-DECISION-PROPOSAL.md) prépare les décisions ; GO-03 n’est pas accepté.

## Critères d'acceptation du document

Les 150 IDs apparaissent exactement une fois, avec priorités/cibles/lots identiques au registre. Chaque succès est limité à sa preuve, les fonctionnalités futures et différées sont visibles, aucun chiffre de décompte ne remplace un oracle métier.
