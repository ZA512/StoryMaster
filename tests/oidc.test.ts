import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { generateKeyPairSync,sign,createHash } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import { OidcProvider } from '@storymaster/infrastructure';
const key=generateKeyPairSync('rsa',{modulusLength:2048}),wrong=generateKeyPairSync('rsa',{modulusLength:2048});
const encode=(value:unknown)=>Buffer.from(JSON.stringify(value)).toString('base64url');
for (const scenario of ['valid','state','nonce','issuer','audience','expired','signature','pkce','replay'] as const) {
  test(`OIDC Code + PKCE : ${scenario}`,async()=>{
    let nonce='',challenge='',consumed=false;
    const server=createServer(async(req,res)=>{
      res.setHeader('Content-Type','application/json');
      const path=req.url!;
      if(path==='/.well-known/openid-configuration') return res.end(JSON.stringify({issuer,authorization_endpoint:issuer+'/authorize',token_endpoint:issuer+'/token',jwks_uri:issuer+'/jwks',response_types_supported:['code'],subject_types_supported:['public'],id_token_signing_alg_values_supported:['RS256'],token_endpoint_auth_methods_supported:['none'],code_challenge_methods_supported:['S256']}));
      if(path==='/jwks') return res.end(JSON.stringify({keys:[{...key.publicKey.export({format:'jwk'}),kid:'test',alg:'RS256',use:'sig'}]}));
      if(path==='/token') {
        let body='';for await (const chunk of req) body+=String(chunk);
        const data=new URLSearchParams(body),actual=createHash('sha256').update(data.get('code_verifier') ?? '').digest('base64url');
        if(consumed || data.get('code')!=='one-use-code' || actual!==challenge){res.statusCode=400;return res.end(JSON.stringify({error:'invalid_grant'}));}consumed=true;
        const now=Math.floor(Date.now()/1000);
        const claims={iss:scenario==='issuer' ? 'http://foreign.invalid' : issuer,sub:'stable-subject',aud:scenario==='audience' ? 'other-client' : 'storymaster-web',iat:now,exp:scenario==='expired' ? now-600 : now+300,nonce:scenario==='nonce' ? 'wrong-nonce' : nonce,name:'Alice Test',email:'alice@example.test',email_verified:true};
        const payload=encode({alg:'RS256',kid:'test'})+'.'+encode(claims);
        const signature=sign('RSA-SHA256',Buffer.from(payload),scenario==='signature' ? wrong.privateKey : key.privateKey).toString('base64url');
        return res.end(JSON.stringify({access_token:'opaque-test-access-token',token_type:'Bearer',expires_in:300,id_token:payload+'.'+signature}));
      }
      res.statusCode=404;res.end('{}');
    });
    await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
    const issuer=`http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    try {
      const provider=new OidcProvider({issuer,clientId:'storymaster-web',publicOrigin:'http://localhost:3000',local:true});
      const login=await provider.start(),url=new URL(login.url);
      nonce=url.searchParams.get('nonce')!;challenge=url.searchParams.get('code_challenge')!;
      assert.equal(url.searchParams.get('code_challenge_method'),'S256');assert.equal(url.searchParams.get('response_type'),'code');
      const callback=new URL('http://localhost:3000/auth/callback');callback.searchParams.set('code','one-use-code');callback.searchParams.set('state',scenario==='state' ? 'wrong-state' : login.secret.state);
      if(scenario==='pkce')login.secret.verifier='wrong-verifier';
      if(scenario==='valid' || scenario==='replay') {
        const result=await provider.complete(callback,login.secret);assert.equal(result.identity.subject,'stable-subject');assert.equal(result.identity.issuer,issuer);
        if(scenario==='replay')await assert.rejects(provider.complete(callback,login.secret));
      } else await assert.rejects(provider.complete(callback,login.secret));
    } finally {server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}
  });
}
