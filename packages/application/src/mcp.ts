import {AppError} from '@storymaster/domain';
import type {Actor,MCPScope} from '@storymaster/domain';
import type {UnitOfWork} from './index.ts';
import {ProjectService} from './index.ts';
import {EditorialService} from './editorial.ts';
import {NarrativeService} from './narrative.ts';
import {ProposalService} from './proposals.ts';
import {checkResourceId,withProject} from './project-access.ts';
import {mcpToolResult,searchNarrativeSchema} from '@storymaster/contracts';
export const mcpToolScopes:Record<string,MCPScope>={project_list:'projects:read',project_get_context:'project:read',entity_search:'project:read',entity_get:'project:read',scene_read:'project:read',relation_list:'project:read',timeline_list:'project:read',proposal_create:'proposal:write',proposal_set_operations:'proposal:write',proposal_preview:'proposal:read',proposal_validate:'proposal:read',proposal_submit:'proposal:submit',proposal_get:'proposal:read'};
export const MCP_RESULT_BYTES=4*1024*1024;
export class ProjectContextService{
 constructor(private db:UnitOfWork,private secret:string){}
 get(a:Actor,p:string){return withProject(this.db,a,p,'narrative.read',async tx=>{const bound:UnitOfWork={transaction:work=>work(tx)},project=await new ProjectService(bound,this.secret).get(a,p),view=await tx.editorial.view(p),modules=await tx.narrative.modules(p);return {project,manuscripts:view.nodes.filter(n=>n.kind==='manuscript').map(n=>({id:n.id,title:n.title,revision:n.revision})),moduleVersions:Object.fromEntries(modules.filter(m=>m.enabled).map(m=>[m.moduleKey,String(m.moduleVersion)]))};});}
}
// The adapter validates the catalogue JSON Schema; these same business services validate commands.
export class MCPService{
 constructor(private db:UnitOfWork,private secret:string){}
 async execute(a:Actor,name:string,args:Record<string,unknown>){if(a.type!=='external_ai'||!Object.hasOwn(mcpToolScopes,name))throw new AppError('FORBIDDEN','Outil non autorisé.',403);return this.db.transaction(async tx=>{const bound:UnitOfWork={transaction:work=>work(tx)},projects=new ProjectService(bound,this.secret),editorial=new EditorialService(bound),narrative=new NarrativeService(bound,this.secret),proposals=new ProposalService(bound,this.secret),p=String(args.projectId??''),id=String(args.proposalId??''),scope=mcpToolScopes[name]!;
 if(name!=='project_list'){checkResourceId(p);await tx.lockProject(p,'shared');await tx.assertActor(a);await tx.mcp.assertGrant(a,p,scope);if(!await tx.getProject(a.userId,p))throw new AppError('NOT_FOUND','Ressource introuvable.',404);await tx.mcp.startCall(a,p,name);}else{const {grant,client,authorization}=await tx.mcp.assertActor(a);if(!grant.scopes.includes(scope)||!client.allowedScopes.includes(scope)||!authorization.scopes.includes(scope))throw new AppError('FORBIDDEN','Scope requis.',403);}
 let data:unknown;const limit=Number(args.limit??20),cursor=args.cursor as string|undefined,revision=args.revision as number|undefined,key=String(args.idempotencyKey??''),expected=Number(args.expectedProposalRevision),version=Number(args.expectedStateVersion);
 switch(name){
 case 'project_list':data=await projects.list(a,limit,cursor);break;
 case 'project_get_context':data=await new ProjectContextService(bound,this.secret).get(a,p);break;
 case 'entity_search':{const query={...args};delete query.projectId;data=await narrative.search(a,p,searchNarrativeSchema.parse(query));break;}
 case 'entity_get':data=await narrative.getObject(a,p,String(args.objectId),revision,args.includeReferences===true,limit,cursor);break;
 case 'scene_read':data=revision===undefined?await editorial.getScene(a,p,String(args.sceneId)):await editorial.revision(a,p,String(args.sceneId),revision);break;
 case 'relation_list':data=await narrative.relationList(a,p,String(args.objectId),limit,cursor);break;
 case 'timeline_list':data=await narrative.timeline(a,p,(args.status??'active') as 'active'|'archived'|'all',limit,cursor);break;
 case 'proposal_create':{const content={...args};delete content.projectId;delete content.idempotencyKey;data=await proposals.create(a,p,content,key,a.executionId!);break;}
 case 'proposal_set_operations':data=await proposals.setOperations(a,p,id,{expectedProposalRevision:expected,operations:args.operations,dependencyRevisions:args.dependencyRevisions},version,key,a.executionId!);break;
 case 'proposal_get':data=await proposals.get(a,p,id);break;
 case 'proposal_preview':data=await proposals.preview(a,p,id,expected);break;
 case 'proposal_validate':data=await proposals.validate(a,p,id,expected);break;
 case 'proposal_submit':data=await proposals.action(a,p,id,'submit',expected,version,key,a.executionId!);break;
 }
 if(name!=='project_list'){const refs:{resourceType:string;resourceId:string;revision:number}[]=[];const collect=(value:unknown)=>{if(Array.isArray(value)){for(const item of value)collect(item);}else if(value&&typeof value==='object'){const o=value as Record<string,unknown>,resourceId=o.resourceId??o.id,revision=o.revision??o.proposalRevision;if(typeof resourceId==='string'&&/^[a-f0-9-]{36}$/.test(resourceId)&&Number.isSafeInteger(revision)&&Number(revision)>0)refs.push({resourceType:String(o.resourceType??o.typeKey??(o.proposalRevision?'proposal':name==='scene_read'?'scene':'resource')),resourceId,revision:Number(revision)});for(const item of Object.values(o))collect(item);}};collect(data);await tx.mcp.recordResources(a.executionId!,refs);}
 const result={data};if(Buffer.byteLength(JSON.stringify(mcpToolResult(result)),'utf8')+8192>MCP_RESULT_BYTES)throw new AppError('VALIDATION_FAILED','Réponse trop volumineuse ; utilisez une page ou une ressource plus petite.',413);return result;
 });}
}
