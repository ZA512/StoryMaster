'use client';
import {useId,useRef,useState} from 'react';
import type {ReactNode} from 'react';

// The browser's top layer keeps menus outside their scroll container's clipping.
// These are ordinary links/buttons, with Tab, arrows and native Escape dismissal.
export function ActionMenu({label,children,compact=false}:{label:string;children:ReactNode;compact?:boolean}) {
 const id=useId(),trigger=useRef<HTMLButtonElement>(null),panel=useRef<HTMLDivElement>(null),[open,setOpen]=useState(false);
 const toggle=()=>{
  const p=panel.current,b=trigger.current;if(!p||!b)return;
  if(p.matches(':popover-open')){p.hidePopover();return;}
  const r=b.getBoundingClientRect();
  p.style.left=Math.max(8,Math.min(window.innerWidth-252,r.right-244))+'px';
  p.style.top=Math.min(r.bottom+4,window.innerHeight-80)+'px';
  p.showPopover();
  const height=p.getBoundingClientRect().height;
  p.style.top=Math.max(8,Math.min(r.bottom+4,window.innerHeight-height-8))+'px';
  p.querySelector<HTMLElement>('button:not(:disabled),a[href],summary,input')?.focus();
 };
 return <span className="action-menu">
  <button ref={trigger} type="button" className={'workshop-button menu-trigger'+(compact?' compact':'')} aria-label={label} aria-expanded={open} aria-controls={id} onClick={toggle}>{compact?<span aria-hidden="true">•••</span>:label}</button>
  <div ref={panel} id={id} popover="auto" className="action-menu-panel" role="group" aria-label={label} onToggle={e=>{setOpen(e.newState==='open');}} onClick={e=>{if((e.target as Element).closest('a[href],button:not([data-menu-keep-open])'))panel.current?.hidePopover();}} onKeyDown={e=>{
   if((e.target as Element).matches('input,textarea,select')||!['ArrowDown','ArrowUp','Home','End'].includes(e.key))return;
   const items=[...e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],summary')].filter(el=>el.getClientRects().length);
   const at=items.indexOf(document.activeElement as HTMLElement);if(!items.length)return;
   e.preventDefault();items[e.key==='Home'?0:e.key==='End'?items.length-1:(at+(e.key==='ArrowDown'?1:-1)+items.length)%items.length]?.focus();
  }}>{children}</div>
 </span>;
}
