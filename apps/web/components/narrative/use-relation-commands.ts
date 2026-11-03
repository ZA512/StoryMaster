'use client';
import type {NarrativeRelation,RelationAttributes} from '@storymaster/domain';
import type {NarrativeObjectDto,NarrativeRevisionPage,RelationView} from '@storymaster/contracts';
import {api,ApiError} from '../api';
import {useSession} from '../session';
import {MemoryState,useMemoryState} from './memory-state';
import {useNarrativeMutation} from './shared';
import {narrativeChanged} from './use-narrative-object';
import {relationInput,asRelationEndpoint} from './relation-presentation';
import type {RelationEndpoint} from './relation-presentation';
type Phase='editing'|'sending'|'unknown'|'conflict'|'error';
interface Request {path:string;method:'POST'|'PATCH'|'DELETE';body:unknown;revision?:number;key:string}
export interface RelationDraft {kind:'create'|'edit'|'remove'|'restore';anchor:RelationEndpoint;other?:RelationEndpoint;relation?:RelationView;sourceRevision?:number;choice:string;description:string;parentage:NonNullable<RelationAttributes['parentage']>;parentRole:NonNullable<RelationAttributes['parentRole']>;phase:Phase;message:string;request?:Request;remote?:{anchor:RelationEndpoint;other:RelationEndpoint;relation?:RelationView}}
const states=new MemoryState<RelationDraft>(true),notices=new MemoryState<string>(),results=new MemoryState<NarrativeRelation>();
export async function readRelationView(projectId:string,id:string):Promise<RelationView>{
 const history=await api<NarrativeRevisionPage>(`/projects/${projectId}/relations/${id}/revisions?limit=1`),r=history.items[0]?.snapshot as NarrativeRelation|undefined;if(!r||!('relationType'in r))throw Error('Cette relation n’est plus disponible.');
 const [source,target]=await Promise.all([api<NarrativeObjectDto>(`/projects/${projectId}/objects/${r.sourceObjectId}`),api<NarrativeObjectDto>(`/projects/${projectId}/objects/${r.targetObjectId}`)]);
 return {...r,source:asRelationEndpoint(source),target:asRelationEndpoint(target),linkState:r.status==='removed'?'removed':source.status==='archived'||target.status==='archived'?'target_archived':!source.moduleEnabled||!target.moduleEnabled?'module_disabled':'active'};
}
export function useRelationCommands(projectId:string,pov:string,onRefresh:()=>Promise<unknown>){
 const {me}=useSession(),scope=(me?.user.id??'')+'/'+projectId+'/'+pov,mutate=useNarrativeMutation(projectId),draft=useMemoryState(states,scope),notice=useMemoryState(notices,scope)??'',result=useMemoryState(results,scope);
 const start=(kind:RelationDraft['kind'],anchor:RelationEndpoint,other?:RelationEndpoint,relation?:RelationView,sourceRevision?:number)=>{if(states.get(scope)){notices.set(scope,'Terminez la modification ouverte avant de préparer une autre relation.');return;}notices.set(scope,undefined);states.set(scope,{kind,anchor:asRelationEndpoint(anchor),other:other?asRelationEndpoint(other):undefined,relation:relation?structuredClone(relation):undefined,sourceRevision,choice:'',description:relation?.attributes.description??'',parentage:relation?.attributes.parentage??'unspecified',parentRole:relation?.attributes.parentRole??'parent',phase:'editing',message:''});};
 const create=(anchor:RelationEndpoint,other?:RelationEndpoint)=>start('create',anchor,other);
 const edit=(r:RelationView)=>start('edit',r.source,r.target,r);
 const remove=(r:RelationView)=>start('remove',r.source,r.target,r);
 const restore=(r:RelationView,sourceRevision?:number)=>start('restore',r.source,r.target,r,sourceRevision);
 const change=(values:Partial<Pick<RelationDraft,'other'|'choice'|'description'|'parentage'|'parentRole'>>)=>{const current=states.get(scope);if(!current||['sending','unknown'].includes(current.phase))return;states.set(scope,{...current,...values,...('other'in values?{other:values.other?asRelationEndpoint(values.other):undefined}:{}),request:undefined,remote:undefined,phase:'editing',message:''});};
 const cancel=()=>{const current=states.get(scope);if(!current||['sending','unknown'].includes(current.phase))return;const dirty=current.kind==='create'?!!(current.choice||current.description):current.kind==='edit'&&(current.description!==(current.relation?.attributes.description??'')||current.parentage!==(current.relation?.attributes.parentage??'unspecified')||current.parentRole!==(current.relation?.attributes.parentRole??'parent'));if(!dirty||window.confirm('Abandonner cette modification non enregistrée ?'))states.set(scope,undefined);};
 const submit=async()=>{
  const current=states.get(scope);if(!current||current.phase==='sending'||current.phase==='conflict')return;
  let request=current.request;
  try{
   if(!request){if(!current.other)throw Error('Choisissez l’autre fiche.');const bases=[current.anchor,current.other].map(n=>({id:n.id,revision:n.revision}));let path='/relations',method:Request['method']='POST',revision:number|undefined,body:unknown;
    if(current.kind==='create')body=relationInput(current.anchor,current.other,current.choice,current.description,current.parentage);
    else {const r=current.relation!;path+='/'+r.id;revision=r.revision;
     if(current.kind==='edit'){method='PATCH';body={set:{attributes:{...r.attributes,description:current.description,...(r.relationType==='parent_of'?{parentage:current.parentage,parentRole:current.parentRole}:{})}},dependencyRevisions:bases};}
     else {if(current.kind==='remove')method='DELETE';else path+='/restore';body={dependencyRevisions:bases,...(current.sourceRevision?{sourceRevision:current.sourceRevision}:{})};}
    }
    request={path,method,body,revision,key:crypto.randomUUID()};
   }
  }catch(e){states.set(scope,{...current,phase:'error',message:(e as Error).message});return;}
  states.set(scope,{...current,request,phase:'sending',message:'Enregistrement…'});
  try{
   const acknowledged=await mutate<NarrativeRelation>(request.path,request.method,request.body,request.revision,request.key);results.set(scope,acknowledged);states.set(scope,undefined);
   notices.set(scope,current.kind==='remove'?'Lien retiré. Son historique est conservé.':current.kind==='restore'?'Lien rétabli dans une nouvelle révision.':'Relation enregistrée.');
   try{await onRefresh();}catch{notices.set(scope,'La commande est confirmée ; certaines informations n’ont pas pu être relues. Actualisez la fiche.');}
   narrativeChanged(projectId,[current.anchor.id,...(current.other?[current.other.id]:[])]);return true;
  }catch(e){const code=e instanceof ApiError?e.code:'LOCAL_ERROR',unknown=['NETWORK_ERROR','INTERNAL_ERROR','TEMPORARILY_UNAVAILABLE'].includes(code)||(current.phase==='unknown'&&['FORBIDDEN','NOT_FOUND','UNAUTHENTICATED'].includes(code));states.set(scope,{...current,request,phase:unknown?'unknown':code==='REVISION_CONFLICT'?'conflict':'error',message:unknown?'Réponse non confirmée. Reprenez cette même demande ; une relecture ne confirme pas son enregistrement.':code==='REVISION_CONFLICT'?'Ce lien ou une fiche a changé ailleurs. Votre saisie est conservée. Comparez avant de renouveler votre décision.':(e as Error).message});try{await onRefresh();}catch{/* Preserve intent, never claim an acknowledgement. */}}
 };
 const compare=async()=>{
  const current=states.get(scope);if(!current||current.phase!=='conflict'||!current.other)return;
  try{let remote:RelationDraft['remote'];if(current.kind==='create'){const [anchor,other]=await Promise.all([api<NarrativeObjectDto>(`/projects/${projectId}/objects/${current.anchor.id}`),api<NarrativeObjectDto>(`/projects/${projectId}/objects/${current.other.id}`)]);remote={anchor,other};}else{const r=await readRelationView(projectId,current.relation!.id);remote={anchor:r.source,other:r.target,relation:r};}if(states.get(scope)===current)states.set(scope,{...current,remote});}catch(e){if(states.get(scope)===current)states.set(scope,{...current,message:(e as Error).message});}
 };
 const adopt=()=>{const current=states.get(scope);if(!current?.remote)return;const {remote}=current;if(current.relation&&remote.relation?.relationType!==current.relation.relationType){states.set(scope,{...current,message:'Ce lien a changé de nature. Votre saisie reste conservée ; fermez ce formulaire pour examiner son nouvel état.'});return;}states.set(scope,{...current,anchor:remote.anchor,other:remote.other,relation:remote.relation,request:undefined,remote:undefined,phase:'editing',message:'Nouvelle base choisie. Vérifiez les champs et confirmez à nouveau.'});};
 return {draft,notice,result,create,edit,remove,restore,change,cancel,submit,compare,adopt};
}
export type RelationCommands=ReturnType<typeof useRelationCommands>;
