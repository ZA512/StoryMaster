import type {Role} from './index.ts';
export const aiExecutionStates=['queued','running','succeeded','failed','cancelled','unknown'] as const;
export type AIExecutionState=typeof aiExecutionStates[number];
export const aiModels=['discussion-v1','narrative-v1','slow-v1','unknown-v1','unavailable-v1'] as const;
export type AIModel=typeof aiModels[number];
export const aiProvider='local-simulator' as const;
export const aiCanPropose=(role:Role)=>role!=='reader';
export const aiTerminal=(s:AIExecutionState)=>!['queued','running'].includes(s);
export interface AIPolicy {maxCalls:number;maxTools:number;maxInputTokens:number;maxOutputTokens:number;maxContextBytes:number;durationMs:number;maxConcurrent:number}
export const aiHardLimits:AIPolicy={maxCalls:6,maxTools:12,maxInputTokens:100000,maxOutputTokens:4096,maxContextBytes:64000,durationMs:60000,maxConcurrent:2};
export interface AIProvenance {executionId:string;initiatorId:string;provider:typeof aiProvider;model:AIModel;simulated:true}
export interface CredentialEnvelope {algorithm:'A256GCM';protectionVersion:string;wrappedKey:string;wrapIv:string;wrapTag:string;ciphertext:string;iv:string;tag:string}
