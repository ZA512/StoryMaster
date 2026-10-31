import { randomUUID } from 'node:crypto';
import { EditorialService } from '@storymaster/application';
import { db,projects,person,correlation } from './database.helper.ts';
export const editorial=new EditorialService(db);
export const doc=(value:string,marks?:{type:string;attrs?:Record<string,unknown>}[])=>({type:'doc' as const,content:[{type:'paragraph',content:[{type:'text',text:value,...(marks?{marks}:{})}]}]});
export async function fixture(){
 const owner=await person(),project=await projects.create(owner.actor,{name:'Atelier de test'},randomUUID(),correlation());
 const m=await editorial.create(owner.actor,project.id,'manuscript',project.id,{title:'Roman',expectedStructureRevision:1},randomUUID(),correlation());
 const c=await editorial.create(owner.actor,project.id,'chapter',m.id,{title:'Chapitre I',expectedStructureRevision:1},randomUUID(),correlation());
 const s=await editorial.create(owner.actor,project.id,'scene',c.id,{title:'Une rencontre',expectedStructureRevision:1},randomUUID(),correlation());
 return {owner,project,m,c,s};
}
