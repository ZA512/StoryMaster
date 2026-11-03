import {writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {z} from 'zod';
import {characterAttributesSchema,characterAttributesV2Schema,placeAttributesSchema,eventAttributesSchema,parentRelationAttributesSchema,legacyRelationAttributesSchema} from '@storymaster/contracts';
import {relationRules,referenceTypes,relationTypes} from '@storymaster/domain';
const ordered=(v:unknown):unknown=>Array.isArray(v)?v.map(ordered):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b,'en')).map(([k,x])=>[k,ordered(x)])):v;
const modules=[['characters','character',characterAttributesSchema],['places','place',placeAttributesSchema],['timeline','event',eventAttributesSchema]] as const;
const definitions=modules.map(([key,type,schema])=>{const generated=z.toJSONSchema(schema,{target:'draft-2020-12'});const base={key,version:1,typeKeys:[type],dependencies:[],schemas:{[type]:generated}};return {...base,checksum:createHash('sha256').update(JSON.stringify(ordered(base))).digest('hex')};});
const registryV1={registryVersion:1,definitions,relationRules:Object.fromEntries(Object.entries(relationRules).filter(([key])=>['related_to','knows','located_in','participates_in','precedes'].includes(key))),referenceTypes};
const oldPaths=['docs/spec/module-registry.v1.json','packages/contracts/src/module-registry.v1.json'];
const oldText=JSON.stringify(registryV1,null,2)+'\n';
if((await Promise.all(oldPaths.map(path=>readFile(path,'utf8')))).some(value=>value!==oldText))throw Error('Le registre v1 est immuable ; son schéma et son catalogue doivent rester identiques.');
const base={key:'characters',version:2,typeKeys:['character'],dependencies:[],schemas:{character:z.toJSONSchema(characterAttributesV2Schema,{target:'draft-2020-12'})}};
const registry={registryVersion:2,definitions:[...definitions,{...base,checksum:createHash('sha256').update(JSON.stringify(ordered(base))).digest('hex')}],relationRules,relationAttributeSchemas:Object.fromEntries(relationTypes.map(type=>[type,z.toJSONSchema(type==='parent_of'?parentRelationAttributesSchema:legacyRelationAttributesSchema,{target:'draft-2020-12'})])),referenceTypes};
const paths=['docs/spec/module-registry.v2.json','packages/contracts/src/module-registry.v2.json'],text=JSON.stringify(registry,null,2)+'\n';
if(process.argv.includes('--check')){if((await Promise.all(paths.map(path=>readFile(path,'utf8')))).some(value=>value!==text))throw Error('Le registre v2 diverge des schémas exécutables.');console.log('Registres narratifs v1 immuable et v2 conformes aux schémas exécutables.');}
else await Promise.all(paths.map(path=>writeFile(path,text)));
