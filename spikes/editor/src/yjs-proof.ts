import * as Y from 'yjs';
import { prosemirrorJSONToYDoc, yDocToProsemirrorJSON } from 'y-prosemirror';
import { schema, normalize, fromDoc } from './document.ts';
export const field = 'scene';
export function importOnce(value: unknown): Y.Doc {
  return prosemirrorJSONToYDoc(schema, normalize(value).document.doc, field);
}
export function project(doc: Y.Doc) { return fromDoc(yDocToProsemirrorJSON(doc, field)); }
export function snapshot(doc: Y.Doc) { return { update: Y.encodeStateAsUpdate(doc), vector: Y.encodeStateVector(doc) }; }
export function reload(update: Uint8Array): Y.Doc { const doc = new Y.Doc(); Y.applyUpdate(doc, update); return doc; }
export { Y };
