import {Pool} from '@storymaster/infrastructure';
import {temporaryExportCleanup} from './temporary-exports.ts';
const [mode='--preview',digest,...extra]=process.argv.slice(2),directory=process.env.EXPORT_DIRECTORY,epochPath=process.env.AUTHORIZATION_EPOCH_FILE;
if(!directory||!epochPath||!['--preview','--apply'].includes(mode)||extra.length||mode==='--apply'&&!/^[a-f0-9]{64}$/.test(digest??''))throw Error('Usage : cleanup-exports.ts --preview | --apply SHA256_APERCU ; chemins privés configurés requis.');
const pool=new Pool({connectionString:process.env.DATABASE_URL});try{console.log(JSON.stringify(await temporaryExportCleanup(pool,directory,epochPath,mode==='--apply',digest),null,2));}catch{console.error(JSON.stringify({event:'export.cleanup_failed',code:'CLEANUP_REFUSED'}));process.exitCode=1;}finally{await pool.end();}
