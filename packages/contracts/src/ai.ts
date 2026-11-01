import {z} from 'zod';
import {aiModels,aiExecutionStates,aiProvider,aiHardLimits} from '@storymaster/domain';
import type {AIExecutionState,AIPolicy,CredentialEnvelope,AIModel} from '@storymaster/domain';
const uuid=z.string().uuid(),text=(n:number)=>z.string().max(n).refine(v=>v.isWellFormed()&&!v.includes('\u0000')),name=text(200).refine(v=>!!v.trim());
export const aiCredentialSchema=z.strictObject({provider:z.literal(aiProvider),label:name,secret:z.string().regex(/^demo-storymaster-[A-Za-z0-9_-]{8,100}$/)});
export const aiCredentialReplaceSchema=aiCredentialSchema.omit({provider:true});
export const aiConversationSchema=z.strictObject({title:name,credentialId:uuid,model:z.enum(aiModels)});
export const aiSelectionSchema=z.strictObject({sceneId:uuid.optional(),objectId:uuid.optional(),proposalId:uuid.optional(),includeRelated:z.boolean().default(true),searchQuery:text(200).default('')});
export const aiContextSchema=z.strictObject({message:text(8000).refine(v=>!!v.trim()),intent:z.enum(['discuss','propose']),selection:aiSelectionSchema,limits:z.strictObject({maxCalls:z.number().int().min(1).max(aiHardLimits.maxCalls).optional(),maxTools:z.number().int().min(1).max(aiHardLimits.maxTools).optional(),maxOutputTokens:z.number().int().min(32).max(aiHardLimits.maxOutputTokens).optional(),durationMs:z.number().int().min(200).max(aiHardLimits.durationMs).optional()}).optional()});
export const aiSendSchema=z.strictObject({planId:uuid,contextHash:z.string().regex(/^[a-f0-9]{64}$/),consent:z.literal(true)});
export const aiBudgetLimitsSchema=z.strictObject({maxCalls:z.number().int().min(0).max(100000),maxTokens:z.number().int().min(0).max(1000000000),maxCostMicros:z.number().int().min(0).max(1000000000).nullable(),maxConcurrent:z.number().int().min(1).max(2)});
export const aiBudgetSchema=z.strictObject({limits:aiBudgetLimitsSchema});
export const aiRetentionSchema=z.strictObject({retentionDays:z.number().int().min(1).max(3650).nullable()});
export const aiStateSchema=z.enum(aiExecutionStates);
export type AIContextInput=z.infer<typeof aiContextSchema>;
export type AISelection=z.infer<typeof aiSelectionSchema>;
export type AIBudgetLimits=z.infer<typeof aiBudgetLimitsSchema>;
export interface AICredential {id:string;ownerId:string;provider:typeof aiProvider;label:string;revision:number;keyVersion:number;protectionVersion:string;status:'active'|'revoked';createdAt:string;updatedAt:string}
export interface AIStoredCredential extends AICredential {envelope:CredentialEnvelope}
export interface AIConversation {id:string;projectId:string;ownerId:string;credentialId:string;credentialRevision:number;provider:typeof aiProvider;model:AIModel;title:string;status:'active'|'closed';revision:number;retentionDays:number|null;createdAt:string;updatedAt:string}
export interface ContextReference {id:string;projectId:string;resourceType:'project'|'manuscript'|'chapter'|'scene'|'object'|'relation'|'module'|'proposal';resourceId:string;revision:number;contentHash:string;selectionReason:string;title:string;range:{from:number;to:number;unit:'utf16_text'}|null;excerpt:boolean;data:Record<string,unknown>}
export interface AIContextPlan {id:string;conversationId:string;projectId:string;ownerId:string;credentialId:string;credentialRevision:number;provider:typeof aiProvider;model:AIModel;message:string;intent:'discuss'|'propose';selection:AISelection;contextHash:string;sources:ContextReference[];history:{role:'human'|'assistant';text:string}[];policy:AIPolicy;bytes:number;warnings:string[];createdAt:string;expiresAt:string}
export interface AIUsage {calls:number;inputTokens:number;outputTokens:number;estimatedCostMicros:number|null;currency:'USD';simulated:true}
export interface AIExecution {id:string;conversationId:string;projectId:string;ownerId:string;credentialId:string;credentialRevision:number;provider:typeof aiProvider;model:AIModel;planId:string;status:AIExecutionState;revision:number;canPropose:boolean;cancelRequested:boolean;policy:AIPolicy;usage:AIUsage;reserved:{calls:number;tokens:number;costMicros:number|null};proposalIds:string[];errorCode:string|null;errorMessage:string|null;costState:'estimated'|'unknown'|'not_sent';createdAt:string;startedAt:string|null;endedAt:string|null;leaseUntil:string|null;sentCalls:number}
export interface AIMessage {id:string;conversationId:string;projectId:string;executionId:string|null;sequence:number;role:'human'|'assistant'|'tool_call'|'tool_result';text:string;payload:Record<string,unknown>;createdAt:string}
export interface AIBudget {projectId:string;ownerId:string;revision:number;limits:AIBudgetLimits;spent:{calls:number;tokens:number;costMicros:number};reserved:{calls:number;tokens:number;costMicros:number};activeExecutions:number}
export interface AIConversationDetail {conversation:AIConversation;messages:AIMessage[];executions:AIExecution[];hasMoreMessages:boolean;nextBeforeSequence:number|null}
export interface AISourceCitation {sourceId:string;quote:string|null;generatedSummary:string|null}
