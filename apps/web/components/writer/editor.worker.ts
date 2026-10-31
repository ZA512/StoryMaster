import {countWords,fromDoc} from '@storymaster/editor';
import {richDiff} from '@storymaster/editor/diff';
self.onmessage=(event:MessageEvent)=>{
 const {id,kind,content,before,after,generation,sceneId}=event.data;
 try {self.postMessage({id,kind,sceneId,generation,result:kind==='count'?countWords(content):richDiff(fromDoc(before),fromDoc(after))});}
 catch {self.postMessage({id,kind,sceneId,generation,error:'Calcul indisponible. Les versions intégrales restent lisibles.'});}
};
