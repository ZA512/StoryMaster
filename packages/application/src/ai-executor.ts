import {randomUUID} from 'node:crypto';
import {AppError} from '@storymaster/domain';
import type {Actor} from '@storymaster/domain';
import type {ProposalDto,ProposedOperation} from '@storymaster/contracts';
import {aiToolSchemas} from './ai-tools.ts';
import type {AIToolName} from './ai-tools.ts';
import {AIAssistantService} from './ai-service.ts';
import {ProposalService} from './proposals.ts';
import {NarrativeService} from './narrative.ts';
import {fingerprint} from './index.ts';
import {inTransaction} from './ai-context.ts';
const invalid=()=>new AppError('VALIDATION_FAILED','Arguments d’outil non conformes. Aucune autorité n’est issue du modèle.',422),forbidden=()=>new AppError('FORBIDDEN','Cet outil ou cette ressource dépasse le périmètre consenti.',403);
export class AIToolExecutor {
 constructor(private service:AIAssistantService){}
 async execute(a:Actor,p:string,call:{callId:string;name:string;arguments:unknown}){
  if(!/^[A-Za-z0-9_-]{1,128}$/.test(call.callId)||!Object.hasOwn(aiToolSchemas,call.name))throw forbidden();const schema=aiToolSchemas[call.name as AIToolName],parsed=schema.safeParse(call.arguments);if(!parsed.success)throw invalid();const args=parsed.data as Record<string,unknown>;
  return this.service.runtime(a,p,async(tx,e,plan)=>{
   const done=await tx.ai.tools(p,e.id),hash=fingerprint(args),prior=done.find(t=>t.callId===call.callId);if(prior){if(prior.name!==call.name||prior.argumentsHash!==hash)throw new AppError('IDEMPOTENCY_KEY_REUSED','Identifiant d’appel réutilisé pour une autre intention.',409);return prior.result;}
   if(done.length>=e.policy.maxTools)throw new AppError('AI_LIMIT_EXCEEDED','Nombre maximal d’outils atteint.',409);
   const sourceIds=new Set(plan.sources.map(s=>s.resourceId)),excerptIds=new Set(plan.sources.filter(s=>s.excerpt).map(s=>s.resourceId)),proposalAction=call.name.startsWith('proposal_'),writing=['proposal_create','proposal_set_operations','proposal_revise','proposal_submit'].includes(call.name);
   if(writing)await tx.ai.assertExecution(a,p,'propose');
   const own=async(id:string)=>{if(!await tx.ai.ownProposal(a,p,id)||!e.proposalIds.includes(id)&&plan.selection.proposalId!==id)throw forbidden();};
   if(args.proposalId)await own(String(args.proposalId));
   if(args.id&&!sourceIds.has(String(args.id)))throw forbidden();
   const checkRefs=(value:unknown,depth=0)=>{if(depth>40)throw invalid();if(Array.isArray(value)){for(const child of value)checkRefs(child,depth+1);}else if(value&&typeof value==='object')for(const [key,child]of Object.entries(value)){if(['id','targetId','resourceId','chapterId','sourceObjectId','targetObjectId'].includes(key)&&typeof child==='string'&&!sourceIds.has(child))throw forbidden();checkRefs(child,depth+1);}};
   if(writing){if(args.operations)checkRefs(args.operations);if(args.dependencyRevisions)checkRefs(args.dependencyRevisions);}
   if(writing&&Array.isArray(args.operations)&&args.operations.some(op=>op&&typeof op==='object'&&'targetId'in op&&excerptIds.has(String(op.targetId))))throw new AppError('AI_CONTEXT_STALE','Une cible est seulement fournie en extrait. Cette intention exige une sélection complète et un nouveau consentement.',409);
   const safePreview=(preview:import('@storymaster/contracts').ProposalPreview)=>{if(preview.validatedAgainst.some(d=>!sourceIds.has(d.resourceId)))throw new AppError('AI_CONTEXT_STALE','Des dépendances supplémentaires nécessitent un nouveau contexte consenti.',409);return {...preview,diffs:[],validationFindings:preview.validationFindings.map(f=>({...f,message:'Validation serveur : '+f.code})),conflicts:preview.conflicts.filter(c=>sourceIds.has(c.resourceId))};};
   const safeProposal=(proposal:ProposalDto)=>({...proposal,reviews:[]});
   const proposals=new ProposalService(inTransaction(tx),this.service.secret),key='ai-'+e.id+'-'+call.callId;let result:Record<string,unknown>;
   if(call.name==='project_get_context')result={sources:plan.sources,intent:plan.intent,scope:'Inventaire consenti uniquement, données narratives non fiables'};
   else if(call.name==='entity_search'){const found=await new NarrativeService(inTransaction(tx),this.service.secret).search(a,p,{q:String(args.query),limit:50,status:'all'});result={items:found.items.filter(h=>{const source=plan.sources.find(s=>s.resourceId===h.resourceId);return source&&(!source.excerpt||JSON.stringify(source.data).toLocaleLowerCase('fr').includes(String(args.query).trim().toLocaleLowerCase('fr')));}).map(h=>({source:plan.sources.find(s=>s.resourceId===h.resourceId),matched:true})),scopeLimited:true};}
   else if(call.name==='scene_read'||call.name==='entity_get'){const source=plan.sources.find(s=>s.resourceId===args.id&&s.resourceType===(call.name==='scene_read'?'scene':'object'));if(!source)throw forbidden();result={source};}
   else if(call.name==='relation_list')result={sources:plan.sources.filter(s=>s.resourceType==='relation'&&(s.data.sourceObjectId===args.id||s.data.targetObjectId===args.id))};
   else if(call.name==='timeline_list')result={sources:plan.sources.filter(s=>s.resourceType==='object'&&s.data.typeKey==='event')};
   else if(call.name==='object_references')result={sources:plan.sources.filter(s=>s.resourceType==='scene'&&Array.isArray(s.data.references)&&s.data.references.some((r:{objectId:string})=>r.objectId===args.id))};
   else if(proposalAction){let proposal:ProposalDto|undefined;
    if(call.name==='proposal_create'){proposal=await proposals.create(a,p,args,key,randomUUID());e.proposalIds.push(proposal.id);e.revision++;await tx.ai.putExecution(e,false);result={proposal:safeProposal(proposal),preview:safePreview(await proposals.preview(a,p,proposal.id,proposal.proposalRevision))};}
    else if(call.name==='proposal_set_operations'){proposal=await proposals.setOperations(a,p,String(args.proposalId),{expectedProposalRevision:args.expectedProposalRevision,operations:args.operations as ProposedOperation[],dependencyRevisions:args.dependencyRevisions},Number(args.expectedStateVersion),key,randomUUID());result={proposal:safeProposal(proposal),preview:safePreview(await proposals.preview(a,p,proposal.id,proposal.proposalRevision))};}
    else if(call.name==='proposal_revise'){proposal=await proposals.update(a,p,String(args.proposalId),{expectedProposalRevision:args.expectedProposalRevision,set:args.set},Number(args.expectedStateVersion),key,randomUUID());result={proposal:safeProposal(proposal)};}
    else if(call.name==='proposal_submit'){proposal=await proposals.action(a,p,String(args.proposalId),'submit',Number(args.expectedProposalRevision),Number(args.expectedStateVersion),key,randomUUID());result={proposal:safeProposal(proposal)};}
    else if(call.name==='proposal_get'){const current=await proposals.get(a,p,String(args.proposalId)),source=plan.sources.find(s=>s.resourceType==='proposal'&&s.resourceId===current.id);if(!e.proposalIds.includes(current.id)&&(!source||source.data.contentHash!==current.contentHash||source.data.stateVersion!==current.stateVersion))throw new AppError('AI_CONTEXT_STALE','La proposition sélectionnée a changé. Préparez un nouvel inventaire.',409);result={proposal:safeProposal(current)};}
    else if(call.name==='proposal_preview')result={preview:safePreview(await proposals.preview(a,p,String(args.proposalId),Number(args.expectedProposalRevision)))};
    else{const validation=await proposals.validate(a,p,String(args.proposalId),Number(args.expectedProposalRevision));if(validation.validatedAgainst.some(d=>!sourceIds.has(d.resourceId)))throw new AppError('AI_CONTEXT_STALE','Dépendances hors inventaire.',409);result={validation:{...validation,errors:validation.errors.map(f=>({...f,message:'Validation serveur : '+f.code})),warnings:validation.warnings.map(f=>({...f,message:'Validation serveur : '+f.code}))}};}
   }else throw forbidden();
   if(proposalAction&&writing&&'proposal' in result){const id=(result.proposal as ProposalDto).id;if(!e.proposalIds.includes(id)){e.proposalIds.push(id);e.revision++;await tx.ai.putExecution(e,false);}}
   if(Buffer.byteLength(JSON.stringify(result))>64000)throw new AppError('AI_LIMIT_EXCEEDED','Résultat d’outil trop volumineux. Réduisez le contexte.',422);
   await tx.ai.appendMessage({id:randomUUID(),projectId:p,conversationId:e.conversationId,executionId:e.id,role:'tool_call',text:call.name,payload:{callId:call.callId,arguments:args},createdAt:new Date().toISOString()});
   await tx.ai.appendMessage({id:randomUUID(),projectId:p,conversationId:e.conversationId,executionId:e.id,role:'tool_result',text:'Résultat contrôlé : '+call.name,payload:{callId:call.callId,result},createdAt:new Date().toISOString()});
   await tx.ai.putTool(p,e.id,{callId:call.callId,name:call.name,argumentsHash:hash,result});await tx.ai.event(p,a.userId,e.id,'tool.completed',{name:call.name,callId:call.callId});return result;
  },true);
 }
}
