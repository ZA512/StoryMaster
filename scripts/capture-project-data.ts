import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname} from 'node:path';
import {Pool} from '@storymaster/infrastructure';
const tables=['projects','project_memberships','project_revisions','manuscripts','chapters','scenes','scene_revisions','editorial_changes','editorial_clocks','narrative_objects','narrative_relations','scene_references','narrative_revisions','narrative_changes','module_activations','invitations','comment_threads','comments','text_anchors','collaboration_revisions','collaboration_clocks','audit_events','change_proposals','proposal_revisions','proposal_reviews','proposal_events','proposal_change_sets','proposal_change_events'];
const output=process.argv[2];if(!output)throw Error('Chemin de sortie requis. Lecture seule, aucun contenu narratif exporté.');
const pool=new Pool({connectionString:process.env.DATABASE_URL}),client=await pool.connect();
type Entry={count:number;digest:string;columns?:string[]};
try{
 await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
 const before=process.argv[3]?JSON.parse(await readFile(process.argv[3],'utf8')) as {tables:Record<string,Entry>}:null,result:Record<string,Entry>={};
 for(const table of tables){
  const columns:string[]=before?.tables[table]?.columns??(await client.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position",[table])).rows.map(r=>r.column_name);
  const projection=columns.map(c=>'"'+c.replaceAll('"','""')+'"').join(',');
  const rows=(await client.query(`SELECT to_jsonb(t) AS value FROM (SELECT ${projection} FROM ${table}) t ORDER BY to_jsonb(t)::text`)).rows.map(r=>r.value);
  result[table]={count:rows.length,digest:createHash('sha256').update(JSON.stringify(rows)).digest('hex'),columns};
 }
 await client.query('COMMIT');
 const unchanged=before?tables.every(t=>result[t]?.count===before.tables[t]?.count&&result[t]?.digest===before.tables[t]?.digest):undefined;
 const report={date:new Date().toISOString(),method:'Snapshot PostgreSQL REPEATABLE READ READ ONLY ; colonnes préexistantes et lignes triées, SHA-256 de leur JSON ; aucun texte exporté',tables:result,...(before?{before:before.tables,allOriginalDataUnchanged:unchanged}:{})};
 await mkdir(dirname(output),{recursive:true});await writeFile(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output,tables:tables.length,...(before?{allOriginalDataUnchanged:unchanged}:{})}));if(unchanged===false)process.exitCode=1;
}finally{client.release();await pool.end();}
