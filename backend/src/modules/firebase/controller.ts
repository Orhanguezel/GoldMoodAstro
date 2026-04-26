import type { RouteHandler } from 'fastify';
import { registerFcmTokenBodySchema } from './validation';
import { saveFcmToken } from './repository';

function userIdFromRequest(req: Parameters<RouteHandler>[0]) {
  const user = req.user as { sub?: string; id?: string } | undefined;
  return user?.sub ?? user?.id ?? null;
}

export const registerFcmTokenHandler: RouteHandler = async (req, reply) => {
  const userId = userIdFromRequest(req);
  if (!userId) return reply.code(401).send({ error: { message: 'no_user' } });

  const body = registerFcmTokenBodySchema.parse(req.body ?? {});
  const row = await saveFcmToken(userId, body.token);
  return { data: row };
};
