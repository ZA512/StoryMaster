'use client';
import {useEffect,useRef,useState} from 'react';
import type {EditorialKind} from '@storymaster/domain';
import type {WorkshopLayout} from './workspace-state';
const names={manuscript:'un manuscrit',chapter:'un chapitre',scene:'une scène'};
export function InlineRename({title,value,onChange,busy,onCancel,onSave}:{title:string;value:string;onChange:(value:string)=>void;busy:boolean;onCancel:()=>void;onSave:(title:string)=>Promise<void>}) {
 const [error,setError]=useState('');
 return <form className="inline-create inline-node-rename" aria-label={'Renommer '+title} onSubmit={e=>{e.preventDefault();setError('');void onSave(value.trim()).catch(e=>setError((e as Error).message));}}><label>Nouveau titre<input autoFocus required maxLength={200} value={value} disabled={busy} onFocus={e=>e.currentTarget.select()} onChange={e=>onChange(e.target.value)} onKeyDown={e=>{if(e.key==='Escape'&&!busy){e.stopPropagation();onCancel();}}}/></label>{error&&<p role="alert">{error}</p>}<div><button className="text-button" disabled={busy||!value.trim()}>Enregistrer le titre</button><button type="button" className="text-button" disabled={busy} onClick={onCancel}>Annuler</button></div></form>;
}
export function InlineCreate({kind,title,onTitle,busy,onCancel,onCreate}:{kind:EditorialKind;title:string;onTitle:(title:string)=>void;busy:boolean;onCancel:()=>void;onCreate:(title:string)=>Promise<void>}) {
 const [error,setError]=useState(''),input=useRef<HTMLInputElement>(null);
 useEffect(()=>{input.current?.focus();},[]);
 return <form className="inline-create" aria-label={'Créer '+names[kind]} onSubmit={e=>{e.preventDefault();setError('');void onCreate(title.trim()).catch(e=>setError((e as Error).message));}}>
  <label>Titre<input ref={input} required maxLength={200} value={title} disabled={busy} onChange={e=>onTitle(e.target.value)} onKeyDown={e=>{if(e.key==='Escape'&&!busy){e.stopPropagation();onCancel();}}}/></label>
  {error&&<p role="alert">{error}</p>}<div><button type="submit" className="button" disabled={busy||!title.trim()}>{busy?'Création…':'Créer'}</button><button type="button" className="text-button" disabled={busy} onClick={onCancel}>Annuler</button></div>
 </form>;
}
export function PanelResize({side,value,onChange}:{side:'plan'|'context';value:number;onChange:(value:number)=>void}) {
 const start=useRef<{x:number;value:number}|null>(null),min=side==='plan'?240:280,max=side==='plan'?320:360;
 const update=(n:number)=>onChange(Math.min(max,Math.max(min,Math.round(n))));
 return <div className={'panel-resize resize-'+side} role="separator" tabIndex={0} aria-label={side==='plan'?'Largeur du plan':'Largeur de l’inspecteur'} aria-orientation="vertical" aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} aria-valuetext={value+' pixels'} onKeyDown={e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();update(value+(e.key==='ArrowRight'?8:-8)*(side==='plan'?1:-1));}else if(e.key==='Home'||e.key==='End'){e.preventDefault();update(e.key==='Home'?min:max);}}} onPointerDown={e=>{if(e.button!==0)return;start.current={x:e.clientX,value};e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={e=>{if(start.current)update(start.current.value+(e.clientX-start.current.x)*(side==='plan'?1:-1));}} onPointerUp={e=>{start.current=null;e.currentTarget.releasePointerCapture(e.pointerId);}} onPointerCancel={()=>{start.current=null;}}><span/></div>;
}
export function LayoutControls({layout,onChange}:{layout:WorkshopLayout;onChange:(next:WorkshopLayout)=>void}) {
 return <details className="workshop-layout-options"><summary>Disposition</summary><div><label>Largeur du plan<input aria-label="Largeur du plan en pixels" type="range" min={240} max={320} step={8} value={layout.planWidth} onChange={e=>onChange({...layout,planWidth:Number(e.target.value)})}/></label><label>Largeur de l’inspecteur<input aria-label="Largeur de l’inspecteur en pixels" type="range" min={280} max={360} step={8} value={layout.contextWidth} onChange={e=>onChange({...layout,contextWidth:Number(e.target.value)})}/></label><p>Tailles et panneaux mémorisés pour votre compte sur ce navigateur. Aucun texte de scène n’est conservé localement.</p></div></details>;
}
