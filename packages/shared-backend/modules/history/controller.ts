// packages/shared-backend/modules/history/controller.ts
// FAZ 28 / T28-1 + T28-6
import type { FastifyReply, FastifyRequest } from 'fastify';
import { db } from '../../db/client';
import { sql } from 'drizzle-orm';
import { hasAnyRole } from '../../middleware/roles';
import * as repo from './repository';
import { READING_TYPES, type ReadingType } from './repository';

function getUser(req: FastifyRequest): { id: string } | null {
  const u = (req as any).user;
  const id = u?.id ?? u?.sub;
  return id ? { id: String(id) } : null;
}

export async function handleGetHistory(req: FastifyRequest, reply: FastifyReply) {
  const user = getUser(req);
  if (!user) return reply.status(401).send({ error: 'Yetkisiz erişim.' });

  const limitRaw = (req.query as any)?.limit;
  const limit = Math.min(Math.max(Number(limitRaw) || 50, 1), 200);

  try {
    const history = await repo.getUserHistory(user.id, limit);
    return reply.send({ data: history });
  } catch (err) {
    console.error('history_fetch_failed', err);
    return reply.status(500).send({ error: 'Geçmiş yüklenirken bir hata oluştu.' });
  }
}

export async function handleGetRecent(req: FastifyRequest, reply: FastifyReply) {
  const user = getUser(req);
  if (!user) return reply.status(401).send({ error: 'Yetkisiz erişim.' });

  const limitRaw = (req.query as any)?.limit;
  const limit = Math.min(Math.max(Number(limitRaw) || 10, 1), 50);

  const data = await repo.getUserHistory(user.id, limit);
  return reply.send({ data });
}

export async function handleDeleteReading(req: FastifyRequest, reply: FastifyReply) {
  const user = getUser(req);
  if (!user) return reply.status(401).send({ error: 'Yetkisiz erişim.' });

  const { type, id } = req.params as { type: string; id: string };
  if (!READING_TYPES.includes(type as ReadingType)) {
    return reply.status(400).send({ error: 'Geçersiz tip.' });
  }
  if (!id) return reply.status(400).send({ error: 'ID gerekli.' });

  const ok = await repo.deleteReading(user.id, type as ReadingType, id);
  if (!ok) return reply.status(404).send({ error: 'Kayıt bulunamadı veya size ait değil.' });
  return reply.send({ ok: true });
}

export async function handleDeleteAllReadings(req: FastifyRequest, reply: FastifyReply) {
  const user = getUser(req);
  if (!user) return reply.status(401).send({ error: 'Yetkisiz erişim.' });

  const result = await repo.deleteAllReadings(user.id);
  return reply.send({ ok: true, ...result });
}

/**
 * T28-6 — Danışman, müşterisinin son okumalarını canlı görüşmede görür.
 * Yetki: çağrıyı yapan kullanıcı consultant/admin olmalı VE consultants
 * tablosunda kendi user_id'sine bağlı bir kayıt olmalı VE
 * o consultant_id ile customerUserId arasında bir booking olmalı.
 */
export async function handleGetCustomerReadingsForConsultant(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const consultantUser = getUser(req);
  if (!consultantUser) return reply.status(401).send({ error: 'Yetkisiz erişim.' });

  if (!hasAnyRole(req, ['consultant', 'admin'])) {
    return reply.status(403).send({ error: 'Sadece danışmanlar erişebilir.' });
  }

  const { userId: customerUserId } = req.params as { userId: string };
  if (!customerUserId) return reply.status(400).send({ error: 'userId gerekli.' });

  const limitRaw = (req.query as any)?.limit;
  const limit = Math.min(Math.max(Number(limitRaw) || 10, 1), 50);

  // Admin → bypass; aksi takdirde booking ilişkisi şart
  const isAdmin = hasAnyRole(req, ['admin']);
  if (!isAdmin) {
    const rows: any = await db.execute(sql`
      SELECT 1
      FROM bookings b
      JOIN consultants c ON c.id = b.consultant_id
      WHERE c.user_id = ${consultantUser.id}
        AND b.user_id = ${customerUserId}
      LIMIT 1
    `);
    const arr = Array.isArray(rows?.[0]) ? rows[0] : rows;
    if (!arr || (arr as unknown[]).length === 0) {
      return reply.status(403).send({ error: 'Bu müşteriyle bir randevu ilişkiniz yok.' });
    }
  }

  const data = await repo.getRecentReadingsForConsultant(customerUserId, limit);
  return reply.send({ data });
}
