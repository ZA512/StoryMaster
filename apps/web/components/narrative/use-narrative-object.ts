'use client';
import {useEffect,useRef,useState} from 'react';
import type {NarrativeObjectDto,ObjectDetail,ProjectDto,PageDto,RelationView} from '@storymaster/contracts';
import {api,ApiError} from '../api';
import {useSession} from '../session';
export function narrativeChanged(projectId:string,objectIds:string[]){window.dispatchEvent(new CustomEvent('storymaster:narrative-changed',{detail:{projectId,objectIds}}));}
export function useNarrativeObject(projectId:string,id:string){
 const {me}=useSession(),[detail,setDetail]=useState<ObjectDetail|null>(null),[project,setProject]=useState<ProjectDto|null>(null),[error,setError]=useState(''),serial=useRef(0),alive=useRef(true);
 const refresh=async()=>{const seq=++serial.current;try{const [d,p]=await Promise.all([api<ObjectDetail>(`/projects/${projectId}/objects/${id}/detail`),api<ProjectDto>('/projects/'+projectId)]);if(alive.current&&seq===serial.current){setDetail(d);setProject(p);setError('');}}catch(e){if(alive.current&&seq===serial.current){setError((e as Error).message);setProject(null);if(e instanceof ApiError&&['NOT_FOUND','FORBIDDEN','UNAUTHENTICATED'].includes(e.code))setDetail(null);}throw e;}};
 const latest=useRef(refresh);latest.current=refresh;
 useEffect(()=>{
  alive.current=true;setDetail(null);setProject(null);setError('');if(!me)return;void latest.current().catch(()=>{});
  let reading=false,again=false;const revalidate=()=>{if(document.hidden)return;if(reading){again=true;return;}reading=true;void latest.current().catch(()=>{}).finally(()=>{reading=false;if(again&&alive.current){again=false;revalidate();}});};
  const changed=(e:Event)=>{const d=(e as CustomEvent<{projectId:string;objectId?:string;objectIds?:string[]}>).detail;if(d?.projectId===projectId&&(d.objectId===id||d.objectIds?.includes(id)))revalidate();};
  const timer=setInterval(revalidate,12000);window.addEventListener('focus',revalidate);window.addEventListener('storymaster:narrative-changed',changed);
  return()=>{alive.current=false;serial.current++;clearInterval(timer);window.removeEventListener('focus',revalidate);window.removeEventListener('storymaster:narrative-changed',changed);};
 },[me?.user.id,projectId,id]);
 const saved=(object:NarrativeObjectDto)=>{serial.current++;setDetail(old=>old&&object.id===id&&object.revision>=old.object.revision?{...old,object}:old);};
 const appendRelations=(page:PageDto<RelationView>)=>setDetail(old=>{if(!old)return old;const rows=new Map(old.relations.map(r=>[r.id,r]));for(const row of page.items)if(!rows.has(row.id)||rows.get(row.id)!.revision<=row.revision)rows.set(row.id,row);return {...old,relations:[...rows.values()],hasMoreRelations:page.hasMore,relationsNextCursor:page.nextCursor};});
 return {detail:detail?.object.id===id?detail:null,project,error,setDetail,setError,refresh,saved,appendRelations};
}
