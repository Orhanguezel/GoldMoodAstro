// packages/shared-backend/modules/homeSections/controller.ts
import type { FastifyReply, FastifyRequest } from 'fastify';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import * as repo from './repository';

const createSchema = z.object({
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9_]+$/, 'slug_format'),
  label: z.string().trim().min(1).max(160),
  component_key: z.string().trim().min(1).max(80),
  order_index: z.coerce.number().int().default(0),
  is_active: z.coerce.number().int().min(0).max(1).default(1),
  config: z.record(z.unknown()).nullable().optional(),
});

const updateSchema = z.object({
  label: z.string().trim().min(1).max(160).optional(),
  component_key: z.string().trim().min(1).max(80).optional(),
  order_index: z.coerce.number().int().optional(),
  is_active: z.coerce.number().int().min(0).max(1).optional(),
  config: z.record(z.unknown()).nullable().optional(),
});

const reorderSchema = z.object({
  items: z.array(z.object({ id: z.string().min(1), order_index: z.coerce.number().int() })).min(1),
});

/* ─── PUBLIC ─── */
export async function listPublic(_req: FastifyRequest, reply: FastifyReply) {
  const rows = await repo.listActive();
  return reply.send({ data: rows });
}

/* ─── ADMIN ─── */
export async function listAdmin(_req: FastifyRequest, reply: FastifyReply) {
  const rows = await repo.listAll();
  return reply.send({ data: rows });
}

export async function getAdmin(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const row = await repo.getById(id);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send({ data: row });
}

export async function createAdmin(req: FastifyRequest, reply: FastifyReply) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.issues } });
  const id = randomUUID();
  await repo.create({ id, ...parsed.data, config: parsed.data.config ?? null });
  return reply.send({ data: { id } });
}

export async function updateAdmin(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.issues } });
  const row = await repo.getById(id);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
  await repo.update(id, parsed.data);
  return reply.send({ data: { id } });
}

export async function deleteAdmin(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const row = await repo.getById(id);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
  await repo.remove(id);
  return reply.send({ data: { id, ok: true } });
}

export async function reorderAdmin(req: FastifyRequest, reply: FastifyReply) {
  const parsed = reorderSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.issues } });
  await repo.bulkReorder(parsed.data.items);
  return reply.send({ data: { ok: true, count: parsed.data.items.length } });
}
