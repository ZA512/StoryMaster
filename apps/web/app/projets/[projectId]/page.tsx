'use client';
import Link from 'next/link';
import { useEffect,useRef,useState } from 'react';
import type { FormEvent } from 'react';
import { useParams } from 'next/navigation';
import type { ProjectDto } from '@storymaster/contracts';
import { Shell,ErrorNotice } from '../../../components/shell';
import { useSession } from '../../../components/session';
import { ApiError,api } from '../../../components/api';
export default function ProjectPage(){
 const {projectId}=useParams<{projectId:string}>(),{me}=useSession();
 const [project,setProject]=useState<ProjectDto|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null),[saved,setSaved]=useState(false),[pending,setPending]=useState(false),[conflict,setConflict]=useState(false);
 const [name,setName]=useState(''),[description,setDescription]=useState(''),[language,setLanguage]=useState('fr');
 const dialog=useRef<HTMLDialogElement>(null),last=useRef<{intent:string;key:string}|null>(null);
 const adopt=(p:ProjectDto)=>{setProject(p);setName(p.name);setDescription(p.description);setLanguage(p.language);};
 const load=async()=>{setLoading(true);setError(null);try{adopt(await api<ProjectDto>('/projects/'+projectId));setConflict(false);}catch(e){setProject(null);setError(e instanceof Error ? e.message : 'Chargement impossible.');}finally{setLoading(false);}};
 useEffect(()=>{if(me)void load();},[me,projectId]);
 const idempotency=(intent:string)=>{if(last.current?.intent!==intent)last.current={intent,key:crypto.randomUUID()};return last.current!.key;};
 const save=async(e:FormEvent)=>{
  e.preventDefault();if(!me || !project)return;setPending(true);setSaved(false);setError(null);
  const body=JSON.stringify({set:{name,description,language}}),intent=`update|${project.id}|${project.revision}|${body}`;
  try{const p=await api<ProjectDto>('/projects/'+project.id,{method:'PATCH',headers:{'X-CSRF-Token':me.csrfToken,'If-Match':`"r${project.revision}"`,'Idempotency-Key':idempotency(intent)},body});adopt(p);setSaved(true);setConflict(false);}
  catch(e){setError(e instanceof Error ? e.message : 'Enregistrement impossible.');setConflict(e instanceof ApiError && e.code==='REVISION_CONFLICT');}finally{setPending(false);}
 };
 const changeStatus=async()=>{
  if(!me || !project)return;setPending(true);setError(null);setSaved(false);
  const action=project.status==='active' ? 'archive' : 'restore',intent=`${action}|${project.id}|${project.revision}`;
  try{adopt(await api<ProjectDto>(`/projects/${project.id}/${action}`,{method:'POST',headers:{'X-CSRF-Token':me.csrfToken,'If-Match':`"r${project.revision}"`,'Idempotency-Key':idempotency(intent)},body:'{}'}));dialog.current?.close();setConflict(false);}
  catch(e){setError(e instanceof Error ? e.message : 'Opération impossible.');dialog.current?.close();}finally{setPending(false);}
 };
 const canEdit=project?.role==='owner' || project?.role==='admin';
 return <Shell><Link className="back-link" href="/projets">← Mes projets</Link>{loading ? <p role="status">Chargement du projet…</p> : !project ? <><ErrorNotice message={error ?? 'Ressource introuvable.'}/><button className="text-button" onClick={()=>void load()}>Réessayer</button></> : <>
 <div className="page-heading"><div><span className="eyebrow">VOTRE PROJET LITTÉRAIRE</span><h1>{project.name}</h1><p>Les premières intentions de votre histoire.</p></div><span className="status-badge">{project.status==='archived' ? 'Archivé' : 'Projet privé'}</span></div>
 <p><Link className="button" href={`/projets/${projectId}/ecriture`}>Ouvrir l’atelier d’écriture →</Link> <Link className="button secondary" href={`/projets/${projectId}/bible`}>Ouvrir la bible narrative →</Link> <Link className="button secondary" href={`/projets/${projectId}/collaborateurs`}>Collaborateurs →</Link></p><div className="form-grid"><section className="panel form-panel"><h2>À propos du projet</h2><p className="muted">Un cadre pour les idées qui viendront.</p>
 {error && <ErrorNotice message={error}/>} {conflict && <button type="button" className="text-button" onClick={()=>{if(window.confirm('Recharger les informations et abandonner vos modifications non enregistrées ?'))void load();}}>Recharger les informations</button>}
 {saved && <div className="notice success" role="status">Informations enregistrées.</div>}
 {project.status==='archived' && <div className="notice" role="status">Ce projet est archivé. Ses informations et son historique sont conservés.</div>}
 {canEdit ? <form onSubmit={e=>void save(e)}><fieldset disabled={pending || project.status==='archived'}><label htmlFor="name">Nom du projet</label><input id="name" value={name} onChange={e=>{setName(e.target.value);setSaved(false);}} maxLength={200} required/><label htmlFor="description">Une intention, un résumé</label><textarea id="description" value={description} onChange={e=>{setDescription(e.target.value);setSaved(false);}} maxLength={4000} rows={6}/><label htmlFor="language">Langue du projet</label><select id="language" value={language} onChange={e=>setLanguage(e.target.value)}><option value="fr">Français</option><option value="en">Anglais</option><option value="es">Espagnol</option><option value="de">Allemand</option><option value="it">Italien</option></select><div className="form-actions"><span className="muted">Visible uniquement par les membres.</span><button className="button" disabled={pending || !name.trim()}>{pending ? 'Enregistrement…' : 'Enregistrer'}</button></div></fieldset></form> : <dl className="project-details"><dt>Nom</dt><dd>{project.name}</dd><dt>Résumé</dt><dd>{project.description || 'Aucun résumé renseigné.'}</dd><dt>Langue</dt><dd>{project.language}</dd><dt>Votre accès</dt><dd>Consultation du projet</dd></dl>}
 </section><aside><div className="aside-note"><div className="note-symbol" aria-hidden="true">◇</div><h2>Votre projet, en privé.</h2><p>Les informations de ce projet sont réservées à ses membres.</p><dl className="project-meta"><dt>Créé le</dt><dd>{new Intl.DateTimeFormat('fr',{dateStyle:'long'}).format(new Date(project.createdAt))}</dd><dt>Dernière modification</dt><dd>{new Intl.DateTimeFormat('fr',{dateStyle:'long'}).format(new Date(project.updatedAt))}</dd></dl></div>{canEdit && <div className="archive-area"><h3>{project.status==='active' ? 'Mettre de côté' : 'Reprendre ce projet'}</h3><p>{project.status==='active' ? 'Archivez ce projet pour le conserver sans le modifier.' : 'Réactivez le projet pour pouvoir modifier ses informations.'}</p><button className="text-button" onClick={()=>dialog.current?.showModal()}>{project.status==='active' ? 'Archiver le projet' : 'Réactiver le projet'}</button></div>}</aside></div>
 <dialog ref={dialog} aria-labelledby="confirm-title"><h2 id="confirm-title">{project.status==='active' ? 'Archiver ce projet ?' : 'Réactiver ce projet ?'}</h2><p>{project.status==='active' ? 'Ses données et son historique seront conservés. Vous pourrez le réactiver.' : 'Vous pourrez à nouveau modifier ses informations.'}</p><div className="form-actions"><button className="text-button" onClick={()=>dialog.current?.close()}>Annuler</button><button className="button" disabled={pending} onClick={()=>void changeStatus()}>{pending ? 'En cours…' : project.status==='active' ? 'Archiver' : 'Réactiver'}</button></div></dialog>
 </>}</Shell>;
}
