import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { normalize } from './document.ts';
import type { SceneDocument } from './document.ts';
import { importOnce, snapshot } from './yjs-proof.ts';
export class RevisionError extends Error { constructor(public code: 'REVISION_CONFLICT' | 'NOT_FOUND' | 'EPOCH_CHANGED') { super(code); } }
export interface Revision { sceneId: string; revision: number; document: SceneDocument; restoredFrom: number | null }
export function testUrl() {
  const value = process.env.SPIKE_A_DATABASE_URL ?? 'postgresql://spike:spike-only-fictional-local@127.0.0.1:55433/storymaster_spike_a_test';
  const url = new URL(value);
  if (url.pathname !== '/storymaster_spike_a_test' || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw new Error('Base isolée storymaster_spike_a_test sur loopback obligatoire.');
  return value;
}
export class RevisionStore {
  readonly pool = new pg.Pool({ connectionString: testUrl(), max: 12 });
  constructor() { this.pool.on('error', () => {}); }
  async init() {
    await this.pool.query(`CREATE TABLE IF NOT EXISTS spike_scenes (
      id text PRIMARY KEY, revision integer NOT NULL CHECK(revision>0), document jsonb NOT NULL,
      mode text NOT NULL DEFAULT 'json' CHECK(mode IN ('json','yjs')));
      CREATE TABLE IF NOT EXISTS spike_revisions (
      scene_id text NOT NULL REFERENCES spike_scenes(id), revision integer NOT NULL CHECK(revision>0),
      document jsonb NOT NULL, restored_from integer, PRIMARY KEY(scene_id,revision));
      CREATE TABLE IF NOT EXISTS spike_crdt (
      scene_id text PRIMARY KEY REFERENCES spike_scenes(id), epoch uuid NOT NULL,
      source_revision integer NOT NULL, binary_update bytea NOT NULL, state_vector bytea NOT NULL)`);
  }
  async create(input: unknown, id = randomUUID()): Promise<Revision> {
    const document = normalize(input).document, client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('INSERT INTO spike_scenes(id,revision,document) VALUES ($1,1,$2)', [id, JSON.stringify(document)]);
      await client.query('INSERT INTO spike_revisions(scene_id,revision,document) VALUES ($1,1,$2)', [id, JSON.stringify(document)]);
      await client.query('COMMIT'); return { sceneId: id, revision: 1, document, restoredFrom: null };
    } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  }
  async get(id: string, revision?: number): Promise<Revision> {
    const result = await this.pool.query(`SELECT r.scene_id,r.revision,r.document,r.restored_from FROM spike_revisions r
      JOIN spike_scenes s ON s.id=r.scene_id WHERE s.id=$1 AND r.revision=COALESCE($2,s.revision)`, [id, revision ?? null]);
    const row = result.rows[0]; if (!row) throw new RevisionError('NOT_FOUND');
    return { sceneId: row.scene_id, revision: row.revision, document: normalize(row.document).document, restoredFrom: row.restored_from };
  }
  async history(id: string) { return (await this.pool.query('SELECT revision,restored_from FROM spike_revisions WHERE scene_id=$1 ORDER BY revision', [id])).rows; }
  async save(id: string, input: unknown, expected: number, restore?: number): Promise<Revision> {
    if (!Number.isSafeInteger(expected) || expected < 1) throw new RevisionError('REVISION_CONFLICT');
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const row = (await client.query('SELECT revision,mode FROM spike_scenes WHERE id=$1 FOR UPDATE', [id])).rows[0];
      if (!row) throw new RevisionError('NOT_FOUND');
      if (row.mode !== 'json') throw new RevisionError('EPOCH_CHANGED');
      if (row.revision !== expected) throw new RevisionError('REVISION_CONFLICT');
      const source = restore === undefined ? input : (await client.query('SELECT document FROM spike_revisions WHERE scene_id=$1 AND revision=$2', [id, restore])).rows[0]?.document;
      if (!source) throw new RevisionError('NOT_FOUND');
      const document = normalize(source).document, revision = expected + 1;
      await client.query('UPDATE spike_scenes SET revision=$2,document=$3 WHERE id=$1', [id, revision, JSON.stringify(document)]);
      await client.query('INSERT INTO spike_revisions(scene_id,revision,document,restored_from) VALUES ($1,$2,$3,$4)', [id, revision, JSON.stringify(document), restore ?? null]);
      await client.query('COMMIT'); return { sceneId: id, revision, document, restoredFrom: restore ?? null };
    } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  }
  async migrateScene(id: string, expected: number) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const row = (await client.query('SELECT revision,document FROM spike_scenes WHERE id=$1 FOR UPDATE', [id])).rows[0];
      if (!row) throw new RevisionError('NOT_FOUND');
      const old = (await client.query('SELECT * FROM spike_crdt WHERE scene_id=$1', [id])).rows[0];
      if (old) { await client.query('COMMIT'); return old; }
      if (row.revision !== expected) throw new RevisionError('REVISION_CONFLICT');
      const doc = importOnce(row.document), state = snapshot(doc); doc.destroy();
      const result = (await client.query('INSERT INTO spike_crdt(scene_id,epoch,source_revision,binary_update,state_vector) VALUES ($1,$2,$3,$4,$5) RETURNING *', [id, randomUUID(), expected, Buffer.from(state.update), Buffer.from(state.vector)])).rows[0];
      await client.query("UPDATE spike_scenes SET mode='yjs' WHERE id=$1", [id]);
      await client.query('COMMIT'); return result;
    } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  }
  async close() { await this.pool.end(); }
}
