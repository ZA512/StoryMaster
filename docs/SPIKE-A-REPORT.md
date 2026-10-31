# Spike A — éditeur, stockage et révisions

**Date :** 31 octobre 2026, Europe/Paris. **Statut :** prototype isolé exécuté ; **GO technique proposé pour JSON ProseMirror versionné**, décision ADR-0007 en attente du propriétaire. Aucun début d’implémentation de production du Lot 1.

**Références :** [prototype et commandes](../spikes/editor/README.md), [plan](IMPLEMENTATION-PLAN.md), [ADR-0007](adr/0007-stockage-editeur-et-diff.md), [réception et décisions](HUMAN-DECISIONS.md), [mesures brutes](SPIKE-A-MEASUREMENTS.json), [preuves navigateur](SPIKE-A-BROWSER.json).

## Réception du Lot 0 et protection de l’existant

Départ sur `ea27725a470233882a558a6575e274b7771e7d1a`, arbre Git propre. Les quatre services locaux sont sains. La [GitHub Action de ce commit](https://github.com/ZA512/StoryMaster/actions/runs/41148886995), événement push, est terminée avec **success** : documentation, lint, TypeScript, environnement Compose, PostgreSQL, contention et navigateur. L’accord de réception conditionnel du propriétaire est enregistré dans HUMAN-DECISIONS ; GO-00..02 et PROP-10 ne changent pas.

La suite locale du Lot 0 est rejouée : 25 tests réussis sur sa base dédiée `storymaster_test`. Aucun reset de la base applicative `storymaster`, aucun volume persistant supprimé, aucun changement d’authentification, de permissions ou de route du Lot 0. Les 150 exigences et priorités du registre restent identiques. Ses limites demeurent : verrou projet provisoire, absence de RLS, révocation IdP non globale, exploitation publique/backups futurs et charge non qualifiée. Le spike A ne résout pas ces réserves ni le spike B.

Le disque affiche environ 43 Go disponibles avant et après cette passe. Le nouveau conteneur utilise l’image PostgreSQL déjà présente et un **tmpfs limité à 1 Gio**, sur 127.0.0.1:55433. Les dépendances isolées occupent environ 83 Mio et le bundle environ 1 Mio. Aucun build d’image applicative volumineux nécessaire.

## Prototype livré et périmètre

`spikes/editor` possède ses propres manifests, lockfile et dépendances ; il est hors des workspaces applicatifs et exclu des images Docker. Le contrôle d’architecture interdit son introduction, ou celle de Yjs, dans les dépendances applicatives du MVP. Le serveur de laboratoire écoute exclusivement sur 127.0.0.1:3100, sur corpus fictif, avec Origin exact pour les écritures. **Ce n’est pas un serveur de production authentifié.**

Le navigateur permet d’éditer les contenus autorisés avec Tiptap, d’appliquer les marks, de déplacer un bloc, de sauvegarder dans PostgreSQL, de recharger, de parcourir/restaurer une révision et de comparer les versions. Les conflits gardent le brouillon. Une scène fictive stable conserve son historique entre redémarrages du serveur Node tant que la base en mémoire existe.

L’enveloppe de laboratoire est `{format:"storymaster-scene-spike",schemaVersion:2,doc:...}`. Son ancien schéma v1 strong/em est **fictif**, destiné à éprouver une migration explicite vers bold/italic. Aucun contenu historique de production n’utilise ce schéma. Le contrat existant `Scene.contentFormatVersion:1` et `Scene.content:RichDocument` reste inchangé ; le résultat recommande ce modèle JSON versionné, sans imposer les numéros expérimentaux au futur contrat.

Le store expérimental ne remplace pas les services métier : il ne contient ni appartenance projet, audit complet, barrière projet, ni idempotence de production. Ces garanties devront être reprises des fondations au Lot 1 après autorisation. Aucune table de scène, route d’éditeur, coédition, IA, MCP ou proposition n’est ajoutée aux applications.

## Corpus et normalisation

Six documents versionnés dans [documents.json](../spikes/editor/corpus/documents.json), contrôlés contre le générateur :

| Corpus | Contenu et risque éprouvé |
|---|---|
| empty | Document vide, paragraphes vides |
| rich | Titres, paragraphes, listes imbriquées/numérotées, citations, dialogues, hardBreak, gras/italique/barré/lien avec titre, texte littéral ressemblant à un script |
| unicode | Accents NFC et NFD distincts, emoji/ZWJ, drapeaux, caractères supplémentaires, arabe, chinois et apostrophe typographique |
| repeated | Blocs répétés et ambiguïté de mouvement |
| markSpaces | Gras appliqué aussi aux espaces de bordure |
| doubleBreak | Deux sauts de ligne forcés consécutifs |

Le générateur ajoute des documents de 8, 128, 1 024 et 3 000 blocs uniques, tous Unicode et formatés. Ce sont des tailles synthétiques déclarées, pas une distribution d’usage observée ; 3 000 blocs constituent un cas de stress très long pour une scène. Le JSON le plus grand mesure environ 1,17 Mo et le texte 542 999 unités UTF-16.

Normalisation déterministe : racine doc vide convertie en un paragraphe vide ; ordre des marks selon le schéma ; attributs par défaut explicites ; regroupements de texte équivalents effectués par ProseMirror ; objets JSON sans particularité de prototype JavaScript. **Aucune conversion NFC/NFD, suppression d’espaces ou réécriture de ponctuation.** Les anciennes marques strong/em sont migrées explicitement, sans modifier l’objet source ; version inconnue, nœud/mark/attribut inconnu, contenu structurellement invalide ou Unicode mal formé : refus, jamais suppression silencieuse.

Bornes expérimentales : 2 Mio de JSON UTF-8, profondeur 32, 50 000 nœuds ; borne par nœud texte 1 000 000 unités UTF-16 déjà présente dans RichNode. Ce sont des protections de la sandbox, **pas des quotas produit définitivement approuvés**. Les marques sont bold/italic/strike/link ; les nœuds correspondent au schéma proposé dans l’architecture. La validation serveur vérifie les attributs, les limites et `Node.check()`, au-delà de la forme JSON.

## Tests exécutés et résultats

| Contrôle | Résultat |
|---|---|
| CI du dernier commit Lot 0 | Terminée et réussie, lien ci-dessus |
| `npm ci --prefix spikes/editor --no-audit --no-fund` | Réussite à partir du lockfile isolé |
| `npm --prefix spikes/editor run typecheck` | Réussite |
| `npm --prefix spikes/editor test` | **48 tests réussis**, dont vraie PostgreSQL et Yjs réel |
| `npm --prefix spikes/editor run bench` | Campagne réelle terminée sur quatre tailles ; données brutes versionnées |
| `npm --prefix spikes/editor run test:browser` avec Chromium local | **3 parcours réussis**, vrai Tiptap, CSP, corpus, longs documents, conflits et révisions |
| `npm test` à la racine | **25 tests du Lot 0 réussis**, vraie PostgreSQL de test |
| `python scripts/validate_specifications.py` | Réussite, contrats/exigences/scénarios/liens conservés |
| Tests Python du validateur | **22 réussis** ; fixtures étendues pour copier les nouveaux liens de documentation du spike |
| Lint et TypeScript racine | Réussite ; sources du prototype aussi lintées, bundle généré exclu |
| `git diff --check` | Réussite |

Les tests couvrent tous les corpus dans JSON/ProseMirror, la vraie instance Tiptap navigateur, PostgreSQL et Yjs. Les documents longs sont aussi rechargés, réédités et sauvegardés depuis Chromium. Les transactions réelles ProseMirror éprouvent insertion/suppression/remplacement/déplacement. Le test SQL lance huit remplacements depuis la même expectedRevision : **une victoire et sept conflits**, aucun écrasement silencieux.

Snapshots et version courante sont dans une transaction. Un échec injecté à l’insertion du snapshot annule aussi contenu et révision. Restore relit un snapshot puis crée r+1, avec provenance de restauration, sans supprimer ni modifier les précédents. Une nouvelle connexion au store relit le commit et les versions depuis PostgreSQL.

Les échecs initiaux ont été corrigés : nom SQL réservé `binary` remplacé par `binary_update` ; prototypes internes des objets d’attributs rendus en JSON ordinaires ; hypothèse de test erronée sur les paragraphes vides Markdown remplacée par les résultats constatés. Tiptap préserve les paragraphes vides multiples dans le cas testé ; les pertes réellement trouvées sont décrites ci-dessous. Aucune règle de sécurité désactivée pour faire passer les tests.

## Comparaison des stratégies de stockage

| Stratégie | Résultat observé | Recommandation |
|---|---|---|
| JSON ProseMirror versionné, snapshots PostgreSQL | Tous les contenus autorisés du corpus conservés ; CAS, rollback et restore r+1 testés ; inspection et évolution explicites | **GO technique proposé pour le MVP** |
| Markdown canonique | Réimport Tiptap perd certaines marques sur les espaces et transforme les doubles hardBreak ; signalement effectif des pertes | **NO-GO comme source canonique**, conserver comme export dérivé |
| Y.Doc binaire canonique dès le MVP | Import et persistance binaire faisables ; identités préservées au rechargement binaire, mais coordination avec révisions métier non résolue | **Ne pas introduire au MVP**, conformément au périmètre ; base technique favorable pour une décision V1 ultérieure |

L’historique est une implémentation PostgreSQL locale du prototype, sans extension Version History ou Snapshot Compare hébergée. Aucun abonnement ni service de collaboration nécessaire pour sauvegarder/restaurer.

## Export Markdown : pertes réellement trouvées

Le contrôle effectue JSON → Markdown → parsing avec le même MarkdownManager Tiptap → validation/normalisation → comparaison du document complet. Ce n’est pas une validation universelle de tous les lecteurs CommonMark/GFM.

- Pour **`markSpaces`**, le texte ` espaces ` tout en gras devient des espaces non marqués autour de `**espaces**`. Le texte reste identique, les marks diffèrent : perte explicitement annoncée.
- Pour **`doubleBreak`**, le réimport de deux hardBreak consécutifs transforme la structure et les retours/espaces. Le JSON reste conservé ; le Markdown n’est jamais utilisé pour restaurer.
- `rich` et les documents de mesure contiennent aussi des espaces en bordure de segments formatés : différences de marks signalées. `empty`, `unicode` et `repeated` n’ont pas de perte détectée avec le moteur testé.

Le bouton d’export montre le résultat et l’avertissement ; il ne remplace pas le snapshot. L’export de projet du futur Lot 1 devra conserver aussi le JSON versionné pour une récupération exacte. Les syntaxes étendues, types de listes et espaces peuvent varier selon le lecteur Markdown ; ne pas promettre une fidélité identique hors du moteur testé.

## Diff textuel et diff structuré : exactitude et lecture par un auteur

Les deux stratégies utilisent jsdiff pour l’alignement ; segmentation des mots par `Intl.Segmenter('fr')`. Les diffs sont des **vues calculées**, jamais des patches exécutables ni une fusion automatique.

| Cas | Blocs/mots textuels | Structure ProseMirror + marks |
|---|---|---|
| Insertion, suppression, remplacement | Ajouts/retraits de texte lisibles | Catégorie par bloc, diff de mots et versions riches |
| Déplacement unique | Apparaît comme suppression et ajout | Bloc déplacé identifié par contenu exact unique, voisins simplement décalés non marqués comme déplacés |
| Gras/italique/barré avec même texte | Aucun changement visible | Changement de mise en forme explicite et vues riches avant/après |
| URL d’un lien changée, même texte | Invisible | Ancienne/nouvelle destination affichée explicitement, sans exécuter le lien |
| Niveau de titre | Texte identique | Changement d’attribut détecté et niveau annoncé |
| Répétitions, mêmes textes sous marks différents, plusieurs blocs réécrits, structure imbriquée ambiguë | Alignement potentiellement trompeur | **Fallback explicite** avec versions intégrales avant/après |
| Plus de 2 000 blocs ou budget d’alignement dépassé | Calcul borné, fallback possible | Versions intégrales disponibles ; détail riche abandonné explicitement |

Le budget de 40 ms concerne le calcul d’alignement jsdiff, **pas** la validation, la segmentation ou le temps total. La scène de stress atteint donc un coût supérieur, même avec fallback ; aucune fausse promesse de borne de temps totale.

[Capture de comparaison](examples/spike-a-diff.png) et [capture de fallback](examples/spike-a-fallback.png) examinées visuellement : le déplacement et la structure sont plus faciles à situer dans les colonnes riches ; le texte par mots est utile pour une réécriture locale mais ne montre pas la mise en forme. Les retours de blocs sont conservés visuellement dans le diff textuel. Les répétitions portent un bandeau d’ambiguïté, pas un faux alignement présenté comme certain.

L’appréciation de lisibilité est une revue visuelle technique, **pas une étude avec des auteurs recrutés**. L’appariement sans identités de blocs reste heuristique. L’acceptation de cette présentation par le propriétaire reste à recueillir ; un test utilisateur ultérieur et un traitement en worker des longs diffs sont à prévoir avant d’en généraliser l’usage.

## Performances réellement mesurées

Environnement Node : v26.8.1, PostgreSQL 18.6 Docker, AMD Ryzen 5 3600X 6-Core Processor, 12 CPU logiques, 31.3 Gio de RAM, Linux 7.2.8-9-omarchy. Campagne horodatée `2026-10-31T02:37:04.162Z`. Trois échauffements, 15 échantillons pour sérialisation/rechargement, 7 pour les diffs et 5 pour le cycle Markdown ; trois transactions PostgreSQL par taille.

| Blocs / texte UTF-16 | JSON octets | JSON sérialiser p50 ms | JSON recharger p50 ms | Validation + sérialisation p50 ms | Diff texte p50 ms | Diff riche p50 ms | PG sauvegarde p50 ms | PG lecture p50 ms |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| 8 / 1447 | 3207 | 0.015 | 0.065 | 0.146 | 0.518 | 0.498 | 1.372 | 0.574 |
| 128 / 23167 | 50007 | 0.211 | 0.630 | 1.702 | 5.770 | 3.063 | 3.885 | 2.084 |
| 1024 / 185343 | 399447 | 1.420 | 4.041 | 10.001 | 49.761 | 24.376 | 27.397 | 15.847 |
| 3000 / 542999 | 1170087 | 2.854 | 9.237 | 34.042 | 150.858 | 75.320 | 96.298 | 44.362 |

Le diff riche de 3 000 blocs utilise le fallback prévu. Les p95/max, tailles Markdown/Yjs, hashes des corpus et mesures de mémoire sont dans le JSON brut ; les petites séries ne suffisent pas à qualifier des queues de latence de production.

Les métriques de sérialisation pure concernent `Node.toJSON()` + JSON.stringify ; le rechargement pur parse le JSON et recrée/vérifie le modèle. La validation serveur est mesurée séparément avec normalisation et sérialisation. Les temps PostgreSQL incluent le réseau loopback et le code du store, pas uniquement le moteur DB.

La mémoire est observée avec GC explicite avant/après chaque taille et RSS échantillonnée entre opérations. La campagne de stress, qui conserve simultanément plusieurs objets JSON/ProseMirror/Yjs pour comparer, approche 0,5 Gio de RSS échantillonnée. Cela **n’est ni une consommation d’éditeur isolé ni une preuve de fuite** ; un pic transitoire peut échapper à cet échantillonnage. La mémoire navigateur n’est pas quantifiée.

Les passages Chromium sont indépendants du microbenchmark Node : un échantillon par taille, document rechargé dans une vraie vue Tiptap, puis réédition et sauvegarde contrôlées. La mesure interne inclut setContent, construction de la vue et production du JSON affiché ; le paint complet n’est pas isolé.

Chromium `155.0.8059.84`, passage horodaté `2026-10-31T02:40:27.487Z` :

| Blocs | Navigation → prêt, ms | Initialisation éditeur, ms | Sauvegarde → confirmation, ms |
|---|---:|---:|---:|
| 128 | 159.3 | 17.3 | 70.6 |
| 1024 | 338.5 | 47.5 | 185.3 |
| 3000 | 792.8 | 117.9 | 432.7 |

Ces valeurs ne qualifient pas le mobile, un réseau distant, la frappe p95 ou un grand nombre de scènes simultanées. La taille longue valide la conservation, pas une promesse de fluidité pour tous les appareils. Le diff long doit être calculé hors du chemin de frappe/sauvegarde et potentiellement dans un worker lors de la réalisation de production.

## Preuve Yjs et limites de migration future

Import initial réel avec y-prosemirror depuis le schéma ProseMirror. Pour chaque corpus : projection Yjs égale au JSON normalisé, sérialisation en update binaire, application dans un nouveau Y.Doc, puis projection toujours égale. Le state vector est identique au rechargement ; une position relative dans le texte se résout au même endroit. Une édition après rechargement, transmise sous forme de delta et appliquée deux fois, ne duplique pas le contenu.

**Contre-exemple exécuté :** recréer un nouveau Y.Doc depuis la même projection JSON produit d’autres identités CRDT ; l’ancienne ancre relative ne se résout plus. Il faut conserver le binaire et ses updates, pas réimporter le JSON à chaque sauvegarde. Les identités de session `clientID` et le `guid` du nouveau Y.Doc ne constituent pas l’identité métier de la scène ; la continuité vérifiée porte sur les structures et ancres CRDT.

Le prototype de migration verrouille la ligne de la scène dédiée, contrôle sa révision, importe une fois et stocke atomiquement epoch, sourceRevision, binaire et state vector. Deux migrations concurrentes retrouvent le même epoch/binaire. Une scène voisine continue à fonctionner en JSON ; l’ancien chemin CAS de la scène migrée est refusé (`EPOCH_CHANGED`). Cette preuve teste une bascule locale par scène, pas une orchestration de coédition distribuée.

Pour V1, restent à décider et tester : gel/barrière des écritures, autorisations du serveur collaboratif, fencing des anciens clients/epochs, durabilité et rejeu des updates, checkpoint métier lié à epoch+state vector et transaction multi-objets coordonnée avec PostgreSQL. Un state vector est un état CRDT, **pas un numéro de révision SQL ni un droit de fusion**. Restaurer une ancienne révision métier ne doit pas remplacer aveuglément le binaire CRDT pendant des éditions actives. Les positions de commentaires devront devenir relatives ou être migrées explicitement ; les offsets simples ne suffisent pas. [API d’updates Yjs](https://docs.yjs.dev/api/document-updates), [binding ProseMirror](https://docs.yjs.dev/ecosystem/editor-bindings/prosemirror).

## Sécurité, CSP et dépendances

Le rendu utilise Tiptap/DOMSerializer et des créations de nœuds DOM ; le diff et les exports affichés utilisent textContent, jamais du HTML arbitraire injecté. Le corpus contient une chaîne `<script>…</script>` qui reste du texte ; aucun script, iframe ou image distante n’est créé à partir de ce contenu. Les tests refusent nœuds/marks/attributs interdits, mauvais arbres, dépassements et liens javascript/data/file/protocol-relative/avec identifiants ou caractères de contrôle. Les URLs absolues http/https/mailto sont la liste expérimentale autorisée ; les attrs de lien sont bornés et fermés.

Le serveur émet les mêmes directives CSP strictes que l’application de production : nonce pour scripts/styles, self, object-src none, base-uri self et frame-ancestors none. Tiptap est configuré avec **injectCSS:false** et une feuille externe ; aucun ajout de unsafe-inline/unsafe-eval à la CSP de production. Les [observations navigateur](SPIKE-A-BROWSER-SAFETY.json) ne montrent aucune violation CSP, erreur JS ou requête externe lors des parcours. Les liens n’entraînent aucune récupération automatique de ressources. Cela ne constitue pas un audit exhaustif du navigateur, du collage HTML ou de toutes les extensions possibles.

| Dépendance directement utilisée | Version exacte | Licence déclarée / usage |
|---|---|---|
| @tiptap/core, @tiptap/pm, @tiptap/starter-kit, @tiptap/markdown | 3.32.2 | MIT ; éditeur, schéma et export Markdown |
| yjs | 13.6.33 | MIT ; preuve CRDT isolée |
| y-prosemirror | 1.3.7 | MIT ; import/projection JSON et binaire |
| diff | 9.0.0 | BSD-3-Clause ; alignement blocs/mots |
| pg | 8.23.1 | MIT ; snapshots et CAS réels |
| esbuild | 0.28.2 | MIT ; bundle de laboratoire |
| @playwright/test | 1.64.1 | Apache-2.0 ; essais navigateur |

Le lockfile et les mesures recensent les versions et SPDX des 100 entrées verrouillées, **y compris des packages optionnels multi-plateformes non chargés sur cette machine**. Licences déclarées rencontrées : MIT, ISC, BSD-3-Clause, Apache-2.0. Les licences des extensions Tiptap utilisées sont libres ; aucune extension @tiptap-pro, authentification cloud, Version History ou Snapshot Compare payante n’est importée. Le [code Tiptap est sous MIT](https://github.com/ueberdosis/tiptap/blob/main/LICENSE.md) ; son offre hébergée n’est pas requise par ce prototype. Notices de bibliothèque conservées dans le bundle généré et son fichier LEGAL.

Le module Markdown est présenté comme beta dans sa documentation actuelle ; ses pertes constatées justifient de le garder comme export avec avertissement et tests, plutôt que comme canon. Le warning Node sur l’accès expérimental à localStorage provient de la détection d’environnement d’une bibliothèque ; aucun stockage local de document/session n’est utilisé par le spike. Il n’est pas masqué pour produire des journaux artificiellement propres.

## Recommandation ADR-0007 et décision proposée

**GO technique proposé :** JSON ProseMirror versionné pour une scène au MVP, snapshots complets internes PostgreSQL, remplacement complet sous expectedRevision, restore par nouvelle révision. Conservation exacte du JSON avant/après ; diff d’affichage textuel + structure/marks et fallback explicite. Markdown comme dérivé contrôlé, jamais comme sauvegarde exacte. Yjs maintenu hors production MVP, avec migration unique par scène/epoch et binaire conservé à étudier en V1.

**NO-GO :** canon Markdown si une conservation exacte des marques/retours est requise ; diff utilisé comme patch ou alignement ambigu présenté comme certain ; reconstruction répétée du CRDT depuis JSON ; intégration de l’historique payant comme dépendance obligatoire. Une perte silencieuse sur le corpus autorisé aurait invalidé le JSON : aucune n’est observée dans les cycles exécutés.

À valider explicitement par le propriétaire :

1. Accepter ADR-0007 pour ce choix de stockage et d’historique, en conservant l’export Markdown avec avertissements.
2. Accepter l’approche de comparaison riche et son fallback ; ne pas exiger une identité de bloc ou une fusion textuelle automatique sans nouvelle étude.
3. Revoir les bornes de document et l’enveloppe de taille attendue avant de les figer dans les contrats de production ; prévoir le calcul asynchrone des longs diffs.
4. Autoriser séparément l’implémentation de production du Lot 1. La réception du Lot 0 et le succès du spike ne constituent pas cette autorisation.

Le format proposé est techniquement étayé ; sa décision durable reste **Proposée**, jamais acceptée par la seule présence du rapport. Les contraintes d’autorisation/audit/barrière projet, le spike B et les risques résiduels du socle sont conservés.

## Fichiers et commandes reproductibles

Création de `spikes/editor/` : corpus, validation/document, Markdown, deux diffs, preuve Yjs, store SQL, serveur et interface de laboratoire, benchmark, tests et configurations dédiées. Ajout du présent rapport, des mesures JSON et des deux captures. Mise à jour ciblée d’ADR-0007, plan, architecture, audit, HUMAN-DECISIONS, rapport Lot 0, AGENTS et README pour la réception et le jalon. CI étendue d’un job isolé ; ignores/lint/contrôle d’architecture et fixtures du validateur adaptés aux seuls nouveaux artefacts. Les API, packages applicatifs, PRD, registre et contrats de production ne changent pas.

Les commandes exactes sont dans le [README du spike](../spikes/editor/README.md). Le nouveau job CI est versionné et ses commandes exécutées localement ; son exécution distante n’est pas revendiquée avant commit/push. La CI distante verte citée concerne bien le commit reçu du Lot 0, pas les modifications actuelles.

## Critères d'acceptation du document

Résultats réels, environnement, versions, échecs corrigés et limites accessibles ; corpus et commandes reproductibles ; conservation et conflits vérifiés sur vraie PostgreSQL ; migration CRDT isolée explicitée ; comparaison lisible ou fallback ; licences/absence de dépendance hébergée précisées ; GO/NO-GO et décisions humaines distincts. Aucun passage silencieux au Lot 1.
