# ADR-0010 — Mise en œuvre du Lot 1 et barrière des écritures de texte

**Statut :** Mise en œuvre du Lot 1 autorisé ; choix technique conditionné à la réception et aux mesures, aucune autorisation du Lot 2. **Date :** 31 octobre 2026. **Références :** [ADR-0003](0003-propositions-transactionnelles.md), [ADR-0007 accepté](0007-stockage-editeur-et-diff.md), [décisions humaines](../HUMAN-DECISIONS.md), [rapport](../LOT-1-REPORT.md).

## Décision et portée

Les documents ProseMirror version 1 sont validés strictement par le même paquet `@storymaster/editor` côté service, comptés et stockés dans PostgreSQL. Les adaptateurs HTTP et web utilisent `EditorialService`. Ni le serveur isolé du Spike A, ni Yjs, ni son magasin ne sont importés en production. Le diff riche est un affichage calculé dans un Worker, avec versions intégrales avant/après et fallback explicite ; il ne constitue pas un patch de fusion automatique.

Les mutations de structure/métadonnées et d’archivage prennent `Project FOR UPDATE`. Les sauvegardes et restaurations **du seul texte d’une scène** prennent `Project FOR SHARE`, puis relisent session, utilisateur et membership, puis `Scene FOR UPDATE`, puis verrou d’idempotence. L’ordre ne s’inverse jamais. Les permissions sont évaluées après la barrière ; propriétaire/admin/auteur peuvent écrire, seuls propriétaire/admin peuvent archiver, reviewer/reader consultent. Toute identité IA est refusée même sur la route HTTP.

Le projet reste la frontière et la barrière de sécurité. Une mutation exclusive attend la fin de toutes les sauvegardes déjà admises. Une révocation de session attend les lectures verrouillées de session en cours ; les nouvelles opérations revalident l’identité serveur. Une sauvegarde en attente derrière une modification des droits est refusée après sa libération. Les futurs traitements multi-objets conserveront une barrière exclusive, avec ordre interne documenté à leur lot. Les seuls verrous de lignes sans barrière projet restent insuffisants pour protéger cycles et write skew.

Le compteur de publication éditoriale est déplacé dans `editorial_clocks` (migration additive 0003). Il est incrémenté brièvement après les écritures/snapshots/audit, sans conversion de `FOR SHARE` en `FOR UPDATE` sur Project. Le plan et les exports lisent leur structure, scènes et compteur par **une seule instruction SQL**, donc un même snapshot READ COMMITTED. Les lectures ne voient pas de moitié de commit. Le compteur n’est jamais une précondition du texte d’une autre scène. Les changements de position de voisins modifient les versions structurelles des parents et le ChangeSet d’ordre ; ils ne rendent pas leur texte obsolète. Le DTO Scene n’expose pas la position.

## Atomicité, autosave et historique

Une transaction confirme simultanément document, hash, compteur de mots, révision, snapshot intégral, changement éditorial direct, audit et réponse d’idempotence. Le schéma impose la présence et l’égalité du snapshot courant au commit ; les rôles applicatifs ne peuvent modifier ni supprimer les anciennes révisions. Aucun effet externe ne requiert d’outbox dans ce lot. Ces changements directs ne sont pas le moteur de propositions du Lot 4.

Un autosave attend 600 ms après une pause de frappe. Une seule demande est en vol par scène. L’acquittement confirme sa génération exacte ; les caractères saisis ensuite restent en attente. Une réponse inconnue est rejouée avec même corps, révision et clé. Un 412 bloque l’automatisme, conserve le brouillon et montre la version serveur ; le choix local utilise la révision affichée, avec nouveau contrôle serveur. Une nouvelle modification concurrente produit à nouveau un conflit. Les brouillons restent en mémoire de l’onglet pendant navigation interne et changements de scène ; fermeture/rechargement non confirmé déclenche l’avertissement du navigateur. Aucune garantie hors ligne ou après fermeture forcée n’est annoncée.

L’historique conserve auteur affiché au moment du snapshot, date, contenu, métadonnées et provenance. Restaurer **le texte** garde titre/statut/emplacement actuels, crée r+1 et `restoredFromRevision` ; le libellé le précise. Le JSON éditorial exporte structure, IDs, ordre, archives et textes courants, sans historique ni archive complète du projet. Markdown est dérivé et ses pertes sont affichées.

## Alternatives et conséquences

Le verrou exclusif global est comparé sur les mêmes scènes et services réels à la barrière partagée + verrou scène. La seconde option réduit l’attente des scènes indépendantes, mais ne supprime ni coût CPU de validation/JSON, ni écritures WAL/snapshots, ni attente du compteur final. Elle ne garantit pas une capacité universelle. La courbe, les erreurs, l’équité et les limites sont publiées dans le rapport, y compris les charges longues. SERIALIZABLE avec reprises complètes reste une alternative ultérieure ; les retries implicites qui masqueraient des conflits de texte sont exclus.

Les protections de ressources sont explicites : 2 Mio de JSON par scène, profondeur 32, 50 000 nœuds, 1 000 000 unités UTF-16 par nœud texte ; export direct plafonné à 32 Mio de contenu canonique. Elles produisent une erreur, jamais une troncature. Ce sont des limites techniques de cette implémentation, pas des quotas commerciaux. Les revoir sur mesures avant élargissement du corpus.

## Critères d'acceptation du document

Réexaminer avant commentaires, références mutables, propositions multi-objets, coédition ou changement d’enveloppe. B-01..05 sont exécutés ; B-06 propositions n’est pas prétendu exécuté. Le rapport doit présenter mesures et preuves d’intégrité, les parcours navigateur doivent vérifier erreur/412/réponse tardive et restauration, et le propriétaire doit réceptionner le Lot 1 avant Lot 2.
