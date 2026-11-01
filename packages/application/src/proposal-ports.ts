import type {Role,ProposalHead,Actor} from '@storymaster/domain';
import type {ProposalRevision,ProposalReview,ProposalChangeSet,MergeResult,ProposalEvent} from '@storymaster/contracts';
export interface ProposalPort {
 lock(projectId:string,id:string,exclusive:boolean):Promise<void>;
 head(projectId:string,id:string):Promise<ProposalHead|null>;
 revision(projectId:string,id:string,revision:number):Promise<ProposalRevision|null>;
 revisions(projectId:string,id:string,limit:number,before?:number):Promise<ProposalRevision[]>;
 page(projectId:string,query:{status?:string;authorId?:string;limit:number;after?:{timestamp:string;id:string}}):Promise<ProposalHead[]>;
 putHead(head:ProposalHead,insert:boolean):Promise<void>;
 putRevision(revision:ProposalRevision):Promise<void>;
 reviews(projectId:string,id:string):Promise<ProposalReview[]>;
 putReview(review:ProposalReview):Promise<void>;
 activeRole(projectId:string,userId:string):Promise<Role|null>;
 activeMemberCount(projectId:string):Promise<number>;
 result(projectId:string,id:string):Promise<MergeResult|null>;
 putChangeSet(changeset:ProposalChangeSet):Promise<void>;
 changeset(projectId:string,id:string):Promise<ProposalChangeSet|null>;
 event(head:ProposalHead,actor:Actor,action:string,correlationId:string,details?:Record<string,unknown>):Promise<void>;
 events(projectId:string,id:string,limit:number,before?:number):Promise<ProposalEvent[]>;
}
