'use client';
import {useEffect} from 'react';
import type {ReactNode} from 'react';
import type {CharacterAttributes} from '@storymaster/domain';
import type {NarrativeObjectDto,NarrativeUpdate} from '@storymaster/contracts';
import {useSession} from '../session';
import {api,ApiError} from '../api';
import {useNarrativeMutation,RelatedObjectLink} from './shared';
import {MemoryState,useMemoryState} from './memory-state';

type Depth='essential'|'developed'|'complete';
type Field='name'|'summary'|'notes'|keyof Omit<CharacterAttributes,'conditionEventRefs'>;
interface Draft {field:Field;base:NarrativeObjectDto;values:string[];phase:'editing'|'sending'|'unknown'|'conflict'|'error';message:string;request?:{body:NarrativeUpdate;key:string};remote?:NarrativeObjectDto}
// Session memory only. These maps never feed persistent browser storage.
const drafts=new MemoryState<Draft>(true),depths=new MemoryState<Depth>(),notices=new MemoryState<string>();
const fields:{key:Field;label:string;depth:Depth;list?:boolean;max:number;long?:boolean}[]=[
 {key:'name',label:'Nom',depth:'essential',max:200},
 {key:'narrativeRole',label:'Rôle narratif',depth:'essential',max:200},
 {key:'summary',label:'Description courte',depth:'essential',max:4000,long:true},
 {key:'goals',label:'Objectifs',depth:'essential',list:true,max:1000},
 {key:'traits',label:'Traits et caractéristiques',depth:'essential',list:true,max:1000},
 {key:'aliases',label:'Alias',depth:'developed',list:true,max:200},
 {key:'motivations',label:'Motivations',depth:'developed',list:true,max:1000},
 {key:'conflicts',label:'Conflits',depth:'developed',list:true,max:1000},
 {key:'description',label:'Description détaillée',depth:'developed',max:20000,long:true},
 {key:'background',label:'Passé',depth:'developed',max:20000,long:true},
 {key:'speakingStyle',label:'Manière de parler',depth:'developed',max:4000,long:true},
 {key:'notes',label:'Notes du projet',depth:'developed',max:20000,long:true},
 {key:'healthSummary',label:'Santé — description libre',depth:'complete',max:4000,long:true},
];
const read=(n:NarrativeObjectDto,key:Field):string[]=>{const v=key==='name'||key==='summary'||key==='notes'?n[key]:(n.attributes as CharacterAttributes)[key];return Array.isArray(v)?v:typeof v==='string'?[v]:[];};
const level=(d:Depth)=>d==='essential'?0:d==='developed'?1:2;
export function CharacterFields({projectId,object,canWrite,onSaved,onRefresh,compact=false}:{projectId:string;object:NarrativeObjectDto;canWrite:boolean;onSaved:(n:NarrativeObjectDto)=>void;onRefresh:()=>Promise<unknown>;compact?:boolean}){
 const {me}=useSession(),scope=(me?.user.id??'')+'/'+projectId,key=scope+'/'+object.id,mutate=useNarrativeMutation(projectId);
 const depth=useMemoryState(depths,scope)??'essential',draft=useMemoryState(drafts,key)??null;const notice=useMemoryState(notices,key)??'',setNotice=(text:string)=>notices.set(key,text||undefined);
 const update=(next:Draft|null)=>{drafts.set(key,next??undefined);};
 useEffect(()=>{const warn=(e:BeforeUnloadEvent)=>{if(draft){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[draft]);
 const choose=(next:Depth)=>{depths.set(scope,next);};
 const save=async()=>{
  const current=drafts.get(key);if(!current||current.phase==='sending')return;const definition=fields.find(f=>f.key===current.field)!;
  if(!current.request){if(current.values.some(v=>!v.trim())&&definition.list){update({...current,phase:'error',message:'Complétez ou retirez les entrées vides avant d’enregistrer.'});return;}if(current.field==='name'&&!current.values[0]?.trim()){update({...current,phase:'error',message:'Le nom est obligatoire.'});return;}}
  const values=definition.list?current.values:current.values[0]??'',base=current.base,body:NarrativeUpdate=current.request?.body??{set:current.field==='name'||current.field==='summary'||current.field==='notes'?{[current.field]:values as string}:{schemaVersion:current.field==='background'||current.field==='speakingStyle'?2:base.schemaVersion,attributes:{...base.attributes,[current.field]:values}}},request=current.request??{body,key:crypto.randomUUID()};
  update({...current,request,phase:'sending',message:'Enregistrement…'});
  try{
   const saved=await mutate<NarrativeObjectDto>('/objects/'+object.id,'PATCH',request.body,base.revision,request.key);
   update(null);setNotice('Enregistré');onSaved(saved);window.dispatchEvent(new CustomEvent('storymaster:narrative-changed',{detail:{projectId,objectId:object.id}}));
  }catch(e){const code=e instanceof ApiError?e.code:'LOCAL_ERROR',unknown=['NETWORK_ERROR','INTERNAL_ERROR','TEMPORARILY_UNAVAILABLE'].includes(code)||(current.phase==='unknown'&&['FORBIDDEN','NOT_FOUND','UNAUTHENTICATED'].includes(code));update({...current,request,phase:unknown?'unknown':code==='REVISION_CONFLICT'?'conflict':'error',message:unknown?'Réponse non confirmée. Vérifiez et reprenez la même demande avant de modifier ces champs.':code==='REVISION_CONFLICT'?'Cette fiche a été modifiée ailleurs. Votre saisie est conservée ; comparez avant de choisir une nouvelle base.':(e as Error).message});try{await onRefresh();}catch{/* Keep the draft; a reread never confirms a write. */}}
 };
 const compare=async()=>{const current=drafts.get(key);if(!current)return;try{const remote=await api<NarrativeObjectDto>(`/projects/${projectId}/objects/${object.id}`);if(drafts.get(key)===current)update({...current,remote});}catch(e){if(drafts.get(key)===current)update({...current,message:(e as Error).message});}};
 return <section className={'character-fields'+(compact?' compact':'')} aria-label="Fiche progressive du personnage"><nav className="character-depth" aria-label="Profondeur de la fiche">{([['essential','Essentiel'],['developed','Approfondi'],['complete','Complet']] as const).map(([value,label])=><button key={value} className="text-button" aria-pressed={depth===value} onClick={()=>choose(value)}>{label}</button>)}</nav>
 {notice&&!draft&&<p className="character-save-state" role="status">{notice}</p>}
 {fields.filter(f=>level(f.depth)<=level(depth)||draft?.field===f.key).map(f=>{
  const values=read(object,f.key),editing=draft?.field===f.key,locked=draft?.phase==='sending'||draft?.phase==='unknown',visible=depth==='essential'&&(f.key==='goals'||f.key==='traits')?values.slice(0,1):values;
  return <CharacterSection key={f.key} label={f.label} wide={f.long} essential={f.depth==='essential'} editing={editing}><div className="section-line"><h3>{depth==='essential'&&f.key==='goals'?'Objectif principal':depth==='essential'&&f.key==='traits'?'Élément caractéristique':f.label}</h3>{canWrite&&!editing&&<button type="button" className="text-button" disabled={!!draft} onClick={()=>{setNotice('');update({field:f.key,base:structuredClone(object),values:values.length?[...values]:f.list?[]:[''],phase:'editing',message:'Modification en cours'});}}>{values.some(Boolean)?'Modifier':'Ajouter'}<span className="sr-only"> : {f.label.toLowerCase()}</span></button>}</div>
  {editing&&draft?<form aria-label={'Modifier '+f.label.toLowerCase()} onSubmit={e=>{e.preventDefault();void save();}}><p role={draft.phase==='error'||draft.phase==='conflict'?'alert':'status'} className={draft.phase==='error'||draft.phase==='conflict'?'notice error':'muted'}>{draft.message}</p>
   <fieldset disabled={locked}><legend className="sr-only">{f.label}</legend>{draft.values.map((v,i)=><div className="character-entry-edit" key={i}><label>{f.list?f.label+' — entrée '+(i+1):f.label}{f.long?<textarea autoFocus={i===0} value={v} maxLength={f.max} rows={f.key==='summary'?3:5} onChange={e=>update({...draft,request:undefined,values:draft.values.map((x,j)=>j===i?e.target.value:x),phase:'editing',message:'Modification en cours'})}/>:<input autoFocus={i===0} value={v} required={f.key==='name'||!!f.list} maxLength={f.max} onChange={e=>update({...draft,request:undefined,values:draft.values.map((x,j)=>j===i?e.target.value:x),phase:'editing',message:'Modification en cours'})}/>}</label>{f.list&&<div className="entry-controls"><button type="button" className="text-button" disabled={i===0} aria-label={'Monter l’entrée '+(i+1)} onClick={()=>{const a=[...draft.values];[a[i-1],a[i]]=[a[i]!,a[i-1]!];update({...draft,request:undefined,values:a});}}>↑</button><button type="button" className="text-button" disabled={i===draft.values.length-1} aria-label={'Descendre l’entrée '+(i+1)} onClick={()=>{const a=[...draft.values];[a[i],a[i+1]]=[a[i+1]!,a[i]!];update({...draft,request:undefined,values:a});}}>↓</button><button type="button" className="text-button" aria-label={'Retirer l’entrée '+(i+1)} onClick={()=>update({...draft,request:undefined,values:draft.values.filter((_,j)=>i!==j)})}>Retirer</button></div>}</div>)}{f.list&&<button type="button" className="text-button" disabled={draft.values.length>=100} onClick={()=>update({...draft,request:undefined,values:[...draft.values,'']})}>+ Ajouter une entrée</button>}</fieldset>
   {draft.phase==='conflict'&&<><button type="button" className="text-button" onClick={()=>void compare()}>Comparer avec la version actuelle</button>{draft.remote&&<div className="character-comparison"><h4>Version enregistrée</h4><p className="preserve-text">{read(draft.remote,f.key).join('\n')||'Champ vide'}</p><button type="button" className="button secondary" onClick={()=>update({...draft,base:draft.remote!,request:undefined,remote:undefined,phase:'editing',message:'Nouvelle base choisie. Vérifiez votre saisie avant d’enregistrer.'})}>Utiliser cette base et garder ma saisie</button></div>}</>}
   <div className="form-actions"><button type="button" className="text-button" disabled={locked} onClick={()=>{if(window.confirm('Abandonner cette modification non enregistrée ?'))update(null);}}>Annuler</button><button className="button secondary" disabled={(!canWrite&&draft.phase!=='unknown')||draft.phase==='sending'||draft.phase==='conflict'}>{draft.phase==='sending'?'Enregistrement…':draft.phase==='unknown'?'Vérifier et reprendre':'Enregistrer'}</button></div>
  </form>:visible.some(Boolean)?f.list?<><ul className="character-values">{visible.map((v,i)=><li key={i}>{v}</li>)}</ul>{visible.length<values.length&&<button className="text-button" onClick={()=>choose('developed')}>Voir les {values.length} entrées</button>}</>:<p className="preserve-text">{visible[0]}</p>:<p className="muted">{f.list?'Aucune entrée définie.':'À compléter selon votre histoire.'}</p>}
 </CharacterSection>;})}
 {depth==='complete'&&!!(object.attributes as CharacterAttributes).conditionEventRefs?.length&&<section className="character-section wide"><h3>Événements descriptifs associés</h3><ul>{(object.attributes as CharacterAttributes).conditionEventRefs!.map(r=><li key={r.id}><RelatedObjectLink projectId={projectId} id={r.id}/></li>)}</ul></section>}
 {depth==='complete'&&<details><summary>Schéma et traçabilité</summary><p>Schéma {object.schemaVersion} · révision {object.revision}. Créée le {new Date(object.createdAt).toLocaleDateString('fr')}, modifiée le {new Date(object.updatedAt).toLocaleDateString('fr')}. Les notes sont partagées avec les membres autorisés du projet.</p></details>}
 </section>;
}

function CharacterSection({label,essential,editing,wide,children}:{label:string;essential:boolean;editing:boolean;wide?:boolean;children:ReactNode}){return essential?<section className={'character-section'+(wide?' wide':'')} aria-label={label}>{children}</section>:<details className="character-section wide" open={editing?true:undefined}><summary>{label}</summary>{children}</details>;}
