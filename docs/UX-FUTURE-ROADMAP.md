# Parcours humains et future refonte UI/UX

**Statut :** inventaire pour arbitrage du propriétaire ; aucune direction graphique approuvée ni refonte réalisée au Lot 6. Le [PRD](PRD.md) conserve ses 150 exigences et ses versions. [Décisions humaines](HUMAN-DECISIONS.md).

## Parcours et opportunités

| Parcours humain | Opportunité à explorer avec les utilisateurs | Invariants à préserver |
|---|---|---|
| Retrouver ses projets littéraires | Bibliothèque lisible, reprise de la dernière scène, progression sans surcharge | Privé par défaut, périmètre projet, IDs stables |
| Organiser manuscrits et chapitres | Vue d’ensemble et glisser-déposer de chapitres/scènes, commandes clavier équivalentes | Déplacement explicite, révision de structure, CAS, aucun texte perdu |
| Écrire et réorganiser des scènes | Écriture continue, déplacement sans quitter le texte, retour clair d’autosave | Révision de contenu distincte de l’ordre, brouillon local et conflit visibles |
| Relier manuscrit, bible, chronologie et commentaires | Navigation contextuelle, panneaux de lecture, retour au passage d’origine | Références typées dans le même projet, historique consultable |
| Explorer personnages, lieux et événements | Relations compréhensibles et filtres simples ; tester une vue graphique seulement si utile | Relations explicites, sens et validité, aucun lien interprojets implicite |
| Modifier une fiche depuis une scène | Interactions contextuelles et édition progressive ; réduire les formulaires administratifs | Mêmes commandes applicatives, modules désactivables sans destruction |
| Examiner une proposition | Montrer intention, provenance, diff, ressources liées, conflits et versions relues | Contenu immuable par révision, avis invalidés après modification |
| Approuver puis fusionner | Séparer les décisions et montrer l’effet exact ; récupération après réponse perdue | Autorisation humaine fraîche, fusion atomique et idempotence durable |
| Gérer collaboration et délégation | Comprendre qui peut lire/proposer, jusqu’à quand et dans quels projets | Identité serveur, intersection des droits, révocation immédiate des nouveaux appels |
| Utiliser l’assistant simulé | Inventaire du contexte, consentement lisible, historique privé et résultats inconnus compréhensibles | Aucun transfert fournisseur commercial avant GO-03, aucune écriture canonique directe |
| Revenir sur une action | Undo/redo local de saisie et restauration explicite d’une révision ; confirmer les effets durables | Restore crée une nouvelle révision ; ne pas transformer undo en écrasement silencieux |
| Travailler au clavier | Raccourcis cohérents, navigation de structure, focus prévisible, commandes accessibles | Alternatives aux gestes, nom et état annoncés, pas de piège clavier |
| Utiliser une tablette ou un mobile | Cibles tactiles, panneaux adaptables, réorganisation avec alternative au glisser | Lisibilité à petit écran, contexte préservé, aucun défilement horizontal obligatoire |

## Méthode proposée, à valider

Observer quelques parcours complets avec des auteurs : écrire, retrouver une référence, déplacer une scène, traiter un commentaire, comparer puis fusionner une proposition. Relever les hésitations, erreurs, retours arrière et informations manquantes. Vérifier séparément clavier, lecteur d’écran, contraste, grossissement et tactile. La fluidité et le plaisir d’utilisation se qualifient avec ces usages ; ils ne se déduisent pas d’un nombre de formulaires ni d’une mesure serveur.

Prototyper des alternatives légères avant de choisir navigation ou identité visuelle. Le propriétaire arbitre direction graphique, priorités et profondeur de refonte. Aucun calendrier, abonnement ou quota commercial n’est décidé ici. Réduire la charge cognitive en gardant le texte et l’intention au centre, avec détails techniques disponibles seulement lorsqu’ils aident à décider.

## Préparation architecturale existante

Les IDs des manuscrits, chapitres et scènes restent stables. Déplacements, révisions de structure et contenu, restauration, snapshots et propositions restent des commandes indépendantes de la présentation. HTTP/MCP réutilisent les services applicatifs ; changer l’interface ne doit pas créer de chemin privilégié. La future réorganisation doit appeler ces commandes avec préconditions, conserver les brouillons et rendre tout conflit explicite.

Aucune bibliothèque de glisser-déposer, canvas ou framework UI lourd ajoutée. Coédition CRDT V1 et extensions V2+ restent hors MVP ; une refonte visuelle ne les autorise pas. Les limites héritées de récupération de brouillons, contention, accessibilité et restauration restent à vérifier, sans être déclarées résolues par cet inventaire.

## Critères d'acceptation du document

Grands parcours, gestes, accessibilité, charge cognitive, propositions et historiques inventoriés ; opportunités distinguées des décisions ; commandes et identités préservées ; aucune direction graphique, dépendance lourde ou fonction future imposée.

## Suivi UX-1B et UX-2

La mission distincte du 2 novembre autorise la compacité puis les cartes et le glisser-déposer. [UX-1B](UX-1B-REPORT.md), [UX-2](UX-2-REPORT.md) et [ADR-0020](adr/0020-cartes-et-deplacements-controles.md) précisent la réalisation, les dépendances ajoutées et les limites ; les anciens paragraphes « aucune bibliothèque DnD » décrivent le Lot 6. Cela ne réceptionne pas l’ergonomie, ne clôt pas les brouillons après crash ou les réserves de sécurité, et n’autorise pas UX-3/4.
