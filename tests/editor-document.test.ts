import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizeDocument,fromDoc,countWords} from '@storymaster/editor';
import {richDiff} from '@storymaster/editor/diff';
import {markdownExport} from '@storymaster/editor/markdown';
const corpus=JSON.parse(await readFile(new URL('./fixtures/editorial-corpus.json',import.meta.url),'utf8'));
test('corpus production : Unicode, structure et marques conservés au JSON et normalisation idempotente',()=>{
 for(const [name,doc] of Object.entries(corpus)){const a=normalizeDocument(doc),b=normalizeDocument(JSON.parse(JSON.stringify(a)));assert.deepEqual(a,b,name);assert.ok(Number.isSafeInteger(countWords(a)));}
 const unicode=JSON.stringify(corpus.unicode);assert.ok(unicode.includes('e\u0301'));assert.ok(unicode.includes('👨‍👩‍👧‍👦'));assert.ok(unicode.includes('𐐷'));assert.equal(JSON.stringify(normalizeDocument(corpus.unicode)).normalize('NFC')===JSON.stringify(normalizeDocument(corpus.unicode)),false);
});
test('diff riche production : marques, destinations, structure et fallback ambigu explicites',()=>{
 const paragraph=(mark:string,href='https://example.test/a',level=0)=>fromDoc({type:'doc',content:[{type:level?'heading':'paragraph',...(level?{attrs:{level}}:{}),content:[{type:'text',text:'Élise',marks:[{type:mark,...(mark==='link'?{attrs:{href}}:{})}]}]}]});
 assert.equal(richDiff(paragraph('bold'),paragraph('italic')).changes[0]!.kind,'format');assert.ok(richDiff(paragraph('link'),paragraph('link','https://example.test/b')).changes[0]!.details!.after[0]!.includes('/b'));
 assert.equal(richDiff(paragraph('bold','',1),paragraph('bold','',2)).changes[0]!.kind,'structure');assert.ok(richDiff(fromDoc(corpus.repeated),paragraph('bold')).fallback);
});
test('Markdown dérivé signale pertes d’espaces marqués et doubles sauts sans modifier JSON',()=>{
 for(const key of ['markSpaces','doubleBreak']){const canonical=normalizeDocument(corpus[key]),copy=JSON.stringify(canonical),result=markdownExport(fromDoc(canonical));assert.ok(result.losses.length>0,key);assert.equal(JSON.stringify(canonical),copy);}
});
test('schéma production : refus de version, propriétés inconnues, URL dangereuse, surprofondeur et Unicode cassé',()=>{
 assert.throws(()=>normalizeDocument(corpus.rich,2));
 const text=(text:string)=>({type:'doc',content:[{type:'paragraph',content:[{type:'text',text}]}]});
 const badLink={type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'lien',marks:[{type:'link',attrs:{href:'javascript:alert(1)'}}]}]}]};
 for(const invalid of [{...corpus.rich,unknown:true},text('\ud800'),badLink])assert.throws(()=>normalizeDocument(invalid));
 let nested:unknown={type:'paragraph'};for(let i=0;i<34;i++)nested={type:'blockquote',content:[nested]};assert.throws(()=>normalizeDocument({type:'doc',content:[nested]}));
});
