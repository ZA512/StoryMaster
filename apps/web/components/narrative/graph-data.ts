import type {PageDto,RelationView} from '@storymaster/contracts';
type RelationEndpoint=RelationView['source'];
export const graphLimits={nodes:60,edges:200,page:20,pages:30} as const;
export interface GraphData {nodes:RelationEndpoint[];relations:RelationView[];capped:boolean}
/** Bounded presentation projection of authorized API rows, never a write model. */
export function graphData(root:RelationEndpoint,pages:PageDto<RelationView>[]):GraphData{
 const nodes=new Map<string,RelationEndpoint>([[root.id,root]]),relations=new Map<string,RelationView>();let capped=false;
 for(const page of pages)for(const r of page.items){
  if(!relations.has(r.id)&&relations.size>=graphLimits.edges){capped=true;continue;}
  const missing=[r.source,r.target].filter(n=>!nodes.has(n.id));if(nodes.size+missing.length>graphLimits.nodes){capped=true;continue;}
  for(const n of [r.source,r.target])if(!nodes.has(n.id)||nodes.get(n.id)!.revision<=n.revision)nodes.set(n.id,n);
  if(!relations.has(r.id)||relations.get(r.id)!.revision<=r.revision)relations.set(r.id,r);
 }
 return {nodes:[...nodes.values()],relations:[...relations.values()],capped};
}
