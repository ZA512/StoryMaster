import type {FastifyInstance,FastifyRequest} from 'fastify';
import type {Actor} from '@storymaster/domain';
import type {DelegationService} from '@storymaster/application';
import {emptyBodySchema} from '@storymaster/contracts';
import {z} from 'zod';
interface Helpers{actor:(r:FastifyRequest)=>Actor;expected:(r:FastifyRequest)=>number;key:(r:FastifyRequest,required?:boolean)=>string|undefined}
export function registerDelegations(app:FastifyInstance,s:DelegationService,h:Helpers){const base='/api/v1/delegations',page=z.object({limit:z.coerce.number().int().min(1).max(50).default(20),beforeId:z.uuid().optional()}).strict(),events=z.object({limit:z.coerce.number().int().min(1).max(50).default(20),beforeRevision:z.coerce.number().int().positive().optional()}).strict();
 app.get('/api/v1/external-clients',async r=>({data:await s.clients(h.actor(r))}));
 app.get(base,async r=>{const q=page.parse(r.query);return {data:await s.list(h.actor(r),q.limit,q.beforeId)};});
 app.post(base,async(r,reply)=>{const data=await s.create(h.actor(r),r.body,h.key(r)!,r.id);reply.code(201).header('ETag',`"r${data.revision}"`);return {data};});
 app.get<{Params:{id:string}}>(base+'/:id',async(r,reply)=>{const data=await s.get(h.actor(r),r.params.id);reply.header('ETag',`"r${data.revision}"`);return {data};});
 app.put<{Params:{id:string}}>(base+'/:id',async(r,reply)=>{const data=await s.update(h.actor(r),r.params.id,r.body,h.expected(r),h.key(r)!,r.id);reply.header('ETag',`"r${data.revision}"`);return {data};});
 app.post<{Params:{id:string}}>(base+'/:id/revoke',async(r,reply)=>{emptyBodySchema.parse(r.body);const data=await s.revoke(h.actor(r),r.params.id,h.expected(r),h.key(r)!,r.id);reply.header('ETag',`"r${data.revision}"`);return {data};});
 app.get<{Params:{id:string}}>(base+'/:id/events',async r=>{const q=events.parse(r.query);return {data:await s.history(h.actor(r),r.params.id,q.limit,q.beforeRevision)};});
}
