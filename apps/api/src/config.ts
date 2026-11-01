import type {MCPOAuthSettings} from '@storymaster/infrastructure';
export interface Config { mcp?:MCPOAuthSettings; databaseUrl:string; issuer:string; clientId:string; publicOrigin:string; internalOidcOrigin?:string; secret:string; local:boolean; port:number; sessionSeconds:number;invitationTtlSeconds?:number;ai?:{enabled:boolean;activeVersion:string;keyring:Record<string,string>} }
export function configFromEnv(env:NodeJS.ProcessEnv=process.env):Config {
  const required=(name:string) => {const value=env[name];if (!value) throw new Error(`Configuration requise : ${name}`);return value;};
  const publicOrigin=required('PUBLIC_ORIGIN'),issuer=required('OIDC_ISSUER'),secret=required('SESSION_SECRET');
  if (new URL(publicOrigin).origin!==publicOrigin || secret.length<32) throw new Error('Origine publique ou secret de session invalide.');
  const invitationTtlSeconds=Number(env.INVITATION_TTL_SECONDS??172800);if(!Number.isInteger(invitationTtlSeconds)||invitationTtlSeconds<300||invitationTtlSeconds>604800)throw new Error('Durée d’invitation invalide.');
  const local=env.APP_ENV==='local';
  const port=Number(env.PORT ?? 3001),sessionSeconds=Number(env.SESSION_SECONDS ?? 28800);
  if (!Number.isInteger(port) || port<1 || port>65535 || !Number.isInteger(sessionSeconds) || sessionSeconds<60 || sessionSeconds>604800) throw new Error('Port ou durée de session invalide.');
  if (!local && (new URL(publicOrigin).protocol!=='https:' || new URL(issuer).protocol!=='https:' || secret.includes('local-only'))) throw new Error('Configuration de production sécurisée requise.');
  let ai:Config['ai'];if(env.AI_SIMULATION_ENABLED==='true'){if(!local)throw new Error('Phase A IA : simulateur réservé à l’environnement local.');let keyring:Record<string,string>;try{keyring=JSON.parse(required('AI_KEYRING_JSON'));}catch{throw new Error('Configuration du chiffrement IA invalide.');}ai={enabled:true,keyring,activeVersion:required('AI_ACTIVE_KEY_VERSION')};}
  let mcp:MCPOAuthSettings|undefined;if(env.MCP_ENABLED==='true'){if(!local)throw Error('MCP Lot 6 réservé au local.');mcp={local,issuer,resource:'http://localhost:3500/mcp',resourceClientId:'http://localhost:3500/mcp',resourceClientSecret:required('MCP_RESOURCE_CLIENT_SECRET'),allowedClientIds:['storymaster-mcp-cli','storymaster-mcp-secondary'],internalOrigin:env.OIDC_INTERNAL_ORIGIN};}
  return {mcp,ai,invitationTtlSeconds,databaseUrl:required('DATABASE_URL'),publicOrigin,issuer,secret,clientId:env.OIDC_CLIENT_ID ?? 'storymaster-web',internalOidcOrigin:env.OIDC_INTERNAL_ORIGIN || undefined,local,port,sessionSeconds};
}
