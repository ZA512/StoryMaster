import type {EditorialAck,EditorialItem,EditorialMove,EditorialOutline,ChapterOutline} from '@storymaster/contracts';
export interface SceneMoveIntent {
 sceneId:string;title:string;sourceTitle:string;targetTitle:string;sourceChapterId:string;
 returnBeforeId:string|null;body:EditorialMove;key:string;undo:boolean;
}
export function chapterFor(outline:EditorialOutline,id:string):ChapterOutline|undefined{return outline.manuscripts.flatMap(m=>m.chapters).find(c=>c.id===id);}
export function sceneIn(outline:EditorialOutline,id:string):EditorialItem|undefined{return outline.manuscripts.flatMap(m=>m.chapters.flatMap(c=>c.scenes)).find(s=>s.id===id);}
export function prepareSceneMove(outline:EditorialOutline,id:string,targetId:string,beforeId:string|null,key:string):SceneMoveIntent|null {
 const scene=sceneIn(outline,id),target=chapterFor(outline,targetId),source=scene&&chapterFor(outline,scene.parentId);
 if(!scene||!source||!target||scene.archived||source.archived||target.archived)throw Error('Cette scène ou ce chapitre n’est plus disponible. Relisez le plan.');
 if(source.parentId!==target.parentId)throw Error('Utilisez le déplacement avancé pour changer de manuscrit.');
 if(beforeId===id)return null;
 if(beforeId&&!target.scenes.some(s=>s.id===beforeId))throw Error('La scène de destination n’est plus dans ce chapitre.');
 const at=source.scenes.findIndex(s=>s.id===id),next=source.scenes[at+1]?.id??null;
 if(source.id===target.id&&beforeId===next)return null;
 return {sceneId:id,title:scene.title,sourceTitle:source.title,targetTitle:target.title,sourceChapterId:source.id,returnBeforeId:next,key,undo:false,body:{expectedRevision:scene.revision,targetParentId:target.id,beforeId,expectedSourceStructureRevision:source.structureRevision,expectedTargetStructureRevision:target.structureRevision}};
}
// The inverse is another CAS command against the versions produced by this move.
// It must fail if either affected chapter changed after the confirmed operation.
export function reverseSceneMove(intent:SceneMoveIntent,ack:EditorialAck,key:string):SceneMoveIntent {
 return {sceneId:intent.sceneId,title:intent.title,sourceTitle:intent.targetTitle,targetTitle:intent.sourceTitle,sourceChapterId:intent.body.targetParentId,returnBeforeId:intent.body.beforeId,key,undo:true,body:{expectedRevision:ack.revision,targetParentId:intent.sourceChapterId,beforeId:intent.returnBeforeId,expectedSourceStructureRevision:intent.body.expectedTargetStructureRevision+1,expectedTargetStructureRevision:intent.body.expectedSourceStructureRevision+1}};
}
