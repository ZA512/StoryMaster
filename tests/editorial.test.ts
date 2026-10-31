import {before,after,test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {AppError} from '@storymaster/domain';
import {countWords,normalizeDocument} from '@storymaster/editor';
import {richDiff} from '@storymaster/editor/diff';
import {fromDoc} from '@storymaster/editor';
import {admin,pool,person,reset,close,correlation,projects,sessions} from './database.helper.ts';
import {editorial,fixture,doc} from './editorial.helper.ts';
before(reset);after(close);
const code=(expected:string)=>(e:unknown)=>e instanceof AppError&&e.code===expected;
test('création hiérarchique privée, plusieurs manuscrits et ordre stable',async()=>{
 const f=await fixture(),{owner:a,project:p,m,c,s}=f;
 const outline=await editorial.outline(a.actor,p.id);assert.equal(outline.manuscripts.length,1);assert.equal(outline.manuscripts[0]!.chapters[0]!.scenes[0]!.id,s.id);
 assert.equal(outline.manuscripts[0]!.structureRevision,2);assert.equal(outline.manuscripts[0]!.chapters[0]!.structureRevision,2);
 const second=await editorial.create(a.actor,p.id,'manuscript',p.id,{title:'Autre livre',expectedStructureRevision:outline.structureRevision},randomUUID(),correlation());
 assert.notEqual(second.id,m.id);assert.equal((await editorial.getScene(a.actor,p.id,s.id)).chapterId,c.id);
 await assert.rejects(editorial.create(a.actor,p.id,'scene',c.id,{title:'Ancien parent',expectedStructureRevision:1},randomUUID(),correlation()),code('REVISION_CONFLICT'));
});
test('texte Unicode, marks, snapshots et compteurs serveur exacts',async()=>{
 const {owner:a,project:p,m,c,s}=await fixture(),content={type:'doc',content:[{type:'heading',attrs:{level:2},content:[{type:'text',text:'Élise revient'}]},{type:'paragraph',content:[{type:'text',text:'Noe\u0308l retrouve l’aube 👩🏽‍💻.',marks:[{type:'bold'},{type:'italic'}]}]}]};
 const ack=await editorial.saveScene(a.actor,p.id,s.id,content,1,randomUUID(),correlation());assert.equal(ack.revision,2);
 assert.deepEqual((await editorial.getScene(a.actor,p.id,s.id)).content,normalizeDocument(content));
 const history=await editorial.history(a.actor,p.id,s.id);assert.equal(history.items.length,2);assert.equal(history.items[0]!.author.id,a.user.id);
 assert.deepEqual((await editorial.revision(a.actor,p.id,s.id,2)).content,normalizeDocument(content));
 const tree=await editorial.outline(a.actor,p.id),words=countWords(content);assert.equal(tree.manuscripts[0]!.wordCount,words);assert.equal(tree.manuscripts[0]!.chapters[0]!.wordCount,words);
 assert.equal((await admin.query('SELECT count(*) FROM editorial_changes WHERE resource_id=$1',[s.id])).rows[0].count,'2');
 const json=JSON.parse((await editorial.export(a.actor,p.id,m.id,'json')).text);assert.equal(json.manuscript.wordCount,words);assert.equal(json.manuscript.chapters[0].wordCount,words);assert.equal(json.manuscript.chapters[0].id,c.id);
});
test('même texte sauvegardé : pas de révision artificielle ; retry durable',async()=>{
 const {owner:a,project:p,s}=await fixture(),key=randomUUID(),content=doc('Le texte retrouvé.');
 const first=await editorial.saveScene(a.actor,p.id,s.id,content,1,key,correlation());
 const replay=await editorial.saveScene(a.actor,p.id,s.id,content,1,key,correlation());assert.deepEqual(replay,first);
 assert.equal((await editorial.saveScene(a.actor,p.id,s.id,content,2,randomUUID(),correlation())).revision,2);
 await assert.rejects(editorial.saveScene(a.actor,p.id,s.id,doc('Autre demande'),1,key,correlation()),code('IDEMPOTENCY_KEY_REUSED'));
 assert.equal((await editorial.history(a.actor,p.id,s.id)).items.length,2);
});
test('huit sauvegardes concurrentes sur une scène : une victoire, sept conflits, brouillons non écrasés',async()=>{
 const {owner:a,project:p,s}=await fixture();
 const result=await Promise.allSettled(Array.from({length:8},(_,i)=>editorial.saveScene(a.actor,p.id,s.id,doc('Auteur '+i),1,randomUUID(),correlation())));
 assert.equal(result.filter(r=>r.status==='fulfilled').length,1);assert.ok(result.filter(r=>r.status==='rejected').every(r=>r.reason instanceof AppError&&r.reason.code==='REVISION_CONFLICT'));
 assert.equal((await editorial.getScene(a.actor,p.id,s.id)).revision,2);assert.equal((await editorial.history(a.actor,p.id,s.id)).items.length,2);
});
test('scènes indépendantes : CAS propre et absence de conflit lié au compteur projet',async()=>{
 const {owner:a,project:p,c,s}=await fixture(),other=await editorial.create(a.actor,p.id,'scene',c.id,{title:'Autre scène',expectedStructureRevision:2},randomUUID(),correlation());
 const result=await Promise.all([editorial.saveScene(a.actor,p.id,s.id,doc('Scène A'),1,randomUUID(),correlation()),editorial.saveScene(a.actor,p.id,other.id,doc('Scène B'),1,randomUUID(),correlation())]);
 assert.deepEqual(result.map(r=>r.revision),[2,2]);assert.notEqual(result[0]!.changeSetId,result[1]!.changeSetId);
});
test('déplacement de scène : identité, contenu et historique conservés, révisions structurelles contrôlées',async()=>{
 const {owner:a,project:p,m,c,s}=await fixture();await editorial.saveScene(a.actor,p.id,s.id,doc('Texte à déplacer'),1,randomUUID(),correlation());
 const c2=await editorial.create(a.actor,p.id,'chapter',m.id,{title:'Chapitre II',expectedStructureRevision:2},randomUUID(),correlation());
 const moved=await editorial.move(a.actor,p.id,'scene',s.id,{expectedRevision:2,targetParentId:c2.id,beforeId:null,expectedSourceStructureRevision:2,expectedTargetStructureRevision:1},randomUUID(),correlation());assert.equal(moved.id,s.id);assert.equal(moved.revision,3);
 const current=await editorial.getScene(a.actor,p.id,s.id);assert.equal(current.chapterId,c2.id);assert.equal(current.content.content[0]!.content![0]!.text,'Texte à déplacer');
 assert.equal((await editorial.revision(a.actor,p.id,s.id,2)).metadata.chapterId,c.id);
 const restored=await editorial.restore(a.actor,p.id,s.id,1,3,randomUUID(),correlation());assert.equal(restored.revision,4);assert.equal((await editorial.getScene(a.actor,p.id,s.id)).chapterId,c2.id);
});
test('réordonner les voisins ne modifie pas leurs révisions de texte',async()=>{
 const {owner:a,project:p,c,s}=await fixture(),second=await editorial.create(a.actor,p.id,'scene',c.id,{title:'Seconde',expectedStructureRevision:2},randomUUID(),correlation());
 await editorial.move(a.actor,p.id,'scene',second.id,{expectedRevision:1,targetParentId:c.id,beforeId:s.id,expectedSourceStructureRevision:3,expectedTargetStructureRevision:3},randomUUID(),correlation());
 const tree=await editorial.outline(a.actor,p.id);assert.deepEqual(tree.manuscripts[0]!.chapters[0]!.scenes.map(s=>s.id),[second.id,s.id]);
 assert.equal((await editorial.saveScene(a.actor,p.id,s.id,doc('Toujours r1'),1,randomUUID(),correlation())).revision,2);
});
test('déplacement chapitre entre manuscrits et ordre des manuscrits',async()=>{
 const {owner:a,project:p,m,c,s}=await fixture(),m2=await editorial.create(a.actor,p.id,'manuscript',p.id,{title:'Livre II',expectedStructureRevision:2},randomUUID(),correlation());
 await editorial.move(a.actor,p.id,'chapter',c.id,{expectedRevision:1,targetParentId:m2.id,beforeId:null,expectedSourceStructureRevision:2,expectedTargetStructureRevision:1},randomUUID(),correlation());
 await editorial.move(a.actor,p.id,'manuscript',m2.id,{expectedRevision:1,targetParentId:p.id,beforeId:m.id,expectedSourceStructureRevision:3,expectedTargetStructureRevision:3},randomUUID(),correlation());
 const tree=await editorial.outline(a.actor,p.id);assert.equal(tree.manuscripts[0]!.id,m2.id);assert.equal(tree.manuscripts[0]!.chapters[0]!.scenes[0]!.id,s.id);
});
test('restore N+1, provenance, comparaison et anciennes versions intactes',async()=>{
 const {owner:a,project:p,s}=await fixture();const A=doc('Avant',[{type:'bold'}]),B=doc('Après',[{type:'italic'}]);
 await editorial.saveScene(a.actor,p.id,s.id,A,1,randomUUID(),correlation());await editorial.saveScene(a.actor,p.id,s.id,B,2,randomUUID(),correlation());
 const pair=await editorial.compare(a.actor,p.id,s.id,2,3);assert.equal(richDiff(fromDoc(pair.before.content),fromDoc(pair.after.content)).changes[0]!.kind,'edited');
 const restored=await editorial.restore(a.actor,p.id,s.id,2,3,randomUUID(),correlation());assert.equal(restored.revision,4);
 assert.deepEqual((await editorial.getScene(a.actor,p.id,s.id)).content,normalizeDocument(A));assert.deepEqual((await editorial.revision(a.actor,p.id,s.id,3)).content,normalizeDocument(B));assert.equal((await editorial.revision(a.actor,p.id,s.id,4)).restoredFromRevision,2);
});
test('rollback après écriture et avant audit : ni texte, ni snapshot, ni changeset partiel',async()=>{
 const {owner:a,project:p,s}=await fixture();
 await admin.query("CREATE FUNCTION editorial_test_fail() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action='scene.saved' THEN RAISE EXCEPTION 'editorial_test_failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER editorial_test_fail BEFORE INSERT ON audit_events FOR EACH ROW EXECUTE FUNCTION editorial_test_fail()");
 try{await assert.rejects(editorial.saveScene(a.actor,p.id,s.id,doc('Non confirmé'),1,randomUUID(),correlation()),/editorial_test_failure/);}finally{await admin.query('DROP TRIGGER editorial_test_fail ON audit_events; DROP FUNCTION editorial_test_fail()');}
 assert.equal((await editorial.getScene(a.actor,p.id,s.id)).revision,1);assert.equal((await editorial.history(a.actor,p.id,s.id)).items.length,1);
 assert.equal((await admin.query('SELECT count(*) FROM editorial_changes WHERE resource_id=$1',[s.id])).rows[0].count,'1');
});
test('contrainte snapshot, append-only applicatif et FK de projet',async()=>{
 const {owner:a,project:p,s,c}=await fixture(),other=await fixture();
 await assert.rejects(admin.query('UPDATE scenes SET content=$1 WHERE id=$2',[JSON.stringify(doc('Sans snapshot')),s.id]),{code:'23514'});
 await assert.rejects(pool.query('UPDATE scene_revisions SET content_snapshot=content_snapshot'),{code:'42501'});
 await assert.rejects(admin.query('UPDATE scenes SET chapter_id=$1 WHERE id=$2',[other.c.id,s.id]),{code:'23503'});
 assert.equal((await editorial.getScene(a.actor,p.id,s.id)).chapterId,c.id);
});
test('isolation de chaque lecture, historique, export et écriture ; cible interprojets refusée',async()=>{
 const A=await fixture(),B=await fixture();
 for(const work of [()=>editorial.outline(B.owner.actor,A.project.id),()=>editorial.getScene(B.owner.actor,A.project.id,A.s.id),()=>editorial.history(B.owner.actor,A.project.id,A.s.id),()=>editorial.revision(B.owner.actor,A.project.id,A.s.id,1),()=>editorial.export(B.owner.actor,A.project.id,A.m.id,'json')])await assert.rejects(work(),code('NOT_FOUND'));
 await assert.rejects(editorial.getScene(A.owner.actor,A.project.id,B.s.id),code('NOT_FOUND'));
 await assert.rejects(editorial.move(A.owner.actor,A.project.id,'scene',A.s.id,{expectedRevision:1,targetParentId:B.c.id,beforeId:null,expectedSourceStructureRevision:2,expectedTargetStructureRevision:2},randomUUID(),correlation()),code('NOT_FOUND'));
});
test('permissions des cinq rôles et plafond humain ; export et archives limités',async()=>{
 const {owner:a,project:p,s,m}=await fixture();let rev=1;
 for(const role of ['admin','author','reviewer','reader'] as const){const user=await person();await admin.query('INSERT INTO project_memberships(project_id,user_id,role) VALUES($1,$2,$3)',[p.id,user.user.id,role]);assert.equal((await editorial.getScene(user.actor,p.id,s.id)).id,s.id);
  if(role==='admin'||role==='author'){rev=(await editorial.saveScene(user.actor,p.id,s.id,doc('Par '+role),rev,randomUUID(),correlation())).revision;assert.equal((await editorial.export(user.actor,p.id,m.id,'json')).format,'json');}
  else {await assert.rejects(editorial.saveScene(user.actor,p.id,s.id,doc('Interdit'),rev,randomUUID(),correlation()),code('FORBIDDEN'));await assert.rejects(editorial.export(user.actor,p.id,m.id,'markdown'),code('FORBIDDEN'));}
  if(role!=='admin')await assert.rejects(editorial.archive(user.actor,p.id,'scene',s.id,true,rev,randomUUID(),correlation()),code('FORBIDDEN'));
 }
 for(const type of ['integrated_ai','external_ai','system'] as const)await assert.rejects(editorial.saveScene({...a.actor,type},p.id,s.id,doc('IA interdite'),rev,randomUUID(),correlation()),code('FORBIDDEN'));
});
test('archiver sans détruire, réactiver, compteurs et refus des descendants archivés',async()=>{
 const {owner:a,project:p,m,c,s}=await fixture();await editorial.saveScene(a.actor,p.id,s.id,doc('Trois petits mots'),1,randomUUID(),correlation());
 await editorial.archive(a.actor,p.id,'chapter',c.id,true,1,randomUUID(),correlation());
 assert.equal((await editorial.outline(a.actor,p.id)).manuscripts[0]!.wordCount,0);assert.equal((await editorial.history(a.actor,p.id,s.id)).items.length,2);
 await assert.rejects(editorial.saveScene(a.actor,p.id,s.id,doc('Non'),2,randomUUID(),correlation()),code('INVALID_STATE_TRANSITION'));
 const json=JSON.parse((await editorial.export(a.actor,p.id,m.id,'json')).text);assert.equal(json.manuscript.chapters[0].scenes[0].content.content[0].content[0].text,'Trois petits mots');
 await editorial.archive(a.actor,p.id,'chapter',c.id,false,2,randomUUID(),correlation());assert.equal((await editorial.outline(a.actor,p.id)).manuscripts[0]!.wordCount,3);
});
test('statuts configurables, retrait utilisé refusé ; export Markdown signale les pertes',async()=>{
 const {owner:a,project:p,m,s}=await fixture();await editorial.update(a.actor,p.id,'manuscript',m.id,{expectedRevision:1,set:{writingStatuses:['Brouillon','Relu']}},randomUUID(),correlation());
 await editorial.update(a.actor,p.id,'scene',s.id,{expectedRevision:1,set:{status:'Relu'}},randomUUID(),correlation());
 await assert.rejects(editorial.update(a.actor,p.id,'manuscript',m.id,{expectedRevision:2,set:{writingStatuses:['Brouillon']}},randomUUID(),correlation()),code('INVALID_STATE_TRANSITION'));
 await editorial.saveScene(a.actor,p.id,s.id,doc(' espaces ',[{type:'bold'}]),2,randomUUID(),correlation());
 const exported=await editorial.export(a.actor,p.id,m.id,'markdown');assert.ok(exported.text.includes('**espaces**'));assert.ok(exported.warnings.length>0);
});
test('documents invalides et liens dangereux refusés sans changer le snapshot',async()=>{
 const {owner:a,project:p,s}=await fixture();
 for(const content of [{type:'doc',content:[{type:'image',attrs:{src:'https://evil.example/x'}}]},doc('lien',[{type:'link',attrs:{href:'javascript:alert(1)'}}])])await assert.rejects(editorial.saveScene(a.actor,p.id,s.id,content,1,randomUUID(),correlation()),code('VALIDATION_FAILED'));
 assert.equal((await editorial.getScene(a.actor,p.id,s.id)).revision,1);
});
test('session révoquée et projet archivé empêchent toute sauvegarde',async()=>{
 const {owner:a,project:p,s}=await fixture();await projects.changeStatus(a.actor,p.id,'archived',1,randomUUID(),correlation());
 await assert.rejects(editorial.saveScene(a.actor,p.id,s.id,doc('Non'),1,randomUUID(),correlation()),code('INVALID_STATE_TRANSITION'));await sessions.revoke(a,correlation());await assert.rejects(editorial.getScene(a.actor,p.id,s.id),code('UNAUTHENTICATED'));
});
test('barrière partagée + verrou scène : deux scènes avancent ; archivage exclusif attend le commit',async()=>{
 const {EditorialService}=await import('@storymaster/application'),{PostgresUnitOfWork}=await import('@storymaster/infrastructure');
 const f=await fixture(),other=await editorial.create(f.owner.actor,f.project.id,'scene',f.c.id,{title:'Indépendante',expectedStructureRevision:2},randomUUID(),correlation());
 const acquired=Promise.withResolvers<void>(),gate=Promise.withResolvers<void>();
 const held=new EditorialService({transaction:work=>new PostgresUnitOfWork(pool).transaction(tx=>work(new Proxy(tx,{get(target,key){if(key==='editorial')return new Proxy(target.editorial,{get(store,field){if(field==='lockScene')return async(p:string,id:string)=>{await store.lockScene(p,id);acquired.resolve();await gate.promise;};const v=Reflect.get(store,field);return typeof v==='function'?v.bind(store):v;}});const v=Reflect.get(target,key);return typeof v==='function'?v.bind(target):v;}})))});
 const first=held.saveScene(f.owner.actor,f.project.id,f.s.id,doc('Premier texte confirmé'),1,randomUUID(),correlation());await acquired.promise;
 let archive:ReturnType<typeof projects.changeStatus>|undefined;
 try{const second=await editorial.saveScene(f.owner.actor,f.project.id,other.id,doc('Autre scène indépendante'),1,randomUUID(),correlation());assert.equal(second.revision,2);assert.equal((await editorial.getScene(f.owner.actor,f.project.id,f.s.id)).revision,1);
  archive=projects.changeStatus(f.owner.actor,f.project.id,'archived',1,randomUUID(),correlation());let waiting=false;
  for(let i=0;i<100;i++){if((await pool.query("SELECT 1 FROM pg_stat_activity WHERE usename=current_user AND wait_event_type='Lock'")).rowCount){waiting=true;break;}await new Promise(r=>setTimeout(r,10));}assert.ok(waiting);
 }finally{gate.resolve();await first;if(archive)await archive;}
 await assert.rejects(editorial.saveScene(f.owner.actor,f.project.id,f.s.id,doc('Trop tard'),2,randomUUID(),correlation()),code('INVALID_STATE_TRANSITION'));assert.deepEqual((await editorial.revision(f.owner.actor,f.project.id,f.s.id,2)).content,normalizeDocument(doc('Premier texte confirmé')));
});
test('autosave en attente de barrière : rôle et session relus après révocation',async()=>{
 for(const mode of ['role','session']){const f=await fixture(),member=await person();await admin.query("INSERT INTO project_memberships(project_id,user_id,role) VALUES($1,$2,'author')",[f.project.id,member.user.id]);const blocker=await admin.connect();
  try{await blocker.query('BEGIN');await blocker.query('SELECT id FROM projects WHERE id=$1 FOR UPDATE',[f.project.id]);const pending=editorial.saveScene(member.actor,f.project.id,f.s.id,doc('Interdit après révocation'),1,randomUUID(),correlation());let waiting=false;for(let i=0;i<100;i++){if((await pool.query("SELECT 1 FROM pg_stat_activity WHERE usename=current_user AND wait_event_type='Lock'")).rowCount){waiting=true;break;}await new Promise(r=>setTimeout(r,10));}assert.ok(waiting);if(mode==='role')await blocker.query("UPDATE project_memberships SET role='reader' WHERE project_id=$1 AND user_id=$2",[f.project.id,member.user.id]);else await sessions.revoke(member,correlation());await blocker.query('COMMIT');await assert.rejects(pending,code(mode==='role'?'FORBIDDEN':'UNAUTHENTICATED'));assert.equal((await editorial.getScene(f.owner.actor,f.project.id,f.s.id)).revision,1);
  }finally{await blocker.query('ROLLBACK');blocker.release();}
 }
});
test('connexion PostgreSQL interrompue avant commit : aucune sauvegarde partielle, même clé réutilisable',async()=>{
 const {EditorialService}=await import('@storymaster/application'),{Pool,PostgresUnitOfWork}=await import('@storymaster/infrastructure');const f=await fixture(),victim=new Pool({connectionString:process.env.TEST_APP_DATABASE_URL,max:1,application_name:'storymaster-lot1-interruption'}),service=new EditorialService(new PostgresUnitOfWork(victim)),key=randomUUID(),input=doc('Texte après reprise');victim.on('error',()=>{});
 await admin.query("CREATE FUNCTION editorial_interrupt() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action='scene.saved' THEN PERFORM pg_sleep(8); END IF; RETURN NEW; END $$; CREATE TRIGGER editorial_interrupt BEFORE INSERT ON audit_events FOR EACH ROW EXECUTE FUNCTION editorial_interrupt()");
 let pending:Promise<unknown>|undefined;
 try{pending=service.saveScene(f.owner.actor,f.project.id,f.s.id,input,1,key,correlation());const rejection=assert.rejects(pending,code('TEMPORARILY_UNAVAILABLE'));let pid:number|undefined;for(let i=0;i<200;i++){pid=(await pool.query("SELECT pid FROM pg_stat_activity WHERE application_name='storymaster-lot1-interruption' AND wait_event='PgSleep'")).rows[0]?.pid;if(pid)break;await new Promise(r=>setTimeout(r,10));}assert.ok(pid);assert.equal((await pool.query('SELECT pg_terminate_backend($1) AS killed',[pid])).rows[0].killed,true);await rejection;
 }finally{await admin.query('DROP TRIGGER editorial_interrupt ON audit_events; DROP FUNCTION editorial_interrupt()');await pending?.catch(()=>{});await victim.end();}
 assert.equal((await editorial.getScene(f.owner.actor,f.project.id,f.s.id)).revision,1);assert.equal((await editorial.history(f.owner.actor,f.project.id,f.s.id)).items.length,1);assert.equal((await admin.query('SELECT count(*) FROM editorial_changes WHERE resource_id=$1',[f.s.id])).rows[0].count,'1');
 const ack=await editorial.saveScene(f.owner.actor,f.project.id,f.s.id,input,1,key,correlation());assert.equal(ack.revision,2);assert.deepEqual((await editorial.getScene(f.owner.actor,f.project.id,f.s.id)).content,normalizeDocument(input));
});
test('corpus éditorial de production : aller-retour PostgreSQL, snapshots et export JSON exacts',async()=>{
 const {readFile}=await import('node:fs/promises'),corpus=JSON.parse(await readFile(new URL('./fixtures/editorial-corpus.json',import.meta.url),'utf8')),f=await fixture();let revision=1;
 for(const content of Object.values(corpus)){const ack=await editorial.saveScene(f.owner.actor,f.project.id,f.s.id,content,revision,randomUUID(),correlation());revision=ack.revision;const normalized=normalizeDocument(content);assert.deepEqual((await editorial.getScene(f.owner.actor,f.project.id,f.s.id)).content,normalized);assert.deepEqual((await editorial.revision(f.owner.actor,f.project.id,f.s.id,revision)).content,normalized);const exported=JSON.parse((await editorial.export(f.owner.actor,f.project.id,f.m.id,'json')).text);assert.deepEqual(exported.manuscript.chapters[0].scenes[0].content,normalized);}
});
test('B-07 autosave : timeout réel de barrière explicite, aucun commit, reprise bornée avec même clé',{timeout:12000},async()=>{
 const f=await fixture(),blocker=await admin.connect(),key=randomUUID(),input=doc('Texte repris après timeout');
 try{await blocker.query('BEGIN');await blocker.query('SELECT id FROM projects WHERE id=$1 FOR UPDATE',[f.project.id]);await assert.rejects(editorial.saveScene(f.owner.actor,f.project.id,f.s.id,input,1,key,correlation()),code('TEMPORARILY_UNAVAILABLE'));assert.equal((await admin.query('SELECT revision FROM scenes WHERE id=$1',[f.s.id])).rows[0].revision,'1');assert.equal((await admin.query('SELECT count(*) FROM scene_revisions WHERE scene_id=$1',[f.s.id])).rows[0].count,'1');await blocker.query('COMMIT');
 }finally{await blocker.query('ROLLBACK');blocker.release();}
 const ack=await editorial.saveScene(f.owner.actor,f.project.id,f.s.id,input,1,key,correlation());assert.equal(ack.revision,2);assert.deepEqual(await editorial.saveScene(f.owner.actor,f.project.id,f.s.id,input,1,key,correlation()),ack);
});
