# Alignement minimal proposé du PRD

**Statut :** Proposé, non appliqué ; accord du propriétaire requis. **Portée :** §19 et une décision indépendante sur PROP-10. **Références :** [PRD actuel](PRD.md), [plan](IMPLEMENTATION-PLAN.md), [fiches GO](HUMAN-DECISIONS.md), [audit](DOCUMENT-AUDIT.md).

## Synthèse et analyse

Le PRD reste inchangé et demeure la source des priorités produit. Deux patchs séparés permettent de valider le découpage sans accepter implicitement une promotion de priorité. Aucun autre MUST, SHOULD, COULD ou périmètre MVP/V1/V2+ n'est modifié par ces patchs.

## Modification A — Huit lots, décision GO-00

[PRD-eight-lots.patch](proposals/PRD-eight-lots.patch) remplace seulement la section 19. Les huit titres deviennent ceux du plan : Fondations ; Manuscrit et éditeur ; Référentiel narratif ; Collaboration asynchrone ; Propositions ; Assistant IA intégré ; MCP externe ; Consolidation / production.

| PRD actuel | Proposition | Conséquence |
|---|---|---|
| Lot 0 | Lot 0 | Inchangé |
| Lot 1 Écriture | Lot 1 Manuscrit et éditeur | Titre aligné, mêmes capacités |
| Lot 2 | Lot 2 | Inchangé |
| Lot 3 Collaboration et propositions | Lots 3 et 4 | Collaboration et moteur de propositions ont des sorties distinctes |
| Lot 4 IA intégrée et MCP | Lots 5 et 6 | Preuve de l'assistant intégré avant délégation externe |
| Lot 5 Consolidation MVP | Lot 7 Consolidation / production | Renumérotation, sans nouveau calendrier |

Les précisions des conditions de sortie reprennent les invariants déjà présents : aucune nouvelle fonction V1/V2+ introduite. Les priorités des 150 exigences restent inchangées.

## Modification B — PROP-10, décision indépendante

État actuel : `PROP-10 — Permettre la révision d'une proposition — SHOULD`, cible MVP du dossier, priorité de réalisation P0 proposée. **P0 ne signifie pas MUST** et ne constitue pas un accord produit.

Recommandation : accepter le [patch PROP-10](proposals/PRD-PROP-10.patch) qui remplace uniquement SHOULD par MUST. Cela rend explicite le caractère nécessaire du parcours corriger → resoumettre → réapprouver déjà retenu par les contrats et les fixtures. Coût : révisions immuables, invalidation d'approbation et tests associés obligatoires au Lot 4. Aucun impact sur le nombre d'identifiants ; le nombre de MUST MVP passerait de 99 à 100 après accord et mise à jour coordonnée des artefacts.

Alternative crédible : conserver SHOULD et utiliser une nouvelle proposition en remplacement d'une intention refusée/en conflit, en conservant les liens de provenance. Cette alternative nécessite de réviser le modèle, les contrats, le plan et les tests qui supposent actuellement la révision sur place. Le maintien de SHOULD n'autorise jamais la réutilisation d'une approbation pour un contenu différent.

Le registre conserve donc `priority: "SHOULD"` pour PROP-10 tant qu'aucune décision humaine n'est enregistrée. Échéance : avant implémentation du Lot 4 ; GO-00 n'emporte pas validation de cette promotion.

## Procédure après accord explicite

Vérifier les patchs depuis la racine, sans les appliquer :

```bash
git apply --check docs/proposals/PRD-eight-lots.patch
git apply --check docs/proposals/PRD-PROP-10.patch
```

Après accord sur A et/ou B : consigner propriétaire/date/choix dans la fiche, appliquer seulement le patch accepté, puis mettre à jour registre, sourceText/section, backlog, traçabilité et décomptes du rapport avant d'exécuter le validateur. Un changement du PRD seul doit faire échouer la CI tant que le registre n'est pas aligné. Les patchs sont des propositions liées à l'état actuel ; si le PRD évolue entre-temps, les régénérer et les relire.

## Alternatives, risques et questions ouvertes

Conserver deux découpages actifs entretient des erreurs d'affectation ; la proposition A est recommandée. Appliquer B sans accord transformerait une recommandation en exigence : expressément interdit. La priorité des NFR reste non spécifiée dans le PRD, indépendamment de ces décisions ; aucun MUST ne lui est ajouté.

## Critères d'acceptation du document

Deux patchs minimaux, indépendants et vérifiables ; PRD actif inchangé ; conséquences et alternative de PROP-10 explicites ; aucune priorité produit modifiée sans accord ; huit titres cohérents avec le plan.
