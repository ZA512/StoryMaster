import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {aiToolCatalog} from '@storymaster/application';
import {aiModels,aiProvider} from '@storymaster/domain';
const expected=['project_get_context','entity_search','scene_read','entity_get','relation_list','timeline_list','object_references','proposal_create','proposal_set_operations','proposal_revise','proposal_get','proposal_preview','proposal_validate','proposal_submit'];
assert.deepEqual(aiToolCatalog.map(t=>t.name),expected);
for(const tool of aiToolCatalog){assert.equal(tool.inputSchema.additionalProperties,false,tool.name);for(const property of ['actor','actorType','projectId','providerUrl','url','apiKey','credentialId'])assert.ok(!(property in tool.inputSchema.properties),tool.name+': '+property);}
assert.equal(aiProvider,'local-simulator');assert.deepEqual(aiModels,['discussion-v1','narrative-v1','slow-v1','unknown-v1','unavailable-v1']);
const simulator=readFileSync('packages/infrastructure/src/ai-simulator.ts','utf8');assert.ok(!/\b(fetch|https?|undici|axios|child_process)\b/.test(simulator),'Le simulateur doit rester sans transport externe');
const executor=readFileSync('packages/application/src/ai-executor.ts','utf8');assert.ok(!/\.\s*(approve|merge|query|fetch)\s*\(/.test(executor),'Aucune capacité canonique ou réseau dans les outils IA');
const mcp=JSON.parse(readFileSync('docs/spec/mcp-tools.json','utf8'));assert.equal(mcp.tools.length,13);assert.ok(!mcp.tools.some(t=>/ai_|sql|shell|fetch/.test(t.name)));
console.log('Frontières IA : catalogue fermé, paramètres sans identité/destination, simulateur sans transport et MCP préservé. Contrôle statique complété par les tests PostgreSQL/HTTP.');
