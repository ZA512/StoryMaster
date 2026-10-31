import { Pool, migrate } from '@storymaster/infrastructure';
const connectionString=process.env.MIGRATION_DATABASE_URL;
if (!connectionString) throw new Error('MIGRATION_DATABASE_URL est requis.');
const pool=new Pool({connectionString});
try { await migrate(pool); console.log('Migrations StoryMaster appliquées.'); }
finally { await pool.end(); }
