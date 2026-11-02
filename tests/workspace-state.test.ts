import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseLayout,defaultLayout,parseSceneId,workshopSession,layoutKey,selectionKey} from '../apps/web/components/writer/workspace-state.ts';
test('préférences corrompues : valeurs bornées, aucune propriété narrative conservée',()=>{
 assert.deepEqual(parseLayout('invalide'),defaultLayout);
 assert.deepEqual(parseLayout(JSON.stringify({plan:true,context:false,planWidth:2000,contextWidth:-1,text:'privé',token:'secret'})),{plan:true,context:false,planWidth:320,contextWidth:280});
 assert.equal(parseLayout(JSON.stringify({plan:true,context:true,planWidth:'500',contextWidth:null})).planWidth,264);
 assert.equal(parseSceneId('javascript:alert(1)'), '');
});
test('navigation : isolation stricte par compte/projet, aucune autorisation implicite depuis un ID local',()=>{
 const a=workshopSession('alice','p'),b=workshopSession('bob','p'),other=workshopSession('alice','q');a.recent.push('scene');a.scroll.set('scene',460);
 assert.deepEqual(b.recent,[]);assert.deepEqual(other.recent,[]);assert.equal(workshopSession('alice','p').scroll.get('scene'),460);
 assert.notEqual(layoutKey('alice'),layoutKey('bob'));assert.notEqual(selectionKey('alice','p'),selectionKey('alice','q'));
});
