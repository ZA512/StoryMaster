import {randomUUID} from 'node:crypto';
import {AIAssistantService,AIOrchestrator} from '@storymaster/application';
import type {ProviderAdapter} from '@storymaster/application';
import {EnvelopeCredentialCipher,LocalAIProvider} from '@storymaster/infrastructure';
import {bibleFixture,create,setRefs,reference} from './narrative.helper.ts';
import {editorial,doc} from './editorial.helper.ts';
import {db,secret,correlation} from './database.helper.ts';
export const demoKey='demo-storymaster-canary-abc12345678',protectionKey=Buffer.alloc(32,84).toString('base64');
export const cipher=new EnvelopeCredentialCipher({test_v1:protectionKey},'test_v1');
export const assistant=new AIAssistantService(db,secret,cipher,true);
export const key=()=>randomUUID();
export function orchestrator(provider:ProviderAdapter=new LocalAIProvider()){return new AIOrchestrator(assistant,provider);}
export async function aiFixture(){const f=await bibleFixture(),a=f.owner.actor,p=f.project.id,character=await create(a,p,'character','Élise'),scene=await editorial.saveScene(a,p,f.s.id,doc('Élise arrive au port. Rien ne doit être appliqué automatiquement.'),1,key(),correlation());await setRefs(a,p,scene.id,[reference(character,'present')]);const credential=await assistant.createCredential(a,p,{provider:'local-simulator',label:'Démonstration privée',secret:demoKey},key(),correlation()),conversation=await assistant.createConversation(a,p,{title:'Conversation privée d’Alice',credentialId:credential.id,model:'narrative-v1'},key(),correlation());return {...f,character,credential,conversation};}
export async function queued(f:Awaited<ReturnType<typeof aiFixture>>,options:{model?:'discussion-v1'|'narrative-v1'|'slow-v1'|'unknown-v1'|'unavailable-v1';intent?:'discuss'|'propose';message?:string;limits?:{maxCalls?:number;maxTools?:number;maxOutputTokens?:number;durationMs?:number}}={}){const a=f.owner.actor,p=f.project.id,c=options.model?await assistant.createConversation(a,p,{title:'Autre scénario',credentialId:f.credential.id,model:options.model},key(),correlation()):f.conversation,plan=await assistant.prepareContext(a,p,c.id,{message:options.message??'Propose un événement et relie-le au personnage.',intent:options.intent??'propose',selection:{sceneId:f.s.id,includeRelated:true,searchQuery:'Élise'},limits:options.limits},c.revision,key(),correlation()),execution=await assistant.enqueue(a,p,c.id,{planId:plan.id,contextHash:plan.contextHash,consent:true},c.revision,key(),correlation());return {plan,execution,conversation:c};}
