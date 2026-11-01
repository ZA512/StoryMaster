import {resolve} from 'node:path';
import {generateBackupKey,readBackupKey,verifyBackup} from './backup-crypto.ts';
import {createInstallationBackup,restoreInstallationIsolated,postgresBackupImage,stopIsolatedRecovery} from './installation-backup.ts';
const [command,...args]=process.argv.slice(2);
try {
 if(command==='keygen'&&args.length===1){await generateBackupKey(resolve(args[0]!));console.log('Clé créée, à conserver séparément et à dupliquer hors disque selon GO-04.');}
 else if(command==='create'&&args.length===2){const result=await createInstallationBackup(resolve(args[0]!),resolve(args[1]!));console.log(JSON.stringify({directory:result.directory,id:result.manifest.id,bytes:result.manifest.components.reduce((n,c)=>n+c.bytes,0)}));}
 else if(command==='verify'&&args.length===2){const key=await readBackupKey(resolve(args[1]!),resolve(args[0]!));const result=await verifyBackup(resolve(args[0]!),key,postgresBackupImage);console.log(JSON.stringify({id:result.id,authenticated:true,nativeRestoration:'non exécutée par verify'}));}
 else if(command==='restore-isolated'&&args.length===3){const result=await restoreInstallationIsolated(resolve(args[0]!),resolve(args[1]!),resolve(args[2]!));console.log(JSON.stringify({project:result.project,directory:result.directory,socketDirectory:result.socketDirectory,nativeVerified:result.nativeVerified,durationMs:result.durationMs,quarantined:true}));}
 else if(command==='stop-isolated'&&args.length===2){await stopIsolatedRecovery(args[0]!,resolve(args[1]!));console.log('Récupération arrêtée ; volume isolé conservé.');}
 else throw Error('Usage : backup.ts keygen CLE.key | create RACINE CLE.key | verify BACKUP CLE.key | restore-isolated BACKUP CLE.key RACINE_ISOLEE | stop-isolated PROJET SOCKET');
} catch(error){console.error(error instanceof Error?error.message:'Opération de récupération refusée.');process.exitCode=1;}
