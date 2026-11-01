# Plan de réalisation et critères de sortie

**Statut :** Huit lots validés ; Lot 0 réceptionné sous réserve de fonctionnement et CI, confirmés. Spike A exécuté et ADR-0007 accepté ; Lot 1 reçu avec réserves après CI verte 4c16907 ; ADR-0005 accepté en principe et Lot 2 autorisé le 31 octobre 2026. Réception Lot 2 attendue ; Lots 3–7 non autorisés. **Date :** mise à jour le 31 octobre 2026, Europe/Paris.
**Portée :** exactement huit lots MVP puis pistes V1/V2+, sans estimation de durée faute de ressources connues.
**Références :** [PRD](PRD.md), [audit](DOCUMENT-AUDIT.md), [domaine](DOMAIN-MODEL.md), [architecture](ARCHITECTURE.md), [API](API-CONTRACTS.md), [sécurité](SECURITY-MODEL.md), [tests](CONTRACT-TESTS.md), [ADR](adr/README.md).

## Synthèse

Commencer par identité/projets/permissions et persistance, puis écrire sans IA, structurer le référentiel, collaborer, revoir des propositions atomiques, enfin brancher IA et MCP. Les sorties de lots sont des preuves de comportement, pas des pages d'interface. Aucune fonction avancée V1 n'est une dépendance cachée de ces lots.

## Analyse du découpage et dépendances

| Ancien PRD §19 | Plan de mission | Conséquence |
|---|---|---|
| Lot 0 Fondations | Lot 0 | Invariants d'accès dès le départ |
| Lot 1 Écriture | Lot 1 — Manuscrit et éditeur | Historique et export textuel inclus |
| Lot 2 Référentiel | Lot 2 | Recherche et modules inclus |
| Lot 3 Collaboration et propositions | Lots 3 et 4 séparés | Commentaires et rôles avant moteur de propositions |
| Lot 4 IA et MCP | Lots 5 et 6 séparés | Assistant intégré avant délégation externe |
| Lot 5 Consolidation | Lot 7 | Test final de bout en bout et production |

Ce découpage est demandé explicitement par la mission, pas une modification silencieuse du PRD. Toutes les exigences de sécurité se conçoivent dès lot 0 même si leur preuve finale apparaît au lot 7.

```mermaid
flowchart LR
    L0[Lot 0 Fondations] --> L1[Lot 1 Manuscrit]
    L1 --> L2[Lot 2 Référentiel]
    L2 --> L3[Lot 3 Collaboration]
    L3 --> L4[Lot 4 Propositions]
    L4 --> L5[Lot 5 phase A simulée]
    L5 -->|Phase B commerciale différée| L6[Lot 6 MCP local sans modèle]
    L6 --> L7[Lot 7 Consolidation]
```

## Critères d'acceptation transversaux

AC-01..12 reprennent le PRD sans en changer le sens. Les suivants complètent ses silences par des recommandations testables.

| AC | Critère observable | Preuves attendues |
|---|---|---|
| AC-01 | Projets isolés, URL devinée et outils MCP ne révèlent pas d'existence privée | CT-01/02/16/31/42 |
| AC-02 | Sauvegarde confirmée retrouvée après reconnexion et redémarrage courant | CT-05 et scénario de redémarrage lot 1 |
| AC-03 | Renommer/déplacer conserve id, références et navigation inverse | CT-16/46 |
| AC-04 | Version obsolète refusée sans perte du brouillon ni écrasement | CT-06 |
| AC-05 | Merge multi-objets entier ou aucun, y compris crash | CT-13/14/33 |
| AC-06 | IA en lecture seule ne peut écrire ni créer proposition | CT-17 |
| AC-07 | IA autorisée prépare/soumet, jamais approuve/fusionne ni écrit directement | CT-18/19/32 |
| AC-08 | Humain, client, grant et exécution attribuables ; aucune clé dans audit | CT-30/34 |
| AC-09 | Module désactivé conserve ses données et références, écritures refusées | CT-25 |
| AC-10 | Archive ouverte avec textes, JSON, ids, liens, schéma et manifeste | CT-24/47 |
| AC-11 | Recherche, snippets, curseurs et suggestions n'exposent que le périmètre autorisé | CT-03/31 |
| AC-12 | Panne IA signale échec sans altérer canon ni brouillons/propositions conservés | CT-21 |
| AC-13 | Nouvelle révision de proposition invalide approvals antérieures | CT-11/12/45 |
| AC-14 | Retry merge retourne le même ChangeSet et les mêmes IDs créés | CT-15/29 |
| AC-15 | Révocation empêche nouveaux outils et publication de job, sans retirer données déjà envoyées | CT-20/27/40 |
| AC-16 | Relations, déplacements et références sont validés dans le projet et l'état final | CT-10/16/42/48 |
| AC-17 | Restore crée r+1, conserve toutes les révisions sous rétention | CT-26 |
| AC-18 | Injection narrative ne change pas les permissions et ne révèle aucun secret | CT-22/23 |
| AC-19 | Budget réservé atomiquement, y compris exécutions parallèles | CT-28/37 |
| AC-20 | API et MCP appellent les mêmes cas d'usage et rendent le même résultat autorisé | Spike C, CT-18/30 |
| AC-21 | Sauvegarde restaurable, clés récupérées, sessions/grants invalidés, egress coupé | CT-39/44 |
| AC-22 | Conversations IA privées à l'initiateur, proposition partageable sans transcript | CT-38 |
| AC-23 | Diagnostic distingue faits/hypothèses/interprétation et accepte d'être ignoré | Exemples diagnostics ; comité complet V1 |
| AC-24 | Parcours essentiels au clavier ; save pending/success/error visibles ; confirmation destructive | E2E/audit accessibilité, CT-35/36 |
| AC-25 | Objectifs NFR mesurés dans environnement et corpus documentés, pas affirmés sans charge | Campagne lot 7 |
| AC-26 | Consentement IA et identité modèle/périmètre consultables avant transfert ; pas de clé exposée | CT-23/34 |

## Lots proposés


### Lot 0 — Fondations

**Objectif :** Prouver identité, projet privé et refus par défaut avant tout manuscrit.

**Prérequis / dépendances :** GO-00..02 validés ; ADR-0001/0002/0006 acceptés, principes GO-02 de l’ADR-0008 validés ; aucun produit préalable.

**Exigences PRD couvertes :** OBJ-01, PROJ-01, PROJ-02, PROJ-03, PROJ-04, PROJ-05, PROJ-08, PROJ-10, COLLAB-05, SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-06, SEC-09, SEC-10, SEC-12, NFR-09, NFR-10. Les exigences transversales continuent à être vérifiées dans les lots suivants.

**Tâches (ordre proposé) :** Initialiser dépôt/CI/environnement reproductible ; cas d’usage d’identité OIDC et sessions ; Project, Membership et autorisation commune ; schémas/erreurs/CAS/idempotence et audit minimal ; rôle DB sans privilèges globaux ; stratégie transaction/verrou projet ; tests de refus et données fictives.

**Livrables :** Contrats v1, environnement démarrable, projet privé créable, contrôle d’accès commun et journal minimal. Réalisation et preuves : [rapport du Lot 0](LOT-0-REPORT.md). Réception du Lot 0 et CI confirmées ; Lot 1 autorisé par l’instruction du 31 octobre 2026, puis Lots 2, 3 et 4 autorisés par instructions distinctes ; phase A du Lot 5 autorisée séparément après réception du moteur de propositions ; GO-03 avant phase B.

**Risques :** Divergence adaptateurs, mauvaise identité email, secret en CI, décision IdP tardive.

**AC fonctionnels et sécurité :** AC-01/08 : membre voit son projet, non-membre obtient 404 uniforme ; actor serveur et logs sans secrets.

**AC données :** Propriétaire + membership créés atomiquement ; deux projets du même user distincts ; invariants DB composites préparés.

**AC résilience :** Échec de création ne laisse ni projet orphelin ni rôle owner absent ; retry clé stable.

**Tests automatiques attendus :** Tests unitaires permissions, intégration vraie PostgreSQL, contrats auth/404/erreurs et CI ; CT-01/02/29/34/40/42.

**Critères de sortie :** Projet privé utilisable et tests interprojets verts ; ADR de socle explicitement validés ; aucun bypass DB.

**Hors périmètre explicite :** Éditeur, IA, serveur MCP, déploiement public, CRDT et moteur de faits.



### Lot 1 — Manuscrit et éditeur

**Objectif :** Rédiger et retrouver un manuscrit complet avec autosave fiable.

**Prérequis / dépendances :** Lot 0 reçu et CI verte ; [résultat du Spike A](SPIKE-A-REPORT.md) disponible, ADR-0007 accepté et production Lot 1 autorisée explicitement le 31 octobre 2026. Voir [rapport Lot 1](LOT-1-REPORT.md) et [ADR-0010](adr/0010-atelier-ecriture-et-concurrence.md).

**Exigences PRD couvertes :** OBJ-03, OBJ-09, EDIT-01, EDIT-02, EDIT-03, EDIT-04, EDIT-05, EDIT-06, EDIT-07, EDIT-10, EDIT-11, EDIT-12, EXPORT-01, COLLAB-03, UX-01, UX-02, UX-03, UX-05, UX-08, SEC-13, NFR-01, NFR-04. Les exigences transversales continuent à être vérifiées dans les lots suivants.

**Tâches (ordre proposé) :** Manuscript/Chapter/Scene ; création/rename/move/archive et plan ; éditeur au format validé ; auto-enregistrement CAS et états visibles ; compteur mots scène/chapitre/manuscrit ; historique et restauration ; export Markdown ; validation rich text et parcours clavier.

**Livrables :** Parcours écrire→enregistrer→quitter→retrouver, historique visible, export texte.

**Risques :** Normalisation JSON, commentaires futurs, autosave trop fréquent, conflit traité comme succès.

**AC fonctionnels et sécurité :** AC-02/03/04/17/24 : texte et ordre retrouvés ; erreur visible ; refus révision périmée ; restore r+1.

**AC données :** Snapshot et ChangeSet même commit ; déplacement conserve identité et vérifie révision structurelle des parents.

**AC résilience :** Crash avant commit ne confirme rien ; après commit/reconnexion contenu identique ; brouillon conservé pendant conflit, sans promettre mode hors ligne.

**Tests automatiques attendus :** CT-05/06/26/35/36/46 ; E2E écriture/redémarrage/export/clavier ; aller-retour documents et marks du spike A.

**Critères de sortie :** Enregistrement confirmé durable en fonctionnement courant ; restauration non destructive et export lisible ; aucune perte silencieuse.

**Hors périmètre explicite :** Coédition temps réel, mise en page DOCX/EPUB, import, offline et plugins.



### Lot 2 — Référentiel narratif

**Objectif :** Relier le manuscrit aux personnages, lieux et événements stables.

**Prérequis / dépendances :** Lots 0–1 reçus avec réserves ; CI du Lot 1 verte sur 4c16907. ADR-0005 accepté en principe et implémentation du Lot 2 explicitement autorisée. Le catalogue initial du domaine est conservé ; détails d’implémentation dans [ADR-0011](adr/0011-referentiel-narratif-et-references.md), preuves et limites dans [rapport Lot 2](LOT-2-REPORT.md). Les autres ADR proposés restent proposés.

**Exigences PRD couvertes :** OBJ-04, OBJ-05, OBJ-06, MOD-01, MOD-02, MOD-03, MOD-04, MOD-05, MOD-06, MOD-07, PROJ-09, EDIT-08, DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, DATA-06, DATA-07, DATA-08, DATA-09, DATA-10, DATA-11, SEARCH-01, SEARCH-02, SEARCH-03, SEARCH-04, SEARCH-05, UX-04, NFR-11. Les exigences transversales continuent à être vérifiées dans les lots suivants.

**Tâches (ordre proposé) :** Fiches typées et révisions ; liens et références de scènes ; navigation inverse ; hiérarchie de lieux acyclique ; timeline unknown/ordinal ; recherche lexicale filtrée ; activation/désactivation modules connus ; archive/tombstone et détection de références invalides.

**Livrables :** Bible reliée au manuscrit, recherche autorisée et chronologie simple.

**Risques :** Liens interprojets, JSON non typé, pertes à désactivation, confusion ordre narratif et chronologique.

**AC fonctionnels et sécurité :** AC-03/09/11/16 : renommer conserve références ; module off refuse écritures ; snippets sans fuite ; timeline ne nécessite pas de date.

**AC données :** FK composites et état final cohérent ; liens archivés identifiables, suppression destructrice refusée.

**AC résilience :** Échec relation/cycle ne modifie aucune fiche ; données modules retrouvées après réactivation.

**Tests automatiques attendus :** CT-03/10/16/25/31/42/46/48 ; tests de types, références inverses et cycles de lieux.

**Critères de sortie :** Parcours personnage→scènes→événements fonctionne ; toutes relations protégées par projet ; données off conservées.

**Hors périmètre explicite :** NarrativeFact, croyances, lecteur, vecteurs, solveur temporel, arcs et calendrier fictif complet.



### Lot 3 — Collaboration asynchrone

**État :** implémentation autorisée le 31 octobre 2026 après CI verte de 6a58641 ; réalisation et preuves dans le [rapport Lot 3](LOT-3-REPORT.md), choix dans [ADR-0012](adr/0012-collaboration-asynchrone-et-ancrages.md). Réception technique et principes ADR-0012 acceptés par l’instruction Lot 4 ; CI verte de 41762fb vérifiée. Réserves UX, brouillons, qualification locale et exploitation publique maintenues. Lot 4 autorisé séparément.

**Objectif :** Faire contribuer auteurs et relecteurs sans écrasement.

**Prérequis / dépendances :** Lots 0–2 ; matrice rôles et politique invitation approuvées.

**Exigences PRD couvertes :** OBJ-02, PROJ-06, PROJ-07, EDIT-09, COLLAB-01, COLLAB-02, COLLAB-04, COLLAB-08. Les exigences transversales continuent à être vérifiées dans les lots suivants.

**Tâches (ordre proposé) :** Invitations à durée bornée/email vérifié/usage unique ; membres/rôles/retrait ; commentaires objets et passages, fils/résolution ; TextAnchor versionné et états ambigu/orphelin ; attribution contributions ; refus modifications concurrentes déjà disponible.

**Livrables :** Projet multi-membres, commentaires et historique attribué.

**Risques :** Invitation acceptée par mauvaise identité, retrait concurrent, ancrage trompeur.

**AC fonctionnels et sécurité :** AC-01/04/08/15/24 : reviewer commente mais n’écrit pas le canon ; lecteur consulte ; retrait effectif.

**AC données :** Membership révisé, owner unique ; ancrage base conservé, aucun réancrage approximatif silencieux.

**AC résilience :** Acceptation invitation rejouée ne crée pas deux memberships ; réancrage impossible garde commentaire accessible au contexte historique autorisé.

**Tests automatiques attendus :** Matrice rôle/action ; CT-02/06/20/30/36/45/49 ; scénario auteur + relecteur + owner.

**Critères de sortie :** Deux membres peuvent contribuer, commenter et se retirer sans modifier les projets personnels ; aucun faux ancrage.

**Hors périmètre explicite :** Présence live, curseurs, mentions/notifications avancées SHOULD et permissions par scène.



### Lot 4 — Propositions

**État :** implémentation complète autorisée le 31 octobre 2026 après réception technique du Lot 3 ; réalisation et preuves dans [LOT-4-REPORT](LOT-4-REPORT.md), choix [ADR-0013](adr/0013-moteur-de-propositions-et-fusion.md), [mesures](measurements/LOT-4-PROPOSALS.md). Réception technique et principes ADR-0013 acceptés par instruction Lot 5, CI de 9c2df0b vérifiée verte ; réserves maintenues. Phase A du Lot 5 autorisée, GO-03 toujours proposé.

**Objectif :** Examiner et fusionner une intention multi-objets atomique.

**Prérequis / dépendances :** Lots 0–3 ; spike B, ADR-0003 et règle approbation validés.

**Exigences PRD couvertes :** OBJ-08, PROP-01, PROP-02, PROP-03, PROP-04, PROP-05, PROP-06, PROP-07, PROP-08, PROP-09, PROP-10, PROP-11. Les exigences transversales continuent à être vérifiées dans les lots suivants.

**Tâches (ordre proposé) :** Cycle draft/submitted/review/approved/merged/rejected/withdrawn/conflicted ; opérations typées et bases ; snapshots immuables de proposition ; tempId ; preview/diff ; validations ; review et invalidation approvals ; merge sous verrou et historique/outbox ; idempotence durable.

**Livrables :** Moteur métier unique, UI de revue et deux scénarios de fixtures utilisables.

**Risques :** Write skew, approbation périmée, rollback partiel, mapping temporaire instable, dérive vers Git/branches.

**AC fonctionnels et sécurité :** AC-04/05/08/13/14/16 : contenu exact approuvé, aucun merge IA, aucune fusion partielle.

**AC données :** Un ChangeSet par proposition fusionnée ; chaque ressource r+1 ; IDs créés référencés dans toutes les opérations.

**AC résilience :** Échec injecté à chaque étape annule canon/snapshots/outbox ; retry après commit perdu retrouve même résultat.

**Tests automatiques attendus :** CT-07..16/29/33/45/48 ; concurrence réelle PostgreSQL et test d’arrêt/reprise, pas seulement mocks.

**Critères de sortie :** Fixtures maladie et conflit/revue passent les contrats ; invariants atomicité/concurrence démontrés ; aucun effet externe avant commit.

**Hors périmètre explicite :** Approbation partielle, branche narrative, merge automatique ou patch texte concurrent intelligent.



### Lot 5 — Assistant IA intégré

**État :** phase A locale autorisée au 1er novembre 2026. [GO-03 proposé](GO-03-DECISION-PROPOSAL.md), [ADR-0014](adr/0014-assistant-integre-et-executions-bornees.md), [rapport phase A](LOT-5-REPORT.md). Aucun fournisseur réel, clé réelle ou appel facturable avant accord explicite du propriétaire. Phase A reçue techniquement avec réserves par instruction Lot 6, CI 58ec5a9 vérifiée verte. Phase B et GO-03 commercial différés après qualification humaine ; dérogation de séquencement autorisant MCP local sans LLM avant cette phase B.

**Objectif :** Permettre consultation ciblée et propositions sous revue humaine.

**Prérequis / dépendances :** Lots 0–4 ; GO-03 fournisseur/consentement/clés/budget et ADR-0008 validés.

**Exigences PRD couvertes :** OBJ-10, AI-01, AI-02, AI-03, AI-04, AI-05, AI-06, AI-09, AI-10, AI-11, AI-12, AI-13, AI-14, AI-SEC-01, AI-SEC-03, AI-SEC-04, AI-SEC-05, SEC-08. Les exigences transversales continuent à être vérifiées dans les lots suivants.

**Tâches (ordre proposé) :** Credentials personnelles chiffrées ; sélection modèle/fournisseur pris en charge ; conversation privée ; ContextReferences ; orchestrateur avec outils de lecture/proposition ; adaptateurs OpenAI Responses et Anthropic Messages ou couverture minimale explicitement validée ; limites/budgets/cancellation ; provenance et erreurs sûres.

**Livrables :** Conversation sourcée, proposition visible en revue, usage/coût et état d’exécution.

**Risques :** Fuite de contexte, prompt injection, boucle outils illimitée, coût inconnu après timeout, abstraction effaçant différences fournisseurs.

**AC fonctionnels et sécurité :** AC-06/07/08/12/18/19/22/26 : assistant ne modifie jamais le canon ; permission refusée même si prompt insiste.

**AC données :** Pas de clé dans contexte/log ; sources révisionnées ; proposition conservée après panne ; transcript privé.

**AC résilience :** Fournisseur indisponible/cancelled/unknown sans corruption ni retry facturable aveugle ; reprise manuelle et erreur visible.

**Tests automatiques attendus :** CT-21/22/23/27/28/30/32/34/37/38/41 ; doubles fournisseur pour erreurs + essais d’intégration bornés au lot, jamais ici.

**Critères de sortie :** Parcours maladie de bout en bout produit une proposition exploitable puis fusion humaine ; changement de fournisseur ne change pas les permissions.

**Hors périmètre explicite :** Comité critique approfondi, vectoriel, agents multiples, mémoire globale interprojets et fusion IA.



### Lot 6 — MCP externe

**État :** implémentation locale réalisée et qualification en clôture ; réception humaine attendue. Autorisation distincte du 1er novembre 2026 après CI verte de 58ec5a9 ; arrêt avant Lot 7. Aucun fournisseur réel ou essai facturable.

**Objectif :** Exposer les mêmes lectures/propositions avec délégation révocable.

**Prérequis / dépendances :** Lots 0–4 et Lot 5 phase A reçus ; Spike C exécuté au début du Lot 6, OAuth local et clients préenregistrés qualifiés. Dérogation explicite du 1er novembre 2026 : phase B commerciale du Lot 5 différée, pas prérequise pour MCP local sans modèle. ADR-0008 reste partiellement validé, aucune approbation d’exposition publique ou de clients arbitraires.

**Exigences PRD couvertes :** OBJ-07, AI-07, AI-08, AI-SEC-02, SEC-14, NFR-12. Les exigences transversales continuent à être vérifiées dans les lots suivants.

**Tâches (ordre proposé) :** Adaptateur SDK MCP officiel versionné ; découverte et catalogue tools ; Streamable HTTP moderne ; OAuth resource metadata/consentement/token validation ; scopes/grants/projets ; limites ; audit humain/client/exécution ; politique compatibilité legacy selon preuve ; tests d’appel HTTP de contournement.

**Livrables :** Client externe autorisé lit puis soumet ; révocation et refus de merge observables.

**Risques :** Mauvaise audience, clientInfo falsifié, confused deputy, clients legacy incompatibles, cache tools partagé.

**AC fonctionnels et sécurité :** AC-01/06/07/08/15/20 : parité métier HTTP/MCP et refus dépassement ; aucun merge ou admin exposé.

**AC données :** Grant borné aux projets ; aucune identité fournie par le modèle acceptée comme autorité ; propositions révisionnées.

**AC résilience :** Perte connexion ne perd pas l’état métier ; retry idempotent ; révocation bloque appel suivant et job ancien.

**Tests automatiques attendus :** CT-17..20/27/30/31/32/40/41/43 ; matrice clients versionnés, malformed metadata, header mismatch et unsupported protocol.

**Critères de sortie :** Au moins un client visé prouvé compatible avec lecture/proposition et révocation ; mêmes invariants que web ; secrets absents.

**Hors périmètre explicite :** Transport local distribué grand public, resources/prompts supplémentaires, outils admin, merge automatique, plugins clients arbitraires.



### Lot 7 — Consolidation / production

**Objectif :** Prouver récupération, confidentialité et usage complet du MVP.

**Prérequis / dépendances :** Lots 0–6 ; GO-04 exploitation, rétention, accès opérateurs et risques résiduels validés.

**Exigences PRD couvertes :** OBJ-12, EXPORT-02, EXPORT-03, EXPORT-04, UX-06, UX-07, UX-09, UX-10, SEC-07, SEC-11, NFR-02, NFR-03, NFR-05, NFR-06, NFR-07, NFR-08. Les exigences transversales continuent à être vérifiées dans les lots suivants.

**Tâches (ordre proposé) :** Export archive complète versionnée Markdown/JSON/manifeste/hashes ; backups DB/objets/clés ; restauration isolée ; tests sécurité/charge/accessibilité ; alertes et métriques ; runbooks incident/rotation/révocation ; purge contrôlée ; documentation utilisateur ; corriger anomalies bloquantes.

**Livrables :** Dossier de preuves MVP, archive portable, restauration mesurée et procédures d’exploitation.

**Risques :** Sauvegarde illisible, fuite d’archive/log, objectif performance non mesuré, publication prématurée.

**AC fonctionnels et sécurité :** AC-01..22/24..26 selon périmètre MVP ; audit clavier et export autorisé ; aucune fuite sur snippets, fichiers ni logs.

**AC données :** Export contient références interprétables et schéma ; restore vérifie intégrité ; anciennes sessions/grants ne redeviennent pas valides.

**AC résilience :** RPO/RTO 24 h provisoires mesurés ; échecs stockage/file/fournisseur et récupération documentés ; aucune notification ancienne renvoyée involontairement.

**Tests automatiques attendus :** CT-01..49 pertinents ; campagne NFR ci-dessous ; restauration de backup réelle, tests de téléchargement révoqué et revue dépendances.

**Critères de sortie :** Tous MUST MVP tracés ont preuve ; aucun P0 ouvert ; acceptation humaine des risques résiduels ; conditions d’exploitation validées avant ouverture.

**Hors périmètre explicite :** Publication commerciale du livre, DOCX/EPUB, promesse SLA ferme sans mesures, réimport complet et toute fonction V1/V2+.



## Prototypes techniques et état d’exécution

Les protocoles initiaux restent ci-dessous. Le [Spike A est exécuté](SPIKE-A-REPORT.md), ADR-0007 accepté et Lot 1 explicitement autorisé. B-01..05 et B-07 autosave sont exécutés sur PostgreSQL ; B-06 et B-07 merge sont désormais exécutés au Lot 4 avec barrières, rollback, révocation et timeout réel. C exécuté au début du Lot 6 avec le client SDK officiel, sans modèle ni client commercial ; preuves dans le rapport Lot 6. Voir [rapport Lot 1](LOT-1-REPORT.md).

| Spike | Hypothèse / question | Protocole et métriques | Résultat attendu | Go / no-go |
|---|---|---|---|---|
| A — Éditeur et révisions | JSON Tiptap/ProseMirror suffit au MVP et peut initialiser Yjs sans perdre contenu ; quel diff riche fiable ? | Corpus français : paragraphes, marks/liens, listes, Unicode composé, emoji, dialogues, déplacements et suppressions ; sérialiser→sauver→recharger→restaurer→diff ; importer une fois en Y.Doc puis updates binaires et rechargement ; mesurer pertes de nœuds/marks, stabilité round-trip, lisibilité diff, latence/poids par taille | Conservation intégrale sous schéma choisi ; nouvelle révision à restore ; diff lisible ou fallback explicite ; continuité Y.Doc sans recréation répétée | GO si aucune perte d'information autorisée, round-trip stable après normalisation documentée et commentaires ambigus signalés ; NO-GO à perte silencieuse ou dépendance payante non validée ; objectifs de latence NFR mesurés, pas arbitrairement imposés |
| B — Fusion transactionnelle | Une transaction sous verrou projet protège état final, CAS et cardinalités | Jeu maladie : modifier scène r7→8 et personnage r3→4, créer événement et relation ; injecter échec sur chaque opération/snapshot/audit/outbox puis avant/après commit ; lancer écriture concurrente et révocation ; répéter merge après réponse perdue ; mesurer nombre de mutations partielles, doublons, conflits, attente de locks, retries | Soit toutes ressources + historique + mapping, soit aucun changement ; aucune approbation ancienne réutilisée | GO si zéro application partielle/doublon et tous conflits/révocations observés dans un ordre sérialisé ; NO-GO si invariant de graphe violé ou transaction dépend d'un effet externe |
| C — API ↔ MCP | Deux adaptateurs utilisent strictement les mêmes cas d'usage et erreurs | Même ReadScene/Search/CreateProposal via HTTP et client SDK MCP moderne ; token lecture seule puis proposant, projet non délégué, token révoqué, identité clientInfo falsifiée ; vérifier version/header/enveloppe ; qualifier le client SDK officiel local sans LLM sur 2026-07-28/2025-11-25 ; clients commerciaux différés par instruction explicite | Même résultat métier après retrait enveloppe/correlationId ; audit canal distinct et identité humaine/client fiable | GO si parité droits/résultats, refus interprojets et merge impossible, au moins un client cible compatible ; NO-GO si fallback élargit droits ou exige un second moteur métier |

### Complément obligatoire du spike B — scènes indépendantes et contention

**Statut :** premières mesures Lot 0 sur métadonnées, puis B-01..05 et B-07 autosave exécutés au Lot 1, [mesures et limites](measurements/LOT-1-CONTENTION.md). B-06 commit/rollback et B-07 merge/révocation/timeout exécutés au Lot 4 ; [résultats et limites](measurements/LOT-4-PROPOSALS.md). Le protocole initial ci-dessous est conservé ; l’[ADR-0010](adr/0010-atelier-ecriture-et-concurrence.md) explique pourquoi B-02 avec barrière partagée permet désormais le commit indépendant avant libération de T1. **Références :** risque R-CONT-01 de l'architecture, ADR-0003 et fiche GO-01. Hypothèse à éprouver : le verrou projet conserve l'intégrité mais peut empêcher un débit suffisant dès que plusieurs auteurs enregistrent des scènes distinctes.

| Cas | Écritures et synchronisation proposées | Oracle d'intégrité / objectif de mesure |
|---|---|---|
| B-01 Témoin séquentiel | Scènes A r7 et B r11 du même projet ; sauvegardes l'une après l'autre | A r8, B r12 ; établir durée hors contention et durée de détention du verrou |
| B-02 Deux scènes indépendantes | Deux connexions, une transaction par scène, chacune avec sa propre expectedRevision ; barrière de test maintient T1 après acquisition du verrou et démarre T2 avant libération | T2 attend ; après libération les deux commits réussissent sans conflit de révision artificiel ; A r8 et B r12, deux ChangeSets et aucun contenu perdu |
| B-03 Plusieurs scènes indépendantes | 1, 2, 4, 8 puis 16 auteurs de test, chacun sur une scène distincte du même projet ; série de tailles/cadences déclarées, fenêtres de mesure identiques | Aucune perte, duplication, famine ou refus CAS dû au seul compteur projet ; débit, attente et latence par auteur ; p50/p95/p99 et saturation |
| B-04 Scène partagée | Deux auteurs écrivent la même scène depuis la même révision avec arrivée synchronisée | Une réussite et un REVISION_CONFLICT, brouillon du perdant préservé ; comparer au cas B-02 sans confondre conflit légitime et contention |
| B-05 Témoin interprojets | Même charge et scènes indépendantes réparties entre projets distincts | Pas de blocage par un verrou projet commun ; distinguer saturation DB/pool de la barrière applicative |
| B-06 Merge contre autosave indépendant | Proposition touchant A/personnage/événement/relation ; autosaves B et C non ciblées pendant le merge ; injecter aussi échec avant commit | Attente possible mais ni perte ni conflit de version sur B/C ; merge complet ou rollback complet ; approbations et outbox cohérentes |
| B-07 Révocation et timeout | Révocation concurrente avec B-02/B-06 ; variante avec attente dépassant le timeout de test explicitement configuré | Ordre d'autorisation sérialisé ; erreur transitoire explicite si timeout, aucun acquittement trompeur ; retry borné avec même clé, pas de doublon |

**Paramètres à renseigner avant exécution :** versions PostgreSQL/API, CPU/RAM/disque, RTT, pool de connexions, taille des scènes/documents, nombre d'opérations par merge, durée/cadence d'autosave, nombre d'auteurs et durée de campagne. Les paliers proposés explorent la contention ; ils ne fixent pas une limite commerciale ni une capacité attendue. Le propriétaire doit désigner l'enveloppe de charge représentative avant la décision de qualification.

**Protocole :** synchroniser les transactions par barrières explicites du harness et observer les locks ; ne pas ordonner les tests à l'aide de sleeps. Conserver les horaires demande/acquisition/commit et résultats par opération. Mesurer attente et détention séparément ; publier aussi erreurs, retries et taux de sauvegardes confirmées, pour qu'un p95 apparemment bon ne masque pas les échecs. Répéter les cas après rollback et après réponse de commit perdue avec les mêmes clés.

**Go/no-go :** intégrité obligatoire dans tous les cas (zéro perte confirmée, zéro application partielle, zéro doublon, révocations respectées). La performance n'est qualifiée que sur une enveloppe déclarée : retour d'enregistrement/erreur selon NFR-04, lectures/recherche selon NFR-02/03, avec temps d'attente inclus et erreurs publiées. Si les scènes indépendantes ne respectent pas les cibles sous cette charge, ou si une famine/latence non bornée apparaît, **NO-GO pour généraliser cette granularité** : rapport de contention, option plus fine étudiée et ADR-0003 révisé avant généralisation du moteur de propositions. Sans enveloppe ni mesures, résultat « non qualifié », jamais « GO par défaut ».

Les preuves de spike sont versées dans un rapport ultérieur avec versions exactes, environnement, corpus, commandes, mesures et décision ADR. Si NO-GO, réviser le contrat/ADR avant développement du lot concerné ; jamais contourner la sécurité pour réussir une démonstration.

## Backlog résumé priorisé et couverture exhaustive

Le tableau associe chaque exigence à un lot principal ; les tests peuvent couvrir plusieurs lots. « Proposé » ne signifie pas accepté ni réalisé. P0 : sécurité/intégrité/identité/propositions/versions ; P1 : expérience MVP complète ; P2 : amélioration différable. Aucune date arbitraire.

| ID | Fonctionnalité | Exigence PRD | Lot | Priorité | Version | Dépendances | Risque | Critère d'acceptation | État de décision |
|---|---|---|---|---|---|---|---|---|---|
| BL-OBJ-01 | Permettre à un utilisateur de gérer plusieurs projets littéraires indépendants | OBJ-01 | 0 | P1 | MVP | GO-00..02 | Adoption / complexité | AC-01..12 | Proposé |
| BL-OBJ-02 | Permettre des projets individuels ou collaboratifs | OBJ-02 | 3 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-01..12 | Proposé |
| BL-OBJ-03 | Fournir un environnement de rédaction structuré en manuscrits, chapitres et scènes | OBJ-03 | 1 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-01..12 | Proposé |
| BL-OBJ-04 | Centraliser les informations relatives aux personnages, lieux et événements | OBJ-04 | 2 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-01..12 | Proposé |
| BL-OBJ-05 | Relier les éléments du manuscrit aux objets narratifs | OBJ-05 | 2 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-01..12 | Proposé |
| BL-OBJ-06 | Permettre l'activation progressive de modules spécialisés | OBJ-06 | 2 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-01..12 | Proposé |
| BL-OBJ-07 | Fournir à l'IA un accès contrôlé aux objets du projet, via l'application et MCP | OBJ-07 | 6 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-01..12 | Proposé |
| BL-OBJ-08 | Proposer, examiner et appliquer des changements multi-objets avec traçabilité | OBJ-08 | 4 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-01..12 | Proposé |
| BL-OBJ-09 | Prévenir les pertes de données et permettre la récupération des versions antérieures | OBJ-09 | 1 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-01..12 | Proposé |
| BL-OBJ-10 | Détecter et expliquer certaines incohérences narratives | OBJ-10 | 5 | P2 | MVP | Socle puis lots précédents | Adoption / complexité | AC-01..12 | Proposé |
| BL-OBJ-11 | Faciliter la collaboration simultanée sur le texte | OBJ-11 | V1 | P2 | V1 | MVP stabilisé | Adoption / complexité | AC-01..12 | Proposé |
| BL-OBJ-12 | Permettre l'export et la récupération des données dans des formats ouverts | OBJ-12 | 7 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-01..12 | Proposé |
| BL-MOD-01 | un projet peut activer ou désactiver un module autorisé. | MOD-01 | 2 | P0 | MVP | Socle puis lots précédents | Intégrité / confidentialité | AC-09 | Proposé |
| BL-MOD-02 | un module désactivé conserve ses données, sauf suppression explicitement demandée et autorisée. | MOD-02 | 2 | P0 | MVP | Socle puis lots précédents | Intégrité / confidentialité | AC-09 | Proposé |
| BL-MOD-03 | les références entre modules utilisent des identifiants stables. | MOD-03 | 2 | P0 | MVP | Socle puis lots précédents | Intégrité / confidentialité | AC-09 | Proposé |
| BL-MOD-04 | la désactivation d'un module ne doit pas invalider silencieusement les objets d'autres modules. | MOD-04 | 2 | P0 | MVP | Socle puis lots précédents | Intégrité / confidentialité | AC-09 | Proposé |
| BL-MOD-05 | un module peut déclarer ses dépendances fonctionnelles. | MOD-05 | 2 | P2 | MVP | Socle puis lots précédents | Intégrité / confidentialité | AC-09 | Proposé |
| BL-MOD-06 | les objets spécialisés reposent autant que possible sur des capacités transversales communes : propriétés, relations, recherche, versionnement, permissions. | MOD-06 | 2 | P2 | MVP | Socle puis lots précédents | Intégrité / confidentialité | AC-09 | Proposé |
| BL-MOD-07 | des modèles de projets peuvent présélectionner des modules selon le genre littéraire. | MOD-07 | 2 | P2 | MVP | Socle puis lots précédents | Intégrité / confidentialité | AC-09 | Proposé |
| BL-PROJ-01 | Créer un compte et ouvrir une session sécurisée | PROJ-01 | 0 | P0 | MVP | GO-00..02 | Intégrité / confidentialité | AC-01 | Proposé |
| BL-PROJ-02 | Créer plusieurs projets depuis un même compte | PROJ-02 | 0 | P0 | MVP | GO-00..02 | Intégrité / confidentialité | AC-01 | Proposé |
| BL-PROJ-03 | Rendre tout nouveau projet privé par défaut | PROJ-03 | 0 | P0 | MVP | GO-00..02 | Intégrité / confidentialité | AC-01 | Proposé |
| BL-PROJ-04 | Consulter les projets dont l'utilisateur est membre | PROJ-04 | 0 | P0 | MVP | GO-00..02 | Intégrité / confidentialité | AC-01 | Proposé |
| BL-PROJ-05 | Modifier les informations générales d'un projet | PROJ-05 | 0 | P0 | MVP | GO-00..02 | Intégrité / confidentialité | AC-01 | Proposé |
| BL-PROJ-06 | Inviter et retirer des membres selon les permissions | PROJ-06 | 3 | P0 | MVP | Socle puis lots précédents | Intégrité / confidentialité | AC-01 | Proposé |
| BL-PROJ-07 | Attribuer un rôle par projet | PROJ-07 | 3 | P0 | MVP | Socle puis lots précédents | Intégrité / confidentialité | AC-01 | Proposé |
| BL-PROJ-08 | Archiver un projet sans détruire immédiatement son contenu | PROJ-08 | 0 | P0 | MVP | GO-00..02 | Intégrité / confidentialité | AC-01 | Proposé |
| BL-PROJ-09 | Activer les modules disponibles | PROJ-09 | 2 | P0 | MVP | Socle puis lots précédents | Intégrité / confidentialité | AC-01 | Proposé |
| BL-PROJ-10 | Proposer des modèles de projets prédéfinis | PROJ-10 | 0 | P2 | MVP | GO-00..02 | Intégrité / confidentialité | AC-01 | Proposé |
| BL-EDIT-01 | Créer, renommer, déplacer et supprimer logiquement des manuscrits, chapitres et scènes | EDIT-01 | 1 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-02/03/04 | Proposé |
| BL-EDIT-02 | Modifier le texte d'une scène dans un éditeur adapté à l'écriture longue | EDIT-02 | 1 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-02/03/04 | Proposé |
| BL-EDIT-03 | Enregistrer automatiquement les modifications | EDIT-03 | 1 | P0 | MVP | Socle puis lots précédents | Intégrité / confidentialité | AC-02/03/04 | Proposé |
| BL-EDIT-04 | Restaurer une version antérieure d'une scène | EDIT-04 | 1 | P0 | MVP | Socle puis lots précédents | Intégrité / confidentialité | AC-02/03/04 | Proposé |
| BL-EDIT-05 | Réorganiser les scènes sans perdre leurs liens | EDIT-05 | 1 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-02/03/04 | Proposé |
| BL-EDIT-06 | Afficher le plan du manuscrit | EDIT-06 | 1 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-02/03/04 | Proposé |
| BL-EDIT-07 | Compter les mots au niveau scène, chapitre et manuscrit | EDIT-07 | 1 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-02/03/04 | Proposé |
| BL-EDIT-08 | Associer des personnages, lieux et événements à une scène | EDIT-08 | 2 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-02/03/04 | Proposé |
| BL-EDIT-09 | Ajouter des commentaires et notes | EDIT-09 | 3 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-02/03/04 | Proposé |
| BL-EDIT-10 | Proposer un mode de rédaction sans distraction | EDIT-10 | 1 | P2 | MVP | Socle puis lots précédents | Adoption / complexité | AC-02/03/04 | Proposé |
| BL-EDIT-11 | Gérer des statuts rédactionnels configurables | EDIT-11 | 1 | P2 | MVP | Socle puis lots précédents | Adoption / complexité | AC-02/03/04 | Proposé |
| BL-EDIT-12 | Comparer visuellement deux versions d'un texte | EDIT-12 | 1 | P2 | MVP | Socle puis lots précédents | Adoption / complexité | AC-02/03/04 | Proposé |
| BL-DATA-01 | Créer et modifier une fiche personnage | DATA-01 | 2 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-03/16 | Proposé |
| BL-DATA-02 | Créer et modifier une fiche lieu | DATA-02 | 2 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-03/16 | Proposé |
| BL-DATA-03 | Créer et modifier un événement | DATA-03 | 2 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-03/16 | Proposé |
| BL-DATA-04 | Créer des relations entre objets | DATA-04 | 2 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-03/16 | Proposé |
| BL-DATA-05 | Associer des objets à des scènes | DATA-05 | 2 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-03/16 | Proposé |
| BL-DATA-06 | Naviguer depuis un objet vers ses références | DATA-06 | 2 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-03/16 | Proposé |
| BL-DATA-07 | Rechercher les objets par nom, type et contenu | DATA-07 | 2 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-03/16 | Proposé |
| BL-DATA-08 | Conserver un historique des modifications | DATA-08 | 2 | P0 | MVP | Socle puis lots précédents | Intégrité / confidentialité | AC-03/16 | Proposé |
| BL-DATA-09 | Détecter les références devenues invalides | DATA-09 | 2 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-03/16 | Proposé |
| BL-DATA-10 | Ajouter des propriétés spécifiques à certains types d'objets | DATA-10 | 2 | P2 | MVP | Socle puis lots précédents | Adoption / complexité | AC-03/16 | Proposé |
| BL-DATA-11 | Afficher une chronologie simple des événements | DATA-11 | 2 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-03/16 | Proposé |
| BL-DATA-12 | Gérer les dates partielles, durées et contraintes temporelles complexes | DATA-12 | V1 | P1 | V1 | MVP stabilisé | Adoption / complexité | AC-03/16 | Proposé |
| BL-SEARCH-01 | rechercher dans le manuscrit et les fiches accessibles. | SEARCH-01 | 2 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-11 | Proposé |
| BL-SEARCH-02 | filtrer les résultats par projet et type d'objet. | SEARCH-02 | 2 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-11 | Proposé |
| BL-SEARCH-03 | ouvrir directement un résultat. | SEARCH-03 | 2 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-11 | Proposé |
| BL-SEARCH-04 | respecter les permissions dans les résultats, extraits et suggestions. | SEARCH-04 | 2 | P0 | MVP | Socle puis lots précédents | Intégrité / confidentialité | AC-11 | Proposé |
| BL-SEARCH-05 | afficher les objets liés à l'élément courant. | SEARCH-05 | 2 | P2 | MVP | Socle puis lots précédents | Adoption / complexité | AC-11 | Proposé |
| BL-SEARCH-06 | proposer une recherche sémantique et contextuelle. | SEARCH-06 | V1 | P2 | V1 | MVP stabilisé | Adoption / complexité | AC-11 | Proposé |
| BL-EXPORT-01 | exporter le texte du manuscrit en Markdown ou dans un autre format textuel ouvert documenté. | EXPORT-01 | 1 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-10 | Proposé |
| BL-EXPORT-02 | exporter les données structurées d'un projet dans un format machine lisible, avec identifiants et relations. | EXPORT-02 | 7 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-10 | Proposé |
| BL-EXPORT-03 | inclure dans l'export la version du schéma et une description des formats. | EXPORT-03 | 7 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-10 | Proposé |
| BL-EXPORT-04 | permettre l'export uniquement aux utilisateurs autorisés. | EXPORT-04 | 7 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-10 | Proposé |
| BL-EXPORT-05 | proposer des formats éditoriaux supplémentaires, notamment DOCX et EPUB. | EXPORT-05 | V1 | P2 | V1 | MVP stabilisé | Adoption / complexité | AC-10 | Proposé |
| BL-EXPORT-06 | permettre la réimportation d'une archive produite par la plateforme. | EXPORT-06 | V1 | P2 | V1 | MVP stabilisé | Adoption / complexité | AC-10 | Proposé |
| BL-COLLAB-01 | plusieurs utilisateurs peuvent participer au même projet. | COLLAB-01 | 3 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-04/08 | Proposé |
| BL-COLLAB-02 | les contributions sont attribuées à leur auteur. | COLLAB-02 | 3 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-04/08 | Proposé |
| BL-COLLAB-03 | les modifications concurrentes ne doivent pas écraser silencieusement des données. | COLLAB-03 | 1 | P0 | MVP | Socle puis lots précédents | Intégrité / confidentialité | AC-04/08 | Proposé |
| BL-COLLAB-04 | les commentaires peuvent être associés à un objet ou à un passage du manuscrit. | COLLAB-04 | 3 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-04/08 | Proposé |
| BL-COLLAB-05 | les permissions sont appliquées à toutes les interfaces, y compris API et MCP. | COLLAB-05 | 0 | P1 | MVP | GO-00..02 | Adoption / complexité | AC-04/08 | Proposé |
| BL-COLLAB-06 | plusieurs auteurs peuvent éditer simultanément une scène avec synchronisation en temps réel. | COLLAB-06 | V1 | P2 | V1 | MVP stabilisé | Adoption / complexité | AC-04/08 | Proposé |
| BL-COLLAB-07 | l'interface peut afficher la présence des autres contributeurs. | COLLAB-07 | V1 | P2 | V1 | MVP stabilisé | Adoption / complexité | AC-04/08 | Proposé |
| BL-COLLAB-08 | une notification informe les utilisateurs concernés des propositions, commentaires et validations. | COLLAB-08 | 3 | P2 | MVP | Socle puis lots précédents | Adoption / complexité | AC-04/08 | Proposé |
| BL-AI-01 | Interroger l'IA depuis le contexte d'un projet | AI-01 | 5 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-07/12/26 | Proposé |
| BL-AI-02 | Sélectionner un fournisseur/modèle pris en charge | AI-02 | 5 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-07/12/26 | Proposé |
| BL-AI-03 | Utiliser des identifiants de fournisseur configurés de manière sécurisée | AI-03 | 5 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-07/12/26 | Proposé |
| BL-AI-04 | Rechercher les scènes et objets pertinents pour une demande | AI-04 | 5 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-07/12/26 | Proposé |
| BL-AI-05 | Fournir à l'IA des références identifiables aux sources du projet | AI-05 | 5 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-07/12/26 | Proposé |
| BL-AI-06 | Permettre à l'IA de préparer une proposition multi-objets | AI-06 | 5 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-07/12/26 | Proposé |
| BL-AI-07 | Exposer un ensemble contrôlé d'opérations via MCP | AI-07 | 6 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-07/12/26 | Proposé |
| BL-AI-08 | Empêcher toute opération dépassant les permissions déléguées | AI-08 | 6 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-07/12/26 | Proposé |
| BL-AI-09 | Conserver la provenance des propositions IA | AI-09 | 5 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-07/12/26 | Proposé |
| BL-AI-10 | Afficher les modifications avant leur application | AI-10 | 5 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-07/12/26 | Proposé |
| BL-AI-11 | Imposer une validation humaine des propositions IA par défaut | AI-11 | 5 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-07/12/26 | Proposé |
| BL-AI-12 | Permettre de limiter les dépenses ou appels IA | AI-12 | 5 | P2 | MVP | Socle puis lots précédents | Adoption / complexité | AC-07/12/26 | Proposé |
| BL-AI-13 | Permettre l'annulation d'une opération IA en cours | AI-13 | 5 | P2 | MVP | Socle puis lots précédents | Adoption / complexité | AC-07/12/26 | Proposé |
| BL-AI-14 | Afficher les données transmises au fournisseur IA ou leur périmètre | AI-14 | 5 | P2 | MVP | Socle puis lots précédents | Adoption / complexité | AC-07/12/26 | Proposé |
| BL-AI-SEC-01 | les contenus narratifs ne doivent jamais être interprétés comme des instructions de sécurité ou d'autorisation. | AI-SEC-01 | 5 | P0 | MVP | Socle puis lots précédents | Intégrité / confidentialité | AC-18 | Proposé |
| BL-AI-SEC-02 | les autorisations sont appliquées indépendamment du contenu des prompts. | AI-SEC-02 | 6 | P0 | MVP | Socle puis lots précédents | Intégrité / confidentialité | AC-18 | Proposé |
| BL-AI-SEC-03 | les secrets et jetons ne doivent pas être inclus dans les contextes IA. | AI-SEC-03 | 5 | P0 | MVP | Socle puis lots précédents | Intégrité / confidentialité | AC-18 | Proposé |
| BL-AI-SEC-04 | les appels externes sont soumis à des limites et à une journalisation adaptées. | AI-SEC-04 | 5 | P0 | MVP | Socle puis lots précédents | Intégrité / confidentialité | AC-18 | Proposé |
| BL-AI-SEC-05 | les utilisateurs sont informés lorsque des contenus sont envoyés à un fournisseur IA tiers. | AI-SEC-05 | 5 | P0 | MVP | Socle puis lots précédents | Intégrité / confidentialité | AC-18 | Proposé |
| BL-PROP-01 | Créer une proposition contenant plusieurs opérations | PROP-01 | 4 | P0 | MVP | Socle puis lots précédents | Intégrité / confidentialité | AC-05/13/14 | Proposé |
| BL-PROP-02 | Associer une justification et un auteur à la proposition | PROP-02 | 4 | P0 | MVP | Socle puis lots précédents | Intégrité / confidentialité | AC-05/13/14 | Proposé |
| BL-PROP-03 | Conserver la version de base des objets modifiés | PROP-03 | 4 | P0 | MVP | Socle puis lots précédents | Intégrité / confidentialité | AC-05/13/14 | Proposé |
| BL-PROP-04 | Afficher les différences proposées avant fusion | PROP-04 | 4 | P0 | MVP | Socle puis lots précédents | Intégrité / confidentialité | AC-05/13/14 | Proposé |
| BL-PROP-05 | Vérifier les permissions à la création et à la fusion | PROP-05 | 4 | P0 | MVP | Socle puis lots précédents | Intégrité / confidentialité | AC-05/13/14 | Proposé |
| BL-PROP-06 | Vérifier les conflits de version avant fusion | PROP-06 | 4 | P0 | MVP | Socle puis lots précédents | Intégrité / confidentialité | AC-05/13/14 | Proposé |
| BL-PROP-07 | Appliquer de manière atomique les modifications interdépendantes | PROP-07 | 4 | P0 | MVP | Socle puis lots précédents | Intégrité / confidentialité | AC-05/13/14 | Proposé |
| BL-PROP-08 | Conserver un historique des validations et refus | PROP-08 | 4 | P0 | MVP | Socle puis lots précédents | Intégrité / confidentialité | AC-05/13/14 | Proposé |
| BL-PROP-09 | Permettre les commentaires de revue | PROP-09 | 4 | P0 | MVP | Socle puis lots précédents | Intégrité / confidentialité | AC-05/13/14 | Proposé |
| BL-PROP-10 | Permettre la révision d'une proposition | PROP-10 | 4 | P0 | MVP | Socle puis lots précédents | Intégrité / confidentialité | AC-05/13/14 | Proposé ; D08 |
| BL-PROP-11 | Détecter les impacts potentiels sur les objets liés | PROP-11 | 4 | P2 | MVP | Socle puis lots précédents | Intégrité / confidentialité | AC-05/13/14 | Proposé |
| BL-PROP-12 | Permettre l'approbation partielle d'une proposition | PROP-12 | V1 | P2 | V1 | MVP stabilisé | Intégrité / confidentialité | AC-05/13/14 | Proposé |
| BL-PROP-13 | Permettre des variantes narratives concurrentes | PROP-13 | V2+ | P2 | V2+ | MVP stabilisé | Intégrité / confidentialité | AC-05/13/14 | Proposé |
| BL-PROP-14 | Configurer des règles de fusion automatique | PROP-14 | V2+ | P2 | V2+ | MVP stabilisé | Intégrité / confidentialité | AC-05/13/14 | Proposé |
| BL-CRIT-01 | lancer une analyse sur une scène, un chapitre ou un manuscrit. | CRIT-01 | V1 | P1 | V1 | MVP stabilisé | Adoption / complexité | AC-23 | Proposé |
| BL-CRIT-02 | conserver les références aux éléments analysés. | CRIT-02 | V1 | P1 | V1 | MVP stabilisé | Adoption / complexité | AC-23 | Proposé |
| BL-CRIT-03 | distinguer observations objectives et interprétations. | CRIT-03 | V1 | P1 | V1 | MVP stabilisé | Adoption / complexité | AC-23 | Proposé |
| BL-CRIT-04 | présenter des suggestions sans les appliquer automatiquement. | CRIT-04 | V1 | P1 | V1 | MVP stabilisé | Adoption / complexité | AC-23 | Proposé |
| BL-CRIT-05 | convertir une suggestion en proposition de modification. | CRIT-05 | V1 | P1 | V1 | MVP stabilisé | Adoption / complexité | AC-23 | Proposé |
| BL-CRIT-06 | permettre de marquer un diagnostic comme accepté, ignoré ou résolu. | CRIT-06 | V1 | P2 | V1 | MVP stabilisé | Adoption / complexité | AC-23 | Proposé |
| BL-CRIT-07 | comparer les résultats avant et après correction. | CRIT-07 | V1 | P2 | V1 | MVP stabilisé | Adoption / complexité | AC-23 | Proposé |
| BL-CRIT-08 | éviter de répéter indéfiniment des critiques explicitement écartées par l'auteur. | CRIT-08 | V1 | P2 | V1 | MVP stabilisé | Adoption / complexité | AC-23 | Proposé |
| BL-UX-01 | permettre d'accéder à une scène depuis le tableau de bord du projet avec un nombre raisonnable d'actions. | UX-01 | 1 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-24 | Proposé |
| BL-UX-02 | distinguer visuellement les modifications enregistrées, en cours d'enregistrement et en erreur. | UX-02 | 1 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-24 | Proposé |
| BL-UX-03 | ne jamais masquer un échec d'enregistrement. | UX-03 | 1 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-24 | Proposé |
| BL-UX-04 | permettre de retrouver facilement les références d'un personnage ou d'un lieu. | UX-04 | 2 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-24 | Proposé |
| BL-UX-05 | rendre les opérations destructives explicites et confirmables. | UX-05 | 1 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-24 | Proposé |
| BL-UX-06 | proposer une interface utilisable au clavier pour les parcours essentiels. | UX-06 | 7 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-24 | Proposé |
| BL-UX-07 | proposer un mode clair et un mode sombre. | UX-07 | 7 | P2 | MVP | Socle puis lots précédents | Adoption / complexité | AC-24 | Proposé |
| BL-UX-08 | permettre de réduire les panneaux périphériques pendant la rédaction. | UX-08 | 1 | P2 | MVP | Socle puis lots précédents | Adoption / complexité | AC-24 | Proposé |
| BL-UX-09 | permettre une personnalisation raisonnable des vues et des raccourcis. | UX-09 | 7 | P2 | MVP | Socle puis lots précédents | Adoption / complexité | AC-24 | Proposé |
| BL-UX-10 | prévoir une architecture internationalisable, avec le français comme langue initiale possible. | UX-10 | 7 | P2 | MVP | Socle puis lots précédents | Adoption / complexité | AC-24 | Proposé |
| BL-SEC-01 | authentifier les utilisateurs avant tout accès privé. | SEC-01 | 0 | P0 | MVP | GO-00..02 | Intégrité / confidentialité | AC-01/08/15 | Proposé |
| BL-SEC-02 | appliquer les permissions côté serveur sur chaque opération. | SEC-02 | 0 | P0 | MVP | GO-00..02 | Intégrité / confidentialité | AC-01/08/15 | Proposé |
| BL-SEC-03 | empêcher tout accès interprojets non autorisé. | SEC-03 | 0 | P0 | MVP | GO-00..02 | Intégrité / confidentialité | AC-01/08/15 | Proposé |
| BL-SEC-04 | vérifier également les permissions lors de la recherche, de l'export, des traitements IA et des accès MCP. | SEC-04 | 0 | P0 | MVP | GO-00..02 | Intégrité / confidentialité | AC-01/08/15 | Proposé |
| BL-SEC-05 | permettre la révocation des sessions et accès externes. | SEC-05 | 0 | P0 | MVP | GO-00..02 | Intégrité / confidentialité | AC-01/08/15 | Proposé |
| BL-SEC-06 | proposer l'authentification multifacteur. | SEC-06 | 0 | P2 | MVP | GO-00..02 | Intégrité / confidentialité | AC-01/08/15 | Proposé |
| BL-SEC-07 | chiffrer les communications réseau. | SEC-07 | 7 | P0 | MVP | Socle puis lots précédents | Intégrité / confidentialité | AC-01/08/15 | Proposé |
| BL-SEC-08 | protéger les secrets et clés API au repos. | SEC-08 | 5 | P0 | MVP | Socle puis lots précédents | Intégrité / confidentialité | AC-01/08/15 | Proposé |
| BL-SEC-09 | exclure les secrets des journaux applicatifs. | SEC-09 | 0 | P0 | MVP | GO-00..02 | Intégrité / confidentialité | AC-01/08/15 | Proposé |
| BL-SEC-10 | limiter les données personnelles et contenus narratifs collectés dans les journaux. | SEC-10 | 0 | P0 | MVP | GO-00..02 | Intégrité / confidentialité | AC-01/08/15 | Proposé |
| BL-SEC-11 | prévoir des sauvegardes et vérifier leur restauration. | SEC-11 | 7 | P0 | MVP | Socle puis lots précédents | Intégrité / confidentialité | AC-01/08/15 | Proposé |
| BL-SEC-12 | assurer la traçabilité des modifications importantes. | SEC-12 | 0 | P0 | MVP | GO-00..02 | Intégrité / confidentialité | AC-01/08/15 | Proposé |
| BL-SEC-13 | protéger l'éditeur et les rendus contre les contenus actifs malveillants. | SEC-13 | 1 | P0 | MVP | Socle puis lots précédents | Intégrité / confidentialité | AC-01/08/15 | Proposé |
| BL-SEC-14 | prévoir des limites d'usage et de débit sur les API exposées. | SEC-14 | 6 | P0 | MVP | Socle puis lots précédents | Intégrité / confidentialité | AC-01/08/15 | Proposé |
| BL-NFR-01 | Aucun enregistrement confirmé ne doit être perdu silencieusement | NFR-01 | 1 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-25 | Proposé |
| BL-NFR-02 | Réponse p95 inférieure à 500 ms pour les lectures métier simples, hors IA | NFR-02 | 7 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-25 | Proposé |
| BL-NFR-03 | Réponse p95 inférieure à 2 s sur un projet de référence de 10 000 objets, hors génération IA | NFR-03 | 7 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-25 | Proposé |
| BL-NFR-04 | Retour visible d'enregistrement ou d'erreur dans un délai cible de 2 s en conditions normales | NFR-04 | 1 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-25 | Proposé |
| BL-NFR-05 | Sauvegardes automatisées et test de restauration documenté | NFR-05 | 7 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-25 | Proposé |
| BL-NFR-06 | Objectif initial de 99,5 % après stabilisation de la version de production | NFR-06 | 7 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-25 | Proposé |
| BL-NFR-07 | Export complet des données métier essentielles dans des formats documentés | NFR-07 | 7 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-25 | Proposé |
| BL-NFR-08 | Viser WCAG 2.2 AA pour les parcours principaux | NFR-08 | 7 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-25 | Proposé |
| BL-NFR-09 | Traces techniques et métriques sans exposition inutile des manuscrits | NFR-09 | 0 | P1 | MVP | GO-00..02 | Adoption / complexité | AC-25 | Proposé |
| BL-NFR-10 | Tests automatisés des règles métier et des permissions | NFR-10 | 0 | P1 | MVP | GO-00..02 | Adoption / complexité | AC-25 | Proposé |
| BL-NFR-11 | Ajout de nouveaux types d'objets et modules sans refonte du socle | NFR-11 | 2 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-25 | Proposé |
| BL-NFR-12 | API métier documentée et intégration MCP versionnée | NFR-12 | 6 | P1 | MVP | Socle puis lots précédents | Adoption / complexité | AC-25 | Proposé |


La révision de proposition PROP-10 est MUST depuis accord explicite du 31 octobre 2026 ; sa priorité de réalisation reste P0. La [proposition PRD](PRD-ALIGNMENT-PROPOSAL.md) sépare le patch des huit lots de sa promotion éventuelle en MUST. La réservation des coûts est un contrôle P0 AI-SEC-04/TH-11 ; l'interface commerciale AI-12 reste différable. Le transfert de propriété est un parcours administratif séparé, pas une opération de proposition.

## Qualification des performances et de la production

Campagne proposée : corpus versionné de 10 000 objets par projet avec scènes longues représentatives, liens, commentaires et propositions ; annoncer matériel, versions DB/API, index, stockage, latence réseau, warm/cold et nombre de clients. Balayer charge puis publier p50/p95/p99, erreurs, contention, débit et saturation, sans inventer une capacité garantie. Mesurer séparément lectures simples NFR-02 (<500 ms p95), recherche NFR-03 (<2 s p95), retour save NFR-04 (2 s cible), hors IA ; coût IA et durée IA séparés. Vérifier NFR-06 99,5 % seulement sur fenêtre de mesure et périmètre de service défini après stabilisation, pas par test ponctuel. WCAG 2.2 AA visé : clavier, focus, contrastes, labels, erreurs, lecteurs d'écran et alternative textuelle aux vues ; audit mixte automatisé/manuel, référentiel W3C à vérifier au lot 7.

## Registre des décisions ouvertes du PRD

| Question | Proposition / alternative crédible | Échéance |
|---|---|---|
| Q-01 SaaS / auto-hébergement | Conteneurisable ; un mode supporté initialement, SaaS simple vs auto-hébergement contrôlé | Avant lot 0 |
| Q-02 langue | Français initial, clés internationalisables ; autre langue selon besoin | Non bloquant, avant parcours lot 1 |
| Q-03 permissions | Rôles projet et matrice sécurité ; ACL par scène V1 si besoin | Avant lot 0 |
| Q-04 propriété collective | Un owner ; transfert atomique vers membre actif après réauth ; co-propriété exclue MVP | Avant lot 3 pour transfert, owner unique avant lot 0 |
| Q-05 fournisseurs | OpenAI/Anthropic étudiés ; choisir modèles/versions testés, pas promettre disponibilité | Avant lot 5 |
| Q-06 clés | Personnelles chiffrées ; alternative clés projet après politique budget/accès | Avant lot 5 |
| Q-07 format | JSON ProseMirror proposé ; alternative Markdown ; spike A | Avant lot 1 |
| Q-08 rétention | Durées versions/audit/conversations/backups à définir sans purge automatique anticipée | Avant lot 7 |
| Q-09 quotas/tarification | Points de contrôle et limites techniques ; tarification hors périmètre | Budgets techniques avant lot 5 ; commercial non bloquant |
| Q-10 invité sans compte | Non MVP ; invitation exige identité vérifiée | Avant lot 3 |
| Q-11 offline | Non MVP ; brouillon préservé dans la session | Non bloquant |
| Q-12 mobile natif | Non MVP ; web utilisable | Non bloquant |
| Q-13 modèles de genres | Après socle, SHOULD/COULD, aucune obligation avant lot 0 | Non bloquant |
| Q-14 séries/univers | Multi-manuscrits dans un projet dès MVP ; partage interprojets V1/V2 à décider | Non bloquant MVP |
| Q-15 diffusion IA | Consentement explicite par fournisseur/périmètre ; aucun envoi implicite | Avant lot 5 |

## Alternatives, risques et décisions proposées

Commencer par IA donnerait une démo rapide mais laisserait persistance et sécurité non prouvées. Les dépendances choisies font émerger un parcours humain complet avant toute écriture déléguée. Le principal coût est le moteur de propositions, puis l'intégration OAuth. Sans effectifs, budget et objectifs de charge, aucune estimation calendaire ni promesse SLA. Les risques résiduels et choix persistants doivent être validés au plus tard avant leur lot, sans bloquer toute conception en attendant.

## Critères d'acceptation du document

Exactement Lots 0–7 avec objectif, prérequis, exigences, tâches, dépendances, risques, livrables, AC fonctionnels/sécurité/données/résilience, tests et sortie ; chaque MUST MVP du registre a un lot numérique ; chaque MUST V1 reste hors lot MVP ; trois protocoles de spikes et leurs preuves séparées dans les rapports ; AC-01..12 conservés et complétés ; Q-01..15 visibles ; pas de calendrier inventé.

## Décisions requérant validation humaine avant implémentation

Les [décisions GO-00 à GO-02](HUMAN-DECISIONS.md) sont validées dans la portée indiquée le 31 octobre 2026 ; le verrou projet reste provisoire et les autres décisions restent ouvertes.

| Classe | ID | Décision concrète proposée | Preuve / alternatives |
|---|---|---|---|
| BLOQUANTE AVANT LOT 0 | GO-00 | Valider le PRD provisoire comme base et le découpage en huit lots, sans extension MVP | D01–D08, matrice et plan |
| BLOQUANTE AVANT LOT 0 | GO-01 | Monolithe modulaire + PostgreSQL, révisions/CAS, transactions et verrou projet proposés | ADR-0001/0003/0006 ; services ou base documents comparés |
| BLOQUANTE AVANT LOT 0 | GO-02 | Rôles projet, valeurs merge/export/self-approval, owner unique ; IdP/OIDC et mode d'hébergement supporté | D09, matrice sécurité, ADR-0002/0008 ; fournisseur concret non choisi faute de contrainte |
| À VALIDER AVANT LE LOT CONCERNÉ | GO-03 | Éditeur après spike A (lot 1) ; schémas/modules (lot 2) ; invitations/transfert (lot 3) ; politique propositions/spike B (lot 4) ; fournisseurs, clés, consentement/budget (lot 5) ; OAuth/clients/spike C (lot 6) | ADR-0004/0005/0007/0008, Q-04..07/15 |
| À VALIDER AVANT LE LOT CONCERNÉ | GO-04 | Exploitation, rétention/purge, objectifs de restauration, risques opérateur/fournisseur et accès d'urgence | Lot 7 ; aucun risque élevé accepté par défaut |
| NON BLOQUANTE | GO-05 | UI secondaire, genre templates, séries/univers interprojets, calendriers avancés, moteur CRDT et commercialisation | V1/V2+ ou après mesure ; aucune décision inventée faute de besoin |
