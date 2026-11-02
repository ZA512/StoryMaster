import type { RichDocument, SceneReference } from '@storymaster/domain';
import type { SceneDto,SceneSaveAck,SceneReferencesView,ReferenceInput,ReferenceView } from '@storymaster/contracts';
export type SavePhase='clean'|'dirty'|'saving'|'saved'|'error'|'conflict';
export interface SaveRequest {content:RichDocument;expectedRevision:number;key:string;generation:number;running:boolean;promise:Promise<boolean>|null}
export interface ReferenceDraft {view:SceneReferencesView;items:(ReferenceInput&{target:ReferenceView['target']})[]}
export interface DraftState {
 sceneId:string;projectId:string;content:RichDocument;references:SceneReference[];baseRevision:number;generation:number;savedGeneration:number;
 referenceDraft?:ReferenceDraft;phase:SavePhase;error:string|null;remote:SceneDto|null;wordCount:number;loadEpoch:number;active:boolean;
 request:SaveRequest|null;timer:ReturnType<typeof setTimeout>|null;
}
export interface DraftTransport {save:(sceneId:string,request:SaveRequest)=>Promise<SceneSaveAck>;read:(sceneId:string)=>Promise<SceneDto>}
const errorCode=(e:unknown)=>e&&typeof e==='object'&&'code' in e ? String(e.code):'';
export class DraftManager {
 private states=new Map<string,DraftState>();private listeners=new Set<()=>void>();private serial=0;private disposed=false;
 onSaved?: (sceneId:string,ack:SceneSaveAck)=>void;
 constructor(private transport:DraftTransport,readonly debounceMs=600){}
 configure(transport:DraftTransport){this.transport=transport;}
 subscribe=(listener:()=>void)=>{this.listeners.add(listener);return ()=>{this.listeners.delete(listener);};};
 version=()=>this.serial;
 private notify(){if(this.disposed)return;this.serial++;for(const listener of this.listeners)listener();}
 get(id:string){return this.states.get(id);}
 setReferenceDraft(id:string,draft:ReferenceDraft|undefined){const s=this.states.get(id);if(s)s.referenceDraft=draft;}
 all(){return [...this.states.values()];}
 hasPending(){return this.all().some(s=>s.generation!==s.savedGeneration||s.request!==null||s.phase==='conflict'||!!s.referenceDraft);}
 private cancelTimer(s:DraftState){if(s.timer){clearTimeout(s.timer);s.timer=null;}}
 private schedule(s:DraftState){this.cancelTimer(s);if(s.phase==='conflict'||s.phase==='error')return;s.timer=setTimeout(()=>{s.timer=null;void this.send(s);},this.debounceMs);}
 activate(id:string|null){for(const state of this.states.values()){state.active=state.sceneId===id;this.prune(state);}this.notify();}
 private prune(s:DraftState){if(!s.active&&!s.request&&s.generation===s.savedGeneration&&s.phase!=='conflict'&&!s.referenceDraft){this.cancelTimer(s);this.states.delete(s.sceneId);}}
 load(scene:SceneDto,force=false){
  const old=this.states.get(scene.id);
  if(old&&!force&&(old.request||old.generation!==old.savedGeneration||old.phase==='conflict'))return old;
  if(old&&!force&&old.baseRevision>=scene.revision)return old;
  if(old&&!force&&JSON.stringify(old.content)===JSON.stringify(scene.content)){
   old.baseRevision=scene.revision;old.references=scene.references;old.wordCount=scene.wordCount;old.phase='clean';old.error=null;old.remote=null;this.notify();return old;
  }
  if(old)this.cancelTimer(old);
  const state:DraftState={sceneId:scene.id,projectId:scene.projectId,content:scene.content,references:scene.references,baseRevision:scene.revision,generation:0,savedGeneration:0,referenceDraft:old?.referenceDraft,phase:'clean',error:null,remote:null,wordCount:scene.wordCount,loadEpoch:(old?.loadEpoch??0)+1,active:true,request:null,timer:null};
  this.states.set(scene.id,state);this.notify();return state;
 }
 // A confirmed structural command preserves this exact text and its references.
 // Advance only a clean buffer at the expected base; never reset editor history.
 acknowledgeMove(id:string,expectedRevision:number,nextRevision:number){
  const s=this.states.get(id);
  if(!s||s.baseRevision!==expectedRevision||nextRevision!==expectedRevision+1||s.request||s.generation!==s.savedGeneration||s.phase==='conflict')return false;
  s.baseRevision=nextRevision;this.notify();return true;
 }
 edit(id:string,content:RichDocument){const s=this.states.get(id);if(!s)return;s.content=content;s.generation++;
  const previous=s.phase;if(s.phase!=='conflict'&&s.phase!=='error')s.phase=s.request?.running?'saving':'dirty';
  if(s.phase!=='conflict'&&s.phase!=='error')this.schedule(s);if(previous!==s.phase)this.notify();
 }
 setWordCount(id:string,generation:number,value:number){const s=this.states.get(id);if(s&&s.generation===generation&&s.wordCount!==value){s.wordCount=value;this.notify();}}
 async refreshRemote(id:string){const s=this.states.get(id);if(!s)return;
  try{const remote=await this.transport.read(id);if(this.states.get(id)!==s||s.phase!=='conflict')return;s.remote=remote;s.error=null;this.notify();}
  catch(e){if(this.states.get(id)===s){s.error=e instanceof Error?e.message:'Version serveur indisponible.';this.notify();}}
 }
 private async send(s:DraftState):Promise<boolean>{
  if(this.disposed||s.phase==='conflict')return false;
  if(s.request?.running)return s.request.promise!;
  if(!s.request&&s.generation===s.savedGeneration)return true;
  this.cancelTimer(s);
  // Une demande dont la réponse est perdue est rejouée avec EXACTEMENT le même corps et la même clé.
  const request=s.request??{content:s.content,expectedRevision:s.baseRevision,key:crypto.randomUUID(),generation:s.generation,running:false,promise:null};
  s.request=request;request.running=true;s.phase='saving';s.error=null;
  request.promise=(async()=>{
   try{
    const ack=await this.transport.save(s.sceneId,request);
    if(this.disposed||this.states.get(s.sceneId)!==s||s.request!==request)return false;
    s.baseRevision=ack.revision;s.savedGeneration=request.generation;s.request=null;
    if(s.generation===request.generation){s.phase='saved';s.wordCount=ack.wordCount;}
    else {s.phase='dirty';this.schedule(s);}
    this.onSaved?.(s.sceneId,ack);this.notify();this.prune(s);return true;
   }catch(e){
    if(this.disposed||this.states.get(s.sceneId)!==s||s.request!==request)return false;
    request.running=false;request.promise=null;
    if(errorCode(e)==='REVISION_CONFLICT'){s.request=null;s.phase='conflict';s.error=null;this.notify();await this.refreshRemote(s.sceneId);}
    else{s.phase='error';s.error=e instanceof Error?e.message:'Enregistrement impossible. Votre brouillon est conservé.';this.notify();}
    return false;
   }
  })();
  this.notify();return request.promise;
 }
 async flush(id:string):Promise<boolean>{const s=this.states.get(id);if(!s)return true;this.cancelTimer(s);
  while(s.generation!==s.savedGeneration||s.request){if(s.phase==='conflict')return false;if(!await this.send(s))return false;this.cancelTimer(s);}
  return true;
 }
 async flushAll(){const results=await Promise.all(this.all().map(s=>this.flush(s.sceneId)));return results.every(Boolean);}
 async resolve(id:string,choice:'server'|'local'){
  const s=this.states.get(id);if(!s||s.phase!=='conflict'||!s.remote)return false;
  const remote=s.remote;s.references=remote.references;s.baseRevision=remote.revision;s.remote=null;s.error=null;s.request=null;
  if(choice==='server'){s.content=remote.content;s.wordCount=remote.wordCount;s.generation++;s.savedGeneration=s.generation;s.loadEpoch++;s.phase='clean';this.notify();return true;}
  s.savedGeneration=-1;s.phase='dirty';this.notify();return this.flush(id);
 }
 dispose(){this.disposed=true;for(const state of this.states.values())this.cancelTimer(state);this.listeners.clear();}
}
const managers=new Map<string,DraftManager>();
export function draftsFor(userId:string,projectId:string,transport:DraftTransport){const key=userId+'/'+projectId;let manager=managers.get(key);if(!manager){manager=new DraftManager(transport);managers.set(key,manager);}else manager.configure(transport);return manager;}
export const hasUnconfirmedDrafts=()=>[...managers.values()].some(m=>m.hasPending());
export const flushVisibleDrafts=()=>{for(const manager of managers.values())void manager.flushAll();};
