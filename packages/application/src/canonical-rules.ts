import {AppError,notFound,moduleFor,relationRules,graphHasCycle,referenceAccepts} from '@storymaster/domain';
import type {NarrativeObject,NarrativeRelation,NarrativeType,EventAttributes,PlaceAttributes,CharacterAttributes} from '@storymaster/domain';
import {narrativeRegistry,parseRelationAttributes} from '@storymaster/contracts';
import {fingerprint} from './index.ts';
import type {Transaction} from './index.ts';
import {checkResourceId} from './project-access.ts';
const invalid=(message:string)=>new AppError('VALIDATION_FAILED',message,422);
export function requireRevision(actual:number,expected:number){if(!Number.isSafeInteger(expected)||expected<1)throw invalid('Révision attendue invalide.');if(actual!==expected)throw new AppError('REVISION_CONFLICT','Cette ressource a changé. Vos modifications sont conservées.',412,{currentRevision:actual,expectedRevision:expected});}
export function requireActive(n:{status:string}){if(n.status!=='active')throw new AppError('INVALID_STATE_TRANSITION','Cette ressource est archivée ou retirée.',409);}
export function narrativeSearchText(n:NarrativeObject){const texts:string[]=[n.name,n.summary,n.notes];for(const [key,value]of Object.entries(n.attributes)){if(key.endsWith('Ref')||key.endsWith('Refs')||key==='temporalExpression'||key==='chronologyPosition')continue;if(typeof value==='string')texts.push(value);else if(Array.isArray(value))texts.push(...value.filter((x):x is string=>typeof x==='string'));}return texts.join('\n').normalize('NFC');}
export async function assertModuleEnabled(tx:Transaction,p:string,type:NarrativeType){const a=(await tx.narrative.modules(p)).find(a=>a.moduleKey===moduleFor[type]);if(!a||!a.enabled)throw new AppError('MODULE_DISABLED','Ce module est désactivé. Ses données restent consultables ; un responsable peut le réactiver.',409);const published=narrativeRegistry.definitions.find(d=>d.key===a.moduleKey&&d.version===a.moduleVersion),stored=(await tx.narrative.definitions()).find(d=>d.key===a.moduleKey&&d.version===a.moduleVersion);if(!published||!stored||published.checksum!==stored.checksum||stored.checksum!==fingerprint(Object.fromEntries(Object.entries(stored).filter(([k])=>k!=='checksum'))))throw new AppError('INVALID_STATE_TRANSITION','La version publiée de ce module n’est pas prise en charge.',409);}
export async function getNarrativeObject(tx:Transaction,p:string,id:string,reference=false){checkResourceId(id);const n=await tx.narrative.object(p,id);if(!n){if(reference)throw invalid('Référence invalide dans ce projet.');throw notFound();}return n;}
export async function checkDependencies(tx:Transaction,p:string,ids:string[],bases:{id:string;revision:number}[]){const unique=[...new Set(ids)].sort();if(bases.length!==unique.length||new Set(bases.map(b=>b.id)).size!==bases.length||bases.some(b=>!unique.includes(b.id)))throw invalid('Les révisions des objets concernés sont requises.');for(const id of unique){const n=await getNarrativeObject(tx,p,id,true);requireRevision(n.revision,bases.find(b=>b.id===id)!.revision);}}

export async function validateNarrativeObject(tx:Transaction,n:NarrativeObject,old?:NarrativeObject){
  if(n.typeKey==='place'){
   const parent=(n.attributes as PlaceAttributes).parentPlaceRef?.id,oldParent=(old?.attributes as PlaceAttributes|undefined)?.parentPlaceRef?.id;
   if(parent){const target=await getNarrativeObject(tx,n.projectId,parent,true);if(target.typeKey!=='place')throw invalid('Le parent doit être un lieu du même projet.');if(parent!==oldParent)requireActive(target);}
   const rows=await tx.narrative.graph(n.projectId),edges=rows.filter(r=>r.typeKey==='place'&&r.id!==n.id&&r.parentPlaceId).map(r=>[r.id,r.parentPlaceId!] as const);if(parent)edges.push([n.id,parent]);if(graphHasCycle(edges))throw invalid('Cette hiérarchie de lieux créerait un cycle.');
  }
  if(n.typeKey==='character')for(const ref of (n.attributes as CharacterAttributes).conditionEventRefs??[]){const target=await getNarrativeObject(tx,n.projectId,ref.id,true);if(target.typeKey!=='event')throw invalid('La référence doit désigner un événement du projet.');if(!(old?.attributes as CharacterAttributes|undefined)?.conditionEventRefs?.some(r=>r.id===ref.id)){requireActive(target);await assertModuleEnabled(tx,n.projectId,'event');}}
  if(n.typeKey==='character'&&old)for(const ref of (old.attributes as CharacterAttributes).conditionEventRefs??[]){if(!(n.attributes as CharacterAttributes).conditionEventRefs?.some(r=>r.id===ref.id))await assertModuleEnabled(tx,n.projectId,'event');}
  if(n.typeKey==='event'){
   const rows=await tx.narrative.graph(n.projectId),positions=new Map(rows.map(r=>[r.id,r.ordinalPosition]));const t=(n.attributes as EventAttributes).temporalExpression;positions.set(n.id,t.kind==='ordinal'?t.position:null);
   for(const edge of (await tx.narrative.edges(n.projectId)).filter(e=>e.status==='active'&&e.relationType==='precedes')){const from=positions.get(edge.sourceObjectId),to=positions.get(edge.targetObjectId);if(from!=null&&to!=null&&from>=to)throw invalid('L’ordre ordinal contredit une relation de précédence.');}
  }
 }
export async function validateNarrativeRelation(tx:Transaction,r:NarrativeRelation,old?:NarrativeRelation){const source=await getNarrativeObject(tx,r.projectId,r.sourceObjectId,true),target=await getNarrativeObject(tx,r.projectId,r.targetObjectId,true),rule=relationRules[r.relationType];await assertModuleEnabled(tx,r.projectId,source.typeKey);await assertModuleEnabled(tx,r.projectId,target.typeKey);if(r.status==='removed')return;requireActive(source);requireActive(target);if(source.id===target.id||!rule.sources.includes(source.typeKey)||!rule.targets.includes(target.typeKey))throw invalid('Extrémités incompatibles avec ce type de relation.');const edges=(await tx.narrative.edges(r.projectId)).filter(e=>e.status==='active'&&e.id!==old?.id);if(edges.some(e=>e.relationType===r.relationType&&e.sourceObjectId===r.sourceObjectId&&e.targetObjectId===r.targetObjectId))throw invalid('Cette relation existe déjà.');if(rule.singleTarget&&edges.some(e=>e.relationType===r.relationType&&e.sourceObjectId===r.sourceObjectId))throw invalid('Cette fiche possède déjà une localisation active.');if(rule.acyclic){const links=edges.filter(e=>e.relationType===r.relationType).map(e=>[e.sourceObjectId,e.targetObjectId] as const);links.push([r.sourceObjectId,r.targetObjectId]);if(graphHasCycle(links))throw invalid(r.relationType==='parent_of'?'Cette filiation créerait un cycle de parenté.':'Cette relation de précédence créerait un cycle.');if(r.relationType==='precedes'){const from=(source.attributes as EventAttributes).temporalExpression,to=(target.attributes as EventAttributes).temporalExpression;if(from.kind==='ordinal'&&to.kind==='ordinal'&&from.position>=to.position)throw invalid('La précédence contredit les positions ordinales.');}}}
export function canonicalNarrativeRelation(r:NarrativeRelation){r.attributes=parseRelationAttributes(r.relationType,r.attributes);if(relationRules[r.relationType].symmetric&&r.sourceObjectId>r.targetObjectId)[r.sourceObjectId,r.targetObjectId]=[r.targetObjectId,r.sourceObjectId];return r;}

export async function requireEditorialActive(tx:Transaction,n:import('@storymaster/domain').EditorialNode){
 if(n.archived)throw new AppError('INVALID_STATE_TRANSITION','Cet élément est archivé.',409);
 if(n.kind!=='manuscript'){const k=n.kind==='scene'?'chapter':'manuscript',parent=await tx.editorial.get(k,n.projectId,n.parentId);if(!parent)throw notFound();await requireEditorialActive(tx,parent);}
}
export async function validateSceneMetadata(tx:Transaction,n:import('@storymaster/domain').EditorialNode){
 if(!n.title.trim()||n.title.length>200||/[\r\n]/.test(n.title)||n.summary.length>4000)throw invalid('Titre ou résumé invalide.');
 const chapter=await tx.editorial.get('chapter',n.projectId,n.parentId),manuscript=chapter?await tx.editorial.get('manuscript',n.projectId,chapter.parentId):null;
 if(!chapter||!manuscript)throw notFound();if(!manuscript.writingStatuses.includes(n.status))throw invalid('Statut rédactionnel non disponible dans le manuscrit cible.');
}
export async function validateReferenceChange(tx:Transaction,p:string,before:import('@storymaster/domain').SceneReference[],input:{objectRef:{id:string};referenceType:import('@storymaster/domain').ReferenceType}[]){
 const semantic=(r:{objectId:string;referenceType:string})=>r.objectId+'|'+r.referenceType,keys=input.map(r=>r.objectRef.id+'|'+r.referenceType);
 if(new Set(keys).size!==keys.length)throw invalid('Une référence apparaît plusieurs fois.');if(input.filter(r=>r.referenceType==='point_of_view').length>1)throw invalid('Une scène possède au plus un point de vue structuré.');
 const removed=before.filter(r=>!keys.includes(semantic(r))),added=input.filter(r=>!before.some(a=>semantic(a)===r.objectRef.id+'|'+r.referenceType));
 for(const r of removed){const target=await getNarrativeObject(tx,p,r.objectId,true);await assertModuleEnabled(tx,p,target.typeKey);}
 for(const r of added){const target=await getNarrativeObject(tx,p,r.objectRef.id,true);await assertModuleEnabled(tx,p,target.typeKey);requireActive(target);if(!referenceAccepts(r.referenceType,target.typeKey))throw invalid('Le type de référence ne correspond pas à cette fiche.');}
 return {removed,added};
}
