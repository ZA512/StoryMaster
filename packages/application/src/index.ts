import type {NarrativePort} from './narrative-ports.ts';
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { AppError, normalizeMetadata, permitted, notFound, unauthenticated } from '@storymaster/domain';
import type { Actor, AuditEvent, Identity, Project, ProjectChanges, ProjectInput, ProjectWithRole, User } from '@storymaster/domain';
import type { EditorialPort } from './editorial-ports.ts';
import type { Page, ProjectDto } from '@storymaster/contracts';

export interface ProjectPosition { timestamp: string; id: string }
export interface Transaction {
  readonly editorial:EditorialPort;readonly narrative:NarrativePort;
  assertActor(actor: Actor): Promise<void>;
  getProject(userId: string, projectId: string): Promise<ProjectWithRole | null>;
  listProjects(userId: string, limit: number, after?: ProjectPosition): Promise<{ project: ProjectWithRole; position: ProjectPosition }[]>;
  lockProject(projectId: string,mode?:'exclusive'|'shared'): Promise<void>;
  lockIdempotency(scope: string, key: string): Promise<void>;
  findIdempotency<T=ProjectWithRole>(scope: string, key: string): Promise<{ fingerprint: string; response: T } | null>;
  saveIdempotency(scope: string, key: string, fingerprint: string, response: unknown): Promise<void>;
  insertProject(project: Project): Promise<void>;
  insertOwner(projectId: string, userId: string): Promise<void>;
  saveProject(project: Project): Promise<void>;
  snapshot(project: Project, actor: Actor): Promise<void>;
  audit(event: AuditEvent): Promise<void>;
  resolveIdentity(identity: Identity): Promise<{ user: User; created: boolean }>;
}
export interface UnitOfWork { transaction<T>(work: (tx: Transaction) => Promise<T>): Promise<T> }
export const fingerprint = (value: unknown): string => createHash('sha256').update(canonical(value)).digest('hex');
function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.entries(value).filter(([,v]) => v !== undefined).sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => JSON.stringify(k) + ':' + canonical(v)).join(',') + '}';
  return JSON.stringify(value);
}
function dto(p: ProjectWithRole): ProjectDto {
  return { id:p.id, name:p.name, description:p.description, language:p.language, revision:p.revision,
    visibility:p.visibility, status:p.status, role:p.role, createdAt:p.createdAt, updatedAt:p.updatedAt };
}
function human(actor: Actor) { if (actor.type !== 'human') throw new AppError('FORBIDDEN', 'Cette opération n’est pas autorisée.', 403); }
function projectId(id: string) { if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) throw notFound(); }
export class ProjectService {
  constructor(private db: UnitOfWork, private cursorSecret: string) {}
  private scope(actor: Actor, action: string, project?: string) { return fingerprint([actor.userId,actor.type,actor.clientId ?? null,actor.grantId ?? null,action,project ?? null]); }
  private async replay(tx: Transaction, scope: string, key: string, hash: string): Promise<ProjectWithRole | null> {
    await tx.lockIdempotency(scope,key);
    const record = await tx.findIdempotency(scope,key);
    if (record && record.fingerprint !== hash) throw new AppError('IDEMPOTENCY_KEY_REUSED','Cette clé a déjà été utilisée pour une autre demande.',409);
    return record?.response ?? null;
  }
  async create(actor: Actor, input: ProjectInput, key: string, correlationId: string): Promise<ProjectDto> {
    human(actor);
    const values = normalizeMetadata(input), scope = this.scope(actor,'project.create'), hash = fingerprint(input);
    return this.db.transaction(async tx => {
      await tx.assertActor(actor);
      const existing = await this.replay(tx,scope,key,hash);
      if (existing) return dto(existing);
      const now = new Date().toISOString();
      const project: ProjectWithRole = { id:randomUUID(),ownerId:actor.userId,...values,visibility:'private',status:'active',revision:1,createdAt:now,updatedAt:now,role:'owner' };
      await tx.insertProject(project);
      await tx.insertOwner(project.id,actor.userId);
      await tx.snapshot(project,actor);
      await tx.audit({action:'project.created',actor,projectId:project.id,resourceId:project.id,afterRevision:1,correlationId});
      await tx.saveIdempotency(scope,key,hash,project);
      return dto(project);
    });
  }
  async get(actor: Actor, id: string): Promise<ProjectDto> {
    human(actor); projectId(id);
    return this.db.transaction(async tx => {
      await tx.assertActor(actor);
      const p = await tx.getProject(actor.userId,id);
      if (!p) throw notFound();
      return dto(p);
    });
  }
  async list(actor: Actor, limit: number, cursor?: string): Promise<Page<ProjectDto>> {
    human(actor);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new AppError('VALIDATION_FAILED','Pagination invalide.',422);
    const after = cursor ? this.decodeCursor(actor.userId,cursor) : undefined;
    return this.db.transaction(async tx => {
      await tx.assertActor(actor);
      const result = await tx.listProjects(actor.userId,limit+1,after);
      const hasMore = result.length > limit, visible = result.slice(0,limit);
      const last = visible.at(-1);
      return { items: visible.map(row => dto(row.project)), hasMore,
        nextCursor: hasMore && last ? this.encodeCursor(actor.userId,last.position) : null };
    });
  }
  async update(actor: Actor, id: string, changes: ProjectChanges, expected: number, key: string | undefined, correlationId: string): Promise<ProjectDto> {
    return this.mutate(actor,id,expected,key,correlationId,'project.updated',changes);
  }
  async changeStatus(actor: Actor, id: string, status: 'active' | 'archived', expected: number, key: string, correlationId: string): Promise<ProjectDto> {
    return this.mutate(actor,id,expected,key,correlationId,status === 'archived' ? 'project.archived' : 'project.restored',{status});
  }
  private async mutate(actor: Actor, id: string, expected: number, key: string | undefined, correlationId: string, action: string, changes: ProjectChanges & {status?: 'active' | 'archived'}): Promise<ProjectDto> {
    human(actor); projectId(id);
    return this.db.transaction(async tx => {
      const visible = await tx.getProject(actor.userId,id);
      if (!visible) throw notFound();
      await tx.lockProject(id);
      await tx.assertActor(actor); // Session et rôle relus après acquisition de la barrière.
      const p = await tx.getProject(actor.userId,id);
      if (!p) throw notFound();
      if (!permitted(p.role,'project.admin',actor.type)) throw new AppError('FORBIDDEN','Vous ne pouvez pas modifier ce projet.',403);
      const scope = this.scope(actor,action,id), hash = fingerprint({expected,changes});
      if (key) { const replay = await this.replay(tx,scope,key,hash); if (replay) return dto(replay); }
      if (p.revision !== expected) throw new AppError('REVISION_CONFLICT','Ce projet a changé depuis votre dernière lecture.',412,{expectedRevision:expected,currentRevision:p.revision});
      if (p.status === 'archived' && !changes.status) throw new AppError('INVALID_STATE_TRANSITION','Ce projet est archivé. Réactivez-le avant de le modifier.',409);
      const metadata = normalizeMetadata({name:changes.name ?? p.name,description:changes.description ?? p.description,language:changes.language ?? p.language});
      const next = {...p,...metadata,status:changes.status ?? p.status,revision:p.revision+1,updatedAt:new Date().toISOString()};
      await tx.saveProject(next);
      await tx.snapshot(next,actor);
      await tx.audit({action,actor,projectId:id,resourceId:id,beforeRevision:p.revision,afterRevision:next.revision,correlationId});
      if (key) await tx.saveIdempotency(scope,key,hash,next);
      return dto(next);
    });
  }
  private encodeCursor(userId: string, position: ProjectPosition): string {
    const body = Buffer.from(JSON.stringify({userId,...position})).toString('base64url');
    return body+'.'+createHmac('sha256',this.cursorSecret).update(body).digest('base64url');
  }
  private decodeCursor(userId: string, cursor: string): ProjectPosition {
    try {
      const parts=cursor.split('.');
      if(parts.length!==2)throw new Error();
      const [body,signature] = parts;
      if (!body || !signature) throw new Error();
      const expected = createHmac('sha256',this.cursorSecret).update(body).digest();
      const given = Buffer.from(signature,'base64url');
      if (expected.length !== given.length || !timingSafeEqual(expected,given)) throw new Error();
      const data: unknown = JSON.parse(Buffer.from(body,'base64url').toString());
      if (!data || typeof data !== 'object' || !('userId' in data) || data.userId !== userId || !('timestamp' in data) || typeof data.timestamp !== 'string' || !Number.isFinite(Date.parse(data.timestamp)) || !('id' in data) || typeof data.id !== 'string') throw new Error();
      projectId(data.id);
      return {timestamp:data.timestamp,id:data.id};
    } catch { throw new AppError('VALIDATION_FAILED','Ce curseur de pagination n’est pas valide.',422); }
  }
}
export class IdentityService {
  constructor(private db: UnitOfWork, private issuer: string) {}
  async signIn(identity: Identity, correlationId: string): Promise<User> {
    if (identity.issuer !== this.issuer || !identity.subject || identity.subject.length > 255 || !identity.displayName || identity.displayName.length > 200) throw unauthenticated();
    return this.db.transaction(async tx => {
      const {user,created} = await tx.resolveIdentity(identity);
      if (user.status !== 'active') throw unauthenticated();
      const actor: Actor = {type:'human',userId:user.id,sessionHash:''};
      await tx.audit({action:created ? 'identity.created' : 'identity.login',actor,resourceId:user.id,correlationId});
      return user;
    });
  }
}

export * from './editorial-ports.ts';
export * from './editorial.ts';

export * from './narrative-ports.ts';
export * from './project-access.ts';
export * from './narrative.ts';
