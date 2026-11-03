import published from './module-registry.v2.json' with {type:'json'};
import {z} from 'zod';
import {AppError,narrativeTypes,relationTypes,referenceTypes,moduleKeys,parentageKinds,parentRoles} from '@storymaster/domain';
import type {NarrativeObject,NarrativeRelation,ModuleActivation,ModuleDefinition,SceneReference,NarrativeRevision,NarrativeType,RelationType} from '@storymaster/domain';
const revision=z.number().int().positive().max(Number.MAX_SAFE_INTEGER),id=z.string().uuid();
const text=(max:number)=>z.string().max(max).refine(s=>s.isWellFormed()&&!s.includes('\u0000'));
const title=text(200).refine(s=>!!s.trim()&&!/[\r\n]/.test(s));
const strings=(max=1000)=>z.array(text(max)).max(100);
const ref=z.strictObject({id});
export const characterAttributesSchema=z.strictObject({aliases:strings(200).optional(),description:text(20000).optional(),narrativeRole:text(200).optional(),motivations:strings().optional(),goals:strings().optional(),conflicts:strings().optional(),traits:strings().optional(),healthSummary:text(4000).optional(),conditionEventRefs:z.array(ref).max(100).optional()});
export const characterAttributesV2Schema=characterAttributesSchema.extend({background:text(20000).optional(),speakingStyle:text(4000).optional()});
export const placeAttributesSchema=z.strictObject({description:text(20000).optional(),category:text(200).optional(),characteristics:strings().optional(),parentPlaceRef:ref.nullable().optional()});
export const temporalSchema=z.discriminatedUnion('kind',[z.strictObject({kind:z.literal('unknown')}),z.strictObject({kind:z.literal('ordinal'),position:z.number().min(Number.MIN_SAFE_INTEGER).max(Number.MAX_SAFE_INTEGER)})]);
export const eventAttributesSchema=z.strictObject({description:text(20000).optional(),chronologyPosition:z.number().min(Number.MIN_SAFE_INTEGER).max(Number.MAX_SAFE_INTEGER).optional(),temporalExpression:temporalSchema.optional()});
export function parseAttributes(type:NarrativeType,input:unknown,version:1|2=1){
 if(version===2){if(type!=='character')throw new AppError('VALIDATION_FAILED','Seuls les personnages possèdent un schéma v2.',422);return characterAttributesV2Schema.parse(input);}
 if(type==='character')return characterAttributesSchema.parse(input);
 if(type==='place')return placeAttributesSchema.parse(input);
 const a=eventAttributesSchema.parse(input),t=a.temporalExpression??(a.chronologyPosition===undefined?{kind:'unknown' as const}:{kind:'ordinal' as const,position:a.chronologyPosition});
 if(a.chronologyPosition!==undefined&&(t.kind!=='ordinal'||t.position!==a.chronologyPosition))throw new AppError('VALIDATION_FAILED','Repères ordinaux incohérents.',422);
 return {...a,temporalExpression:t,...(t.kind==='ordinal'?{chronologyPosition:t.position}:{})};
}
export const createNarrativeSchema=z.strictObject({typeKey:z.enum(narrativeTypes),schemaVersion:z.union([z.literal(1),z.literal(2)]),name:title,summary:text(4000).default(''),notes:text(20000).default(''),attributes:z.unknown()});
export const updateNarrativeSchema=z.strictObject({set:z.strictObject({schemaVersion:z.union([z.literal(1),z.literal(2)]).optional(),name:title.optional(),summary:text(4000).optional(),notes:text(20000).optional(),attributes:z.unknown().optional()}).refine(s=>Object.keys(s).length>0)});
export const dependencyRevisionsSchema=z.array(z.strictObject({id,revision})).max(500).refine(a=>new Set(a.map(x=>x.id)).size===a.length);
export const legacyRelationAttributesSchema=z.strictObject({description:text(4000).optional()});
export const parentRelationAttributesSchema=legacyRelationAttributesSchema.extend({parentage:z.enum(parentageKinds).default('unspecified'),parentRole:z.enum(parentRoles).default('parent')});
export const relationAttributesSchema=legacyRelationAttributesSchema.extend({parentage:z.enum(parentageKinds).optional(),parentRole:z.enum(parentRoles).optional()});
export function parseRelationAttributes(type:RelationType,value:unknown){return (type==='parent_of'?parentRelationAttributesSchema:legacyRelationAttributesSchema).parse(value);}
export const createNarrativeRelationSchema=z.strictObject({sourceRef:ref,targetRef:ref,sourceRevision:revision,targetRevision:revision,relationType:z.enum(relationTypes),attributes:relationAttributesSchema.default({})});
export const updateNarrativeRelationSchema=z.strictObject({set:z.strictObject({relationType:z.enum(relationTypes).optional(),attributes:relationAttributesSchema.optional()}).refine(s=>Object.keys(s).length>0),dependencyRevisions:dependencyRevisionsSchema});
export const relationDependenciesSchema=z.strictObject({dependencyRevisions:dependencyRevisionsSchema});
export const narrativeArchiveSchema=z.strictObject({archived:z.boolean()});
export const narrativeRestoreSchema=z.strictObject({sourceRevision:revision});
export const moduleUpdateSchema=z.strictObject({enabled:z.boolean(),moduleVersion:z.union([z.literal(1),z.literal(2)])});
export const referenceInputSchema=z.strictObject({objectRef:ref,referenceType:z.enum(referenceTypes),metadata:z.strictObject({}).default({})});
export const sceneReferencesSchema=z.strictObject({references:z.array(referenceInputSchema).max(500),dependencyRevisions:dependencyRevisionsSchema});
const queryTypes=z.string().transform(s=>s.split(',')).pipe(z.array(z.enum(['scene',...narrativeTypes])).min(1).max(4).refine(a=>new Set(a).size===a.length));
export const searchNarrativeSchema=z.strictObject({q:text(1000).refine(s=>!!s.trim()),types:queryTypes.optional(),status:z.enum(['active','archived','all']).default('active'),limit:z.coerce.number().int().min(1).max(100).default(20),cursor:z.string().max(2000).optional()});
export const listNarrativeSchema=z.strictObject({typeKey:z.enum(narrativeTypes).optional(),parentPlaceId:id.optional(),q:text(1000).default(''),status:z.enum(['active','archived','all']).default('active'),limit:z.coerce.number().int().min(1).max(100).default(20),cursor:z.string().max(2000).optional()});
export const narrativePageSchema=z.strictObject({limit:z.coerce.number().int().min(1).max(100).default(20),cursor:z.string().max(2000).optional()});
export const moduleKeySchema=z.enum(moduleKeys);
export type NarrativeCreate=z.infer<typeof createNarrativeSchema>;
export type NarrativeUpdate=z.infer<typeof updateNarrativeSchema>;
export type RelationCreate=z.infer<typeof createNarrativeRelationSchema>;
export type RelationUpdate=z.infer<typeof updateNarrativeRelationSchema>;
export type ReferenceInput=z.infer<typeof referenceInputSchema>;
export type SceneReferencesInput=z.infer<typeof sceneReferencesSchema>;
export type SearchInput=z.infer<typeof searchNarrativeSchema>;
export type ObjectListInput=z.infer<typeof listNarrativeSchema>;
export interface PageDto<T>{items:T[];nextCursor:string|null;hasMore:boolean}
export type LinkState='active'|'target_archived'|'module_disabled'|'removed';
export interface NarrativeObjectDto extends NarrativeObject {moduleEnabled:boolean}
export interface RelationView extends NarrativeRelation {source:{id:string;name:string;typeKey:NarrativeType;status:'active'|'archived';moduleEnabled:boolean;revision:number};target:RelationView['source'];linkState:LinkState}
export interface ReferenceView extends SceneReference {target:RelationView['source'];linkState:LinkState}
export interface SceneReferencesView {sceneId:string;sceneRevision:number;items:ReferenceView[]}
export interface InverseReference extends ReferenceView {scene:{id:string;title:string;chapterId:string;manuscriptId:string;archived:boolean;revision:number}}
export interface ObjectDetail {object:NarrativeObjectDto;relations:RelationView[];children:NarrativeObjectDto[];references:InverseReference[];hasMoreRelations:boolean;hasMoreReferences:boolean;hasMoreChildren:boolean;relationsNextCursor:string|null;referencesNextCursor:string|null;childrenNextCursor:string|null;parent:NarrativeObjectDto|null}
export interface ModulesDto {definitions:ModuleDefinition[];activations:ModuleActivation[]}
export interface SearchHit {resourceType:'scene'|'object';resourceId:string;typeKey:'scene'|NarrativeType;title:string;excerpt:string;revision:number;relevance:number;archived:boolean;moduleEnabled:boolean}
export interface NarrativeExport {format:'storymaster-narrative';formatVersion:1;projectId:string;exportedAt:string;historyIncluded:false;modules:ModulesDto;objects:NarrativeObject[];relations:NarrativeRelation[];sceneReferences:(SceneReference&{status:'active'|'removed'})[]}
export interface NarrativeRevisionPage {items:NarrativeRevision[];hasMore:boolean;nextBeforeRevision:number|null}

export const narrativeRegistry=published as unknown as {registryVersion:2;definitions:ModuleDefinition[]};

export const restoreRelationSchema=z.strictObject({sourceRevision:z.number().int().positive().optional(),dependencyRevisions:dependencyRevisionsSchema});

export const timelineQuerySchema=z.strictObject({status:z.enum(['active','archived','all']).default('active'),limit:z.coerce.number().int().min(1).max(100).default(20),cursor:z.string().max(2000).optional()});
