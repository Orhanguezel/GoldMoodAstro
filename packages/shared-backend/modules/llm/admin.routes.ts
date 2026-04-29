// =============================================================
// FAZ 19 / T19-5 — LLM admin endpoints (embedding backfill)
// =============================================================
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/roles';
import {
  backfillEmbeddings,
  backfillAllTables,
  SUPPORTED_TABLES,
  type BackfillTable,
} from './backfill';

const BackfillBodySchema = z.object({
  table: z.enum(SUPPORTED_TABLES),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

const BackfillAllBodySchema = z.object({
  per_table_limit: z.coerce.number().int().min(1).max(200).default(50),
});

export async function registerLlmAdmin(adminApi: FastifyInstance) {
  const adminGuard = async (req: FastifyRequest, reply: FastifyReply) => {
    await requireAuth(req, reply);
    await requireAdmin(req, reply);
  };

  /** Tek tablo backfill */
  adminApi.post('/embeddings/backfill', { preHandler: adminGuard }, async (req, reply) => {
    try {
      const body = BackfillBodySchema.parse((req as any).body);
      const result = await backfillEmbeddings(body.table as BackfillTable, { limit: body.limit });
      return reply.send({ data: result });
    } catch (err: any) {
      return reply.status(400).send({
        error: err?.message || 'backfill_failed',
      });
    }
  });

  /** Tüm tablolar sırayla — uzun sürebilir, async kullanılması önerilir */
  adminApi.post('/embeddings/backfill-all', { preHandler: adminGuard }, async (req, reply) => {
    try {
      const body = BackfillAllBodySchema.parse((req as any).body || {});
      const results = await backfillAllTables({ perTableLimit: body.per_table_limit });
      const total = results.reduce(
        (acc, r) => ({
          embedded: acc.embedded + r.embedded,
          scanned: acc.scanned + r.scanned,
          failed: acc.failed + Math.max(0, r.failed),
        }),
        { embedded: 0, scanned: 0, failed: 0 },
      );
      return reply.send({ data: { tables: results, total } });
    } catch (err: any) {
      return reply.status(500).send({ error: err?.message || 'backfill_all_failed' });
    }
  });

  /** Status endpoint — hangi tabloda kaç embedding eksik */
  adminApi.get('/embeddings/status', { preHandler: adminGuard }, async (_req, reply) => {
    const { db } = await import('../../db/client');
    const status: Record<string, { total: number; embedded: number; missing: number }> = {};
    for (const t of SUPPORTED_TABLES) {
      try {
        const [rows] = await (db as any).session.client.query(
          `SELECT
             COUNT(*) AS total,
             SUM(CASE WHEN embedding IS NOT NULL THEN 1 ELSE 0 END) AS embedded
           FROM \`${t}\``,
        );
        const r = (rows as any[])[0];
        const total = Number(r?.total ?? 0);
        const embedded = Number(r?.embedded ?? 0);
        status[t] = { total, embedded, missing: total - embedded };
      } catch (err) {
        status[t] = { total: -1, embedded: -1, missing: -1 };
      }
    }
    return reply.send({ data: status });
  });
}
