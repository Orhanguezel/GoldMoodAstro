import type { RouteHandler } from 'fastify';
import { tokenBodySchema } from './validation';
import { endLiveKitSession, handleLiveKitWebhook, issueLiveKitToken } from './repository';
import { receiveLiveKitWebhook } from './service';

function userIdFromRequest(req: Parameters<RouteHandler>[0]) {
  const user = req.user as { sub?: string; id?: string } | undefined;
  return user?.sub ?? user?.id ?? null;
}

function statusFromError(error: unknown) {
  return Number((error as { statusCode?: number })?.statusCode ?? 500);
}

export const issueLiveKitTokenHandler: RouteHandler = async (req, reply) => {
  const userId = userIdFromRequest(req);
  if (!userId) return reply.code(401).send({ error: { message: 'no_user' } });

  const body = tokenBodySchema.parse(req.body ?? {});

  try {
    return { data: await issueLiveKitToken(body.booking_id, userId) };
  } catch (error) {
    return reply.code(statusFromError(error)).send({
      error: { message: error instanceof Error ? error.message : 'livekit_token_failed' },
    });
  }
};

export const endLiveKitSessionHandler: RouteHandler = async (req, reply) => {
  const userId = userIdFromRequest(req);
  if (!userId) return reply.code(401).send({ error: { message: 'no_user' } });

  const body = tokenBodySchema.parse(req.body ?? {});

  try {
    return { data: await endLiveKitSession(body.booking_id, userId) };
  } catch (error) {
    return reply.code(statusFromError(error)).send({
      error: { message: error instanceof Error ? error.message : 'livekit_session_end_failed' },
    });
  }
};

export const liveKitWebhookHandler: RouteHandler = async (req, reply) => {
  try {
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
    const authHeader = String(req.headers.authorization ?? req.headers.authorize ?? '');
    const event = await receiveLiveKitWebhook(rawBody, authHeader);
    return { data: await handleLiveKitWebhook(event) };
  } catch (error) {
    return reply.code(401).send({
      error: { message: error instanceof Error ? error.message : 'livekit_webhook_failed' },
    });
  }
};
