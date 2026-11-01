export const mcpScopes=['projects:read','project:read','proposal:read','proposal:write','proposal:submit'] as const;
export type MCPScope=typeof mcpScopes[number];
export const mcpReadScopes:MCPScope[]=['projects:read','project:read','proposal:read'];
export interface ExternalProvenance {initiatorId:string;clientId:string;oauthClientId:string;grantId:string;grantRevision:number;executionId:string}
export interface ExternalClient {id:string;oauthClientId:string;name:string;redirectUris:string[];allowedScopes:MCPScope[];status:'active'|'disabled';revision:number}
export interface DelegatedGrant {id:string;userId:string;clientId:string;projectIds:string[];scopes:MCPScope[];expiresAt:string;status:'active'|'revoked';revision:number;createdAt:string;updatedAt:string;revokedAt:string|null}
export interface MCPAuthorization {id:string;userId:string;clientId:string;grantId:string;tokenFingerprint:string;capabilityHash:string;grantRevision:number;scopes:MCPScope[];expiresAt:string}
export interface MCPGrantEvent {id:string;grantId:string;revision:number;action:string;createdAt:string;snapshot:DelegatedGrant}
