# Rapport de réalisation du Lot 3

**Statut :** implémentation et vérifications locales terminées ; réception humaine attendue. **Date :** 31 octobre 2026. **Références :** [décisions](HUMAN-DECISIONS.md), [ADR-0012](adr/0012-collaboration-asynchrone-et-ancrages.md), [plan](IMPLEMENTATION-PLAN.md), [mesures](measurements/LOT-3-COLLABORATION.md), [inventaire des fichiers](LOT-3-FILES.txt).

## Autorisation et réserves héritées

Départ Git propre sur `6a5864165e7db1fedfc8e10fbe96f2bb0323289d`, Lot 2. [CI GitHub 41231438707](https://github.com/ZA512/StoryMaster/actions/runs/41231438707) vérifiée terminée avec succès avant implémentation, jobs validate et spike-a. L’instruction du propriétaire autorise le Lot 3 complet et reçoit techniquement le Lot 2 **avec toutes ses réserves maintenues ouvertes** : validation de sa CI, revue ergonomique manuelle incomplète, brouillons non confirmés uniquement en mémoire, contention/performance seulement locales, absence de qualification publique. Le succès constaté de cette CI ne clôt pas automatiquement la réserve humaine correspondante.

Les 150 identifiants, textes, priorités et affectations aux huit lots sont conservés ; PRD, registre des exigences, backlog et matrice ne changent pas. Aucun SMTP, coédition/CRDT, assistant, moteur de propositions ou serveur MCP ajouté. Lot 4 non commencé et non autorisé ; Yjs reste dans le laboratoire isolé.

## Fonctionnement livré

**Collaborateurs** dans le projet/atelier : liste paginée des membres, rôles, invitations, copie d’un lien, historiques, changement de rôle, révocation, retrait et départ volontaire hors owner. Owner unique protégé ; admin limité à author/reviewer/reader et incapable de cibler owner/admin. Les actions sensibles demandent confirmation. Pas de transfert de propriété implicite.

Invitation opaque, jeton aléatoire 256 bits, hash SHA-256 seul en DB, échéance configurable 48 h par défaut (bornes techniques 5 min–7 jours), état pending/accepted/revoked/expired. Le destinataire ouvre un lien privé, se connecte via l’IdP avec l’email vérifié correspondant et accepte/refuse. L’identité reste issuer/subject. Email de profil ou fourni par le navigateur ne vaut jamais preuve. Les anciennes sessions sans attestation exigent une reconnexion. Refus = revoked/recipient_declined ; expiration dérivée de l’échéance.

Lien révélé une seule fois ; réponse de création perdue : révoquer/recréer. Fragment retiré immédiatement, préparation same-origin sans recherche de données, cookie temporaire AES-GCM HttpOnly/SameSite=Lax/Secure hors local, callback fixe sans secret. Tentatives limitées ; aucune donnée narrative au stade anonyme, aucun hash dans DTO/historique, aucun token brut en idempotence ou logs. Le lien se transmet par canal privé au destinataire, sans capture ou ticket public. Aucun envoi d’email par StoryMaster.

Dans l’atelier : sélectionner un passage puis commenter, ou créer une discussion globale dans le panneau discret sous le texte. Reviewer sélectionne dans l’éditeur en lecture seule ; reader consulte sans commenter. Bible : mêmes discussions sur personnages, lieux et événements. Fils paginés, réponses, résolution/réouverture, édition de son message, retrait logique et historique attribué. Le retrait d’autrui exige owner/admin et un motif. Historique des corps réservé à l’auteur encore membre et aux modérateurs. Archives/renommages/modules off conservent discussions et navigation par ID ; projet archivé reste en lecture seule.

## Ancrages et sauvegarde

Origine immuable : scène/révision, positions ProseMirror UTF-16, citation, contextes calculés sur snapshot serveur, auteur/date. Résolution actuelle séparée et étiquetée par révision : valid/relocated ou ambiguous/orphaned avec positions nulles. La version d’origine reste lisible selon les droits. Alignements optimaux sans correspondance concurrente, ou bloc complet inchangé unique et compatible ; **aucune recherche de sous-chaîne seule ne justifie une position certaine**. Budgets 250 000 cellules LCS/20 000 tokens matérialisés ; refus conservateur au-delà sans preuve de bloc. Aucune promesse que tout passage soit relocalisé.

Commentaires hors JSON ProseMirror ; aucune révision de scène ou fiche incrémentée par leur mutation. Sélection sur texte éditable : confirmation de la sauvegarde et génération inchangée avant ancrage. Surlignage décoratif uniquement sur le texte confirmé de la révision correspondante, jamais sur un brouillon ou une position incertaine. Les erreurs et conflits gardent les champs non publiés ; une réponse sur base périmée exige une relecture explicite, sans rebase silencieux. Les brouillons restent en mémoire, sans garantie après crash/fermeture.

## Transactions et révocation

Services communs CollaborationService/EditorialService/NarrativeService ; aucun SQL narratif dans les routes. Origin/CSRF, corps fermés, idempotence et If-Match selon la ressource ; commentaire modifié avec sa propre révision et expectedThreadRevision. Toute écriture IA directe est refusée, même sous identité owner.

Droits/invitations : Project exclusif, invitations triées puis membership si mutation mixte, idempotence, écritures/historique/audit. Commentaires : Project partagé puis Thread ; autosave : Project partagé puis Scene exclusif. Aucun upgrade de Project ni appel externe sous transaction. Session et rôle relus après attente de la barrière. Contraintes composites de projet, ancres/historiques append-only pour le rôle applicatif et snapshots de collaboration exacts obligatoires au commit.

Un commentaire engagé avant retrait peut committer et reste attribué ; aucun nouvel appel ne passe après le commit du retrait, même avec session valide. L’accès aux autres projets est conservé. Changement de rôle/retrait/départ révoque atomiquement les invitations pending liées aux adresses du membre, y compris contre un autre subject au même email. Admin ne révoque pas indirectement une invitation admin : intervention owner requise. Ancienne invitation acceptée ne réactive jamais un accès retiré ; réinvitation explicite postérieure possible. L’invitant doit encore disposer des droits au moment d’accepter.

## Migration et données existantes

Migration additive **0005-collaboration.sql**, anciennes migrations intactes, rejeu et empreinte protégés. Test réel depuis une base 0004 remplie, puis application au volume existant sans reset/suppression. [Empreintes avant/après versionnées](measurements/LOT-3-MIGRATION.json) : 87 projets, **121 scènes, 337 snapshots**, 41 fiches, 6 relations, 28 références, 398 snapshots narratifs, 261 activations et 106 appartenances identiques sur leurs champs préexistants. Les comparaisons portent sur les lignes ordonnées et leur SHA-256, pas seulement les comptes. Migration ensuite figée ; toute correction SQL ultérieure doit être une nouvelle migration.

Les appartenances anciennes reçoivent une provenance système explicite, jamais un faux auteur humain. Anciennes sessions sans email vérifié restent non attestées. Le test de redémarrage conserve texte/hash/snapshot/références/module off, invitation pending, fils/messages/attribution et ancre ; le destinataire accepte ensuite l’invitation persistée via Keycloak réel.

## Validations effectivement exécutées

| Contrôle | Résultat local |
|---|---|
| `npm run typecheck` | Réussi, packages/API et web |
| `npm run lint` | Réussi, ESLint, architecture et quatre générateurs en --check |
| `DOCUMENT_PYTHON=… npm test` | **111 tests passés**, aucun échec ni skip ; Lots 0–3, vraie PostgreSQL |
| Réponses HTTP réellement observées | **34 réponses Lot 3**, plus suites HTTP Lots 0–2, conformes à OpenAPI ; aucune fixture présentée comme exécution |
| `python scripts/validate_specifications.py` | Réussi : JSON/YAML, JSON Schema, OpenAPI, MCP, 150 exigences/100 MUST MVP, contenu/valeurs/traçabilité/lots/liens |
| `python -m unittest discover -s scripts/tests -v` | **34 tests documentaires passés**, distincts des tests produit |
| Docker build / `up -d --wait` | Réussis, API/web reconstruites, quatre services sains, disque vérifié (~40 Go libres) |
| `bench:contention`, `bench:scenes`, `bench:narrative` | Rejoués avec succès, aucune perte/erreur ; corpus narratif 10 000 objets |
| `bench:collaboration` | 112 mutations mixtes + 24 lectures, intégrité exacte ; 20 lectures d’ancre sur scène longue |
| `npm run test:e2e` | **13 parcours passés**, aucun échec ni skip ; Lots 0–3, Keycloak réel, clavier, Axe et redémarrage |
| Migration et persistance | Empreintes exactes conservées, rejeu, base 0004 remplie, redémarrage sans suppression de volume |
| `git diff --check` | Réussi |

Les tests PG couvrent expiration/refus/revocation, huit acceptations simultanées, identité/emails, propriétaire/admin, réinvitation, IA refusée, interprojets, curseurs, commentaires/états/modération/historiques, CAS du fil, contraintes DB et rollback. Courses forcées : retrait avant commentaire/autosave/ancienne acceptation ; commentaire avant retrait ; acceptation et révocation d’invitation dans les deux ordres. Contrôles OIDC ajoutés : email_verified false et chaîne "true" n’attestent aucun email.

Le parcours Alice/Bob valide invitation UI, fragment effacé, bon email IdP, acceptation, sélection et publication clavier en lecture seule sans PUT canonique, déplacement certain puis passage absent, version historique lisible, réponse/résolution, retrait et refus 404 malgré /me=200. Le parcours fiche vérifie réponse POST perdue/reprise avec même clé et un seul fil, conflit 412 de réponse avec texte conservé puis base relue explicitement, renommage/archive/module off et historique. Axe sans violation détectée sur membres et discussion ; mobile 390 px sans débordement. Captures inspectées en desktop/mobile ; cette couverture ne vaut pas audit UX complet.

Les huit tests d’ancrage couvrent Unicode, insertion avant/interne, suppression/réécriture, déplacement, passages identiques, marques segmentées, blocs multiples, restauration et dépassement des budgets. Les CT-02/06/36/49 sont exercés sur leurs parcours humains ; CT-20/30/45 seulement sur les portions session/membership/audit/concurrence du lot, **sans grants MCP ni merge de propositions**. [Scénarios déclaratifs](spec/lot3-scenarios.json) distincts des preuves exécutables.

## Mesures et risques restant ouverts

[Mesure détaillée](measurements/LOT-3-COLLABORATION.md) et [résultats bruts](measurements/LOT-3-COLLABORATION.json) : 112 mutations en 692,7 ms sur cette rafale locale ; autosave p95 45,276 ms, réponse p95 47,118 ms, lecture de fil p95 50,544 ms. Administration : attente exclusive maximale **561,532 ms**, détention maximale 9,690 ms. R-CONT-01 reste ouvert : une lecture/ancre ou des transactions partagées peuvent retarder les changements de droits ; aucune borne de révocation avant commit, charge soutenue ou capacité publique garantie.

Scène longue : 939 986 caractères/1 000 paragraphes, ancre à la position 895 760, vingt lectures p95 65,014 ms. Positions exactes vérifiées, origine immuable ; ce cas ne prouve pas toutes les transformations littéraires. Une correspondance textuelle déterministe ne prouve pas l’intention narrative.

Les captures desktop/mobile ont été inspectées ; contrôles Axe et clavier ciblés dans la suite. Cette revue partielle ne clôt pas la réserve d’audit ergonomique manuel complet. Brouillons en mémoire, RLS non activée, exploitation publique/TLS/sauvegardes/restauration et révocation globale IdP restent des limites héritées. Les données déjà reçues par un navigateur ne sont pas effaçables à distance.

## Anomalies corrigées et limites des campagnes

Correction du paramètre SQL de session, parsing du cookie d’invitation, effacement du contexte après ouverture, cohérence fil/racine à la lecture, rejeu idempotent ne réexposant pas un corps retiré, bornage des ancres sur longs textes, contraste des états et invalidation des liens antérieurs aux changements de droits. Les erreurs de sélecteurs Playwright (labels et deux listes de membres) ont été corrigées ; elles ne constituaient pas une perte de champs. Une attente OIDC undefined a été corrigée vers le null contractuel, sans autoriser les emails non vérifiés.

Une campagne intermédiaire a été interrompue car le test navigateur de redémarrage avait été lancé en parallèle des tests PostgreSQL. Elle n’est pas comptée comme validation réussie ; suites relancées successivement. Aucun reset de volume principal. La CI versionnée exécute ces étapes successivement.

## Fichiers modifiés et réception humaine

[Inventaire complet](LOT-3-FILES.txt). Domain/contracts : entités, permissions et entrées/DTOs ; application : port/service et barrières ; infrastructure : migration/store/sessions ; API : routes et callback ; web : membres/invitation/discussions et intégration atelier/bible ; scripts/tests : générateur, validateur, concurrence, migration, HTTP, navigateur et mesures ; documentation/CI/Compose/env : contrats, décisions, sécurité, traçabilité et instructions reproductibles. Aucune dépendance CRDT/SMTP ajoutée.

La GitHub Action est actualisée pour les Lots 0–3 et bench:collaboration. **Aucun nouveau commit envoyé ni nouvelle CI distante exécutée** pour ce travail : le succès GitHub observé concerne exclusivement 6a58641. Les validations locales ne sont pas présentées comme une CI distante verte.

À valider par le propriétaire : réception du Lot 3 et des choix d’exécution ADR-0012 (politique de modération/historique, invitation et invalidation, règles conservatrices d’ancrage). Aucune acceptation automatique d’ADR-0004 ni fermeture de réserves héritées. L’autorisation du Lot 4 reste une décision explicite distincte ; arrêt à cette livraison.

## Critères d'acceptation du document

Commandes et résultats réels distingués des contrats/scénarios ; fichiers et anomalies identifiés ; intégrité/persistance prouvées au-delà des décomptes ; mesures locales et réserves explicites ; réception humaine et arrêt avant Lot 4 sans décision implicite.
