import type { ErrorDto } from '@storymaster/contracts';
export class ApiError extends Error {
  constructor(public code:string,message:string,public correlationId?:string){super(message);}
}
export async function api<T>(path:string,init:RequestInit={}):Promise<T> {
  let response:Response;
  try {response=await fetch('/api/v1'+path,{...init,signal:init.signal??AbortSignal.timeout(20000),credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json',...init.headers}});}
  catch {throw new ApiError('NETWORK_ERROR','Connexion au service impossible. Vos modifications ne sont pas enregistrées.');}
  const result=await response.json().catch(()=>null) as {data:T}&ErrorDto|null;
  if (!response.ok) throw new ApiError(result?.error?.code ?? 'INTERNAL_ERROR',result?.error?.message ?? 'Une erreur est survenue.',result?.error?.correlationId);
  if (!result) throw new ApiError('INTERNAL_ERROR','La réponse du service est incomplète.');
  return result.data;
}
