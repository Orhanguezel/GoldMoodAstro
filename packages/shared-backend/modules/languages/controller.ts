import type { FastifyReply, FastifyRequest } from 'fastify';
import { randomUUID } from 'crypto';
import * as repo from './repository';
import { createLanguageSchema, updateLanguageSchema } from './validation';

export async function listPublic(_req: FastifyRequest, reply: FastifyReply) {
  const rows = await repo.list({ activeOnly: true });
  return reply.send({ data: rows });
}

export async function listAdmin(_req: FastifyRequest, reply: FastifyReply) {
  const rows = await repo.list();
  return reply.send({ data: rows });
}

export async function getAdmin(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const row = await repo.getById(id);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });
  return reply.send({ data: row });
}

export async function createAdmin(req: FastifyRequest, reply: FastifyReply) {
  const parsed = createLanguageSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.issues } });

  const id = randomUUID();
  await repo.create({ id, ...parsed.data });
  return reply.code(201).send({ data: { id } });
}

export async function updateAdmin(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const row = await repo.getById(id);
  if (!row) return reply.code(404).send({ error: { message: 'not_found' } });

  const parsed = updateLanguageSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.issues } });

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
