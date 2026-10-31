export const narrativeTypes=['character','place','event'] as const;
export type NarrativeType=typeof narrativeTypes[number];
export const moduleKeys=['characters','places','timeline'] as const;
export type ModuleKey=typeof moduleKeys[number];
export const moduleFor:Record<NarrativeType,ModuleKey>={character:'characters',place:'places',event:'timeline'};
export const relationTypes=['related_to','knows','located_in','participates_in','precedes'] as const;
export type RelationType=typeof relationTypes[number];
export const referenceTypes=['present','mentioned','point_of_view','setting','depicts_event'] as const;
export type ReferenceType=typeof referenceTypes[number];
export interface EntityRef {id:string}
export interface CharacterAttributes {aliases?:string[];description?:string;narrativeRole?:string;motivations?:string[];goals?:string[];conflicts?:string[];traits?:string[];healthSummary?:string;conditionEventRefs?:EntityRef[]}
export interface PlaceAttributes {description?:string;category?:string;characteristics?:string[];parentPlaceRef?:EntityRef|null}
export type TemporalExpression={kind:'unknown'}|{kind:'ordinal';position:number};
export interface EventAttributes {description?:string;chronologyPosition?:number;temporalExpression:TemporalExpression}
export type NarrativeAttributes=CharacterAttributes|PlaceAttributes|EventAttributes;
export interface NarrativeObject {id:string;projectId:string;typeKey:NarrativeType;schemaVersion:1;name:string;summary:string;attributes:NarrativeAttributes;notes:string;status:'active'|'archived';revision:number;createdAt:string;updatedAt:string;createdBy:string;updatedBy:string}
export interface NarrativeRelation {id:string;projectId:string;sourceObjectId:string;targetObjectId:string;relationType:RelationType;attributes:{description?:string};status:'active'|'removed';revision:number;createdAt:string;updatedAt:string;createdBy:string;updatedBy:string}
export interface SceneReference {id:string;projectId:string;sceneId:string;objectId:string;referenceType:ReferenceType;metadata:Record<string,never>;revision:number}
export interface StoredSceneReference extends SceneReference {status:'active'|'removed'}
export interface ModuleDefinition {key:ModuleKey;version:1;typeKeys:NarrativeType[];dependencies:ModuleKey[];schemas:Record<string,unknown>;checksum:string}
export interface ModuleActivation {id:string;projectId:string;moduleKey:ModuleKey;moduleVersion:1;enabled:boolean;revision:number;updatedAt:string}
export interface NarrativeRevision<T=NarrativeObject|NarrativeRelation|ModuleActivation> {projectId:string;resourceId:string;resourceType:'object'|'relation'|'module';revision:number;snapshot:T;actor:{id:string|null;displayName:string;type:'human'|'system'};createdAt:string;changeSetId:string;action:string;restoredFromRevision:number|null}
export const relationRules:Record<RelationType,{sources:readonly NarrativeType[];targets:readonly NarrativeType[];symmetric:boolean;acyclic:boolean;singleTarget:boolean}>={
 related_to:{sources:narrativeTypes,targets:narrativeTypes,symmetric:true,acyclic:false,singleTarget:false},
 knows:{sources:['character'],targets:['character'],symmetric:false,acyclic:false,singleTarget:false},
 located_in:{sources:['character','event'],targets:['place'],symmetric:false,acyclic:false,singleTarget:true},
 participates_in:{sources:['character'],targets:['event'],symmetric:false,acyclic:false,singleTarget:false},
 precedes:{sources:['event'],targets:['event'],symmetric:false,acyclic:true,singleTarget:false},
};
export function referenceAccepts(type:ReferenceType,target:NarrativeType){return type==='mentioned'||(type==='present'||type==='point_of_view'?target==='character':type==='setting'?target==='place':target==='event');}
export function graphHasCycle(edges:readonly (readonly [string,string])[]):boolean{
 const outgoing=new Map<string,string[]>(),degree=new Map<string,number>();for(const [a,b]of edges){const next=outgoing.get(a);if(next)next.push(b);else outgoing.set(a,[b]);degree.set(a,degree.get(a)??0);degree.set(b,(degree.get(b)??0)+1);}const ready=[...degree].filter(([,d])=>d===0).map(([id])=>id);let seen=0;
 for(let i=0;i<ready.length;i++){seen++;for(const b of outgoing.get(ready[i]!)??[]){degree.set(b,degree.get(b)!-1);if(degree.get(b)===0)ready.push(b);}}return seen!==degree.size;
}

export interface NarrativeGraphNode {id:string;typeKey:NarrativeType;status:'active'|'archived';revision:number;parentPlaceId:string|null;ordinalPosition:number|null}
