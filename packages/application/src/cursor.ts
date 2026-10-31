import {createHmac,timingSafeEqual} from 'node:crypto';
import {AppError} from '@storymaster/domain';
export class CursorCodec {
 constructor(private secret:string){}
 encode(scope:string,after:unknown){const body=Buffer.from(JSON.stringify({version:1,scope,expiresAt:Date.now()+15*60*1000,after})).toString('base64url');return body+'.'+createHmac('sha256',this.secret).update(body).digest('base64url');}
 decode<T>(scope:string,cursor:string):T{try{if(cursor.length>8192)throw Error();const parts=cursor.split('.');if(parts.length!==2)throw Error();const [body,signature]=parts;if(!body||!signature)throw Error();const expected=createHmac('sha256',this.secret).update(body).digest(),given=Buffer.from(signature,'base64url');if(given.length!==expected.length||!timingSafeEqual(given,expected))throw Error();const value=JSON.parse(Buffer.from(body,'base64url').toString());if(value.version!==1||value.scope!==scope||!Number.isFinite(value.expiresAt)||value.expiresAt<Date.now()||!value.after)throw Error();return value.after as T;}catch{throw new AppError('VALIDATION_FAILED','Ce curseur ne correspond pas à cette recherche ou a expiré. Actualisez les résultats.',422);}}
}
