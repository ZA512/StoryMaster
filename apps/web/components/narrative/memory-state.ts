'use client';
import {useSyncExternalStore} from 'react';
const draftStores=new Set<MemoryState<unknown>>();
/** UI state only; no persistence, transport, authorization or canonical data store. */
export class MemoryState<T>{
 private values=new Map<string,T>();private listeners=new Map<string,Set<()=>void>>();
 constructor(draft=false){if(draft)draftStores.add(this as MemoryState<unknown>);}
 get(key:string){return this.values.get(key);}
 set(key:string,value:T|undefined){if(value===undefined)this.values.delete(key);else this.values.set(key,value);for(const notify of this.listeners.get(key)??[])notify();}
 subscribe(key:string,notify:()=>void){let listeners=this.listeners.get(key);if(!listeners){listeners=new Set();this.listeners.set(key,listeners);}listeners.add(notify);return()=>{listeners.delete(notify);if(!listeners.size)this.listeners.delete(key);};}
 hasPrefix(prefix:string){return [...this.values.keys()].some(key=>key.startsWith(prefix));}
}
export function useMemoryState<T>(store:MemoryState<T>,key:string){return useSyncExternalStore(notify=>store.subscribe(key,notify),()=>store.get(key),()=>undefined);}
export function hasNarrativeDrafts(userId:string){return [...draftStores].some(store=>store.hasPrefix(userId+'/'));}
