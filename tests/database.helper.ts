import {mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import { randomUUID } from 'node:crypto';
import { Pool,migrate,PostgresUnitOfWork,SessionStore } from '@storymaster/infrastructure';
import { IdentityService,ProjectService } from '@storymaster/application';
const epochDirectory=await mkdtemp(join(tmpdir(),'storymaster-test-epoch-'));
export const epochPath=join(epochDirectory,'authorization-epoch.json');
export const testEpoch={format:'storymaster-authorization-epoch',version:1,instanceId:randomUUID(),epoch:randomUUID(),state:'active'};
await writeFile(epochPath,JSON.stringify(testEpoch),{mode:0o600});
process.env.AUTHORIZATION_EPOCH_FILE=epochPath;
process.env.EXPORT_DIRECTORY=join(epochDirectory,'exports');
export async function initializeTestEpoch(){await admin.query("INSERT INTO runtime_authorization_state(singleton,instance_id,epoch,state) VALUES(true,$1,$2,'active') ON CONFLICT(singleton) DO UPDATE SET instance_id=EXCLUDED.instance_id,epoch=EXCLUDED.epoch,state='active'",[testEpoch.instanceId,testEpoch.epoch]);}
export const secret='test-only-secret-at-least-thirty-two-characters';
export const issuer='http://localhost:8080/realms/storymaster';
export const correlation=()=>randomUUID();
export function testDatabaseUrl(name:string):string {
  const value=process.env[name];
  if (!value || !new URL(value).pathname.endsWith('_test')) throw new Error(`${name} doit viser une base dédiée suffixée _test.`);
  return value;
}
export const admin=new Pool({connectionString:testDatabaseUrl('TEST_DATABASE_URL'),max:12});
export const pool=new Pool({connectionString:testDatabaseUrl('TEST_APP_DATABASE_URL'),max:24});
export const db=new PostgresUnitOfWork(pool);
export const identities=new IdentityService(db,issuer);
export const projects=new ProjectService(db,secret);
export const sessions=new SessionStore(pool,secret);
let suiteLock:import('pg').PoolClient|undefined;
export async function exclusiveTestDatabase() {
  suiteLock=await admin.connect();
  await suiteLock.query("SELECT pg_advisory_lock(hashtextextended('storymaster.test-suite',0))");
}
export async function reset() {
  await exclusiveTestDatabase();
  await admin.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public');
  await migrate(admin); await migrate(admin);await initializeTestEpoch();
}
export async function person(subject:string=randomUUID()) {
  const user=await identities.signIn({issuer,subject,displayName:'Auteur de test',email:'shared@example.test'},correlation());
  const raw=await sessions.create(user,correlation());
  return {...await sessions.read(raw),raw};
}
export async function close() {
  if(suiteLock){await suiteLock.query("SELECT pg_advisory_unlock(hashtextextended('storymaster.test-suite',0))");suiteLock.release();suiteLock=undefined;}
  await Promise.all([pool.end(),admin.end()]);
}
