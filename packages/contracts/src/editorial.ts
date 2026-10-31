import { z } from 'zod';
import type { EditorialNode, RichDocument, SceneRevision } from '@storymaster/domain';
export const editorialKinds=['manuscript','chapter','scene'] as const;
const revision=z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const title=z.string().trim().min(1).max(200).refine(s=>!/[\r\n]/.test(s)),summary=z.string().max(4000);
const statuses=z.array(z.string().trim().min(1).max(40)).min(1).max(30).refine(a=>new Set(a).size===a.length);
export const createEditorialSchema=z.strictObject({title,summary:summary.optional(),status:z.string().max(40).optional(),expectedStructureRevision:revision});
export const updateEditorialSchema=z.strictObject({expectedRevision:revision,set:z.strictObject({title:title.optional(),summary:summary.optional(),status:z.string().min(1).max(40).optional(),writingStatuses:statuses.optional()}).refine(a=>Object.keys(a).length>0)});
export const moveEditorialSchema=z.strictObject({expectedRevision:revision,targetParentId:z.string().uuid(),beforeId:z.string().uuid().nullable(),expectedSourceStructureRevision:revision,expectedTargetStructureRevision:revision,targetStatus:z.string().max(40).optional()});
export const archiveEditorialSchema=z.strictObject({expectedRevision:revision,archived:z.boolean()});
export const saveSceneSchema=z.strictObject({contentFormatVersion:z.literal(1),content:z.unknown()});
export const restoreSceneSchema=z.strictObject({sourceRevision:revision});
export const revisionQuerySchema=z.strictObject({limit:z.coerce.number().int().min(1).max(100).default(20),beforeRevision:z.coerce.number().int().positive().optional()});
export const compareQuerySchema=z.strictObject({from:z.coerce.number().int().positive(),to:z.coerce.number().int().positive()});
export const exportQuerySchema=z.strictObject({format:z.enum(['markdown','json'])});
export type EditorialCreate=z.infer<typeof createEditorialSchema>;
export type EditorialUpdate=z.infer<typeof updateEditorialSchema>;
export type EditorialMove=z.infer<typeof moveEditorialSchema>;
export type EditorialItem=Omit<EditorialNode,'content'|'contentHash'>;
export interface ChapterOutline extends EditorialItem { scenes:EditorialItem[] }
export interface ManuscriptOutline extends EditorialItem { chapters:ChapterOutline[] }
export interface EditorialOutline {projectId:string;revision:number;structureRevision:number;manuscripts:ManuscriptOutline[]}
export interface EditorialAck {id:string;revision:number;structureRevision:number;projectEditorialRevision:number}
export interface SceneDto {
 id:string;projectId:string;chapterId:string;title:string;summary:string;status:string;archived:boolean;revision:number;
 contentFormatVersion:1;content:RichDocument;contentHash:string;wordCount:number;createdAt:string;updatedAt:string;references:import('@storymaster/domain').SceneReference[];
}
export interface SceneSaveAck {id:string;revision:number;contentHash:string;wordCount:number;updatedAt:string;changeSetId:string}
export type SceneRevisionMeta=Omit<SceneRevision,'content'|'metadata'|'contentHash'> & {title:string};
export interface RevisionPage {items:SceneRevisionMeta[];hasMore:boolean;nextBeforeRevision:number|null}
export interface EditorialExport {format:'markdown'|'json';filename:string;mimeType:string;text:string;warnings:{sceneId:string;title:string;message:string}[]}
