import {randomUUID} from 'node:crypto';
import {CollaborationService} from '@storymaster/application';
import {db,secret,person,sessions,correlation} from './database.helper.ts';
import {fixture} from './editorial.helper.ts';
import type {CollaboratorRole} from '@storymaster/domain';
export const collaboration=new CollaborationService(db,secret,{publicOrigin:'http://localhost:3000'});
export function invitationSecret(link:string){const q=new URLSearchParams(new URL(link).hash.slice(1));return {id:q.get('invitation')!,token:q.get('token')!};}
export async function verifiedPerson(email='bob@example.test'){const a=await person();const raw=await sessions.create(a.user,correlation(),undefined,email);return {...await sessions.read(raw),raw};}
export async function inviteMember(f:Awaited<ReturnType<typeof fixture>>,role:CollaboratorRole='reviewer',email='bob@example.test'){
 const b=await verifiedPerson(email),created=await collaboration.invite(f.owner.actor,f.project.id,{email,role},randomUUID(),correlation()),i=invitationSecret(created.link!);await collaboration.respond(b.actor,i.id,i.token,'accept',1,randomUUID(),correlation());return {b,i,created};
}
