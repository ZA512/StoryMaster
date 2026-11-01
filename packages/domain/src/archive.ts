import type {Role} from './index.ts';
export const exportStatuses=['queued','running','ready','failed','cancelled','expired'] as const;
export type ExportStatus=typeof exportStatuses[number];
export interface ExportJob {id:string;projectId:string;requesterId:string;status:ExportStatus;revision:number;createdAt:string;updatedAt:string;expiresAt:string;bytes:number|null;sha256:string|null;errorCode:string|null}
export interface ExportJobRecord extends ExportJob {sessionHash:string;epoch:string;snapshotRole:Role|null;leaseId:string|null;leaseUntil:string|null;artifactName:string|null}
export interface ProjectArchiveSnapshot {capturedAt:string;projectId:string;access:{commentHistory:'full'|'own';membershipHistory:'full'|'excluded';completeForProject:boolean};families:Record<string,Record<string,unknown>[]>}
export const archiveLimits={snapshotBytes:64*1024*1024,zipBytes:64*1024*1024,totalRows:100000,durationMs:60000,leaseSeconds:90,expiresSeconds:86400,maxPendingPerUser:2,maxLivePerProject:20} as const;
