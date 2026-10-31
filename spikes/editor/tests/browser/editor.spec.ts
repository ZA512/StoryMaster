import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { corpus, rich, longDocument } from '../../src/corpus.ts';
import { normalize, LIMITS } from '../../src/document.ts';
const origin = 'http://127.0.0.1:3100';
const post = (data: unknown) => ({ data, headers: { Origin: origin } });
test('Tiptap réel : schéma, marks, édition, révisions, restore et CSP sans HTML exécutable', async ({ page, request }) => {
  const errors: string[] = [], csp: string[] = [], outgoing: string[] = [];
  page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.text().includes('Content Security Policy')) csp.push(m.text()); });
  page.on('request', r => { if (!r.url().startsWith(origin)) outgoing.push(r.url()); });
  await mkdir('results', { recursive: true });
  const seed = await (await request.get('/api/current')).json();
  expect((await request.post('/api/save', post({expectedRevision:seed.revision,document:rich}))).ok()).toBe(true);
  const response = await page.goto('/'); await expect(page.getByRole('status')).toContainText('Prototype prêt');
  expect(response!.headers()['content-security-policy']).not.toContain('unsafe-inline');
  const original = (await (await request.get('/api/current')).json()).revision;
  const initial = await page.locator('.tiptap').evaluate(n => n.textContent); expect(initial).toContain('Élise');
  expect(await page.evaluate(() => 'executable' in globalThis)).toBe(false); await expect(page.locator('.tiptap script,.tiptap iframe,.tiptap img')).toHaveCount(0);
  // Tous les corpus passent par une vraie instance Editor, puis son getJSON via le panneau.
  for (const [name, doc] of Object.entries(corpus)) {
    await page.locator('#corpus').selectOption(name); await page.getByRole('button', { name: 'Charger le corpus dans le brouillon' }).click();
    const actual = normalize(JSON.parse((await page.locator('#json').textContent())!)).document; expect(actual).toEqual(doc);
  }
  await page.locator('#corpus').selectOption('rich'); await page.getByRole('button', { name: 'Charger le corpus dans le brouillon' }).click();
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click(); await expect(page.getByRole('status')).toHaveText('Enregistrement confirmé.');
  const saved = await (await request.get('/api/current')).json(); expect(saved.document).toEqual(rich); expect(saved.revision).toBe(original + 1);
  await page.getByRole('textbox', { name: 'Brouillon de scène' }).click(); await page.keyboard.press('Control+End'); await page.keyboard.type(' Texte ajouté e\u0301 👩🏽‍💻.');
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click(); await expect(page.getByRole('status')).toHaveText('Enregistrement confirmé.');
  await page.reload(); await expect(page.getByRole('status')).toContainText('Prototype prêt'); await expect(page.getByRole('textbox')).toContainText('Texte ajouté e\u0301 👩🏽‍💻.');
  await page.getByRole('button', { name: 'Déplacer le premier bloc à la fin' }).click();
  await page.locator('#history').selectOption(String(original)); await page.getByRole('button', { name: 'Comparer au brouillon' }).click(); await expect(page.locator('#diff')).toContainText('Bloc déplacé');
  await page.screenshot({ path: 'results/diff-desktop.png', fullPage: true });
  await page.locator('#history').selectOption(String(original)); await page.getByRole('button', { name: 'Restaurer comme nouvelle révision' }).click(); await expect(page.getByRole('status')).toContainText('nouvelle révision');
  const restored = await (await request.get('/api/current')).json(); expect(restored.revision).toBe(original + 3); expect(restored.document).toEqual(rich);
  await page.locator('#corpus').selectOption('markSpaces'); await page.getByRole('button', { name: 'Charger le corpus dans le brouillon' }).click();
  await page.getByRole('button', { name: 'Exporter en Markdown' }).click(); await expect(page.locator('#losses')).toContainText('diffère');
  await page.locator('#corpus').selectOption('repeated'); await page.getByRole('button', { name: 'Charger le corpus dans le brouillon' }).click(); await page.getByRole('button', { name: 'Enregistrer', exact: true }).click(); await expect(page.getByRole('status')).toHaveText('Enregistrement confirmé.');
  const repeatedRevision = (await (await request.get('/api/current')).json()).revision;
  await page.getByRole('textbox').click(); await page.keyboard.press('Control+End'); await page.keyboard.type(' Changement.');
  await page.locator('#history').selectOption(String(repeatedRevision)); await page.getByRole('button', { name: 'Comparer au brouillon' }).click(); await expect(page.locator('.fallback')).toContainText('ambigus'); await expect(page.locator('.versions .preview')).toHaveCount(2);
  await page.screenshot({ path: 'results/fallback-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); await page.screenshot({ path: 'results/editor-mobile.png', fullPage: true });
  expect(errors).toEqual([]); expect(csp).toEqual([]); expect(outgoing).toEqual([]);
  await writeFile('results/browser-safety.json', JSON.stringify({ csp: response!.headers()['content-security-policy'], consoleCspErrors: csp, pageErrors: errors, externalRequests: outgoing, corpusRoundTrips: Object.keys(corpus) }, null, 2));
});
test('serveur de prototype : refuse document interdit, Origin et ancien CAS sans écraser', async ({ request, page }) => {
  const current = await (await request.get('/api/current')).json();
  const invalid = await request.post('/api/save', post({ expectedRevision: current.revision, document: { ...rich, doc: { type: 'doc', content: [{ type: 'image', attrs: { src: 'https://example.test/tracker' } }] } } })); expect(invalid.status()).toBe(422);
  expect((await request.post('/api/save', { data: { document: rich, expectedRevision: current.revision }, headers: { Origin: 'https://evil.example' } })).status()).toBe(403);
  expect((await request.post('/api/save', post({ document: rich, expectedRevision: current.revision - 1 }))).status()).toBe(412);
  expect((await request.post('/api/save', post({ expectedRevision: current.revision, document: { ...rich, doc: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'x'.repeat(LIMITS.bytes) }] }] } } }))).status()).toBe(413);
  expect((await (await request.get('/api/current')).json()).revision).toBe(current.revision);
  await page.goto('/'); await expect(page.getByRole('status')).toContainText('Prototype prêt'); await page.getByRole('textbox').click(); await page.keyboard.press('Control+End'); await page.keyboard.type(' Mon brouillon à garder.');
  await request.post('/api/save', post({ expectedRevision: current.revision, document: rich }));
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click(); await expect(page.getByRole('status')).toContainText('Conflit'); await expect(page.getByRole('textbox')).toContainText('Mon brouillon à garder.');
});

test('documents longs dans Tiptap : rechargement DOM, réédition et sauvegarde sans perte', async ({ page, request }) => {
  const measurements = [];
  for (const blocks of [128, 1024, 3000]) {
    const doc = longDocument(blocks), current = await (await request.get('/api/current')).json();
    expect((await request.post('/api/save', post({ expectedRevision: current.revision, document: doc }))).ok()).toBe(true);
    const start = performance.now(); await page.goto('/'); await expect(page.getByRole('status')).toContainText('Prototype prêt');
    const navigationToReadyMs = performance.now() - start;
    const editorReloadMs = await page.evaluate(() => performance.getEntriesByName('spike-editor-reload').at(-1)!.duration);
    expect(normalize(JSON.parse((await page.locator('#json').textContent())!)).document).toEqual(doc);
    await page.getByRole('textbox').click(); await page.keyboard.press('Control+End'); await page.keyboard.insertText(' Suite e\u0301 👩🏽‍💻.');
    const edit = normalize(JSON.parse((await page.locator('#json').textContent())!)).document;
    const saveStart = performance.now(); await page.getByRole('button', { name: 'Enregistrer', exact: true }).click(); await expect(page.getByRole('status')).toHaveText('Enregistrement confirmé.');
    const saveAcknowledgedMs = performance.now() - saveStart;
    expect((await (await request.get('/api/current')).json()).document).toEqual(edit);
    measurements.push({ blocks, jsonBytes: Buffer.byteLength(JSON.stringify(doc)), navigationToReadyMs, editorReloadMs, saveAcknowledgedMs, samples: 1 });
  }
  await mkdir('results', { recursive: true });
  await writeFile('results/browser-measurements.json', JSON.stringify({ measuredAt: new Date().toISOString(), browser: page.context().browser()!.version(), methodology: 'Un passage par taille dans Chromium headless. Navigation inclut réseau local/bundle ; editorReload inclut setContent, construction de la vue et génération du JSON affiché, pas une garantie de paint complet. Aucun seuil SLA.', measurements }, null, 2));
});
