import { createHash, randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { readFile,readdir } from 'node:fs/promises';
import pg from 'pg';
import {PostgresCollaborationStore} from './collaboration.ts';
import {PostgresNarrativeStore} from './narrative.ts';
import { PostgresEditorialStore } from './editorial.ts';
import type { PoolClient, QueryResultRow } from 'pg';
import type { Actor, AuditEvent, Identity, Project, ProjectWithRole, Role, User } from '@storymaster/domain';
import { AppError, unauthenticated } from '@storymaster/domain';
import type { ProjectPosition, Transaction, UnitOfWork } from '@storymaster/application';
export const { Pool } = pg;
export type Metric = { name: 'project.lock_wait_ms' | 'project.lock_hold_ms' | 'scene.lock_wait_ms' | 'scene.lock_hold_ms'; value: number; mode:'exclusive'|'shared' };
export const sha256 = (text: string) => createHash('sha256').update(text).digest('hex');
export async function migrate(pool: pg.Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended('storymaster.migrations',0))");
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
    const directory=new URL('../migrations/',import.meta.url);
    for(const file of (await readdir(directory)).filter(f=>/^\d{4}-[a-z0-9-]+\.sql$/.test(f)).sort()) {
      const sql=await readFile(new URL(file,directory),'utf8'),checksum=sha256(sql),name=file.slice(0,-4);
      const old=await client.query<{checksum:string}>('SELECT checksum FROM schema_migrations WHERE name=$1',[name]);
      if(old.rows[0]) { if(old.rows[0].checksum!==checksum)throw new Error('Migration déjà appliquée avec une autre empreinte.'); }
      else { await client.query(sql);await client.query('INSERT INTO schema_migrations(name,checksum) VALUES ($1,$2)',[name,checksum]); }
    }
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
interface ProjectRow extends QueryResultRow {
  id:string; owner_id:string; name:string; description:string; language:string; visibility:'private'; status:'active'|'archived'; revision:string;
  created_at:Date; updated_at:Date; role:Role; cursor_timestamp:string;
}
function project(row: ProjectRow): ProjectWithRole {
  return {id:row.id,ownerId:row.owner_id,name:row.name,description:row.description,language:row.language,
    visibility:row.visibility,status:row.status,revision:Number(row.revision),createdAt:row.created_at.toISOString(),updatedAt:row.updated_at.toISOString(),role:row.role};
}
export class PostgresUnitOfWork implements UnitOfWork {
  constructor(public pool: pg.Pool, private observe: (metric: Metric) => void = () => {}) {}
  async transaction<T>(work: (tx: Transaction) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    let broken=false;
    const connectionError=()=>{broken=true;};client.on('error',connectionError);
    const tx = new PostgresTransaction(client,this.observe);
    try {
      await client.query('BEGIN');
      await client.query("SET LOCAL lock_timeout = '5s'");
      await client.query("SET LOCAL statement_timeout = '10s'");
      const result = await work(tx);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      try{await client.query('ROLLBACK');}catch{broken=true;}
      if (broken || (error && typeof error === 'object' && 'code' in error && (['40P01','55P03','57014','40001','57P01','ECONNRESET','EPIPE'].includes(String(error.code))||String(error.code).startsWith('08')))) throw new AppError('TEMPORARILY_UNAVAILABLE','Le service est occupé. Réessayez dans un instant.',503);
      throw error;
    } finally { tx.finish();client.off('error',connectionError);client.release(broken); }
  }
}
class PostgresTransaction implements Transaction {
  private lockStarted?: number;
  readonly collaboration:PostgresCollaborationStore;readonly editorial:PostgresEditorialStore;readonly narrative:PostgresNarrativeStore;
  private lockMode:'exclusive'|'shared'='exclusive';
  constructor(private client: PoolClient, private observe: (metric: Metric) => void) {this.collaboration=new PostgresCollaborationStore(client);this.editorial=new PostgresEditorialStore(client,observe);this.narrative=new PostgresNarrativeStore(client);}
  finish() { this.editorial.finish();if (this.lockStarted !== undefined) this.observe({name:'project.lock_hold_ms',value:performance.now()-this.lockStarted,mode:this.lockMode}); }
  async assertActor(actor: Actor) {
    const result = await this.client.query(`SELECT u.id FROM sessions s JOIN app_users u ON u.id=s.user_id
      WHERE s.token_hash=$1 AND s.user_id=$2 AND s.revoked_at IS NULL AND s.expires_at>clock_timestamp() AND u.status='active' FOR SHARE OF s`,[actor.sessionHash,actor.userId]);
    if (!result.rowCount) throw unauthenticated();
  }
  async getProject(userId:string, id:string): Promise<ProjectWithRole|null> {
    const result = await this.client.query<ProjectRow>(`SELECT p.*,m.role FROM projects p JOIN project_memberships m ON m.project_id=p.id WHERE p.id=$1 AND m.user_id=$2 AND m.status='active'`,[id,userId]);
    return result.rows[0] ? project(result.rows[0]) : null;
  }
  async listProjects(userId:string, limit:number, after?: ProjectPosition) {
    const result = await this.client.query<ProjectRow>(`SELECT p.*,m.role,p.created_at::text AS cursor_timestamp FROM projects p JOIN project_memberships m ON m.project_id=p.id
      WHERE m.user_id=$1 AND m.status='active' AND ($3::timestamptz IS NULL OR (p.created_at,p.id)<($3::timestamptz,$4::uuid)) ORDER BY p.created_at DESC,p.id DESC LIMIT $2`,[userId,limit,after?.timestamp ?? null,after?.id ?? null]);
    return result.rows.map(row => ({project:project(row),position:{timestamp:row.cursor_timestamp,id:row.id}}));
  }
  async lockProject(id:string,mode:'exclusive'|'shared'='exclusive') {
    this.lockMode=mode;
    const start=performance.now();
    await this.client.query(mode==='exclusive' ? 'SELECT id FROM projects WHERE id=$1 FOR UPDATE' : 'SELECT id FROM projects WHERE id=$1 FOR SHARE',[id]);
    this.lockStarted=performance.now();
    this.observe({name:'project.lock_wait_ms',value:this.lockStarted-start,mode});
  }
  async lockIdempotency(scope:string,key:string) { await this.client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[scope+sha256(key)]); }
  async findIdempotency<T=ProjectWithRole>(scope:string,key:string) {
    await this.client.query('DELETE FROM idempotency_records WHERE scope_hash=$1 AND key_hash=$2 AND expires_at<=clock_timestamp()',[scope,sha256(key)]);
    const result = await this.client.query<{fingerprint:string;response:T}>('SELECT fingerprint,response FROM idempotency_records WHERE scope_hash=$1 AND key_hash=$2',[scope,sha256(key)]);
    return result.rows[0] ?? null;
  }
  async saveIdempotency(scope:string,key:string,hash:string,response:unknown) {
    await this.client.query('INSERT INTO idempotency_records(scope_hash,key_hash,fingerprint,response) VALUES ($1,$2,$3,$4)',[scope,sha256(key),hash,JSON.stringify(response)]);
  }
  async insertProject(p:Project) {
    await this.client.query(`INSERT INTO projects(id,owner_id,name,description,language,visibility,status,revision,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,[p.id,p.ownerId,p.name,p.description,p.language,p.visibility,p.status,p.revision,p.createdAt,p.updatedAt]);
  }
  async insertOwner(projectId:string,userId:string) { await this.client.query("INSERT INTO project_memberships(project_id,user_id,role) VALUES ($1,$2,'owner')",[projectId,userId]); }
  async saveProject(p:Project) { await this.client.query('UPDATE projects SET name=$2,description=$3,language=$4,status=$5,revision=$6,updated_at=$7 WHERE id=$1',[p.id,p.name,p.description,p.language,p.status,p.revision,p.updatedAt]); }
  async snapshot(p:Project,actor:Actor) {
    const {id,ownerId,name,description,language,visibility,status,revision,createdAt,updatedAt} = p;
    await this.client.query('INSERT INTO project_revisions(project_id,revision,snapshot,actor_user_id) VALUES ($1,$2,$3,$4)',[p.id,p.revision,JSON.stringify({id,ownerId,name,description,language,visibility,status,revision,createdAt,updatedAt}),actor.userId]);
  }
  async audit(e:AuditEvent) {
    await this.client.query('INSERT INTO audit_events(id,project_id,actor_user_id,actor_type,action,resource_id,before_revision,after_revision,correlation_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',[randomUUID(),e.projectId ?? null,e.actor.userId,e.actor.type,e.action,e.resourceId,e.beforeRevision ?? null,e.afterRevision ?? null,e.correlationId]);
  }
  async resolveIdentity(identity:Identity): Promise<{user:User;created:boolean}> {
    await this.client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[JSON.stringify([identity.issuer,identity.subject])]);
    const old = await this.client.query<{id:string;display_name:string;email:string|null;status:'active'|'suspended'}>('SELECT u.* FROM external_identities i JOIN app_users u ON i.user_id=u.id WHERE issuer=$1 AND subject=$2',[identity.issuer,identity.subject]);
    const row = old.rows[0];
    if (row) {
      await this.client.query('UPDATE app_users SET display_name=$2::varchar,email=$3::varchar,revision=revision+CASE WHEN display_name<>$2::varchar OR email IS DISTINCT FROM $3::varchar THEN 1 ELSE 0 END WHERE id=$1',[row.id,identity.displayName,identity.email]);
      return {user:{id:row.id,displayName:identity.displayName,email:identity.email,status:row.status},created:false};
    }
    const id=randomUUID();
    await this.client.query('INSERT INTO app_users(id,display_name,email) VALUES ($1,$2,$3)',[id,identity.displayName,identity.email]);
    await this.client.query('INSERT INTO external_identities(issuer,subject,user_id) VALUES ($1,$2,$3)',[identity.issuer,identity.subject,id]);
    return {user:{id,displayName:identity.displayName,email:identity.email,status:'active'},created:true};
  }
}
