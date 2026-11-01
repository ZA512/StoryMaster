import type {FastifyInstance,FastifyRequest} from 'fastify';
import {z} from 'zod';
import type {Actor} from '@storymaster/domain';
import type {AIAssistantService} from '@storymaster/application';
import {emptyBodySchema} from '@storymaster/contracts';
interface Helpers {actor:(r:FastifyRequest)=>Actor;key:(r:FastifyRequest,required?:boolean)=>string|undefined;expected:(r:FastifyRequest)=>number}
export async function registerAI(app:FastifyInstance,service:AIAssistantService,h:Helpers){
 interface Params {projectId:string;credentialId:string;conversationId:string;executionId:string}
 const base='/api/v1/projects/:projectId/ai',credentials=base+'/credentials',conversations=base+'/conversations',one=conversations+'/:conversationId';
 const page=z.strictObject({limit:z.coerce.number().int().min(1).max(50).default(20),beforeId:z.string().uuid().optional()}),messages=z.strictObject({beforeSequence:z.coerce.number().int().positive().optional()});
 app.get<{Params:Params}>(base+'/config',async r=>({data:await service.config(h.actor(r),r.params.projectId)}));
 app.get<{Params:Params}>(credentials,async r=>({data:await service.credentials(h.actor(r),r.params.projectId)}));
 app.post<{Params:Params}>(credentials,async(r,reply)=>{const data=await service.createCredential(h.actor(r),r.params.projectId,r.body,h.key(r)!,r.id);reply.code(201);return {data};});
 for(const action of ['replace','revoke','rewrap'] as const)app.post<{Params:Params}>(credentials+'/:credentialId/'+action,async r=>{if(action!=='replace')emptyBodySchema.parse(r.body);return {data:await service.changeCredential(h.actor(r),r.params.projectId,r.params.credentialId,action,r.body,h.expected(r),h.key(r)!,r.id)};});
 app.get<{Params:Params}>(conversations,async r=>{const q=page.parse(r.query);return {data:await service.conversations(h.actor(r),r.params.projectId,q.limit,q.beforeId)};});
 app.post<{Params:Params}>(conversations,async(r,reply)=>{const data=await service.createConversation(h.actor(r),r.params.projectId,r.body,h.key(r)!,r.id);reply.code(201);return {data};});
 app.get<{Params:Params}>(one,async r=>({data:await service.detail(h.actor(r),r.params.projectId,r.params.conversationId,messages.parse(r.query).beforeSequence)}));
 for(const action of ['close','retention','revoke_consent'] as const)app.post<{Params:Params}>(one+'/'+action,async r=>{if(action!=='retention')emptyBodySchema.parse(r.body);return {data:await service.configureConversation(h.actor(r),r.params.projectId,r.params.conversationId,action,r.body,h.expected(r),h.key(r)!,r.id)};});
 app.post<{Params:Params}>(one+'/context',async r=>({data:await service.prepareContext(h.actor(r),r.params.projectId,r.params.conversationId,r.body,h.expected(r),h.key(r)!,r.id)}));
 app.post<{Params:Params}>(one+'/messages',async(r,reply)=>{const data=await service.enqueue(h.actor(r),r.params.projectId,r.params.conversationId,r.body,h.expected(r),h.key(r)!,r.id);reply.code(202);return {data};});
 app.get<{Params:Params}>(base+'/executions/:executionId',async r=>({data:await service.getExecution(h.actor(r),r.params.projectId,r.params.executionId)}));
 app.get<{Params:Params}>(base+'/executions/:executionId/sources',async r=>({data:await service.sources(h.actor(r),r.params.projectId,r.params.executionId)}));
 app.post<{Params:Params}>(base+'/executions/:executionId/cancel',async r=>{emptyBodySchema.parse(r.body);return {data:await service.cancel(h.actor(r),r.params.projectId,r.params.executionId,h.expected(r),h.key(r)!,r.id)};});
 app.get<{Params:Params}>(base+'/budget',async r=>({data:await service.budget(h.actor(r),r.params.projectId)}));
 app.put<{Params:Params}>(base+'/budget',async r=>({data:await service.configureBudget(h.actor(r),r.params.projectId,r.body,h.expected(r),h.key(r)!,r.id)}));
}
