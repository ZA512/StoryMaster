import { performance } from 'node:perf_hooks';
import { cpus, totalmem, platform, release } from 'node:os';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { corpus, longDocument, text } from './corpus.ts';
import { model, normalize, schema, serialize, plainText } from './document.ts';
import { richDiff, textDiff } from './diff.ts';
import { markdownExport } from './markdown.ts';
import { importOnce, snapshot, reload, project } from './yjs-proof.ts';
import { RevisionStore } from './store.ts';
const summary = (samples: number[]) => { const values = [...samples].sort((a, b) => a - b); const q = (p: number) => Number(values[Math.min(values.length - 1, Math.ceil(values.length * p) - 1)]!.toFixed(3)); return { samples: samples.length, p50: q(.5), p95: q(.95), max: q(1) }; };
let sampledRss = 0;
function measure(work: () => unknown, n = 15) { for (let i = 0; i < 3; i++) work(); const samples = []; for (let i = 0; i < n; i++) { const start = performance.now(); work(); samples.push(performance.now() - start); sampledRss = Math.max(sampledRss, process.memoryUsage().rss); } return summary(samples); }
const store = new RevisionStore();
try {
 await store.init();
 const lock = JSON.parse(await readFile(new URL('../package-lock.json', import.meta.url), 'utf8'));
 const dependencies = Object.fromEntries(Object.entries(lock.packages as Record<string, { version: string; license?: string }>).filter(([path]) => path.startsWith('node_modules/')).map(([path, value]) => [path.slice('node_modules/'.length), { version: value.version, license: value.license ?? 'UNDECLARED' }]));
 assert.ok(!Object.keys(dependencies).some(name => name.startsWith('@tiptap-pro/')), 'Extension commerciale inattendue');
 const environment = { measuredAt: new Date().toISOString(), node: process.version, postgres: (await store.pool.query('SELECT version()')).rows[0].version, platform: platform(), kernel: release(), cpu: cpus()[0]?.model, logicalCpus: cpus().length, memoryGiB: Number((totalmem() / 1024 ** 3).toFixed(1)), explicitGc: typeof global.gc === 'function', dependencies };
 const results = [];
 for (const blocks of [8, 128, 1024, 3000]) {
   global.gc?.(); const memoryBefore = process.memoryUsage(); sampledRss = memoryBefore.rss;
   const doc = longDocument(blocks), pm = model(doc), json = JSON.stringify(doc.doc), envelope = JSON.stringify(doc), changed = structuredClone(doc);
   changed.doc.content!.at(-1)!.content!.push(text(' Une phrase nouvelle.'));
   const next = normalize(changed).document;
   const jsonSerialize = measure(() => JSON.stringify(pm.toJSON()));
   const jsonReload = measure(() => { const n = schema.nodeFromJSON(JSON.parse(json)); n.check(); });
   const serverValidateAndSerialize = measure(() => serialize(doc));
   const textDiffMs = measure(() => textDiff(doc, next), 7);
   const richDiffMs = measure(() => richDiff(doc, next), 7);
   const exported = markdownExport(doc), markdownMs = measure(() => markdownExport(doc), 5);
   const ydoc = importOnce(doc), state = snapshot(ydoc), restored = reload(state.update);
   assert.deepEqual(project(restored), doc); ydoc.destroy(); restored.destroy();
   const persisted = await store.create(doc); const saveTimes = [], loadTimes = []; let revision = persisted.revision;
   for (let i = 0; i < 3; i++) {
     const saveStart = performance.now(); revision = (await store.save(persisted.sceneId, next, revision)).revision; saveTimes.push(performance.now() - saveStart);
     const loadStart = performance.now(); const loaded = await store.get(persisted.sceneId); loadTimes.push(performance.now() - loadStart); assert.deepEqual(loaded.document, next);
   }
   global.gc?.(); const memoryAfter = process.memoryUsage();
   results.push({ blocks, utf16TextLength: plainText(doc).length, jsonBytes: Buffer.byteLength(envelope), markdownBytes: Buffer.byteLength(exported.markdown), yjsBytes: state.update.byteLength, sha256: createHash('sha256').update(envelope).digest('hex'), jsonSerializeMs: jsonSerialize, jsonReloadMs: jsonReload, serverValidateAndSerializeMs: serverValidateAndSerialize, textDiffMs, richDiffMs, richFallback: richDiff(doc, next).fallback, markdownRoundTripMs: markdownMs, markdownLosses: exported.losses, postgresSaveMs: summary(saveTimes), postgresReloadMs: summary(loadTimes), memory: { heapBeforeBytes: memoryBefore.heapUsed, heapAfterGcBytes: memoryAfter.heapUsed, retainedDeltaBytes: memoryAfter.heapUsed - memoryBefore.heapUsed, sampledRssMaxBytes: sampledRss } });
 }
 const markdownCases = Object.fromEntries(Object.entries(corpus).map(([name, value]) => [name, markdownExport(value)]));
 const diffCases = [
   { name: 'marks seulement', before: corpus.markSpaces, after: { ...corpus.markSpaces, doc: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: ' espaces ' }] }] } } },
   { name: 'blocs répétés', before: corpus.repeated, after: { ...corpus.repeated, doc: { type: 'doc', content: [...corpus.repeated.doc.content!, { type: 'paragraph', content: [{ type: 'text', text: 'Suite' }] }] } } },
 ].map(c => ({ name: c.name, text: textDiff(c.before, c.after), rich: richDiff(c.before, c.after) }));
 const report = { environment, methodology: '3 échauffements ; 15 échantillons sérialisation/rechargement, 7 diffs, 5 Markdown ; 3 sauvegardes/lectures PostgreSQL. Horloges client. GC explicite avant/après taille. RSS échantillonnée, pas un pic absolu par opération. Corpus synthétique, une campagne locale ; pas de SLA.', results, markdownCases, diffCases };
 await mkdir('results', { recursive: true }); await writeFile('results/measurements.json', JSON.stringify(report, null, 2) + '\n');
 console.log(JSON.stringify({ environment: { ...environment, dependencies: Object.keys(dependencies).length }, results }, null, 2));
} finally { await store.close(); }
