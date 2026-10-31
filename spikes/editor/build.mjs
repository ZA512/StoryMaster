import { build } from 'esbuild';
import { mkdir,copyFile } from 'node:fs/promises';
await mkdir('dist',{recursive:true});
await build({entryPoints:['src/browser.ts'],outfile:'dist/editor.js',bundle:true,platform:'browser',format:'esm',target:'es2024',sourcemap:false,minify:false,legalComments:'linked'});
for(const file of ['index.html','style.css'])await copyFile('public/'+file,'dist/'+file);
