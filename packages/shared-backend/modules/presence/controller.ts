import type { FastifyReply, FastifyRequest } from 'fastify';

import { findConsultantForUser, upsertConsultantHeartbeat } from './repository';

function userIdFromRequest(req: FastifyRequest) {
  const user = req.user as { sub?: string; id?: string } | undefined;
  return user?.sub ?? user?.id ?? null;
}

export async function heartbeatHandler(req: FastifyRequest, reply: FastifyReply) {
  const userId = userIdFromRequest(req);
  if (!userId) return reply.code(401).send({ error: { message: 'no_user' } });

  const consultant = await findConsultantForUser(userId);
  if (!consultant) return reply.code(403).send({ error: { message: 'not_consultant' } });

  const data = await upsertConsultantHeartbeat(consultant.id);
  return reply.send({ data });
}

