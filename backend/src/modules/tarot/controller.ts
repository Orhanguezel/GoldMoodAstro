// backend/src/modules/tarot/controller.ts

import type { FastifyReply, FastifyRequest } from 'fastify';
import * as repo from './repository';

export async function handleDraw(req: FastifyRequest, reply: FastifyReply) {
  const { spread } = req.body as { spread: 'single' | 'triple' };
  const count = spread === 'triple' ? 3 : 1;
  const cards = await repo.drawCards(count);
  return reply.send({ data: cards });
}
