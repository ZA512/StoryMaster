import {createCipheriv,createDecipheriv,randomBytes} from 'node:crypto';
import type {CredentialEnvelope} from '@storymaster/domain';
import type {CredentialCipher} from '@storymaster/application';
type Binding={id:string;ownerId:string;provider:string;keyVersion:number};
const bytes=(s:string)=>Buffer.from(s,'base64');
function encrypt(key:Buffer,value:Buffer,aad:Buffer){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(aad);return {ciphertext:Buffer.concat([cipher.update(value),cipher.final()]).toString('base64'),iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64')};}
function decrypt(key:Buffer,ciphertext:string,iv:string,tag:string,aad:Buffer){const cipher=createDecipheriv('aes-256-gcm',key,bytes(iv));cipher.setAAD(aad);cipher.setAuthTag(bytes(tag));return Buffer.concat([cipher.update(bytes(ciphertext)),cipher.final()]);}
export class EnvelopeCredentialCipher implements CredentialCipher {
 private keys:Map<string,Buffer>;
 constructor(keyring:Record<string,string>,public activeVersion:string){this.keys=new Map(Object.entries(keyring).map(([version,key])=>[version,bytes(key)]));if(!/^[A-Za-z0-9_-]{1,64}$/.test(activeVersion)||!this.keys.has(activeVersion)||[...this.keys.values()].some(k=>k.length!==32))throw Error('Configuration du chiffrement IA invalide.');}
 private aad(binding:Binding,purpose:string){return Buffer.from(JSON.stringify(['storymaster.ai.credential.v1',binding.ownerId,binding.id,binding.provider,binding.keyVersion,purpose]));}
 seal(secret:string,b:Binding):CredentialEnvelope {const dataKey=randomBytes(32);try{const data=encrypt(dataKey,Buffer.from(secret),this.aad(b,'data')),wrapped=encrypt(this.keys.get(this.activeVersion)!,dataKey,this.aad(b,'wrap:'+this.activeVersion));return {algorithm:'A256GCM',protectionVersion:this.activeVersion,wrappedKey:wrapped.ciphertext,wrapIv:wrapped.iv,wrapTag:wrapped.tag,...data};}finally{dataKey.fill(0);}}
 open(e:CredentialEnvelope,b:Binding){try{const protection=this.keys.get(e.protectionVersion);if(e.algorithm!=='A256GCM'||!protection)throw Error();const key=decrypt(protection,e.wrappedKey,e.wrapIv,e.wrapTag,this.aad(b,'wrap:'+e.protectionVersion));try{return decrypt(key,e.ciphertext,e.iv,e.tag,this.aad(b,'data')).toString('utf8');}finally{key.fill(0);}}catch{throw Error('Identifiant fournisseur indisponible.');}}
 rewrap(e:CredentialEnvelope,b:Binding){try{const old=this.keys.get(e.protectionVersion);if(!old)throw Error();const key=decrypt(old,e.wrappedKey,e.wrapIv,e.wrapTag,this.aad(b,'wrap:'+e.protectionVersion));try{const wrapped=encrypt(this.keys.get(this.activeVersion)!,key,this.aad(b,'wrap:'+this.activeVersion));return {...e,protectionVersion:this.activeVersion,wrappedKey:wrapped.ciphertext,wrapIv:wrapped.iv,wrapTag:wrapped.tag};}finally{key.fill(0);}}catch{throw Error('Rotation de protection indisponible.');}}
}
