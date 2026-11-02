import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {EditorialItem,EditorialOutline} from '@storymaster/contracts';
import {prepareSceneMove,reverseSceneMove} from '../apps/web/components/writer/scene-move-intent.ts';
function fixture():EditorialOutline{
 const node=(id:string,parentId:string,position:number,kind:EditorialItem['kind']='scene'):EditorialItem=>({kind,id,parentId,position,projectId:'P',title:id,summary:'',status:'Brouillon',archived:false,revision:9,structureRevision:3,writingStatuses:[],wordCount:7,createdAt:'2026-11-02',updatedAt:'2026-11-02'});
 return {projectId:'P',revision:20,structureRevision:1,manuscripts:[{...node('M','P',1,'manuscript'),chapters:[{...node('C1','M',1,'chapter'),scenes:[node('A','C1',1),node('B','C1',2),node('C','C1',3)]},{...node('C2','M',2,'chapter'),structureRevision:5,scenes:[]}]}]};
}
test('UX-2 : intent gelée par les versions des deux chapitres, identité et position relative, sans muter le plan',()=>{
 const outline=fixture(),before=structuredClone(outline),move=prepareSceneMove(outline,'A','C2',null,'key')!;
 assert.deepEqual(outline,before);assert.equal(move.sceneId,'A');assert.equal(move.returnBeforeId,'B');assert.deepEqual(move.body,{expectedRevision:9,targetParentId:'C2',beforeId:null,expectedSourceStructureRevision:3,expectedTargetStructureRevision:5});
 const undo=reverseSceneMove(move,{id:'A',revision:10,structureRevision:1,projectEditorialRevision:21},'inverse');assert.equal(undo.undo,true);assert.deepEqual(undo.body,{expectedRevision:10,targetParentId:'C1',beforeId:'B',expectedSourceStructureRevision:6,expectedTargetStructureRevision:4});assert.notEqual(undo.key,move.key);
});
test('UX-2 : pas de commande pour un dépôt sans changement, cible absente et changement de manuscrit refusés',()=>{
 const outline=fixture();assert.equal(prepareSceneMove(outline,'A','C1','B','same'),null);assert.equal(prepareSceneMove(outline,'A','C1','A','same'),null);assert.equal(prepareSceneMove(outline,'C','C1',null,'same'),null);
 assert.throws(()=>prepareSceneMove(outline,'A','C2','B','bad'));outline.manuscripts[0]!.chapters[1]!.parentId='Other';assert.throws(()=>prepareSceneMove(outline,'A','C2',null,'bad'));
});
