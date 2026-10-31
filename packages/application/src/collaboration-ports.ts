import type {Actor,Member,Invitation,CollaboratorRole,Comment,CommentThread,TextAnchor} from '@storymaster/domain';
import type {CollaborationRevision} from '@storymaster/contracts';
export interface InvitationRecord extends Invitation{tokenHash:string;declinedBy:string|null;issuedSequence:number}
export interface CollaborationPosition{timestamp:string;id:string}
export interface CollaborationPort{
 projectInfo(projectId:string):Promise<{name:string;status:string}|null>;
 verifiedEmail(actor:Actor):Promise<string|null>;
 actorName(userId:string):Promise<string>;
 setActor(actor:Actor,correlation:string):Promise<void>;
 memberEmails(projectId:string,userId:string):Promise<string[]>;
 pendingInvitations(projectId:string,emails:string[]):Promise<InvitationRecord[]>;
 sequence(projectId:string):Promise<number>;
 member(projectId:string,userId:string,lock?:boolean):Promise<Member|null>;
 members(projectId:string,limit:number,afterId?:string):Promise<Member[]>;
 saveMember(projectId:string,userId:string,role:CollaboratorRole,status:'active'|'removed',insert:boolean):Promise<Member>;
 invitation(projectId:string|undefined,id:string,lock?:boolean):Promise<InvitationRecord|null>;
 invitations(projectId:string,limit:number,after?:CollaborationPosition):Promise<Invitation[]>;
 insertInvitation(value:InvitationRecord):Promise<void>;
 respondInvitation(projectId:string,id:string,status:'accepted'|'revoked',userId:string|null,reason:string|null,declinedBy?:string):Promise<InvitationRecord>;
 lockThread(projectId:string,id:string,exclusive:boolean):Promise<void>;
 thread(projectId:string,id:string):Promise<CommentThread|null>;
 threadPage(projectId:string,options:{targetType?:string;targetId?:string;state:string;limit:number;after?:CollaborationPosition}):Promise<CommentThread[]>;
 putThread(value:CommentThread,insert:boolean):Promise<void>;
 comment(projectId:string,id:string):Promise<Comment|null>;
 commentPage(projectId:string,threadId:string,limit:number,after?:CollaborationPosition):Promise<Comment[]>;
 rootComment(projectId:string,threadId:string):Promise<Comment>;
 putComment(value:Comment,insert:boolean):Promise<void>;
 anchor(projectId:string,threadId:string):Promise<TextAnchor|null>;
 putAnchor(value:TextAnchor):Promise<void>;
 record(projectId:string,type:'invitation'|'thread'|'comment',id:string,revision:number,actor:Actor,action:string,correlation:string):Promise<void>;
 history(projectId:string,type:CollaborationRevision['resourceType'],id:string,limit:number,before?:number):Promise<CollaborationRevision[]>;
}
