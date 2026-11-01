import {Pool} from '@storymaster/infrastructure';
import {initializeCurrentAuthorization} from './authorization-epoch.ts';
const path=process.argv[2],url=process.env.MIGRATION_DATABASE_URL;
if(!path||!url)throw Error('Chemin absolu de nouvelle époque et MIGRATION_DATABASE_URL requis. Adoption initiale seulement, jamais après restauration.');
const pool=new Pool({connectionString:url});try{await initializeCurrentAuthorization(pool,path);console.log('Époque de l’installation courante initialisée ; autorisations existantes conservées.');}finally{await pool.end();}
