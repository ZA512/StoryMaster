'use client';
import { useEffect,useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '../../components/session';
import { Brand,ErrorNotice } from '../../components/shell';
export default function Login(){
  const {me}=useSession(),router=useRouter(),[failed,setFailed]=useState(false);
  useEffect(()=>{if(me)router.replace('/projets');setFailed(new URLSearchParams(window.location.search).has('erreur'));},[me,router]);
  return <main className="login-layout"><section className="login-story"><Brand/><div className="login-heading"><span className="eyebrow">VOTRE ATELIER LITTÉRAIRE</span><h1>Chaque histoire<br/>commence par<br/><em>un espace à soi.</em></h1><p>Rassemblez vos projets. Retrouvez vos idées.<br/>Prenez le temps de construire votre œuvre.</p></div><div className="book-lines" aria-hidden="true"><span/><span/><span/><span/><span/></div><p className="login-footnote">VOTRE ÉCRITURE. VOTRE UNIVERS.</p></section><section className="login-panel"><div className="login-card"><span className="eyebrow">BIENVENUE</span><h2>Retrouvez votre atelier</h2><p>Connectez-vous pour accéder à vos projets littéraires privés.</p>{failed && <ErrorNotice message="La connexion n’a pas abouti. Veuillez réessayer."/>}<a className="button large" href="/auth/login">Se connecter <span aria-hidden="true">→</span></a><div className="login-reassurance"><span aria-hidden="true">◇</span> Vos projets restent privés par défaut.</div></div><span className="local-note">StoryMaster · Environnement local</span></section></main>;
}
