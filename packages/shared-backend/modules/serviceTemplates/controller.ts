import type { FastifyReply, FastifyRequest } from 'fastify';
import { randomUUID } from 'crypto';
import * as repo from './repository';
import { createServiceTemplateSchema, updateServiceTemplateSchema } from './validation';

function normalizeTemplatePayload<T extends { price?: number; is_free?: number }>(data: T) {
  const normalized: Omit<T, 'price'> & { price?: string } = { ...data } as Omit<T, 'price'> & { price?: string };
  if (data.is_free === 1) {
    normalized.price = '0.00';
  } else if (data.price !== undefined) {
    normalized.price = Number(data.price).toFixed(2);
  }
  return normalized;
}

export async function listAdmin(req: FastifyRequest, reply: FastifyReply) {
  const { category_slug } = req.query as { category_slug?: string };
  const rows = await repo.list({ category_slug });
  return reply.send({ data: rows });
}

export async function getAdmin(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const row = await repo.getById(id);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send({ data: row });
}

export async function createAdmin(req: FastifyRequest, reply: FastifyReply) {
  const parsed = createServiceTemplateSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.issues } });
  const id = randomUUID();
  await repo.create({ id, ...normalizeTemplatePayload(parsed.data) });
  return reply.send({ data: { id } });
}

export async function updateAdmin(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const row = await repo.getById(id);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
  const parsed = updateServiceTemplateSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.issues } });
  await repo.update(id, normalizeTemplatePayload(parsed.data));
  return reply.send({ data: { id } });
}

export async function deleteAdmin(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const row = await repo.getById(id);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
  await repo.remove(id);
  return reply.send({ data: { id, ok: true } });
}
