import { test,expect } from '@playwright/test';
import type { Page,Browser } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
async function accessible(page:Page){const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([]);}
async function login(page:Page,name='alice') {
  await page.goto('/connexion');await page.getByRole('link',{name:'Se connecter',exact:true}).click();
  await expect(page.locator('#username')).toBeVisible();
  const authorization=new URL(page.url());expect(authorization.searchParams.get('code_challenge_method')).toBe('S256');expect(authorization.searchParams.get('nonce')).toBeTruthy();expect(authorization.searchParams.get('state')).toBeTruthy();
  await page.locator('#username').fill(name);await page.locator('#password').fill('local-only-storymaster');await page.locator('#kc-login').click();
  await expect(page).toHaveURL(/\/projets$/);await expect(page.getByRole('heading',{name:'Mes projets',exact:true})).toBeVisible();
}
async function separateUser(browser:Browser,name:string) {
 const context=await browser.newContext({baseURL:process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'}),page=await context.newPage();await login(page,name);return {context,page};
}
test('OIDC réel, projets privés, modification persistée, archive/restore, conflits et logout',async({page,browser})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await mkdir('artifacts/local',{recursive:true});
  const response=await page.goto('/connexion');expect(response!.headers()['content-security-policy']).toContain('nonce-');
  await accessible(page);await page.screenshot({path:'artifacts/local/connexion-desktop.png',fullPage:true});
  await login(page);
  const cookies=await page.context().cookies(),session=cookies.find(c=>c.name==='sm_session_local');expect(session?.httpOnly).toBe(true);expect(session?.sameSite).toBe('Lax');
  expect(await page.evaluate(()=>({local:Object.keys(localStorage),session:Object.keys(sessionStorage)}))).toEqual({local:[],session:[]});
  const title='Les jours de brume '+Date.now();
  await page.getByRole('link',{name:'Nouveau projet',exact:true}).click();await page.getByLabel('Point de départ').selectOption('short');await expect(page.getByLabel('Nom du projet')).toHaveValue('Ma nouvelle');await page.getByLabel('Nom du projet').fill(title);await page.getByLabel('Une intention, un résumé').fill('Une voyageuse retrouve une ville oubliée.');
  await page.getByRole('button',{name:'Créer le projet'}).click();await expect(page.getByRole('heading',{name:title,exact:true})).toBeVisible();
  const projectPath=new URL(page.url()).pathname,id=projectPath.split('/').at(-1)!;
  await page.getByLabel('Nom du projet').fill(title+' — révisé');await page.getByRole('button',{name:'Enregistrer',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Informations enregistrées.');
  await page.reload();await expect(page.getByLabel('Nom du projet')).toHaveValue(title+' — révisé');
  await accessible(page);await page.keyboard.press('Tab');await expect(page.getByRole('link',{name:'Aller au contenu'})).toBeFocused();await page.screenshot({path:'artifacts/local/projet-desktop.png',fullPage:true});
  const bob=await separateUser(browser,'bob');
  try {const denied=await bob.page.request.get('/api/v1/projects/'+id);expect(denied.status()).toBe(404);expect(await denied.text()).not.toContain(title);await bob.page.goto(projectPath);await expect(bob.page.getByRole('alert').filter({hasText:'introuvable'})).toBeVisible();}
  finally {await bob.context.close();}
  const other=await page.context().newPage();await other.goto(projectPath);await expect(other.getByLabel('Nom du projet')).toHaveValue(title+' — révisé');
  await page.getByLabel('Une intention, un résumé').fill('Nouvelle intention.');await page.getByRole('button',{name:'Enregistrer',exact:true}).click();await expect(page.getByRole('status')).toHaveText('Informations enregistrées.');
  await other.getByLabel('Nom du projet').fill('Brouillon conservé');await other.getByRole('button',{name:'Enregistrer',exact:true}).click();await expect(other.getByRole('alert').filter({hasText:'changé'})).toBeVisible();await expect(other.getByLabel('Nom du projet')).toHaveValue('Brouillon conservé');await other.close();
  await page.getByRole('button',{name:'Archiver le projet',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Archiver',exact:true}).click();await expect(page.getByLabel('Nom du projet')).toBeDisabled();
  await page.getByRole('button',{name:'Réactiver le projet',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Réactiver',exact:true}).click();await expect(page.getByLabel('Nom du projet')).toBeEnabled();
  await page.getByRole('link',{name:'← Mes projets',exact:true}).click();await expect(page.getByRole('heading',{name:'Mes projets',exact:true})).toBeVisible();await page.screenshot({path:'artifacts/local/projets-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});await accessible(page);await page.screenshot({path:'artifacts/local/projets-mobile.png',fullPage:true});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.getByRole('button',{name:'Se déconnecter',exact:true}).click();await expect(page).toHaveURL(/\/connexion\?deconnecte=1/);expect((await page.request.get('/api/v1/me')).status()).toBe(401);
  expect(errors).toEqual([]);
});
test('callback falsifié et accès privé sans session refusés',async({page})=>{
  await page.goto('/auth/callback?code=faux&state=faux');await expect(page).toHaveURL(/erreur=connexion/);await expect(page.getByRole('alert').filter({hasText:'connexion'})).toBeVisible();
  const response=await page.request.get('/api/v1/projects');expect(response.status()).toBe(401);
  await page.goto('/projets');await expect(page).toHaveURL(/\/connexion$/);
});
