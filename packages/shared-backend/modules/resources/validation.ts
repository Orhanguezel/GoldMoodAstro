// =============================================================
// FILE: src/modules/resources/validation.ts
// FINAL — Resources validation
// =============================================================

import { z } from 'zod';
import { boolLike, uuid36Schema } from '../_shared';
import { resourceTypeEnum } from '../_shared/resources';

const ResourceTypeEnum = z.enum(resourceTypeEnum);

export const listResourcesAdminQuerySchema = z.object({
  q: z.string().trim().optional(),
  type: ResourceTypeEnum.optional(),
  is_active: boolLike.optional(),
  external_ref_id: z.string().trim().optional(),

  limit: z.coerce.number().int().min(1).max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),

  sort: z.enum(['created_at', 'updated_at', 'title', 'type', 'capacity']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});
export type ListResourcesAdminQuery = z.infer<typeof listResourcesAdminQuerySchema>;

export const createResourceAdminBodySchema = z.object({
  type: ResourceTypeEnum.optional().nullable(),
  title: z.string().trim().min(1).max(255),
  capacity: z.coerce.number().int().min(1).max(999).optional().nullable(),
  external_ref_id: uuid36Schema.optional().nullable(),
  is_active: boolLike.optional(),
});
export type CreateResourceAdminBody = z.infer<typeof createResourceAdminBodySchema>;

export const updateResourceAdminBodySchema = z
  .object({
    type: ResourceTypeEnum.optional().nullable(),
    title: z.string().trim().min(1).max(255).optional().nullable(),
    capacity: z.coerce.number().int().min(1).max(999).optional().nullable(),
    external_ref_id: uuid36Schema.optional().nullable(),
    is_active: boolLike.optional(),
  })
  .partial();
export type UpdateResourceAdminBody = z.infer<typeof updateResourceAdminBodySchema>;

export const listResourcesPublicQuerySchema = z.object({
  type: ResourceTypeEnum.optional(),
});
export type ListResourcesPublicQuery = z.infer<typeof listResourcesPublicQuerySchema>;
