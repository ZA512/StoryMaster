'use client';
import Link from 'next/link';
import { useEffect,useState } from 'react';
import type { Page,ProjectDto } from '@storymaster/contracts';
import { Shell,ErrorNotice } from '../../components/shell';
import { useSession } from '../../components/session';
import { api } from '../../components/api';
const roleNames={owner:'Propriétaire',admin:'Administrateur',author:'Auteur',reviewer:'Relecteur',reader:'Lecteur'};
export default function Projects(){
 const {me}=useSession(),[projects,setProjects]=useState<ProjectDto[]>([]),[page,setPage]=useState<Page<ProjectDto>|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null);
 const load=async(cursor?:string)=>{setLoading(true);setError(null);try{const data=await api<Page<ProjectDto>>('/projects?limit=20'+(cursor ? '&cursor='+encodeURIComponent(cursor) : ''));setProjects(old=>cursor ? [...old,...data.items] : data.items);setPage(data);}catch(e){setError(e instanceof Error ? e.message : 'Chargement impossible.');}finally{setLoading(false);}};
 useEffect(()=>{if(me)void load();},[me]);
 return <Shell><div className="page-heading"><div><span className="eyebrow">VOTRE BIBLIOTHÈQUE</span><h1>Mes projets</h1><p>Des histoires à imaginer, un espace pour chacune.</p></div><Link className="button" href="/projets/nouveau"><span aria-hidden="true">＋</span> Nouveau projet</Link></div>
 {error && <><ErrorNotice message={error}/><button className="text-button" onClick={()=>void load()}>Réessayer</button></>}
 {loading && !page && <p className="loading" role="status">Chargement de vos projets…</p>}
 {!loading && !error && projects.length===0 && <section className="empty-state"><div className="empty-icon" aria-hidden="true">✧</div><span className="eyebrow">UNE PAGE BLANCHE</span><h2>Votre prochaine histoire commence ici.</h2><p>Créez votre premier projet pour lui donner un nom<br/>et poser vos premières intentions.</p><Link href="/projets/nouveau" className="button">Créer mon premier projet <span aria-hidden="true">→</span></Link><small>Privé dès sa création.</small></section>}
 {projects.length>0 && <><div className="section-line"><h2>Vos projets littéraires</h2><span>{projects.length} projet{projects.length>1 ? 's' : ''}{page?.hasMore ? ' affichés' : ''}</span></div><div className="project-grid">{projects.map((p,i)=><Link href={'/projets/'+p.id} key={p.id} className={'project-card tone-'+i%3}><div className="project-cover" aria-hidden="true"><span>{p.name.slice(0,1).toUpperCase()}</span><i/><i/><i/></div><div className="project-card-content"><div className="card-label"><span>◇ Privé</span><span>{p.status==='archived' ? 'Archivé' : roleNames[p.role]}</span></div><h3>{p.name}</h3><p>{p.description || 'Une histoire qui reste à imaginer.'}</p><div className="card-footer"><span>{new Intl.DateTimeFormat('fr',{day:'numeric',month:'short',year:'numeric'}).format(new Date(p.updatedAt))}</span><span aria-label="Ouvrir le projet">↗</span></div></div></Link>)}</div>{page?.nextCursor && <button className="button secondary load-more" disabled={loading} onClick={()=>void load(page.nextCursor!)}>{loading ? 'Chargement…' : 'Afficher la suite'}</button>}</>}
 </Shell>;
}
