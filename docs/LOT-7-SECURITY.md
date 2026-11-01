# Sécurité et dépendances — campagne Lot 7

Campagne de revue statique du MVP local, complétée par les tests PostgreSQL/HTTP/OAuth réels. Aucun fournisseur IA, exposition publique ou test offensif externe. Revue avant correction sur main basé sur e9657b3, avec modifications Lot 7 ; les corrections et leurs tests ont suivi la clôture de cette revue. Le rapport canonique Codex Security est conservé dans le stockage géré de l’outil (scan `04a61942-52af-41b5-8b01-d8df2b02a145`) et ne doit pas être confondu avec cette synthèse du dépôt.

## Constats corrigés

| Constat confirmé | Conséquence locale | Correction | Vérification exécutée |
|---|---|---|---|
| Historique membership/invitation admis par narrative.read | Un acteur IA délégué pouvait lire des données d’administration en dehors du contrat members.admin | CollaborationService.history exige members.admin pour ces deux familles | Refus 403 bearer HTTP et outil MCP, historique narratif autorisé préservé ; tests mcp-network |
| Introspection OAuth avant admission | Une rafale même invalide mobilisait Keycloak/DB avant le limiteur applicatif | Limiteur IP précoce 600/min et huit authentifications simultanées, Retry-After ; limite métier ultérieure conservée | Jetons Keycloak réels : refus précoce sans introspection ni création de preuve ; huit admissions puis neuvième 429 ; http-admission |

Les 17 tests de la régression ciblée (admission + groupe réseau MCP) ont réussi, puis la suite complète a été rejouée. Les deux constats avaient une sévérité basse dans le contexte strictement local et une forte confiance ; ils ne sont plus présentés comme anomalies ouvertes. Le bind direct de l’API est désormais 127.0.0.1 par défaut ; Compose choisit explicitement 0.0.0.0 sur son réseau interne.

## Couverture et limites

Trois revues indépendantes en lecture seule ont couvert contrôle d’accès/identités/IA/MCP, domaines narratifs/rendu riche, archives/sauvegardes/restauration et frontière opérateur. Vérification parent des deux chemins source→effet et modèle de confiance persistant. Couverture globale **partielle** : le corpus complet de recherches, fixtures et tests n’a pas été audité ligne par ligne. L’absence d’autres constats dans cette campagne ne prouve pas absence de vulnérabilité. Les fichiers secrets .env ne faisaient pas partie du corpus de revue. Le rapport canonique est un instantané avant correction, pas un scan prétendument rejoué sur le commit final.

Les régressions exécutées contrôlent isolement projet/recherche/extraits, CSRF et sessions, commentaires/historiques, privée IA, délégations, provenance, impossibilité de fusion IA, XSS/rendu actif, quotas/bornes, erreurs/logs, archives privées et révocation après restauration. Voir les suites dans le [rapport](LOT-7-REPORT.md) et les [scénarios Lot 7](spec/lot7-scenarios.json).

## Dépendances

Mises à jour ciblées Ajv 8.17.1→8.18.0 et yaml 2.8.2→2.8.3. Les avis primaires décrivent respectivement [l’option $data d’Ajv](https://github.com/advisories/GHSA-2g4f-4pwh-qvx6) et [la profondeur YAML](https://github.com/advisories/GHSA-48c2-rrv3-qjmp). Lockfile synchronisé ; aucun remplacement massif de frameworks.

`npm audit --omit=dev` : zéro vulnérabilité ; audit isolé du Spike A : zéro. Audit racine complet : onze entrées modérées transitives de l’outillage ESLint/minimatch, zéro haute/critique. L’[avis minimatch](https://github.com/advisories/GHSA-g3hv-75wg-m249) concerne notamment optimizationLevel ≥ 2 ; ces globs d’outillage portent sur le dépôt de confiance, pas les manuscrits à l’exécution. Pas de correction automatique imposant un retour vers ESLint 4 ni de saut majeur aveugle. Réévaluer la chaîne de lint lors d’une mise à jour compatible. Ces décomptes sont ceux de la campagne, pas une promesse permanente.

## Risques conservés

- SEC-07 MUST non satisfait : HTTP loopback et SQL réseau privé sans TLS complet. GO-04 doit arbitrer certificats, confiance locale et migration d’issuer ; aucune conformité réseau chiffré annoncée.
- RLS désactivée : le rôle applicatif et les cas d’usage imposent la frontière projet. Une future RLS exige SET LOCAL transactionnel, refus sans contexte, réutilisation du pool, rollback et tests d’isolation ; aucune activation précipitée.
- Révocation globale IdP non garantie. Un token original peut rester valide chez Keycloak ; le témoin externe et les grants applicatifs l’empêchent de retrouver des droits restaurés. Une requête déjà admise n’est pas annulée atomiquement par une révocation IdP.
- Le répertoire d’époque externe est partagé en écriture par les runtimes API/MCP de confiance ; ceux-ci ne sont pas isolés l’un de l’autre. Un administrateur de machine garde accès aux données et clés. Revenir au SQL ET recopier volontairement un ancien témoin compromettrait la barrière : cette opération est interdite par le runbook.
- Le scellement fichier fsync précède le commit SQL pour fermer le rollback seul ; si le commit échoue après scellement, l’installation se ferme et exige récupération opérateur. Cette perte de disponibilité est délibérée (ADR-0016).
- R-CONT-01, données de capacité locale, brouillons non confirmés, gestion hors machine des clés et politiques de rétention restent ouverts. Aucun GO-03/GO-04 accepté par la revue.

## Critères d'acceptation du document

Constats corrigés reliés aux chemins et tests ; rapport source distingué de la synthèse ; dépendances et réserves non masquées ; aucune qualification publique ou approbation de risque implicite.
