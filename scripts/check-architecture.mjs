import { readFileSync, readdirSync } from 'node:fs';
const allowed = { domain: [], contracts: ['domain'], application: ['domain','contracts'], infrastructure: ['domain','contracts','application'] };
for (const [name, dependencies] of Object.entries(allowed)) {
  const manifest = JSON.parse(readFileSync(`packages/${name}/package.json`, 'utf8'));
  for (const dep of Object.keys(manifest.dependencies ?? {})) {
    if (dep.startsWith('@storymaster/') && !dependencies.includes(dep.split('/')[1])) throw new Error(`Dépendance interdite: ${name} → ${dep}`);
  }
  for (const file of readdirSync(`packages/${name}/src`, { recursive: true }).filter(f => f.endsWith('.ts'))) {
    const source = readFileSync(`packages/${name}/src/${file}`, 'utf8');
    if (['domain','application'].includes(name) && /from ['"](?:pg|fastify|openid-client|@storymaster\/infrastructure)/.test(source)) throw new Error(`Infrastructure importée depuis ${name}/${file}`);
  }
}
console.log('Dépendances orientées vers le domaine : OK');
// La preuve CRDT du spike ne doit pas devenir une dépendance applicative du MVP.
for (const parent of ['apps','packages']) {
  for (const directory of readdirSync(parent)) {
    const manifest = JSON.parse(readFileSync(`${parent}/${directory}/package.json`,'utf8'));
    for (const name of Object.keys(manifest.dependencies ?? {})) {
      if (['yjs','y-prosemirror','@storymaster/spike-a'].includes(name)) throw new Error(`Dépendance du prototype interdite en production: ${parent}/${directory} → ${name}`);
    }
  }
}
