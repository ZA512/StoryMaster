import {randomUUID} from 'node:crypto';
import {constants} from 'node:fs';
import {open,realpath,lstat,rename,unlink} from 'node:fs/promises';
import {isAbsolute,resolve,dirname} from 'node:path';
import type {Pool,PoolClient} from 'pg';
import {AppError} from '@storymaster/domain';
export interface AuthorizationEpoch {format:'storymaster-authorization-epoch';version:1;instanceId:string;epoch:string;state:'active'|'quarantined'}
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const closed=()=>new AppError('TEMPORARILY_UNAVAILABLE','Les autorisations de cette installation ne peuvent pas être vérifiées. Intervention opérateur requise.',503);
export async function readAuthorizationEpoch(path:string):Promise<AuthorizationEpoch>{try{if(!isAbsolute(path)||resolve(path)!==path||await realpath(path)!==path)throw closed();const file=await open(path,constants.O_RDONLY|constants.O_NOFOLLOW);try{const s=await file.stat();if(!s.isFile()||s.size>4096||s.mode&0o022)throw closed();const e=JSON.parse(await file.readFile('utf8')) as AuthorizationEpoch;if(e.format!=='storymaster-authorization-epoch'||e.version!==1||!uuid.test(e.instanceId)||!uuid.test(e.epoch)||!['active','quarantined'].includes(e.state))throw closed();return e;}finally{await file.close();}}catch{throw closed();}}
// Never cache: a lost, quarantined or changed external checkpoint closes every new request/transaction.
export class AuthorizationEpochGuard {
 constructor(private path:string){if(!path)throw closed();}
 async current(){const e=await readAuthorizationEpoch(this.path);if(e.state!=='active')throw closed();return e;}
 // A concurrent security transaction seals the file before its SQL COMMIT. Briefly
 // re-read only the checkpoint pair; never replay work or accept a mismatched pair.
 // Missing/quarantined/other-installation checkpoints still fail immediately.
 async assert(db:Pool|PoolClient){const deadline=performance.now()+250;for(let attempt=0;attempt<25;attempt++){const e=await this.current();const r=(await db.query('SELECT instance_id,epoch,state FROM runtime_authorization_state WHERE singleton=true')).rows[0];if(!r||r.instance_id!==e.instanceId||r.state!=='active')throw closed();if(r.epoch===e.epoch)return e;if(performance.now()>=deadline||attempt===24)throw closed();await new Promise(resolve=>setTimeout(resolve,10));}throw closed();}
 // Security state is deliberately write-ahead: if commit is lost/rolled back after this seal,
 // external and SQL epochs disagree and all services stay closed. Recovery must quarantine;
 // never copy an old checkpoint back to regain availability.
 async sealTransaction(db:PoolClient){const changed=(await db.query("SELECT 1 FROM runtime_authorization_state WHERE singleton=true AND mutation_txid=pg_current_xact_id_if_assigned()")).rowCount;if(!changed)return;const e=await this.assert(db),next={...e,epoch:randomUUID()},directory=dirname(this.path),info=await lstat(directory);if(!info.isDirectory()||info.isSymbolicLink()||info.mode&0o077||info.uid!==process.getuid?.()||await realpath(directory)!==directory)throw closed();const temporary=this.path+'.'+randomUUID()+'.tmp';let renamed=false;try{const file=await open(temporary,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);try{await file.writeFile(JSON.stringify(next)+'\n');await file.sync();}finally{await file.close();}await rename(temporary,this.path);renamed=true;const parent=await open(directory,'r');try{await parent.sync();}finally{await parent.close();}const result=await db.query('UPDATE runtime_authorization_state SET epoch=$1,changed_at=clock_timestamp() WHERE singleton=true AND epoch=$2 AND instance_id=$3',[next.epoch,e.epoch,e.instanceId]);if(result.rowCount!==1)throw closed();}catch{if(!renamed)await unlink(temporary).catch(()=>{});throw closed();}}

}
