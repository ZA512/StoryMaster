import {expect,test} from '@playwright/test';
import type {Page} from '@playwright/test';
export async function createInline(page:Page,title:string){
 const form=page.getByRole('form',{name:/^Créer (un|une) /});
 await expect(page.getByRole('dialog')).toHaveCount(0);
 await form.getByLabel('Titre',{exact:true}).fill(title);
 await form.getByRole('button',{name:'Créer',exact:true}).click();
 await expect(form).not.toBeVisible();
}
export async function showInspector(page:Page,section:'Scène'|'Discussions'|'En regard'='Scène'){
 const button=page.getByRole('button',{name:'Inspecteur',exact:true});
 if(await button.getAttribute('aria-pressed')!=='true')await button.click();
 await page.getByRole('button',{name:section,exact:true}).click();
}

export async function loginLocal(page:Page,user='alice') {
 for(let attempt=0;attempt<2;attempt++){
  await page.goto('/connexion');
  const pending=page.waitForResponse(r=>new URL(r.url()).pathname==='/auth/login');
  await page.getByRole('link',{name:'Se connecter',exact:true}).click();
  const response=await pending;
  if(response.status()===429){
   expect(attempt,'Connexion encore refusée après Retry-After').toBe(0);
   const delay=Math.min(60500,Math.max(1000,(Number(response.headers()['retry-after'])||60)*1000+250));
   test.setTimeout(test.info().timeout+delay+5000);
   await page.waitForTimeout(delay);continue;
  }
  expect(response.status()).toBe(302);
  await page.locator('#username').fill(user);await page.locator('#password').fill('local-only-storymaster');await page.locator('#kc-login').click();
  await expect(page).toHaveURL(/\/projets$/);await waitForLocalSession(page);return;
 }
 throw Error('Connexion locale refusée après attente bornée.');
}

export async function workshopAction(page:Page,title:string,action:string){
 await page.getByRole('button',{name:'Actions pour '+title,exact:true}).click();
 await page.getByRole('button',{name:action,exact:true}).click();
}
export async function concentration(page:Page){
 await page.getByRole('button',{name:'Disposition',exact:true}).click();
 await page.getByRole('button',{name:'Mode concentration',exact:true}).click();
}
export async function openPreferences(page:Page){
 const account=page.getByRole('button',{name:'Compte',exact:true});if(await account.count())await account.click();
 await page.getByText('Préférences d’affichage',{exact:true}).click();
}

/** Respect the real admission window before starting a new UI scenario. No 401/403 retry. */
export async function waitForLocalSession(page:Page){
 let response=await page.request.get('/api/v1/me');if(response.status()===429||Number(response.headers()['x-ratelimit-remaining']??300)<180){const delay=Math.min(60500,Math.max(1000,(Number(response.headers()['retry-after']??response.headers()['x-ratelimit-reset'])||60)*1000+250));test.setTimeout(test.info().timeout+delay+5000);console.log('Préparation navigateur : fenêtre réelle de débit respectée avant le scénario.');await page.waitForTimeout(delay);response=await page.request.get('/api/v1/me');expect(response.ok(),await response.text()).toBe(true);await page.reload();}
 expect(response.ok(),await response.text()).toBe(true);
}
