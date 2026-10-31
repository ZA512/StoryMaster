import {randomUUID} from 'node:crypto';
import {NarrativeService} from '@storymaster/application';
import type {NarrativeType,Actor,NarrativeObject,ModuleKey} from '@storymaster/domain';
import {db,correlation,admin,person,secret} from './database.helper.ts';
import {fixture,editorial} from './editorial.helper.ts';
export const narrative=new NarrativeService(db,secret);
export async function bibleFixture(){const f=await fixture();for(const m of (await narrative.modules(f.owner.actor,f.project.id)).activations)await narrative.setModule(f.owner.actor,f.project.id,m.moduleKey,true,m.revision,randomUUID(),correlation());return f;}
export const create=(actor:Actor,p:string,typeKey:NarrativeType,name:string,attributes:unknown={})=>narrative.createObject(actor,p,{typeKey,schemaVersion:1,name,summary:'',notes:'',attributes},randomUUID(),correlation());
export const relation=(actor:Actor,p:string,type:'related_to'|'knows'|'located_in'|'participates_in'|'precedes',source:NarrativeObject,target:NarrativeObject)=>narrative.createRelation(actor,p,{sourceRef:{id:source.id},targetRef:{id:target.id},sourceRevision:source.revision,targetRevision:target.revision,relationType:type,attributes:{}},randomUUID(),correlation());
export async function moduleState(actor:Actor,p:string,key:ModuleKey,enabled:boolean){const a=(await narrative.modules(actor,p)).activations.find(a=>a.moduleKey===key)!;return narrative.setModule(actor,p,key,enabled,a.revision,randomUUID(),correlation());}
export async function member(p:string,role:'admin'|'author'|'reviewer'|'reader'){const a=await person();await admin.query('INSERT INTO project_memberships(project_id,user_id,role) VALUES($1,$2,$3)',[p,a.user.id,role]);return a;}
export async function setRefs(actor:Actor,p:string,s:string,refs:{objectRef:{id:string};referenceType:'present'|'mentioned'|'point_of_view'|'setting'|'depicts_event';metadata:Record<string,never>}[],revision?:number,key=randomUUID()){
 const current=await editorial.getScene(actor,p,s),ids=[...new Set([...current.references.map(r=>r.objectId),...refs.map(r=>r.objectRef.id)])],dependencyRevisions=await Promise.all(ids.map(async id=>({id,revision:(await narrative.getObject(actor,p,id)).revision})));
 return editorial.replaceReferences(actor,p,s,{references:refs,dependencyRevisions},revision??current.revision,key,correlation());
}
export const reference=(object:NarrativeObject,type:'present'|'mentioned'|'point_of_view'|'setting'|'depicts_event')=>({objectRef:{id:object.id},referenceType:type,metadata:{}});
