import { before,after,test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Writable } from 'node:stream';
import { spawnSync } from 'node:child_process';
import { AppError,roles } from '@storymaster/domain';
import { projectSchema } from '@storymaster/contracts';
import { migrate,sha256 } from '@storymaster/infrastructure';
import { buildApp } from '../apps/api/src/app.ts';
import { configFromEnv } from '../apps/api/src/config.ts';
import { admin,pool,db,projects,identities,sessions,person,reset,close,correlation,issuer,secret } from './database.helper.ts';
before(reset); after(close);
const code=(expected:string)=>(error:unknown)=>error instanceof AppError && error.code===expected;

test('migrations rejouables, empreinte protégée, rôle applicatif non privilégié',async()=>{
  await migrate(admin);
  assert.equal((await admin.query('SELECT count(*) FROM schema_migrations')).rows[0].count,'14');
  const role=(await pool.query('SELECT rolsuper,rolcreaterole,rolcreatedb,rolbypassrls FROM pg_roles WHERE rolname=current_user')).rows[0];
  assert.deepEqual(Object.values(role),[false,false,false,false]);
  await assert.rejects(pool.query('DELETE FROM audit_events'),{code:'42501'});
  await assert.rejects(pool.query('UPDATE project_revisions SET revision=revision'),{code:'42501'});
  await admin.query("UPDATE schema_migrations SET checksum='changed' WHERE name='0001-foundations'");
  await assert.rejects(migrate(admin),/autre empreinte/);
  // Restauration de l'empreinte d'origine, sans modifier le fichier de migration.
  const {readFile}=await import('node:fs/promises');
  await admin.query('UPDATE schema_migrations SET checksum=$1 WHERE name=\'0001-foundations\'',[sha256(await readFile(new URL('../packages/infrastructure/migrations/0001-foundations.sql',import.meta.url),'utf8'))]);
});
test('identité par issuer+subject, même email distinct, concurrence sans compte orphelin',async()=>{
  const subject=randomUUID(), a=await person(subject),b=await person(subject),c=await person();
  assert.equal(a.user.id,b.user.id);assert.notEqual(a.user.id,c.user.id);
  const subject2=randomUUID(), users=await Promise.all(Array.from({length:5},()=>identities.signIn({issuer,subject:subject2,displayName:'Concurrent',email:null},correlation())));
  assert.equal(new Set(users.map(u=>u.id)).size,1);
  await assert.rejects(identities.signIn({issuer:'https://evil.example',subject,displayName:'Faux',email:null},correlation()),code('UNAUTHENTICATED'));
  await admin.query("UPDATE app_users SET status='suspended' WHERE id=$1",[c.user.id]);
  await assert.rejects(sessions.read(c.raw),code('UNAUTHENTICATED'));
  await assert.rejects(identities.signIn({issuer,subject:(await admin.query('SELECT subject FROM external_identities WHERE user_id=$1',[c.user.id])).rows[0].subject,displayName:'Suspendu',email:null},correlation()),code('UNAUTHENTICATED'));
});
test('création privée atomique : owner, snapshot, audit, plusieurs projets et DTO strict',async()=>{
  const a=await person();
  const p=await projects.create(a.actor,{name:'  Premier roman  '},randomUUID(),correlation());
  projectSchema.parse(p);assert.equal(p.name,'Premier roman');assert.equal(p.visibility,'private');assert.equal(p.role,'owner');assert.equal(p.revision,1);
  assert.equal((await admin.query('SELECT role FROM project_memberships WHERE project_id=$1 AND user_id=$2',[p.id,a.user.id])).rows[0].role,'owner');
  assert.equal((await admin.query('SELECT count(*) FROM project_revisions WHERE project_id=$1',[p.id])).rows[0].count,'1');
  assert.equal((await admin.query('SELECT action FROM audit_events WHERE project_id=$1',[p.id])).rows[0].action,'project.created');
  await projects.create(a.actor,{name:'Autre projet'},randomUUID(),correlation());
  const page=await projects.list(a.actor,1);assert.equal(page.items.length,1);assert.equal(page.hasMore,true);
  const next=await projects.list(a.actor,1,page.nextCursor!);assert.equal(next.items.length,1);assert.notEqual(next.items[0]!.id,page.items[0]!.id);
  const b=await person();await assert.rejects(projects.list(b.actor,1,page.nextCursor!),code('VALIDATION_FAILED'));
  await assert.rejects(projects.list(a.actor,1,page.nextCursor!+'X'),code('VALIDATION_FAILED'));
});
test('isolation : introuvable identique, rôle centralisé pour les cinq rôles, refus IA',async()=>{
  const owner=await person(),p=await projects.create(owner.actor,{name:'Titre confidentiel'},randomUUID(),correlation()),stranger=await person();
  for(const id of [p.id,randomUUID()]) await assert.rejects(projects.get(stranger.actor,id),code('NOT_FOUND'));
  await assert.rejects(projects.update(stranger.actor,p.id,{name:'Vol'},1,undefined,correlation()),code('NOT_FOUND'));
  assert.equal((await projects.list(stranger.actor,20)).items.length,0);
  for(const role of roles.filter(r=>r!=='owner')) {
    const member=await person();await admin.query('INSERT INTO project_memberships(project_id,user_id,role) VALUES ($1,$2,$3)',[p.id,member.user.id,role]);
    const current=await projects.get(member.actor,p.id);assert.equal(current.role,role);
    if(role==='admin') assert.equal((await projects.update(member.actor,p.id,{description:'Admin'},current.revision,undefined,correlation())).revision,current.revision+1);
    else await assert.rejects(projects.update(member.actor,p.id,{name:'Interdit'},current.revision,undefined,correlation()),code('FORBIDDEN'));
  }
  for(const type of ['integrated_ai','external_ai','system'] as const) {
    await assert.rejects(projects.get({...owner.actor,type},p.id),code('FORBIDDEN'));
    await assert.rejects(projects.create({...owner.actor,type},{name:'Interdit'},randomUUID(),correlation()),code('FORBIDDEN'));
  }
});
test('contraintes relationnelles, propriétaire unique obligatoire et FK',async()=>{
  const a=await person(),b=await person(),p=await projects.create(a.actor,{name:'Contraintes'},randomUUID(),correlation());
  await assert.rejects(admin.query("INSERT INTO project_memberships(project_id,user_id,role) VALUES ($1,$2,'owner')",[p.id,b.user.id]),{code:'23505'});
  await assert.rejects(admin.query("UPDATE project_memberships SET role='reader' WHERE project_id=$1 AND user_id=$2",[p.id,a.user.id]),{code:'23514'});
  await assert.rejects(admin.query('INSERT INTO projects(id,owner_id,name) VALUES ($1,$2,$3)',[randomUUID(),a.user.id,'Sans owner']),{code:'23514'});
  await assert.rejects(admin.query("INSERT INTO project_memberships(project_id,user_id,role) VALUES ($1,$2,'reader')",[randomUUID(),b.user.id]),{code:'23503'});
  await assert.rejects(admin.query("UPDATE projects SET visibility='public' WHERE id=$1",[p.id]),{code:'23514'});
});
test('échec owner : rollback projet, snapshot, audit et idempotence',async()=>{
  const a=await person(),before=(await admin.query('SELECT count(*) FROM projects')).rows[0].count;
  await admin.query("CREATE FUNCTION test_fail_owner() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected owner failure'; END $$; CREATE TRIGGER test_fail_owner BEFORE INSERT ON project_memberships FOR EACH ROW EXECUTE FUNCTION test_fail_owner()");
  try {await assert.rejects(projects.create(a.actor,{name:'Échec atomique'},randomUUID(),correlation()),/injected owner failure/);}
  finally {await admin.query('DROP TRIGGER test_fail_owner ON project_memberships; DROP FUNCTION test_fail_owner()');}
  assert.equal((await admin.query('SELECT count(*) FROM projects')).rows[0].count,before);
  assert.equal((await admin.query('SELECT count(*) FROM audit_events WHERE actor_user_id=$1 AND project_id IS NOT NULL',[a.user.id])).rows[0].count,'0');
});
test('échec audit : rollback metadata et snapshot ; retry possible avec même clé',async()=>{
  const a=await person(),p=await projects.create(a.actor,{name:'Avant'},randomUUID(),correlation()),key=randomUUID();
  await admin.query("CREATE FUNCTION test_fail_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action='project.updated' THEN RAISE EXCEPTION 'injected audit failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER test_fail_audit BEFORE INSERT ON audit_events FOR EACH ROW EXECUTE FUNCTION test_fail_audit()");
  try {await assert.rejects(projects.update(a.actor,p.id,{name:'Après'},1,key,correlation()),/injected audit failure/);}
  finally {await admin.query('DROP TRIGGER test_fail_audit ON audit_events; DROP FUNCTION test_fail_audit()');}
  assert.equal((await projects.get(a.actor,p.id)).name,'Avant');
  assert.equal((await admin.query('SELECT count(*) FROM project_revisions WHERE project_id=$1',[p.id])).rows[0].count,'1');
  assert.equal((await projects.update(a.actor,p.id,{name:'Après'},1,key,correlation())).revision,2);
});
test('idempotence concurrente durable et clé réutilisée avec corps différent',async()=>{
  const a=await person(),key=randomUUID();
  const results=await Promise.all(Array.from({length:8},()=>projects.create(a.actor,{name:'Unique'},key,correlation())));
  assert.equal(new Set(results.map(p=>p.id)).size,1);
  await assert.rejects(projects.create(a.actor,{name:'Autre'},key,correlation()),code('IDEMPOTENCY_KEY_REUSED'));
  const p=results[0]!,updateKey=randomUUID();
  const updates=await Promise.all(Array.from({length:4},()=>projects.update(a.actor,p.id,{name:'Unique modifié'},1,updateKey,correlation())));
  assert.ok(updates.every(p=>p.revision===2));
  assert.equal((await admin.query('SELECT count(*) FROM project_revisions WHERE project_id=$1',[p.id])).rows[0].count,'2');
});
test('concurrence CAS : une écriture gagne, aucune perte silencieuse, historique contigu',async()=>{
  const a=await person(),p=await projects.create(a.actor,{name:'Concurrence'},randomUUID(),correlation());
  const results=await Promise.allSettled(Array.from({length:8},(_,i)=>projects.update(a.actor,p.id,{name:`Écriture ${i}`},1,undefined,correlation())));
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  assert.ok(results.filter(r=>r.status==='rejected').every(r=>r.reason instanceof AppError && r.reason.code==='REVISION_CONFLICT'));
  assert.equal((await projects.get(a.actor,p.id)).revision,2);
  assert.deepEqual((await admin.query('SELECT revision FROM project_revisions WHERE project_id=$1 ORDER BY revision',[p.id])).rows.map(r=>r.revision),['1','2']);
});
test('archivage et réactivation non destructifs, révisions et état contrôlé',async()=>{
  const a=await person(),p=await projects.create(a.actor,{name:'À conserver'},randomUUID(),correlation());
  const archived=await projects.changeStatus(a.actor,p.id,'archived',1,randomUUID(),correlation());assert.equal(archived.status,'archived');
  await assert.rejects(projects.update(a.actor,p.id,{name:'Interdit'},2,undefined,correlation()),code('INVALID_STATE_TRANSITION'));
  const restored=await projects.changeStatus(a.actor,p.id,'active',2,randomUUID(),correlation());assert.equal(restored.name,p.name);assert.equal(restored.revision,3);
});
test('session expirée, révoquée, cookie altéré et transaction de login consommable une fois',async()=>{
  const a=await person();await sessions.revoke(a,correlation());
  await assert.rejects(sessions.read(a.raw),code('UNAUTHENTICATED'));
  await assert.rejects(projects.create(a.actor,{name:'Révoquée'},randomUUID(),correlation()),code('UNAUTHENTICATED'));
  const b=await person();await admin.query("UPDATE sessions SET expires_at=now()-interval '1 second' WHERE token_hash=$1",[b.actor.sessionHash]);
  await assert.rejects(sessions.read(b.raw),code('UNAUTHENTICATED'));
  await assert.rejects(sessions.read('forged'),code('UNAUTHENTICATED'));
  const pending=await sessions.beginLogin({nonce:'secret-nonce',verifier:'secret-verifier'});
  assert.ok(!(await admin.query('SELECT secret_cipher FROM login_transactions WHERE token_hash=$1',[sha256(pending)])).rows[0].secret_cipher.includes('secret'));
  assert.equal(JSON.parse(await sessions.consumeLogin(pending)).nonce,'secret-nonce');
  await assert.rejects(sessions.consumeLogin(pending),code('UNAUTHENTICATED'));
});
test('révocation pendant attente du verrou projet : revalidation avant écriture',async()=>{
  const a=await person(),p=await projects.create(a.actor,{name:'Barrière'},randomUUID(),correlation()),blocker=await admin.connect();
  try {
    await blocker.query('BEGIN');await blocker.query('SELECT id FROM projects WHERE id=$1 FOR UPDATE',[p.id]);
    const pending=projects.update(a.actor,p.id,{name:'Ne doit pas passer'},1,undefined,correlation());
    // Observation PostgreSQL de l'attente effective, sans supposer une durée de transaction.
    let waiting=false;
    for(let i=0;i<100;i++) {if((await pool.query("SELECT 1 FROM pg_stat_activity WHERE usename=current_user AND wait_event_type='Lock'")).rowCount){waiting=true;break;}await new Promise(r=>setTimeout(r,10));}
    assert.ok(waiting);await sessions.revoke(a,correlation());await blocker.query('COMMIT');
    await assert.rejects(pending,code('UNAUTHENTICATED'));
    assert.equal((await admin.query('SELECT revision FROM projects WHERE id=$1',[p.id])).rows[0].revision,'1');
  } finally {await blocker.query('ROLLBACK');blocker.release();}
});
test('API réelle : erreurs normalisées, CSRF, preconditions, DTO, logs sans secrets',async()=>{
  const logs:string[]=[],stream=new Writable({write(chunk,_encoding,next){logs.push(String(chunk));next();}});
  const app=await buildApp({databaseUrl:process.env.TEST_APP_DATABASE_URL!,issuer,clientId:'storymaster-web',publicOrigin:'http://localhost:3000',secret,local:true,port:3001,sessionSeconds:3600},{logStream:stream,rateMax:1000});
  try {
    const a=await person(),b=await person(),headers={cookie:`sm_session_local=${a.raw}`,origin:'http://localhost:3000','x-csrf-token':sessions.csrf(a.raw),'idempotency-key':randomUUID()};
    assert.equal((await app.inject({url:'/api/v1/projects'})).statusCode,401);
    const me=await app.inject({url:'/api/v1/me',headers});assert.equal(me.json().data.user.id,a.user.id);assert.equal(me.json().data.csrfToken,headers['x-csrf-token']);
    assert.equal((await app.inject({method:'POST',url:'/api/v1/projects',headers:{...headers,origin:'https://evil.example'},payload:{name:'Vol'}})).statusCode,403);
    assert.equal((await app.inject({method:'POST',url:'/api/v1/projects',headers:{...headers,'x-csrf-token':'forged'},payload:{name:'Vol'}})).statusCode,403);
    assert.equal((await app.inject({method:'POST',url:'/api/v1/projects',headers,payload:{name:'Vol',role:'owner',ownerId:b.user.id}})).statusCode,422);
    const created=await app.inject({method:'POST',url:'/api/v1/projects',headers,payload:{name:'Private-canary-secret-title'}});assert.equal(created.statusCode,201);const p=projectSchema.parse(created.json().data);assert.equal(created.headers.etag,'"r1"');
    const denied=await app.inject({url:`/api/v1/projects/${p.id}`,headers:{cookie:`sm_session_local=${b.raw}`}});assert.equal(denied.statusCode,404);assert.ok(!denied.body.includes(p.name));
    assert.equal((await app.inject({method:'PATCH',url:`/api/v1/projects/${p.id}`,headers,payload:{set:{name:'Nouveau'}}})).statusCode,428);
    const changed=await app.inject({method:'PATCH',url:`/api/v1/projects/${p.id}`,headers:{...headers,'if-match':'"r1"'},payload:{set:{name:'Nouveau'}}});assert.equal(changed.statusCode,200);assert.equal(changed.json().data.revision,2);
    const stale=await app.inject({method:'PATCH',url:`/api/v1/projects/${p.id}`,headers:{...headers,'if-match':'"r1"','idempotency-key':randomUUID()},payload:{set:{name:'Écrasement'}}});assert.equal(stale.statusCode,412);
    assert.equal((await app.inject({method:'POST',url:'/api/v1/projects',headers:{...headers,'content-type':'application/json'},payload:'{bad'})).statusCode,400);
    assert.equal((await app.inject({method:'POST',url:'/api/v1/projects',headers,payload:{name:'x'.repeat(40000)}})).statusCode,413);
    const querySecret='CANARY-query-token';await app.inject({url:`/health/live?code=${querySecret}`,headers:{authorization:'Bearer CANARY-authorization'}});
    const logout=await app.inject({method:'POST',url:'/api/v1/session/logout',headers,payload:{}});assert.equal(logout.statusCode,200);assert.match(String(logout.headers['set-cookie']),/HttpOnly/);
    assert.equal((await app.inject({url:'/api/v1/me',headers})).statusCode,401);
    assert.match(String(created.headers['x-correlation-id']),/^[0-9a-f-]{36}$/);assert.equal(created.headers['cache-control'],'private, no-store');
    const observations=[
      {path:'/me',method:'get',status:me.statusCode,body:me.json()},
      {path:'/projects',method:'post',status:created.statusCode,body:created.json()},
      {path:'/projects/{projectId}',method:'get',status:denied.statusCode,body:denied.json()},
      {path:'/projects/{projectId}',method:'patch',status:changed.statusCode,body:changed.json()},
      {path:'/projects/{projectId}',method:'patch',status:stale.statusCode,body:stale.json()},
      {path:'/session/logout',method:'post',status:logout.statusCode,body:logout.json()},
    ];
    const validation=spawnSync(process.env.DOCUMENT_PYTHON ?? 'python3',['scripts/validate_runtime_contracts.py'],{input:JSON.stringify(observations),encoding:'utf8'});
    assert.equal(validation.status,0,validation.stderr);
    for(const sensitive of [a.raw,headers['x-csrf-token'],querySecret,'CANARY-authorization',p.name]) assert.ok(!logs.join('').includes(sensitive),`Secret absent des logs : ${sensitive.slice(0,5)}`);
  } finally {await app.close();}
});
test('configuration fail closed hors local et durée de session bornée',()=>{
  const env={DATABASE_URL:'postgres://unused',PUBLIC_ORIGIN:'http://localhost:3000',OIDC_ISSUER:issuer,SESSION_SECRET:secret};
  assert.throws(()=>configFromEnv(env),/sécurisée/);
  assert.throws(()=>configFromEnv({...env,APP_ENV:'local',SESSION_SECONDS:'NaN'}),/durée/);
});
test('barrière de transaction : défaillance après verrou libère la connexion et les verrous',async()=>{
  const a=await person(),p=await projects.create(a.actor,{name:'Libération'},randomUUID(),correlation());
  await assert.rejects(db.transaction(async tx=>{await tx.lockProject(p.id);throw new Error('intentional rollback');}),/intentional/);
  assert.equal((await projects.update(a.actor,p.id,{description:'Après rollback'},1,undefined,correlation())).revision,2);
});
test('rôle modifié pendant attente du verrou : autorisation relue après barrière',async()=>{
  const owner=await person(),member=await person(),p=await projects.create(owner.actor,{name:'Droits frais'},randomUUID(),correlation());
  await admin.query("INSERT INTO project_memberships(project_id,user_id,role) VALUES ($1,$2,'admin')",[p.id,member.user.id]);
  const blocker=await admin.connect();
  try {
    await blocker.query('BEGIN');await blocker.query('SELECT id FROM projects WHERE id=$1 FOR UPDATE',[p.id]);
    const pending=projects.update(member.actor,p.id,{name:'Ancien admin'},1,undefined,correlation());
    let waiting=false;
    for(let i=0;i<100;i++){if((await pool.query("SELECT 1 FROM pg_stat_activity WHERE usename=current_user AND wait_event_type='Lock'")).rowCount){waiting=true;break;}await new Promise(r=>setTimeout(r,10));}
    assert.ok(waiting);await blocker.query("UPDATE project_memberships SET role='reader',revision=revision+1 WHERE project_id=$1 AND user_id=$2",[p.id,member.user.id]);await blocker.query('COMMIT');
    await assert.rejects(pending,code('FORBIDDEN'));
    assert.equal((await projects.get(owner.actor,p.id)).revision,1);
  } finally {await blocker.query('ROLLBACK');blocker.release();}
});
test('démarrage : schéma attendu vérifié en lecture seule par le rôle applicatif',async()=>{
 const {assertApplicationSchema}=await import('@storymaster/infrastructure');await assertApplicationSchema(pool);const row=(await admin.query('SELECT checksum FROM schema_migrations WHERE name=$1',['0007-schema-readiness'])).rows[0];try{await admin.query("UPDATE schema_migrations SET checksum='incorrect' WHERE name=$1",['0007-schema-readiness']);await assert.rejects(assertApplicationSchema(pool),/Schéma applicatif incomplet/);}finally{await admin.query('UPDATE schema_migrations SET checksum=$2 WHERE name=$1',['0007-schema-readiness',row.checksum]);}await assertApplicationSchema(pool);
});
