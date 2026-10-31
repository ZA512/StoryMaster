import {writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {z} from 'zod';
import {characterAttributesSchema,placeAttributesSchema,eventAttributesSchema} from '@storymaster/contracts';
import {relationRules,referenceTypes} from '@storymaster/domain';
const ordered=(v:unknown):unknown=>Array.isArray(v)?v.map(ordered):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b,'en')).map(([k,x])=>[k,ordered(x)])):v;
const modules=[['characters','character',characterAttributesSchema],['places','place',placeAttributesSchema],['timeline','event',eventAttributesSchema]] as const;
const definitions=modules.map(([key,type,schema])=>{const generated=z.toJSONSchema(schema,{target:'draft-2020-12'});const base={key,version:1,typeKeys:[type],dependencies:[],schemas:{[type]:generated}};return {...base,checksum:createHash('sha256').update(JSON.stringify(ordered(base))).digest('hex')};});
const registry={registryVersion:1,definitions,relationRules,referenceTypes};
const paths=['docs/spec/module-registry.v1.json','packages/contracts/src/module-registry.v1.json'];const text=JSON.stringify(registry,null,2)+'\n';
if(process.argv.includes('--check')){if((await Promise.all(paths.map(path=>readFile(path,'utf8')))).some(value=>value!==text))throw new Error('Le registre v1 publié diverge : nouvelle version/migration explicite requise.');console.log('Registre narratif v1 conforme aux schémas exécutables.');}
else await Promise.all(paths.map(path=>writeFile(path,text)));
