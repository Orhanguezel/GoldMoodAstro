// packages/shared-backend/modules/auth/deletion.controller.ts
import type { FastifyReply, FastifyRequest } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import * as repo from './deletion.repository';

export async function handleRequestDeletion(req: FastifyRequest, reply: FastifyReply) {
  const user = (req as any).user;
  if (!user) return reply.status(401).send({ error: 'Yetkisiz erişim.' });

  const existing = await repo.getActiveRequest(user.id);
  if (existing) return reply.status(400).send({ error: 'Zaten aktif bir silme talebiniz bulunuyor.' });

  const requestedAt = new Date();
  const scheduledFor = new Date();
  scheduledFor.setDate(requestedAt.getDate() + 7);

  const request = await repo.createDeletionRequest({
    id: uuidv4(),
    userId: user.id,
    requestedAt,
    scheduledFor,
    status: 'pending',
    reason: (req.body as any)?.reason || null,
    ipAddress: req.ip,
  });

  return reply.send({ data: request });
}

export async function handleCancelDeletion(req: FastifyRequest, reply: FastifyReply) {
  const user = (req as any).user;
  if (!user) return reply.status(401).send({ error: 'Yetkisiz erişim.' });

  const existing = await repo.getActiveRequest(user.id);
  if (!existing) return reply.status(404).send({ error: 'Aktif bir silme talebi bulunamadı.' });

  await repo.cancelRequest(existing.id);
  return reply.send({ data: { ok: true } });
}
