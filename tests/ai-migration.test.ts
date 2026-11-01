import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {migrate} from '@storymaster/infrastructure';
import {exclusiveTestDatabase,admin,pool,close,correlation} from './database.helper.ts';
import {proposalFixture,proposals,approve,key} from './proposals.helper.ts';
import {collaboration} from './collaboration.helper.ts';
import {assistant,demoKey} from './ai.helper.ts';
after(close);
test('migration 0007 remplie vers 0008 : canon, commentaires, propositions, avis, ChangeSets et audits préservés colonne par colonne',async()=>{
 await exclusiveTestDatabase();await admin.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public');await admin.query('CREATE TABLE schema_migrations(name text PRIMARY KEY,checksum text NOT NULL,applied_at timestamptz NOT NULL DEFAULT now())');
 for(const name of ['0001-foundations','0002-editorial','0003-editorial-clock','0004-narrative','0005-collaboration','0006-proposals','0007-schema-readiness']){const sql=await readFile(new URL('../packages/infrastructure/migrations/'+name+'.sql',import.meta.url),'utf8');await admin.query(sql);await admin.query('INSERT INTO schema_migrations(name,checksum) VALUES($1,$2)',[name,createHash('sha256').update(sql).digest('hex')]);}
 const f=await proposalFixture(),a=f.owner.actor,p=f.project.id,approved=await approve(f.proposal,a);await proposals.merge(a,p,approved.id,approved.proposalRevision,approved.stateVersion,key(),correlation());const pendingKey=key(),pendingBody={title:'Brouillon préexistant',description:'Conserver',operations:[],dependencyRevisions:[]},pending=await proposals.create(a,p,pendingBody,pendingKey,correlation());await collaboration.createThread(a,p,{targetType:'scene',targetId:f.s.id,body:'Discussion conservée'},key(),correlation());
 const columns=(await admin.query("SELECT table_name,column_name FROM information_schema.columns WHERE table_schema='public' AND table_name <> 'schema_migrations' ORDER BY table_name,ordinal_position")).rows,projection=new Map<string,string[]>();for(const r of columns)projection.set(r.table_name,[...(projection.get(r.table_name)??[]),r.column_name]);const capture=async()=>{const output:unknown[]=[];for(const [table,names]of projection)output.push((await admin.query(`SELECT to_jsonb(t) AS value FROM (SELECT ${names.map(n=>'"'+n+'"').join(',')} FROM "${table}") t ORDER BY to_jsonb(t)::text`)).rows);return output;},before=await capture();await migrate(admin);await migrate(admin);assert.deepEqual(await capture(),before);assert.equal((await proposals.get(a,p,pending.id)).title,pending.title);assert.equal((await proposals.create(a,p,pendingBody,pendingKey,correlation())).id,pending.id);assert.equal((await proposals.get(a,p,approved.id)).status,'merged');
 const credential=await assistant.createCredential(a,p,{provider:'local-simulator',label:'Après migration',secret:demoKey},key(),correlation()),c=await assistant.createConversation(a,p,{title:'Conversation nouvelle',credentialId:credential.id,model:'discussion-v1'},key(),correlation());assert.equal((await assistant.detail(a,p,c.id)).conversation.id,c.id);
 await assert.rejects(pool.query('DELETE FROM ai_context_plans'),/permission denied/);await assert.rejects(pool.query("UPDATE change_proposals SET ai_provider='forged' WHERE id=$1",[pending.id]),/proposal_provenance_immutable/);
});
