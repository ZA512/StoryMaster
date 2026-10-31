import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { RevisionStore, RevisionError, testUrl } from '../src/store.ts';
import { corpus, document, paragraph, text, rich } from '../src/corpus.ts';
import { importOnce, project, snapshot, reload, Y, field } from '../src/yjs-proof.ts';
const store = new RevisionStore(); before(() => store.init()); after(() => store.close());
test('URL fail closed : impossible de viser les données du Lot 0', () => {
  const old = process.env.SPIKE_A_DATABASE_URL;
  try { process.env.SPIKE_A_DATABASE_URL = 'postgresql://unused@localhost:55432/storymaster'; assert.throws(testUrl, /isolée/); }
  finally { if (old) process.env.SPIKE_A_DATABASE_URL = old; else delete process.env.SPIKE_A_DATABASE_URL; }
});
test('vraie PostgreSQL : save/load, révision successive, restore crée r+1 sans détruire historique', async () => {
  const a = await store.create(rich), next = document(paragraph(text('Édition e\u0301 👩🏽‍💻')));
  const b = await store.save(a.sceneId, next, 1); assert.equal(b.revision, 2);
  assert.deepEqual((await store.get(a.sceneId)).document, next);
  const restored = await store.save(a.sceneId, null, 2, 1); assert.equal(restored.revision, 3); assert.equal(restored.restoredFrom, 1);
  assert.deepEqual(restored.document, rich); assert.deepEqual((await store.get(a.sceneId, 2)).document, next);
  assert.deepEqual((await store.history(a.sceneId)).map(r => r.revision), [1, 2, 3]);
});
test('PostgreSQL : huit remplacements concurrents, une victoire et sept conflits', async () => {
  const a = await store.create(corpus.empty);
  const results = await Promise.allSettled(Array.from({ length: 8 }, (_, i) => store.save(a.sceneId, document(paragraph(text('Auteur ' + i))), 1)));
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.ok(results.filter(r => r.status === 'rejected').every(r => r.reason instanceof RevisionError && r.reason.code === 'REVISION_CONFLICT'));
  assert.equal((await store.history(a.sceneId)).length, 2);
});
test('PostgreSQL : échec snapshot injecté annule la modification et la révision', async () => {
  const a = await store.create(rich);
  const client = await store.pool.connect();
  await client.query(`CREATE OR REPLACE FUNCTION spike_fail_snapshot() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.revision=2 THEN RAISE EXCEPTION 'spike_failure'; END IF; RETURN NEW; END $$;
    CREATE TRIGGER spike_fail_snapshot BEFORE INSERT ON spike_revisions FOR EACH ROW EXECUTE FUNCTION spike_fail_snapshot()`);
  try { await assert.rejects(store.save(a.sceneId, corpus.empty, 1), /spike_failure/); }
  finally { await client.query('DROP TRIGGER spike_fail_snapshot ON spike_revisions; DROP FUNCTION spike_fail_snapshot()'); client.release(); }
  assert.equal((await store.get(a.sceneId)).revision, 1); assert.deepEqual((await store.get(a.sceneId)).document, rich);
  assert.equal((await store.history(a.sceneId)).length, 1);
});
test('Yjs : tous les corpus conservent texte, structure et marks via import + update binaire', () => {
  for (const value of Object.values(corpus)) {
    const doc = importOnce(value), saved = snapshot(doc), restored = reload(saved.update);
    try { assert.deepEqual(project(doc), value); assert.deepEqual(project(restored), value); assert.deepEqual([...Y.encodeStateVector(restored)], [...saved.vector]); }
    finally { doc.destroy(); restored.destroy(); }
  }
});
function firstText(root: Y.XmlFragment | Y.XmlElement): Y.XmlText {
  for (const item of root.toArray()) { if (item instanceof Y.XmlText) return item; if (item instanceof Y.XmlElement) { try { return firstText(item); } catch { /* Chercher le frère suivant. */ } } }
  throw new Error('Aucun texte');
}
test('Yjs : identités, ancre relative et delta restent valides après rechargement binaire', () => {
  const doc = importOnce(rich), value = firstText(doc.getXmlFragment(field));
  const anchor = Y.createRelativePositionFromTypeIndex(value, 2), state = snapshot(doc), restored = reload(state.update);
  try {
    const resolved = Y.createAbsolutePositionFromRelativePosition(anchor, restored); assert.ok(resolved); assert.equal(resolved.index, 2);
    const target = resolved.type as Y.XmlText; target.insert(target.length, ' après rechargement');
    const delta = Y.encodeStateAsUpdate(restored, state.vector); Y.applyUpdate(doc, delta); Y.applyUpdate(doc, delta);
    assert.deepEqual(project(doc), project(restored));
    const bad = importOnce(project(restored));
    try { assert.notDeepEqual([...Y.encodeStateVector(bad)], [...Y.encodeStateVector(restored)]); assert.equal(Y.createAbsolutePositionFromRelativePosition(anchor, bad), null); }
    finally { bad.destroy(); }
  } finally { doc.destroy(); restored.destroy(); }
});
test('migration par scène : import une seule fois, epoch persistant et ancien CAS interdit', async () => {
  const a = await store.create(rich), b = await store.create(corpus.unicode);
  await assert.rejects(store.migrateScene(a.sceneId, 99), (e: unknown) => e instanceof RevisionError && e.code === 'REVISION_CONFLICT');
  const migrated = await Promise.all([store.migrateScene(a.sceneId, 1), store.migrateScene(a.sceneId, 1)]);
  assert.equal(migrated[0].epoch, migrated[1].epoch); assert.deepEqual(migrated[0].binary_update, migrated[1].binary_update);
  const restored = reload(migrated[0].binary_update);
  try { assert.deepEqual(project(restored), rich); assert.deepEqual(Buffer.from(Y.encodeStateVector(restored)), migrated[0].state_vector); } finally { restored.destroy(); }
  await assert.rejects(store.save(a.sceneId, corpus.empty, 1), (e: unknown) => e instanceof RevisionError && e.code === 'EPOCH_CHANGED');
  assert.equal((await store.save(b.sceneId, corpus.rich, 1)).revision, 2);
  assert.equal((await store.history(a.sceneId)).length, 1);
});
test('tous les corpus : PostgreSQL conserve intégralement JSON, texte et marks à chaque révision', async () => {
  for (const doc of Object.values(corpus)) {
    const created = await store.create(doc); assert.deepEqual((await store.get(created.sceneId)).document, doc);
    const updated = await store.save(created.sceneId, doc, 1); assert.equal(updated.revision, 2);
    assert.deepEqual((await store.get(created.sceneId, 1)).document, doc); assert.deepEqual((await store.get(created.sceneId, 2)).document, doc);
  }
});
test('nouvelle connexion au store : le commit et l’historique sont relus depuis PostgreSQL', async () => {
  const created = await store.create(rich); await store.save(created.sceneId, corpus.unicode, 1);
  const reopened = new RevisionStore();
  try { await reopened.init(); assert.deepEqual((await reopened.get(created.sceneId)).document, corpus.unicode); assert.deepEqual((await reopened.get(created.sceneId, 1)).document, rich); }
  finally { await reopened.close(); }
});
