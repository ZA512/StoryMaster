import type { FastifyInstance,FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { Actor } from '@storymaster/domain';
import type { EditorialService } from '@storymaster/application';
import { createEditorialSchema,updateEditorialSchema,moveEditorialSchema,archiveEditorialSchema,saveSceneSchema,restoreSceneSchema,revisionQuerySchema,compareQuerySchema,exportQuerySchema } from '@storymaster/contracts';
interface Helpers {actor:(request:FastifyRequest)=>Actor;key:(request:FastifyRequest,required?:boolean)=>string|undefined;expected:(request:FastifyRequest)=>number}
interface Params {projectId:string;manuscriptId?:string;chapterId?:string;sceneId?:string;revision?:string}
export async function registerEditorial(app:FastifyInstance,service:EditorialService,h:Helpers){
 const base='/api/v1/projects/:projectId';
 app.get<{Params:Params}>(base+'/manuscripts',async(req,reply)=>{const data=await service.outline(h.actor(req),req.params.projectId);reply.header('ETag',`"e${data.revision}"`);return {data};});
 for(const [kind,plural,parent] of [['manuscript','manuscripts',base],['chapter','chapters',base+'/manuscripts/:manuscriptId'],['scene','scenes',base+'/chapters/:chapterId']] as const){
  app.post<{Params:Params}>(parent+'/'+plural,async(req,reply)=>{const input=createEditorialSchema.parse(req.body),p=req.params;
   const data=await service.create(h.actor(req),p.projectId,kind,kind==='manuscript'?p.projectId:kind==='chapter'?p.manuscriptId!:p.chapterId!,input,h.key(req)!,req.id);reply.code(201);return {data};});
  const path=base+'/'+plural+'/:'+kind+'Id',id=(p:Params)=>kind==='manuscript'?p.manuscriptId!:kind==='chapter'?p.chapterId!:p.sceneId!;
  app.patch<{Params:Params}>(path,async req=>({data:await service.update(h.actor(req),req.params.projectId,kind,id(req.params),updateEditorialSchema.parse(req.body),h.key(req)!,req.id)}));
  app.post<{Params:Params}>(path+'/move',async req=>({data:await service.move(h.actor(req),req.params.projectId,kind,id(req.params),moveEditorialSchema.parse(req.body),h.key(req)!,req.id)}));
  app.post<{Params:Params}>(path+'/archive',async req=>{const input=archiveEditorialSchema.parse(req.body);return {data:await service.archive(h.actor(req),req.params.projectId,kind,id(req.params),input.archived,input.expectedRevision,h.key(req)!,req.id)};});
 }
 const scene=base+'/scenes/:sceneId';
 app.get<{Params:Params}>(scene,async(req,reply)=>{const q=z.strictObject({revision:z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER).optional()}).parse(req.query),data=q.revision===undefined?await service.getScene(h.actor(req),req.params.projectId,req.params.sceneId!):await service.revision(h.actor(req),req.params.projectId,req.params.sceneId!,q.revision);reply.header('ETag',`"r${data.revision}"`);return {data};});
 app.put<{Params:Params}>(scene+'/content',{bodyLimit:2*1024*1024+4096},async(req,reply)=>{const input=saveSceneSchema.parse(req.body),data=await service.saveScene(h.actor(req),req.params.projectId,req.params.sceneId!,input.content,h.expected(req),h.key(req)!,req.id);reply.header('ETag',`"r${data.revision}"`);return {data};});
 app.get<{Params:Params}>(scene+'/revisions',async req=>{const query=revisionQuerySchema.parse(req.query);return {data:await service.history(h.actor(req),req.params.projectId,req.params.sceneId!,query.limit,query.beforeRevision)};});
 app.get<{Params:Params}>(scene+'/revisions/:revision',async req=>({data:await service.revision(h.actor(req),req.params.projectId,req.params.sceneId!,z.coerce.number().int().positive().parse(req.params.revision))}));
 app.get<{Params:Params}>(scene+'/compare',async req=>{const query=compareQuerySchema.parse(req.query);return {data:await service.compare(h.actor(req),req.params.projectId,req.params.sceneId!,query.from,query.to)};});
 app.post<{Params:Params}>(scene+'/restore',async(req,reply)=>{const input=restoreSceneSchema.parse(req.body),data=await service.restore(h.actor(req),req.params.projectId,req.params.sceneId!,input.sourceRevision,h.expected(req),h.key(req)!,req.id);reply.header('ETag',`"r${data.revision}"`);return {data};});
 app.get<{Params:Params}>(base+'/manuscripts/:manuscriptId/export',async req=>{const query=exportQuerySchema.parse(req.query);return {data:await service.export(h.actor(req),req.params.projectId,req.params.manuscriptId!,query.format)};});
}
