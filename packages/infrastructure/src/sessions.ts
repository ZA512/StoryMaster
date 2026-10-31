import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import type pg from 'pg';
import type { Actor, User } from '@storymaster/domain';
import { unauthenticated } from '@storymaster/domain';
import { sha256 } from './database.ts';
export interface Session { actor: Actor; user: User; expiresAt: string; rawToken: string; verifiedEmail:string|null }
export class SessionStore {
  constructor(private pool: pg.Pool, private secret: string, private ttlSeconds=28800) {}
  seal(value:string):string {
    const iv=randomBytes(12), cipher=createCipheriv('aes-256-gcm',createHash('sha256').update(this.secret).digest(),iv);
    const encrypted=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]);
    return Buffer.concat([iv,cipher.getAuthTag(),encrypted]).toString('base64url');
  }
  unseal(value:string):string {
    const data=Buffer.from(value,'base64url');
    const decipher=createDecipheriv('aes-256-gcm',createHash('sha256').update(this.secret).digest(),data.subarray(0,12));
    decipher.setAuthTag(data.subarray(12,28));
    return Buffer.concat([decipher.update(data.subarray(28)),decipher.final()]).toString('utf8');
  }
  async create(user:User, correlationId:string, idToken?:string,verifiedEmail?:string|null):Promise<string> {
    const raw=randomBytes(32).toString('base64url'), hash=sha256(raw), client=await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('INSERT INTO sessions(token_hash,user_id,expires_at,id_token_cipher,verified_email) VALUES ($1,$2,clock_timestamp()+$3*interval \'1 second\',$4,$5)',[hash,user.id,this.ttlSeconds,idToken ? this.seal(idToken) : null,verifiedEmail??null]);
      await client.query("INSERT INTO audit_events(id,actor_user_id,actor_type,action,resource_id,correlation_id) VALUES ($1,$2,'human','session.created',$2,$3)",[randomUUID(),user.id,correlationId]);
      await client.query('COMMIT'); return raw;
    } catch (e) { await client.query('ROLLBACK'); throw e; }
    finally { client.release(); }
  }
  async read(raw:string|undefined):Promise<Session> {
    if (!raw || !/^[A-Za-z0-9_-]{43}$/.test(raw)) throw unauthenticated();
    const hash=sha256(raw);
    const result=await this.pool.query<{id:string;display_name:string;email:string|null;status:'active';expires_at:Date;verified_email:string|null}>(`SELECT u.id,u.display_name,u.email,u.status,s.expires_at,s.verified_email FROM sessions s JOIN app_users u ON s.user_id=u.id
      WHERE s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at>clock_timestamp() AND u.status='active'`,[hash]);
    const row=result.rows[0]; if (!row) throw unauthenticated();
    return {actor:{type:'human',userId:row.id,sessionHash:hash},user:{id:row.id,displayName:row.display_name,email:row.email,status:row.status},expiresAt:row.expires_at.toISOString(),rawToken:raw,verifiedEmail:row.verified_email};
  }
  csrf(raw:string):string { return createHmac('sha256',this.secret).update('csrf:'+raw).digest('base64url'); }
  validCsrf(raw:string,value:unknown):boolean {
    if (typeof value !== 'string') return false;
    const a=Buffer.from(this.csrf(raw)), b=Buffer.from(value);
    return a.length===b.length && timingSafeEqual(a,b);
  }
  async revoke(session:Session,correlationId:string):Promise<string|undefined> {
    const client=await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result=await client.query<{id_token_cipher:string|null}>('UPDATE sessions SET revoked_at=clock_timestamp() WHERE token_hash=$1 AND revoked_at IS NULL RETURNING id_token_cipher',[session.actor.sessionHash]);
      await client.query("INSERT INTO audit_events(id,actor_user_id,actor_type,action,resource_id,correlation_id) VALUES ($1,$2,'human','session.revoked',$2,$3)",[randomUUID(),session.user.id,correlationId]);
      await client.query('COMMIT');
      const sealed=result.rows[0]?.id_token_cipher;
      return sealed ? this.unseal(sealed) : undefined;
    } catch (e) { await client.query('ROLLBACK'); throw e; }
    finally { client.release(); }
  }
  async beginLogin(secret:unknown):Promise<string> {
    const raw=randomBytes(32).toString('base64url');
    await this.pool.query('DELETE FROM login_transactions WHERE expires_at<=clock_timestamp()');
    await this.pool.query('INSERT INTO login_transactions(token_hash,secret_cipher,expires_at) VALUES ($1,$2,clock_timestamp()+interval \'10 minutes\')',[sha256(raw),this.seal(JSON.stringify(secret))]);
    return raw;
  }
  async consumeLogin(raw:string|undefined):Promise<string> {
    if (!raw || !/^[A-Za-z0-9_-]{43}$/.test(raw)) throw unauthenticated();
    const result=await this.pool.query<{secret_cipher:string}>('DELETE FROM login_transactions WHERE token_hash=$1 AND expires_at>clock_timestamp() RETURNING secret_cipher',[sha256(raw)]);
    if (!result.rows[0]) throw unauthenticated();
    return this.unseal(result.rows[0].secret_cipher);
  }
}
