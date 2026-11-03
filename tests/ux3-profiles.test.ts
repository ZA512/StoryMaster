import {before,after,test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import type {NarrativeObject} from '@storymaster/domain';
import {parseAttributes} from '@storymaster/contracts';
import {reset,close,correlation,admin} from './database.helper.ts';
import {narrative,bibleFixture,create,moduleState,member} from './narrative.helper.ts';
import {proposals,approve,key} from './proposals.helper.ts';
before(reset);after(close);
const code=(value:string)=>(e:unknown)=>!!e&&typeof e==='object'&&'code'in e&&e.code===value;
test('UX-3 : versions 1 et 2 fermées, création au seul nom, champs masqués préservés et historique lisible',async()=>{
 const f=await bibleFixture(),a=f.owner.actor,p=f.project.id,old=await create(a,p,'character','Élise',{aliases:['Lise'],goals:['Le phare','L’archipel'],healthSummary:'Fatiguée'});
 const n=await narrative.createObject(a,p,{typeKey:'character',schemaVersion:2,name:'Marc',summary:'',notes:'',attributes:{}},key(),correlation());assert.equal(n.schemaVersion,2);
 const saved=await narrative.updateObject(a,p,old.id,{set:{schemaVersion:2,attributes:{...old.attributes,background:'Enfance au port',speakingStyle:'Phrases courtes'}}},1,key(),correlation());
 assert.equal(saved.id,old.id);assert.equal(saved.schemaVersion,2);assert.deepEqual(saved.attributes,{...old.attributes,background:'Enfance au port',speakingStyle:'Phrases courtes'});
 const renamed=await narrative.updateObject(a,p,old.id,{set:{name:'Élise du port'}},2,key(),correlation());assert.deepEqual(renamed.attributes,saved.attributes);
 const {moduleEnabled,...oldCanonical}=old;assert.equal(moduleEnabled,true);assert.deepEqual((await narrative.revision(a,p,'object',old.id,1)).snapshot,oldCanonical);
 assert.throws(()=>parseAttributes('character',{background:'Interdit en v1'},1));assert.throws(()=>parseAttributes('place',{},2));assert.throws(()=>parseAttributes('character',{speakingStyle:'x'.repeat(4001)},2));assert.throws(()=>parseAttributes('character',{custom:{arbitrary:true}},2));
 const restored=await narrative.restoreObject(a,p,old.id,1,3,key(),correlation());assert.equal(restored.schemaVersion,1);assert.equal(restored.revision,4);assert.deepEqual(restored.attributes,old.attributes);assert.equal(((await narrative.revision(a,p,'object',old.id,2)).snapshot as NarrativeObject).schemaVersion,2);
});
test('UX-3 : deux auteurs, une base périmée refusée et idempotence du patch v2',async()=>{
 const f=await bibleFixture(),a=f.owner.actor,p=f.project.id,b=await member(p,'author'),n=await create(a,p,'character','Élise',{traits:['Observatrice'],motivations:['Retrouver Marc']});
 const intent={set:{schemaVersion:2 as const,attributes:{...n.attributes,background:'Passé partagé'}}},idempotency=key();const saved=await narrative.updateObject(a,p,n.id,intent,1,idempotency,correlation());
 assert.deepEqual(await narrative.updateObject(a,p,n.id,intent,1,idempotency,correlation()),saved);
 await assert.rejects(narrative.updateObject(b.actor,p,n.id,{set:{summary:'Saisie concurrente conservée par le client'}},1,key(),correlation()),code('REVISION_CONFLICT'));
 assert.equal((await narrative.getObject(a,p,n.id)).revision,2);assert.deepEqual((await narrative.getObject(a,p,n.id)).attributes,saved.attributes);
});
test('UX-3 : module désactivé et retrait de membre refusent les nouvelles éditions v2 sans perte',async()=>{
 const f=await bibleFixture(),a=f.owner.actor,p=f.project.id,b=await member(p,'author'),n=await narrative.createObject(a,p,{typeKey:'character',schemaVersion:2,name:'Marc',summary:'',notes:'Notes partagées',attributes:{background:'Passé conservé'}},key(),correlation());
 await moduleState(a,p,'characters',false);assert.equal((await narrative.getObject(b.actor,p,n.id)).schemaVersion,2);await assert.rejects(narrative.updateObject(b.actor,p,n.id,{set:{summary:'Non'}},1,key(),correlation()),code('MODULE_DISABLED'));
 await moduleState(a,p,'characters',true);await admin.query("UPDATE project_memberships SET status='removed',revision=revision+1 WHERE project_id=$1 AND user_id=$2",[p,b.user.id]);await assert.rejects(narrative.updateObject(b.actor,p,n.id,{set:{summary:'Non'}},1,key(),correlation()),code('NOT_FOUND'));assert.deepEqual((await narrative.getObject(a,p,n.id)).attributes,n.attributes);
});
test('UX-3 : proposition v2 projetée, fusion humaine et export narratif conservent le schéma',async()=>{
 const f=await bibleFixture(),a=f.owner.actor,p=f.project.id,operations=[{operationId:'character',kind:'create_object' as const,tempId:'new_character',payload:{typeKey:'character' as const,schemaVersion:2 as const,name:'Élise',attributes:{background:'Enfance sur les quais',speakingStyle:'Voix calme',aliases:['Lise']}}}];
 let proposal=await proposals.create(a,p,{title:'Une fiche détaillée',description:'Création humaine v2',operations,dependencyRevisions:[]},key(),correlation());const preview=await proposals.preview(a,p,proposal.id,proposal.proposalRevision);proposal=await proposals.setOperations(a,p,proposal.id,{expectedProposalRevision:1,operations,dependencyRevisions:preview.validatedAgainst},proposal.stateVersion,key(),correlation());proposal=await approve(proposal,a);const merged=await proposals.merge(a,p,proposal.id,proposal.proposalRevision,proposal.stateVersion,key(),correlation()),n=await narrative.getObject(a,p,merged.temporaryIds.new_character!);
 assert.equal(n.schemaVersion,2);assert.equal((n.attributes as {background:string}).background,'Enfance sur les quais');const exported=await narrative.export(a,p);const {moduleEnabled,...canonical}=n;assert.equal(moduleEnabled,true);assert.deepEqual(exported.objects.find(x=>x.id===n.id),canonical);assert.ok(exported.modules.definitions.some(d=>d.key==='characters'&&d.version===2));assert.equal(((await narrative.revision(a,p,'object',n.id,1)).snapshot as NarrativeObject).schemaVersion,2);
 await assert.rejects(narrative.updateObject({...a,type:'integrated_ai',executionId:randomUUID()},p,n.id,{set:{name:'Canon interdit'}},1,key(),correlation()),code('FORBIDDEN'));
 assert.equal((await narrative.getObject(a,p,n.id)).name,'Élise');
});
