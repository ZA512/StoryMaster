import {z} from 'zod';
import {mcpScopes,mcpReadScopes} from '@storymaster/domain';
const id=z.string().uuid(),scopes=z.array(z.enum(mcpScopes)).min(1).max(5).refine(v=>new Set(v).size===v.length),projects=z.array(id).min(1).max(100).refine(v=>new Set(v).size===v.length);
export const grantCreateSchema=z.strictObject({clientId:id,projectIds:projects,scopes:scopes.default(mcpReadScopes),durationSeconds:z.number().int().min(60).max(2592000).default(3600),allowProposals:z.boolean().default(false)});
export const grantUpdateSchema=grantCreateSchema.omit({clientId:true});
export const grantRevokeSchema=z.strictObject({});
export type GrantCreateInput=z.infer<typeof grantCreateSchema>;
export type GrantUpdateInput=z.infer<typeof grantUpdateSchema>;
export interface MCPVerifiedToken {issuer:string;subject:string;oauthClientId:string;scopes:string[];expiresAt:string;tokenFingerprint:string}
export interface MCPVerifier {verify(token:string):Promise<MCPVerifiedToken>}
// One formatter for structured results and the text fallback, across both protocol eras.
export function mcpToolResult(structuredContent:Record<string,unknown>,isError=false){return {content:[{type:'text' as const,text:JSON.stringify(structuredContent)}],structuredContent,...(isError?{isError:true}:{})};}
