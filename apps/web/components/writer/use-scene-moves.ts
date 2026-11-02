'use client';
import {useEffect,useRef,useState} from 'react';
import type {EditorialAck,EditorialOutline,SceneDto} from '@storymaster/contracts';
import {api,ApiError} from '../api';
import type {DraftManager} from './drafts';
import {reverseSceneMove} from './scene-move-intent';
import type {SceneMoveIntent} from './scene-move-intent';
export interface MoveFeedback {phase:'sending'|'confirmed'|'unknown'|'conflict'|'error';intent:SceneMoveIntent;message:string}
interface Options {base:string;csrfToken?:string;manager:DraftManager|null;refresh:()=>Promise<EditorialOutline>;setBusy:(value:boolean)=>void;onScene:(scene:SceneDto)=>void;onUnavailable:(error:unknown)=>void}
export function useSceneMoves(options:Options){
 const latest=useRef(options);latest.current=options;
 const [feedback,setFeedback]=useState<MoveFeedback|null>(null),[undo,setUndo]=useState<{intent:SceneMoveIntent;until:number}|null>(null),running=useRef(false);
 const blocked=feedback?.phase==='unknown'||feedback?.phase==='sending';
 useEffect(()=>{const warn=(e:BeforeUnloadEvent)=>{if(blocked){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[blocked]);
 useEffect(()=>{if(!undo)return;const timer=setTimeout(()=>setUndo(null),Math.max(0,undo.until-Date.now()));return()=>clearTimeout(timer);},[undo]);
 const refresh=async()=>{try{return await latest.current.refresh();}catch(e){latest.current.onUnavailable(e);throw e;}};
 const send=async(original:SceneMoveIntent,retry=false)=>{
  if(running.current||(!retry&&blocked))return;
  running.current=true;latest.current.setBusy(true);let intent=original,committed=false;
  setFeedback({phase:'sending',intent,message:`${intent.undo?'Annulation':'Déplacement'} de « ${intent.title} » en cours… L’ordre attend la confirmation.`});
  try{
   const {manager,csrfToken,base}=latest.current;if(!manager||!csrfToken)throw Error('Session indisponible.');
   if(!retry){
    // Only our own successful autosaves may advance the scene precondition.
    // The structure preconditions remain exactly those the user manipulated.
    const local=manager.get(intent.sceneId),observed=local?.baseRevision;
    if(!await manager.flushAll())throw Error('Enregistrez ou réconciliez les brouillons avant de déplacer une scène.');
    const saved=manager.get(intent.sceneId);
    if(local&&saved===local&&observed===intent.body.expectedRevision)intent={...intent,body:{...intent.body,expectedRevision:saved.baseRevision}};
   }
   setUndo(null);
   // A retry keeps the exact body and key, even if the server plan was reread.
   const ack=await api<EditorialAck>(base+'/scenes/'+intent.sceneId+'/move',{method:'POST',headers:{'X-CSRF-Token':csrfToken,'Idempotency-Key':intent.key},body:JSON.stringify(intent.body)});
   committed=true;manager.acknowledgeMove(intent.sceneId,intent.body.expectedRevision,ack.revision);
   if(!intent.undo)setUndo({intent:reverseSceneMove(intent,ack,crypto.randomUUID()),until:Date.now()+60000});
   setFeedback({phase:'confirmed',intent,message:intent.undo?`Déplacement de « ${intent.title} » annulé par une nouvelle opération.`:`« ${intent.title} » déplacée dans « ${intent.targetTitle} ». Enregistré.`});
   await refresh();
   const fresh=await api<SceneDto>(base+'/scenes/'+intent.sceneId);latest.current.onScene(fresh);
  }catch(e){
   const code=e instanceof ApiError?e.code:'LOCAL_ERROR';
   if(committed){setFeedback({phase:'confirmed',intent,message:'Le déplacement est confirmé ; certaines informations n’ont pas pu être relues. Actualisez le plan.'});}
   else if(['NETWORK_ERROR','INTERNAL_ERROR','TEMPORARILY_UNAVAILABLE'].includes(code)){
    setFeedback({phase:'unknown',intent,message:`La réponse pour « ${intent.title} » n’est pas confirmée. Vérifiez et reprenez cette même demande avant une nouvelle modification. Le plan relu ne vaut pas confirmation.`});
    try{await refresh();}catch{/* Keep the unknown request, never invent a result. */}
   }else{
    setFeedback({phase:code==='REVISION_CONFLICT'?'conflict':'error',intent,message:code==='REVISION_CONFLICT'&&retry?'La reprise ne peut plus confirmer la première demande : le plan ou la scène a changé depuis. Vérifiez l’emplacement actuel avant une nouvelle décision.':code==='REVISION_CONFLICT'?`Le plan ou la scène a changé ailleurs. « ${intent.title} » n’a pas été déplacée par cette demande. Le plan est relu : vérifiez la destination avant de renouveler votre geste.`:['FORBIDDEN','NOT_FOUND','UNAUTHENTICATED'].includes(code)?'Vos droits ne permettent plus ce déplacement. Aucun déplacement n’est confirmé.':(e as Error).message});
    try{await refresh();}catch{/* A refused read removes the old board. */}
   }
  }finally{running.current=false;latest.current.setBusy(false);}
 };
 return {feedback,undo,blocked,send,retry:()=>feedback?.phase==='unknown'?send(feedback.intent,true):Promise.resolve(),cancelUndo:()=>setUndo(null),dismiss:()=>{if(!blocked)setFeedback(null);},refresh};
}
