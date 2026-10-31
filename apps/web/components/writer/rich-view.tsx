import type {ReactNode} from 'react';
import type {RichDocument,RichNode} from '@storymaster/domain';
import {safeUrl} from '@storymaster/editor';
function render(node:RichNode,key:number):ReactNode{
 let children:ReactNode=node.text??node.content?.map(render);
 for(const mark of node.marks??[]){if(mark.type==='bold')children=<strong>{children}</strong>;else if(mark.type==='italic')children=<em>{children}</em>;else if(mark.type==='strike')children=<s>{children}</s>;else if(mark.type==='link'&&safeUrl(mark.attrs?.href))children=<a href={String(mark.attrs!.href)} rel="noopener noreferrer nofollow" title={typeof mark.attrs?.title==='string'?mark.attrs.title:undefined}>{children}</a>;}
 switch(node.type){case 'doc':return <div key={key}>{children}</div>;case 'paragraph':return <p key={key}>{children||<br/>}</p>;case 'heading':{const level=Number(node.attrs?.level??1);return level===1?<h1 key={key}>{children}</h1>:level===2?<h2 key={key}>{children}</h2>:level===3?<h3 key={key}>{children}</h3>:level===4?<h4 key={key}>{children}</h4>:level===5?<h5 key={key}>{children}</h5>:<h6 key={key}>{children}</h6>;}case 'bulletList':return <ul key={key}>{children}</ul>;case 'orderedList':return <ol key={key} start={Number(node.attrs?.start??1)}>{children}</ol>;case 'listItem':return <li key={key}>{children}</li>;case 'blockquote':return <blockquote key={key}>{children}</blockquote>;case 'hardBreak':return <br key={key}/>;default:return <span key={key}>{children}</span>;}
}
export function RichView({doc}:{doc:RichDocument}){return <div className="rich-view">{render(doc,0)}</div>;}
