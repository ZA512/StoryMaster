'use client';
import Link from 'next/link';
import { usePathname,useRouter } from 'next/navigation';
import { useEffect,useState } from 'react';
import type { ReactNode } from 'react';
import { useSession } from './session';
import { api } from './api';
export function Brand(){return <span className="brand"><svg width="29" height="29" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M5 6c5-1 8 0 11 3 3-3 6-4 11-3v20c-5-1-8 0-11 3-3-3-6-4-11-3V6Z" stroke="currentColor" strokeWidth="1.7"/><path d="M16 9v19M9 12l3 1m8 0 3-1M9 17l3 1m8 0 3-1" stroke="currentColor" strokeWidth="1.5"/></svg><span>StoryMaster</span></span>;}
export function ErrorNotice({message}:{message:string}){return <div className="notice error" role="alert">{message}</div>;}
export function Shell({children}:{children:ReactNode}) {
  const {me,loading,error,reload}=useSession(),router=useRouter(),pathname=usePathname();
  const [leaving,setLeaving]=useState(false),[logoutError,setLogoutError]=useState<string|null>(null);
  useEffect(()=>{if(!loading && !me && !error)router.replace('/connexion');},[loading,me,error,router]);
  if (loading || !me) return <main className="centered" aria-busy={loading}>{error ? <><ErrorNotice message={error}/><button className="button" onClick={()=>void reload()}>Réessayer</button></> : <p role="status">Ouverture de votre atelier…</p>}</main>;
  const logout=async()=>{
    setLeaving(true);setLogoutError(null);
    try{const result=await api<{redirectUrl:string}>('/session/logout',{method:'POST',headers:{'X-CSRF-Token':me.csrfToken},body:'{}'});window.location.assign(result.redirectUrl);}
    catch(e){setLogoutError(e instanceof Error ? e.message : 'Déconnexion impossible.');setLeaving(false);}
  };
  return <div className="workspace">
    <a className="skip-link" href="#contenu">Aller au contenu</a>
    <aside className="sidebar"><Link href="/projets" className="brand-link" aria-label="StoryMaster, vos projets"><Brand/></Link><div className="sidebar-label">VOTRE ATELIER</div>
      <nav aria-label="Navigation principale"><Link aria-current={pathname.startsWith('/projets') ? 'page' : undefined} href="/projets" className="nav-link"><span aria-hidden="true">▤</span> Mes projets</Link></nav>
      <div className="privacy"><span aria-hidden="true">◇</span><div><strong>Un espace privé</strong><p>Vos projets vous appartiennent. Vous choisissez avec qui les partager.</p></div></div>
      <div className="account"><span className="avatar" aria-hidden="true">{me.user.displayName.slice(0,1)}</span><div><strong>{me.user.displayName}</strong><span>Mon espace personnel</span></div></div>
      <button className="logout" disabled={leaving} onClick={()=>void logout()}>{leaving ? 'Déconnexion…' : 'Se déconnecter'}</button>
      {logoutError && <ErrorNotice message={logoutError}/>}
    </aside><div className="main-column"><header className="topbar"><span>ATELIER D’ÉCRITURE</span><span className="private-tag">◇ &nbsp; Espace privé</span></header><main id="contenu" className="content">{children}</main><footer className="workspace-footer">StoryMaster <span>Un espace pour construire vos histoires.</span></footer></div>
  </div>;
}
