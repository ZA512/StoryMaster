import {z} from 'zod';
import {characterAttributesSchema,placeAttributesSchema,eventAttributesSchema} from './narrative.ts';
import {proposalStates,narrativeTypes,relationTypes,referenceTypes} from '@storymaster/domain';
import type {ProposalHead} from '@storymaster/domain';
const id=z.string().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/),revision=z.number().int().min(1).max(Number.MAX_SAFE_INTEGER),text=(n:number)=>z.string().max(n).refine(s=>s.isWellFormed()&&!s.includes('\u0000')),title=text(200).refine(s=>!!s.trim()&&!/[\r\n]/.test(s));
export const proposalRefSchema=z.union([z.strictObject({id}),z.strictObject({tempId:id})]);
export const proposalCharacterAttributesSchema=characterAttributesSchema.extend({conditionEventRefs:z.array(proposalRefSchema).max(100).optional()});
export const proposalPlaceAttributesSchema=placeAttributesSchema.extend({parentPlaceRef:proposalRefSchema.nullable().optional()});
export function parseProposedCreateAttributes(type:string,attributes:unknown){return (type==='character'?proposalCharacterAttributesSchema:type==='place'?proposalPlaceAttributesSchema:eventAttributesSchema).parse(attributes);}
export const proposalDependencySchema=z.strictObject({resourceType:z.enum(['object','scene','chapter','manuscript','relation','module']),resourceId:id,revision});
const reason={reason:text(4000).optional()},existing={operationId:id,targetId:id,expectedRevision:revision,...reason},creation={operationId:id,tempId:id,...reason},empty=z.strictObject({}),attrs=z.record(z.string(),z.unknown()),relationAttrs=z.strictObject({description:text(4000).optional()});
const objectSet=z.strictObject({name:title.optional(),summary:text(4000).optional(),notes:text(20000).optional(),attributes:attrs.optional()}).refine(v=>Object.keys(v).length>0);
export const proposedReferenceSchema=z.strictObject({objectRef:proposalRefSchema,referenceType:z.enum(referenceTypes),metadata:empty.optional()});
export const proposedOperationSchema=z.discriminatedUnion('kind',[
 z.strictObject({...creation,kind:z.literal('create_object'),payload:z.strictObject({typeKey:z.enum(narrativeTypes),schemaVersion:z.literal(1),name:title,summary:text(4000).optional(),notes:text(20000).optional(),attributes:attrs})}),
 z.strictObject({...existing,kind:z.literal('update_object'),payload:z.strictObject({set:objectSet})}),
 z.strictObject({...existing,kind:z.literal('archive_object'),payload:empty}),
 z.strictObject({...creation,kind:z.literal('create_relation'),payload:z.strictObject({sourceRef:proposalRefSchema,targetRef:proposalRefSchema,relationType:z.enum(relationTypes),attributes:relationAttrs})}),
 z.strictObject({...existing,kind:z.literal('update_relation'),payload:z.strictObject({set:z.strictObject({relationType:z.enum(relationTypes).optional(),attributes:relationAttrs.optional()}).refine(v=>Object.keys(v).length>0)})}),
 z.strictObject({...existing,kind:z.literal('remove_relation'),payload:empty}),
 z.strictObject({...existing,kind:z.literal('replace_scene_content'),payload:z.strictObject({contentFormatVersion:z.literal(1),content:z.unknown()})}),
 z.strictObject({...existing,kind:z.literal('update_scene_metadata'),payload:z.strictObject({set:z.strictObject({title:title.optional(),summary:text(4000).optional(),status:text(40).refine(s=>!!s.trim()).optional(),references:z.array(proposedReferenceSchema).max(1000).optional()}).refine(v=>Object.keys(v).length>0)})}),
 z.strictObject({...existing,kind:z.literal('move_scene'),payload:z.strictObject({chapterId:id,position:z.number().int().positive().max(Number.MAX_SAFE_INTEGER)})})
]);
const operations=z.array(proposedOperationSchema).max(100),dependencies=z.array(proposalDependencySchema).max(1000);
export const proposalCreateSchema=z.strictObject({title,description:text(4000),operations,dependencyRevisions:dependencies});
export const proposalSetOperationsSchema=z.strictObject({expectedProposalRevision:revision,operations,dependencyRevisions:dependencies});
export const proposalUpdateSchema=z.strictObject({expectedProposalRevision:revision,set:z.strictObject({title:title.optional(),description:text(4000).optional()}).refine(v=>Object.keys(v).length>0)});
export const proposalActionSchema=z.strictObject({expectedProposalRevision:revision});
export const proposalApproveSchema=z.strictObject({expectedProposalRevision:revision,comment:text(4000).optional()});
export const proposalRejectSchema=z.strictObject({expectedProposalRevision:revision,reason:text(4000).refine(s=>!!s.trim())});
export const proposalReviewSchema=z.strictObject({expectedProposalRevision:revision,decision:z.enum(['comment','request_changes']),body:text(4000).refine(s=>!!s.trim())});
export const proposalListSchema=z.strictObject({status:z.enum(proposalStates).optional(),authorId:z.string().uuid().optional(),limit:z.coerce.number().int().min(1).max(100).default(20),cursor:z.string().max(2000).optional()});
export type ProposedOperation=z.infer<typeof proposedOperationSchema>;
export type ProposalDependency=z.infer<typeof proposalDependencySchema>;
export type ProposalContent=z.infer<typeof proposalCreateSchema>;
export interface ProposalRevision extends ProposalContent {proposalId:string;projectId:string;proposalRevision:number;contentHash:string;policyVersion:1;createdAt:string;createdBy:{id:string;displayName:string};aiExecutionId?:string}
export interface ProposalReview {id:string;projectId:string;proposalId:string;proposalRevision:number;contentHash:string;reviewerId:string;reviewerName:string;reviewerRole:string;reviewerMembershipRevision:number;stateVersion:number;decision:'comment'|'request_changes'|'approve'|'reject';comment:string;createdAt:string}
export type ReviewView=ProposalReview&{validity:'effective'|'invalidated';invalidationReason:string|null};
export interface ProposalDto extends ProposalHead,ProposalContent {contentHash:string;policyVersion:1;reviews:ReviewView[]}
export interface ProposalConflict {resourceType:string;resourceId:string;expectedRevision:number;currentRevision:number}
export interface ProposalFinding {code:string;message:string;operationId?:string;severity:'error'|'warning'}
export interface ProposalValidation {valid:boolean;errors:ProposalFinding[];warnings:ProposalFinding[];conflicts:ProposalConflict[];validatedAgainst:ProposalDependency[]}
export interface ProposalDiff {resourceId:string;kind:'structured'|'rich_text'|'relation'|'structure';baseRevision?:number;before?:unknown;after?:unknown;beforeText?:string;afterText?:string}
export interface ProposalPreview {proposalId:string;proposalRevision:number;validatedAgainst:ProposalDependency[];temporaryIds:Record<string,{tempId:string}>;affectedResources:{resourceType:string;resourceId:string;change:'create'|'update'|'archive'|'remove'}[];diffs:ProposalDiff[];validationFindings:ProposalFinding[];conflicts:ProposalConflict[];valid:boolean}
export interface MergeResult {proposalId:string;proposalRevision:number;proposalStatus:'merged';stateVersion:number;changeSetId:string;mergedAt:string;temporaryIds:Record<string,string>;resourceRevisions:ProposalDependency[]}
export interface ProposalEvent {id:string;projectId:string;proposalId:string;proposalRevision:number;stateVersion:number;status:ProposalHead['status'];action:string;actor:{id:string;displayName:string};createdAt:string;details:Record<string,unknown>}
export interface ProposalChangeSet {id:string;projectId:string;proposalId:string;proposalRevision:number;contentHash:string;actor:{id:string;displayName:string};createdAt:string;result:MergeResult;events:{resourceType:string;resourceId:string;before:unknown;after:unknown;operationIds:string[]}[]}
