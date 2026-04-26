import type { RouteHandler } from 'fastify';
import { endSessionBodySchema, tokenBodySchema } from './validation';
import { endAgoraSession, issueAgoraToken } from './repository';

function userIdFromRequest(req: Parameters<RouteHandler>[0]) {
  const user = req.user as { sub?: string; id?: string } | undefined;
  return user?.sub ?? user?.id ?? null;
}

function statusFromError(error: unknown) {
  return Number((error as { statusCode?: number })?.statusCode ?? 500);
}

export const issueAgoraTokenHandler: RouteHandler = async (req, reply) => {
  const userId = userIdFromRequest(req);
  if (!userId) return reply.code(401).send({ error: { message: 'no_user' } });

  const body = tokenBodySchema.parse(req.body ?? {});

  try {
    return { data: await issueAgoraToken(body.booking_id, userId) };
  } catch (error) {
    return reply.code(statusFromError(error)).send({
      error: { message: error instanceof Error ? error.message : 'agora_token_failed' },
    });
  }
};

export const endAgoraSessionHandler: RouteHandler = async (req, reply) => {
  const userId = userIdFromRequest(req);
  if (!userId) return reply.code(401).send({ error: { message: 'no_user' } });

  const body = endSessionBodySchema.parse(req.body ?? {});

  try {
    return { data: await endAgoraSession(body.booking_id, userId) };
  } catch (error) {
    return reply.code(statusFromError(error)).send({
      error: { message: error instanceof Error ? error.message : 'agora_session_end_failed' },
    });
  }
};
