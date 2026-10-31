import { Editor } from '@tiptap/core';
import { DOMSerializer } from '@tiptap/pm/model';
import { extensions, fromDoc, model, safeUrl } from './document.ts';
import type { SceneDocument } from './document.ts';
import type { Revision } from './store.ts';
import type { richDiff, textDiff } from './diff.ts';
import { describeFormat } from './diff.ts';
const element = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
let current: Revision; let samples: Record<string, SceneDocument>;
const message = (text: string, error = false) => { element('message').textContent = text; element('message').className = error ? 'error' : ''; };
async function api<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch('/api/' + path, body === undefined ? { cache: 'no-store' } : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error === 'REVISION_CONFLICT' ? 'Conflit de révision : votre brouillon est conservé. Rechargez explicitement pour abandonner ses modifications.' : data.message ?? data.error);
  return data as T;
}
const editor = new Editor({ element: element('editor'), extensions: extensions(), injectCSS: false,
  enableContentCheck: true, content: { type: 'doc', content: [{ type: 'paragraph' }] },
  editorProps: { attributes: { 'aria-label': 'Brouillon de scène', role: 'textbox', 'aria-multiline': 'true' } },
  onUpdate: () => { element('json').textContent = JSON.stringify(fromDoc(editor.getJSON()), null, 2); message('Brouillon modifié, non enregistré.'); },
  onContentError: () => { editor.setEditable(false); message('Contenu incompatible : édition arrêtée sans sauvegarde.', true); },
});
const draft = () => fromDoc(editor.getJSON());
function adopt(revision: Revision) {
  performance.mark('spike-reload-start');
  current = revision; editor.commands.setContent(revision.document.doc, { emitUpdate: false, errorOnInvalidContent: true });
  element('revision').textContent = `Révision enregistrée : ${current.revision}`;
  element('json').textContent = JSON.stringify(draft(), null, 2);
  performance.mark('spike-reload-end'); performance.measure('spike-editor-reload', 'spike-reload-start', 'spike-reload-end');
}
async function history() {
  const rows = await api<{ revision: number; restored_from: number | null }[]>('history'), select = element<HTMLSelectElement>('history'); select.replaceChildren();
  for (const row of rows) { const option = document.createElement('option'); option.value = String(row.revision); option.textContent = `Révision ${row.revision}` + (row.restored_from ? ` · restaurée depuis r${row.restored_from}` : ''); select.append(option); }
}
const run = (work: () => Promise<void>) => void work().catch(e => message(e instanceof Error ? e.message : 'Échec explicite.', true));
element('save').onclick = () => run(async () => { adopt(await api<Revision>('save', { document: draft(), expectedRevision: current.revision })); await history(); message('Enregistrement confirmé.'); });
element('reload').onclick = () => run(async () => { if (confirm('Abandonner le brouillon et recharger la version enregistrée ?')) { adopt(await api<Revision>('current')); await history(); message('Version enregistrée rechargée.'); } });
element('restore').onclick = () => run(async () => { adopt(await api<Revision>('restore', { expectedRevision: current.revision, sourceRevision: Number(element<HTMLSelectElement>('history').value) })); await history(); message('Version restaurée dans une nouvelle révision.'); });
element('load-corpus').onclick = () => { const selected = samples[element<HTMLSelectElement>('corpus').value]!; editor.commands.setContent(selected.doc, { errorOnInvalidContent: true }); message('Corpus chargé dans le brouillon, non enregistré.'); };
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-command]')) button.onclick = () => {
  const chain = editor.chain().focus(), command = button.dataset.command;
  if (command === 'bold') chain.toggleBold().run(); if (command === 'italic') chain.toggleItalic().run(); if (command === 'strike') chain.toggleStrike().run();
  if (command === 'heading') chain.toggleHeading({ level: 2 }).run(); if (command === 'bullet') chain.toggleBulletList().run(); if (command === 'ordered') chain.toggleOrderedList().run(); if (command === 'quote') chain.toggleBlockquote().run();
  if (command === 'link') { const href = prompt('Lien absolu http, https ou mailto :'); if (href && safeUrl(href)) chain.setLink({ href }).run(); else if (href) message('Lien refusé.', true); }
};
element('move').onclick = () => { const first = editor.state.doc.firstChild!; if (editor.state.doc.childCount > 1) editor.view.dispatch(editor.state.tr.delete(0, first.nodeSize).insert(editor.state.doc.content.size - first.nodeSize, first)); };
function preview(value: SceneDocument, title: string) {
  const div = document.createElement('div'); div.className = 'preview'; const heading = document.createElement('h3'); heading.textContent = title; div.append(heading);
  div.append(DOMSerializer.fromSchema(editor.schema).serializeFragment(model(value).content));
  const links = describeFormat(value.doc).filter(line => line.startsWith('Lien vers'));
  if (links.length) { const list = document.createElement('ul'); for (const link of links) { const li = document.createElement('li'); li.textContent = link; list.append(li); } div.append(list); }
  return div;
}
element('compare').onclick = () => run(async () => {
  const result = await api<{ rich: ReturnType<typeof richDiff>; text: ReturnType<typeof textDiff> }>('compare', { document: draft(), sourceRevision: Number(element<HTMLSelectElement>('history').value) });
  const target = element('diff'); target.replaceChildren();
  const title = document.createElement('h3'); title.textContent = 'Diff structurel et mise en forme'; target.append(title);
  if (result.rich.fallback) { const warning = document.createElement('p'); warning.className = 'fallback'; warning.textContent = 'Comparaison ambiguë — ' + result.rich.reason; target.append(warning); }
  else { const list = document.createElement('ul'); for (const change of result.rich.changes) { const item = document.createElement('li'); item.textContent = change.label; if (change.details && JSON.stringify(change.details.before) !== JSON.stringify(change.details.after)) { const details = document.createElement('p'); details.textContent = `Avant : ${change.details.before.join(' ; ') || 'sans marque'}. Après : ${change.details.after.join(' ; ') || 'sans marque'}.`; item.append(details); } list.append(item); } target.append(list); }
  const versions = document.createElement('div'); versions.className = 'versions'; versions.append(preview(result.rich.before, 'Avant · version enregistrée'), preview(result.rich.after, 'Après · brouillon')); target.append(versions);
  const textTitle = document.createElement('h3'); textTitle.textContent = 'Diff textuel par blocs et mots (sans marks)'; target.append(textTitle);
  const wordContainer = document.createElement('p'); wordContainer.className = 'word-diff';
  for (const part of result.text.words ?? []) { const span = document.createElement(part.added ? 'ins' : part.removed ? 'del' : 'span'); span.textContent = part.value; wordContainer.append(span); }
  if (!result.text.words) wordContainer.textContent = 'Budget de diff dépassé : lire les versions intégrales.'; target.append(wordContainer);
});
element('markdown').onclick = () => run(async () => {
  const result = await api<{ markdown: string; losses: { message: string }[] }>('markdown', { document: draft() });
  element('markdown-output').textContent = result.markdown; element('losses').textContent = result.losses.length ? result.losses.map(l => l.message).join(' ') : 'Aucune perte détectée sur ce document avec le réimport Tiptap testé.';
  element('losses').className = result.losses.length ? 'warning' : ''; element('losses').closest('details')!.open = true;
});
run(async () => { samples = await api('corpus'); for (const name of Object.keys(samples)) { const option = document.createElement('option'); option.value = name; option.textContent = name; element('corpus').append(option); } element<HTMLSelectElement>('corpus').value = 'rich'; adopt(await api<Revision>('current')); await history(); message('Prototype prêt. Aucune donnée du Lot 0 utilisée.'); });
