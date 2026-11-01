import type {Actor,CredentialEnvelope,AIProvenance} from '@storymaster/domain';
import type {AIStoredCredential,AICredential,AIBudget,AIConversation,AIContextPlan,AIExecution,AIMessage,AIUsage,AISourceCitation} from '@storymaster/contracts';
export interface CredentialCipher {seal(secret:string,binding:{id:string;ownerId:string;provider:string;keyVersion:number}):CredentialEnvelope;open(envelope:CredentialEnvelope,binding:{id:string;ownerId:string;provider:string;keyVersion:number}):string;rewrap(envelope:CredentialEnvelope,binding:{id:string;ownerId:string;provider:string;keyVersion:number}):CredentialEnvelope;activeVersion:string}
export interface AIExecutionRecord extends AIExecution {sessionHash:string;capabilityHash:string|null;workerId:string|null}
export interface AIToolResult {callId:string;name:string;argumentsHash:string;result:Record<string,unknown>}
export interface AIProviderCall {number:number;inputHash:string;status:'admitted'|'returned'|'unknown';usage:AIUsage|null}
export interface AIPort {
 credentials(ownerId:string):Promise<AICredential[]>;
 credential(ownerId:string,id:string,lock?:'shared'|'exclusive'):Promise<AIStoredCredential|null>;
 putCredential(c:AIStoredCredential,insert:boolean):Promise<void>;
 budget(projectId:string,ownerId:string,lock?:boolean):Promise<AIBudget>;
 putBudget(b:AIBudget):Promise<void>;
 conversations(projectId:string,ownerId:string,limit:number,before?:string):Promise<AIConversation[]>;
 conversation(projectId:string,ownerId:string,id:string,lock?:boolean):Promise<AIConversation|null>;
 putConversation(c:AIConversation,insert:boolean):Promise<void>;
 messages(projectId:string,ownerId:string,conversationId:string,limit:number,before?:number):Promise<AIMessage[]>;
 appendMessage(m:Omit<AIMessage,'sequence'>):Promise<AIMessage>;
 plan(projectId:string,ownerId:string,id:string):Promise<AIContextPlan|null>;
 putPlan(plan:AIContextPlan):Promise<void>;
 consent(projectId:string,ownerId:string,planId:string,executionId:string):Promise<void>;
 revokeConsent(projectId:string,ownerId:string,conversationId:string):Promise<void>;
 execution(projectId:string,ownerId:string,id:string,lock?:boolean):Promise<AIExecutionRecord|null>;
 executions(projectId:string,ownerId:string,conversationId:string,limit:number):Promise<AIExecutionRecord[]>;
 putExecution(e:AIExecutionRecord,insert:boolean):Promise<void>;
 nextQueued():Promise<{projectId:string;ownerId:string;id:string}|null>;
 expiredExecutions():Promise<{projectId:string;ownerId:string;id:string}[]>;
 assertExecution(actor:Actor,projectId:string,permission:'read'|'propose'):Promise<AIProvenance>;
 ownProposal(actor:Actor,projectId:string,proposalId:string):Promise<boolean>;
 tools(projectId:string,executionId:string):Promise<AIToolResult[]>;
 putTool(projectId:string,executionId:string,t:AIToolResult):Promise<void>;
 calls(projectId:string,executionId:string):Promise<AIProviderCall[]>;
 putCall(projectId:string,executionId:string,c:AIProviderCall):Promise<void>;
 event(projectId:string,ownerId:string,executionId:string|null,action:string,details:Record<string,unknown>):Promise<void>;
}
export interface ProviderRequest {executionId:string;callNumber:number;model:string;instructions:string;prompt:string;context:Pick<AIContextPlan,'sources'|'history'|'intent'|'selection'|'policy'|'contextHash'|'message'>;tools:{name:string;description:string;inputSchema:Record<string,unknown>}[];results:AIToolResult[];maxOutputTokens:number;inputTokenUpperBound:number}
export interface ProviderResponse {text:string;citations:AISourceCitation[];toolCalls:{callId:string;name:string;arguments:unknown}[];usage:{inputTokens:number;outputTokens:number};providerRequestId:string}
export interface ProviderAdapter {id:string;simulated:boolean;capabilities:{tools:boolean;structuredOutput:boolean;usage:boolean;cancellation:'best_effort'|'unsupported';timeout:'unknown_after_send'};generate(request:ProviderRequest,credential:string,signal:AbortSignal):Promise<ProviderResponse>}
export class ProviderFailure extends Error {constructor(public phase:'before_send'|'after_send',public reason:'unavailable'|'timeout'|'cancelled'|'malformed'){super('Provider execution failed');}}
