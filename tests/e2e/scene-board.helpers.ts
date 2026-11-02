import {expect} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
import type {Page,Locator,Browser} from '@playwright/test';
import type {EditorialAck,EditorialOutline,SceneDto,ThreadView} from '@storymaster/contracts';
import {loginLocal} from './workshop.helpers.ts';
export async function boardFixture(page:Page,context=false){
 await mkdir('artifacts/local/ux2',{recursive:true});await loginLocal(page);const me=(await(await page.request.get('/api/v1/me')).json()).data;
 const write=async<T=EditorialAck>(path:string,data:unknown,method='POST',revision?:number):Promise<T>=>{const r=await page.request.fetch('/api/v1'+path,{method,headers:{origin:'http://localhost:3000','X-CSRF-Token':me.csrfToken,'Idempotency-Key':crypto.randomUUID(),...(revision?{'If-Match':`"r${revision}"`}:{})},data});expect(r.ok(),await r.text()).toBeTruthy();return(await r.json()).data;};
 const p=await write<{id:string;name:string}>('/projects',{name:'Les maisons de la marée — UX-2 '+Date.now()}),base='/projects/'+p.id,m=await write(base+'/manuscripts',{title:'Le livre des passages',expectedStructureRevision:1}),chapters=[];
 for(const [i,title] of ['I — Le port','II — Les îles','III — Le phare'].entries())chapters.push(await write(base+'/manuscripts/'+m.id+'/chapters',{title,summary:'Une étape différente du voyage.',expectedStructureRevision:i+1}));
 const scenes=[];
 for(const [i,title] of ['La lettre','Le marché','La traversée'].entries()){
  const s=await write(base+'/chapters/'+chapters[0]!.id+'/scenes',{title,summary:['Une carte glissée sous une porte.','Les pêcheurs cachent le nom du phare.','Une barque quitte le dernier quai.'][i],expectedStructureRevision:i+1});
  await write(base+'/scenes/'+s.id+'/content',{contentFormatVersion:1,content:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'Texte intact de '+title+' — Élise suit la marée.'}]}]}},'PUT',1);scenes.push(s);
 }
 let thread:ThreadView|null=null;
 if(context){await write(base+'/modules/characters',{enabled:true,moduleVersion:1},'PATCH',1);const object=await write(base+'/objects',{typeKey:'character',schemaVersion:1,name:'Élise de la marée',summary:'Une cartographe au départ du port.',attributes:{}});await write(base+'/scenes/'+scenes[0]!.id+'/references',{references:[{objectRef:{id:object.id},referenceType:'present',metadata:{}}],dependencyRevisions:[{id:object.id,revision:1}]},'PUT',2);thread=await write<ThreadView>(base+'/comments',{targetType:'scene',targetId:scenes[0]!.id,body:'Ce passage garde son commentaire après le déplacement.'});}
 const readScene=async(id:string)=>(await(await page.request.get('/api/v1'+base+'/scenes/'+id)).json()).data as SceneDto;
 const before=await Promise.all(scenes.map(s=>readScene(s.id))),path='/projets/'+p.id+'/ecriture?scene='+scenes[0]!.id;
 await page.goto(path+'&view=cards');await expect(page.getByRole('region',{name:'Tableau de cartes',exact:true})).toBeVisible();return{p,m,chapters,scenes,before,base,path,me,write,readScene,thread,readOutline:async()=>(await(await page.request.get('/api/v1'+base+'/manuscripts')).json()).data as EditorialOutline};
}
export const card=(page:Page,id:string)=>page.locator('[data-card-id="'+id+'"]');
export const column=(page:Page,id:string)=>page.locator('[data-chapter-id="'+id+'"]');
export const titles=(page:Page,id:string)=>column(page,id).locator('.card-title').allTextContents();
export async function moveDialog(page:Page,title:string){await page.getByRole('button',{name:'Actions pour '+title,exact:true}).click();await page.getByRole('button',{name:'Déplacer '+title,exact:true}).click();return page.getByRole('dialog');}
export async function dragCard(page:Page,id:string,target:Locator,edge:'top'|'bottom'|'center'='center',during?:()=>Promise<void>){
 const handle=card(page,id).getByRole('button',{name:/par glissement/});await handle.scrollIntoViewIfNeeded();await target.scrollIntoViewIfNeeded();const from=await handle.boundingBox(),to=await target.boundingBox();expect(from).not.toBeNull();expect(to).not.toBeNull();
 await page.mouse.move(from!.x+from!.width/2,from!.y+from!.height/2);await page.mouse.down();
 try{await page.mouse.move(from!.x+from!.width/2+8,from!.y+from!.height/2+4,{steps:3});await expect(card(page,id)).toHaveClass(/dragging/);for(let correction=0;correction<2;correction++){const current=await target.boundingBox();expect(current).not.toBeNull();await page.mouse.move(current!.x+current!.width/2,current!.y+(edge==='top'?6:edge==='bottom'?current!.height-6:current!.height/2),{steps:6});}if(during)await during();}finally{await page.mouse.up();}
}
export async function invitedAuthor(owner:Page,browser:Browser,f:Awaited<ReturnType<typeof boardFixture>>,touch=false){
 const context=await browser.newContext(touch?{hasTouch:true,viewport:{width:1024,height:768}}:{}),page=await context.newPage();await loginLocal(page,'bob');const me=(await(await page.request.get('/api/v1/me')).json()).data,invitation=await f.write<{link:string}>(f.base+'/invitations',{email:'bob@example.test',role:'author'});await page.goto(invitation.link);await expect(page).toHaveURL(/\/rejoindre$/);await page.getByRole('button',{name:'Accepter l’invitation',exact:true}).click();await page.getByRole('button',{name:'Ouvrir le projet →',exact:true}).click();await page.goto('http://localhost:3000'+f.path+'&view=cards');await expect(card(page,f.scenes[0]!.id)).toBeVisible();return{context,page,me};
}
