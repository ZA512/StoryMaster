import {before,after,test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import type {NarrativeObject,NarrativeRelation,RelationType,RelationAttributes} from '@storymaster/domain';
import {graphHasCycle} from '@storymaster/domain';
import {reset,close,correlation,admin} from './database.helper.ts';
import {narrative,bibleFixture,create,member,moduleState} from './narrative.helper.ts';
import {proposals,approve,key} from './proposals.helper.ts';
before(reset);after(close);
const code=(value:string)=>(e:unknown)=>!!e&&typeof e==='object'&&'code'in e&&e.code===value;
const link=(f:Awaited<ReturnType<typeof bibleFixture>>,source:NarrativeObject,target:NarrativeObject,type:RelationType='parent_of',attributes:RelationAttributes={})=>narrative.createRelation(f.owner.actor,f.project.id,{sourceRef:{id:source.id},targetRef:{id:target.id},sourceRevision:source.revision,targetRevision:target.revision,relationType:type,attributes},key(),correlation());
test('UX-3 : PostgreSQL défend les types des extrémités, l’ordre symétrique et les qualifications fermées',async()=>{
 const f=await bibleFixture(),a=f.owner.actor,p=f.project.id,A=await create(a,p,'character','A'),B=await create(a,p,'character','B'),place=await create(a,p,'place','Lieu');
 const raw=(source:string,target:string,type:string,attrs:unknown)=>admin.query("INSERT INTO narrative_relations(id,project_id,source_object_id,target_object_id,relation_type,attributes,status,revision,created_at,updated_at,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,'active',1,now(),now(),$7,$7)",[randomUUID(),p,source,target,type,attrs,a.userId]);
 const constraint=(name:string)=>(e:unknown)=>!!e&&typeof e==='object'&&'constraint'in e&&e.constraint===name;
 await assert.rejects(raw(A.id,place.id,'parent_of',{}),constraint('narrative_relation_character_target'));
 const [low,high]=[A.id,B.id].sort();await assert.rejects(raw(high!,low!,'sibling_of',{}),constraint('narrative_relation_symmetric_order'));
 await assert.rejects(raw(A.id,B.id,'parent_of',{parentage:'invented'}),constraint('narrative_relation_parent_qualification'));
 await assert.rejects(raw(low!,high!,'ally_of',{parentRole:'father'}),constraint('narrative_relation_parent_qualification'));
 assert.equal((await narrative.relationList(a,p,A.id)).items.length,0);
});
test('UX-3 C/D/E : parentés multiples qualifiées et une seule identité par lien inverse ou symétrique',async()=>{
 const f=await bibleFixture(),a=f.owner.actor,p=f.project.id,elise=await create(a,p,'character','Élise'),parents=await Promise.all(['Marc','Anne','Lou'].map(name=>create(a,p,'character',name)));
 const links=[];for(const [i,parent]of parents.entries())links.push(await link(f,parent,elise,'parent_of',{parentage:i===2?'adoptive':'biological',parentRole:i===0?'father':i===1?'mother':'parent'}));
 assert.equal((await narrative.relationList(a,p,elise.id)).items.length,3);for(const parent of parents)assert.equal((await narrative.relationList(a,p,parent.id)).items[0]!.target.id,elise.id);
 assert.equal((await narrative.relationList(a,p,parents[0]!.id)).items[0]!.id,links[0]!.id);await assert.rejects(link(f,parents[0]!,elise,'parent_of',{parentage:'social'}),code('VALIDATION_FAILED'));
 const sibling=await create(a,p,'character','Noé'),r=await link(f,elise,sibling,'sibling_of');assert.ok(r.sourceObjectId<r.targetObjectId);assert.equal((await narrative.relationList(a,p,sibling.id)).items[0]!.id,r.id);await assert.rejects(link(f,sibling,elise,'sibling_of'),code('VALIDATION_FAILED'));
 // Shared parent does not infer another sibling relation.
 await link(f,parents[0]!,sibling);const thirdChild=await create(a,p,'character','Camille');await link(f,parents[0]!,thirdChild);assert.equal((await narrative.relationList(a,p,thirdChild.id)).items.filter(r=>r.relationType==='sibling_of').length,0);
 for(const type of ['ally_of','rival_of'] as const){const relation=await link(f,sibling,parents[1]!,type);assert.ok(relation.sourceObjectId<relation.targetObjectId);await assert.rejects(link(f,parents[1]!,sibling,type),code('VALIDATION_FAILED'));}
 await link(f,parents[2]!,elise,'mentor_of');assert.equal((await narrative.getObject(a,p,elise.id)).revision,1);
});
test('UX-3 F : auto-parenté, objets inexistants/étrangers/incompatibles, qualifications et cycles refusés atomiquement',async()=>{
 const f=await bibleFixture(),a=f.owner.actor,p=f.project.id,A=await create(a,p,'character','A'),B=await create(a,p,'character','B'),C=await create(a,p,'character','C'),place=await create(a,p,'place','Le port'),other=await bibleFixture(),foreign=await create(other.owner.actor,other.project.id,'character','Secret');
 await assert.rejects(link(f,A,A),code('VALIDATION_FAILED'));await assert.rejects(link(f,A,{...B,id:randomUUID()}),code('VALIDATION_FAILED'));await assert.rejects(link(f,A,foreign),code('VALIDATION_FAILED'));await assert.rejects(link(f,A,place),code('VALIDATION_FAILED'));
 await assert.rejects(link(f,A,B,'ally_of',{parentage:'biological'}));await link(f,A,B,'parent_of',{parentage:'adoptive'});await link(f,B,C,'parent_of',{parentage:'guardianship'});const before=await narrative.export(a,p);
 await assert.rejects(link(f,C,A,'parent_of',{parentage:'social'}),code('VALIDATION_FAILED'));const after=await narrative.export(a,p);assert.deepEqual(after.relations,before.relations);assert.deepEqual(after.objects,before.objects);
 await narrative.archiveObject(a,p,B.id,true,1,key(),correlation());await assert.rejects(link(f,C,A),code('VALIDATION_FAILED'));assert.equal((await narrative.relationList(a,p,A.id)).items[0]!.linkState,'target_archived');
});
test('UX-3 J : créations concurrentes de filiation sous barrière projet, modification CAS et restauration révisionnée',async()=>{
 const f=await bibleFixture(),a=f.owner.actor,p=f.project.id,A=await create(a,p,'character','Élise'),B=await create(a,p,'character','Marc');const attempts=await Promise.allSettled([link(f,A,B),link(f,B,A)]);assert.equal(attempts.filter(r=>r.status==='fulfilled').length,1);assert.equal(attempts.filter(r=>r.status==='rejected'&&code('VALIDATION_FAILED')(r.reason)).length,1);
 const rows=(await narrative.export(a,p)).relations;assert.equal(rows.length,1);assert.equal(graphHasCycle(rows.map(r=>[r.sourceObjectId,r.targetObjectId])),false);const r=rows[0]!,bases=[{id:A.id,revision:1},{id:B.id,revision:1}],updated=await narrative.updateRelation(a,p,r.id,{set:{attributes:{...r.attributes,description:'Lien confirmé'}},dependencyRevisions:bases},1,key(),correlation());
 await assert.rejects(narrative.updateRelation(a,p,r.id,{set:{attributes:{description:'Ancienne saisie'}},dependencyRevisions:bases},1,key(),correlation()),code('REVISION_CONFLICT'));
 const removed=await narrative.removeRelation(a,p,r.id,bases,updated.revision,key(),correlation());assert.equal(removed.status,'removed');assert.equal(((await narrative.revision(a,p,'relation',r.id,1)).snapshot as NarrativeRelation).attributes.description,undefined);const restored=await narrative.removeRelation(a,p,r.id,bases,removed.revision,key(),correlation(),1);assert.equal(restored.id,r.id);assert.equal(restored.revision,4);assert.equal(restored.status,'active');
});
test('UX-3 K/L : auteur révoqué et module off refusent les liens, anciens liens restent consultables',async()=>{
 const f=await bibleFixture(),a=f.owner.actor,p=f.project.id,A=await create(a,p,'character','Élise'),B=await create(a,p,'character','Marc'),r=await link(f,B,A),b=await member(p,'author'),bases=[{id:A.id,revision:1},{id:B.id,revision:1}];await moduleState(a,p,'characters',false);
 assert.equal((await narrative.relationList(b.actor,p,A.id)).items[0]!.id,r.id);await assert.rejects(narrative.updateRelation(b.actor,p,r.id,{set:{attributes:{description:'Non'}},dependencyRevisions:bases},1,key(),correlation()),code('MODULE_DISABLED'));await assert.rejects(narrative.removeRelation(a,p,r.id,bases,1,key(),correlation()),code('MODULE_DISABLED'));
 await moduleState(a,p,'characters',true);await admin.query("UPDATE project_memberships SET status='removed',revision=revision+1 WHERE project_id=$1 AND user_id=$2",[p,b.user.id]);await assert.rejects(narrative.removeRelation(b.actor,p,r.id,bases,1,key(),correlation()),code('NOT_FOUND'));assert.equal((await narrative.relationList(a,p,A.id)).items[0]!.status,'active');
});
test('UX-3 M : créations temporaires v2 et parenté proposées, cycle final refusé et fusion humaine seule',async()=>{
 const f=await bibleFixture(),a=f.owner.actor,p=f.project.id,operations=[{operationId:'parent',kind:'create_object' as const,tempId:'marc',payload:{typeKey:'character' as const,schemaVersion:2 as const,name:'Marc',attributes:{background:'Le gardien du phare'}}},{operationId:'child',kind:'create_object' as const,tempId:'elise',payload:{typeKey:'character' as const,schemaVersion:1 as const,name:'Élise',attributes:{}}},{operationId:'family',kind:'create_relation' as const,tempId:'family',payload:{sourceRef:{tempId:'marc'},targetRef:{tempId:'elise'},relationType:'parent_of' as const,attributes:{parentRole:'father' as const,parentage:'biological' as const}}}];
 let proposal=await proposals.create(a,p,{title:'Une famille déclarée',description:'Une seule filiation',operations,dependencyRevisions:[]},key(),correlation());const preview=await proposals.preview(a,p,proposal.id,1);proposal=await proposals.setOperations(a,p,proposal.id,{expectedProposalRevision:1,operations,dependencyRevisions:preview.validatedAgainst},proposal.stateVersion,key(),correlation());proposal=await approve(proposal,a);const result=await proposals.merge(a,p,proposal.id,proposal.proposalRevision,proposal.stateVersion,key(),correlation()),exported=await narrative.export(a,p);assert.equal(exported.relations.length,1);assert.equal(exported.relations[0]!.sourceObjectId,result.temporaryIds.marc);assert.equal(exported.relations[0]!.targetObjectId,result.temporaryIds.elise);assert.equal(exported.relations[0]!.attributes.parentRole,'father');
 const cyclic=[...operations,{operationId:'cycle',kind:'create_relation' as const,tempId:'cycle',payload:{sourceRef:{tempId:'elise'},targetRef:{tempId:'marc'},relationType:'parent_of' as const,attributes:{}}}],bad=await proposals.create(a,p,{title:'Cycle interdit',description:'Ne doit jamais muter le canon',operations:cyclic,dependencyRevisions:[]},key(),correlation());const invalid=await proposals.preview(a,p,bad.id,1);assert.equal(invalid.valid,false);assert.ok(invalid.validationFindings.some(f=>f.message.includes('cycle de parenté')));assert.equal((await narrative.export(a,p)).relations.length,1);
});
