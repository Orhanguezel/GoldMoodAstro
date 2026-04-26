// =============================================================
// FILE: src/modules/resources/admin.controller.ts
// FINAL — Admin Resources controller
// =============================================================

import type { RouteHandler } from 'fastify';
import { randomUUID } from 'crypto';
import { and, asc, desc, eq, like, type SQL } from 'drizzle-orm';

import { db } from '../../db/client';
import { resources } from './schema';
import {
  listResourcesAdminQuerySchema,
  createResourceAdminBodySchema,
  updateResourceAdminBodySchema,
} from './validation';
import { toActive01 } from '../_shared';

const safeText = (v: unknown) => String(v ?? '').trim();

const orderColumns: Record<string, any> = {
  created_at: resources.created_at,
  updated_at: resources.updated_at,
  title: resources.title,
  type: resources.type,
  capacity: resources.capacity,
};

function buildWhere(q: any): SQL | undefined {
  const where: SQL[] = [];

  if (q.q) {
    const likeVal = `%${safeText(q.q)}%`;
    where.push(like(resources.title, likeVal));
  }

  if (q.type) where.push(eq(resources.type, safeText(q.type)));

  if (typeof q.is_active !== 'undefined') {
    const val = toActive01(q.is_active);
    if (typeof val !== 'undefined') where.push(eq(resources.is_active, val));
  }

  if (q.external_ref_id) where.push(eq(resources.external_ref_id, safeText(q.external_ref_id)));

  if (!where.length) return undefined;
  return and(...where) as SQL;
}

/** GET /admin/resources */
export const listResourcesAdminHandler: RouteHandler = async (req, reply) => {
  try {
    const q = listResourcesAdminQuerySchema.parse((req as any).query ?? {});
    const where = buildWhere(q);

    const limit = q.limit ?? 50;
    const offset = q.offset ?? 0;

    const orderCol = orderColumns[q.sort ?? 'updated_at'] ?? resources.updated_at;
    const orderDir = q.order === 'asc' ? asc(orderCol) : desc(orderCol);

    let dataQuery = db.select().from(resources).$dynamic();
    if (where) dataQuery = dataQuery.where(where);

    const rows = await dataQuery.orderBy(orderDir).limit(limit).offset(offset);

    const items = rows.map((r) => ({
      ...r,
      label: String((r as any).label ?? r.title ?? r.id),
    }));

    return reply.send(items);
  } catch (e: any) {
    if (e?.name === 'ZodError')
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'resources_list_failed' } });
  }
};

/** GET /admin/resources/:id */
export const getResourceAdminHandler: RouteHandler = async (req, reply) => {
  try {
    const id = safeText((req.params as any)?.id);
    if (!id || id.length !== 36) return reply.code(400).send({ error: { message: 'invalid_id' } });

    const [row] = await db.select().from(resources).where(eq(resources.id, id)).limit(1);
    if (!row) return reply.code(404).send({ error: { message: 'not_found' } });

    return reply.send(row);
  } catch (e: any) {
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'resource_get_failed' } });
  }
};

/** POST /admin/resources */
export const createResourceAdminHandler: RouteHandler = async (req, reply) => {
  try {
    const body = createResourceAdminBodySchema.parse(req.body ?? {});

    const id = randomUUID();
    const now = new Date() as any;

    const type = body.type ?? 'other';
    const is_active = typeof body.is_active === 'undefined' ? 1 : toActive01(body.is_active) ?? 1;

    await db.insert(resources).values({
      id,
      type,
      title: safeText(body.title),
      capacity: body.capacity ?? 1,
      external_ref_id: body.external_ref_id ?? null,
      is_active,
      created_at: now,
      updated_at: now,
    } as any);

    const [row] = await db.select().from(resources).where(eq(resources.id, id)).limit(1);
    return reply.code(201).send(row ?? null);
  } catch (e: any) {
    if (e?.name === 'ZodError')
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'resource_create_failed' } });
  }
};

/** PATCH /admin/resources/:id */
export const updateResourceAdminHandler: RouteHandler = async (req, reply) => {
  try {
    const id = safeText((req.params as any)?.id);
    if (!id || id.length !== 36) return reply.code(400).send({ error: { message: 'invalid_id' } });

    const patch = updateResourceAdminBodySchema.parse(req.body ?? {});

    const next: any = {};
    if (typeof patch.type !== 'undefined') next.type = patch.type ?? 'other';
    if (typeof patch.title !== 'undefined') next.title = patch.title ? safeText(patch.title) : '';
    if (typeof patch.capacity !== 'undefined') next.capacity = patch.capacity ?? 1;
    if (typeof patch.external_ref_id !== 'undefined')
      next.external_ref_id = patch.external_ref_id ?? null;
    if (typeof patch.is_active !== 'undefined')
      next.is_active = toActive01(patch.is_active) ?? 1;

    if (Object.keys(next).length === 0) {
      const [row] = await db.select().from(resources).where(eq(resources.id, id)).limit(1);
      return reply.send(row ?? null);
    }

    next.updated_at = new Date() as any;

    await db.update(resources).set(next).where(eq(resources.id, id));

    const [row] = await db.select().from(resources).where(eq(resources.id, id)).limit(1);
    return reply.send(row ?? null);
  } catch (e: any) {
    if (e?.name === 'ZodError')
      return reply.code(400).send({ error: { message: 'validation_error', details: e.issues } });
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'resource_update_failed' } });
  }
};

/** DELETE /admin/resources/:id */
export const deleteResourceAdminHandler: RouteHandler = async (req, reply) => {
  try {
    const id = safeText((req.params as any)?.id);
    if (!id || id.length !== 36) return reply.code(400).send({ error: { message: 'invalid_id' } });

    await db.delete(resources).where(eq(resources.id, id));
    return reply.code(204).send();
  } catch (e: any) {
    req.log.error(e);
    return reply.code(500).send({ error: { message: 'resource_delete_failed' } });
  }
};
