import {performance} from 'node:perf_hooks';
import type {Metric} from './database.ts';
import type { PoolClient,QueryResultRow } from 'pg';
import type { Actor,EditorialNode,EditorialKind,EditorialChange,SceneRevision } from '@storymaster/domain';
import type { EditorialPort } from '@storymaster/application';
const tables={manuscript:{table:'manuscripts',parent:'project_id',summary:'description'},chapter:{table:'chapters',parent:'manuscript_id',summary:'summary'},scene:{table:'scenes',parent:'chapter_id',summary:'summary'}} as const;
function node(kind:EditorialKind,row:QueryResultRow):EditorialNode {
 const spec=tables[kind];return {kind,id:row.id,projectId:row.project_id,parentId:row[spec.parent],title:row.title,summary:row[spec.summary],
  position:Number(row.position),revision:Number(row.revision),structureRevision:Number(row.structure_revision ?? 0),archived:row.archived,
  status:kind==='scene' ? row.status : row.archived ? 'archived' : 'active',writingStatuses:row.writing_statuses ?? [],wordCount:Number(row.word_count ?? 0),
  ...(row.content ? {content:row.content,contentHash:row.content_hash} : {}),createdAt:row.created_at.toISOString(),updatedAt:row.updated_at.toISOString()};
}
function revision(row:QueryResultRow):SceneRevision {
 return {...(row.reference_snapshot!==null&&row.reference_snapshot!==undefined?{referenceSnapshotVersion:1 as const,references:row.reference_snapshot}:{}),sceneId:row.scene_id,projectId:row.project_id,revision:Number(row.revision),contentFormatVersion:1,content:row.content_snapshot,contentHash:row.content_hash,
 metadata:row.metadata_snapshot,author:{id:row.actor_user_id,displayName:row.actor_display_name},createdAt:row.created_at.toISOString(),changeSetId:row.change_set_id,
 restoredFromRevision:row.restored_from_revision===null ? null : Number(row.restored_from_revision),action:row.action};
}
export class PostgresEditorialStore implements EditorialPort {
 private sceneLockStarted?:number;
 constructor(private client:PoolClient,private observe:(metric:Metric)=>void=()=>{}){}
 finish(){if(this.sceneLockStarted!==undefined)this.observe({name:'scene.lock_hold_ms',mode:'exclusive',value:performance.now()-this.sceneLockStarted});}
 async lockScene(projectId:string,sceneId:string){const start=performance.now();await this.client.query('SELECT id FROM scenes WHERE project_id=$1 AND id=$2 FOR UPDATE',[projectId,sceneId]);this.sceneLockStarted=performance.now();this.observe({name:'scene.lock_wait_ms',mode:'exclusive',value:this.sceneLockStarted-start});}
 // All rows and the publication clock come from one PostgreSQL statement/snapshot.
 async view(projectId:string,manuscriptId?:string){
  const r=(await this.client.query(`WITH m AS (SELECT * FROM manuscripts WHERE project_id=$1 AND ($2::uuid IS NULL OR id=$2)),
   c AS (SELECT c.* FROM chapters c JOIN m ON m.project_id=c.project_id AND m.id=c.manuscript_id),
   s AS (SELECT s.* FROM scenes s JOIN c ON c.project_id=s.project_id AND c.id=s.chapter_id)
   SELECT p.editorial_structure_revision,ec.revision,
    COALESCE((SELECT jsonb_agg(to_jsonb(m) ORDER BY position,id) FROM m),'[]') AS manuscripts,
    COALESCE((SELECT jsonb_agg(to_jsonb(c) ORDER BY position,id) FROM c),'[]') AS chapters,
    COALESCE((SELECT jsonb_agg(CASE WHEN $2::uuid IS NULL THEN to_jsonb(s)-'content'-'content_hash' ELSE to_jsonb(s) END ORDER BY position,id) FROM s),'[]') AS scenes
   FROM projects p JOIN editorial_clocks ec ON ec.project_id=p.id WHERE p.id=$1`,[projectId,manuscriptId??null])).rows[0];
  const nodes:EditorialNode[]=[];for(const [kind,rows] of [['manuscript',r.manuscripts],['chapter',r.chapters],['scene',r.scenes]] as const)for(const raw of rows){nodes.push(node(kind,{...raw,created_at:new Date(raw.created_at),updated_at:new Date(raw.updated_at)}));}
  return {nodes,revision:Number(r.revision),structureRevision:Number(r.editorial_structure_revision)};
 }
 async projectVersions(projectId:string){const r=(await this.client.query('SELECT c.revision AS editorial_revision,p.editorial_structure_revision FROM projects p JOIN editorial_clocks c ON c.project_id=p.id WHERE p.id=$1',[projectId])).rows[0];return {revision:Number(r.editorial_revision),structureRevision:Number(r.editorial_structure_revision)};}
 async touchProject(projectId:string,structure:boolean){if(structure)await this.bumpStructure('project',projectId,projectId);const r=await this.client.query('UPDATE editorial_clocks SET revision=revision+1 WHERE project_id=$1 RETURNING revision',[projectId]);return Number(r.rows[0].revision);}
 async get(kind:EditorialKind,projectId:string,id:string){const {table}=tables[kind];const r=await this.client.query(`SELECT * FROM ${table} WHERE project_id=$1 AND id=$2`,[projectId,id]);return r.rows[0] ? node(kind,r.rows[0]) : null;}
 async children(kind:EditorialKind,projectId:string,parentId:string){const {table,parent}=tables[kind];const r=await this.client.query(`SELECT * FROM ${table} WHERE project_id=$1 AND ${parent}=$2 ORDER BY position,id`,[projectId,parentId]);return r.rows.map(row=>node(kind,row));}
 async all(projectId:string){const result:EditorialNode[]=[];for(const kind of ['manuscript','chapter','scene'] as const){const {table}=tables[kind];
  const columns=kind==='scene' ? 'id,project_id,chapter_id,title,summary,status,archived,position,revision,word_count,created_at,updated_at' : '*';
  const rows=await this.client.query(`SELECT ${columns} FROM ${table} WHERE project_id=$1 ORDER BY position,id`,[projectId]);result.push(...rows.rows.map(r=>node(kind,r)));}return result;}
 async insert(n:EditorialNode){const {table,parent,summary}=tables[n.kind];
  const columns=['id','project_id','title',summary,'position','revision','archived','created_at','updated_at'];
  const values:unknown[]=[n.id,n.projectId,n.title,n.summary,n.position,n.revision,n.archived,n.createdAt,n.updatedAt];
  if(n.kind!=='manuscript'){columns.push(parent);values.push(n.parentId);}
  if(n.kind==='manuscript'){columns.push('writing_statuses');values.push(JSON.stringify(n.writingStatuses));}
  if(n.kind==='scene'){columns.push('status','content','content_hash','word_count');values.push(n.status,JSON.stringify(n.content),n.contentHash,n.wordCount);}
  await this.client.query(`INSERT INTO ${table}(${columns.join(',')}) VALUES (${values.map((_,i)=>'$'+(i+1)).join(',')})`,values);
 }
 async update(n:EditorialNode,sceneText?:string){const {table,parent,summary}=tables[n.kind];
  const columns=['title',summary,'position','revision','archived','updated_at'];const values:unknown[]=[n.projectId,n.id,n.title,n.summary,n.position,n.revision,n.archived,n.updatedAt];
  if(n.kind!=='manuscript'){columns.push(parent);values.push(n.parentId);}
  if(n.kind==='manuscript'){columns.push('writing_statuses');values.push(JSON.stringify(n.writingStatuses));}
  if(n.kind==='scene'){columns.push('status','content','content_hash','word_count');values.push(n.status,JSON.stringify(n.content),n.contentHash,n.wordCount);}
  if(n.kind==='scene'&&sceneText!==undefined){columns.push('search_text');values.push(sceneText.normalize('NFC'));}
  await this.client.query(`UPDATE ${table} SET ${columns.map((col,i)=>`${col}=$${i+3}`).join(',')} WHERE project_id=$1 AND id=$2`,values);
 }
 async advanceSceneRevision(p:string,id:string,revision:number,updatedAt:string){return (await this.client.query('UPDATE scenes SET revision=$3,updated_at=$4 WHERE project_id=$1 AND id=$2 AND revision=$3-1',[p,id,revision,updatedAt])).rowCount===1;}
 async reindex(kind:EditorialKind,projectId:string,parentId:string,ids:string[]){const {table,parent}=tables[kind];
  await this.client.query(`UPDATE ${table} t SET position=u.ordinality FROM UNNEST($3::uuid[]) WITH ORDINALITY u(id,ordinality) WHERE t.project_id=$1 AND t.${parent}=$2 AND t.id=u.id`,[projectId,parentId,ids]);
 }
 async bumpStructure(kind:'project'|'manuscript'|'chapter',projectId:string,id:string){
  if(kind==='project'){await this.client.query('UPDATE projects SET editorial_structure_revision=editorial_structure_revision+1 WHERE id=$1',[projectId]);return;}
  await this.client.query(`UPDATE ${tables[kind].table} SET structure_revision=structure_revision+1 WHERE project_id=$1 AND id=$2`,[projectId,id]);
 }
 async change(c:EditorialChange){await this.client.query('INSERT INTO editorial_changes(id,project_id,resource_id,resource_type,action,before_revision,after_revision,actor_user_id,correlation_id,details) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[c.id,c.projectId,c.resourceId,c.kind,c.action,c.beforeRevision,c.afterRevision,c.actor.userId,c.correlationId,JSON.stringify(c.details)]);}
 async snapshot(n:EditorialNode,actor:Actor,changeSetId:string,action:string,restoredFrom?:number){
  const metadata={title:n.title,summary:n.summary,status:n.status,archived:n.archived,chapterId:n.parentId};
  await this.client.query(`INSERT INTO scene_revisions(project_id,scene_id,revision,content_snapshot,content_hash,metadata_snapshot,actor_user_id,actor_display_name,change_set_id,action,restored_from_revision,reference_snapshot)
   SELECT $1,$2,$3,$4,$5,$6,u.id,u.display_name,$8,$9,$10,current_scene_references($1,$2) FROM app_users u WHERE u.id=$7`,[n.projectId,n.id,n.revision,JSON.stringify(n.content),n.contentHash,JSON.stringify(metadata),actor.userId,changeSetId,action,restoredFrom ?? null]);
 }
 async revision(projectId:string,sceneId:string,number:number){const r=await this.client.query('SELECT * FROM scene_revisions WHERE project_id=$1 AND scene_id=$2 AND revision=$3',[projectId,sceneId,number]);return r.rows[0] ? revision(r.rows[0]) : null;}
 async revisions(projectId:string,sceneId:string,limit:number,before?:number){const r=await this.client.query('SELECT * FROM scene_revisions WHERE project_id=$1 AND scene_id=$2 AND ($4::bigint IS NULL OR revision<$4) ORDER BY revision DESC LIMIT $3',[projectId,sceneId,limit,before ?? null]);return r.rows.map(revision);}
}
