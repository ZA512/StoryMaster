import { z } from 'zod';
export const createProjectSchema = z.object({
  name: z.string().min(1).max(200), description: z.string().max(4000).optional(),
  language: z.string().regex(/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/).max(35).optional(),
}).strict();
export const updateProjectSchema = z.object({ set: createProjectSchema.partial().refine(value => Object.keys(value).length > 0) }).strict();
export const listProjectsSchema = z.object({ limit: z.coerce.number().int().min(1).max(100).default(20), cursor: z.string().max(2000).optional() }).strict();
export const idempotencyKeySchema = z.string().min(8).max(200);
export const emptyBodySchema = z.object({}).strict();
export const userSchema = z.object({ id: z.uuid(), displayName: z.string(), email: z.string().nullable() }).strict();
export const projectSchema = z.object({
  id: z.uuid(), name: z.string(), description: z.string(), language: z.string(),
  visibility: z.literal('private'), status: z.enum(['active','archived']), revision: z.number().int().positive(),
  role: z.enum(['owner','admin','author','reviewer','reader']), createdAt: z.iso.datetime(), updatedAt: z.iso.datetime(),
}).strict();
export type ProjectDto = z.infer<typeof projectSchema>;
export type UserDto = z.infer<typeof userSchema>;
export interface Page<T> { items: T[]; nextCursor: string | null; hasMore: boolean }
export interface MeDto { user: UserDto; csrfToken: string; expiresAt: string }
export interface ErrorDto { error: { code: string; message: string; correlationId: string; retryable: boolean; details?: Record<string, unknown> } }
