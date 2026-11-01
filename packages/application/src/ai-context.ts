import {randomUUID} from 'node:crypto';
import {AppError} from '@storymaster/domain';
import type {Actor} from '@storymaster/domain';
import type {AIContextInput,ContextReference} from '@storymaster/contracts';
import {canonicalDocumentStats} from '@storymaster/editor';
import {EditorialService} from './editorial.ts';
import {NarrativeService} from './narrative.ts';
import {withProject} from './project-access.ts';
import {fingerprint} from './index.ts';
import type {UnitOfWork,Transaction} from './index.ts';
const jsonRecord=(v:unknown)=>JSON.parse(JSON.stringify(v)) as Record<string,unknown>;
export const inTransaction=(tx:Transaction):UnitOfWork=>({transaction:work=>work(tx)});
export class ContextBuilder {
 constructor(private db:UnitOfWork,private secret:string){}
 private services(tx:Transaction){const db=inTransaction(tx);return {editorial:new EditorialService(db),narrative:new NarrativeService(db,this.secret)};}
 private source(p:string,type:ContextReference['resourceType'],id:string,revision:number,title:string,raw:Record<string,unknown>,reason:string):ContextReference {
  let data=raw,range:ContextReference['range']=null,excerpt=false;
  if(Buffer.byteLength(JSON.stringify(raw))>12000){const original=type==='scene'?canonicalDocumentStats(raw.content as import('@storymaster/domain').RichDocument).text:JSON.stringify(raw),text=Array.from(original).slice(0,1800).join('');data={id,projectId:p,revision,title,...(raw.typeKey?{typeKey:raw.typeKey}:{}),text};range={from:0,to:text.length,unit:'utf16_text'};excerpt=true;}
  return {id:randomUUID(),projectId:p,resourceType:type,resourceId:id,revision,contentHash:fingerprint(data),selectionReason:reason,title,range,excerpt,data};
 }
 async build(a:Actor,p:string,input:AIContextInput,maxBytes:number){return withProject(this.db,a,p,'narrative.read',async(tx,project)=>{
  const {editorial,narrative}=this.services(tx),sources:ContextReference[]=[],warnings:string[]=[],seen=new Set<string>();let bytes=0;
  const add=(source:ContextReference)=>{const key=source.resourceType+'/'+source.resourceId;if(seen.has(key))return;const size=Buffer.byteLength(JSON.stringify(source));if(sources.length>=24||bytes+size>maxBytes){warnings.push('Certaines ressources associées ne sont pas incluses : budget de contexte atteint.');return;}seen.add(key);bytes+=size;sources.push(source);if(source.excerpt)warnings.push('« '+source.title+' » est un extrait ; le texte complet n’est pas transmis.');};
  add(this.source(p,'project',p,project.revision,project.name,{id:p,projectId:p,name:project.name,description:project.description,language:project.language,status:project.status,revision:project.revision},'Projet choisi explicitement'));
  const outline=await editorial.outline(a,p),parents=(chapterId:string)=>{for(const m of outline.manuscripts){const chapter=m.chapters.find(c=>c.id===chapterId);if(chapter){const {chapters,...manuscript}=m,{scenes,...c}=chapter;void chapters;void scenes;add(this.source(p,'manuscript',m.id,m.revision,m.title,jsonRecord(manuscript),'Manuscrit parent de la scène sélectionnée'));add(this.source(p,'chapter',c.id,c.structureRevision,c.title,jsonRecord(c),'Chapitre parent ; révision structurelle'));}}};
  const objectQueue:{id:string;reason:string}[]=[],sceneQueue:{id:string;reason:string}[]=[];
  if(input.selection.sceneId)sceneQueue.push({id:input.selection.sceneId,reason:'Scène choisie explicitement'});
  if(input.selection.objectId)objectQueue.push({id:input.selection.objectId,reason:'Fiche choisie explicitement'});
  const query=input.selection.searchQuery.trim()||input.message.trim().split(/\s+/).slice(0,5).join(' ').slice(0,150);
  if(query){const result=await narrative.search(a,p,{q:query,limit:5,status:'active'});for(const hit of result.items){if(hit.resourceType==='scene')sceneQueue.push({id:hit.resourceId,reason:'Recherche lexicale : '+query});else objectQueue.push({id:hit.resourceId,reason:'Recherche lexicale : '+query});}}
  for(let i=0;i<sceneQueue.length&&i<4;i++){const selected=sceneQueue[i]!;if(seen.has('scene/'+selected.id))continue;await tx.editorial.lockScene(p,selected.id,'shared');const scene=await editorial.getScene(a,p,selected.id);add(this.source(p,'scene',scene.id,scene.revision,scene.title,jsonRecord(scene),selected.reason));parents(scene.chapterId);if(input.selection.includeRelated)for(const ref of scene.references)objectQueue.push({id:ref.objectId,reason:'Repère structuré de « '+scene.title+' »'});}
  for(let i=0;i<objectQueue.length&&i<12;i++){const selected=objectQueue[i]!;if(seen.has('object/'+selected.id))continue;const object=await narrative.getObject(a,p,selected.id);add(this.source(p,'object',object.id,object.revision,object.name,jsonRecord(object),selected.reason));if(input.selection.includeRelated){const detail=await narrative.detail(a,p,object.id);for(const r of detail.relations.slice(0,6)){add(this.source(p,'relation',r.id,r.revision,r.relationType,jsonRecord(r),'Relation de « '+object.name+' »'));for(const id of [r.sourceObjectId,r.targetObjectId])if(id!==object.id)objectQueue.push({id,reason:'Extrémité liée à « '+object.name+' »'});}if(input.selection.objectId===object.id)for(const ref of detail.references.slice(0,2)){if(!seen.has('scene/'+ref.scene.id)){await tx.editorial.lockScene(p,ref.scene.id,'shared');const s=await editorial.getScene(a,p,ref.scene.id);add(this.source(p,'scene',s.id,s.revision,s.title,jsonRecord(s),'Scène référençant la fiche sélectionnée'));parents(s.chapterId);}}if(detail.parent)objectQueue.push({id:detail.parent.id,reason:'Lieu parent'});const refs=(object.attributes as {conditionEventRefs?:{id:string}[]}).conditionEventRefs??[];for(const ref of refs)objectQueue.push({id:ref.id,reason:'Événement référencé par la fiche'});}}
  for(const module of (await narrative.modules(a,p)).activations){const {updatedAt,...data}=module;void updatedAt;add(this.source(p,'module',module.id,module.revision,module.moduleKey,jsonRecord(data),'État du module nécessaire à la validation des propositions'));}
  return {sources,bytes,warnings:[...new Set(warnings)]};
 });}
 async revalidate(a:Actor,p:string,sources:ContextReference[]){return withProject(this.db,a,p,'narrative.read',async tx=>{const {editorial,narrative}=this.services(tx),outline=await editorial.outline(a,p),modules=(await narrative.modules(a,p)).activations;for(const source of sources){let revision:number|undefined;
   if(source.resourceType==='proposal'){if(fingerprint(source.data)!==source.contentHash)throw new AppError('AI_CONTEXT_STALE','Intention sélectionnée incohérente.',409);continue;}
   else if(source.resourceType==='scene'){await tx.editorial.lockScene(p,source.resourceId,'shared');revision=(await editorial.getScene(a,p,source.resourceId)).revision;}
   else if(source.resourceType==='object')revision=(await narrative.getObject(a,p,source.resourceId)).revision;
   else if(source.resourceType==='module')revision=modules.find(m=>m.id===source.resourceId)?.revision;
   else if(source.resourceType==='manuscript')revision=outline.manuscripts.find(m=>m.id===source.resourceId)?.revision;
   else if(source.resourceType==='chapter')revision=outline.manuscripts.flatMap(m=>m.chapters).find(c=>c.id===source.resourceId)?.structureRevision;
   else if(source.resourceType==='relation'){const endpoint=String(source.data.sourceObjectId),rows=await narrative.relationList(a,p,endpoint,100);revision=rows.items.find(r=>r.id===source.resourceId)?.revision;}
   else revision=(await tx.getProject(a.userId,p))?.revision;
   if(revision!==source.revision||fingerprint(source.data)!==source.contentHash)throw new AppError('AI_CONTEXT_STALE','Une source a changé. Préparez et confirmez un nouveau contexte.',409);
  }});}
}
