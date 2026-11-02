import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {RichDocument} from '@storymaster/domain';
import type {SceneDto,SceneSaveAck} from '@storymaster/contracts';
import {DraftManager} from '../apps/web/components/writer/drafts.ts';
const doc=(text:string):RichDocument=>({type:'doc',content:[{type:'paragraph',content:[{type:'text',text}]}]});
const scene=(id='A',revision=1,text='Initial'):SceneDto=>({id,projectId:'P',chapterId:'C',title:id,summary:'',status:'Brouillon',archived:false,revision,contentFormatVersion:1,content:doc(text),contentHash:'hash',wordCount:1,createdAt:'2026-10-31T00:00:00Z',updatedAt:'2026-10-31T00:00:00Z',references:[]});
const ack=(id:string,revision:number):SceneSaveAck=>({id,revision,contentHash:'hash',wordCount:1,updatedAt:'2026-10-31T00:00:00Z',changeSetId:'change'});
function deferred<T>(){let resolve!:(value:T)=>void,reject!:(error:unknown)=>void;const promise=new Promise<T>((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};}
const conflict=()=>Object.assign(new Error('Conflit'),{code:'REVISION_CONFLICT'});
test('frappes regroupées par temporisation ; pas de requête par caractère',async()=>{
 let writes=0;const manager=new DraftManager({save:async(id,r)=>{writes++;return ack(id,r.expectedRevision+1);},read:async()=>scene()},15);manager.load(scene());
 for(let i=0;i<20;i++)manager.edit('A',doc('Texte '+i));assert.equal(writes,0);await new Promise(r=>setTimeout(r,40));assert.equal(writes,1);assert.equal(manager.get('A')!.phase,'saved');manager.dispose();
});
test('édition pendant une réponse lente : ancien ACK ne marque pas le nouveau texte enregistré',async()=>{
 const first=deferred<SceneSaveAck>();let calls=0;const requests:number[]=[];const manager=new DraftManager({save:async(id,r)=>{requests.push(r.expectedRevision);return ++calls===1?first.promise:ack(id,r.expectedRevision+1);},read:async()=>scene()},10000);
 manager.load(scene());manager.edit('A',doc('Premier'));const saving=manager.flush('A');manager.edit('A',doc('Dernier'));
 first.resolve(ack('A',2));await saving;assert.deepEqual(requests,[1,2]);assert.equal(manager.get('A')!.content.content[0]!.content![0]!.text,'Dernier');assert.equal(manager.get('A')!.baseRevision,3);assert.equal(manager.get('A')!.phase,'saved');manager.dispose();
});
test('réponses désordonnées entre scènes : le résultat de A ne remplace jamais B',async()=>{
 const A=deferred<SceneSaveAck>(),B=deferred<SceneSaveAck>();const manager=new DraftManager({save:(id)=>id==='A'?A.promise:B.promise,read:async id=>scene(id)},10000);
 manager.load(scene('A'));manager.edit('A',doc('A brouillon'));const writeA=manager.flush('A');manager.load(scene('B'));manager.activate('B');manager.edit('B',doc('B brouillon'));const writeB=manager.flush('B');
 B.resolve(ack('B',2));await writeB;A.resolve(ack('A',2));await writeA;assert.equal(manager.get('B')!.content.content[0]!.content![0]!.text,'B brouillon');assert.equal(manager.get('B')!.phase,'saved');assert.equal(manager.get('A'),undefined);manager.dispose();
});
test('changement de scène pendant erreur réseau : brouillon gardé, reprise avec même clé et même corps',async()=>{
 let fail=true;const sent:{key:string;content:RichDocument;revision:number}[]=[];const manager=new DraftManager({save:async(id,r)=>{sent.push({key:r.key,content:r.content,revision:r.expectedRevision});if(fail)throw new Error('Réseau');return ack(id,r.expectedRevision+1);},read:async id=>scene(id)},10000);
 manager.load(scene());manager.edit('A',doc('Premier'));assert.equal(await manager.flush('A'),false);manager.load(scene('B'));manager.activate('B');manager.edit('A',doc('Dernier'));
 fail=false;assert.equal(await manager.flush('A'),true);assert.equal(sent[0]!.key,sent[1]!.key);assert.deepEqual(sent[0]!.content,sent[1]!.content);assert.notEqual(sent[1]!.key,sent[2]!.key);assert.deepEqual(sent.map(s=>s.revision),[1,1,2]);assert.equal(manager.get('A'),undefined);manager.dispose();
});
test('412 : brouillon et distant visibles, aucune reprise automatique, résolution humaine sur base cohérente',async()=>{
 let writes=0,fail=true;const manager=new DraftManager({save:async(id,r)=>{writes++;if(fail)throw conflict();assert.equal(r.expectedRevision,5);return ack(id,6);},read:async()=>scene('A',5,'Texte serveur')},10000);
 manager.load(scene());manager.edit('A',doc('Local'));assert.equal(await manager.flush('A'),false);assert.equal(manager.get('A')!.phase,'conflict');assert.equal(manager.get('A')!.remote!.revision,5);manager.edit('A',doc('Résolution locale'));assert.equal(writes,1);
 fail=false;assert.equal(await manager.resolve('A','local'),true);assert.equal(manager.get('A')!.baseRevision,6);assert.equal(manager.get('A')!.content.content[0]!.content![0]!.text,'Résolution locale');manager.dispose();
});
test('résolution serveur explicite : adoptée sans POST, mise à jour d’éditeur identifiée',async()=>{
 let writes=0;const manager=new DraftManager({save:async()=>{writes++;throw conflict();},read:async()=>scene('A',3,'Distant')},10000);
 manager.load(scene());manager.edit('A',doc('Local'));await manager.flush('A');const epoch=manager.get('A')!.loadEpoch;await manager.resolve('A','server');assert.equal(writes,1);assert.equal(manager.get('A')!.phase,'clean');assert.ok(manager.get('A')!.loadEpoch>epoch);assert.equal(manager.get('A')!.content.content[0]!.content![0]!.text,'Distant');manager.dispose();
});
test('relecture automatique ne détruit jamais un brouillon en attente ni un conflit',async()=>{
 const manager=new DraftManager({save:async()=>{throw conflict();},read:async()=>scene('A',4,'Serveur')},10000);manager.load(scene());manager.edit('A',doc('Local'));manager.load(scene('A',2,'Nouveau distant'));assert.equal(manager.get('A')!.baseRevision,1);await manager.flush('A');manager.load(scene('A',8,'Autre'));assert.equal(manager.get('A')!.content.content[0]!.content![0]!.text,'Local');assert.equal(manager.hasPending(),true);manager.dispose();
});
test('compteur tardif d’une ancienne génération ignoré',()=>{
 const manager=new DraftManager({save:async(id,r)=>ack(id,r.expectedRevision+1),read:async()=>scene()},10000);manager.load(scene());manager.edit('A',doc('Un'));const generation=manager.get('A')!.generation;manager.edit('A',doc('Un deux trois'));manager.setWordCount('A',generation,9);assert.notEqual(manager.get('A')!.wordCount,9);manager.setWordCount('A',generation+1,3);assert.equal(manager.get('A')!.wordCount,3);manager.dispose();
});
test('Lot 2 : ACK texte conserve les références ; relecture tardive conserve brouillon et base ; résolution explicite adopte le vecteur serveur',async()=>{
 const old={id:'R',projectId:'P',sceneId:'A',objectId:'O',referenceType:'present' as const,revision:1,metadata:{}},next={...old,objectId:'N',revision:2};let fail=false;
 const manager=new DraftManager({save:async(id,r)=>{if(fail)throw conflict();return ack(id,r.expectedRevision+1);},read:async()=>({...scene('A',4,'Distant'),references:[next]})},10000);
 manager.load({...scene(),references:[old]});manager.edit('A',doc('Sauvé'));await manager.flush('A');assert.deepEqual(manager.get('A')!.references,[old]);
 manager.edit('A',doc('Brouillon'));manager.load({...scene('A',4,'Distant'),references:[next]});assert.deepEqual(manager.get('A')!.references,[old]);fail=true;await manager.flush('A');assert.deepEqual(manager.get('A')!.remote!.references,[next]);assert.deepEqual(manager.get('A')!.references,[old]);
 fail=false;await manager.resolve('A','local');assert.deepEqual(manager.get('A')!.references,[next]);assert.deepEqual(manager.get('A')!.content,doc('Brouillon'));manager.dispose();
});
test('sélection de références en mémoire : navigation entre scènes et relecture gardent le formulaire, sans bloquer le flush texte',async()=>{
 const manager=new DraftManager({save:async(id,r)=>ack(id,r.expectedRevision+1),read:async id=>scene(id)},10000),pending={view:{sceneId:'A',sceneRevision:1,items:[]},items:[]};manager.load(scene());manager.setReferenceDraft('A',pending);assert.equal(manager.hasPending(),true);assert.equal(await manager.flushAll(),true);manager.load(scene('B'));manager.activate('B');assert.deepEqual(manager.get('A')!.referenceDraft,pending);manager.load(scene('A',3));assert.deepEqual(manager.get('A')!.referenceDraft,pending);manager.setReferenceDraft('A',undefined);manager.activate('B');assert.equal(manager.get('A'),undefined);manager.dispose();
});

test('UX-2 : confirmation de déplacement et métadonnées inchangées préservent buffer, génération et epoch',()=>{
 const manager=new DraftManager({save:async(id,r)=>ack(id,r.expectedRevision+1),read:async()=>scene()},10000);const original=manager.load(scene()),epoch=original.loadEpoch;
 assert.equal(manager.acknowledgeMove('A',1,2),true);assert.equal(manager.get('A'),original);assert.equal(original.baseRevision,2);assert.equal(original.loadEpoch,epoch);
 manager.load({...scene('A',3),title:'Titre relu',chapterId:'Autre chapitre'});assert.equal(manager.get('A'),original);assert.equal(original.loadEpoch,epoch);assert.equal(original.baseRevision,3);
 manager.load(scene('A',2,'Ancienne réponse'));assert.equal(original.baseRevision,3);assert.deepEqual(original.content,doc('Initial'));
 assert.equal(manager.acknowledgeMove('A',2,3),false);manager.edit('A',doc('Brouillon'));assert.equal(manager.acknowledgeMove('A',3,4),false);assert.equal(original.baseRevision,3);manager.dispose();
});
