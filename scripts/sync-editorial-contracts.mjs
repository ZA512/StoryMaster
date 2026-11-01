import { readFileSync,writeFileSync } from 'node:fs';
import { isDeepStrictEqual } from 'node:util';
import YAML from 'yaml';
import { z } from 'zod';
import { createEditorialSchema,updateEditorialSchema,moveEditorialSchema,archiveEditorialSchema,saveSceneSchema,restoreSceneSchema } from '@storymaster/contracts';
const file='docs/spec/openapi.yaml',oas=YAML.parse(readFileSync(file,'utf8')),before=structuredClone(oas);
const schemas=oas.components.schemas,ref=name=>({'$ref':'#/components/schemas/'+name});
const obj=(properties,required=Object.keys(properties))=>({type:'object',properties,required,additionalProperties:false});
const integer={type:'integer',minimum:1,maximum:Number.MAX_SAFE_INTEGER},date={type:'string',format:'date-time'},id={type:'string',format:'uuid'};
for(const [name,schema] of Object.entries({EditorialCreate:createEditorialSchema,EditorialUpdate:updateEditorialSchema,EditorialMove:moveEditorialSchema,EditorialArchive:archiveEditorialSchema,SceneContentSave:saveSceneSchema,SceneRestore:restoreSceneSchema})){
 const generated=z.toJSONSchema(schema,{target:'draft-2020-12'});delete generated.$schema;schemas[name]=generated;
}
schemas.EditorialUpdate.properties.set.minProperties=1;
schemas.SceneContentSave.properties.content=ref('RichDocument');
const item=obj({kind:{enum:['manuscript','chapter','scene']},id,projectId:id,parentId:id,title:{type:'string',maxLength:200},summary:{type:'string',maxLength:4000},position:integer,revision:integer,structureRevision:{type:'integer',minimum:0},archived:{type:'boolean'},status:{type:'string',maxLength:40},writingStatuses:{type:'array',items:{type:'string',maxLength:40},maxItems:30},wordCount:{type:'integer',minimum:0},createdAt:date,updatedAt:date});
schemas.EditorialItem=item;
schemas.ChapterOutline=obj({...item.properties,scenes:{type:'array',items:ref('EditorialItem')}});
schemas.ManuscriptOutline=obj({...item.properties,chapters:{type:'array',items:ref('ChapterOutline')}});
schemas.EditorialOutline=obj({projectId:id,revision:integer,structureRevision:integer,manuscripts:{type:'array',items:ref('ManuscriptOutline')}});
schemas.EditorialAck=obj({id,revision:integer,structureRevision:{type:'integer',minimum:0},projectEditorialRevision:integer});
schemas.SceneSaveAck=obj({id,revision:integer,contentHash:{type:'string',pattern:'^[a-f0-9]{64}$'},wordCount:{type:'integer',minimum:0},updatedAt:date,changeSetId:id});
Object.assign(schemas.Scene.properties,{summary:{type:'string',maxLength:4000},status:{type:'string',maxLength:40},archived:{type:'boolean'},contentHash:{type:'string',pattern:'^[a-f0-9]{64}$'},wordCount:{type:'integer',minimum:0},createdAt:date,updatedAt:date});
const revisionMeta={sceneId:id,projectId:id,revision:integer,contentFormatVersion:{const:1},author:obj({id,displayName:{type:'string'}}),createdAt:date,changeSetId:id,restoredFromRevision:{type:['integer','null'],minimum:1},action:{type:'string'}};
schemas.SceneRevisionMeta=obj({...revisionMeta,title:{type:'string'}});
const sceneRevisionRequired=[...Object.keys(revisionMeta),'content','contentHash','metadata'];
schemas.SceneRevision=obj({...revisionMeta,content:ref('RichDocument'),contentHash:{type:'string'},referenceSnapshotVersion:{const:1},references:{type:'array',items:ref('SceneReference')},metadata:obj({title:{type:'string'},summary:{type:'string'},status:{type:'string'},archived:{type:'boolean'},chapterId:id})},sceneRevisionRequired);
schemas.SceneRevision.dependentRequired={referenceSnapshotVersion:['references'],references:['referenceSnapshotVersion']};
schemas.SceneRevisionPage=obj({items:{type:'array',items:ref('SceneRevisionMeta'),maxItems:100},hasMore:{type:'boolean'},nextBeforeRevision:{type:['integer','null'],minimum:1}});
schemas.SceneComparison=obj({before:ref('SceneRevision'),after:ref('SceneRevision')});
schemas.EditorialExport=obj({format:{enum:['markdown','json']},filename:{type:'string'},mimeType:{enum:['application/json','text/markdown']},text:{type:'string'},warnings:{type:'array',items:obj({sceneId:id,title:{type:'string'},message:{type:'string'}})}});
schemas.EditorialExportScene=obj({...schemas.Scene.properties,position:integer});
schemas.EditorialExportChapter=obj({...item.properties,scenes:{type:'array',items:ref('EditorialExportScene')}});
schemas.EditorialJsonExport=obj({format:{const:'storymaster-editorial'},formatVersion:{const:1},exportedAt:date,projectId:id,includesArchived:{const:true},historyIncluded:{const:false},manuscript:obj({...item.properties,chapters:{type:'array',items:ref('EditorialExportChapter')}})});
schemas.EditorialExport.properties.text.description='Markdown dérivé ou JSON encodé conforme à EditorialJsonExport lorsque format=json.';
for(const n of [413,415])oas.components.responses['Error'+n]={...structuredClone(oas.components.responses.Error422),description:n===413?'Corps ou export trop volumineux':'Type de corps non supporté'};
const param=(name,where,schema,required=false)=>({name,in:where,schema,required});
const csrf=param('X-CSRF-Token','header',{type:'string',minLength:43,maxLength:43},true);
const key=param('Idempotency-Key','header',{type:'string',minLength:8,maxLength:200},true);
const cas=structuredClone(oas.components.parameters.ProjectIfMatch);
function route(path,method,operationId,data,permission,body=null,match=false,query=[]){
 const parameters=[...path.matchAll(/{([^}]+)}/g)].map(([,name])=>param(name,'path',name==='revision'?integer:schemas.Id,true));
 if(body)parameters.push(csrf,key);if(match)parameters.push(cas);parameters.push(...query);
 const responses={200:{description:'Résultat autorisé',content:{'application/json':{schema:obj({data:ref(data)})}},headers:{'Cache-Control':{schema:{type:'string'}}}}};
 for(const status of [400,401,403,404,409,412,413,415,422,428,429,500,503])responses[status]={'$ref':'#/components/responses/Error'+status};
 const operation={operationId,summary:operationId,'x-lot':1,'x-permission':permission,'x-audit':body?'A1':'A0',security:[{webSession:[]}],parameters,responses};
 if(operationId.endsWith('Create')){operation.responses[201]=operation.responses[200];delete operation.responses[200];}
 if(body)operation.requestBody={required:true,content:{'application/json':{schema:ref(body)}}};
 oas.paths[path]??={};oas.paths[path][method]=operation;
}
const project='/projects/{projectId}';
route(project+'/manuscripts','get','manuscriptOutline','EditorialOutline','project.read');
for(const [kind,plural,parent] of [['manuscript','manuscripts',project],['chapter','chapters',project+'/manuscripts/{manuscriptId}'],['scene','scenes',project+'/chapters/{chapterId}']]){
 route(parent+'/'+plural,'post',kind+'Create','EditorialAck','narrative.write','EditorialCreate');
 const path=project+'/'+plural+'/{'+kind+'Id}';
 route(path,'patch',kind+'Update','EditorialAck','narrative.write','EditorialUpdate');
 route(path+'/move','post',kind+'Move','EditorialAck','narrative.write','EditorialMove');
 route(path+'/archive','post',kind+'Archive','EditorialAck','narrative.archive','EditorialArchive');
}
const scene=project+'/scenes/{sceneId}';
const getScene=oas.paths[scene].get;getScene['x-lot']=1;getScene.security=[{webSession:[]}];getScene.description='Session humaine au Lot 1 ; le mapping MCP reste spécifié, sans adaptateur actif.';
route(scene+'/content','put','sceneContentSave','SceneSaveAck','narrative.write','SceneContentSave',true);
route(scene+'/revisions','get','sceneRevisionList','SceneRevisionPage','project.read',null,false,[param('limit','query',{type:'integer',minimum:1,maximum:100,default:20}),param('beforeRevision','query',integer)]);
route(scene+'/revisions/{revision}','get','sceneRevisionGet','SceneRevision','project.read');
route(scene+'/compare','get','sceneCompare','SceneComparison','project.read',null,false,[param('from','query',integer,true),param('to','query',integer,true)]);
route(scene+'/restore','post','sceneRestore','SceneSaveAck','narrative.write','SceneRestore',true);
route(project+'/manuscripts/{manuscriptId}/export','get','manuscriptExport','EditorialExport','export.create',null,false,[param('format','query',{enum:['markdown','json']},true)]);
if(!oas.info.version||oas.info.version<'0.4.0')oas.info.version='0.4.0';oas.info.description=oas.info.version>='0.8.0'?'Contrats MVP. Lots 0–4 humains et Lot 5 phase A simulée exécutables ; fournisseurs réels soumis à GO-03, MCP spécifié seulement.':oas.info.version>='0.7.0'?'Contrats MVP. x-lot 0/1/2/3/4 implémentés pour session humaine ; autres opérations et MCP spécifiés seulement.':oas.info.version>='0.6.0'?'Contrats MVP. x-lot 0/1/2/3 implémentés pour session humaine ; autres opérations et MCP spécifiés seulement.':oas.info.version>='0.5.0'?'Contrats MVP. x-lot 0/1/2 implémentés pour session humaine ; autres opérations et MCP spécifiés seulement.':'Contrats MVP. x-lot 0/1 implémentés pour session humaine ; autres opérations et MCP spécifiés seulement.';
const normalize=value=>typeof value==='string'?value.replaceAll('#/components/schemas/','#/$defs/'):Array.isArray(value)?value.map(normalize):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([k,v])=>[k,normalize(v)])):value;
const catalogFile='docs/spec/mcp-tools.json',catalog=JSON.parse(readFileSync(catalogFile,'utf8')),oldCatalog=structuredClone(catalog);
for(const tool of catalog.tools)for(const side of ['inputSchema','outputSchema'])for(const name of Object.keys(tool[side].$defs??{}))tool[side].$defs[name]=normalize(schemas[name]);
if(process.argv.includes('--check')){
 if(!isDeepStrictEqual(oas,before)||!isDeepStrictEqual(catalog,oldCatalog))throw new Error('Contrats Lot 1 divergents ; rejouer scripts/sync-editorial-contracts.mjs et revoir le diff.');
 console.log('Contrats éditoriaux générés et définitions HTTP/MCP synchronisés : OK');
}else{writeFileSync(file,YAML.stringify(oas,{lineWidth:110,aliasDuplicateObjects:false}));writeFileSync(catalogFile,JSON.stringify(catalog,null,2)+'\n');}
