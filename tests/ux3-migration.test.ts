import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {migrate} from '@storymaster/infrastructure';
import {admin,exclusiveTestDatabase,initializeTestEpoch,close} from './database.helper.ts';
import {bibleFixture,create,relation,narrative,setRefs,reference} from './narrative.helper.ts';
import {fixture} from './editorial.helper.ts';
after(close);
test('UX-3 : installation Lot 7 remplie vers v2, aucun objet/texte/lien/historique réécrit et modules off conservés',async()=>{
 await exclusiveTestDatabase();await admin.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public');const client=await admin.connect(),directory=new URL('../packages/infrastructure/migrations/',import.meta.url);
 try{await client.query('BEGIN');await client.query('CREATE TABLE schema_migrations(name text PRIMARY KEY,checksum text NOT NULL,applied_at timestamptz NOT NULL DEFAULT now())');for(const file of (await readdir(directory)).filter(n=>/^\d{4}.*\.sql$/.test(n)&&n<'0015').sort()){const sql=await readFile(new URL(file,directory),'utf8');await client.query(sql);await client.query('INSERT INTO schema_migrations(name,checksum) VALUES($1,$2)',[file.slice(0,-4),createHash('sha256').update(sql).digest('hex')]);}await client.query('COMMIT');}catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
 await initializeTestEpoch();const f=await bibleFixture(),off=await fixture(),a=f.owner.actor,p=f.project.id,elise=await create(a,p,'character','Élise',{aliases:['Lise'],description:'👩🏽‍💻 Noe\u0308l',goals:['Le phare','La liberté']}),marc=await create(a,p,'character','Marc');await relation(a,p,'knows',elise,marc);await setRefs(a,p,f.s.id,[reference(elise,'present')]);
 const tables=['narrative_objects','narrative_relations','narrative_revisions','narrative_changes','scene_references','scenes','scene_revisions','module_definitions'],snapshots=new Map<string,unknown[]>(),columns=new Map<string,string>();
 for(const table of tables){const names=(await admin.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position",[table])).rows.map(r=>'"'+r.column_name+'"').join(',');columns.set(table,names);snapshots.set(table,(await admin.query(`SELECT to_jsonb(t) AS value FROM (SELECT ${names} FROM ${table}) t ORDER BY to_jsonb(t)::text`)).rows.map(r=>r.value));}
 const activations=(await admin.query('SELECT * FROM module_activations ORDER BY id')).rows;
 await migrate(admin);await migrate(admin);
 for(const table of tables){const after=(await admin.query(`SELECT to_jsonb(t) AS value FROM (SELECT ${columns.get(table)} FROM ${table}) t ORDER BY to_jsonb(t)::text`)).rows.map(r=>r.value);const before=snapshots.get(table)!;if(['narrative_revisions','narrative_changes','module_definitions'].includes(table)){for(const row of before)assert.ok(after.some(v=>JSON.stringify(v)===JSON.stringify(row)),table+' ancien enregistrement inchangé');}else assert.deepEqual(after,before,table+' intact');}
 const next=(await admin.query('SELECT * FROM module_activations ORDER BY id')).rows;
 for(const old of activations){const current=next.find(v=>v.id===old.id)!;if(old.module_key==='characters'){assert.equal(current.module_version,2);assert.equal(Number(current.revision),Number(old.revision)+1);assert.equal(current.enabled,old.enabled);const revision=(await narrative.history(old.project_id===p?a:off.owner.actor,old.project_id,'module',old.id)).items[0]!;assert.equal(revision.actor.type,'system');assert.equal(revision.action,'module.schema_upgraded');}else assert.deepEqual(current,old);}
 assert.deepEqual((await narrative.getObject(a,p,elise.id)).attributes,elise.attributes);assert.equal((await narrative.getObject(a,p,elise.id)).schemaVersion,1);assert.equal((await narrative.modules(off.owner.actor,off.project.id)).activations.every(m=>!m.enabled),true);
 const fresh=await fixture();assert.equal((await narrative.modules(fresh.owner.actor,fresh.project.id)).activations.length,3);assert.equal((await narrative.modules(fresh.owner.actor,fresh.project.id)).activations.find(m=>m.moduleKey==='characters')!.moduleVersion,2);
});
