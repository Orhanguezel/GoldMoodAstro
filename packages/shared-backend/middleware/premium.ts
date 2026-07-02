import type { FastifyReply, FastifyRequest } from 'fastify';
import { hasPremiumSubscription } from '../modules/subscriptions/summary';

function requestUserId(req: FastifyRequest) {
  const user = req.user as { sub?: string; id?: string } | undefined;
  return user?.sub ?? user?.id ?? null;
}

export async function requirePremium(req: FastifyRequest, reply: FastifyReply) {
  const userId = requestUserId(req);
  if (!userId) {
    return reply.code(401).send({ error: { message: 'unauthorized' } });
  }

  const hasPremium = await hasPremiumSubscription(userId);
  if (!hasPremium) {
    return reply.code(402).send({ error: { message: 'premium_required' } });
  }
}
