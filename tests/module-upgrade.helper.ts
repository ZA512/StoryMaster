import assert from 'node:assert/strict';
import type {Pool} from 'pg';
import type {ModulesDto} from '@storymaster/contracts';
import {narrativeRegistry} from '@storymaster/contracts';
type Row=Record<string,unknown>;
export interface ModuleBaseline {activations:Row[];definitions:Row[];revisionKeys:Set<string>;changeIds:Set<string>}
export interface ModuleUpgradeEvidence {baseline:ModuleBaseline;newChanges:Set<string>;newRevisionKeys:Set<string>}
const revisionKey=(r:Row)=>[r.project_id,r.resource_type,r.resource_id,r.revision].join('/');
export async function moduleBaseline(pool:Pool):Promise<ModuleBaseline>{
 const rows=async(table:string)=>(await pool.query(`SELECT to_jsonb(t) AS value FROM ${table} t`)).rows.map(r=>r.value as Row);
 return {activations:await rows('module_activations'),definitions:await rows('module_definitions'),revisionKeys:new Set((await rows('narrative_revisions')).map(revisionKey)),changeIds:new Set((await rows('narrative_changes')).map(r=>String(r.id)))};
}
/** Verify every intentional module upgrade before projecting it out of a legacy equality oracle. */
export async function verifyModuleUpgrade(pool:Pool,baseline:ModuleBaseline):Promise<ModuleUpgradeEvidence>{
 const rows=async(table:string)=>(await pool.query(`SELECT to_jsonb(t) AS value FROM ${table} t`)).rows.map(r=>r.value as Row),activations=await rows('module_activations'),definitions=await rows('module_definitions'),changes=await rows('narrative_changes'),revisions=await rows('narrative_revisions'),newChanges=new Set<string>(),newRevisionKeys=new Set<string>();
 assert.equal(activations.length,baseline.activations.length,'No activation added or lost during upgrade');
 for(const old of baseline.definitions)assert.ok(definitions.some(d=>JSON.stringify(d)===JSON.stringify(old)),'Old module definition immutable');
 const added=definitions.filter(d=>!baseline.definitions.some(old=>old.module_key===d.module_key&&old.module_version===d.module_version));assert.equal(added.length,1);assert.deepEqual(added[0]!.definition,narrativeRegistry.definitions.find(d=>d.key==='characters'&&d.version===2));assert.equal(added[0]!.checksum,(added[0]!.definition as {checksum:string}).checksum);
 for(const old of baseline.activations){const current=activations.find(r=>r.id===old.id)!;assert.ok(current);if(old.module_key!=='characters'||old.module_version!==1){assert.deepEqual(current,old);continue;}
  const expected:Row={...old,module_version:2,revision:Number(old.revision)+1,updated_at:current.updated_at};assert.deepEqual(current,expected);assert.ok(Date.parse(String(current.updated_at))>=Date.parse(String(old.updated_at)));
  const change=changes.filter(r=>r.resource_id===old.id&&r.resource_type==='module'&&r.after_revision===current.revision&&!baseline.changeIds.has(String(r.id)));assert.equal(change.length,1);const c=change[0]!;assert.equal(c.action,'module.schema_upgraded');assert.equal(c.actor_type,'system');assert.equal(c.actor_user_id,null);assert.equal(c.project_id,old.project_id);assert.equal(c.correlation_id,c.id);newChanges.add(String(c.id));
  const versions=revisions.filter(r=>r.resource_id===old.id&&r.resource_type==='module'&&r.revision===current.revision&&!baseline.revisionKeys.has(revisionKey(r)));assert.equal(versions.length,1);const v=versions[0]!,snapshot=v.snapshot as Row;
  assert.equal(v.change_set_id,c.id);assert.equal(v.action,'module.schema_upgraded');assert.equal(v.actor_type,'system');assert.equal(v.actor_user_id,null);assert.equal(v.actor_display_name,'Migration UX-3 — schéma compatible');assert.equal(v.restored_from_revision,null);
  assert.deepEqual(snapshot,{id:current.id,projectId:current.project_id,moduleKey:current.module_key,moduleVersion:2,enabled:current.enabled,revision:current.revision,updatedAt:snapshot.updatedAt});assert.equal(Date.parse(String(snapshot.updatedAt)),Date.parse(String(current.updated_at)));newRevisionKeys.add(revisionKey(v));
 }
 return {baseline,newChanges,newRevisionKeys};
}
export function legacyRows(table:string,rows:unknown[],evidence?:ModuleUpgradeEvidence):unknown[]{
 if(!evidence)return rows;return rows.flatMap(raw=>{const wrapper=raw as {value:Row},row=wrapper.value;
  if(table==='module_definitions'&&row.module_key==='characters'&&row.module_version===2)return [];
  if(table==='narrative_changes'&&evidence.newChanges.has(String(row.id)))return [];
  if(table==='narrative_revisions'&&evidence.newRevisionKeys.has(revisionKey(row)))return [];
  if(table==='module_activations'){const old=evidence.baseline.activations.find(r=>r.id===row.id);if(old)return [{...wrapper,value:Object.fromEntries(Object.keys(row).map(k=>[k,old[k]]))}];}
  return [raw];
 });
}
export function legacyModules(dto:ModulesDto,evidence:ModuleUpgradeEvidence):ModulesDto{return {...dto,definitions:dto.definitions.filter(d=>d.version===1),activations:dto.activations.map(a=>{const old=evidence.baseline.activations.find(r=>r.id===a.id);return old?{id:String(old.id),projectId:String(old.project_id),moduleKey:a.moduleKey,moduleVersion:old.module_version as 1,enabled:old.enabled as boolean,revision:Number(old.revision),updatedAt:new Date(String(old.updated_at)).toISOString()}:a;})};}
