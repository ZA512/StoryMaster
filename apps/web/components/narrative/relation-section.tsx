'use client';
import Link from 'next/link';
import {useRef,useState} from 'react';
import type {NarrativeObjectDto,ObjectDetail,ProjectDto,PageDto,RelationView} from '@storymaster/contracts';
import {api} from '../api';
import {ActionMenu} from '../action-menu';
import {NarrativeHistory} from './history';
import {relationSentence,otherEndpoint,parentageLabels} from './relation-presentation';
import {RelationWorkspace} from './relation-workspace';
import {RelationDetail} from './relation-detail';
import {RelationDraftForm} from './relation-form';
import {useRelationCommands} from './use-relation-commands';
export function RelationSection({projectId,object,project,detail,onRefresh,onDetail,onObject,compact=false}:{projectId:string;object:NarrativeObjectDto;project:ProjectDto|null;detail:ObjectDetail;onRefresh:()=>Promise<unknown>;onDetail:(d:PageDto<RelationView>)=>void;onObject?:(id:string)=>void;compact?:boolean}){
 const root=useRef<HTMLElement>(null),[exploring,setExploring]=useState(false),[selected,setSelected]=useState<string|null>(null),[history,setHistory]=useState<RelationView|null>(null),[moreError,setMoreError]=useState(''),[loading,setLoading]=useState(false),[showAll,setShowAll]=useState(false),commands=useRelationCommands(projectId,object.id,onRefresh);
 const canWrite=object.moduleEnabled&&object.status==='active'&&project?.status==='active'&&['owner','admin','author'].includes(project.role),rows=compact&&!showAll?detail.relations.slice(0,5):detail.relations,current=detail.relations.find(r=>r.id===selected),canChange=(r:RelationView)=>canWrite&&r.source.moduleEnabled&&r.target.moduleEnabled;
 const openObject=(id:string,name:string)=>onObject?<button type="button" className="text-button" onClick={()=>onObject(id)}>{name} →</button>:<Link className="inline-link" href={`/projets/${projectId}/bible/${id}`}>{name} →</Link>;
 const focusAdd=()=>root.current?.querySelector<HTMLButtonElement>('.relation-add')?.focus({preventScroll:true});
 const more=async()=>{if(!detail.relationsNextCursor)return;setLoading(true);setMoreError('');try{const page=await api<PageDto<RelationView>>(`/projects/${projectId}/objects/${object.id}/relations?limit=20&cursor=`+encodeURIComponent(detail.relationsNextCursor));onDetail(page);}catch(e){setMoreError((e as Error).message);}finally{setLoading(false);}};
 return <section ref={root} className={'narrative-relations relation-section'+(compact?' compact':' panel')} aria-label="Relations de la fiche"><div className="section-line"><h2>{compact?'Relations':'Relations dans votre univers'}</h2><div className="relation-actions">{object.typeKey==='character'&&<button type="button" className="text-button relation-explore" onClick={()=>setExploring(true)}>Voir ses relations</button>}{canWrite&&<button type="button" className="button secondary relation-add" disabled={!!commands.draft} onClick={()=>commands.create(object)}>Ajouter une relation</button>}</div></div>
 {commands.notice&&<p className="relation-feedback" role="status">{commands.notice}</p>}{moreError&&<p className="notice error" role="alert">{moreError}</p>}
 <ul className="relation-list">{rows.map(r=>{const other=otherEndpoint(r,object.id);return <li key={r.id}><button type="button" className="relation-select" aria-pressed={selected===r.id} onClick={()=>setSelected(r.id)}>{relationSentence(r,object.id)}{r.attributes.parentage&&r.attributes.parentage!=='unspecified'&&<span className="relation-kind">{parentageLabels[r.attributes.parentage]}</span>}<small>{r.status==='removed'?'Lien retiré':r.linkState==='module_disabled'?'Module désactivé':r.linkState==='target_archived'?'Fiche archivée':''}</small></button>{openObject(other.id,other.name)}</li>;})}</ul>
 {!rows.length&&<p className="muted">{object.typeKey==='character'?'Aucune relation déclarée. Vous pouvez commencer par un proche, un allié ou un mentor.':'Aucune relation déclarée pour cette fiche.'}</p>}
 {compact&&!showAll&&detail.relations.length>5&&<button className="text-button" onClick={()=>setShowAll(true)}>Afficher les {detail.relations.length} liens chargés</button>}{detail.hasMoreRelations&&<><p className="muted">Liste partielle : d’autres relations ne sont pas encore chargées.</p><button type="button" className="text-button" disabled={loading} onClick={()=>void more()}>Autres relations</button></>}
 {current&&<RelationDetail relation={current} pov={object.id} commands={commands} canWrite={!!canWrite} onHistory={setHistory} onClose={()=>setSelected(null)}/>}
 {!exploring&&<RelationDraftForm projectId={projectId} commands={commands} canWrite={!!canWrite} onCompleted={focusAdd}/>}
 {exploring&&<RelationWorkspace projectId={projectId} object={object} canWrite={!!canWrite} commands={commands} revisionSignal={detail.relations} onObject={onObject} onClose={()=>{setExploring(false);requestAnimationFrame(()=>root.current?.querySelector<HTMLButtonElement>('.relation-explore')?.focus({preventScroll:true}));}}/>}
 <ActionMenu compact label="Actions des relations"><button type="button" className="text-button" onClick={()=>void onRefresh().catch(e=>setMoreError((e as Error).message))}>Actualiser les relations</button></ActionMenu>
 {history&&<NarrativeHistory projectId={projectId} kind="relations" id={history.id} title={relationSentence(history,object.id)} canRestore={canChange(history)&&!commands.draft&&history.source.status==='active'&&history.target.status==='active'} onRestore={async revision=>{commands.restore(history,revision);}} onClose={()=>setHistory(null)}/>}</section>;
}
