import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {RelationView} from '@storymaster/contracts';
import {choicesFor,relationInput,relationSentence} from '../apps/web/components/narrative/relation-presentation.ts';
const elise={id:'elise',name:'Élise',typeKey:'character' as const,revision:3,moduleEnabled:true,status:'active' as const},marc={...elise,id:'marc',name:'Marc',revision:7};
test('UX-3 : choix inverse traduit en une seule commande avec les deux révisions et qualification explicite',()=>{
 const input=relationInput(elise,marc,'has_father','Lien confirmé','adoptive');assert.equal(input.sourceRef.id,marc.id);assert.equal(input.targetRef.id,elise.id);assert.equal(input.sourceRevision,7);assert.equal(input.targetRevision,3);assert.equal(input.relationType,'parent_of');assert.deepEqual(input.attributes,{description:'Lien confirmé',parentage:'adoptive',parentRole:'father'});
 assert.equal(relationInput(elise,marc,'parent_of','').attributes.parentRole,'parent');assert.equal(relationInput(elise,marc,'sibling_of','').relationType,'sibling_of');assert.equal(relationInput(elise,marc,'student_of','').sourceRef.id,marc.id);
 assert.throws(()=>relationInput(elise,elise,'parent_of',''));assert.equal(choicesFor('place').some(c=>c[1]==='parent_of'),false);assert.equal(choicesFor('character','place').some(c=>c[1]==='parent_of'),false);
});
test('UX-3 : sens parent/enfant et symétrie lus depuis la même arête, sans inférer le genre des noms',()=>{
 const r={source:marc,target:elise,sourceObjectId:marc.id,targetObjectId:elise.id,relationType:'parent_of',attributes:{parentRole:'parent',parentage:'biological'}} as RelationView;
 assert.equal(relationSentence(r,marc.id),'Marc est parent d’Élise');assert.equal(relationSentence(r,elise.id),'Élise est enfant de Marc');assert.equal(relationSentence({...r,attributes:{parentRole:'father'}},elise.id),'Élise a pour père Marc');assert.equal(relationSentence({...r,relationType:'sibling_of'},elise.id),'Élise est frère ou sœur de Marc');assert.equal(relationSentence({...r,relationType:'mentor_of'},elise.id),'Élise est élève de Marc');
});
