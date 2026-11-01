import {AppError,narrativePermitted,notFound} from '@storymaster/domain';
import type {Actor,NarrativePermission,ProjectWithRole} from '@storymaster/domain';
import type {Transaction,UnitOfWork} from './index.ts';
export function checkResourceId(id:string){if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id))throw notFound();}
export function withProject<T>(db:UnitOfWork,actor:Actor,projectId:string,permission:NarrativePermission,work:(tx:Transaction,project:ProjectWithRole)=>Promise<T>,mode?:'exclusive'|'shared'):Promise<T>{
 checkResourceId(projectId);if(actor.type!=='human'&&!(actor.type==='integrated_ai'&&permission==='narrative.read'&&actor.executionId&&actor.aiCapability)&&!(actor.type==='external_ai'&&permission==='narrative.read'&&actor.externalAuthorizationId&&actor.externalCapability))throw new AppError('FORBIDDEN','Cette opération est réservée aux humains autorisés.',403);
 const write=['narrative.write','narrative.archive','project.admin','comment.write'].includes(permission);
 return db.transaction(async tx=>{if(!await tx.getProject(actor.userId,projectId))throw notFound();await tx.lockProject(projectId,mode??(write?'exclusive':'shared'));await tx.assertActor(actor);if(actor.type==='integrated_ai')await tx.ai.assertExecution(actor,projectId,'read');if(actor.type==='external_ai')await tx.mcp.assertGrant(actor,projectId,'project:read');
  const project=await tx.getProject(actor.userId,projectId);if(!project)throw notFound();if(!narrativePermitted(project.role,permission,actor.type))throw new AppError('FORBIDDEN','Vos droits ne permettent pas cette opération.',403);
  if(write&&project.status!=='active')throw new AppError('INVALID_STATE_TRANSITION','Ce projet est archivé.',409);return work(tx,project);
 });
}
