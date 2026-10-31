'use client';
import { createContext,useCallback,useContext,useEffect,useState } from 'react';
import type { ReactNode } from 'react';
import type { MeDto } from '@storymaster/contracts';
import { ApiError,api } from './api';
interface State {me:MeDto|null;loading:boolean;error:string|null;reload:()=>Promise<void>}
const Context=createContext<State|null>(null);
export function SessionProvider({children}:{children:ReactNode}) {
  const [me,setMe]=useState<MeDto|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null);
  const reload=useCallback(async()=>{
    setLoading(true);setError(null);
    try{setMe(await api<MeDto>('/me'));}
    catch(e){setMe(null);if (!(e instanceof ApiError && e.code==='UNAUTHENTICATED')) setError(e instanceof Error ? e.message : 'Connexion indisponible.');}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{void reload();},[reload]);
  return <Context.Provider value={{me,loading,error,reload}}>{children}</Context.Provider>;
}
export function useSession(){const value=useContext(Context);if(!value)throw new Error('SessionProvider requis');return value;}
