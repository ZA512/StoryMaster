# Vérification des artefacts de spécification

**Statut :** Contrôles documentaires réussis le 30 octobre 2026 ; aucun test produit exécuté.
**Portée :** syntaxe, références, schémas, fixtures et couverture de ce dossier. **Références :** [rapport](CONSOLIDATED-REPORT.md), [contrats](API-CONTRACTS.md), [tests à implémenter](CONTRACT-TESTS.md).

## Synthèse et analyse des résultats

Vérification effectuée dans un environnement Python temporaire hors dépôt, avec `openapi-spec-validator 0.9.0`, `jsonschema 4.26.0` et PyYAML. Aucun serveur, composant applicatif, migration ou test métier exécutable n'a été ajouté au dépôt. Les scripts temporaires de préparation ne constituent pas des livrables applicatifs.

| Vérification effectivement exécutée | Résultat |
|---|---|
| Parsing de tous les JSON du dossier | 8 fichiers, sans erreur |
| Parsing et validation OpenAPI 3.1.1 | 18 chemins, 19 opérations, document valide |
| Schéma d'opérations Draft 2020-12 | Valide ; neuf types fermés |
| Schémas MCP input/output Draft 2020-12 | 26 schémas valides, références autonomes |
| Catalogue / politique MCP | Treize noms identiques, aucun approve/merge/SQL |
| Équivalence des définitions HTTP/MCP embarquées | 92 définitions comparées après normalisation des références, sans divergence |
| Cas négatifs de schéma | Six refus confirmés : kind inconnu, révision absente, actorType injecté, et actorType/origin/permissions dans entrée MCP |
| Requêtes HTTP et opérations présentes dans les deux fixtures | Conformes aux schémas ; 18 occurrences d'opérations contrôlées, y compris copies résolues |
| Réponses de création, preview, merge et erreur des fixtures | Conformes aux schémas correspondants |
| Entrée MCP proposal_create et sortie MCP proposal_preview sur fixture maladie | Conformes |
| Cohérence des révisions et invalidation de review | Vérifiée sur les oracles des deux fixtures |
| Traçabilité des exigences | 150 identifiants uniques, une ligne de matrice et une ligne de backlog par identifiant |
| Affectation des MUST MVP | 99 exigences affectées aux Lots 0..7 ; exigences V1/V2+ hors lots MVP |
| Tests déclaratifs | CT-01..50 consécutifs ; champs acteur/préconditions/requête/résultat/effets/PRD présents |
| Liens Markdown locaux hors blocs de code | Aucun fichier cible manquant |
| Critères d'acceptation documentaires | Présents dans chacun des sept livrables principaux |
| Conservation des trois sources initiales | Comparaison octet par octet réussie avec copie temporaire avant modification |

## Empreintes des sources conservées

| Fichier | SHA-256 |
|---|---|
| PRD.md | `caf1d358427347af46fa22d4016519ed943a300c7896a0523dabee05e65b862e` |
| deep-research-analyse-fonction.md | `ad58f43695fb5e6bc9dbeb83a4f533bfe51f37481ec274ee48deed3bec636c70` |
| deep-research-modele-fonctionnel.md | `d37150a328136fded4813d8457b37743b49686f4a3c74a363bcdea79acce7657` |

## Reproduire les vérifications structurelles

Depuis la racine du dépôt, dans un environnement jetable ; ces commandes ne lancent aucune application :

```bash
python -m venv /tmp/storymaster-validation
/tmp/storymaster-validation/bin/pip install openapi-spec-validator==0.9.0 jsonschema==4.26.0 PyYAML
/tmp/storymaster-validation/bin/python -m openapi_spec_validator docs/spec/openapi.yaml
```

Exemple de contrôle JSON Schema et fixtures, sans serveur :

```python
import json
from pathlib import Path
from jsonschema import Draft202012Validator

schema = json.loads(Path('docs/spec/operations.schema.json').read_text())
Draft202012Validator.check_schema(schema)
validator = Draft202012Validator(schema)
for path in Path('docs/examples/proposals').glob('*.json'):
    fixture = json.loads(path.read_text())
    for operation in fixture['createRequest']['body']['operations']:
        validator.validate(operation)
```

## Décisions proposées et alternatives

Utiliser ces artefacts comme baseline de contrat ; compléter les routes secondaires et validations sémantiques au lot concerné. Un validateur syntaxique seul ne remplace pas une revue de domaine ni un test d'intégration transactionnel.

## Risques et questions ouvertes

Non vérifiés à ce stade : comportement réel de PostgreSQL sous concurrence, sécurité runtime, charge/NFR, compatibilité des clients MCP, boucle outils fournisseurs, rendu de l'éditeur, migrations et restauration de backup. Les diagrammes Mermaid ont fait l'objet d'une revue textuelle, pas d'un rendu automatisé. Les spikes A/B/C et les 50 scénarios restent à réaliser pendant les lots futurs. La validation du format MCP suit la spécification consultée et les JSON Schema ; aucun SDK serveur n'a été exécuté.

## Critères d'acceptation du document

Les contrôles exécutés et non exécutés sont distingués ; versions d'outillage, décomptes et empreintes sont précis ; aucune réussite de tests applicatifs n'est inventée ; commandes minimales de reproduction fournies.
