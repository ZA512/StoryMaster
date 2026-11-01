import type {ExportJobRecord,ProjectArchiveSnapshot,Role} from '@storymaster/domain';
export interface ArchivePort {
 job(projectId:string,id:string,lock?:boolean):Promise<ExportJobRecord|null>;
 jobs(projectId:string,userId:string):Promise<ExportJobRecord[]>;
 insert(job:ExportJobRecord):Promise<void>;
 save(job:ExportJobRecord):Promise<void>;
 pending(userId:string,projectId:string):Promise<{user:number;project:number}>;
 candidate():Promise<ExportJobRecord|null>;
 snapshot(projectId:string,requesterId:string,role:Role):Promise<ProjectArchiveSnapshot>;
}
export interface ArchiveArtifacts {
 build(job:ExportJobRecord,snapshot:ProjectArchiveSnapshot,signal:AbortSignal):Promise<{name:string;bytes:number;sha256:string}>;
 read(name:string,bytes:number,sha256:string):Promise<Buffer>;
 remove(name:string):Promise<void>;
}
