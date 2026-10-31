import { diffArrays } from 'diff';
import type { JSONContent } from '@tiptap/core';
import { normalize, model } from './document.ts';
export interface WordChange { value: string; added: boolean; removed: boolean }
const options = { timeout: 40, maxEditLength: 4000 };
export function words(before: string, after: string): WordChange[] | null {
  const segmenter = new Intl.Segmenter('fr', { granularity: 'word' });
  const tokens = (s: string) => [...segmenter.segment(s)].map(x => x.segment);
  const result = diffArrays(tokens(before), tokens(after), options);
  return result?.map(x => ({ value: x.value.join(''), added: !!x.added, removed: !!x.removed })) ?? null;
}
const text = (n: JSONContent): string => n.type === 'text' ? n.text! : n.type === 'hardBreak' ? '\n' : (n.content ?? []).map(text).join(['listItem', 'blockquote'].includes(n.type!) ? '\n' : '');
export function textDiff(before: unknown, after: unknown) {
  const a = model(before), b = model(after), blocksA: string[] = [], blocksB: string[] = [];
  a.forEach(n => blocksA.push(n.textBetween(0, n.content.size, '\n', '\n')));
  b.forEach(n => blocksB.push(n.textBetween(0, n.content.size, '\n', '\n')));
  const blocks = diffArrays(blocksA, blocksB, options);
  return { strategy: 'text-blocks-words', blocks: blocks ?? null,
    words: words(blocksA.join('\n\n'), blocksB.join('\n\n')),
    limitation: 'Ne distingue ni marks, ni type de nœud, ni déplacement de façon fiable.' };
}
export interface RichChange { kind: 'added' | 'removed' | 'moved' | 'edited' | 'format' | 'structure'; from?: number; to?: number; label: string; words?: WordChange[] | null; before?: JSONContent; after?: JSONContent; details?: { before: string[]; after: string[] } }
export function describeFormat(node: JSONContent): string[] {
  const result: string[] = [];
  const walk = (n: JSONContent) => {
    if (n.type === 'heading') result.push(`Titre de niveau ${n.attrs?.level ?? 1}`);
    for (const mark of n.marks ?? []) {
      const name = mark.type === 'bold' ? 'Gras' : mark.type === 'italic' ? 'Italique' : mark.type === 'strike' ? 'Barré' : `Lien vers ${mark.attrs?.href}${mark.attrs?.title ? ' · titre : ' + mark.attrs.title : ''}`;
      result.push(`${name} sur « ${(n.text ?? 'saut de ligne').slice(0, 120)} »`);
    }
    n.content?.forEach(walk);
  };
  walk(node); return result;
}
export function richDiff(before: unknown, after: unknown) {
  const a = normalize(before).document, b = normalize(after).document;
  const base = { before: a, after: b };
  const fallback = (reason: string) => ({ ...base, fallback: true, reason, changes: [] as RichChange[] });
  const A = a.doc.content!, B = b.doc.content!, sigA = A.map(n => JSON.stringify(n)), sigB = B.map(n => JSON.stringify(n));
  if (JSON.stringify(a) === JSON.stringify(b)) return { ...base, fallback: false, reason: '', changes: [] as RichChange[] };
  if (Math.max(A.length, B.length) > 2000) return fallback('Plus de 2 000 blocs : comparaison détaillée bornée, versions intégrales conservées.');
  if (new Set(sigA).size !== sigA.length || new Set(sigB).size !== sigB.length) return fallback('Blocs identiques répétés : identité et déplacement ambigus.');
  if (new Set(A.map(text)).size !== A.length || new Set(B.map(text)).size !== B.length) return fallback('Texte de blocs répété avec des marks différents : alignement ambigu.');
  const delta = diffArrays(sigA, sigB, options);
  if (!delta) return fallback('Budget du calcul de diff dépassé.');
  const removed: number[] = [], added: number[] = []; let i = 0, j = 0;
  for (const part of delta) {
    if (part.removed) { for (let n = 0; n < part.count; n++) removed.push(i++); }
    else if (part.added) { for (let n = 0; n < part.count; n++) added.push(j++); }
    else { i += part.count; j += part.count; }
  }
  const changes: RichChange[] = [], used = new Set<number>();
  for (const from of removed) {
    const to = added.find(index => !used.has(index) && sigB[index] === sigA[from]);
    if (to !== undefined) { used.add(to); changes.push({ kind: 'moved', from, to, label: `Bloc déplacé de ${from + 1} à ${to + 1}`, before: A[from], after: B[to] }); continue; }
    const candidate = added.find(index => !used.has(index) && B[index]?.type === A[from]?.type);
    if (candidate !== undefined) {
      used.add(candidate); const old = A[from]!, next = B[candidate]!;
      if (!['paragraph', 'heading'].includes(old.type!)) return fallback('Modification de structure imbriquée : lire les versions avant et après.');
      const oldText = text(old), newText = text(next), kind = JSON.stringify(old.attrs) !== JSON.stringify(next.attrs) ? 'structure' : oldText === newText ? 'format' : 'edited';
      const wordChanges = words(oldText, newText);
      if (!wordChanges) return fallback('Budget du diff de mots dépassé.');
      changes.push({ kind, from, to: candidate, details: { before: describeFormat(old), after: describeFormat(next) }, label: kind === 'format' ? `Mise en forme du bloc ${from + 1} modifiée (texte identique)` : kind === 'structure' ? `Structure du bloc ${from + 1} modifiée` : `Texte du bloc ${from + 1} modifié`, words: wordChanges, before: old, after: next });
    } else changes.push({ kind: 'removed', from, label: `Bloc ${from + 1} supprimé`, before: A[from] });
  }
  for (const to of added) if (!used.has(to)) changes.push({ kind: 'added', to, label: `Bloc ${to + 1} inséré`, after: B[to] });
  // Aucun identifiant de bloc stable : plusieurs blocs réécrits peuvent être appariés de plusieurs façons.
  if (changes.filter(c => ['edited', 'format', 'structure'].includes(c.kind)).length > 1) return fallback('Plusieurs blocs réécrits : alignement non garanti sans identité stable.');
  return { ...base, fallback: false, reason: '', changes };
}
