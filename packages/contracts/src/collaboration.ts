import {z} from 'zod';
import type {Member,Invitation,Comment,CommentThread,TextAnchor,AnchorResolution,Contributor} from '@storymaster/domain';
import type {PageDto} from './narrative.ts';
const text=(max:number)=>z.string().max(max).refine(s=>s.isWellFormed()&&!s.includes('\u0000'));
const body=text(20000).refine(s=>!!s.trim()),revision=z.number().int().positive().max(Number.MAX_SAFE_INTEGER),id=z.string().uuid();
export const invitationCreateSchema=z.strictObject({email:z.email().max(320),role:z.enum(['admin','author','reviewer','reader'])});
export const memberRoleSchema=z.strictObject({role:z.enum(['admin','author','reviewer','reader'])});
export const invitationPrepareSchema=z.strictObject({invitationId:id,token:z.string().regex(/^[A-Za-z0-9_-]{43}$/)});
export const invitationRespondSchema=z.strictObject({decision:z.enum(['accept','decline'])});
export const anchorInputSchema=z.strictObject({sceneRevision:revision,from:z.number().int().nonnegative().max(2000000),to:z.number().int().positive().max(2000000),quote:text(4000).min(1)}).refine(a=>a.from<a.to);
export const threadCreateSchema=z.strictObject({targetType:z.enum(['scene','object']),targetId:id,body,anchor:anchorInputSchema.optional()});
export const commentReplySchema=z.strictObject({body});
export const commentUpdateSchema=z.strictObject({body,expectedThreadRevision:revision});
export const commentWithdrawSchema=z.strictObject({expectedThreadRevision:revision,reason:text(1000).optional()});
export const threadStateSchema=z.strictObject({resolved:z.boolean()});
export const threadListSchema=z.strictObject({targetType:z.enum(['scene','object']).optional(),targetId:id.optional(),state:z.enum(['open','resolved','all']).default('all'),limit:z.coerce.number().int().min(1).max(100).default(20),cursor:text(2000).optional()}).refine(q=>!!q.targetType===!!q.targetId);
export type ThreadCreate=z.infer<typeof threadCreateSchema>;
export interface InvitationCreated {invitation:Invitation;link:string|null;linkRevealed:boolean}
export interface InvitationContext {invitation:Invitation;projectName:string;recipientMatches:true;membershipActive:boolean;currentRole:string|null}
export interface InvitationResult {invitationId:string;projectId:string;status:'accepted'|'revoked';membershipActive:boolean;role:string|null}
export interface ThreadView extends CommentThread {anchor:TextAnchor|null;anchorResolution:AnchorResolution|null;rootComment:Comment}
export interface ThreadDetail {thread:ThreadView;comments:PageDto<Comment>}
export interface CollaborationRevision {resourceType:'membership'|'invitation'|'thread'|'comment';resourceId:string;revision:number;actor:Contributor|null;actorType:'human'|'system';action:string;createdAt:string;snapshot:Record<string,unknown>}
export type MembersPage=PageDto<Member>;
