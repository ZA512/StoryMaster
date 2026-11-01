import { buildApp } from './app.ts';
import { configFromEnv } from './config.ts';
const config=configFromEnv(),app=await buildApp(config);
for (const signal of ['SIGINT','SIGTERM'] as const) process.once(signal,()=>{void app.close();});
await app.listen({port:config.port,host:process.env.API_BIND_HOST??'127.0.0.1'});
