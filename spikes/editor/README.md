# Spike A — éditeur, stockage et révisions

Prototype technique **isolé de la production**, sur corpus fictif. [Rapport et recommandation](../../docs/SPIKE-A-REPORT.md). Aucune dépendance de ce répertoire n’est importée par `apps/` ou `packages/` ; le dossier est exclu des images Docker applicatives.

## Exécuter

Prérequis : Node 26.8.1, npm, Docker Compose. Aucun service hébergé ni compte Tiptap nécessaire. Vérifier le disque avant installation/build.

```bash
df -h /
npm ci --prefix spikes/editor --no-audit --no-fund
docker compose -f spikes/editor/compose.yaml up -d --wait
npm --prefix spikes/editor run typecheck
npm --prefix spikes/editor test
npm --prefix spikes/editor run bench
npm --prefix spikes/editor run build
npm --prefix spikes/editor start
```

Ouvrir **http://127.0.0.1:3100**. Le serveur est limité au loopback et refuse les écritures d’une autre origine. C’est une sandbox sans authentification : n’y mettre que des textes fictifs. Le port 3100 doit être libre. Une scène fictive stable est créée une seule fois ; ses révisions restent accessibles entre redémarrages du serveur Node, pendant la vie de la PostgreSQL dédiée.

La base `storymaster_spike_a_test` écoute sur **127.0.0.1:55433** avec les identifiants exclusivement fictifs `spike / spike-only-fictional-local`. Elle utilise un tmpfs limité à 1 Gio : aucun volume persistant créé ou supprimé. Le store refuse toute autre base et tout hôte non loopback. Ne pas la substituer à la base du Lot 0.

```bash
# Depuis un second terminal, ou en laissant Playwright démarrer son propre serveur :
spikes/editor/node_modules/.bin/playwright install chromium
npm --prefix spikes/editor run test:browser
# Alternative avec Chromium déjà installé :
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm --prefix spikes/editor run test:browser
```

Arrêter le serveur manuel avant les tests navigateur : Playwright démarre sa propre instance et n’accepte pas de réutiliser un serveur inconnu. Il teste aussi les documents longs. Pour arrêter la seule base éphémère du prototype :

```bash
docker compose -f spikes/editor/compose.yaml down
```

Cette commande supprime la sandbox en mémoire ; elle n’affecte aucun volume ni service du Lot 0. Les scripts ne réinitialisent pas cette base entre tests : ils utilisent de nouvelles scènes fictives. Les tests de rollback injectent brièvement un trigger dans cette base dédiée ; exécuter une seule suite PostgreSQL du spike à la fois.

## Corpus et résultats

`corpus/documents.json` contient six documents déterministes : vide, texte riche/dialogues/listes, Unicode, répétitions, espaces marqués et doubles sauts de ligne. `src/corpus.ts` génère aussi 8, 128, 1 024 et 3 000 blocs formatés uniques pour les mesures. Le test compare le corpus versionné au générateur.

`results/measurements.json` : horloges serveur/PG, tailles, hashes et versions/licences du lockfile ; `results/browser-measurements.json` : vrais passages Chromium ; `results/browser-safety.json` : CSP, erreurs et requêtes externes observées. Les résultats locaux et captures sont ignorés par Git. Une campagne réelle est conservée dans `docs/SPIKE-A-MEASUREMENTS.json`, avec ses limites dans le rapport ; aucun résultat n’est codé dans les tests.

## Ce que le prototype prouve et ne prouve pas

Validation stricte des nœuds/marks/attributs/URL, normalisation déterministe sans conversion NFC/NFD, JSON exact, snapshots PostgreSQL, CAS, restore r+1, deux diffs et fallback, import unique Yjs puis rechargement binaire avec identités stables. Les pertes Markdown sont signalées, jamais prises pour une sauvegarde canonique.

L’enveloppe `format: storymaster-scene-spike`, `schemaVersion: 2` est **expérimentale**. Le schéma v1 strong/em est un ancien format fictif pour tester une migration contrôlée ; ce ne sont pas des scènes historiques de l’application. Le contrat de production reste `Scene.contentFormatVersion: 1` et `Scene.content: RichDocument`. Aucune route de ce laboratoire, aucun store non authentifié ni son schéma DB ne doivent être repris directement dans le Lot 1.

Le store de test ne contient pas l’autorisation projet, la barrière de verrou projet, l’audit complet ou l’idempotence des cas d’usage de production. Il ne remplace pas le spike B et ne fournit pas de serveur de coédition. La partie Yjs est une preuve de migration isolée, pas une nouvelle architecture MVP.
