export const roles = ['owner', 'admin', 'author', 'reviewer', 'reader'] as const;
export type Role = typeof roles[number];
export type ActorType = 'human' | 'integrated_ai' | 'external_ai' | 'system';
export interface Actor { type: ActorType; userId: string; sessionHash: string; clientId?: string; grantId?: string }
export type ErrorCode = 'MODULE_DISABLED' | 'UNAUTHENTICATED' | 'FORBIDDEN' | 'NOT_FOUND' | 'VALIDATION_FAILED' | 'REVISION_CONFLICT' | 'PRECONDITION_REQUIRED' | 'IDEMPOTENCY_KEY_REUSED' | 'INVALID_STATE_TRANSITION' | 'RATE_LIMITED' | 'TEMPORARILY_UNAVAILABLE' | 'INTERNAL_ERROR';
export class AppError extends Error {
  constructor(public code: ErrorCode, message: string, public status: number, public details?: Record<string, unknown>) { super(message); }
}
export const unauthenticated = () => new AppError('UNAUTHENTICATED', 'Veuillez vous connecter.', 401);
export const notFound = () => new AppError('NOT_FOUND', 'Ressource introuvable.', 404);
export function permitted(role: Role, permission: 'project.read' | 'project.admin', actorType: ActorType): boolean {
  if (actorType !== 'human') return false; // Aucun adaptateur délégué n'est activé au Lot 0.
  return permission === 'project.read' ? roles.includes(role) : role === 'owner' || role === 'admin';
}
export interface User { id: string; displayName: string; email: string | null; status: 'active' | 'suspended' }
export interface Project {
  id: string; ownerId: string; name: string; description: string; language: string;
  visibility: 'private'; status: 'active' | 'archived'; revision: number; createdAt: string; updatedAt: string;
}
export interface ProjectWithRole extends Project { role: Role }
export interface ProjectInput { name: string; description?: string; language?: string }
export interface ProjectChanges { name?: string; description?: string; language?: string }
export function normalizeMetadata(input: ProjectInput): Required<ProjectInput> {
  const name = input.name.trim();
  if (!name || name.length > 200 || (input.description?.length ?? 0) > 4000 || !/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(input.language ?? 'fr')) {
    throw new AppError('VALIDATION_FAILED', 'Les informations du projet ne sont pas valides.', 422);
  }
  return { name, description: input.description ?? '', language: input.language ?? 'fr' };
}
export interface Identity { issuer: string; subject: string; displayName: string; email: string | null }
export interface AuditEvent {
  action: string; actor: Actor; correlationId: string; projectId?: string; resourceId: string;
  beforeRevision?: number; afterRevision?: number;
}
export type NarrativePermission = 'narrative.read'|'narrative.write'|'narrative.archive'|'export.create'|'project.admin'|'members.read'|'members.admin'|'membership.leave'|'comment.write';
export function narrativePermitted(role:Role, permission:NarrativePermission, actor:ActorType):boolean {
  if(actor!=='human')return false;
  switch(permission){case 'members.read':case 'membership.leave':case 'narrative.read':return roles.includes(role);case 'members.admin':case 'project.admin':case 'narrative.archive':return role==='owner'||role==='admin';case 'comment.write':return ['owner','admin','author','reviewer'].includes(role);case 'narrative.write':case 'export.create':return ['owner','admin','author'].includes(role);default:return false;}
}
export interface RichNode { type:string; text?:string; attrs?:Record<string,unknown>; marks?:{type:string;attrs?:Record<string,unknown>}[];content?:RichNode[] }
export interface RichDocument extends RichNode { type:'doc';content:RichNode[] }
export type EditorialKind='manuscript'|'chapter'|'scene';
export interface EditorialNode {
  kind:EditorialKind;id:string;projectId:string;parentId:string;title:string;summary:string;position:number;
  revision:number;structureRevision:number;archived:boolean;status:string;writingStatuses:string[];
  wordCount:number;content?:RichDocument;contentHash?:string;createdAt:string;updatedAt:string;
}
export interface SceneRevision {
  referenceSnapshotVersion?:1;references?:import('./narrative.ts').SceneReference[];
  sceneId:string;projectId:string;revision:number;contentFormatVersion:1;content:RichDocument;contentHash:string;
  metadata:{title:string;summary:string;status:string;archived:boolean;chapterId:string};
  author:{id:string;displayName:string};createdAt:string;changeSetId:string;restoredFromRevision:number|null;action:string;
}
export interface EditorialChange {id:string;projectId:string;resourceId:string;kind:EditorialKind;action:string;beforeRevision:number|null;afterRevision:number;actor:Actor;correlationId:string;details:Record<string,unknown>}
export * from './narrative.ts';

export * from './collaboration.ts';
