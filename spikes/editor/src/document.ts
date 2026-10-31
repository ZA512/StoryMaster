import { getSchema } from '@tiptap/core';
import type { JSONContent } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Schema } from '@tiptap/pm/model';
import type { Node as PMNode } from '@tiptap/pm/model';

export const LIMITS = { bytes: 2 * 1024 * 1024, depth: 32, nodes: 50_000, textLength: 1_000_000 } as const;
export class DocumentError extends Error {
  constructor(public code: string, message: string) { super(message); }
}
const reject = (message: string): never => { throw new DocumentError('INVALID_DOCUMENT', message); };
export function safeUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 2048 || [...value].some(c => c.codePointAt(0)! <= 32 || c.codePointAt(0) === 127)) return false;
  try {
    const url = new URL(value);
    return ['https:', 'http:', 'mailto:'].includes(url.protocol) && !url.username && !url.password;
  } catch { return false; }
}
export function extensions() {
  return [StarterKit.configure({ code: false, codeBlock: false, horizontalRule: false,
    underline: false, trailingNode: false, dropcursor: false,
    link: { openOnClick: false, autolink: false, linkOnPaste: false,
      HTMLAttributes: { target: null, rel: 'noopener noreferrer nofollow', class: null },
      isAllowedUri: url => safeUrl(url) },
  })];
}
export const schema = getSchema(extensions());
// Ancien schéma d'essai : noms ProseMirror strong/em, remplacés explicitement par bold/italic.
const legacyMarks: Record<string, import('@tiptap/pm/model').MarkSpec> = {};
schema.spec.marks.forEach((name, spec) => { legacyMarks[name === 'bold' ? 'strong' : name === 'italic' ? 'em' : name] = spec; });
const schemaV1 = new Schema({ nodes: schema.spec.nodes, marks: legacyMarks });
export interface SceneDocument { format: 'storymaster-scene-spike'; schemaVersion: 2; doc: JSONContent }
export interface Normalized { document: SceneDocument; migrated: boolean; normalized: boolean }
const nodes = new Set(['doc', 'paragraph', 'text', 'heading', 'bulletList', 'orderedList', 'listItem', 'blockquote', 'hardBreak']);
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return reject('Objet JSON attendu.');
  return value as Record<string, unknown>;
}
function keys(value: Record<string, unknown>, allowed: string[]) {
  if (Object.keys(value).some(k => !allowed.includes(k))) reject('Propriété inconnue : refus sans suppression de contenu.');
}
function walkDocument(value: unknown, version: number): JSONContent {
  let count = 0;
  const visit = (raw: unknown, depth: number): JSONContent => {
    if (++count > LIMITS.nodes || depth > LIMITS.depth) reject('Document trop profond ou trop complexe.');
    const n = record(raw); keys(n, ['type', 'attrs', 'content', 'marks', 'text']);
    if (typeof n.type !== 'string' || !nodes.has(n.type)) reject('Nœud interdit.');
    if (n.text !== undefined && n.type !== 'text') reject('Texte sur un nœud non textuel.');
    if (n.type === 'text' && (typeof n.text !== 'string' || !n.text || n.text.length > LIMITS.textLength || !n.text.isWellFormed())) reject('Texte vide ou Unicode mal formé.');
    if (['text', 'hardBreak'].includes(String(n.type)) && n.content !== undefined) reject('Contenu sur un nœud feuille.');
    if (n.marks !== undefined && !['text', 'hardBreak'].includes(String(n.type)) && (!Array.isArray(n.marks) || n.marks.length)) reject('Marques sur un bloc interdites.');
    if (n.content !== undefined && !Array.isArray(n.content)) reject('Liste de contenus attendue.');
    const attrs = n.attrs === undefined ? {} : record(n.attrs);
    if (n.type === 'heading') {
      keys(attrs, ['level']);
      if (attrs.level !== undefined && (!Number.isInteger(attrs.level) || Number(attrs.level) < 1 || Number(attrs.level) > 6)) reject('Niveau de titre invalide.');
    } else if (n.type === 'orderedList') {
      keys(attrs, ['start', 'type']);
      if (attrs.start !== undefined && (!Number.isInteger(attrs.start) || Number(attrs.start) < 1 || Number(attrs.start) > 1_000_000)) reject('Numérotation invalide.');
      if (attrs.type !== undefined && attrs.type !== null && !['1', 'a', 'A', 'i', 'I'].includes(String(attrs.type))) reject('Type de liste invalide.');
    } else keys(attrs, []);
    if (n.marks !== undefined && !Array.isArray(n.marks)) reject('Liste de marques attendue.');
    const seen = new Set<string>();
    const marks = ((n.marks ?? []) as unknown[]).map(rawMark => {
      const m = record(rawMark); keys(m, ['type', 'attrs']);
      const allowed = version === 1 ? ['strong', 'em', 'strike', 'link'] : ['bold', 'italic', 'strike', 'link'];
      if (typeof m.type !== 'string' || !allowed.includes(m.type) || seen.has(m.type)) return reject('Marque inconnue ou dupliquée.');
      seen.add(m.type);
      const a = m.attrs === undefined ? {} : record(m.attrs);
      if (m.type === 'link') {
        keys(a, ['href', 'title', 'target', 'rel', 'class']);
        if (!safeUrl(a.href)) reject('URL non autorisée.');
        if (a.title !== undefined && a.title !== null && (typeof a.title !== 'string' || a.title.length > 400)) reject('Titre de lien invalide.');
        if ((a.target !== undefined && a.target !== null) || (a.class !== undefined && a.class !== null) || (a.rel !== undefined && a.rel !== 'noopener noreferrer nofollow')) reject('Attribut de lien non autorisé.');
      } else keys(a, []);
      return { type: m.type, ...(m.attrs !== undefined ? { attrs: a } : {}) };
    });
    // Ordre des marks déterministe ; aucune modification NFC/NFD, espace ou ponctuation.
    const rank = version === 1 ? ['link', 'strong', 'em', 'strike'] : ['link', 'bold', 'italic', 'strike'];
    marks.sort((a, b) => rank.indexOf(a.type) - rank.indexOf(b.type));
    return { type: n.type as string, ...(n.text !== undefined ? { text: n.text as string } : {}),
      ...(n.attrs !== undefined ? { attrs } : {}), ...(marks.length ? { marks } : {}),
      ...(n.content !== undefined ? { content: (n.content as unknown[]).map(c => visit(c, depth + 1)) } : {}) };
  };
  return visit(value, 1);
}
export function normalize(input: unknown): Normalized {
  let serialized: string;
  try { serialized = JSON.stringify(input); } catch { return reject('JSON non sérialisable.'); }
  if (!serialized || new TextEncoder().encode(serialized).byteLength > LIMITS.bytes) throw new DocumentError('DOCUMENT_TOO_LARGE', 'Document au-delà de la limite expérimentale de 2 Mio.');
  const envelope = record(input); keys(envelope, ['format', 'schemaVersion', 'doc']);
  if (envelope.format !== 'storymaster-scene-spike' || ![1, 2].includes(Number(envelope.schemaVersion)) || typeof envelope.schemaVersion !== 'number') reject('Format ou version inconnue.');
  const version = envelope.schemaVersion as number;
  let doc = walkDocument(envelope.doc, version);
  if (doc.type !== 'doc') reject('Racine doc requise.');
  if (!doc.content?.length) doc = { type: 'doc', content: [{ type: 'paragraph' }] };
  try {
    const model = (version === 1 ? schemaV1 : schema).nodeFromJSON(doc);
    model.check();
    if (version === 1) {
      const migrate = (n: JSONContent): JSONContent => ({ ...n,
        ...(n.marks ? { marks: n.marks.map(m => ({ ...m, type: m.type === 'strong' ? 'bold' : m.type === 'em' ? 'italic' : m.type })) } : {}),
        ...(n.content ? { content: n.content.map(migrate) } : {}),
      });
      doc = migrate(model.toJSON());
    }
    const canonical = schema.nodeFromJSON(doc); canonical.check();
    const document: SceneDocument = { format: 'storymaster-scene-spike', schemaVersion: 2, doc: JSON.parse(JSON.stringify(canonical.toJSON())) as JSONContent };
    if (new TextEncoder().encode(JSON.stringify(document)).byteLength > LIMITS.bytes) throw new DocumentError('DOCUMENT_TOO_LARGE', 'JSON canonique trop volumineux.');
    return { document, migrated: version === 1, normalized: serialized !== JSON.stringify(document) };
  } catch (error) {
    if (error instanceof DocumentError) throw error;
    return reject('Structure incompatible avec le schéma ProseMirror.');
  }
}
export const fromDoc = (doc: JSONContent): SceneDocument => normalize({ format: 'storymaster-scene-spike', schemaVersion: 2, doc }).document;
export const model = (value: unknown): PMNode => schema.nodeFromJSON(normalize(value).document.doc);
export const serialize = (value: unknown): string => JSON.stringify(normalize(value).document);
export const plainText = (value: unknown): string => { const node = model(value); return node.textBetween(0, node.content.size, '\n', '\n'); };
