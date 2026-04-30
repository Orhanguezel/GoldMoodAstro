// packages/shared-backend/modules/consultantServices/controller.ts
import type { FastifyReply, FastifyRequest } from 'fastify';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import * as repo from './repository';
import { db } from '../../db/client';
import { sql } from 'drizzle-orm';

/* ─── Schemas ─── */
const createSchema = z.object({
  name: z.string().trim().min(1).max(160),
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9-]+$/, 'slug_format'),
  description: z.string().trim().max(2000).nullable().optional(),
  duration_minutes: z.coerce.number().int().positive().max(480).default(45),
  price: z.coerce.number().nonnegative().default(0),
  currency: z.string().trim().length(3).default('TRY'),
  is_free: z.coerce.number().int().min(0).max(1).default(0),
  is_active: z.coerce.number().int().min(0).max(1).default(1),
  sort_order: z.coerce.number().int().default(0),
});

const updateSchema = createSchema.partial();

const reorderSchema = z.object({
  items: z.array(z.object({ id: z.string().min(1), sort_order: z.coerce.number().int() })).min(1),
});

/* ─── Helpers ─── */
async function getConsultantIdByUserId(userId: string): Promise<string | null> {
  const result = await db.execute(sql`SELECT id FROM consultants WHERE user_id = ${userId} LIMIT 1`);
  const rows = Array.isArray((result as any)?.[0]) ? (result as any)[0] : (result as any);
  const row = (rows as any[])?.[0];
  return row?.id ?? null;
}

function normalizeServicePayload<T extends { price?: number; is_free?: number }>(data: T) {
  const normalized: Omit<T, 'price'> & { price?: string } = { ...data } as Omit<T, 'price'> & { price?: string };
  if (data.is_free === 1) {
    normalized.price = '0.00';
  } else if (data.price !== undefined) {
    normalized.price = Number(data.price).toFixed(2);
  }
  return normalized;
}

/* ─── PUBLIC ─── */
// GET /consultants/:consultantId/services
export async function listPublic(req: FastifyRequest, reply: FastifyReply) {
  const { consultantId } = req.params as { consultantId: string };
  const rows = await repo.listByConsultant(consultantId, { activeOnly: true });
  return reply.send({ data: rows });
}

/* ─── SELF (consultant kendi servisleri) ─── */
async function resolveCallerConsultantId(req: FastifyRequest): Promise<string | null> {
  const u = (req as any).user as { sub?: string; id?: string } | undefined;
  const userId = u?.id ?? u?.sub;
  if (!userId) return null;
  return await getConsultantIdByUserId(String(userId));
}

export async function listSelf(req: FastifyRequest, reply: FastifyReply) {
  const consultantId = await resolveCallerConsultantId(req);
  if (!consultantId) return reply.code(403).send({ error: { message: 'not_consultant' } });
  const rows = await repo.listByConsultant(consultantId, { activeOnly: false });
  return reply.send({ data: rows });
}

export async function createSelf(req: FastifyRequest, reply: FastifyReply) {
  const consultantId = await resolveCallerConsultantId(req);
  if (!consultantId) return reply.code(403).send({ error: { message: 'not_consultant' } });
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.issues } });

  const id = randomUUID();
  // is_free=1 ise price'ı 0 zorla
  const data = normalizeServicePayload(parsed.data);
  await repo.create({ id, consultant_id: consultantId, ...data });
  return reply.send({ data: { id } });
}

export async function updateSelf(req: FastifyRequest, reply: FastifyReply) {
  const consultantId = await resolveCallerConsultantId(req);
  if (!consultantId) return reply.code(403).send({ error: { message: 'not_consultant' } });
  const { id } = req.params as { id: string };
  const own = await repo.getByIdForConsultant(id, consultantId);
  if (!own) return reply.code(404).send({ error: { message: 'not_found' } });

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.issues } });
  const patch = normalizeServicePayload(parsed.data);
  await repo.update(id, patch as any);
  return reply.send({ data: { id } });
}

export async function deleteSelf(req: FastifyRequest, reply: FastifyReply) {
  const consultantId = await resolveCallerConsultantId(req);
  if (!consultantId) return reply.code(403).send({ error: { message: 'not_consultant' } });
  const { id } = req.params as { id: string };
  const own = await repo.getByIdForConsultant(id, consultantId);
  if (!own) return reply.code(404).send({ error: { message: 'not_found' } });
  await repo.remove(id);
  return reply.send({ data: { id, ok: true } });
}

export async function reorderSelf(req: FastifyRequest, reply: FastifyReply) {
  const consultantId = await resolveCallerConsultantId(req);
  if (!consultantId) return reply.code(403).send({ error: { message: 'not_consultant' } });
  const parsed = reorderSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.issues } });
  await repo.reorder(consultantId, parsed.data.items);
  return reply.send({ data: { ok: true, count: parsed.data.items.length } });
}

/* ─── ADMIN ─── */
export async function listAdmin(req: FastifyRequest, reply: FastifyReply) {
  const { consultantId } = req.params as { consultantId: string };
  const rows = await repo.listByConsultant(consultantId, { activeOnly: false });
  return reply.send({ data: rows });
}

export async function createAdmin(req: FastifyRequest, reply: FastifyReply) {
  const { consultantId } = req.params as { consultantId: string };
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.issues } });
  const id = randomUUID();
  const data = normalizeServicePayload(parsed.data);
  await repo.create({ id, consultant_id: consultantId, ...data });
  return reply.send({ data: { id } });
}

export async function updateAdmin(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const row = await repo.getById(id);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.issues } });
  const patch = normalizeServicePayload(parsed.data);
  await repo.update(id, patch as any);
  return reply.send({ data: { id } });
}

export async function deleteAdmin(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const row = await repo.getById(id);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
  await repo.remove(id);
  return reply.send({ data: { id, ok: true } });
}
