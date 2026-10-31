import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { RevisionStore, RevisionError } from './store.ts';
import { DocumentError, LIMITS } from './document.ts';
import { corpus } from './corpus.ts';
import { richDiff, textDiff } from './diff.ts';
import { markdownExport } from './markdown.ts';
const port = Number(process.env.SPIKE_A_PORT ?? 3100), origin = `http://127.0.0.1:${port}`;
const store = new RevisionStore(); await store.init();
const demoId = '7d55b485-558e-4868-956b-fa6af0222d2c';
let demo;
try { demo = await store.get(demoId); }
catch (e) { if (!(e instanceof RevisionError) || e.code !== 'NOT_FOUND') throw e; demo = await store.create(corpus.rich, demoId); }
// Scène fictive stable, historique conservé entre redémarrages du serveur Node.
const server = createServer(async (req, res) => {
  const nonce = randomBytes(16).toString('base64');
  const csp = `default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'nonce-${nonce}'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'`;
  res.setHeader('Content-Security-Policy', csp); res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Referrer-Policy', 'no-referrer');
  const send = (status: number, body: unknown) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
  try {
    const path = new URL(req.url!, origin).pathname;
    if (!['GET', 'POST'].includes(req.method!)) return send(405, { error: 'METHOD_NOT_ALLOWED' });
    // Pas d'auth applicative : sandbox loopback dédiée. Toute écriture provient de sa propre origine.
    if (req.method === 'POST' && req.headers.origin !== origin) return send(403, { error: 'ORIGIN_REFUSED' });
    if (req.method === 'GET') {
      if (path === '/health') return send(200, { status: 'ready' });
      if (path === '/api/corpus') return send(200, corpus);
      if (path === '/api/current') return send(200, await store.get(demo.sceneId));
      if (path === '/api/history') return send(200, await store.history(demo.sceneId));
      const file = path === '/' ? 'index.html' : path === '/editor.js' ? 'editor.js' : path === '/style.css' ? 'style.css' : path === '/editor.js.LEGAL.txt' ? 'editor.js.LEGAL.txt' : null;
      if (!file) return send(404, { error: 'NOT_FOUND' });
      res.writeHead(200, { 'Content-Type': file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.txt') ? 'text/plain' : 'text/html; charset=utf-8' });
      return res.end(await readFile(new URL('../dist/' + file, import.meta.url)));
    }
    let size = 0; const chunks: Buffer[] = [];
    for await (const chunk of req) { size += chunk.length; if (size > LIMITS.bytes + 8192) return send(413, { error: 'DOCUMENT_TOO_LARGE' }); chunks.push(chunk); }
    const body = JSON.parse(Buffer.concat(chunks).toString()) as Record<string, unknown>;
    if (!body || typeof body !== 'object' || Array.isArray(body)) return send(422, { error: 'INVALID_REQUEST' });
    if (path === '/api/save') return send(200, await store.save(demo.sceneId, body.document, Number(body.expectedRevision)));
    if (path === '/api/restore') return send(200, await store.save(demo.sceneId, null, Number(body.expectedRevision), Number(body.sourceRevision)));
    if (path === '/api/compare') {
      const previous = await store.get(demo.sceneId, Number(body.sourceRevision));
      return send(200, { text: textDiff(previous.document, body.document), rich: richDiff(previous.document, body.document) });
    }
    if (path === '/api/markdown') return send(200, markdownExport(body.document));
    send(404, { error: 'NOT_FOUND' });
  } catch (e) {
    if (e instanceof RevisionError) return send(e.code === 'NOT_FOUND' ? 404 : 412, { error: e.code });
    if (e instanceof DocumentError) return send(e.code === 'DOCUMENT_TOO_LARGE' ? 413 : 422, { error: e.code, message: e.message });
    send(e instanceof SyntaxError ? 400 : 500, { error: 'REQUEST_FAILED' });
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Spike A isolé : ${origin} (corpus fictif, aucune API Lot 0)`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { server.close(() => void store.close().then(() => process.exit(0))); });
