# Décisions humaines — GO-00, GO-01 et GO-02

**Statut :** Validées dans la portée ci-dessous le 31 octobre 2026. **Décideur :** propriétaire du projet, instruction explicite « Validation des décisions et implémentation du Lot 0 ». **Portée :** Lot 0 uniquement. **Références :** [PRD](PRD.md), [alignement](PRD-ALIGNMENT-PROPOSAL.md), [architecture](ARCHITECTURE.md), [sécurité](SECURITY-MODEL.md), [ADR](adr/README.md).

## Synthèse

L'instruction autorise un environnement fonctionnel auto-hébergé local, avec authentification réelle, projets privés et tests exécutés. Elle n'autorise ni déploiement public ni infrastructure payante ni Lot 1. Les autres décisions ouvertes ne sont pas acceptées automatiquement.

## GO-00 — Référence produit — Acceptée

Le PRD v0.1 est la référence du MVP. Le patch de sa section 19 pour huit lots est appliqué. Aucun ajout V1/V2+ et aucun identifiant supprimé. Les 150 exigences restent tracées.

### PROP-10 — Acceptée

Le patch SHOULD→MUST est appliqué par accord explicite. Le registre, la matrice et le plan utilisent MUST ; 100 MUST MVP au lieu de 99. Cette décision n'autorise pas le moteur de propositions avant Lot 4.

## GO-01 — Architecture — Acceptée avec réserve de mesure

Monolithe modulaire ; TypeScript backend/frontend ; PostgreSQL source de vérité ; mêmes services applicatifs pour futurs adaptateurs HTTP/IA/MCP/worker ; révisions optimistes, atomicité multi-objets, historique/audit et outbox pour effets externes nécessaires.

ADR-0001/0002/0006 acceptés. ADR-0003 accepté pour atomicité et concurrence : le verrou exclusif projet demeure **provisoire**, jamais une garantie de performance. Première qualification au Lot 0 sur projets ; spike B complet idéalement avant généralisation des sauvegardes du Lot 1.

Alternatives étudiées et non retenues pour le socle : services séparés, base documentaire, coordination distribuée. Les alternatives de granularité de locks restent ouvertes si les mesures justifient un réexamen.

## GO-02 — Identité, permissions et hébergement — Acceptée

- Owner unique ; rôles owner/admin/author/reviewer/reader ; matrice SECURITY-MODEL appliquée côté serveur.
- Approbation/fusion par humains autorisés ; auto-approbation d'un owner humain permise ; jamais d'approbation/fusion IA au MVP.
- Pas d'ACL par scène ; clés IA personnelles chiffrées à terme et conversations privées à initiateur, sans implémenter ces fonctions futures au Lot 0.
- OIDC Authorization Code + PKCE S256 ; Keycloak local ; sessions applicatives côté serveur ; identité par issuer/subject. L'adaptateur reste substituable.
- **Auto-hébergement Docker Compose en premier**, remplaçant la recommandation SaaS initiale. SaaS ultérieur possible ; aucune ressource publique ou payante.

ADR-0008 : principes GO-02 validés ; détails OAuth/MCP, clients et durées de grants restent proposés avant Lot 6. Pas d'acceptation automatique des ADR-0004/0005/0007 ni des autres arbitrages.

## Conséquences et éléments encore ouverts

Les droits sont centraux et aucune clé de démonstration ne doit servir à un déploiement public. Dépendances stables et compatibles vérifiées lors de réalisation ; migrations limitées aux fondations. Charge cible, rétention, exploitation publique et intégrations futures restent ouvertes. Le rapport Lot 0 doit distinguer résultats réels, limites et scénarios non exécutés.

## Critères d'acceptation du document

Décideur/date/source d'accord explicites ; deux patchs appliqués une seule fois ; 150 IDs et 100 MUST MVP ; réserve sur verrou et périmètre Lot 0 conservés ; autres décisions non acceptées par défaut.
