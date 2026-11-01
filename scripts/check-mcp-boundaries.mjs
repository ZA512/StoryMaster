import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import YAML from 'yaml';
import {mcpToolScopes} from '@storymaster/application';
const catalog=JSON.parse(readFileSync('docs/spec/mcp-tools.json','utf8')),policy=JSON.parse(readFileSync('docs/spec/mcp-policy.json','utf8')),compose=YAML.parse(readFileSync('compose.yaml','utf8'));
assert.deepEqual(Object.keys(mcpToolScopes).sort(),catalog.tools.map(t=>t.name).sort());
for(const tool of catalog.tools){assert.equal(tool.inputSchema.additionalProperties,false,tool.name);assert.equal(mcpToolScopes[tool.name],policy.tools.find(p=>p.name===tool.name).scope);for(const name of ['actor','actorType','userId','clientId','grantId','url','providerUrl','token','secret'])assert.ok(!(name in tool.inputSchema.properties),tool.name+': '+name);assert.ok(!/^(?:proposal_(?:merge|approve|review|reject)|execute.*|fetch.*|sql.*|shell.*)$/.test(tool.name),tool.name);}
const manifest=JSON.parse(readFileSync('apps/mcp/package.json','utf8'));assert.equal(manifest.dependencies['@modelcontextprotocol/server'],'2.4.0');assert.equal(JSON.parse(readFileSync('package.json','utf8')).devDependencies['@modelcontextprotocol/client'],'2.4.0');
const adapter=readFileSync('apps/mcp/src/app.ts','utf8');assert.ok(adapter.includes('createMcpHandler(')&&adapter.includes('toNodeHandler('));assert.ok(!/\.(query|approve|merge|saveScene)\s*\(/.test(adapter));
assert.deepEqual(compose.services.mcp.profiles,['mcp']);assert.deepEqual(compose.services.mcp.ports,['127.0.0.1:3500:3500']);assert.equal(compose.services.mcp.environment.MCP_ENABLED,'${MCP_ENABLED:-false}');assert.ok(readFileSync('.env.example','utf8').includes('MCP_ENABLED=false'));
console.log('Frontières MCP statiques : SDK épinglé, scopes/catalogue, absence de commandes privilégiées et activation loopback explicite. Complément des tests réels.');
