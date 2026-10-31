import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { EditorState } from '@tiptap/pm/state';
import { normalize, serialize, fromDoc, model, plainText, LIMITS, safeUrl, DocumentError, schema } from '../src/document.ts';
import { corpus, rich, document, paragraph, text, longDocument } from '../src/corpus.ts';
import { textDiff, richDiff } from '../src/diff.ts';
import { markdownExport } from '../src/markdown.ts';

for (const [name, doc] of Object.entries(corpus)) test(`JSON : sérialisation, rechargement, réédition sans perte — ${name}`, () => {
  const serialized = serialize(doc), loaded = normalize(JSON.parse(serialized)).document;
  assert.deepEqual(loaded, doc); assert.equal(serialize(loaded), serialized);
  const state = EditorState.create({ schema, doc: model(loaded) });
  const edited = state.apply(state.tr.insertText('Suite 👩🏽‍💻 e\u0301', 1));
  const saved = fromDoc(edited.doc.toJSON());
  assert.deepEqual(model(JSON.parse(serialize(saved))).toJSON(), edited.doc.toJSON());
});
test('corpus versionné identique au générateur déterministe', async () => {
  assert.deepEqual(JSON.parse(await readFile(new URL('../corpus/documents.json', import.meta.url), 'utf8')), corpus);
});
test('scène longue : structure et toutes les marques conservées', () => {
  const doc = longDocument(2500); assert.deepEqual(normalize(JSON.parse(serialize(doc))).document, doc);
  assert.equal(model(doc).childCount, 2500);
});
test('normalisation déterministe : vide, ordre des marks, attributs par défaut', () => {
  assert.deepEqual(fromDoc({ type: 'doc', content: [] }), corpus.empty);
  const a = document(paragraph(text('Élise', [{ type: 'bold' }, { type: 'italic' }])));
  const b = document(paragraph(text('Élise', [{ type: 'italic' }, { type: 'bold' }])));
  assert.deepEqual(a, b); assert.equal(normalize(a).normalized, false);
});
test('Unicode : NFC/NFD, emoji ZWJ, RTL, apostrophe et espaces restent exacts', () => {
  const value = 'é|e\u0301|Å|A\u030a|👨‍👩‍👧‍👦|🇫🇷|مرحبا|漢字|𐐷|l’apostrophe  \u00a0\u202f';
  assert.equal(plainText(JSON.parse(serialize(document(paragraph(text(value)))))), value);
  assert.notEqual(serialize(document(paragraph(text('é')))), serialize(document(paragraph(text('e\u0301')))));
});
test('insertion, suppression, remplacement et déplacement par vraies transactions ProseMirror', () => {
  let state = EditorState.create({ schema, doc: model(document(paragraph(text('A')), paragraph(text('B')), paragraph(text('C')))) });
  state = state.apply(state.tr.insert(0, schema.node('paragraph', null, schema.text('Nouveau'))));
  state = state.apply(state.tr.delete(0, state.doc.firstChild!.nodeSize));
  state = state.apply(state.tr.insertText('Remplacé', 1, 2));
  const first = state.doc.firstChild!, remaining = state.doc.content.size - first.nodeSize;
  state = state.apply(state.tr.delete(0, first.nodeSize).insert(remaining, first));
  assert.equal(state.doc.lastChild!.textContent, 'Remplacé');
  assert.deepEqual(model(JSON.parse(serialize(fromDoc(state.doc.toJSON())))).toJSON(), state.doc.toJSON());
});
test('migration contrôlée v1 strong/em → v2 bold/italic ; source inchangée', () => {
  const old = { format: 'storymaster-scene-spike', schemaVersion: 1, doc: { type: 'doc', content: [paragraph(text('Ancien', [{ type: 'strong' }, { type: 'em' }]))] } };
  const before = JSON.stringify(old), result = normalize(old);
  assert.equal(result.migrated, true); assert.equal(result.document.schemaVersion, 2);
  assert.deepEqual(result.document.doc.content![0]!.content![0]!.marks!.map(m => m.type), ['bold', 'italic']);
  assert.equal(JSON.stringify(old), before); assert.equal(plainText(result.document), 'Ancien');
});
for (const [label, raw] of [
  ['version future', { ...corpus.empty, schemaVersion: 99 }],
  ['nœud script', { ...rich, doc: { type: 'doc', content: [{ type: 'script', text: 'alert(1)' }] } }],
  ['image distante', { ...rich, doc: { type: 'doc', content: [{ type: 'image', attrs: { src: 'https://example.test/track' } }] } }],
  ['marque inconnue', { ...rich, doc: { type: 'doc', content: [paragraph(text('A', [{ type: 'underline' }]))] } }],
  ['marque dupliquée', { ...rich, doc: { type: 'doc', content: [paragraph(text('A', [{ type: 'bold' }, { type: 'bold' }]))] } }],
  ['événement HTML', { ...rich, doc: { type: 'doc', content: [{ type: 'paragraph', attrs: { onclick: 'alert(1)' } }] } }],
  ['parent liste invalide', { ...rich, doc: { type: 'doc', content: [{ type: 'bulletList', content: [text('A')] }] } }],
  ['contenu sur texte', { ...rich, doc: { type: 'doc', content: [paragraph({ type: 'text', text: 'A', content: [text('Perdu')] })] } }],
  ['texte vide', { ...rich, doc: { type: 'doc', content: [paragraph(text(''))] } }],
  ['surrogate isolé', { ...rich, doc: { type: 'doc', content: [paragraph(text('\ud800'))] } }],
] as const) test(`validation serveur : refus sans perte — ${label}`, () => assert.throws(() => normalize(raw), DocumentError));
for (const url of ['javascript:alert(1)', 'data:text/html,<script>1</script>', '//evil.test', 'file:///etc/passwd', 'https://user:secret@example.test', 'java\nscript:alert(1)', ' javascript:alert(1)', 'vbscript:1']) {
  test(`lien dangereux refusé : ${url.split(':')[0]}`, () => {
    assert.equal(safeUrl(url), false);
    assert.throws(() => document(paragraph(text('Lien', [{ type: 'link', attrs: { href: url } }]))), DocumentError);
  });
}
test('bornes : taille, profondeur et nombre de nœuds refusés explicitement', () => {
  assert.throws(() => document(paragraph(text('x'.repeat(LIMITS.bytes)))), (e: unknown) => e instanceof DocumentError && e.code === 'DOCUMENT_TOO_LARGE');
  let nested: import('@tiptap/core').JSONContent = paragraph(text('Fond'));
  for (let i = 0; i < LIMITS.depth; i++) nested = { type: 'blockquote', content: [nested] };
  assert.throws(() => fromDoc({ type: 'doc', content: [nested] }), /profond/);
  assert.throws(() => fromDoc({ type: 'doc', content: Array.from({ length: LIMITS.nodes }, () => paragraph()) }), /complexe/);
});
test('diff textuel : mots français/emoji ; ne détecte pas une modification de marks', () => {
  const a = document(paragraph(text('Élise 👩🏽‍💻 revient.'))), b = document(paragraph(text('Élise 👩🏽‍💻 part.')));
  const delta = textDiff(a, b); assert.ok(delta.words!.some(c => c.added && c.value.includes('part')));
  const formatted = document(paragraph(text('Élise 👩🏽‍💻 revient.', [{ type: 'bold' }])));
  assert.ok(textDiff(a, formatted).words!.every(c => !c.added && !c.removed));
  assert.equal(richDiff(a, formatted).changes[0]!.kind, 'format');
});
test('diff riche : déplacement d’un bloc sans faux déplacement des voisins décalés', () => {
  const a = document(paragraph(text('A')), paragraph(text('B')), paragraph(text('C')));
  const b = document(paragraph(text('B')), paragraph(text('C')), paragraph(text('A')));
  const delta = richDiff(a, b); assert.equal(delta.fallback, false);
  assert.deepEqual(delta.changes.map(c => [c.kind, c.from, c.to]), [['moved', 0, 2]]);
});
test('diff riche : ajout, suppression, texte et attribut de titre', () => {
  const a = document(paragraph(text('Avant'))), b = document(paragraph(text('Après')));
  assert.equal(richDiff(a, b).changes[0]!.kind, 'edited');
  assert.ok(richDiff(a, document(paragraph(text('Avant')), paragraph(text('Ajout')))).changes.some(c => c.kind === 'added'));
  assert.ok(richDiff(document(paragraph(text('Avant')), paragraph(text('Retiré'))), a).changes.some(c => c.kind === 'removed'));
  const h = (level: number) => document({ type: 'heading', attrs: { level }, content: [text('Titre')] });
  assert.equal(richDiff(h(1), h(2)).changes[0]!.kind, 'structure');
});
test('diff ambigu et grands documents : fallback explicite avec les deux versions complètes', () => {
  const a = corpus.repeated, b = document(...a.doc.content!, paragraph(text('Suite')));
  const delta = richDiff(a, b); assert.equal(delta.fallback, true); assert.match(delta.reason, /ambigus/);
  assert.deepEqual(delta.before, a); assert.deepEqual(delta.after, b);
  assert.equal(richDiff(longDocument(2001), longDocument(2002)).fallback, true);
});
test('export Markdown : pertes contrôlées, jamais présenté comme snapshot exact', () => {
  for (const doc of Object.values(corpus)) {
    const exported = markdownExport(doc); assert.equal(typeof exported.markdown, 'string');
    if (JSON.stringify(exported.roundTrip) !== JSON.stringify(doc)) assert.ok(exported.losses.length > 0);
  }
  assert.equal(markdownExport(document(paragraph(text('A')), paragraph(), paragraph(), paragraph(text('B')))).losses.length, 0);
  assert.equal(markdownExport(corpus.markSpaces).losses[0]!.kind, 'structure_or_marks');
  assert.equal(markdownExport(corpus.doubleBreak).losses[0]!.kind, 'text_or_linebreaks');
});
test('même texte sous des marks différents : ambiguïté détectée au lieu d’inventer un mouvement', () => {
  const a = document(paragraph(text('Répété', [{ type: 'bold' }])), paragraph(text('Répété', [{ type: 'italic' }])));
  const b = document(...[...a.doc.content!].reverse());
  assert.equal(richDiff(a, b).fallback, true);
});
test('borne de texte par nœud alignée sur le RichNode déjà spécifié', () => {
  assert.throws(() => document(paragraph(text('x'.repeat(LIMITS.textLength + 1)))), DocumentError);
});
test('changement de destination d’un lien : détail lisible malgré un texte identique', () => {
  const link = (href: string) => document(paragraph(text('Le même lien', [{ type: 'link', attrs: { href } }])));
  const delta = richDiff(link('https://before.example.test'), link('https://after.example.test'));
  assert.equal(delta.changes[0]!.kind, 'format');
  assert.match(delta.changes[0]!.details!.before.join(' '), /before.example.test/);
  assert.match(delta.changes[0]!.details!.after.join(' '), /after.example.test/);
});
