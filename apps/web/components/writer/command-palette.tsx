'use client';
import {useEffect,useRef,useState} from 'react';
import type {EditorialOutline,PageDto,SearchHit} from '@storymaster/contracts';
import {api} from '../api';
export interface WorkshopCommand {id:string;label:string;run:()=>void}
export function CommandPalette({projectId,outline,commands,onScene,onObject,onClose}:{projectId:string;outline:EditorialOutline|null;commands:WorkshopCommand[];onScene:(id:string)=>void;onObject:(id:string)=>void;onClose:()=>void}) {
 const dialog=useRef<HTMLDialogElement>(null),input=useRef<HTMLInputElement>(null),[query,setQuery]=useState(''),[hits,setHits]=useState<SearchHit[]>([]),[loading,setLoading]=useState(false),[error,setError]=useState('');
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;const modal=dialog.current;modal?.showModal();input.current?.focus();return()=>{modal?.close();if(previous?.isConnected)previous.focus({preventScroll:true});};},[]);
 useEffect(()=>{let active=true;setHits([]);setError('');if(!query.trim()){setLoading(false);return;}
  setLoading(true);const timer=setTimeout(()=>{void api<PageDto<SearchHit>>(`/projects/${projectId}/search?`+new URLSearchParams({q:query.trim(),limit:'20'})).then(p=>{if(active)setHits(p.items);}).catch(e=>{if(active)setError((e as Error).message);}).finally(()=>{if(active)setLoading(false);});},250);
  return()=>{active=false;clearTimeout(timer);};
 },[projectId,query]);
 const q=query.toLocaleLowerCase('fr'),scenes=outline?.manuscripts.filter(m=>!m.archived).flatMap(m=>m.chapters.filter(c=>!c.archived).flatMap(c=>c.scenes.filter(s=>!s.archived).map(s=>({...s,location:c.title}))))??[];
 const run=(work:()=>void)=>{onClose();work();};
 return <dialog ref={dialog} className="command-palette" aria-labelledby="command-title" onCancel={e=>{e.preventDefault();onClose();}} onKeyDown={e=>{if(e.key!=='ArrowDown'&&e.key!=='ArrowUp')return;const buttons=[...e.currentTarget.querySelectorAll<HTMLButtonElement>('[data-command]')];if(!buttons.length)return;const i=buttons.indexOf(document.activeElement as HTMLButtonElement),next=e.key==='ArrowDown'?(i+1)%buttons.length:i<0?buttons.length-1:(i-1+buttons.length)%buttons.length;e.preventDefault();buttons[next]?.focus();}}>
  <div className="section-line"><h2 id="command-title">Aller à…</h2><button className="text-button" onClick={onClose}>Fermer la palette</button></div><label htmlFor="workshop-command">Action, scène ou fiche</label><input ref={input} id="workshop-command" type="search" maxLength={1000} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher dans ce projet…"/><p className="muted">↑ ↓ pour parcourir · Entrée pour ouvrir · Échap pour fermer</p>
  <div className="command-results"><h3>Actions de l’atelier</h3><ul>{commands.filter(c=>c.label.toLocaleLowerCase('fr').includes(q)).map(c=><li key={c.id}><button data-command type="button" onClick={()=>run(c.run)}>{c.label}</button></li>)}</ul><h3>Scènes</h3><ul>{scenes.filter(s=>s.title.toLocaleLowerCase('fr').includes(q)).slice(0,20).map(s=><li key={s.id}><button data-command type="button" onClick={()=>run(()=>onScene(s.id))}>{s.title}<small>{s.location}</small></button></li>)}</ul>
  {loading&&<p role="status">Recherche dans le projet…</p>}{error&&<p role="alert" className="notice error">{error}</p>}{hits.length>0&&<><h3>Dans le texte et la bible</h3><ul>{hits.map(h=><li key={h.resourceId}><button data-command type="button" onClick={()=>run(()=>h.resourceType==='scene'?onScene(h.resourceId):onObject(h.resourceId))}>{h.title}<small>{h.typeKey==='scene'?'Scène':'Fiche'} · {h.excerpt}</small></button></li>)}</ul></>}{query.trim()&&!loading&&!error&&!hits.length&&!scenes.some(s=>s.title.toLocaleLowerCase('fr').includes(q))&&<p role="status">Aucun résultat pour cette recherche.</p>}</div>
 </dialog>;
}
