# Vérification des artefacts de spécification

**Statut :** Contrôles documentaires réussis le 30 octobre 2026 ; aucune application ni mesure de contention exécutée.
**Portée :** syntaxe, schémas, contenu PRD, couverture, parité des contrats et oracles des fixtures. **Références :** [commande CI](../scripts/README.md), [rapport](CONSOLIDATED-REPORT.md), [fiches GO](HUMAN-DECISIONS.md), [tests métier futurs](CONTRACT-TESTS.md).

## Synthèse et anomalies corrigées

L'extracteur initial confondait `Exigence cible` et `Priorité` dans les lignes NFR. Le registre v2 sépare type, priorité produit, priorité de réalisation, version cible, texte intégral, domaine, source et lot. Les 150 IDs sont conservés ; les 12 NFR ont `priority:null`. Les autres priorités absentes restent également null ; les priorités explicitement indiquées dans le PRD sont inchangées, notamment PROP-10 SHOULD. Les libellés NFR du backlog et de la matrice reprennent désormais les objectifs complets ; les marqueurs V1/V2+ ne sont plus mélangés aux priorités.

Le tableau du backlog comportait des lignes vides entre ses lignes, empêchant son rendu comme tableau Markdown ; elles ont été retirées. L'ancienne vérification temporaire est remplacée par un script versionné, ses dépendances épinglées et ses propres tests de mutations.

## Contrôles effectivement exécutés

Environnement **neuf** `/tmp/storymaster-ci-check`, Python 3.14.8, installation depuis `scripts/requirements-validation.txt`. Versions principales : `openapi-spec-validator 0.9.0`, `jsonschema 4.26.0`, `PyYAML 6.0.3`. Aucun paquet ni serveur applicatif ajouté. Les commandes ont été exécutées localement ; aucune exécution distante de CI n'est revendiquée.

| Contrôle | Résultat |
|---|---|
| Installation isolée des dépendances épinglées, puis `pip check` | Réussite, aucune dépendance cassée |
| Script `scripts/validate_specifications.py` | Code 0 ; vérifications ci-dessous réussies |
| JSON stricts et schémas | 9 JSON parsés ; clés dupliquées/NaN interdits ; schéma de registre, schéma d'opérations et 26 schémas MCP valides ; références locales résolues |
| OpenAPI | 18 chemins, 19 opérations ; document valide et operationId uniques |
| Contenu des exigences | Chaque ID, texte intégral, section, sourceText, type, priorité produit et version comparé à une définition relue du PRD |
| Valeurs et couverture | Enums fermés ; lots entiers 0..7 pour MVP, null pour V1/V2+ ; 150 IDs uniques ; 99 MUST MVP affectés ; fiche de lot, backlog et matrice rapprochés pour chaque exigence |
| MCP ↔ HTTP | 13 noms et mappings autorisés ; propriétés/réquis des entrées, sorties, définitions, scopes, permissions, audit, transactions, erreurs et limites vérifiés |
| Fixtures | Requêtes et opérations conformes ; bases initiales/révisées, mapping temporaire, états et MergeResult cohérents ; approbation antérieure invalidée ; aucune simulation de transaction métier |
| Scénarios et documents | 50 scénarios JSON/Markdown rapprochés champ par champ ; références abrégées résolues ; liens locaux et critères documentaires vérifiés |
| Tests du validateur | **19 tests réussis** ; mutations d'IDs/outils à décompte constant, priorité NFR erronée, promotion isolée de PROP-10, texte tronqué, affectation V1 dans MVP, divergence de lot, $ref absente, dérive MCP, mauvaise permission, révision finale/base incohérente et approval périmée détectées |
| Code de sortie CI | Le test CLI provoque une anomalie dans une copie et confirme code 1 avec diagnostic, depuis un autre répertoire |
| Patchs PRD | `git apply --check` réussi séparément pour les huit lots et PROP-10 ; aucun patch appliqué |
| Diff | `git diff --check` réussi ; PRD actif et recherches inchangés |

## Reproduction

Les scripts nécessaires sont dans le dépôt, sans dépendance à un fichier temporaire de génération :

```bash
set -euo pipefail
python -m venv /tmp/storymaster-validation
/tmp/storymaster-validation/bin/python -m pip install -r scripts/requirements-validation.txt
/tmp/storymaster-validation/bin/python -m pip check
/tmp/storymaster-validation/bin/python scripts/validate_specifications.py
PYTHONDONTWRITEBYTECODE=1 /tmp/storymaster-validation/bin/python -m unittest discover -s scripts/tests -v
git apply --check docs/proposals/PRD-eight-lots.patch
git apply --check docs/proposals/PRD-PROP-10.patch
git diff --check
```

La validation est en lecture seule des artefacts ; les tests de mutation opèrent dans une copie jetable. L'acceptation humaine d'une modification du PRD doit précéder sa synchronisation avec le registre : le script n'applique pas automatiquement les patchs et ne peut attester l'identité du décideur.

## Fichiers modifiés ou créés pendant cette passe

| Groupe | Fichiers |
|---|---|
| Registre normalisé | [requirements.json](spec/requirements.json), [requirements.schema.json](spec/requirements.schema.json), [README des artefacts](spec/README.md) |
| Couverture et contention | [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md), [RESEARCH-TRACEABILITY.md](RESEARCH-TRACEABILITY.md), [ARCHITECTURE.md](ARCHITECTURE.md), [ADR-0003](adr/0003-propositions-transactionnelles.md) |
| Décisions humaines et propositions non appliquées | [HUMAN-DECISIONS.md](HUMAN-DECISIONS.md), [PRD-ALIGNMENT-PROPOSAL.md](PRD-ALIGNMENT-PROPOSAL.md), [patch huit lots](proposals/PRD-eight-lots.patch), [patch PROP-10](proposals/PRD-PROP-10.patch) |
| Outillage CI | [validate_specifications.py](../scripts/validate_specifications.py), [tests du validateur](../scripts/tests/test_validate_specifications.py), [dépendances épinglées](../scripts/requirements-validation.txt), [mode d'emploi](../scripts/README.md), [exclusion des caches Python](../scripts/.gitignore) |
| Rapports synchronisés | [DOCUMENT-AUDIT.md](DOCUMENT-AUDIT.md), [CONSOLIDATED-REPORT.md](CONSOLIDATED-REPORT.md), présent rapport |

Aucun changement de `docs/PRD.md`, des deux recherches, d'OpenAPI, du catalogue MCP ou des fixtures de propositions. Les patchs sont préparés pour revue, pas appliqués.

## Empreintes des sources conservées

| Fichier | SHA-256 |
|---|---|
| PRD.md | `caf1d358427347af46fa22d4016519ed943a300c7896a0523dabee05e65b862e` |
| deep-research-analyse-fonction.md | `ad58f43695fb5e6bc9dbeb83a4f533bfe51f37481ec274ee48deed3bec636c70` |
| deep-research-modele-fonctionnel.md | `d37150a328136fded4813d8457b37743b49686f4a3c74a363bcdea79acce7657` |

## Décisions proposées, alternatives et risques

La CI est un contrôle de cohérence, pas une validation des décisions produit. Les champs null évitent d'inventer une priorité ; le choix éventuel de prioriser les NFR exige une modification explicite de la source produit. Le verrou projet reste une hypothèse à qualifier via les sept cas du spike B, dont plusieurs scènes indépendantes, sans capacité garantie à ce stade.

## Questions ouvertes et limites

Non exécutés : les 50 tests de contrat applicatifs, les spikes A/B/C, PostgreSQL concurrent, tests de charge/NFR, intégrations fournisseurs, runtime MCP, sauvegarde/restauration et rendu Mermaid automatisé. GO-00..02, PROP-10, IdP/hébergement et enveloppe de charge restent à décider. Une CI verte ne transforme aucune proposition en décision acceptée.

## Critères d'acceptation du document

Résultats effectivement exécutés distingués des scénarios futurs ; commande reproductible depuis un environnement neuf ; anomalies détectées sur le contenu, pas seulement les décomptes ; priorités produit et sources conservées ; limites et décisions humaines explicites.
