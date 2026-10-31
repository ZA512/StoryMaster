# Décisions humaines — GO-00..02 et réceptions des lots

**Statut :** Validées dans la portée ci-dessous le 31 octobre 2026. **Décideur :** propriétaire du projet, instruction explicite « Validation des décisions et implémentation du Lot 0 ». **Portée des GO-00..02 :** Lot 0 uniquement ; les réceptions et autorisations ultérieures sont consignées en fin de document. **Références :** [PRD](PRD.md), [alignement](PRD-ALIGNMENT-PROPOSAL.md), [architecture](ARCHITECTURE.md), [sécurité](SECURITY-MODEL.md), [ADR](adr/README.md).

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


## Réception du Lot 0 et autorisation du Spike A — 31 octobre 2026

Le propriétaire approuve la réception du Lot 0 « sous réserve du fonctionnement confirmé et des contrôles CI », par l’instruction « Réception du Lot 0 et Spike A préalable au Lot 1 ». Le dépôt est propre au départ sur `ea27725a470233882a558a6575e274b7771e7d1a` ; les quatre services locaux sont sains et la [CI de ce commit](https://github.com/ZA512/StoryMaster/actions/runs/41148886995) est terminée avec succès. Les tests du socle seront aussi rejoués pendant cette passe.

Cette réception conserve explicitement les risques et limites du [rapport Lot 0](LOT-0-REPORT.md), dont verrou projet provisoire, RLS non activée, révocation IdP non globale, exploitation publique/backups futurs et absence de qualification de charge. GO-00..02 et PROP-10 ne changent pas. Seul le prototype isolé Spike A est autorisé ; ADR-0007 demeure une décision proposée à présenter au propriétaire après mesures. Aucune fonctionnalité de production Lot 1 n’est autorisée.


## ADR-0007 acceptée et Lot 1 autorisé — 31 octobre 2026

Instruction explicite du propriétaire : « GO pour l’ADR-0007 : JSON ProseMirror versionné dans PostgreSQL, snapshots métier internes, révisions optimistes et diff riche avec fallback ». Implémentation complète du Lot 1 MVP autorisée, réception avant Lot 2. Le dépôt était propre sur `3f0134cfb90d57d295808363439b9ec085c9a768` ; [CI de ce commit](https://github.com/ZA512/StoryMaster/actions/runs/41187721831) terminée avec succès (jobs validate et spike-a). GO-00..02 et les autres statuts d’ADR ne sont pas modifiés. Les cas B-01..05 doivent mesurer des scènes réelles avant généralisation ; B-06 dépend toujours des propositions futures.

## Réception technique du Lot 1 et autorisation du Lot 2 — 31 octobre 2026

Source : instruction explicite du propriétaire « Réception du Lot 1 et implémentation du Lot 2 ». Lot 1 reçu avec toutes les réserves de son rapport : qualification locale limitée, UX non auditée manuellement de façon complète, brouillons non confirmés en mémoire de l’onglet sans récupération garantie après crash, limites techniques et exploitation publique non qualifiée. La [CI de 4c169075bd4c976a76c32c1f94cbdbe24bace790](https://github.com/ZA512/StoryMaster/actions/runs/41217270049) est terminée avec succès (`validate` et `spike-a`).

ADR-0005 accepté pour le principe relationnel hybride, propriétés typées et schémas versionnés, modules connus par projet et désactivation non destructive. Implémentation complète du Lot 2 MVP autorisée, puis réception avant Lot 3. Les autres ADR encore proposés ne sont pas acceptés par proximité. La protection des saves confirmés, la révision unique de scène et la barrière projet restent obligatoires ; aucun nouveau chemin d’écriture IA, CRDT ou moteur de propositions n’est autorisé.
