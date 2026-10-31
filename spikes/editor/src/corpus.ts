import type { JSONContent } from '@tiptap/core';
import { fromDoc } from './document.ts';
export const text = (value: string, marks?: JSONContent['marks']): JSONContent => ({ type: 'text', text: value, ...(marks ? { marks } : {}) });
export const paragraph = (...content: JSONContent[]): JSONContent => ({ type: 'paragraph', ...(content.length ? { content } : {}) });
export const document = (...content: JSONContent[]) => fromDoc({ type: 'doc', content });
export const rich = document(
  { type: 'heading', attrs: { level: 2 }, content: [text('Le retour d’Élise')] },
  paragraph(text('Élise et Noe\u0308l — œ, ç, é, e\u0301, 👩🏽‍💻, 🏳️‍🌈, 𐐷, 漢字, العربية.')),
  paragraph(text('Une idée ', [{ type: 'bold' }]), text('douce', [{ type: 'italic' }]), text(' et ', [{ type: 'bold' }, { type: 'italic' }]), text('barrée', [{ type: 'strike' }]), text(' ; un lien', [{ type: 'link', attrs: { href: 'https://example.test/livre?chapitre=1&langue=fr', title: 'Le livre' } }])),
  { type: 'blockquote', content: [paragraph(text('« Chaque histoire commence par un espace à soi. »'))] },
  { type: 'bulletList', content: [{ type: 'listItem', content: [paragraph(text('Un départ'))] }, { type: 'listItem', content: [paragraph(text('Un retour')), { type: 'orderedList', attrs: { start: 3 }, content: [{ type: 'listItem', content: [paragraph(text('Dans une liste imbriquée'))] }] }] }] },
  paragraph(text('— Tu reviendras ?'), { type: 'hardBreak' }, text('— À l’aube, répondit-elle.')),
  paragraph(), paragraph(text('<script>globalThis.executable = true</script> : ceci est du texte littéral.')),
);
export function longDocument(blocks: number) {
  return document(...Array.from({ length: blocks }, (_, i) => paragraph(
    text(`Passage ${i.toString().padStart(5, '0')} : Élise retrouve Noe\u0308l. `),
    text('La ville s’éveille 👩🏽‍💻. ', [{ type: i % 2 ? 'bold' : 'italic' }]),
    text('Une phrase supprimée. ', [{ type: 'strike' }]),
    text('La lumière revient doucement sur les façades. '.repeat(2)),
  )));
}
export const corpus = { markSpaces: document(paragraph(text(' espaces ', [{type:'bold'}]))), doubleBreak: document(paragraph(text('A'), {type:'hardBreak'}, {type:'hardBreak'}, text('B'))), empty: document(), rich, unicode: document(paragraph(text('é|e\u0301|Å|A\u030a|👨‍👩‍👧‍👦|🇫🇷|مرحبا|漢字|𐐷|l’apostrophe'))), repeated: document(paragraph(text('Même phrase.')), paragraph(text('Même phrase.'))) };
