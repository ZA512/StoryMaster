import {buildMCPApp,mcpConfigFromEnv} from './app.ts';
const config=mcpConfigFromEnv(),app=await buildMCPApp(config);
await app.listen({host:config.host??'127.0.0.1',port:config.port??3500});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{void app.close();});
