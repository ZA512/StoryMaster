import type { EditorialNode,EditorialKind,EditorialChange,SceneRevision,Actor } from '@storymaster/domain';
export interface EditorialPort {
 lockScene(projectId:string,sceneId:string):Promise<void>;
 view(projectId:string,manuscriptId?:string):Promise<{nodes:EditorialNode[];revision:number;structureRevision:number}>;
 projectVersions(projectId:string):Promise<{revision:number;structureRevision:number}>;
 touchProject(projectId:string,structure:boolean):Promise<number>;
 get(kind:EditorialKind,projectId:string,id:string):Promise<EditorialNode|null>;
 children(kind:EditorialKind,projectId:string,parentId:string):Promise<EditorialNode[]>;
 all(projectId:string):Promise<EditorialNode[]>;
 insert(node:EditorialNode):Promise<void>;
 update(node:EditorialNode,sceneText?:string):Promise<void>;
 advanceSceneRevision(projectId:string,id:string,revision:number,updatedAt:string):Promise<boolean>;
 reindex(kind:EditorialKind,projectId:string,parentId:string,orderedIds:string[]):Promise<void>;
 bumpStructure(kind:'project'|'manuscript'|'chapter',projectId:string,id:string):Promise<void>;
 change(change:EditorialChange):Promise<void>;
 snapshot(scene:EditorialNode,actor:Actor,changeSetId:string,action:string,restoredFrom?:number):Promise<void>;
 revision(projectId:string,sceneId:string,revision:number):Promise<SceneRevision|null>;
 revisions(projectId:string,sceneId:string,limit:number,beforeRevision?:number):Promise<SceneRevision[]>;
}
