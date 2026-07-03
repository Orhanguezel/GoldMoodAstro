import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

import {
  addFavorite,
  listFavoriteConsultants,
  listFavoriteIds,
  removeFavorite,
} from './repository';

const paramsSchema = z.object({
  consultantId: z.string().trim().min(1).max(80),
});

function userIdFromRequest(req: FastifyRequest) {
  const user = req.user as { sub?: string; id?: string } | undefined;
  return user?.sub ?? user?.id ?? null;
}

export async function addFavoriteHandler(req: FastifyRequest, reply: FastifyReply) {
  const userId = userIdFromRequest(req);
  if (!userId) return reply.code(401).send({ error: { message: 'no_user' } });

  const { consultantId } = paramsSchema.parse(req.params ?? {});
  const data = await addFavorite(userId, consultantId);
  return reply.send({ data });
}

export async function removeFavoriteHandler(req: FastifyRequest, reply: FastifyReply) {
  const userId = userIdFromRequest(req);
  if (!userId) return reply.code(401).send({ error: { message: 'no_user' } });

  const { consultantId } = paramsSchema.parse(req.params ?? {});
  const data = await removeFavorite(userId, consultantId);
  return reply.send({ data });
}

export async function listFavoritesHandler(req: FastifyRequest, reply: FastifyReply) {
  const userId = userIdFromRequest(req);
  if (!userId) return reply.code(401).send({ error: { message: 'no_user' } });

  const data = await listFavoriteConsultants(userId);
  return reply.send({ data });
}

export async function listFavoriteIdsHandler(req: FastifyRequest, reply: FastifyReply) {
  const userId = userIdFromRequest(req);
  if (!userId) return reply.code(401).send({ error: { message: 'no_user' } });

  const data = await listFavoriteIds(userId);
  return reply.send({ data });
}
