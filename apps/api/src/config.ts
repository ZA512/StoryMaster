export interface Config { databaseUrl:string; issuer:string; clientId:string; publicOrigin:string; internalOidcOrigin?:string; secret:string; local:boolean; port:number; sessionSeconds:number }
export function configFromEnv(env:NodeJS.ProcessEnv=process.env):Config {
  const required=(name:string) => {const value=env[name];if (!value) throw new Error(`Configuration requise : ${name}`);return value;};
  const publicOrigin=required('PUBLIC_ORIGIN'),issuer=required('OIDC_ISSUER'),secret=required('SESSION_SECRET');
  if (new URL(publicOrigin).origin!==publicOrigin || secret.length<32) throw new Error('Origine publique ou secret de session invalide.');
  const local=env.APP_ENV==='local';
  const port=Number(env.PORT ?? 3001),sessionSeconds=Number(env.SESSION_SECONDS ?? 28800);
  if (!Number.isInteger(port) || port<1 || port>65535 || !Number.isInteger(sessionSeconds) || sessionSeconds<60 || sessionSeconds>604800) throw new Error('Port ou durée de session invalide.');
  if (!local && (new URL(publicOrigin).protocol!=='https:' || new URL(issuer).protocol!=='https:' || secret.includes('local-only'))) throw new Error('Configuration de production sécurisée requise.');
  return {databaseUrl:required('DATABASE_URL'),publicOrigin,issuer,secret,clientId:env.OIDC_CLIENT_ID ?? 'storymaster-web',internalOidcOrigin:env.OIDC_INTERNAL_ORIGIN || undefined,local,port,sessionSeconds};
}
