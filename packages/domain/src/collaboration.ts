import type {Role} from './index.ts';
export type CollaboratorRole=Exclude<Role,'owner'>;
export interface Member {projectId:string;userId:string;displayName:string;role:Role;status:'active'|'removed';revision:number;changeSequence:number;createdAt:string;updatedAt:string}
export interface Invitation {id:string;projectId:string;email:string;role:CollaboratorRole;inviterId:string;inviterName:string;status:'pending'|'accepted'|'revoked'|'expired';revision:number;expiresAt:string;createdAt:string;acceptedBy:string|null;reason:string|null}
export type AnchorState='valid'|'relocated'|'ambiguous'|'orphaned';
export interface TextAnchor {id:string;projectId:string;threadId:string;sceneId:string;sceneRevision:number;from:number;to:number;quote:string;prefix:string;suffix:string;state:'valid';authorId:string;createdAt:string}
export interface AnchorResolution {state:AnchorState;sceneRevision:number;from:number|null;to:number|null;reason:'unchanged_document'|'unique_edit_mapping'|'unique_unchanged_block'|'multiple_correspondences'|'passage_missing'|'complexity_limit'}
export interface Contributor {id:string;displayName:string}
export interface Comment {id:string;projectId:string;threadId:string;author:Contributor;body:string|null;status:'active'|'withdrawn';revision:number;createdAt:string;updatedAt:string;updatedBy:Contributor;withdrawalReason:string|null}
export interface CommentThread {rootCommentId:string;id:string;projectId:string;targetType:'scene'|'object';targetId:string;author:Contributor;state:'open'|'resolved';revision:number;commentCount:number;createdAt:string;updatedAt:string}
export function canManageRole(actor:Role,target:Role,proposed?:Role){return target!=='owner'&&proposed!=='owner'&&(actor==='owner'||actor==='admin'&&['author','reviewer','reader'].includes(target)&&(!proposed||['author','reviewer','reader'].includes(proposed)));}
export function canResolveThread(role:Role,userId:string,creatorId:string){return ['owner','admin','author'].includes(role)||role==='reviewer'&&userId===creatorId;}
export const canonicalEmail=(email:string)=>email.trim().normalize('NFC').toLowerCase();
