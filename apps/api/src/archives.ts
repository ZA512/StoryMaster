import type {FastifyInstance,FastifyRequest} from 'fastify';
import type {Actor} from '@storymaster/domain';
import type {ArchiveService} from '@storymaster/application';
import {emptyBodySchema} from '@storymaster/contracts';
interface Helpers{actor:(r:FastifyRequest)=>Actor;key:(r:FastifyRequest,required?:boolean)=>string|undefined;expected:(r:FastifyRequest)=>number}
export async function registerArchives(app:FastifyInstance,service:ArchiveService,h:Helpers){
 const base='/api/v1/projects/:projectId/exports';type Params={projectId:string;jobId:string};
 app.post<{Params:Params}>(base,async(r,reply)=>{emptyBodySchema.parse(r.body);const data=await service.request(h.actor(r),r.params.projectId,h.key(r)!,r.id);reply.code(202).header('ETag',`"r${data.revision}"`);return {data};});
 app.get<{Params:Params}>(base,async r=>({data:await service.list(h.actor(r),r.params.projectId)}));
 app.get<{Params:Params}>(base+'/:jobId',async(r,reply)=>{const data=await service.get(h.actor(r),r.params.projectId,r.params.jobId);reply.header('ETag',`"r${data.revision}"`);return {data};});
 app.post<{Params:Params}>(base+'/:jobId/cancel',async(r,reply)=>{emptyBodySchema.parse(r.body);const data=await service.cancel(h.actor(r),r.params.projectId,r.params.jobId,h.expected(r),r.id);reply.header('ETag',`"r${data.revision}"`);return {data};});
 app.get<{Params:Params}>(base+'/:jobId/download',async(r,reply)=>{const data=await service.download(h.actor(r),r.params.projectId,r.params.jobId);return reply.type('application/zip').header('Content-Disposition',`attachment; filename="${data.filename}"`).send(data.bytes);});
}
