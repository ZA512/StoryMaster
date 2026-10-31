import type {FastifyInstance,FastifyRequest} from 'fastify';
import {z} from 'zod';
import type {Actor} from '@storymaster/domain';
import type {NarrativeService,EditorialService} from '@storymaster/application';
import {createNarrativeSchema,updateNarrativeSchema,narrativeArchiveSchema,narrativeRestoreSchema,createNarrativeRelationSchema,updateNarrativeRelationSchema,relationDependenciesSchema,restoreRelationSchema,moduleUpdateSchema,moduleKeySchema,sceneReferencesSchema,searchNarrativeSchema,listNarrativeSchema,narrativePageSchema,timelineQuerySchema,revisionQuerySchema} from '@storymaster/contracts';
interface Helpers{actor:(r:FastifyRequest)=>Actor;key:(r:FastifyRequest,required?:boolean)=>string|undefined;expected:(r:FastifyRequest)=>number}
interface Params{projectId:string;objectId?:string;relationId?:string;sceneId?:string;moduleKey?:string;activationId?:string;revision?:string}
const version=z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER);
export async function registerNarrative(app:FastifyInstance,service:NarrativeService,editorial:EditorialService,h:Helpers){
 const base='/api/v1/projects/:projectId',object=base+'/objects/:objectId',relation=base+'/relations/:relationId';
 app.get<{Params:Params}>(base+'/objects',async r=>({data:await service.listObjects(h.actor(r),r.params.projectId,listNarrativeSchema.parse(r.query))}));
 app.post<{Params:Params}>(base+'/objects',{bodyLimit:512*1024},async(r,reply)=>{const data=await service.createObject(h.actor(r),r.params.projectId,createNarrativeSchema.parse(r.body),h.key(r)!,r.id);reply.code(201).header('ETag',`"r${data.revision}"`);return {data};});
 app.get<{Params:Params}>(object,async(r,reply)=>{const q=z.strictObject({revision:version.optional()}).parse(r.query),data=await service.getObject(h.actor(r),r.params.projectId,r.params.objectId!,q.revision);reply.header('ETag',`"r${data.revision}"`);return {data};});
 app.get<{Params:Params}>(object+'/detail',async r=>({data:await service.detail(h.actor(r),r.params.projectId,r.params.objectId!)}));
 app.patch<{Params:Params}>(object,{bodyLimit:512*1024},async(r,reply)=>{const data=await service.updateObject(h.actor(r),r.params.projectId,r.params.objectId!,updateNarrativeSchema.parse(r.body),h.expected(r),h.key(r)!,r.id);reply.header('ETag',`"r${data.revision}"`);return {data};});
 app.post<{Params:Params}>(object+'/archive',async r=>({data:await service.archiveObject(h.actor(r),r.params.projectId,r.params.objectId!,narrativeArchiveSchema.parse(r.body).archived,h.expected(r),h.key(r)!,r.id)}));
 app.post<{Params:Params}>(object+'/restore',async r=>({data:await service.restoreObject(h.actor(r),r.params.projectId,r.params.objectId!,narrativeRestoreSchema.parse(r.body).sourceRevision,h.expected(r),h.key(r)!,r.id)}));
 app.get<{Params:Params}>(object+'/references',async r=>{const q=narrativePageSchema.parse(r.query);return {data:await service.inverseReferences(h.actor(r),r.params.projectId,r.params.objectId!,q.limit,q.cursor)};});
 app.get<{Params:Params}>(object+'/relations',async r=>{const q=narrativePageSchema.parse(r.query);return {data:await service.relationList(h.actor(r),r.params.projectId,r.params.objectId!,q.limit,q.cursor)};});
 for(const [path,kind]of [[object,'object'],[relation,'relation'],[base+'/module-activations/:activationId','module']] as const){
  const resource=(p:Params)=>kind==='object'?p.objectId!:kind==='relation'?p.relationId!:p.activationId!;
  app.get<{Params:Params}>(path+'/revisions',async r=>{const q=revisionQuerySchema.parse(r.query);return {data:await service.history(h.actor(r),r.params.projectId,kind,resource(r.params),q.limit,q.beforeRevision)};});
  app.get<{Params:Params}>(path+'/revisions/:revision',async r=>({data:await service.revision(h.actor(r),r.params.projectId,kind,resource(r.params),version.parse(r.params.revision))}));
 }
 app.post<{Params:Params}>(base+'/relations',async(r,reply)=>{const data=await service.createRelation(h.actor(r),r.params.projectId,createNarrativeRelationSchema.parse(r.body),h.key(r)!,r.id);reply.code(201).header('ETag',`"r${data.revision}"`);return {data};});
 app.patch<{Params:Params}>(relation,async r=>({data:await service.updateRelation(h.actor(r),r.params.projectId,r.params.relationId!,updateNarrativeRelationSchema.parse(r.body),h.expected(r),h.key(r)!,r.id)}));
 app.delete<{Params:Params}>(relation,async r=>({data:await service.removeRelation(h.actor(r),r.params.projectId,r.params.relationId!,relationDependenciesSchema.parse(r.body).dependencyRevisions,h.expected(r),h.key(r)!,r.id)}));
 app.post<{Params:Params}>(relation+'/restore',async r=>{const q=restoreRelationSchema.parse(r.body);return {data:await service.removeRelation(h.actor(r),r.params.projectId,r.params.relationId!,q.dependencyRevisions,h.expected(r),h.key(r)!,r.id,q.sourceRevision??'current')};});
 app.get<{Params:Params}>(base+'/modules',async r=>({data:await service.modules(h.actor(r),r.params.projectId)}));
 app.patch<{Params:Params}>(base+'/modules/:moduleKey',async r=>{const q=moduleUpdateSchema.parse(r.body);return {data:await service.setModule(h.actor(r),r.params.projectId,moduleKeySchema.parse(r.params.moduleKey),q.enabled,h.expected(r),h.key(r)!,r.id)};});
 app.get<{Params:Params}>(base+'/scenes/:sceneId/references',async r=>({data:await service.sceneReferences(h.actor(r),r.params.projectId,r.params.sceneId!)}));
 app.put<{Params:Params}>(base+'/scenes/:sceneId/references',{bodyLimit:256*1024},async(r,reply)=>{const data=await editorial.replaceReferences(h.actor(r),r.params.projectId,r.params.sceneId!,sceneReferencesSchema.parse(r.body),h.expected(r),h.key(r)!,r.id);reply.header('ETag',`"r${data.revision}"`);return {data};});
 app.get<{Params:Params}>(base+'/timeline',async r=>{const q=timelineQuerySchema.parse(r.query);return {data:await service.timeline(h.actor(r),r.params.projectId,q.status,q.limit,q.cursor)};});
 app.get<{Params:Params}>(base+'/search',async r=>({data:await service.search(h.actor(r),r.params.projectId,searchNarrativeSchema.parse(r.query))}));
 app.get<{Params:Params}>(base+'/narrative-export',async r=>({data:await service.export(h.actor(r),r.params.projectId)}));
}
