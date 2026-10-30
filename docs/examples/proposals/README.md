# Exemples complets de propositions

**Statut :** Fixtures de spécification, non exécutées sur une application. **Portée :** propositions MVP et analyse temporelle illustrative. **Références :** [contrats](../../API-CONTRACTS.md), [schéma](../../spec/operations.schema.json), [tests](../../CONTRACT-TESTS.md).

## Synthèse et analyse

`01-maladie.json` contient état initial, acteur délégué, payload initial, preview complète sans effet de bord, mapping temporaire alloué au merge, opérations résolues, approbation humaine, résultat durable et état final. L'événement est référencé dans les attributs du personnage et dans la relation. Les références préexistantes de la scène sont conservées. La relation `participates_in` va du personnage vers l'événement.

`02-meurtrier-conflit.json` contient deux événements, une règle de trajet explicitement fournie par l'auteur, une proposition approuvée r1, une modification concurrente r4→5, un merge échoué sans changement partiel, une révision r2 basée sur r5, invalidation de review r1, resoumission, refus d'une fusion sans nouvelle approval puis merge réussi. Le statut conflictuel du premier échec est calculé ; le rollback ne persiste pas un statut différent.

Le calcul 47 < 70 et les corrections 77/80 minutes sont un oracle de fixture avec temps fictifs. Le moteur temporel avancé reste V1. Les opérations réellement soumises au MVP changent des descriptions et positions ordinales, pas un solveur ou une contrainte cachée. Une validation temporelle automatisée future devra formaliser unités, axes et révisions des contraintes.

## Décisions proposées et alternatives

Remplacement de scène entière avec expectedRevision plutôt que patch fragile ; références typées plutôt que substitution textuelle. Les IDs lisibles sont déterministes pour tests, pas une convention de production. Les tempId déclarés des créations ne sont pas supprimés de l'intention historique après résolution.

## Risques et questions ouvertes

Vérification de schéma ne prouve pas l'exécution transactionnelle ; tests ultérieurs sur PostgreSQL nécessaires. La politique d'auto-approbation humaine owner reste à valider ; aucune auto-approbation IA.

## Critères d'acceptation du document

Chaque payload et opération respecte les schémas ; révisions initiales/finales cohérentes ; mapping créé une seule fois ; preview sans ID canonique alloué ; approbation r1 invalide après r2 ; échec n'applique aucune partie du changement ; registre d'audit distingue proposer, approuver et fusionner.
