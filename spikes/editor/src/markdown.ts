import { MarkdownManager } from '@tiptap/markdown';
import { extensions, normalize, fromDoc, plainText } from './document.ts';
export function markdownExport(input: unknown) {
  const document = normalize(input).document;
  const manager = new MarkdownManager({ extensions: extensions() });
  const markdown = manager.serialize(document.doc);
  try {
    const roundTrip = fromDoc(manager.parse(markdown));
    return { markdown, roundTrip, losses: JSON.stringify(document) === JSON.stringify(roundTrip) ? [] : [
      { kind: plainText(document) === plainText(roundTrip) ? 'structure_or_marks' : 'text_or_linebreaks',
        message: 'Le réimport Markdown diffère du JSON canonique ; conserver le JSON pour une restauration exacte.' },
    ] };
  } catch {
    return { markdown, roundTrip: null, losses: [{ kind: 'reimport_rejected', message: 'Le réimport ne respecte pas le schéma strict ; le Markdown reste un export dérivé, jamais une sauvegarde exacte.' }] };
  }
}
