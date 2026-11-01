import {z} from 'zod';
import {exportStatuses} from '@storymaster/domain';
export const exportJobSchema=z.strictObject({id:z.uuid(),projectId:z.uuid(),requesterId:z.uuid(),status:z.enum(exportStatuses),revision:z.number().int().positive().max(Number.MAX_SAFE_INTEGER),createdAt:z.iso.datetime(),updatedAt:z.iso.datetime(),expiresAt:z.iso.datetime(),bytes:z.number().int().positive().max(67108864).nullable(),sha256:z.string().regex(/^[a-f0-9]{64}$/).nullable(),errorCode:z.string().max(100).nullable()});
