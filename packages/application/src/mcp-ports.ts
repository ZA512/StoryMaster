import type {Actor,ExternalClient,DelegatedGrant,MCPAuthorization,MCPGrantEvent,MCPScope,ExternalProvenance} from '@storymaster/domain';
export interface MCPCall {id:string;authorizationId:string;userId:string;clientId:string;grantId:string;projectId:string|null;method:string;status:'succeeded'|'denied';code:string|null;references:{resourceType:string;resourceId:string;revision:number}[];createdAt:string}
export interface MCPPort {
 clients():Promise<ExternalClient[]>;
 client(id:string):Promise<ExternalClient|null>;
 clientByOAuthId(id:string):Promise<ExternalClient|null>;
 registerClient(client:ExternalClient):Promise<void>;
 identity(issuer:string,subject:string):Promise<string|null>;
 grants(userId:string,limit?:number,beforeId?:string):Promise<DelegatedGrant[]>;
 grant(userId:string,id:string,lock?:boolean):Promise<DelegatedGrant|null>;
 putGrant(grant:DelegatedGrant,insert:boolean):Promise<void>;
 grantEvent(grant:DelegatedGrant,action:string):Promise<void>;
 events(userId:string,id:string,limit:number,before?:number):Promise<MCPGrantEvent[]>;
 putAuthorization(authorization:MCPAuthorization):Promise<void>;
 assertRecordedProof(actor:Actor):Promise<void>;
 assertActor(actor:Actor):Promise<{grant:DelegatedGrant;client:ExternalClient;authorization:MCPAuthorization}>;
 assertGrant(actor:Actor,projectId:string,scope:MCPScope):Promise<ExternalProvenance>;
 startCall(actor:Actor,projectId:string,method:string):Promise<void>;
 ownProposal(actor:Actor,projectId:string,proposalId:string):Promise<boolean>;
 mergeOrigin(projectId:string,proposalId:string):Promise<void>;
 call(call:MCPCall):Promise<void>;
 recordResources(callId:string,references:MCPCall["references"]):Promise<void>;
}
