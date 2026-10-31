import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SessionProvider } from '../components/session';
import './globals.css';
import {DraftUnloadGuard} from '../components/writer/unload-guard';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:{default:'StoryMaster — Votre atelier d’écriture',template:'%s · StoryMaster'},description:'Votre espace privé pour vos projets littéraires.'};
export default function RootLayout({children}:{children:ReactNode}) {return <html lang="fr"><body><SessionProvider><DraftUnloadGuard/>{children}</SessionProvider></body></html>;}
