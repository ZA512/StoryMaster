import {mkdir,chown,chmod} from 'node:fs/promises';
const uid=Number(process.env.APP_RUNTIME_UID??1000),gid=Number(process.env.APP_RUNTIME_GID??1000);
if(!Number.isSafeInteger(uid)||uid<1||!Number.isSafeInteger(gid)||gid<1)throw Error('UID/GID non privilégiés requis.');
const path='/var/lib/storymaster/exports';await mkdir(path,{recursive:true,mode:0o700});await chown(path,uid,gid);await chmod(path,0o700);
