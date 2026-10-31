import {getNarrativeObject,checkDependencies,assertModuleEnabled,requireActive} from './narrative.ts';
import {withProject} from './project-access.ts';
import { randomUUID } from 'node:crypto';
import { AppError,notFound,referenceAccepts } from '@storymaster/domain';
import type { Actor,EditorialKind,EditorialNode,NarrativePermission,ProjectWithRole,RichDocument,SceneRevision,SceneReference,StoredSceneReference } from '@storymaster/domain';
import { normalizeDocument,emptyDocument,canonicalDocumentStats,DocumentError,fromDoc } from '@storymaster/editor';
import { markdownExport } from '@storymaster/editor/markdown';
import type { EditorialCreate,EditorialUpdate,EditorialMove,EditorialAck,EditorialOutline,EditorialItem,SceneDto,SceneSaveAck,RevisionPage,EditorialExport,SceneReferencesInput } from '@storymaster/contracts';
import { fingerprint } from './index.ts';
import type { UnitOfWork,Transaction } from './index.ts';
const parentKind={manuscript:'project',chapter:'manuscript',scene:'chapter'} as const;
const defaults=['Brouillon','En cours','À relire','Terminé'];
const invalid=(message:string)=>new AppError('VALIDATION_FAILED',message,422);
function uuid(id:string){if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))throw notFound();}
function expected(actual:number,wanted:number){if(!Number.isSafeInteger(wanted)||wanted<1)throw invalid('Révision attendue invalide.');if(actual!==wanted)throw new AppError('REVISION_CONFLICT','Cette version a changé. Votre brouillon est conservé.',412,{currentRevision:actual,expectedRevision:wanted});}
const metadata=(n:EditorialNode)=>({title:n.title,summary:n.summary,status:n.status,archived:n.archived,parentId:n.parentId,writingStatuses:n.writingStatuses});
const item=(n:EditorialNode):EditorialItem=>{const rest={...n};delete rest.content;delete rest.contentHash;return rest;};
function document(value:unknown):RichDocument {try{return normalizeDocument(value);}catch(e){if(e instanceof DocumentError)throw new AppError('VALIDATION_FAILED',e.message,e.code==='DOCUMENT_TOO_LARGE' ? 413 : 422);throw e;}}
function sceneDto(n:EditorialNode,references:SceneReference[]=[]):SceneDto{return {id:n.id,projectId:n.projectId,chapterId:n.parentId,title:n.title,summary:n.summary,status:n.status,archived:n.archived,revision:n.revision,contentFormatVersion:1,content:document(n.content),contentHash:n.contentHash!,wordCount:n.wordCount,createdAt:n.createdAt,updatedAt:n.updatedAt,references};}
export class EditorialService {
 constructor(private db:UnitOfWork,private contentLock:'project'|'scene'='scene'){}
 private async context<T>(actor:Actor,projectId:string,permission:NarrativePermission,work:(tx:Transaction,project:ProjectWithRole)=>Promise<T>,contentOnly=false):Promise<T>{
  return withProject(this.db,actor,projectId,permission,work,(permission==='narrative.write'||permission==='narrative.archive')&&!(contentOnly&&this.contentLock==='scene')?'exclusive':'shared');
 }
 private async get(tx:Transaction,kind:EditorialKind,p:string,id:string){uuid(id);const n=await tx.editorial.get(kind,p,id);if(!n)throw notFound();return n;}
 private async parent(tx:Transaction,kind:EditorialKind,p:string,id:string){const k=parentKind[kind];if(k==='project'){if(id!==p)throw notFound();return {kind:k,id,structureRevision:(await tx.editorial.projectVersions(p)).structureRevision};}const n=await this.get(tx,k,p,id);await this.active(tx,n);return {kind:k,id,structureRevision:n.structureRevision};}
 private async active(tx:Transaction,n:EditorialNode){if(n.archived)throw new AppError('INVALID_STATE_TRANSITION','Cet élément est archivé.',409);if(n.kind==='chapter'){const m=await this.get(tx,'manuscript',n.projectId,n.parentId);await this.active(tx,m);}if(n.kind==='scene'){const c=await this.get(tx,'chapter',n.projectId,n.parentId);await this.active(tx,c);}}
 private async manuscript(tx:Transaction,n:EditorialNode){if(n.kind==='manuscript')return n;const chapter=n.kind==='chapter' ? n : await this.get(tx,'chapter',n.projectId,n.parentId);return this.get(tx,'manuscript',n.projectId,chapter.parentId);}
 private async replay<T>(tx:Transaction,actor:Actor,p:string,action:string,resource:string,key:string,input:unknown):Promise<{scope:string;hash:string;response:T|null}>{
  if(typeof key!=='string'||key.length<8||key.length>200)throw invalid('Clé d’idempotence invalide.');
  const scope=fingerprint([actor.userId,actor.type,actor.clientId??null,actor.grantId??null,p,action,resource]),hash=fingerprint(input);
  await tx.lockIdempotency(scope,key);const old=await tx.findIdempotency<T>(scope,key);
  if(old&&old.fingerprint!==hash)throw new AppError('IDEMPOTENCY_KEY_REUSED','Cette clé correspond à une autre demande.',409);
  return {scope,hash,response:old?.response??null};
 }
 private async record(tx:Transaction,actor:Actor,n:EditorialNode,action:string,correlationId:string,before:EditorialNode|null,details:Record<string,unknown>={},restored?:number){
  const id=randomUUID();await tx.editorial.change({id,projectId:n.projectId,resourceId:n.id,kind:n.kind,action,beforeRevision:before?.revision??null,afterRevision:n.revision,actor,correlationId,details:{before:before ? metadata(before) : null,after:metadata(n),...details}});
  if(n.kind==='scene')await tx.editorial.snapshot(n,actor,id,action,restored);
  await tx.audit({action,actor,projectId:n.projectId,resourceId:n.id,beforeRevision:before?.revision,afterRevision:n.revision,correlationId});
  await tx.editorial.touchProject(n.projectId,false);return id;
 }
 private async ack(tx:Transaction,n:EditorialNode):Promise<EditorialAck>{return {id:n.id,revision:n.revision,structureRevision:n.structureRevision,projectEditorialRevision:(await tx.editorial.projectVersions(n.projectId)).revision};}
 async outline(actor:Actor,p:string):Promise<EditorialOutline>{return this.context(actor,p,'narrative.read',async tx=>{
  const {nodes:rows,...versions}=await tx.editorial.view(p);
  const manuscripts=rows.filter(n=>n.kind==='manuscript').map(m=>{
   const chapters=rows.filter(n=>n.kind==='chapter'&&n.parentId===m.id).map(c=>{
    const scenes=rows.filter(n=>n.kind==='scene'&&n.parentId===c.id).map(item);return {...item(c),scenes,wordCount:c.archived ? 0 : scenes.filter(s=>!s.archived).reduce((sum,s)=>sum+s.wordCount,0)};
   });return {...item(m),chapters,wordCount:m.archived ? 0 : chapters.reduce((sum,c)=>sum+c.wordCount,0)};
  });return {projectId:p,revision:versions.revision,structureRevision:versions.structureRevision,manuscripts};
 });}
 async create(actor:Actor,p:string,kind:EditorialKind,parentId:string,input:EditorialCreate,key:string,corr:string){return this.context(actor,p,'narrative.write',async tx=>{
  if(kind!=='scene'&&input.status!==undefined)throw invalid('Le statut rédactionnel appartient à une scène.');
  const parent=await this.parent(tx,kind,p,parentId),replay=await this.replay<EditorialAck>(tx,actor,p,kind+'.create',parentId,key,input);if(replay.response)return replay.response;
  expected(parent.structureRevision,input.expectedStructureRevision);
  const siblings=await tx.editorial.children(kind,p,parentId),now=new Date().toISOString();
  const node:EditorialNode={id:randomUUID(),projectId:p,kind,parentId,title:input.title.trim(),summary:input.summary??'',status:input.status??'Brouillon',archived:false,position:siblings.length+1,revision:1,structureRevision:kind==='scene'?0:1,wordCount:0,writingStatuses:kind==='manuscript'?[...defaults]:[],createdAt:now,updatedAt:now};
  if(!node.title||node.title.length>200||/[\r\n]/.test(node.title)||node.summary.length>4000)throw invalid('Titre ou résumé invalide.');
  if(kind==='scene'){const m=await this.manuscript(tx,node);if(!m.writingStatuses.includes(node.status))throw invalid('Statut rédactionnel non disponible.');node.content=emptyDocument();node.contentHash=fingerprint(node.content);}else node.status='active';
  await tx.editorial.insert(node);await tx.editorial.bumpStructure(parent.kind,p,parent.id);await this.record(tx,actor,node,kind+'.created',corr,null,{parentId,order:[...siblings.map(n=>n.id),node.id]});
  const response=await this.ack(tx,node);await tx.saveIdempotency(replay.scope,key,replay.hash,response);return response;
 });}
 async update(actor:Actor,p:string,kind:EditorialKind,id:string,input:EditorialUpdate,key:string,corr:string){return this.context(actor,p,'narrative.write',async(tx,project)=>{
  const old=await this.get(tx,kind,p,id);await this.active(tx,old);
  const replay=await this.replay<EditorialAck>(tx,actor,p,kind+'.update',id,key,input);if(replay.response)return replay.response;expected(old.revision,input.expectedRevision);
  const set=input.set;
  if(set.writingStatuses!==undefined){if(kind!=='manuscript'||!['owner','admin'].includes(project.role))throw new AppError('FORBIDDEN','Seuls les responsables configurent les statuts du manuscrit.',403);
   if(!set.writingStatuses.length||set.writingStatuses.length>30||new Set(set.writingStatuses).size!==set.writingStatuses.length||set.writingStatuses.some(s=>!s.trim()||s.length>40))throw invalid('Statuts invalides.');
   const rows=await tx.editorial.all(p),chapters=new Set(rows.filter(n=>n.kind==='chapter'&&n.parentId===id).map(n=>n.id));if(rows.some(n=>n.kind==='scene'&&chapters.has(n.parentId)&&!set.writingStatuses!.includes(n.status)))throw new AppError('INVALID_STATE_TRANSITION','Un statut retiré est encore utilisé par une scène.',409);
  }
  if(set.status!==undefined){if(kind!=='scene')throw invalid('Le statut rédactionnel appartient à une scène.');const m=await this.manuscript(tx,old);if(!m.writingStatuses.includes(set.status))throw invalid('Statut rédactionnel inconnu.');}
  const next={...old,title:set.title?.trim()??old.title,summary:set.summary??old.summary,status:set.status??old.status,writingStatuses:set.writingStatuses??old.writingStatuses,revision:old.revision+1,updatedAt:new Date().toISOString()};
  if(!next.title||next.title.length>200||/[\r\n]/.test(next.title)||next.summary.length>4000)throw invalid('Titre ou résumé invalide.');
  await tx.editorial.update(next);await this.record(tx,actor,next,kind+'.updated',corr,old);const response=await this.ack(tx,next);await tx.saveIdempotency(replay.scope,key,replay.hash,response);return response;
 });}
 async archive(actor:Actor,p:string,kind:EditorialKind,id:string,archived:boolean,revision:number,key:string,corr:string){return this.context(actor,p,'narrative.archive',async tx=>{
  const old=await this.get(tx,kind,p,id),replay=await this.replay<EditorialAck>(tx,actor,p,kind+'.archive',id,key,{archived,revision});if(replay.response)return replay.response;expected(old.revision,revision);
  await this.parent(tx,kind,p,old.parentId);
  const next={...old,archived,status:kind==='scene'?old.status:archived?'archived':'active',revision:old.revision+1,updatedAt:new Date().toISOString()};
  await tx.editorial.update(next);await tx.editorial.bumpStructure(parentKind[kind],p,old.parentId);await this.record(tx,actor,next,kind+(archived?'.archived':'.reactivated'),corr,old);
  const response=await this.ack(tx,next);await tx.saveIdempotency(replay.scope,key,replay.hash,response);return response;
 });}
 async move(actor:Actor,p:string,kind:EditorialKind,id:string,input:EditorialMove,key:string,corr:string){return this.context(actor,p,'narrative.write',async tx=>{
  const old=await this.get(tx,kind,p,id);await this.active(tx,old);
  const source=await this.parent(tx,kind,p,old.parentId),target=await this.parent(tx,kind,p,input.targetParentId),replay=await this.replay<EditorialAck>(tx,actor,p,kind+'.move',id,key,input);if(replay.response)return replay.response;
  expected(old.revision,input.expectedRevision);expected(source.structureRevision,input.expectedSourceStructureRevision);expected(target.structureRevision,input.expectedTargetStructureRevision);
  if(input.beforeId===id)throw invalid('Un élément ne peut pas être placé devant lui-même.');
  const from=await tx.editorial.children(kind,p,old.parentId),destination=source.id===target.id?from:await tx.editorial.children(kind,p,target.id);
  const ids=destination.filter(n=>n.id!==id).map(n=>n.id),index=input.beforeId===null?ids.length:ids.indexOf(input.beforeId);if(index<0)throw notFound();ids.splice(index,0,id);
  const next={...old,parentId:target.id,position:index+1,revision:old.revision+1,updatedAt:new Date().toISOString()};
  if(kind==='scene'){const m=await this.manuscript(tx,next);next.status=input.targetStatus??old.status;if(!m.writingStatuses.includes(next.status))throw new AppError('INVALID_STATE_TRANSITION','Choisissez un statut disponible dans le manuscrit cible.',409);}
  if(kind==='chapter'&&source.id!==target.id){const m=await this.get(tx,'manuscript',p,target.id),scenes=await tx.editorial.children('scene',p,id);if(scenes.some(s=>!m.writingStatuses.includes(s.status)))throw new AppError('INVALID_STATE_TRANSITION','Les statuts des scènes doivent être disponibles dans le manuscrit cible.',409);}
  await tx.editorial.update(next);if(source.id!==target.id){await tx.editorial.reindex(kind,p,source.id,from.filter(n=>n.id!==id).map(n=>n.id));await tx.editorial.bumpStructure(source.kind,p,source.id);}
  await tx.editorial.reindex(kind,p,target.id,ids);await tx.editorial.bumpStructure(target.kind,p,target.id);
  await this.record(tx,actor,next,kind+'.moved',corr,old,{sourceParentId:source.id,targetParentId:target.id,sourceOrder:from.filter(n=>n.id!==id).map(n=>n.id),targetOrder:ids});
  const response=await this.ack(tx,next);await tx.saveIdempotency(replay.scope,key,replay.hash,response);return response;
 });}
 async getScene(actor:Actor,p:string,id:string):Promise<SceneDto>{return this.context(actor,p,'narrative.read',async tx=>sceneDto(await this.get(tx,'scene',p,id),await tx.narrative.references(p,id)));}
 async saveScene(actor:Actor,p:string,id:string,content:unknown,revision:number,key:string,corr:string):Promise<SceneSaveAck>{
  const normalized=document(content),hash=fingerprint(normalized),stats=canonicalDocumentStats(normalized),wordCount=stats.wordCount;
  return this.context(actor,p,'narrative.write',async tx=>{
   uuid(id);await tx.editorial.lockScene(p,id);const old=await this.get(tx,'scene',p,id);await this.active(tx,old);const replay=await this.replay<SceneSaveAck>(tx,actor,p,'scene.save',id,key,{content:normalized,revision});if(replay.response)return replay.response;expected(old.revision,revision);
   let next=old,changeSetId:string;
   if(old.contentHash===hash){const snapshot=await tx.editorial.revision(p,id,old.revision);changeSetId=snapshot!.changeSetId;}
   else {next={...old,content:normalized,contentHash:hash,wordCount,revision:old.revision+1,updatedAt:new Date().toISOString()};await tx.editorial.update(next,stats.text);changeSetId=await this.record(tx,actor,next,'scene.saved',corr,old);}
   const response={id,revision:next.revision,contentHash:next.contentHash!,wordCount:next.wordCount,updatedAt:next.updatedAt,changeSetId};await tx.saveIdempotency(replay.scope,key,replay.hash,response);return response;
  },true);
 }
 async replaceReferences(actor:Actor,p:string,id:string,input:SceneReferencesInput,revision:number,key:string,corr:string):Promise<SceneSaveAck>{return this.context(actor,p,'narrative.write',async tx=>{
  if(input.references.some(r=>Object.keys(r.metadata).length))throw new AppError('VALIDATION_FAILED','Métadonnées de référence non prises en charge.',422);
  uuid(id);await tx.editorial.lockScene(p,id);const old=await this.get(tx,'scene',p,id);await this.active(tx,old);const replay=await this.replay<SceneSaveAck>(tx,actor,p,'scene.references',id,key,{input,revision});if(replay.response)return replay.response;expected(old.revision,revision);
  const stored=await tx.narrative.storedReferences(p,id),active=stored.filter(r=>r.status==='active'),semantic=(r:SceneReference)=>r.objectId+'|'+r.referenceType,newKeys=input.references.map(r=>r.objectRef.id+'|'+r.referenceType);
  if(new Set(newKeys).size!==newKeys.length)throw invalid('Une référence apparaît plusieurs fois.');if(input.references.filter(r=>r.referenceType==='point_of_view').length>1)throw invalid('Une scène possède au plus un point de vue structuré.');
  await checkDependencies(tx,p,[...active.map(r=>r.objectId),...input.references.map(r=>r.objectRef.id)],input.dependencyRevisions);
  const removed=active.filter(r=>!newKeys.includes(semantic(r))),added=input.references.filter(r=>!active.some(a=>semantic(a)===r.objectRef.id+'|'+r.referenceType));
  for(const r of removed){const target=await getNarrativeObject(tx,p,r.objectId,true);await assertModuleEnabled(tx,p,target.typeKey);}
  for(const r of added){const target=await getNarrativeObject(tx,p,r.objectRef.id,true);await assertModuleEnabled(tx,p,target.typeKey);requireActive(target);if(!referenceAccepts(r.referenceType,target.typeKey))throw invalid('Le type de référence ne correspond pas à cette fiche.');}
  if(!removed.length&&!added.length){const snapshot=await tx.editorial.revision(p,id,old.revision),response={id,revision:old.revision,contentHash:old.contentHash!,wordCount:old.wordCount,updatedAt:old.updatedAt,changeSetId:snapshot!.changeSetId};await tx.saveIdempotency(replay.scope,key,replay.hash,response);return response;}
  // Retirer avant d’ajouter permet le changement atomique de POV sans violer l’unicité partielle.
  for(const r of removed)await tx.narrative.putReference({...r,status:'removed',revision:r.revision+1},false);
  for(const r of added){const previous=stored.find(a=>semantic(a)===r.objectRef.id+'|'+r.referenceType);const next:StoredSceneReference=previous?{...previous,status:'active',revision:previous.revision+1}:{id:randomUUID(),projectId:p,sceneId:id,objectId:r.objectRef.id,referenceType:r.referenceType,metadata:{},revision:1,status:'active'};await tx.narrative.putReference(next,!previous);}
  const next={...old,revision:old.revision+1,updatedAt:new Date().toISOString()};if(!await tx.editorial.advanceSceneRevision(p,id,next.revision,next.updatedAt))throw new AppError('REVISION_CONFLICT','La scène a changé.',412);
  const changeSetId=await this.record(tx,actor,next,'scene.references_updated',corr,old,{referenceIds:(await tx.narrative.references(p,id)).map(r=>r.id)}),response={id,revision:next.revision,contentHash:next.contentHash!,wordCount:next.wordCount,updatedAt:next.updatedAt,changeSetId};await tx.saveIdempotency(replay.scope,key,replay.hash,response);return response;
 });}
 async history(actor:Actor,p:string,id:string,limit=20,beforeRevision?:number):Promise<RevisionPage>{return this.context(actor,p,'narrative.read',async tx=>{
  await this.get(tx,'scene',p,id);const rows=await tx.editorial.revisions(p,id,limit+1,beforeRevision),items=rows.slice(0,limit).map(r=>({sceneId:r.sceneId,projectId:r.projectId,revision:r.revision,contentFormatVersion:r.contentFormatVersion,title:r.metadata.title,author:r.author,createdAt:r.createdAt,changeSetId:r.changeSetId,restoredFromRevision:r.restoredFromRevision,action:r.action}));return {items,hasMore:rows.length>limit,nextBeforeRevision:rows.length>limit?items.at(-1)!.revision:null};
 });}
 async revision(actor:Actor,p:string,id:string,revision:number):Promise<SceneRevision>{return this.context(actor,p,'narrative.read',async tx=>{await this.get(tx,'scene',p,id);const r=await tx.editorial.revision(p,id,revision);if(!r)throw notFound();return r;});}
 async compare(actor:Actor,p:string,id:string,from:number,to:number){return this.context(actor,p,'narrative.read',async tx=>{await this.get(tx,'scene',p,id);const before=await tx.editorial.revision(p,id,from),after=await tx.editorial.revision(p,id,to);if(!before||!after)throw notFound();return {before,after};});}
 async restore(actor:Actor,p:string,id:string,source:number,revision:number,key:string,corr:string){return this.context(actor,p,'narrative.write',async tx=>{
  uuid(id);await tx.editorial.lockScene(p,id);const old=await this.get(tx,'scene',p,id);await this.active(tx,old);const replay=await this.replay<SceneSaveAck>(tx,actor,p,'scene.restore',id,key,{source,revision});if(replay.response)return replay.response;expected(old.revision,revision);
  const snapshot=await tx.editorial.revision(p,id,source);if(!snapshot)throw notFound();const content=document(snapshot.content),stats=canonicalDocumentStats(content),next={...old,content,contentHash:fingerprint(content),wordCount:stats.wordCount,revision:old.revision+1,updatedAt:new Date().toISOString()};
  await tx.editorial.update(next,stats.text);const changeSetId=await this.record(tx,actor,next,'scene.restored',corr,old,{restoredFromRevision:source},source),response={id,revision:next.revision,contentHash:next.contentHash,wordCount:next.wordCount,updatedAt:next.updatedAt,changeSetId};await tx.saveIdempotency(replay.scope,key,replay.hash,response);return response;
 },true);}
 async export(actor:Actor,p:string,id:string,format:'markdown'|'json'):Promise<EditorialExport>{return this.context(actor,p,'export.create',async tx=>{
  const manuscript=await this.get(tx,'manuscript',p,id),view=await tx.editorial.view(p,id),chapters=view.nodes.filter(n=>n.kind==='chapter'),warnings:EditorialExport['warnings']=[],structure=[];
  let size=0;for(const chapter of chapters){const scenes=view.nodes.filter(n=>n.kind==='scene'&&n.parentId===chapter.id);for(const s of scenes){size+=Buffer.byteLength(JSON.stringify(s.content),'utf8');if(size>32*1024*1024)throw new AppError('VALIDATION_FAILED','Cet export direct dépasse la capacité technique de 32 Mio. Exportez des manuscrits plus petits.',413);}structure.push({...item(chapter),wordCount:chapter.archived?0:scenes.filter(s=>!s.archived).reduce((sum,s)=>sum+s.wordCount,0),scenes:await Promise.all(scenes.map(async s=>({...sceneDto(s,await tx.narrative.references(p,s.id)),position:s.position})))});}
  const editorial={format:'storymaster-editorial',formatVersion:1,exportedAt:new Date().toISOString(),projectId:p,includesArchived:true,historyIncluded:false,manuscript:{...item(manuscript),wordCount:manuscript.archived?0:structure.reduce((sum,c)=>sum+c.wordCount,0),chapters:structure}};
  let text:string;
  if(format==='json')text=JSON.stringify(editorial,null,2);
  else {const escape=(value:string)=>value.replace(/([\\`*_{}[\]<>#+.!|~-])/g,'\\$1');const parts=['# '+escape(manuscript.title)];for(const chapter of structure.filter(c=>!c.archived)){parts.push('## '+escape(chapter.title));for(const scene of chapter.scenes.filter(s=>!s.archived)){const result=markdownExport(fromDoc(scene.content));parts.push('### '+escape(scene.title),result.markdown);for(const loss of result.losses)warnings.push({sceneId:scene.id,title:scene.title,message:loss.message});}}text=parts.join('\n\n')+'\n';}
  return {format,filename:`manuscrit-${id}.${format==='json'?'json':'md'}`,mimeType:format==='json'?'application/json':'text/markdown',text,warnings};
 });}
}
