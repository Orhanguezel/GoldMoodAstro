import type { RouteHandler } from 'fastify';
import { generateDailyReading } from '@goldmood/shared-backend/modules/readings';
import { generateDailyReadingBodySchema } from './validation';

function userIdFromRequest(req: Parameters<RouteHandler>[0]) {
  const user = req.user as { sub?: string; id?: string } | undefined;
  return user?.sub ?? user?.id ?? null;
}

export const generateDailyReadingHandler: RouteHandler = async (req, reply) => {
  const userId = userIdFromRequest(req);
  if (!userId) return reply.code(401).send({ error: { message: 'no_user' } });

  try {
    const body = generateDailyReadingBodySchema.parse(req.body ?? {});
    return { data: await generateDailyReading(userId, body.chart_id) };
  } catch (error) {
    const statusCode = Number((error as { statusCode?: number })?.statusCode ?? 500);
    return reply.code(statusCode).send({
      error: { message: error instanceof Error ? error.message : 'daily_reading_failed' },
    });
  }
};
