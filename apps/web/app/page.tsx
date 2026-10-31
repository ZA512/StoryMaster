'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '../components/session';
export default function Home(){const {me,loading}=useSession(),router=useRouter();useEffect(()=>{if(!loading)router.replace(me ? '/projets' : '/connexion');},[loading,me,router]);return <main className="centered"><p role="status">Ouverture de votre espace…</p></main>;}
