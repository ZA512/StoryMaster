import type { NextRequest } from 'next/server';
// Aucun contenu métier : transport uniquement. Les règles et sessions vivent dans l'API.
// Une erreur réseau est normalisée ici pour éviter que Next ne journalise une URL OIDC avec son code.
export async function forward(request:NextRequest):Promise<Response> {
  const headers=new Headers(request.headers);
  for(const name of ['host','connection','transfer-encoding','x-forwarded-for','x-forwarded-host','x-forwarded-proto'])headers.delete(name);
  const upstream=process.env.API_INTERNAL_URL ?? 'http://localhost:3001';
  try {
    const response=await fetch(upstream+request.nextUrl.pathname+request.nextUrl.search,{
      method:request.method,headers,body:['GET','HEAD'].includes(request.method) ? undefined : request.body,
      duplex:'half',redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(15000),
    } as RequestInit & {duplex:'half'});
    const output=new Headers(response.headers);
    for(const name of ['connection','transfer-encoding','content-encoding','content-length','set-cookie'])output.delete(name);
    for(const cookie of response.headers.getSetCookie())output.append('Set-Cookie',cookie);
    return new Response(response.body,{status:response.status,headers:output});
  } catch {
    return Response.json({error:{code:'TEMPORARILY_UNAVAILABLE',message:'Le service est momentanément indisponible. Réessayez.',correlationId:crypto.randomUUID(),retryable:true}},{status:503,headers:{'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
  }
}
