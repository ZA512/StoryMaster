import * as oidc from 'openid-client';
import type { Identity } from '@storymaster/domain';
export interface OidcSettings { issuer:string; clientId:string; publicOrigin:string; internalOrigin?:string; local:boolean }
export interface LoginSecret { verifier:string; state:string; nonce:string }
export class OidcProvider {
  private configuration?:Promise<oidc.Configuration>;
  constructor(private settings:OidcSettings) {
    const issuer=new URL(settings.issuer), origin=new URL(settings.publicOrigin);
    if (!settings.local && (issuer.protocol!=='https:' || origin.protocol!=='https:')) throw new Error('HTTPS requis hors environnement local.');
    if (settings.local && !['localhost','127.0.0.1','[::1]'].includes(origin.hostname)) throw new Error('L’environnement local doit rester sur une origine loopback.');
  }
  private config():Promise<oidc.Configuration> {
    if (!this.configuration) this.configuration=this.discover().catch(e => {this.configuration=undefined;throw e;});
    return this.configuration;
  }
  private async discover():Promise<oidc.Configuration> {
    const pinned=new URL(this.settings.issuer);
    const customFetch:oidc.CustomFetch=async(input,init) => {
      const url=new URL(input);
      if (url.origin!==pinned.origin) throw new Error('Endpoint OIDC hors origine configurée.');
      if (this.settings.internalOrigin) {
        const internal=new URL(this.settings.internalOrigin);
        url.protocol=internal.protocol;url.host=internal.host;
      }
      return fetch(url,{...init,body:init.body instanceof Uint8Array ? new Uint8Array(init.body) : init.body});
    };
    const config=await oidc.discovery(pinned,this.settings.clientId,{id_token_signed_response_alg:'RS256'},oidc.None(),{
      [oidc.customFetch]:customFetch, execute:this.settings.local ? [oidc.allowInsecureRequests] : [], timeout:10,
    });
    oidc.enableNonRepudiationChecks(config); // Signature JWS aussi, pas uniquement TLS + validation des claims.
    return config;
  }
  async start():Promise<{url:string;secret:LoginSecret}> {
    const config=await this.config(), verifier=oidc.randomPKCECodeVerifier(),state=oidc.randomState(),nonce=oidc.randomNonce();
    const url=oidc.buildAuthorizationUrl(config,{redirect_uri:this.settings.publicOrigin+'/auth/callback',scope:'openid profile email',code_challenge:await oidc.calculatePKCECodeChallenge(verifier),code_challenge_method:'S256',state,nonce});
    return {url:url.href,secret:{verifier,state,nonce}};
  }
  async complete(callback:URL, secret:LoginSecret):Promise<{identity:Identity;idToken:string}> {
    const result=await oidc.authorizationCodeGrant(await this.config(),callback,{pkceCodeVerifier:secret.verifier,expectedState:secret.state,expectedNonce:secret.nonce,idTokenExpected:true});
    const claims=result.claims();
    if (!claims || !result.id_token || claims.iss!==this.settings.issuer || typeof claims.sub!=='string') throw new Error('Identité OIDC invalide.');
    return {identity:{issuer:claims.iss,subject:claims.sub,displayName:String(claims.name ?? claims.preferred_username ?? 'Auteur').slice(0,200),email:claims.email_verified===true && typeof claims.email==='string' ? claims.email : null},idToken:result.id_token};
  }
  async logout(idToken:string|undefined):Promise<string> {
    if (!idToken) return this.settings.publicOrigin+'/connexion?deconnecte=1';
    return oidc.buildEndSessionUrl(await this.config(),{id_token_hint:idToken,post_logout_redirect_uri:this.settings.publicOrigin+'/connexion?deconnecte=1'}).href;
  }
}
