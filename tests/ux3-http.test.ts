import {before,after,test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {buildApp} from '../apps/api/src/app.ts';
import {reset,close,issuer,secret,sessions} from './database.helper.ts';
import {bibleFixture,create} from './narrative.helper.ts';
before(reset);after(close);
test('HTTP UX-3 : schémas v1/v2, filiation canonique, contrôles des attributs et rejeu idempotent',async()=>{
 const app=await buildApp({databaseUrl:process.env.TEST_APP_DATABASE_URL!,issuer,clientId:'storymaster-web',publicOrigin:'http://localhost:3000',secret,local:true,port:3001,sessionSeconds:3600},{rateMax:1000});
 try{
  const f=await bibleFixture(),a=f.owner,p=f.project.id,base='/api/v1/projects/'+p,headers={cookie:`sm_session_local=${a.raw}`,origin:'http://localhost:3000','x-csrf-token':sessions.csrf(a.raw)};
  const request=async(method:'POST'|'PATCH'|'GET'|'DELETE',path:string,status:number,payload?:unknown,revision?:number,key=randomUUID())=>{const r=await app.inject({method,url:base+path,headers:{...headers,'idempotency-key':key,...(revision?{'if-match':`"r${revision}"`}:{})},...(payload?{payload}:{})});assert.equal(r.statusCode,status,method+' '+path+' '+JSON.stringify(payload)+' '+r.body);return r.json().data;};
  const elise=await request('POST','/objects',201,{typeKey:'character',schemaVersion:2,name:'Élise',attributes:{background:'Enfance au port'}}),marc=await create(a.actor,p,'character','Marc');
  await request('POST','/objects',422,{typeKey:'character',schemaVersion:1,name:'Non',attributes:{background:'Interdit en v1'}});await request('POST','/objects',422,{typeKey:'place',schemaVersion:2,name:'Non',attributes:{}});await request('PATCH','/objects/'+elise.id,422,{set:{attributes:null}},1);await request('POST','/objects',422,{typeKey:'event',schemaVersion:1,name:'Ordre contradictoire',attributes:{chronologyPosition:2,temporalExpression:{kind:'ordinal',position:3}}});
  const body={sourceRef:{id:marc.id},targetRef:{id:elise.id},sourceRevision:1,targetRevision:1,relationType:'parent_of',attributes:{parentRole:'father',parentage:'adoptive',description:'Lien déclaré par l’auteur'}},key=randomUUID(),relation=await request('POST','/relations',201,body,undefined,key);assert.deepEqual(await request('POST','/relations',201,body,undefined,key),relation);
  const fromParent=await request('GET','/objects/'+marc.id+'/relations',200),fromChild=await request('GET','/objects/'+elise.id+'/relations',200);assert.equal(fromParent.items[0].id,fromChild.items[0].id);assert.equal(fromChild.items[0].source.id,marc.id);assert.equal(fromChild.items[0].attributes.parentage,'adoptive');
  await request('POST','/relations',422,{...body,attributes:{parentRole:'invented'}});await request('POST','/relations',422,{...body,relationType:'ally_of'});await request('POST','/relations',422,{...body,sourceRef:{id:elise.id},targetRef:{id:marc.id}});
  const bases=[{id:marc.id,revision:1},{id:elise.id,revision:1}];await request('PATCH','/relations/'+relation.id,428,{set:{attributes:{...body.attributes,description:'Sans précondition'}},dependencyRevisions:bases});const updated=await request('PATCH','/relations/'+relation.id,200,{set:{attributes:{...body.attributes,description:'Description enrichie'}},dependencyRevisions:bases},1);await request('DELETE','/relations/'+relation.id,412,{dependencyRevisions:bases},1);assert.equal(updated.revision,2);assert.equal((await request('GET','/objects/'+elise.id+'/relations',200)).items.length,1);
 }finally{await app.close();}
});
