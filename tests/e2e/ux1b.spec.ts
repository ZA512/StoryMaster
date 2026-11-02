import {test,expect} from '@playwright/test';
import type {Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {loginLocal,concentration,workshopAction} from './workshop.helpers.ts';
async function fixture(page:Page){
 await loginLocal(page);const me=(await(await page.request.get('/api/v1/me')).json()).data;
 const write=async(path:string,data:unknown)=>{const r=await page.request.post('/api/v1'+path,{headers:{origin:'http://localhost:3000','X-CSRF-Token':me.csrfToken,'Idempotency-Key':crypto.randomUUID()},data});expect(r.ok(),await r.text()).toBeTruthy();return(await r.json()).data;};
 const p=await write('/projects',{name:'Compacité UX-1B '+Date.now()}),base='/projects/'+p.id,m=await write(base+'/manuscripts',{title:'Les lignes du large',expectedStructureRevision:1}),c=await write(base+'/manuscripts/'+m.id+'/chapters',{title:'La ville',expectedStructureRevision:1}),s=await write(base+'/chapters/'+c.id+'/scenes',{title:'La lettre',summary:'Un résumé disponible dans le contexte, sans prendre la place du texte.',expectedStructureRevision:1});
 await page.goto('/projets/'+p.id+'/ecriture?scene='+s.id);const editor=page.getByRole('textbox',{name:'Texte de la scène',exact:true});await expect(editor).toBeVisible();return{p,m,c,s,editor};
}
test('UX-1B : brouillon, sélection et undo restent dans le même éditeur pendant les changements de disposition',async({page})=>{
 const f=await fixture(page);await page.route('**/scenes/'+f.s.id+'/content',r=>r.abort('failed'));await f.editor.fill('Un brouillon encore dans cet onglet.');await expect(page.locator('.save-state')).toHaveText('Non enregistré');
 await f.editor.press('Control+a');await page.getByRole('button',{name:'Gras',exact:true}).click();await expect(f.editor.locator('strong')).toHaveText('Un brouillon encore dans cet onglet.');
 const before=await f.editor.elementHandle();
 for(const label of ['Plan','Inspecteur']){await page.getByRole('button',{name:label,exact:true}).click();await page.getByRole('button',{name:label,exact:true}).click();}
 await concentration(page);await page.keyboard.press('Escape');expect(await f.editor.evaluate((el,old)=>el===old,before)).toBe(true);await expect(f.editor).toHaveText('Un brouillon encore dans cet onglet.');
 await f.editor.press('Control+z');await expect(f.editor.locator('strong')).toHaveCount(0);await expect(f.editor).toHaveText('Un brouillon encore dans cet onglet.');
 await page.unroute('**/scenes/'+f.s.id+'/content');await page.getByRole('button',{name:'Réessayer l’enregistrement',exact:true}).click();await expect(page.locator('.save-state')).toHaveText('Enregistré');
});
test('UX-1B : surface de rédaction, menus et clavier aux quatre tailles demandées',async({page})=>{
 test.setTimeout(120000);const f=await fixture(page);await f.editor.fill('La première ligne reste à portée de regard.');await expect(page.locator('.save-state')).toHaveText('Enregistré');
 for(const size of [{width:1280,height:720},{width:1440,height:900},{width:1920,height:1080},{width:1000,height:720}]){
  await page.setViewportSize(size);const m=await page.evaluate(()=>{const bar=document.querySelector('.atelier-topbar')!.getBoundingClientRect(),text=document.querySelector('.tiptap p')!.getBoundingClientRect();return{bar:bar.height,textTop:text.top,overflow:document.documentElement.scrollWidth>innerWidth};});
  expect(m.bar).toBeLessThan(80);expect(m.textTop).toBeLessThan(330);expect(m.overflow).toBe(false);console.log('UX-1B surface',size,m);
  await page.getByRole('button',{name:'Actions pour La lettre',exact:true}).focus();await page.keyboard.press('Enter');const menu=page.getByRole('group',{name:'Actions pour La lettre',exact:true});await expect(menu).toBeVisible();const box=await menu.boundingBox();expect(box!.y+box!.height).toBeLessThanOrEqual(size.height);await page.keyboard.press('End');await expect(menu.getByRole('button',{name:'Archiver La lettre',exact:true})).toBeFocused();await page.keyboard.press('Escape');await expect(menu).not.toBeVisible();
  const violations=(await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations;expect(violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);
 }
 await page.getByRole('button',{name:'Projet',exact:true}).click();for(const name of ['Collaborateurs','Propositions','Assistant IA','Archives et exports'])await expect(page.getByRole('link',{name,exact:true})).toBeVisible();await page.keyboard.press('Escape');
 await workshopAction(page,'La lettre','Renommer');await page.getByLabel('Nouveau titre',{exact:true}).fill('La lettre retrouvée');await page.getByRole('form',{name:'Renommer La lettre',exact:true}).getByRole('button',{name:'Enregistrer le titre',exact:true}).click();await expect(page.locator('.scene-heading h2')).toHaveText('La lettre retrouvée');
});

test('UX-1B : grossissement visuel Chromium et reflow équivalent à 200 %',async({page})=>{
 const f=await fixture(page);await f.editor.fill('Un texte que l’on peut agrandir et parcourir.');await expect(page.locator('.save-state')).toHaveText('Enregistré');
 const session=await page.context().newCDPSession(page);
 try{await session.send('Emulation.setPageScaleFactor',{pageScaleFactor:2});expect(await page.evaluate(()=>window.visualViewport!.scale)).toBe(2);await expect(f.editor).toContainText('agrandir');}
 finally{await session.send('Emulation.setPageScaleFactor',{pageScaleFactor:1});await session.detach();}
 // Layout reflow at half the CSS width complements visual/pinch zoom, which
 // does not itself change desktop media queries. This is not a human zoom audit.
 await page.setViewportSize({width:640,height:450});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 for(const label of ['Plan','Inspecteur']){const b=page.getByRole('button',{name:label,exact:true});if(await b.getAttribute('aria-pressed')==='true')await b.click();}
 await expect(f.editor).toBeInViewport();await page.getByRole('button',{name:'Projet',exact:true}).focus();await page.keyboard.press('Enter');await expect(page.getByRole('link',{name:'Collaborateurs',exact:true})).toBeVisible();await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Compte',exact:true}).click();await expect(page.getByRole('link',{name:'Délégations locales',exact:true})).toBeVisible();await page.keyboard.press('Escape');await expect(f.editor).toHaveText('Un texte que l’on peut agrandir et parcourir.');
});
