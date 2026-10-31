import type {Node as PMNode} from '@tiptap/pm/model';
import type {RichDocument,AnchorResolution} from '@storymaster/domain';
import {schema,normalizeDocument,DocumentError} from './document.ts';
interface Token{value:string;from:number;to:number}
interface Block{from:number;to:number;signature:string}
interface Projection{tokens:Token[];blocks:Block[];node:PMNode;identity:string;truncated:boolean}
export const ANCHOR_CELL_BUDGET=250000;
export const ANCHOR_TOKEN_BUDGET=20000;
function project(input:RichDocument):Projection{
 const node=schema.nodeFromJSON(normalizeDocument(input)),tokens:Token[]=[],blocks:Block[]=[];let truncated=false;const push=(t:Token)=>{if(tokens.length<ANCHOR_TOKEN_BUDGET)tokens.push(t);else truncated=true;};
 const identity=(n:PMNode):unknown=>{if(n.isText)return n.text;if(n.isLeaf)return {type:n.type.name,attrs:n.attrs};const content:unknown[]=[];n.forEach(child=>{const value=identity(child);if(typeof value==='string'&&typeof content.at(-1)==='string')content[content.length-1]=(content.at(-1) as string)+value;else content.push(value);});return {type:n.type.name,attrs:n.attrs,content};};
 const walk=(n:PMNode,pos:number,parents:string[])=>{if(n.isText){let offset=0;for(const point of n.text!){if(tokens.length>=ANCHOR_TOKEN_BUDGET){truncated=true;break;}push({value:'text:'+point,from:pos+offset,to:pos+offset+point.length});offset+=point.length;}return;}
  if(n.isLeaf){push({value:'leaf:'+n.type.name,from:pos,to:pos+n.nodeSize});return;}
  const kind=n.type.name+JSON.stringify(n.attrs);push({value:'open:'+kind,from:pos,to:pos+1});if(n.isTextblock)blocks.push({from:pos+1,to:pos+n.nodeSize-1,signature:JSON.stringify([parents,kind,n.textBetween(0,n.content.size,'\n','\n')])});n.forEach((child,offset)=>walk(child,pos+1+offset,[...parents,kind]));push({value:'close:'+n.type.name,from:pos+n.nodeSize-1,to:pos+n.nodeSize});};node.forEach((n,pos)=>walk(n,pos,[]));return {tokens,blocks,node,identity:JSON.stringify(identity(node)),truncated};
}
const quote=(n:PMNode,from:number,to:number)=>n.textBetween(from,to,'\n','\n');
export function anchorEvidence(input:RichDocument,from:number,to:number){const p=project(input);if(!Number.isSafeInteger(from)||!Number.isSafeInteger(to)||from<0||to>p.node.content.size||from>=to)throw new DocumentError('INVALID_ANCHOR','Sélection ProseMirror invalide ou caractère Unicode coupé.');const text=quote(p.node,from,to);if(!text.trim()||text.length>4000||!text.isWellFormed())throw new DocumentError('INVALID_ANCHOR','Choisissez un passage non vide de 4 000 caractères au maximum.');return {from,to,quote:text,prefix:Array.from(quote(p.node,0,from)).slice(-32).join(''),suffix:Array.from(quote(p.node,to,p.node.content.size)).slice(0,32).join('')};}
export class AnchorResolver{
 private before:Projection;private after:Projection;private prefix:Uint32Array|null=null;private suffix:Uint32Array|null=null;private identical:boolean;
 constructor(base:RichDocument,current:RichDocument,private revision:number){this.before=project(base);this.after=project(current);const a=this.before.tokens,b=this.after.tokens;this.identical=this.before.identity===this.after.identity;
  if(!this.identical&&!this.before.truncated&&!this.after.truncated&&(a.length+1)*(b.length+1)<=ANCHOR_CELL_BUDGET){const width=b.length+1,cells=(a.length+1)*width,p=this.prefix=new Uint32Array(cells),s=this.suffix=new Uint32Array(cells);for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)p[(i+1)*width+j+1]=a[i]!.value===b[j]!.value?p[i*width+j]!+1:Math.max(p[i*width+j+1]!,p[(i+1)*width+j]!);for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)s[i*width+j]=a[i]!.value===b[j]!.value?s[(i+1)*width+j+1]!+1:Math.max(s[i*width+j+1]!,s[(i+1)*width+j]!);}
 }
 resolve(anchor:{from:number;to:number;quote:string}):AnchorResolution{
  const result=(state:AnchorResolution['state'],reason:AnchorResolution['reason'],from:number|null=null,to:number|null=null):AnchorResolution=>({state,reason,sceneRevision:this.revision,from,to}),a=this.before.tokens,b=this.after.tokens,indices=a.flatMap((t,i)=>t.from>=anchor.from&&t.to<=anchor.to?[i]:[]);
  if(quote(this.before.node,anchor.from,anchor.to)!==anchor.quote)return result('orphaned','passage_missing');
  if(this.identical)return result('valid','unchanged_document',anchor.from,anchor.to);
  if(this.prefix&&this.suffix&&indices.length){const p=this.prefix,s=this.suffix,w=b.length+1,total=s[0]!,mapped:number[]=[];let certain=true;
   for(const i of indices){let unique=-1,canSkip=false;for(let j=0;j<=b.length;j++){if(p[i*w+j]!+s[(i+1)*w+j]! ===total)canSkip=true;if(j<b.length&&a[i]!.value===b[j]!.value&&p[i*w+j]!+1+s[(i+1)*w+j+1]! ===total){if(unique!==-1){certain=false;break;}unique=j;}}if(!certain||canSkip||unique<0){certain=false;break;}mapped.push(unique);}
   if(certain&&mapped.every((j,i)=>i===0||j===mapped[i-1]!+1)){const from=b[mapped[0]!]!.from,to=b[mapped.at(-1)!]!.to;if(quote(this.after.node,from,to)===anchor.quote)return result(from===anchor.from&&to===anchor.to?'valid':'relocated','unique_edit_mapping',from,to);}
  }{const block=this.before.blocks.find(n=>n.from<=anchor.from&&n.to>=anchor.to);if(block&&this.before.blocks.filter(n=>n.signature===block.signature).length===1){const matches=this.after.blocks.filter(n=>n.signature===block.signature);if(matches.length===1){const shift=matches[0]!.from-block.from,from=anchor.from+shift,to=anchor.to+shift;if(quote(this.after.node,from,to)===anchor.quote)return result(from===anchor.from&&to===anchor.to?'valid':'relocated','unique_unchanged_block',from,to);}}}
  const present=quote(this.after.node,0,this.after.node.content.size).includes(anchor.quote);return result(present?'ambiguous':'orphaned',present?(this.prefix?'multiple_correspondences':'complexity_limit'):'passage_missing');
 }
}
