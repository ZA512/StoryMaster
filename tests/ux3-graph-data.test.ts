import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {RelationView} from '@storymaster/contracts';
import {graphData,graphLimits} from '../apps/web/components/narrative/graph-data.ts';
import {MemoryState,hasNarrativeDrafts} from '../apps/web/components/narrative/memory-state.ts';
const node=(id:string)=>({id,name:id,typeKey:'character' as const,revision:1,status:'active' as const,moduleEnabled:true});
const edge=(a:string,b:string,id=a+b)=>({id,source:node(a),target:node(b),sourceObjectId:a,targetObjectId:b,revision:1,relationType:'ally_of',attributes:{},status:'active',linkState:'active'}) as RelationView;
test('UX-3 : projection bornée, déduplication par identité et conservation de la version fraîche',()=>{
 const old=edge('A','B'),fresh={...old,revision:2,attributes:{description:'État frais'}};const d=graphData(node('A'),[{items:[old,fresh],hasMore:false,nextCursor:null}]);assert.equal(d.nodes.length,2);assert.deepEqual(d.relations,[fresh]);
 const rows=Array.from({length:100},(_,i)=>edge('A','N'+i));const capped=graphData(node('A'),[{items:rows,hasMore:true,nextCursor:'suite'}]);assert.equal(capped.nodes.length,graphLimits.nodes);assert.equal(capped.relations.length,graphLimits.nodes-1);assert.equal(capped.capped,true);
 const dense=Array.from({length:25},(_,i)=>Array.from({length:25},(_,j)=>edge('N'+i,'N'+j))).flat().filter(r=>r.source.id!==r.target.id);const d2=graphData(node('N0'),[{items:dense,hasMore:false,nextCursor:null}]);assert.equal(d2.relations.length,graphLimits.edges);assert.equal(d2.capped,true);
});
test('UX-3 : un acquittement tardif réveille la vue remontée, brouillons isolés par humain',()=>{
 const state=new MemoryState<string>(true);let old=0,newView=0;const unsubscribe=state.subscribe('alice/p/fiche',()=>old++);state.set('alice/p/fiche','sending');unsubscribe();const stop=state.subscribe('alice/p/fiche',()=>newView++);state.set('alice/p/fiche',undefined);assert.equal(old,1);assert.equal(newView,1);assert.equal(state.get('alice/p/fiche'),undefined);state.set('alice/p/fiche','saisie');assert.equal(hasNarrativeDrafts('alice'),true);assert.equal(hasNarrativeDrafts('bob'),false);stop();state.set('alice/p/fiche',undefined);assert.equal(hasNarrativeDrafts('alice'),false);
});
