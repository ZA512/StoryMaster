import type {AIProvenance} from './ai.ts';
import type {Role,ActorType} from './index.ts';
export const proposalStates=['draft','submitted','in_review','approved','rejected','withdrawn','conflicted','merged'] as const;
export type ProposalState=typeof proposalStates[number];
export const proposalTerminal=(state:ProposalState)=>['merged','rejected','withdrawn'].includes(state);
export function proposalPermission(role:Role,action:'read'|'write'|'review'|'approve'|'merge',actor:ActorType){
 // A future delegated adapter must supply verified authorization; actor.type alone never grants it.
 if(actor==='integrated_ai')return action==='read'||action==='write'&&role!=='reader';
 if(actor!=='human')return false;
 return action==='read'?true:action==='approve'||action==='merge'?role==='owner'||role==='admin':role!=='reader';
}
export interface ProposalIdentity{id:string;displayName:string;actorType:'human'|'integrated_ai';userId:string}
export interface ProposalHead{id:string;projectId:string;origin:'human'|'integrated_ai';aiProvenance?:AIProvenance;createdByActor:ProposalIdentity;proposalRevision:number;stateVersion:number;status:ProposalState;createdAt:string;updatedAt:string;submittedAt:string|null;mergedAt:string|null;mergedChangeSetId:string|null}
