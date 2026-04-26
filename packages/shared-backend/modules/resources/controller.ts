// =============================================================
// FILE: src/modules/resources/controller.ts
// FINAL — Public resources controller
// =============================================================

import type { RouteHandler } from 'fastify';
import { and, eq } from 'drizzle-orm';

import { db } from '../../db/client';
import { resources } from './schema';
import { listResourcesPublicQuerySchema } from './validation';

/** GET /resources?type=... */
export const listResourcesPublicHandler: RouteHandler = async (req, reply) => {
  try {
    const q = listResourcesPublicQuerySchema.parse((req as any).query ?? {});

    const where = q.type
      ? and(eq(resources.is_active, 1), eq(resources.type, q.type))
      : eq(resources.is_active, 1);

    const rows = await db.select().from(resources).where(where).orderBy(resources.title);

    const items = rows.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      capacity: r.capacity,
      external_ref_id: r.external_ref_id ?? null,
      label: r.title,
    }));

    return reply.send(items);
  } catch (e: any) {
    if (e?.name === 'ZodError')
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'resources_list_failed' } });
  }
};
