import {ProviderFailure} from '@storymaster/application';
import type {ProviderAdapter,ProviderRequest,ProviderResponse} from '@storymaster/application';
import type {ProposalDto,ProposalPreview,ProposedOperation} from '@storymaster/contracts';
import {canonicalDocumentStats} from '@storymaster/editor';
import type {RichDocument} from '@storymaster/domain';
export class LocalAIProvider implements ProviderAdapter {
 readonly id='local-simulator';readonly simulated=true;
 readonly capabilities={tools:true,structuredOutput:true,usage:true,cancellation:'best_effort' as const,timeout:'unknown_after_send' as const};
 async generate(r:ProviderRequest,credential:string,signal:AbortSignal):Promise<ProviderResponse>{
  if(!credential.startsWith('demo-storymaster-'))throw new ProviderFailure('before_send','unavailable');
  if(r.model==='unavailable-v1')throw new ProviderFailure('before_send','unavailable');
  if(r.model==='unknown-v1')throw new ProviderFailure('after_send','timeout');
  await new Promise<void>((resolve,reject)=>{if(signal.aborted){reject(new ProviderFailure('after_send','cancelled'));return;}const timer=setTimeout(done,r.model==='slow-v1'?15000:30);function done(){signal.removeEventListener('abort',abort);resolve();}function abort(){clearTimeout(timer);signal.removeEventListener('abort',abort);reject(new ProviderFailure('after_send','cancelled'));}signal.addEventListener('abort',abort,{once:true});});
  const response:ProviderResponse={text:'',citations:[],toolCalls:[],usage:{inputTokens:Math.ceil(JSON.stringify(r).length/4),outputTokens:128},providerRequestId:'simulated-'+r.executionId+'-'+r.results.length};
  const call=(callId:string,name:string,args:unknown)=>{response.toolCalls=[{callId,name,arguments:args}];return response;};
  if(!r.results.length)return call('01_context','project_get_context',{});
  if(r.context.intent!=='propose'||r.model==='discussion-v1'||r.model==='slow-v1'){
   const source=r.context.sources.find(s=>s.resourceType==='scene'||s.resourceType==='object');response.text='Réponse du simulateur local, sans modèle externe. Le contexte sélectionné est consultable dans les sources. Aucun changement n’a été appliqué au canon.';if(source){const text=source.data.content?canonicalDocumentStats(source.data.content as RichDocument).text:String(source.data.text??'');response.citations=[{sourceId:source.id,quote:text?Array.from(text).slice(0,100).join(''):null,generatedSummary:'Repère généré par le simulateur, à examiner comme une suggestion.'}];}return response;
  }
  if(r.context.selection.proposalId){
   const read=r.results.find(t=>t.name==='proposal_get')?.result as {proposal:ProposalDto}|undefined,revised=r.results.find(t=>t.name==='proposal_revise')?.result as {proposal:ProposalDto}|undefined,submitted=r.results.find(t=>t.name==='proposal_submit')?.result;
   if(!read)return call('02_read_proposal','proposal_get',{proposalId:r.context.selection.proposalId});
   if(!revised)return call('03_revise_proposal','proposal_revise',{proposalId:read.proposal.id,expectedProposalRevision:read.proposal.proposalRevision,expectedStateVersion:read.proposal.stateVersion,set:{description:'Nouvelle intention du simulateur local, à relire et approuver de nouveau.'}});
   if(!submitted)return call('04_resubmit','proposal_submit',{proposalId:revised.proposal.id,expectedProposalRevision:revised.proposal.proposalRevision,expectedStateVersion:revised.proposal.stateVersion});
   response.text='Une nouvelle révision de la proposition a été soumise ; les anciens avis ne valent pas approbation de cette intention. Aucun changement appliqué.';return response;
  }
  const created=r.results.find(t=>t.name==='proposal_create')?.result as {proposal:ProposalDto;preview:ProposalPreview}|undefined,updated=r.results.find(t=>t.name==='proposal_set_operations')?.result as {proposal:ProposalDto;preview:ProposalPreview}|undefined,submitted=r.results.find(t=>t.name==='proposal_submit')?.result as {proposal:ProposalDto}|undefined;
  if(!created){const scene=r.context.sources.find(s=>s.resourceType==='scene'),character=r.context.sources.find(s=>s.resourceType==='object'&&s.data.typeKey==='character'),operations:ProposedOperation[]=[{operationId:'event',kind:'create_object',tempId:'event_simulation',payload:{typeKey:'event',schemaVersion:1,name:Array.from('Événement proposé — '+(scene?.title??character?.title??'intention')).slice(0,180).join(''),attributes:{temporalExpression:{kind:'unknown'},description:'Intention produite par le simulateur local, à relire.'}}}];
   if(character){if(!character.excerpt)operations.push({operationId:'character',kind:'update_object',targetId:character.resourceId,expectedRevision:character.revision,payload:{set:{attributes:{...character.data.attributes as Record<string,unknown>,conditionEventRefs:[...((character.data.attributes as {conditionEventRefs?:{id:string}[]}).conditionEventRefs??[]),{tempId:'event_simulation'}]}}}});operations.push({operationId:'participation',kind:'create_relation',tempId:'participation_simulation',payload:{sourceRef:{id:character.resourceId},targetRef:{tempId:'event_simulation'},relationType:'participates_in',attributes:{description:'Lien proposé par le simulateur local.'}}});}
   if(scene){if(!scene.excerpt)operations.push({operationId:'scene',kind:'replace_scene_content',targetId:scene.resourceId,expectedRevision:scene.revision,payload:{contentFormatVersion:1,content:{...scene.data.content as RichDocument,content:[...(scene.data.content as RichDocument).content,{type:'paragraph',content:[{type:'text',text:'Un événement nouveau est proposé ici par le simulateur, sans application automatique.'}]}]}}});operations.push({operationId:'references',kind:'update_scene_metadata',targetId:scene.resourceId,expectedRevision:scene.revision,payload:{set:{references:[...(scene.data.references as {objectId:string;referenceType:'present'}[]??[]).map(ref=>({objectRef:{id:ref.objectId},referenceType:ref.referenceType})),{objectRef:{tempId:'event_simulation'},referenceType:'depicts_event'}]}}});}
   return call('02_proposal','proposal_create',{title:'Intention narrative simulée',description:'Proposition du simulateur local à relire et valider humainement. Aucun modèle externe appelé.',operations,dependencyRevisions:[]});
  }
  if(!updated)return call('03_bases','proposal_set_operations',{proposalId:created.proposal.id,expectedStateVersion:created.proposal.stateVersion,expectedProposalRevision:created.proposal.proposalRevision,operations:created.proposal.operations,dependencyRevisions:created.preview.validatedAgainst});
  if(!submitted)return call('04_submit','proposal_submit',{proposalId:updated.proposal.id,expectedStateVersion:updated.proposal.stateVersion,expectedProposalRevision:updated.proposal.proposalRevision});
  response.text='Le simulateur a préparé une proposition multi-objets et l’a soumise à la revue humaine. Rien n’est appliqué au canon. Ouvrez la proposition pour comparer les différences ; seuls les humains autorisés peuvent approuver et fusionner.';response.citations=r.context.sources.filter(s=>s.resourceType==='scene'||s.resourceType==='object').slice(0,3).map(s=>({sourceId:s.id,quote:null,generatedSummary:null}));return response;
 }
}
