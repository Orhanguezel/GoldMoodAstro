// src/modules/kvkk/controller.ts
// FAZ 18 — KVKK F9 differentiator: data export + 7-day cooling-off account deletion

import { randomUUID } from 'crypto';
import type { RouteHandler } from 'fastify';
import { db } from '../../db/client';
import { sql, eq, and } from 'drizzle-orm';
import { accountDeletionRequests } from './schema';

const COOLING_OFF_DAYS = 7;

function getUser(req: { user?: unknown }) {
  const u = req.user as Record<string, unknown> | undefined;
  const id = (u?.id ?? u?.sub ?? '') as string;
  return { id };
}

/**
 * GET /me/export — auth, kullanıcının tüm verisini JSON olarak indirir
 * Tablolar: users, birth_charts, bookings, orders, reviews, user_credits,
 *           credit_transactions, subscriptions, support_tickets, chat_messages,
 *           wallets (consultant ise), live_sessions
 */
export const exportMyData: RouteHandler = async (req, reply) => {
  const { id: userId } = getUser(req);
  if (!userId) return reply.code(401).send({ error: { message: 'unauthorized' } });

  // Tüm bağlı veri tablolarından kullanıcı verilerini çek (raw SQL — flexibility)
  const [user] = (await db.execute(sql`
    SELECT id, email, full_name, phone, role, locale, created_at, updated_at
    FROM users WHERE id = ${userId}
  `) as unknown as Record<string, unknown>[][])[0] ?? [];

  if (!user) return reply.code(404).send({ error: { message: 'user_not_found' } });

  const queries = [
    { key: 'birth_charts',          sql: sql`SELECT id, name, dob, tob, pob_lat, pob_lng, pob_label, tz_offset, chart_data, created_at FROM birth_charts WHERE user_id = ${userId}` },
    { key: 'bookings',              sql: sql`SELECT * FROM bookings WHERE user_id = ${userId}` },
    { key: 'orders',                sql: sql`SELECT * FROM orders WHERE user_id = ${userId}` },
    { key: 'reviews',               sql: sql`SELECT id, target_type, target_id, rating, is_approved, created_at FROM reviews WHERE user_id = ${userId}` },
    { key: 'user_credits',          sql: sql`SELECT * FROM user_credits WHERE user_id = ${userId}` },
    { key: 'credit_transactions',   sql: sql`SELECT * FROM credit_transactions WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 1000` },
    { key: 'subscriptions',         sql: sql`SELECT id, plan_id, status, started_at, ends_at, cancelled_at FROM subscriptions WHERE user_id = ${userId}` },
    { key: 'support_tickets',       sql: sql`SELECT * FROM support_tickets WHERE user_id = ${userId}` },
    { key: 'review_outcomes',       sql: sql`SELECT * FROM review_outcomes WHERE user_id = ${userId}` },
    { key: 'campaign_redemptions',  sql: sql`SELECT * FROM campaign_redemptions WHERE user_id = ${userId}` },
  ];

  const data: Record<string, unknown> = { user };

  for (const q of queries) {
    try {
      const rows = await db.execute(q.sql);
      const arr = Array.isArray((rows as unknown as unknown[])?.[0]) ? (rows as unknown as unknown[][])[0] : rows;
      data[q.key] = Array.isArray(arr) ? arr : [];
    } catch (err) {
      // Tablo henüz yoksa boş array
      data[q.key] = { error: 'table_unavailable_or_empty' };
    }
  }

  data['exported_at'] = new Date().toISOString();
  data['export_format_version'] = '1';
  data['notice'] = 'KVKK / GDPR uyumlu kullanıcı veri ihracı. Bu dosyayı güvenle saklayın; yeniden indirilemez (yeni bir ihraç talep etmelisiniz).';

  reply.header('Content-Type', 'application/json; charset=utf-8');
  reply.header('Content-Disposition', `attachment; filename="goldmoodastro-export-${userId.slice(0, 8)}-${Date.now()}.json"`);
  return reply.send(data);
};

/**
 * POST /me/delete-account — auth, hesap silme talebi yarat (7 gün cooling-off)
 * Body: { reason?: string }
 */
export const requestAccountDeletion: RouteHandler = async (req, reply) => {
  const { id: userId } = getUser(req);
  if (!userId) return reply.code(401).send({ error: { message: 'unauthorized' } });

  const body = (req.body ?? {}) as { reason?: string };

  // Mevcut pending talep var mı?
  const [existing] = await db
    .select()
    .from(accountDeletionRequests)
    .where(and(eq(accountDeletionRequests.user_id, userId), eq(accountDeletionRequests.status, 'pending')))
    .limit(1);

  if (existing) {
    return reply.send({
      data: {
        id: existing.id,
        status: existing.status,
        scheduled_for: existing.scheduled_for,
        message: 'pending_request_already_exists',
      },
    });
  }

  const id = randomUUID();
  const now = new Date();
  const scheduledFor = new Date(now.getTime() + COOLING_OFF_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(accountDeletionRequests).values({
    id,
    user_id: userId,
    requested_at: now,
    scheduled_for: scheduledFor,
    status: 'pending',
    reason: body.reason ?? null,
    ip_address: (req.ip as string) || null,
  });

  return reply.code(201).send({
    data: {
      id,
      status: 'pending',
      scheduled_for: scheduledFor,
      cooling_off_days: COOLING_OFF_DAYS,
      message: 'Hesabınız 7 gün içinde kalıcı olarak silinecektir. Bu süre içinde DELETE /me/delete-account ile iptal edebilirsiniz.',
    },
  });
};

/** DELETE /me/delete-account — auth, pending talebi iptal */
export const cancelAccountDeletion: RouteHandler = async (req, reply) => {
  const { id: userId } = getUser(req);
  if (!userId) return reply.code(401).send({ error: { message: 'unauthorized' } });

  const [existing] = await db
    .select()
    .from(accountDeletionRequests)
    .where(and(eq(accountDeletionRequests.user_id, userId), eq(accountDeletionRequests.status, 'pending')))
    .limit(1);

  if (!existing) return reply.code(404).send({ error: { message: 'no_pending_request' } });

  await db
    .update(accountDeletionRequests)
    .set({ status: 'cancelled', cancelled_at: new Date() })
    .where(eq(accountDeletionRequests.id, existing.id));

  return reply.send({ data: { id: existing.id, status: 'cancelled' } });
};

/** GET /me/delete-account — auth, mevcut talep durumu */
export const getDeletionStatus: RouteHandler = async (req, reply) => {
  const { id: userId } = getUser(req);
  if (!userId) return reply.code(401).send({ error: { message: 'unauthorized' } });

  const [request] = await db
    .select()
    .from(accountDeletionRequests)
    .where(and(eq(accountDeletionRequests.user_id, userId), eq(accountDeletionRequests.status, 'pending')))
    .limit(1);

  return reply.send({ data: request ?? null });
};
