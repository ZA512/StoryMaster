'use client';
import {Fragment,useEffect,useLayoutEffect,useRef,useState} from 'react';
import type {ReactNode} from 'react';
import type {ChapterOutline,EditorialItem,EditorialOutline,ManuscriptOutline} from '@storymaster/contracts';
import {draggable,dropTargetForElements,monitorForElements} from '@atlaskit/pragmatic-drag-and-drop/adapter/element-adapter';
import {attachClosestEdge} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge/attach-closest-edge';
import {extractClosestEdge} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge/extract-closest-edge';
import {autoScrollForElements} from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element';
import {prepareSceneMove} from './scene-move-intent';
import type {SceneMoveIntent} from './scene-move-intent';
interface Props {active:boolean;outline:EditorialOutline;manuscript:ManuscriptOutline;disabled:boolean;archived:boolean;selectedId:string;pendingId?:string;onOpen:(id:string)=>void;onRequestMove:(id:string)=>void;onCreate:(chapterId:string)=>void;onMove:(intent:SceneMoveIntent)=>void;onDragChange:(dragging:boolean)=>void;actions:(node:EditorialItem)=>ReactNode;rename:(node:EditorialItem)=>ReactNode;createForm:(chapterId:string)=>ReactNode;scroll:{left:number;columns:Map<string,number>}}
export function SceneBoard(props:Props){
 const {outline,manuscript,scroll}=props,board=useRef<HTMLDivElement>(null),latest=useRef(props),snapshot=useRef<EditorialOutline|null>(null),[dragged,setDragged]=useState(''),[announcement,setAnnouncement]=useState('');latest.current=props;
 useLayoutEffect(()=>{if(props.active&&board.current)board.current.scrollLeft=scroll.left;},[props.active,scroll]);
 useEffect(()=>{
  const el=board.current;if(!el)return;el.scrollLeft=scroll.left;
  const stopScroll=autoScrollForElements({element:el,getAllowedAxis:()=> 'horizontal',canScroll:({source})=>source.data.projectId===outline.projectId&&source.data.kind==='storymaster-scene'});
  const stopMonitor=monitorForElements({canMonitor:({source})=>source.data.projectId===outline.projectId&&source.data.kind==='storymaster-scene',onDragStart:({source})=>{snapshot.current=latest.current.outline;setDragged(String(source.data.id));latest.current.onDragChange(true);setAnnouncement('Carte saisie. Déposez-la sur un emplacement indiqué, ou appuyez sur Échap pour annuler.');},onDrop:({source,location})=>{
   setDragged('');latest.current.onDragChange(false);const target=location.current.dropTargets.find(t=>t.data.kind==='storymaster-slot'),start=snapshot.current;snapshot.current=null;
   if(!target||!start){setAnnouncement('Déplacement annulé avant dépôt.');return;}
   try{const intent=prepareSceneMove(start,String(source.data.id),String(target.data.chapterId),typeof target.data.beforeId==='string'?target.data.beforeId:null,crypto.randomUUID());if(intent)latest.current.onMove(intent);else setAnnouncement('La scène est déjà à cet emplacement.');}catch(e){setAnnouncement((e as Error).message);}
  }});
  return()=>{stopScroll();stopMonitor();};
 },[outline.projectId,manuscript.id,scroll]);
 return <section className="scene-board" aria-label="Tableau de cartes"><p id="board-drag-help" className="board-hint">Une colonne par chapitre. Ouvrez une carte pour écrire ; sa poignée ou « Déplacer vers… » permet de la réorganiser.</p><p className="sr-only" role="status" aria-live="polite">{announcement}</p><div className="board-scroll" ref={board} onScroll={e=>{if(props.active)scroll.left=e.currentTarget.scrollLeft;}}>{manuscript.chapters.filter(c=>props.archived||!c.archived).map(c=><BoardColumn key={c.id} chapter={c} {...props} dragged={dragged}/>)}</div>{!manuscript.chapters.some(c=>props.archived||!c.archived)&&<p>Ajoutez un chapitre depuis le plan pour commencer.</p>}</section>;
}
function BoardColumn({chapter,...props}:Props&{chapter:ChapterOutline;dragged:string}){
 const list=useRef<HTMLDivElement>(null),{scroll,outline}=props;
 useLayoutEffect(()=>{if(props.active&&list.current)list.current.scrollTop=scroll.columns.get(chapter.id)??0;},[props.active,chapter.id,scroll]);
 useEffect(()=>{const el=list.current;if(!el)return;el.scrollTop=scroll.columns.get(chapter.id)??0;return autoScrollForElements({element:el,getAllowedAxis:()=> 'vertical',canScroll:({source})=>source.data.projectId===outline.projectId&&source.data.kind==='storymaster-scene'});},[chapter.id,outline.projectId,scroll]);
 const scenes=chapter.scenes.filter(s=>props.archived||!s.archived),disabled=props.disabled||chapter.archived;
 return <section className="board-column" aria-label={chapter.title} data-chapter-id={chapter.id}><header><div><h2 tabIndex={-1} id={'board-chapter-'+chapter.id}>{chapter.title}</h2><span>{scenes.length} scène{scenes.length>1?'s':''}{chapter.archived?' · archivé':''}</span></div>{props.actions(chapter)}</header>{chapter.summary&&<p className="column-summary">{chapter.summary}</p>}{props.rename(chapter)}<div className="column-scenes" ref={list} onScroll={e=>{if(props.active)scroll.columns.set(chapter.id,e.currentTarget.scrollTop);}}><ol>{scenes.map((scene,index)=><Fragment key={scene.id}><li className="drop-slot-item"><DropSlot chapterId={chapter.id} beforeId={scene.id} label={'Avant '+scene.title} projectId={outline.projectId} active={!!props.dragged} disabled={disabled}/></li><li><SceneCard scene={scene} chapter={chapter} index={index} total={scenes.length} selected={props.selectedId===scene.id} dragging={props.dragged===scene.id} pending={props.pendingId===scene.id} disabled={disabled||scene.archived} projectId={outline.projectId} onOpen={props.onOpen} onRequestMove={props.onRequestMove} actions={props.actions(scene)} rename={props.rename(scene)}/></li></Fragment>)}</ol><DropSlot chapterId={chapter.id} beforeId={null} label={scenes.length?'À la fin de '+chapter.title:'Dans le chapitre vide '+chapter.title} projectId={outline.projectId} active={!!props.dragged} disabled={disabled} empty={!scenes.length}/>{!disabled&&<button id={'board-create-scene-'+chapter.id} className="text-button new-card" onClick={()=>props.onCreate(chapter.id)}>+ Nouvelle scène</button>}{props.createForm(chapter.id)}</div></section>;
}
function SceneCard({scene,chapter,index,total,selected,dragging,pending,disabled,projectId,onOpen,onRequestMove,actions,rename}:{scene:EditorialItem;chapter:ChapterOutline;index:number;total:number;selected:boolean;dragging:boolean;pending:boolean;disabled:boolean;projectId:string;onOpen:(id:string)=>void;onRequestMove:(id:string)=>void;actions:ReactNode;rename:ReactNode}){
 const card=useRef<HTMLElement>(null),handle=useRef<HTMLButtonElement>(null),[edge,setEdge]=useState<string|null>(null);
 const afterId=chapter.scenes[chapter.scenes.findIndex(s=>s.id===scene.id)+1]?.id??null;
 useEffect(()=>{
  const el=card.current,h=handle.current;if(disabled||!el||!h)return;
  const stopDrag=draggable({element:el,dragHandle:h,canDrag:()=>!disabled,getInitialData:()=>({kind:'storymaster-scene',id:scene.id,projectId})});
  const stopDrop=dropTargetForElements({element:el,canDrop:({source})=>source.data.kind==='storymaster-scene'&&source.data.projectId===projectId&&source.data.id!==scene.id,getData:({element,input})=>{
   const data=attachClosestEdge({kind:'storymaster-slot',chapterId:chapter.id},{element,input,allowedEdges:['top','bottom']});return {...data,beforeId:extractClosestEdge(data)==='bottom'?afterId:scene.id};
  },onDrag:({self})=>setEdge(extractClosestEdge(self.data)),onDragEnter:({self})=>setEdge(extractClosestEdge(self.data)),onDragLeave:()=>setEdge(null),onDrop:()=>setEdge(null)});
  return()=>{stopDrop();stopDrag();};
 },[scene.id,projectId,disabled,chapter.id,afterId]);
 return <article ref={card} className={'scene-card'+(selected?' current':'')+(dragging?' dragging':'')+(pending?' move-pending':'')+(edge?' drop-'+edge:'')} data-card-id={scene.id} aria-label={scene.title+' · '+(index+1)+' sur '+total+' · '+chapter.title} aria-busy={pending}>{edge&&<span className="card-edge-label">{edge==='top'?'Déposer avant':'Déposer après'}</span>}<div className="card-heading"><button id={'card-title-'+scene.id} aria-describedby={'card-position-'+scene.id} className="card-title" onClick={()=>onOpen(scene.id)}>{scene.title}</button>{actions}</div><span className="sr-only" id={'card-position-'+scene.id}>{index+1} sur {total}, {chapter.title}</span>{rename}{scene.summary&&<p className="card-summary">{scene.summary}</p>}<div className="card-footer"><span>{scene.archived?'Archivée':scene.status}</span><span>{scene.wordCount.toLocaleString('fr')} mots</span>{!disabled&&<button ref={handle} className="card-drag-handle" aria-label={'Déplacer '+scene.title+' par glissement'} aria-describedby="board-drag-help" title="Glisser pour déplacer ; les mêmes destinations sont dans le menu Actions" onClick={()=>onRequestMove(scene.id)}><span aria-hidden="true">⠿</span><span>Déplacer</span></button>}</div></article>;
}
function DropSlot({chapterId,beforeId,label,projectId,active,disabled,empty=false}:{chapterId:string;beforeId:string|null;label:string;projectId:string;active:boolean;disabled:boolean;empty?:boolean}){
 const slot=useRef<HTMLDivElement>(null),[over,setOver]=useState(false);
 useEffect(()=>{if(disabled||!slot.current)return;return dropTargetForElements({element:slot.current,canDrop:({source})=>source.data.kind==='storymaster-scene'&&source.data.projectId===projectId&&source.data.id!==beforeId,getData:()=>({kind:'storymaster-slot',chapterId,beforeId}),onDragEnter:()=>setOver(true),onDragLeave:()=>setOver(false),onDrop:()=>setOver(false)});},[chapterId,beforeId,projectId,disabled]);
 return <div ref={slot} className={'card-drop-slot'+(active?' active':'')+(over?' over':'')+(empty?' empty':'')} data-drop-chapter={chapterId} data-before-id={beforeId??'end'} aria-hidden="true">{over?<span>Déposer ici · {label}</span>:empty?<span>Aucune scène</span>:null}</div>;
}
