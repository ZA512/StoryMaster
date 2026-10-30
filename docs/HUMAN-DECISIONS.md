# Fiches de décision — GO-00, GO-01 et GO-02

**Statut :** Préparées, en attente de décision humaine. **Portée :** validation du socle avant Lot 0 ; aucune autorisation d'implémentation implicite. **Références :** [PRD](PRD.md), [patchs proposés](PRD-ALIGNMENT-PROPOSAL.md), [architecture](ARCHITECTURE.md), [sécurité](SECURITY-MODEL.md), [ADR](adr/README.md), [plan](IMPLEMENTATION-PLAN.md).

## Synthèse

Le propriétaire peut accepter, refuser ou demander une modification de chaque fiche séparément. Aucun choix n'est présélectionné comme accepté. Une validation du découpage ne valide ni une priorité produit supplémentaire, ni un hébergeur, ni une intégration fournisseur. À consigner pour chaque décision : propriétaire, date, choix et réserves.

## GO-00 — Référence produit et huit lots

**Recommandation :** retenir le PRD v0.1 comme référence, accepter uniquement le patch de sa section 19 pour les huit lots, conserver MVP/V1/V2+ et les 150 identifiants. Confiance élevée ; changement de découpage demandé, validation formelle du PRD toujours à enregistrer.

**Alternatives :** garder les six lots du PRD en faisant réécrire le plan et ses affectations ; ou conserver le document provisoire et poursuivre uniquement la conception. La première réduit le nombre de jalons mais regroupe propositions/collaboration et IA/MCP ; la seconde n'autorise pas Lot 0.

**Conséquences :** sorties de lots séparées et traçabilité stable, aucune durée imposée. Le registre distingue priorité produit (MUST/SHOULD/COULD ou null), priorité de réalisation proposée (P0/P1/P2) et version cible ; null ne crée pas de priorité pour les NFR ou fonctionnalités seulement marquées V1/V2+.

**Éléments précis à valider :**

- [ ] PRD v0.1 retenu comme base produit, avec les questions ouvertes conservées.
- [ ] Patch « huit lots » accepté, ou alternative de découpage désignée.
- [ ] Aucun ajout V1/V2+ au MVP et aucune promotion implicite de SHOULD en MUST.
- [ ] PROP-10 traité séparément : accepter sa promotion MUST, conserver SHOULD avec révision des contrats, ou différer cette décision avant Lot 4.

**Décision / propriétaire / date / réserves :** non renseignés.

## GO-01 — Architecture, intégrité et concurrence

**Recommandation :** monolithe modulaire, PostgreSQL source de vérité, cas d'usage partagés, révisions optimistes et fusion multi-objets dans une transaction avec historique/audit/outbox. Retenir le verrou exclusif projet comme stratégie initiale **à qualifier par spike**, pas comme garantie d'évolutivité. Confiance élevée sur le stockage transactionnel, moyenne sur cette granularité de verrou.

**Alternatives :** backend géré avec la même transaction serveur ; services séparés et coordination distribuée ; ou verrouillage plus fin avec contraintes/sérialisabilité pour les invariants d'ensemble. Les services augmentent l'exploitation et la difficulté de l'atomicité ; des locks plus fins peuvent améliorer le parallélisme mais exigent de démontrer à nouveau absence de write skew, cycles et course avec révocation.

**Conséquences :** une panne de fournisseur n'est jamais dans la transaction ; tous les changements canoniques passent par les mêmes règles. En contrepartie, deux autosaves de scènes indépendantes d'un même projet attendent le même verrou ; ajouter des workers ne supprime pas cette file d'attente. Les écritures de projets distincts constituent un témoin séparé.

**Éléments précis à valider :**

- [ ] Principes des ADR-0001/0003/0006 : transaction unique, CAS, historique et source de vérité.
- [ ] Verrou projet accepté comme hypothèse de départ, conditionné au spike B étendu avant Lot 4 ; pas d'engagement de capacité non mesuré.
- [ ] Enveloppe de charge représentative à définir pour le spike : auteurs actifs/projet, scènes distinctes, cadence et taille d'autosave, taille de proposition et matériel. Valeurs actuellement non renseignées.
- [ ] Si la contention compromet les objectifs NFR de cette enveloppe, réexamen ADR-0003 avant généralisation ; ni suppression du contrôle de versions ni affaiblissement de l'atomicité pour gagner du débit.

**Décision / propriétaire / date / réserves :** non renseignés.

## GO-02 — Droits, identité et exploitation initiale

**Recommandation :** rôles par projet et owner unique ; approbation/fusion réservées aux humains owner/admin ; author/reviewer autorisés à proposer ; export owner/admin/author. Accepter l'auto-approbation du propriétaire humain pour le projet solo, jamais celle d'une IA. Authentification web OIDC et délégation MCP distincte ; pas de partage public ni d'ACL par scène au MVP. Mode d'exploitation recommandé : SaaS initial conteneurisable, auto-hébergement non promis au MVP. Confiance moyenne, choix produit et opérationnels à confirmer.

**Alternatives :** imposer deux humains pour toute approbation (bloque l'auteur solo) ; réserver toutes fusions au seul owner (moins de délégation humaine) ; auto-hébergement initial avec responsabilité d'exploitation explicitement affectée. Des ACL fines par scène étendraient le périmètre et les tests. Aucun fournisseur IdP/hébergeur n'est choisi faute de contraintes ou de préférence connues.

**Conséquences :** la délégation IA ne transmet jamais les droits humains d'écriture canonique/merge, même depuis un owner. Un admin ne retire/modifie que author/reviewer/reader ; la propriété et le transfert suivent un parcours distinct. Clés IA personnelles et conversations privées à l'initiateur, en plus de l'isolation projet. Un SaaS implique de désigner l'opérateur des manuscrits, sauvegardes et secrets.

**Éléments précis à valider :**

- [ ] Matrice lecture/édition/commentaire/proposition/approbation/fusion/export de SECURITY-MODEL, owner unique et restrictions admin.
- [ ] Auto-approbation humaine owner pour un projet solo autorisée, ou règle alternative explicite.
- [ ] Rôles au niveau projet MVP ; pas de confidentialité par champ implicitement promise ; conversations privées et clés personnelles.
- [ ] OIDC retenu ; **nom de l'IdP et environnement de développement à renseigner avant configuration du Lot 0**. AS/durées de tokens/clients MCP à qualifier avant Lot 6.
- [ ] Mode initial choisi (SaaS ou auto-hébergé), opérateur responsable et contraintes de localisation éventuelles à renseigner ; aucune infrastructure payante déployée par cette fiche.

**Décision / propriétaire / date / réserves :** non renseignés.

## Risques et décisions proposées

Toutes les cases sont une liste de points à décider, pas une validation effectuée. Les paramètres non connus ne sont pas inventés. GO-00..02 restent bloquants avant implémentation ; la granularité des locks reste réexaminable, et les paramètres de charge non encore connus n'interdisent pas la présente préparation documentaire.

## Critères d'acceptation du document

Chaque fiche donne recommandation, alternatives crédibles, conséquences, confiance et points précis d'accord ; décisions/identité/date non renseignées tant que le propriétaire ne s'est pas prononcé ; PROP-10 reste indépendant ; risques de contention, identité et hébergement visibles.
