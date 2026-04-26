import type { FastifyInstance } from 'fastify';
import { db } from '../../db/client';
import { sql } from 'drizzle-orm';

export async function repoCheckHealth(app: FastifyInstance) {
  let dbOk = false;
  try {
    const rows = await db.execute(sql`SELECT 1 AS ok`);
    const first = Array.isArray(rows) ? (rows as any)[0] : (rows as any).rows?.[0];
    dbOk = first?.ok === 1 || (Array.isArray(rows) && (rows as any).length > 0);
  } catch {
    dbOk = false;
  }

  const redis = (app as any).redis;
  const redisReply = redis ? await redis.ping().catch(() => 'FAIL') : 'SKIP';
  const redisOk = redisReply === 'PONG';

  return {
    status: dbOk && (redis ? redisOk : true) ? 'ok' : 'error',
    db: dbOk ? 'ok' : 'error',
    redis: redis ? (redisOk ? 'ok' : 'error') : 'disabled',
    uptime: process.uptime(),
  };
}
