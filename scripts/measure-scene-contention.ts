import {randomUUID} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {writeFile,mkdir} from 'node:fs/promises';
import {cpus,totalmem,release} from 'node:os';
import assert from 'node:assert/strict';
import {EditorialService,fingerprint} from '@storymaster/application';
import type {UnitOfWork,Transaction} from '@storymaster/application';
import {PostgresUnitOfWork,Pool,migrate} from '@storymaster/infrastructure';
import type {Metric} from '@storymaster/infrastructure';
import {admin,pool,person,projects,correlation,close,exclusiveTestDatabase,testDatabaseUrl} from '../tests/database.helper.ts';
import {normalizeDocument} from '@storymaster/editor';
import type {Actor} from '@storymaster/domain';
const summary=(input:number[])=>{const a=[...input].sort((x,y)=>x-y),q=(p:number)=>Number((a[Math.min(a.length-1,Math.ceil(a.length*p)-1)]??0).toFixed(3));return {samples:a.length,p50:q(.5),p95:q(.95),p99:q(.99),max:q(1)};};
const content=(blocks:number,worker:number,iteration:number)=>({type:'doc',content:Array.from({length:blocks},(_,i)=>({type:'paragraph',content:[{type:'text',text:`Passage ${i} — Élise retrouve Noe\u0308l 👩🏽‍💻. `},{type:'text',text:'La ville revient doucement à la lumière. '.repeat(2),marks:[{type:'italic'}]},{type:'text',text:`Auteur ${worker}, sauvegarde ${iteration}.`}]}))});
async function setup(service:EditorialService,workers:number,distinct=false){
 const members=await Promise.all(Array.from({length:workers},()=>person())),scenes:{projectId:string;sceneId:string;actor:Actor}[]=[];
 let shared:Awaited<ReturnType<typeof projects.create>>|undefined,mId:string,cId='' ;
 for(let i=0;i<workers;i++){
  const a=members[i]!;
  if(!shared||distinct){shared=await projects.create(a.actor,{name:'Qualification B fictive'},randomUUID(),correlation());mId=(await service.create(a.actor,shared.id,'manuscript',shared.id,{title:'Manuscrit de mesure',expectedStructureRevision:1},randomUUID(),correlation())).id;cId=(await service.create(a.actor,shared.id,'chapter',mId,{title:'Chapitre de mesure',expectedStructureRevision:1},randomUUID(),correlation())).id;}
  else await admin.query("INSERT INTO project_memberships(project_id,user_id,role) VALUES($1,$2,'author')",[shared.id,a.user.id]);
  const scene=await service.create(a.actor,shared.id,'scene',cId,{title:'Scène '+i,expectedStructureRevision:distinct?1:i+1},randomUUID(),correlation());scenes.push({projectId:shared.id,sceneId:scene.id,actor:a.actor});
 }
 return scenes;
}
async function invariant(scene:{projectId:string;sceneId:string},successes:number,expectedContent:unknown){const row=(await admin.query(`SELECT s.revision,s.content,s.content_hash,(SELECT count(*) FROM scene_revisions r WHERE r.project_id=s.project_id AND r.scene_id=s.id) AS snapshots,(SELECT count(*) FROM editorial_changes c WHERE c.project_id=s.project_id AND c.resource_id=s.id) AS changes,(SELECT count(*) FROM audit_events a WHERE a.project_id=s.project_id AND a.resource_id=s.id) AS audits FROM scenes s WHERE s.project_id=$1 AND s.id=$2`,[scene.projectId,scene.sceneId])).rows[0];for(const key of ['revision','snapshots','changes','audits'])assert.equal(Number(row[key]),1+successes);const normalized=normalizeDocument(expectedContent);assert.deepEqual(row.content,normalized);assert.equal(row.content_hash,fingerprint(normalized));const snapshots=(await admin.query('SELECT revision,content_snapshot,content_hash FROM scene_revisions WHERE project_id=$1 AND scene_id=$2 ORDER BY revision',[scene.projectId,scene.sceneId])).rows;assert.deepEqual(snapshots.map(r=>Number(r.revision)),Array.from({length:successes+1},(_,i)=>i+1));assert.deepEqual(snapshots.at(-1)!.content_snapshot,normalized);assert.equal(snapshots.at(-1)!.content_hash,row.content_hash);return {contentAndHashMatch:true,revisionSequenceExact:true,revision:Number(row.revision),snapshots:Number(row.snapshots),changes:Number(row.changes),audits:Number(row.audits)};}
const metrics:Metric[]=[],service=new EditorialService(new PostgresUnitOfWork(pool,m=>metrics.push(m)),'project');
try{
 await exclusiveTestDatabase();await migrate(admin);const postgres=(await admin.query('SELECT version()')).rows[0].version;
 const results=[];
 for(const strategy of ['project','scene'] as const)for(const config of [{case:'B-01',workers:2,iterations:8,blocks:8,sequential:true},{case:'B-03-1',workers:1,iterations:8,blocks:64},{case:'B-03-2',workers:2,iterations:8,blocks:64},{case:'B-03-4',workers:4,iterations:8,blocks:64},{case:'B-03-8',workers:8,iterations:8,blocks:64},{case:'B-03-16',workers:16,iterations:8,blocks:64},{case:'B-05',workers:8,iterations:8,blocks:64,distinct:true},{case:'B-03-long',workers:8,iterations:3,blocks:3000}]){
  const measured=new EditorialService(new PostgresUnitOfWork(pool,m=>metrics.push(m)),strategy),scenes=await setup(measured,config.workers,config.distinct),latencies:number[]=[],workers: {successes:number;lastIteration:number;errors:string[];elapsedMs:number;latencies:number[]}[]=scenes.map(()=>({successes:0,lastIteration:-1,errors:[],elapsedMs:0,latencies:[]}));metrics.length=0;
  const start=performance.now();const run=async(index:number)=>{const s=scenes[index]!,w=workers[index]!,began=performance.now();let revision=1;
   for(let j=0;j<config.iterations;j++){const input=content(config.blocks,index,j),t=performance.now();try{revision=(await measured.saveScene(s.actor,s.projectId,s.sceneId,input,revision,randomUUID(),correlation())).revision;w.successes++;w.lastIteration=j;}catch(e){w.errors.push(e&&typeof e==='object'&&'code' in e?String(e.code):'UNKNOWN');}const ms=performance.now()-t;latencies.push(ms);w.latencies.push(ms);}
   w.elapsedMs=performance.now()-began;
  };
  if(config.sequential)for(let i=0;i<scenes.length;i++)await run(i);else await Promise.all(scenes.map((_,i)=>run(i)));
  const elapsed=performance.now()-start,checks=await Promise.all(scenes.map((s,i)=>invariant(s,workers[i]!.successes,content(config.blocks,i,workers[i]!.lastIteration)))),rates=workers.map(w=>w.successes/Math.max(w.elapsedMs,1));
  assert.deepEqual(workers.flatMap(w=>w.errors),[]);results.push({strategy,case:config.case,workers:config.workers,writesPerWorker:config.iterations,blocks:config.blocks,jsonBytes:Buffer.byteLength(JSON.stringify(content(config.blocks,0,0))),sequential:!!config.sequential,distinctProjects:!!config.distinct,successfulWrites:workers.reduce((a,w)=>a+w.successes,0),errors:workers.flatMap(w=>w.errors),retries:0,elapsedMs:elapsed,writesPerSecond:workers.reduce((a,w)=>a+w.successes,0)*1000/elapsed,latencyMs:summary(latencies),lockWaitMs:summary(metrics.filter(m=>m.name==='project.lock_wait_ms').map(m=>m.value)),lockHoldMs:summary(metrics.filter(m=>m.name==='project.lock_hold_ms').map(m=>m.value)),sceneLockWaitMs:summary(metrics.filter(m=>m.name==='scene.lock_wait_ms').map(m=>m.value)),sceneLockHoldMs:summary(metrics.filter(m=>m.name==='scene.lock_hold_ms').map(m=>m.value)),fairnessJain:rates.reduce((a,b)=>a+b,0)**2/(rates.length*rates.reduce((a,b)=>a+b*b,0)),perWorker:workers.map(w=>({...w,latencies:summary(w.latencies)})),invariants:checks});
 }
 // B-02 : T1 tient sa barrière, T2 observée en attente PostgreSQL avant libération.
 const pair=await setup(service,2),acquired=Promise.withResolvers<void>(),releaseGate=Promise.withResolvers<void>();
 const held:UnitOfWork={transaction<T>(work:(tx:Transaction)=>Promise<T>){return new PostgresUnitOfWork(pool).transaction(tx=>work(new Proxy(tx,{get(target,key){if(key==='lockProject')return async(id:string,mode:'exclusive'|'shared'='exclusive')=>{await target.lockProject(id,mode);acquired.resolve();await releaseGate.promise;};const value=Reflect.get(target,key);return typeof value==='function'?value.bind(target):value;}})));}};
 const t1=new EditorialService(held,'project').saveScene(pair[0]!.actor,pair[0]!.projectId,pair[0]!.sceneId,content(8,0,0),1,randomUUID(),correlation());await acquired.promise;
 const secondPool=new Pool({connectionString:testDatabaseUrl('TEST_APP_DATABASE_URL'),application_name:'storymaster-b02-t2'});
 let waiting=false;let result2;
 try{const t2=new EditorialService(new PostgresUnitOfWork(secondPool),'project').saveScene(pair[1]!.actor,pair[1]!.projectId,pair[1]!.sceneId,content(8,1,0),1,randomUUID(),correlation());
  for(let i=0;i<200;i++){if((await pool.query("SELECT 1 FROM pg_stat_activity WHERE application_name='storymaster-b02-t2' AND wait_event_type='Lock'")).rowCount){waiting=true;break;}await new Promise(r=>setTimeout(r,5));}
  releaseGate.resolve();const outcomes=await Promise.all([t1,t2]);result2=outcomes.map(r=>r.revision);assert.deepEqual(result2,[2,2]);assert.ok(waiting);
 }finally{releaseGate.resolve();await secondPool.end();}
 results.push({strategy:'project',case:'B-02',observedWait:waiting,revisions:result2,invariants:await Promise.all(pair.map((s,i)=>invariant(s,1,content(8,i,0))))});
 // B-02 fine : une scène retenue n’empêche pas le commit d’une autre scène.
 const independent=await setup(service,2),entered=Promise.withResolvers<void>(),continueFirst=Promise.withResolvers<void>();
 const fineHeld:UnitOfWork={transaction<T>(work:(tx:Transaction)=>Promise<T>){return new PostgresUnitOfWork(pool).transaction(tx=>work(new Proxy(tx,{get(target,key){if(key==='editorial')return new Proxy(target.editorial,{get(store,field){if(field==='lockScene')return async(p:string,id:string)=>{await store.lockScene(p,id);entered.resolve();await continueFirst.promise;};const value=Reflect.get(store,field);return typeof value==='function'?value.bind(store):value;}});const value=Reflect.get(target,key);return typeof value==='function'?value.bind(target):value;}})));}};
 const firstFine=new EditorialService(fineHeld).saveScene(independent[0]!.actor,independent[0]!.projectId,independent[0]!.sceneId,content(8,0,0),1,randomUUID(),correlation());await entered.promise;
 let independentCommitted=false;
 try{const other=independent[1]!;assert.equal((await new EditorialService(new PostgresUnitOfWork(pool)).saveScene(other.actor,other.projectId,other.sceneId,content(8,1,0),1,randomUUID(),correlation())).revision,2);independentCommitted=true;assert.equal((await pool.query('SELECT revision FROM scenes WHERE id=$1',[independent[0]!.sceneId])).rows[0].revision,'1');}finally{continueFirst.resolve();await firstFine;}
 results.push({strategy:'scene',case:'B-02-independent',otherCommittedBeforeRelease:independentCommitted,invariants:await Promise.all(independent.map((s,i)=>invariant(s,1,content(8,i,0))))});
 // B-04 : conflit légitime de la même scène, sans reprise automatique.
 const same=(await setup(service,2)),shared=same[0]!;
 const fine=new EditorialService(new PostgresUnitOfWork(pool,m=>metrics.push(m)),'scene');
 const outcomes=await Promise.allSettled(same.map((s,i)=>fine.saveScene(s.actor,shared.projectId,shared.sceneId,content(8,i,0),1,randomUUID(),correlation())));
 const errors=outcomes.filter(r=>r.status==='rejected').map(r=>r.reason.code);assert.equal(outcomes.filter(r=>r.status==='fulfilled').length,1);assert.deepEqual(errors,['REVISION_CONFLICT']);
 results.push({strategy:'scene',case:'B-04',successes:1,expectedConflicts:errors,invariants:await invariant(shared,1,content(8,outcomes.findIndex(r=>r.status==='fulfilled'),0))});
 const report={environment:{date:new Date().toISOString(),node:process.version,postgres,cpu:cpus()[0]?.model,cpus:cpus().length,memoryGiB:totalmem()/1024**3,kernel:release(),autosaveDebounceMs:600,processModel:'Un processus Node, pools PostgreSQL, auteurs distincts ; corpus synthétique, pas de réseau distant.',transport:'Services applicatifs + PostgreSQL loopback ; JSON validé et compté côté serveur, sans mocks.'},methodology:'Enveloppe technique synthétique, rafales par auteur, une scène distincte par auteur ; aucun retry masque une erreur. Les mesures client incluent CPU/SQL, attente/détention instrumentées autour de SQL/commit. B-02 utilise une barrière explicite et observation de pg_stat_activity. B-06 propositions non implémenté.',results};
 await mkdir('artifacts/local',{recursive:true});await writeFile('artifacts/local/scene-contention.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await close();}
