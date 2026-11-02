'use client';
import {useEffect,useRef,useState} from 'react';
import {Editor} from '@tiptap/core';
import {Plugin,PluginKey} from '@tiptap/pm/state';
import {Decoration,DecorationSet} from '@tiptap/pm/view';
import type {PassageHighlight} from '../collaboration/comments';
const commentHighlightKey=new PluginKey<DecorationSet>('storymaster-comment-highlight');
import {extensions,safeUrl} from '@storymaster/editor';
import type {RichDocument} from '@storymaster/domain';
import type {DraftManager} from './drafts';
export function TextEditor({manager,sceneId,epoch,editable,onCount,onComment,highlight,onReady}:{manager:DraftManager;sceneId:string;epoch:number;editable:boolean;onCount:(doc:RichDocument,generation:number)=>void;onComment?:(range:{from:number;to:number;quote:string})=>void;highlight?:PassageHighlight|null;onReady?:(target:HTMLElement)=>void}){
 const host=useRef<HTMLDivElement>(null),instance=useRef<Editor|null>(null),count=useRef(onCount),ready=useRef(onReady);
 const [toolbar,setToolbar]=useState(0),[linkError,setLinkError]=useState('');count.current=onCount;ready.current=onReady;
 useEffect(()=>{
  const state=manager.get(sceneId);if(!host.current||!state)return;
  const editor=new Editor({element:host.current,extensions:extensions(),content:state.content,editable,injectCSS:false,editorProps:{attributes:{tabindex:'0',role:'textbox','aria-label':'Texte de la scène','aria-multiline':'true','aria-readonly':String(!editable),spellcheck:'true'}},onUpdate:({editor})=>{if(!editor.isEditable)return;const content=editor.getJSON() as RichDocument;manager.edit(sceneId,content);count.current(content,manager.get(sceneId)!.generation);},onCreate:({editor})=>ready.current?.(editor.view.dom),onSelectionUpdate:()=>setToolbar(v=>v+1)});
  editor.registerPlugin(new Plugin<DecorationSet>({key:commentHighlightKey,state:{init:()=>DecorationSet.empty,apply:(tr,old)=>{const range=tr.getMeta(commentHighlightKey) as PassageHighlight|null|undefined;if(range!==undefined)return range?DecorationSet.create(tr.doc,[Decoration.inline(range.from,range.to,{class:'comment-highlight'})]):DecorationSet.empty;return tr.docChanged?DecorationSet.empty:old;}},props:{decorations:state=>commentHighlightKey.getState(state)}}));
  instance.current=editor;return()=>{instance.current=null;editor.destroy();};
 },[sceneId,epoch,manager]);
 useEffect(()=>{instance.current?.setEditable(editable,false);instance.current?.view.dom.setAttribute('aria-readonly',String(!editable));},[editable]);
 useEffect(()=>{const e=instance.current;if(!e)return;const range=highlight&&highlight.from>=0&&highlight.to<=e.state.doc.content.size?highlight:null;e.view.dispatch(e.state.tr.setMeta(commentHighlightKey,range));if(range){const dom=e.view.domAtPos(range.from).node;(dom instanceof Element?dom:dom.parentElement)?.scrollIntoView({block:'center',behavior:'smooth'});}},[highlight,sceneId,epoch]);
 const action=(name:string,fn:(e:Editor)=>void,active?:string)=><button type="button" disabled={!editable} aria-label={name} aria-pressed={active?!!instance.current?.isActive(active):undefined} onMouseDown={e=>e.preventDefault()} onClick={()=>{const e=instance.current;if(e){fn(e);setToolbar(v=>v+1);}}}>{name}</button>;
 return <>{editable&&<div className="editor-toolbar" role="toolbar" aria-label="Mise en forme" data-selection={toolbar}>
 {action('Gras',e=>e.chain().focus().toggleBold().run(),'bold')}{action('Italique',e=>e.chain().focus().toggleItalic().run(),'italic')}{action('Barré',e=>e.chain().focus().toggleStrike().run(),'strike')}
 <select aria-label="Style du paragraphe" disabled={!editable} value={instance.current?.isActive('heading')?String(instance.current.getAttributes('heading').level):'0'} onChange={event=>{const level=Number(event.target.value);const e=instance.current;if(e){if(level)e.chain().focus().setHeading({level:level as 1|2|3|4|5|6}).run();else e.chain().focus().setParagraph().run();setToolbar(v=>v+1);}}}><option value="0">Paragraphe</option><option value="1">Titre 1</option><option value="2">Titre 2</option><option value="3">Titre 3</option><option value="4">Titre 4</option><option value="5">Titre 5</option><option value="6">Titre 6</option></select>
 {action('Liste',e=>e.chain().focus().toggleBulletList().run(),'bulletList')}{action('Liste numérotée',e=>e.chain().focus().toggleOrderedList().run(),'orderedList')}{action('Citation',e=>e.chain().focus().toggleBlockquote().run(),'blockquote')}
 {action('Lien',e=>{const url=window.prompt('Adresse complète du lien (https://…, http://… ou mailto:…). Vider pour retirer.',String(e.getAttributes('link').href??''));if(url===null)return;if(!url){e.chain().focus().extendMarkRange('link').unsetLink().run();setLinkError('');}else if(safeUrl(url)){e.chain().focus().extendMarkRange('link').setLink({href:url}).run();setLinkError('');}else setLinkError('Adresse de lien non autorisée.');},'link')}
 {action('Annuler',e=>e.chain().focus().undo().run())}{action('Rétablir',e=>e.chain().focus().redo().run())}
 </div>}{onComment&&<div className="selection-tools"><button type="button" className="text-button" disabled={!instance.current||instance.current.state.selection.empty} onMouseDown={e=>e.preventDefault()} onClick={()=>{const e=instance.current;if(!e)return;const {from,to}=e.state.selection;onComment({from,to,quote:e.state.doc.textBetween(from,to,'\n','\n')});}}>Commenter la sélection</button>{!editable&&<span className="muted">Lecture seule · sélectionnez un passage pour le commenter.</span>}</div>}{linkError&&<p role="alert" className="notice error">{linkError}</p>}<div className="manuscript-paper" ref={host}/></>;
}
