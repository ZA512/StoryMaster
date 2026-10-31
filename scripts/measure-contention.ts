import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { writeFile,mkdir } from 'node:fs/promises';
import { cpus,totalmem,platform,release } from 'node:os';
import assert from 'node:assert/strict';
import { ProjectService } from '@storymaster/application';
import { PostgresUnitOfWork,migrate } from '@storymaster/infrastructure';
import type { Metric } from '@storymaster/infrastructure';
import { AppError } from '@storymaster/domain';
import { admin,pool,person,secret,close,exclusiveTestDatabase } from '../tests/database.helper.ts';
// Base _test obligatoire. Ne réinitialise pas les données : chaque exécution utilise de nouveaux projets.
const workers=Number(process.env.BENCH_WORKERS ?? 8),writes=Number(process.env.BENCH_WRITES ?? 20);
assert.ok(Number.isInteger(workers)&&workers>=2&&workers<=32&&Number.isInteger(writes)&&writes>=1&&writes<=200);
const quantiles=(values:number[])=>{const v=[...values].sort((a,b)=>a-b),q=(p:number)=>Number((v[Math.min(v.length-1,Math.ceil(v.length*p)-1)] ?? 0).toFixed(3));return {samples:v.length,p50:q(.5),p95:q(.95),p99:q(.99),max:q(1)};};
try {
 await exclusiveTestDatabase();
 await migrate(admin);
 const environment={date:new Date().toISOString(),node:process.version,postgres:(await admin.query('SELECT version()')).rows[0].version,os:platform()+' '+release(),cpus:cpus().length,memoryGiB:Number((totalmem()/1024**3).toFixed(1)),workers,writesPerWorker:writes};
 const results=[];
 for(const mode of ['same_project','different_projects'] as const) {
  const metrics:Metric[]=[],uow=new PostgresUnitOfWork(pool,m=>metrics.push(m)),service=new ProjectService(uow,secret),a=await person();
  const projects=await Promise.all(Array.from({length:mode==='same_project' ? 1 : workers},(_,i)=>service.create(a.actor,{name:`Contention ${mode} ${i}`},randomUUID(),randomUUID())));
  const beforeDeadlocks=Number((await admin.query('SELECT deadlocks FROM pg_stat_database WHERE datname=current_database()')).rows[0].deadlocks);
  const attempts:number[]=[],operations:number[]=[];let retries=0,failures=0;
  const start=performance.now();
  await Promise.all(Array.from({length:workers},async(_,worker)=>{
   const p=projects[mode==='same_project' ? 0 : worker]!;
   for(let i=0;i<writes;i++) {
    const operationStart=performance.now();let done=false;
    for(let retry=0;retry<workers*writes+1&&!done;retry++) {
     const current=await service.get(a.actor,p.id),attempt=performance.now();
     try {await service.update(a.actor,p.id,{description:`worker ${worker}, write ${i}`},current.revision,randomUUID(),randomUUID());done=true;}
     catch(e){if(e instanceof AppError && e.code==='REVISION_CONFLICT')retries++;else{failures++;throw e;}}
     finally{attempts.push(performance.now()-attempt);}
    }
    assert.ok(done,'Bornage des retries atteint');operations.push(performance.now()-operationStart);
   }
  }));
  const elapsed=performance.now()-start;
  const invariants=[];
  for(const p of projects) {
   const row=(await admin.query(`SELECT p.revision, (SELECT count(*) FROM project_revisions r WHERE r.project_id=p.id) AS snapshots,
    (SELECT count(*) FROM audit_events a WHERE a.project_id=p.id) AS audits,
    (SELECT count(*) FROM project_memberships m WHERE m.project_id=p.id AND m.role='owner' AND m.status='active') AS owners,
    (SELECT min(revision) FROM project_revisions r WHERE r.project_id=p.id) AS min_revision,
    (SELECT max(revision) FROM project_revisions r WHERE r.project_id=p.id) AS max_revision FROM projects p WHERE id=$1`,[p.id])).rows[0];
   const expected=1+(mode==='same_project' ? workers*writes : writes);
   for(const value of [row.revision,row.snapshots,row.audits,row.max_revision])assert.equal(Number(value),expected);
   assert.equal(Number(row.owners),1);assert.equal(Number(row.min_revision),1);
   invariants.push({revision:expected,snapshots:Number(row.snapshots),audits:Number(row.audits),owners:Number(row.owners)});
  }
  // stats PostgreSQL asynchrones : vider le snapshot statistique avant relecture.
  await admin.query('SELECT pg_stat_clear_snapshot()');
  const afterDeadlocks=Number((await admin.query('SELECT deadlocks FROM pg_stat_database WHERE datname=current_database()')).rows[0].deadlocks);
  assert.equal(afterDeadlocks-beforeDeadlocks,0);
  results.push({mode,successfulWrites:workers*writes,retries,failures,deadlocks:afterDeadlocks-beforeDeadlocks,elapsedMs:Number(elapsed.toFixed(2)),writesPerSecond:Number((workers*writes*1000/elapsed).toFixed(2)),operationMs:quantiles(operations),attemptMs:quantiles(attempts),lockWaitMs:quantiles(metrics.filter(m=>m.name==='project.lock_wait_ms').map(m=>m.value)),lockHoldMs:quantiles(metrics.filter(m=>m.name==='project.lock_hold_ms').map(m=>m.value)),invariants});
 }
 const report={environment,limits:'Qualification locale courte des métadonnées uniquement, sans scènes, sans garantie de capacité ni SLA. Temps client, réseau/pool inclus dans les latences ; verrou chronométré côté adaptateur. Spike B multi-scènes requis ultérieurement.',results};
 await mkdir('artifacts/local',{recursive:true});const target=process.env.BENCH_OUTPUT ?? 'artifacts/local/contention.json';await writeFile(target,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
} finally {await close();}
