'use client';
import {useEffect,useRef,useState} from 'react';
import {Editor} from '@tiptap/core';
import {extensions,safeUrl} from '@storymaster/editor';
import type {RichDocument} from '@storymaster/domain';
import type {DraftManager} from './drafts';
export function TextEditor({manager,sceneId,epoch,editable,onCount}:{manager:DraftManager;sceneId:string;epoch:number;editable:boolean;onCount:(doc:RichDocument,generation:number)=>void}){
 const host=useRef<HTMLDivElement>(null),instance=useRef<Editor|null>(null),count=useRef(onCount);
 const [toolbar,setToolbar]=useState(0),[linkError,setLinkError]=useState('');count.current=onCount;
 useEffect(()=>{
  const state=manager.get(sceneId);if(!host.current||!state)return;
  const editor=new Editor({element:host.current,extensions:extensions(),content:state.content,editable,injectCSS:false,editorProps:{attributes:{role:'textbox','aria-label':'Texte de la scène','aria-multiline':'true',spellcheck:'true'}},onUpdate:({editor})=>{const content=editor.getJSON() as RichDocument;manager.edit(sceneId,content);count.current(content,manager.get(sceneId)!.generation);},onSelectionUpdate:()=>setToolbar(v=>v+1)});
  instance.current=editor;return()=>{instance.current=null;editor.destroy();};
 },[sceneId,epoch,manager]);
 useEffect(()=>{instance.current?.setEditable(editable);},[editable]);
 const action=(name:string,fn:(e:Editor)=>void,active?:string)=><button type="button" disabled={!editable} aria-label={name} aria-pressed={active?!!instance.current?.isActive(active):undefined} onMouseDown={e=>e.preventDefault()} onClick={()=>{const e=instance.current;if(e){fn(e);setToolbar(v=>v+1);}}}>{name}</button>;
 return <><div className="editor-toolbar" role="toolbar" aria-label="Mise en forme" data-selection={toolbar}>
 {action('Gras',e=>e.chain().focus().toggleBold().run(),'bold')}{action('Italique',e=>e.chain().focus().toggleItalic().run(),'italic')}{action('Barré',e=>e.chain().focus().toggleStrike().run(),'strike')}
 <select aria-label="Style du paragraphe" disabled={!editable} value={instance.current?.isActive('heading')?String(instance.current.getAttributes('heading').level):'0'} onChange={event=>{const level=Number(event.target.value);const e=instance.current;if(e){if(level)e.chain().focus().setHeading({level:level as 1|2|3|4|5|6}).run();else e.chain().focus().setParagraph().run();setToolbar(v=>v+1);}}}><option value="0">Paragraphe</option><option value="1">Titre 1</option><option value="2">Titre 2</option><option value="3">Titre 3</option><option value="4">Titre 4</option><option value="5">Titre 5</option><option value="6">Titre 6</option></select>
 {action('Liste',e=>e.chain().focus().toggleBulletList().run(),'bulletList')}{action('Liste numérotée',e=>e.chain().focus().toggleOrderedList().run(),'orderedList')}{action('Citation',e=>e.chain().focus().toggleBlockquote().run(),'blockquote')}
 {action('Lien',e=>{const url=window.prompt('Adresse complète du lien (https://…, http://… ou mailto:…). Vider pour retirer.',String(e.getAttributes('link').href??''));if(url===null)return;if(!url){e.chain().focus().extendMarkRange('link').unsetLink().run();setLinkError('');}else if(safeUrl(url)){e.chain().focus().extendMarkRange('link').setLink({href:url}).run();setLinkError('');}else setLinkError('Adresse de lien non autorisée.');},'link')}
 {action('Annuler',e=>e.chain().focus().undo().run())}{action('Rétablir',e=>e.chain().focus().redo().run())}
 </div>{linkError&&<p role="alert" className="notice error">{linkError}</p>}<div className="manuscript-paper" ref={host}/></>;
}
