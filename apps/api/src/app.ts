import {registerAI} from './ai.ts';
import {registerProposals} from './proposals.ts';
import {registerCollaboration,invitationCookie} from './collaboration.ts';
import {registerNarrative} from './narrative.ts';
import { randomUUID } from 'node:crypto';
import type { Writable } from 'node:stream';
import Fastify from 'fastify';
import type { FastifyRequest } from 'fastify';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import { AppError } from '@storymaster/domain';
import { IdentityService, ProjectService,EditorialService,NarrativeService,CollaborationService,ProposalService,AIAssistantService,AIOrchestrator } from '@storymaster/application';
import { createProjectSchema,updateProjectSchema,listProjectsSchema,idempotencyKeySchema,emptyBodySchema } from '@storymaster/contracts';
import { Pool,PostgresUnitOfWork,SessionStore,OidcProvider,assertApplicationSchema,EnvelopeCredentialCipher,LocalAIProvider } from '@storymaster/infrastructure';
import type { Session,LoginSecret } from '@storymaster/infrastructure';
import { registerEditorial } from './editorial.ts';
import type {ProviderAdapter} from '@storymaster/application';
import type { Config } from './config.ts';

declare module 'fastify' { interface FastifyRequest { session:Session|null } }
export async function buildApp(config:Config, options:{logStream?:Writable;rateMax?:number;aiAdapter?:ProviderAdapter;aiWorker?:boolean}={}) {
  const pool=new Pool({connectionString:config.databaseUrl,max:20,connectionTimeoutMillis:5000});
  try{await assertApplicationSchema(pool);}catch(e){await pool.end();throw e;}
  const db=new PostgresUnitOfWork(pool),projects=new ProjectService(db,config.secret),identities=new IdentityService(db,config.issuer);
  const sessions=new SessionStore(pool,config.secret,config.sessionSeconds);
  const provider=new OidcProvider({issuer:config.issuer,clientId:config.clientId,publicOrigin:config.publicOrigin,internalOrigin:config.internalOidcOrigin,local:config.local});
  const app=Fastify({bodyLimit:32768,genReqId:()=>randomUUID(),logger:{level:'info',...(options.logStream ? {stream:options.logStream} : {}),redact:['req.headers.authorization','req.headers.cookie','res.headers.set-cookie'],serializers:{req(req){return {method:req.method,path:String(req.url).split('?')[0]};},res(res){return {statusCode:res.statusCode};}}}});
  pool.on('error',()=>app.log.warn({code:'DATABASE_CONNECTION_LOST'},'Connexion inactive à la base interrompue'));
  await app.register(cookie);
  await app.register(rateLimit,{max:options.rateMax ?? 300,timeWindow:'1 minute',hook:'preHandler',keyGenerator:req=>req.session?.actor.userId ?? req.ip});
  app.decorateRequest('session',null);
  const secure=!config.local, sessionCookie=secure ? '__Host-sm_session' : 'sm_session_local',loginCookie=secure ? '__Host-sm_login' : 'sm_login_local';
  const invitationOptions={origin:config.publicOrigin,local:config.local,seal:(value:string)=>sessions.seal(value),unseal:(value:string)=>sessions.unseal(value)};
  const cookieOptions={path:'/',httpOnly:true,secure,sameSite:'lax' as const};
  app.addHook('onRequest',async(req,reply)=>{
    reply.header('X-Correlation-ID',req.id).header('Cache-Control','private, no-store').header('X-Content-Type-Options','nosniff').header('Referrer-Policy','no-referrer');
    if (req.url.startsWith('/api/')) {
      req.session=await sessions.read(req.cookies[sessionCookie]);
      if (!['GET','HEAD','OPTIONS'].includes(req.method)) {
        if (req.headers.origin!==config.publicOrigin || !sessions.validCsrf(req.session.rawToken,req.headers['x-csrf-token'])) throw new AppError('FORBIDDEN','La vérification de sécurité a échoué. Rechargez la page.',403);
      }
    }
  });
  app.setErrorHandler((error,req,reply)=>{
    const known=error instanceof AppError;
    const status=error && typeof error==='object' && 'statusCode' in error ? error.statusCode : undefined;
    const e=known ? error : error instanceof Error && error.name==='ZodError' ? new AppError('VALIDATION_FAILED','Les paramètres de la demande ne sont pas valides.',422) : status===429 ? new AppError('RATE_LIMITED','Trop de demandes. Réessayez dans un instant.',429) : status===400 || status===413 || status===415 ? new AppError('VALIDATION_FAILED','Le corps de la demande n’est pas valide.',status) : new AppError('INTERNAL_ERROR','Une erreur est survenue.',500);
    app.log.warn({code:e.code,correlationId:req.id},'Requête refusée ou échouée');
    reply.code(e.status).send({error:{code:e.code,message:e.message,correlationId:req.id,retryable:e.status===503 || e.status===429,...(e.details ? {details:e.details} : {})}});
  });
  app.setNotFoundHandler((req,reply)=>reply.code(404).send({error:{code:'NOT_FOUND',message:'Ressource introuvable.',correlationId:req.id,retryable:false}}));
  const actor=(req:FastifyRequest)=>{if (!req.session) throw new AppError('UNAUTHENTICATED','Veuillez vous connecter.',401);return req.session.actor;};
  const expected=(req:FastifyRequest)=>{
    const tag=req.headers['if-match'];
    if (!tag) throw new AppError('PRECONDITION_REQUIRED','Une révision est requise.',428);
    const match=typeof tag==='string' ? /^"r([1-9][0-9]*)"$/.exec(tag) : null;
    if (!match || !Number.isSafeInteger(Number(match[1]))) throw new AppError('VALIDATION_FAILED','Révision invalide.',422);
    return Number(match[1]);
  };
  const key=(req:FastifyRequest,required=true)=>{
    const value=req.headers['idempotency-key'];
    if (!required && value===undefined) return undefined;
    if (value===undefined) throw new AppError('VALIDATION_FAILED','Une clé d’idempotence est requise.',400);
    return idempotencyKeySchema.parse(value);
  };
  app.get('/health/live',async()=>({status:'ok'}));
  app.get('/health/ready',async()=>{await pool.query('SELECT 1');return {status:'ready'};});
  app.get('/auth/login',{config:{rateLimit:{max:10,timeWindow:'1 minute'}}},async(_req,reply)=>{
    const login=await provider.start(),pending=await sessions.beginLogin(login.secret);
    reply.setCookie(loginCookie,pending,{...cookieOptions,maxAge:600});
    return reply.redirect(login.url);
  });
  app.get('/auth/callback',async(req,reply)=>{
    reply.clearCookie(loginCookie,cookieOptions);
    try {
      const login=JSON.parse(await sessions.consumeLogin(req.cookies[loginCookie])) as LoginSecret;
      const callback=new URL(config.publicOrigin+'/auth/callback');
      callback.search=new URL(req.url,'http://internal').search;
      const verified=await provider.complete(callback,login);
      const user=await identities.signIn(verified.identity,req.id);
      const token=await sessions.create(user,req.id,verified.idToken,verified.identity.email);
      reply.setCookie(sessionCookie,token,{...cookieOptions,maxAge:config.sessionSeconds});
      return reply.redirect(config.publicOrigin+(invitationCookie(invitationOptions).read(req)?'/rejoindre':'/projets'));
    } catch {
      app.log.warn({code:'OIDC_CALLBACK_REJECTED',correlationId:req.id},'Connexion refusée');
      return reply.redirect(config.publicOrigin+'/connexion?erreur=connexion');
    }
  });
  app.get('/api/v1/me',async req=>{
    actor(req); const s=req.session!;
    return {data:{user:{id:s.user.id,displayName:s.user.displayName,email:s.verifiedEmail??s.user.email,emailVerified:!!s.verifiedEmail},csrfToken:sessions.csrf(s.rawToken),expiresAt:s.expiresAt}};
  });
  app.post('/api/v1/session/logout',async(req,reply)=>{
    emptyBodySchema.parse(req.body); actor(req);
    const token=await sessions.revoke(req.session!,req.id);
    reply.clearCookie(sessionCookie,cookieOptions);
    const redirectUrl=await provider.logout(token).catch(()=>config.publicOrigin+'/connexion?deconnecte=1');
    return {data:{redirectUrl}};
  });
  app.get('/api/v1/projects',async req=>{const query=listProjectsSchema.parse(req.query);return {data:await projects.list(actor(req),query.limit,query.cursor)};});
  app.post('/api/v1/projects',async(req,reply)=>{
    const result=await projects.create(actor(req),createProjectSchema.parse(req.body),key(req)!,req.id);
    reply.code(201).header('ETag',`"r${result.revision}"`);return {data:result};
  });
  app.get<{Params:{projectId:string}}>('/api/v1/projects/:projectId',async(req,reply)=>{
    const result=await projects.get(actor(req),req.params.projectId);reply.header('ETag',`"r${result.revision}"`);return {data:result};
  });
  app.patch<{Params:{projectId:string}}>('/api/v1/projects/:projectId',async(req,reply)=>{
    const input=updateProjectSchema.parse(req.body);
    const result=await projects.update(actor(req),req.params.projectId,input.set,expected(req),key(req,false),req.id);
    reply.header('ETag',`"r${result.revision}"`);return {data:result};
  });
  for (const [route,status] of [['archive','archived'],['restore','active']] as const) {
    app.post<{Params:{projectId:string}}>(`/api/v1/projects/:projectId/${route}`,async(req,reply)=>{
      emptyBodySchema.parse(req.body);
      const result=await projects.changeStatus(actor(req),req.params.projectId,status,expected(req),key(req)!,req.id);
      reply.header('ETag',`"r${result.revision}"`);return {data:result};
    });
  }
  const editorial=new EditorialService(db);
  await registerEditorial(app,editorial,{actor,key,expected});
  await registerNarrative(app,new NarrativeService(db,config.secret),editorial,{actor,key,expected});
  await registerProposals(app,new ProposalService(db,config.secret),{actor,key});
  await registerCollaboration(app,new CollaborationService(db,config.secret,{publicOrigin:config.publicOrigin,invitationTtlSeconds:config.invitationTtlSeconds}),{actor,key,expected},invitationOptions);
  const ai=new AIAssistantService(db,config.secret,config.ai?.enabled?new EnvelopeCredentialCipher(config.ai.keyring,config.ai.activeVersion):null,!!config.ai?.enabled);
  await registerAI(app,ai,{actor,key,expected});
  const orchestrator=config.ai?.enabled?new AIOrchestrator(ai,options.aiAdapter??new LocalAIProvider()):null;
  if(options.aiWorker!==false)orchestrator?.start();
  app.addHook('onClose',async()=>{await orchestrator?.close();await pool.end();});
  return app;
}
