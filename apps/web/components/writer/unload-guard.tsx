'use client';
import {useEffect} from 'react';
import {hasUnconfirmedDrafts,flushVisibleDrafts} from './drafts';
export function DraftUnloadGuard(){useEffect(()=>{
 const leaving=(event:BeforeUnloadEvent)=>{if(hasUnconfirmedDrafts()){event.preventDefault();event.returnValue='';}};
 const hidden=()=>{if(document.visibilityState==='hidden')flushVisibleDrafts();};
 window.addEventListener('beforeunload',leaving);document.addEventListener('visibilitychange',hidden);
 return()=>{window.removeEventListener('beforeunload',leaving);document.removeEventListener('visibilitychange',hidden);};
 },[]);return null;}
