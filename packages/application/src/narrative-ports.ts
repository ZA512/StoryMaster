import type {NarrativeObject,NarrativeRelation,NarrativeRevision,ModuleActivation,ModuleDefinition,SceneReference,StoredSceneReference,Actor,NarrativeGraphNode} from '@storymaster/domain';
import type {SearchHit,RelationView} from '@storymaster/contracts';
export interface NarrativePort {
 definitions():Promise<ModuleDefinition[]>;
 modules(projectId:string):Promise<ModuleActivation[]>;
 updateModule(value:ModuleActivation):Promise<void>;
 object(projectId:string,id:string):Promise<NarrativeObject|null>;
 targets(projectId:string,ids:string[]):Promise<RelationView['source'][]>;
 timeline(projectId:string,status:string,limit:number,after?:{position:number|null;id:string}):Promise<NarrativeObject[]>;
 graph(projectId:string):Promise<NarrativeGraphNode[]>;
 edges(projectId:string):Promise<Pick<NarrativeRelation,'id'|'sourceObjectId'|'targetObjectId'|'relationType'|'status'>[]>;
 objects(projectId:string):Promise<NarrativeObject[]>;
 objectPage(projectId:string,options:{typeKey?:string;q:string;status:string;parentPlaceId?:string;afterId?:string;limit:number}):Promise<NarrativeObject[]>;
 putObject(value:NarrativeObject,insert:boolean,searchText:string):Promise<void>;
 relation(projectId:string,id:string):Promise<NarrativeRelation|null>;
 relations(projectId:string,objectId?:string,limit?:number,afterId?:string):Promise<NarrativeRelation[]>;
 putRelation(value:NarrativeRelation,insert:boolean):Promise<void>;
 references(projectId:string,sceneId:string):Promise<SceneReference[]>;
 storedReferences(projectId:string,sceneId?:string):Promise<StoredSceneReference[]>;
 putReference(value:StoredSceneReference,insert:boolean):Promise<void>;
 reverseReferences(projectId:string,objectId:string,afterId:string|undefined,limit:number):Promise<{reference:SceneReference;scene:{id:string;title:string;chapterId:string;manuscriptId:string;archived:boolean;revision:number}}[]>;
 record(projectId:string,resourceType:'object'|'relation'|'module',resourceId:string,revision:number,snapshot:NarrativeObject|NarrativeRelation|ModuleActivation,actor:Actor,action:string,correlationId:string,restoredFrom?:number):Promise<string>;
 revision(projectId:string,kind:'object'|'relation'|'module',id:string,revision:number):Promise<NarrativeRevision|null>;
 revisions(projectId:string,kind:'object'|'relation'|'module',id:string,limit:number,beforeRevision?:number):Promise<NarrativeRevision[]>;
 search(projectId:string,query:{q:string;types:string[];status:string;limit:number;after?:{rank:number;kind:string;id:string}}):Promise<SearchHit[]>;
 exportSize(projectId:string):Promise<number>;
}
