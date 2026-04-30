// packages/shared-backend/modules/consultantSelf/controller.ts
// T30-1: Danışmanın kendi paneli için endpoint'ler.
// /me/consultant — kendi profilini görür/günceller, randevuları, istatistikleri.
import type { FastifyReply, FastifyRequest } from 'fastify';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { consultants } from '../consultants/schema';
import { bookings } from '../bookings/schema';
import { users } from '../auth/schema';
import { chat_threads, chat_messages, chat_participants } from '../chat/schema';
import { createUserNotification } from '../notifications/service';
import { dispatchPushToUser } from '../notifications/push';
import { sendTemplatedEmail } from '../emailTemplates/mailer';
import { getDefaultLocale } from '../_shared';
import { overrideDaySlots } from '../availability/repository';
import { releaseSlotTx } from '../bookings/repository';
import { consultantServices } from '../consultantServices/schema';
// wallets/walletTransactions: bu projede DB schema farklı (consultant_id), raw SQL kullanılıyor.

const profilePatchSchema = z.object({
  bio: z.string().trim().max(5000).nullable().optional(),
  expertise: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  languages: z.array(z.string().trim().min(2).max(8)).max(10).optional(),
  meeting_platforms: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
  social_links: z.record(z.string().trim().max(1000)).optional(),
  avatar_url: z.string().trim().max(1000).nullable().optional(),
  is_available: z.coerce.number().int().min(0).max(1).optional(),
  supports_video: z.coerce.number().int().min(0).max(1).optional(),
  session_price: z.coerce.number().nonnegative().optional(),
  session_duration: z.coerce.number().int().positive().max(480).optional(),
  video_session_price: z.coerce.number().nonnegative().optional(),
});

function getCallerUserId(req: FastifyRequest): string | null {
  const u = (req as any).user as { sub?: string; id?: string } | undefined;
  return (u?.id ?? u?.sub) ? String(u?.id ?? u?.sub) : null;
}

async function getCallerConsultant(req: FastifyRequest) {
  const userId = getCallerUserId(req);
  if (!userId) return null;
  const [row] = await db.select().from(consultants).where(eq(consultants.user_id, userId)).limit(1);
  return row ?? null;
}

/* ─── GET /me/consultant — profil ─── */
export async function getProfile(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  // user info de getir
  const [u] = await db
    .select({ full_name: users.full_name, email: users.email, phone: users.phone, avatar_url: users.avatar_url })
    .from(users)
    .where(eq(users.id, c.user_id))
    .limit(1);

  return reply.send({
    data: {
      ...c,
      user: u ?? null,
    },
  });
}

/* ─── PATCH /me/consultant — profil güncelle ─── */
export async function updateProfile(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  const parsed = profilePatchSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.issues } });

  const patch: Record<string, unknown> = {};
  const userPatch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v === undefined) continue;
    if (k === 'avatar_url') {
      userPatch.avatar_url = v;
      continue;
    }
    patch[k] = v;
  }
  if (Object.keys(patch).length === 0 && Object.keys(userPatch).length === 0) {
    return reply.send({ data: { id: c.id, noop: true } });
  }

  if (Object.keys(patch).length > 0) {
    await db.update(consultants).set(patch as any).where(eq(consultants.id, c.id));
  }
  if (Object.keys(userPatch).length > 0) {
    await db.update(users).set(userPatch as any).where(eq(users.id, c.user_id));
  }
  return reply.send({ data: { id: c.id } });
}

/* ─── GET /me/consultant/bookings ─── */
export async function listBookings(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  const status = ((req.query as any)?.status as string | undefined)?.trim();

  const where = status
    ? and(eq(bookings.consultant_id, c.id), eq(bookings.status, status))
    : eq(bookings.consultant_id, c.id);

  const rows = await db
    .select({
      id: bookings.id,
      user_id: bookings.user_id,
      service_id: bookings.service_id,
      appointment_date: bookings.appointment_date,
      appointment_time: bookings.appointment_time,
      session_duration: bookings.session_duration,
      session_price: bookings.session_price,
      media_type: bookings.media_type,
      status: bookings.status,
      customer_message: bookings.customer_message,
      customer_note: bookings.customer_note,
      admin_note: bookings.admin_note,
      decision_note: bookings.decision_note,
      name: bookings.name,
      email: bookings.email,
      phone: bookings.phone,
      customer_avatar_url: users.avatar_url,
      service_title: consultantServices.name,
      created_at: bookings.created_at,
    })
    .from(bookings)
    .leftJoin(users, eq(users.id, bookings.user_id))
    .leftJoin(consultantServices, eq(consultantServices.id, bookings.service_id))
    .where(where)
    .orderBy(desc(bookings.created_at))
    .limit(200);

  return reply.send({ data: rows });
}

/* ─── POST /me/consultant/bookings/:id/approve ─── */
export async function approveBooking(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  const { id } = req.params as { id: string };
  const [b] = await db.select().from(bookings).where(and(eq(bookings.id, id), eq(bookings.consultant_id, c.id))).limit(1);
  if (!b) return reply.code(404).send({ error: { message: 'not_found' } });

  await db.update(bookings).set({ status: 'confirmed' } as any).where(eq(bookings.id, id));

  // Müşteriye bildirim + email — fire-and-forget
  if (b.user_id) {
    const isInstant = b.status === 'requested_now';
    const title = isInstant ? '✅ Anlık Görüşmeniz Onaylandı' : '✅ Randevunuz Onaylandı';
    const message = isInstant
      ? 'Danışman talebinizi kabul etti. Hemen görüşmeye geçebilirsiniz.'
      : `${b.appointment_date} ${b.appointment_time?.slice(0, 5) ?? ''} için randevunuz onaylandı.`;

    const [consultantUser] = await db
      .select({ full_name: users.full_name })
      .from(users)
      .where(eq(users.id, c.user_id))
      .limit(1);
    const consultantName = consultantUser?.full_name || 'Danışman';
    const locale = (b as any).locale || (await getDefaultLocale());

    Promise.allSettled([
      createUserNotification({ userId: b.user_id, title, message, type: 'booking' }),
      dispatchPushToUser({
        userId: b.user_id,
        title,
        body: message,
        data: {
          type: isInstant ? 'booking_approved_instant' : 'booking_approved',
          booking_id: id,
          url: isInstant ? `/booking/${id}/call` : '/dashboard?tab=bookings',
        },
      }),
      b.email
        ? sendTemplatedEmail({
            to: b.email,
            key: 'booking_accepted_customer',
            locale,
            defaultLocale: await getDefaultLocale(),
            params: {
              customer_name: b.name || 'Değerli müşterimiz',
              consultant_name: consultantName,
              appointment_date: b.appointment_date || '',
              appointment_time: b.appointment_time?.slice(0, 5) || '',
              decision_note: '',
            },
            allowMissing: true,
          })
        : Promise.resolve(null),
    ]).catch(() => undefined);
  }

  return reply.send({ data: { id, status: 'confirmed' } });
}

/* ─── POST /me/consultant/bookings/:id/reject ─── */
const rejectSchema = z.object({ reason: z.string().trim().min(2).max(2000).optional() });

export async function rejectBooking(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  const { id } = req.params as { id: string };
  const parsed = rejectSchema.safeParse(req.body ?? {});
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body' } });

  const [b] = await db.select().from(bookings).where(and(eq(bookings.id, id), eq(bookings.consultant_id, c.id))).limit(1);
  if (!b) return reply.code(404).send({ error: { message: 'not_found' } });

  await db.transaction(async (tx) => {
    await tx
      .update(bookings)
      .set({
        status: 'rejected',
        decision_note: parsed.data.reason ?? null,
        decided_by: c.user_id,
        decided_at: new Date(),
      } as any)
      .where(eq(bookings.id, id));

    if (b.slot_id) await releaseSlotTx(tx, { slot_id: b.slot_id });
  });

  // Müşteriye bildirim + email — fire-and-forget
  if (b.user_id) {
    const title = '❌ Randevunuz Reddedildi';
    const reason = parsed.data.reason ? ` Sebep: ${parsed.data.reason}` : '';
    const message = `Danışman randevu talebinizi reddetti.${reason}`;

    const [consultantUser] = await db
      .select({ full_name: users.full_name })
      .from(users)
      .where(eq(users.id, c.user_id))
      .limit(1);
    const consultantName = consultantUser?.full_name || 'Danışman';
    const locale = (b as any).locale || (await getDefaultLocale());

    Promise.allSettled([
      createUserNotification({ userId: b.user_id, title, message, type: 'booking' }),
      dispatchPushToUser({
        userId: b.user_id,
        title,
        body: message,
        data: { type: 'booking_rejected', booking_id: id, url: '/dashboard?tab=bookings' },
      }),
      b.email
        ? sendTemplatedEmail({
            to: b.email,
            key: 'booking_rejected_customer',
            locale,
            defaultLocale: await getDefaultLocale(),
            params: {
              customer_name: b.name || 'Değerli müşterimiz',
              consultant_name: consultantName,
              appointment_date: b.appointment_date || '',
              appointment_time: b.appointment_time?.slice(0, 5) || '',
              decision_note: parsed.data.reason || '',
            },
            allowMissing: true,
          })
        : Promise.resolve(null),
    ]).catch(() => undefined);
  }

  return reply.send({ data: { id, status: 'rejected' } });
}

/* ─── POST /me/consultant/bookings/:id/cancel ─── */
const cancelSchema = z.object({ reason: z.string().trim().min(5).max(2000) });

export async function cancelBooking(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  const { id } = req.params as { id: string };
  const parsed = cancelSchema.safeParse(req.body ?? {});
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body' } });

  const [b] = await db.select().from(bookings).where(and(eq(bookings.id, id), eq(bookings.consultant_id, c.id))).limit(1);
  if (!b) return reply.code(404).send({ error: { message: 'not_found' } });

  const cancellable = ['requested_now', 'pending_payment', 'pending', 'booked', 'confirmed'];
  if (!cancellable.includes(String(b.status))) {
    return reply.code(409).send({ error: { message: 'booking_not_cancellable' } });
  }

  await db.transaction(async (tx) => {
    await tx
      .update(bookings)
      .set({
        status: 'cancelled',
        decision_note: parsed.data.reason,
        decided_by: c.user_id,
        decided_at: new Date(),
      } as any)
      .where(eq(bookings.id, id));

    if (b.slot_id) await releaseSlotTx(tx, { slot_id: b.slot_id });
  });

  if (b.user_id) {
    const title = 'Randevunuz İptal Edildi';
    const message = `Danışman randevunuzu iptal etti. Sebep: ${parsed.data.reason}`;
    Promise.allSettled([
      createUserNotification({ userId: b.user_id, title, message, type: 'booking' }),
      dispatchPushToUser({
        userId: b.user_id,
        title,
        body: message,
        data: { type: 'booking_cancelled_by_consultant', booking_id: id, url: '/dashboard?tab=bookings' },
      }),
    ]).catch(() => undefined);
  }

  return reply.send({ data: { id, status: 'cancelled' } });
}

/* ─── PATCH /me/consultant/bookings/:id/notes ─── */
const notesSchema = z.object({ notes: z.string().trim().max(8000).nullable() });

export async function updateBookingNotes(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  const { id } = req.params as { id: string };
  const parsed = notesSchema.safeParse(req.body ?? {});
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body' } });

  const [b] = await db.select({ id: bookings.id }).from(bookings).where(and(eq(bookings.id, id), eq(bookings.consultant_id, c.id))).limit(1);
  if (!b) return reply.code(404).send({ error: { message: 'not_found' } });

  await db
    .update(bookings)
    .set({ admin_note: parsed.data.notes || null } as any)
    .where(eq(bookings.id, id));

  return reply.send({ data: { id, notes: parsed.data.notes || null } });
}

/* ─── GET /me/consultant/stats ─── */
// T30-9: Geniş stats — bu ay, geçen ay (delta), 7-günlük trend, bekleyen mesaj sayısı
export async function getStats(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  const now = new Date();
  const monthAgo = new Date(now); monthAgo.setDate(monthAgo.getDate() - 30);
  const twoMonthsAgo = new Date(now); twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);

  // Bu ay seans + kazanç (confirmed/completed)
  const [thisMonthRow] = await db
    .select({ count: sql<number>`COUNT(*)`, total: sql<number>`COALESCE(SUM(${bookings.session_price}),0)` })
    .from(bookings)
    .where(
      and(
        eq(bookings.consultant_id, c.id),
        gte(bookings.created_at, monthAgo),
        sql`${bookings.status} IN ('confirmed','completed')`,
      ),
    );

  // Geçen ay (60-30 gün arası) — % delta için
  const [lastMonthRow] = await db
    .select({ count: sql<number>`COUNT(*)`, total: sql<number>`COALESCE(SUM(${bookings.session_price}),0)` })
    .from(bookings)
    .where(
      and(
        eq(bookings.consultant_id, c.id),
        gte(bookings.created_at, twoMonthsAgo),
        sql`${bookings.created_at} < ${monthAgo}`,
        sql`${bookings.status} IN ('confirmed','completed')`,
      ),
    );

  // Bekleyen randevu sayısı (requested_now dahil — anlık talepler en kritik)
  const [pendingRow] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(bookings)
    .where(and(eq(bookings.consultant_id, c.id), sql`${bookings.status} IN ('pending_payment','pending','requested_now')`));

  // T29-4: Anlık görüşme talebi sayısı (5dk timeout)
  const [requestedNowRow] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(bookings)
    .where(and(eq(bookings.consultant_id, c.id), sql`${bookings.status} = 'requested_now'`));

  // 7-günlük trend (her gün için seans sayısı)
  const sevenDaysAgo = new Date(now); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  const dailyRows = await db.execute(
    sql`SELECT DATE(created_at) AS day, COUNT(*) AS count, COALESCE(SUM(session_price),0) AS earnings
        FROM bookings
        WHERE consultant_id = ${c.id}
          AND created_at >= ${sevenDaysAgo}
          AND status IN ('confirmed','completed')
        GROUP BY DATE(created_at)
        ORDER BY day ASC`,
  );
  const dailyArr = (Array.isArray((dailyRows as any)?.[0]) ? (dailyRows as any)[0] : (dailyRows as any)) as any[];
  const dailyMap = new Map<string, { count: number; earnings: number }>();
  for (const r of dailyArr || []) {
    const key = String(r.day).slice(0, 10); // 'YYYY-MM-DD'
    dailyMap.set(key, { count: Number(r.count ?? 0), earnings: Number(r.earnings ?? 0) });
  }
  const last7Days: Array<{ date: string; count: number; earnings: number }> = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo); d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const v = dailyMap.get(key) ?? { count: 0, earnings: 0 };
    last7Days.push({ date: key, count: v.count, earnings: v.earnings });
  }

  // Yanıt süresi (chat threads) — basit ortalama: gelen müşteri mesajından danışman cevabına kadar geçen ms
  let avgResponseMinutes = 0;
  try {
    const respRows = await db.execute(
      sql`
        SELECT AVG(TIMESTAMPDIFF(MINUTE, m1.created_at, m2.created_at)) AS avg_min
        FROM chat_threads t
        JOIN chat_messages m1 ON m1.thread_id = t.id AND m1.sender_user_id <> ${c.user_id}
        JOIN chat_messages m2 ON m2.thread_id = t.id AND m2.sender_user_id = ${c.user_id}
          AND m2.created_at = (
            SELECT MIN(m3.created_at) FROM chat_messages m3
            WHERE m3.thread_id = t.id AND m3.sender_user_id = ${c.user_id} AND m3.created_at > m1.created_at
          )
        WHERE t.context_type = 'consultant_lead' AND t.context_id = ${c.id}
      `,
    );
    const arr = Array.isArray((respRows as any)?.[0]) ? (respRows as any)[0] : (respRows as any);
    avgResponseMinutes = Number((arr as any[])?.[0]?.avg_min ?? 0);
  } catch {
    avgResponseMinutes = 0;
  }

  // Bekleyen mesaj sayısı — son mesajı müşteriden gelen thread'ler (henüz cevap yok)
  let pendingMessages = 0;
  try {
    const pmRows = await db.execute(
      sql`
        SELECT COUNT(*) AS cnt FROM (
          SELECT t.id, MAX(m.created_at) AS last_at,
            (SELECT sender_user_id FROM chat_messages m2 WHERE m2.thread_id = t.id ORDER BY m2.created_at DESC LIMIT 1) AS last_sender
          FROM chat_threads t
          JOIN chat_messages m ON m.thread_id = t.id
          WHERE t.context_type = 'consultant_lead' AND t.context_id = ${c.id}
          GROUP BY t.id
        ) x WHERE x.last_sender <> ${c.user_id}
      `,
    );
    const arr = Array.isArray((pmRows as any)?.[0]) ? (pmRows as any)[0] : (pmRows as any);
    pendingMessages = Number((arr as any[])?.[0]?.cnt ?? 0);
  } catch {
    pendingMessages = 0;
  }

  // Delta hesapla (% değişim)
  const thisCount = Number(thisMonthRow?.count ?? 0);
  const lastCount = Number(lastMonthRow?.count ?? 0);
  const thisTotal = Number(thisMonthRow?.total ?? 0);
  const lastTotal = Number(lastMonthRow?.total ?? 0);
  const sessionDelta = lastCount > 0 ? Math.round(((thisCount - lastCount) / lastCount) * 100) : (thisCount > 0 ? 100 : 0);
  const earningsDelta = lastTotal > 0 ? Math.round(((thisTotal - lastTotal) / lastTotal) * 100) : (thisTotal > 0 ? 100 : 0);

  return reply.send({
    data: {
      this_month_session_count: thisCount,
      this_month_earnings: thisTotal,
      last_month_session_count: lastCount,
      last_month_earnings: lastTotal,
      session_delta_pct: sessionDelta,
      earnings_delta_pct: earningsDelta,
      pending_bookings: Number(pendingRow?.count ?? 0),
      requested_now_count: Number(requestedNowRow?.count ?? 0),
      pending_messages: pendingMessages,
      avg_response_minutes: Math.round(avgResponseMinutes),
      rating_avg: Number(c.rating_avg ?? 0),
      rating_count: Number(c.rating_count ?? 0),
      total_sessions: Number(c.total_sessions ?? 0),
      is_available: Number(c.is_available ?? 0),
      last_7_days: last7Days,
    },
  });
}

/* ─── GET /me/consultant/threads ─── */
// Bu danışmana gelen consultant_lead thread'lerini listele.
// Her thread için son mesaj + okunmamış sayısı dönülür.
export async function listMessageThreads(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  // context_type='consultant_lead' olanlar + bu danışmanın booking thread'leri
  const threads = await db
    .select({
      id: chat_threads.id,
      context_type: chat_threads.context_type,
      context_id: chat_threads.context_id,
      created_by_user_id: chat_threads.created_by_user_id,
      created_at: chat_threads.created_at,
      updated_at: chat_threads.updated_at,
    })
    .from(chat_threads)
    .where(
      sql`(
        (${chat_threads.context_type} = 'consultant_lead' AND ${chat_threads.context_id} = ${c.id})
        OR (
          ${chat_threads.context_type} = 'booking'
          AND EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.id = ${chat_threads.context_id}
              AND b.consultant_id = ${c.id}
          )
        )
      )`,
    )
    .orderBy(desc(chat_threads.updated_at));

  // Her thread için: son mesaj + müşteri adı
  const enriched = await Promise.all(
    threads.map(async (t) => {
      // Son mesaj
      const [last] = await db
        .select({
          id: chat_messages.id,
          text: chat_messages.text,
          sender_user_id: chat_messages.sender_user_id,
          created_at: chat_messages.created_at,
        })
        .from(chat_messages)
        .where(eq(chat_messages.thread_id, t.id))
        .orderBy(desc(chat_messages.created_at))
        .limit(1);

      // Müşteri adı (created_by_user_id'den)
      let customer = null as null | { id: string; full_name: string | null; email: string | null; avatar_url: string | null };
      if (t.created_by_user_id) {
        const [u] = await db
          .select({
            id: users.id,
            full_name: users.full_name,
            email: users.email,
            avatar_url: users.avatar_url,
          })
          .from(users)
          .where(eq(users.id, t.created_by_user_id))
          .limit(1);
        if (u) customer = u;
      }

      const [participant] = await db
        .select({ last_read_at: chat_participants.last_read_at })
        .from(chat_participants)
        .where(and(eq(chat_participants.thread_id, t.id), eq(chat_participants.user_id, c.user_id)))
        .limit(1);

      const unreadRows = await db.execute(
        sql`
          SELECT COUNT(*) AS cnt
          FROM chat_messages
          WHERE thread_id = ${t.id}
            AND sender_user_id <> ${c.user_id}
            AND (${participant?.last_read_at ?? null} IS NULL OR created_at > ${participant?.last_read_at ?? null})
        `,
      );
      const unreadArr = Array.isArray((unreadRows as any)?.[0]) ? (unreadRows as any)[0] : (unreadRows as any);
      const unreadCount = Number((unreadArr as any[])?.[0]?.cnt ?? 0);

      return {
        thread_id: t.id,
        context_type: t.context_type,
        context_id: t.context_id,
        created_at: t.created_at,
        updated_at: t.updated_at,
        customer,
        unread_count: unreadCount,
        last_message: last
          ? {
              id: last.id,
              text: last.text,
              sender_user_id: last.sender_user_id,
              created_at: last.created_at,
              from_consultant: last.sender_user_id === c.user_id,
            }
          : null,
      };
    }),
  );

  return reply.send({ data: enriched });
}

/* ─── GET /me/consultant/threads/:id/messages ─── */
export async function listMessagesInThread(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  const { id } = req.params as { id: string };

  // Thread bu consultant'a mı ait kontrol et
  const [t] = await db
    .select()
    .from(chat_threads)
    .where(
      and(
        eq(chat_threads.id, id),
        sql`(
          (${chat_threads.context_type} = 'consultant_lead' AND ${chat_threads.context_id} = ${c.id})
          OR (
            ${chat_threads.context_type} = 'booking'
            AND EXISTS (
              SELECT 1 FROM bookings b
              WHERE b.id = ${chat_threads.context_id}
                AND b.consultant_id = ${c.id}
            )
          )
        )`,
      ),
    )
    .limit(1);
  if (!t) return reply.code(404).send({ error: { message: 'not_found' } });

  const messages = await db
    .select({
      id: chat_messages.id,
      thread_id: chat_messages.thread_id,
      sender_user_id: chat_messages.sender_user_id,
      text: chat_messages.text,
      created_at: chat_messages.created_at,
    })
    .from(chat_messages)
    .where(eq(chat_messages.thread_id, id))
    .orderBy(chat_messages.created_at);

  await db.execute(
    sql`
      INSERT INTO chat_participants (id, thread_id, user_id, role, joined_at, last_read_at)
      VALUES (${randomUUID()}, ${id}, ${c.user_id}, 'consultant', NOW(), NOW())
      ON DUPLICATE KEY UPDATE last_read_at = NOW()
    `,
  );

  return reply.send({
    data: {
      thread_id: id,
      messages: messages.map((m) => ({
        ...m,
        from_consultant: m.sender_user_id === c.user_id,
      })),
    },
  });
}

/* ─── POST /me/consultant/threads/:id/reply ─── */
const replySchema = z.object({ text: z.string().trim().min(1).max(2000) });

export async function replyInThread(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  const { id } = req.params as { id: string };
  const parsed = replySchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body' } });

  const [t] = await db
    .select()
    .from(chat_threads)
    .where(
      and(
        eq(chat_threads.id, id),
        sql`(
          (${chat_threads.context_type} = 'consultant_lead' AND ${chat_threads.context_id} = ${c.id})
          OR (
            ${chat_threads.context_type} = 'booking'
            AND EXISTS (
              SELECT 1 FROM bookings b
              WHERE b.id = ${chat_threads.context_id}
                AND b.consultant_id = ${c.id}
            )
          )
        )`,
      ),
    )
    .limit(1);
  if (!t) return reply.code(404).send({ error: { message: 'not_found' } });

  const messageId = randomUUID();
  const now = new Date();
  await db.insert(chat_messages).values({
    id: messageId,
    thread_id: id,
    sender_user_id: c.user_id,
    text: parsed.data.text,
    created_at: now,
  } as any);

  // Thread updated_at'i güncelle
  await db.update(chat_threads).set({ updated_at: now } as any).where(eq(chat_threads.id, id));

  return reply.send({
    data: {
      id: messageId,
      thread_id: id,
      sender_user_id: c.user_id,
      text: parsed.data.text,
      created_at: now,
      from_consultant: true,
    },
  });
}

/* ─── GET /me/consultant/wallet ─── */
// T30-7: Cüzdan bakiyesi + son işlemler.
// Raw SQL ile direkt sorguluyoruz: wallet shared modülü user_id, danışman paneli ise consultant_id ile ilişki kuruyor.
export async function getMyWallet(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  // Cüzdan kaydı (consultant_id = bu danışman)
  const walletResult = await db.execute(
    sql`SELECT id, user_id, consultant_id, balance, pending_balance, currency, created_at, updated_at
        FROM wallets
        WHERE consultant_id = ${c.id} OR user_id = ${c.user_id}
        LIMIT 1`,
  );
  const walletRows = Array.isArray((walletResult as any)?.[0]) ? (walletResult as any)[0] : (walletResult as any);
  const w = (walletRows as any[])?.[0];

  if (!w) {
    // Cüzdan yoksa boş kaydı oluştur
    const newId = randomUUID();
    await db.execute(
      sql`INSERT INTO wallets (id, user_id, consultant_id, balance, pending_balance, currency)
          VALUES (${newId}, ${c.user_id}, ${c.id}, 0.00, 0.00, 'TRY')
          ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP(3)`,
    );
    return reply.send({
      data: {
        wallet: {
          id: newId,
          balance: '0.00',
          pending_balance: '0.00',
          currency: 'TRY',
        },
        transactions: [],
        this_month: { credits: 0, debits: 0, net: 0 },
      },
    });
  }

  if (!w.consultant_id) {
    await db.execute(sql`UPDATE wallets SET consultant_id = ${c.id} WHERE id = ${w.id}`);
  }

  // İşlem geçmişi (varsa wallet_transactions tablosundan)
  let transactions: any[] = [];
  let monthCredits = 0;
  let monthDebits = 0;
  try {
    const txResult = await db.execute(
      sql`SELECT id, wallet_id, user_id, amount, currency, type, purpose, description, payment_method, payment_status, transaction_ref, is_admin_created, created_at
          FROM wallet_transactions WHERE wallet_id = ${w.id} ORDER BY created_at DESC LIMIT 50`,
    );
    const txRows = Array.isArray((txResult as any)?.[0]) ? (txResult as any)[0] : (txResult as any);
    transactions = (txRows as any[]) ?? [];

    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sumResult = await db.execute(
      sql`SELECT
          COALESCE(SUM(CASE WHEN type='credit' THEN amount ELSE 0 END), 0) AS credits,
          COALESCE(SUM(CASE WHEN type='debit' THEN amount ELSE 0 END), 0) AS debits
          FROM wallet_transactions
          WHERE wallet_id = ${w.id} AND created_at >= ${monthAgo} AND payment_status = 'completed'`,
    );
    const sumRows = Array.isArray((sumResult as any)?.[0]) ? (sumResult as any)[0] : (sumResult as any);
    const sumRow = (sumRows as any[])?.[0];
    monthCredits = Number(sumRow?.credits ?? 0);
    monthDebits = Number(sumRow?.debits ?? 0);
  } catch {
    // Eski local DB'lerde wallet_transactions yoksa boş işlem listesiyle devam et.
    transactions = [];
  }

  return reply.send({
    data: {
      wallet: {
        id: w.id,
        balance: w.balance,
        pending_balance: w.pending_balance,
        currency: w.currency,
      },
      transactions,
      this_month: { credits: monthCredits, debits: monthDebits, net: monthCredits - monthDebits },
    },
  });
}

/* ─── POST /me/consultant/wallet/withdraw ─── */
// T30-7: Para çekme talebi (admin onaylı).
const withdrawSchema = z.object({
  amount: z.coerce.number().positive(),
  iban: z.string().trim().min(15).max(50).optional(),
  notes: z.string().trim().max(500).optional(),
});

export async function requestWithdrawal(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  const parsed = withdrawSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.issues } });

  // Wallet'i bul; varsa user cüzdanını danışman cüzdanı olarak bağla.
  const wResult = await db.execute(
    sql`SELECT id, consultant_id, balance, currency
        FROM wallets
        WHERE consultant_id = ${c.id} OR user_id = ${c.user_id}
        LIMIT 1`,
  );
  const wRows = Array.isArray((wResult as any)?.[0]) ? (wResult as any)[0] : (wResult as any);
  const w = (wRows as any[])?.[0];

  if (!w) return reply.code(400).send({ error: { message: 'wallet_not_found' } });
  if (!w.consultant_id) {
    await db.execute(sql`UPDATE wallets SET consultant_id = ${c.id} WHERE id = ${w.id}`);
  }

  const balance = Number(w.balance);
  if (parsed.data.amount > balance) {
    return reply.code(400).send({ error: { message: 'insufficient_balance', balance } });
  }

  // pending withdrawal transaction (wallet_transactions tablosu varsa insert)
  const txId = randomUUID();
  const desc = parsed.data.notes || (parsed.data.iban ? `IBAN: ${parsed.data.iban}` : null);
  try {
    await db.execute(
      sql`INSERT INTO wallet_transactions (id, wallet_id, user_id, type, amount, currency, purpose, description, payment_status, is_admin_created)
          VALUES (${txId}, ${w.id}, ${c.user_id}, 'debit', ${String(parsed.data.amount)}, ${w.currency}, 'withdrawal', ${desc}, 'pending', 0)`,
    );
  } catch {
    return reply.code(500).send({ error: { message: 'tx_table_missing' } });
  }

  return reply.send({
    data: {
      id: txId,
      status: 'pending',
      amount: parsed.data.amount,
      currency: w.currency,
      message: 'Para çekme talebiniz alındı. Admin onayından sonra hesabınıza geçecektir.',
    },
  });
}

/* ─── GET /me/consultant/reviews ─── */
// T30-8: Bu danışmana yazılmış yorumları listele (cevap dahil).
export async function listMyReviews(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  // reviews + review_i18n LEFT JOIN — yorum metni + danışman cevabı
  const rows = await db.execute(
    sql`
      SELECT
        r.id,
        r.target_type,
        r.target_id,
        r.user_id,
        r.name,
        r.email,
        r.rating,
        r.is_active,
        r.is_approved,
        r.is_verified,
        r.helpful_count,
        r.created_at,
        i.comment,
        i.consultant_reply,
        i.consultant_replied_at,
        i.locale
      FROM reviews r
      LEFT JOIN review_i18n i ON i.review_id = r.id
      WHERE r.target_type = 'consultant'
        AND r.target_id COLLATE utf8mb4_unicode_ci = ${c.id} COLLATE utf8mb4_unicode_ci
        AND r.is_active = 1
      ORDER BY r.created_at DESC
      LIMIT 200
    `,
  );
  const arr = (Array.isArray((rows as any)?.[0]) ? (rows as any)[0] : (rows as any)) as any[];
  return reply.send({ data: arr ?? [] });
}

/* ─── POST /me/consultant/reviews/:id/reply ─── */
const reviewReplySchema = z.object({ reply: z.string().trim().min(1).max(2000) });

export async function replyToReview(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  const { id } = req.params as { id: string };
  const parsed = reviewReplySchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body' } });

  // Yorumun bu danışmana ait olup olmadığını doğrula
  const ownCheck = await db.execute(
    sql`SELECT id FROM reviews WHERE id = ${id}
        AND target_type = 'consultant'
        AND target_id COLLATE utf8mb4_unicode_ci = ${c.id} COLLATE utf8mb4_unicode_ci
        LIMIT 1`,
  );
  const ownArr = Array.isArray((ownCheck as any)?.[0]) ? (ownCheck as any)[0] : (ownCheck as any);
  if (!(ownArr as any[])?.[0]) return reply.code(404).send({ error: { message: 'not_found' } });

  // review_i18n'a cevap yaz (varsa update, yoksa insert)
  const now = new Date();
  await db.execute(
    sql`
      UPDATE review_i18n
      SET consultant_reply = ${parsed.data.reply},
          consultant_replied_at = ${now}
      WHERE review_id = ${id}
    `,
  );

  return reply.send({
    data: {
      id,
      consultant_reply: parsed.data.reply,
      consultant_replied_at: now,
    },
  });
}

/* ─── GET /me/consultant/availability ─── */
// T30-4: Haftalık çalışma saatleri (resource_working_hours).
export async function getMyAvailability(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  // Resource'u bul (external_ref_id = consultant.id)
  const rRes = await db.execute(
    sql`SELECT id, title FROM resources WHERE external_ref_id = ${c.id} AND type = 'consultant' LIMIT 1`,
  );
  const rArr = Array.isArray((rRes as any)?.[0]) ? (rRes as any)[0] : (rRes as any);
  const resource = (rArr as any[])?.[0];
  if (!resource) {
    return reply.send({ data: { resource_id: null, working_hours: [] } });
  }

  const whRes = await db.execute(
    sql`SELECT id, CASE WHEN dow = 0 THEN 7 ELSE dow END AS dow, start_time, end_time, slot_minutes, capacity, is_active
        FROM resource_working_hours WHERE resource_id = ${resource.id} ORDER BY dow ASC, start_time ASC`,
  );
  const whArr = (Array.isArray((whRes as any)?.[0]) ? (whRes as any)[0] : (whRes as any)) as any[];

  return reply.send({
    data: {
      resource_id: resource.id,
      resource_title: resource.title,
      working_hours: whArr ?? [],
    },
  });
}

/* ─── PUT /me/consultant/availability ─── */
// T30-4: Bulk replace — gönderilen array yeni working_hours.
const availSchema = z.object({
  hours: z.array(z.object({
    dow: z.coerce.number().int().min(0).max(7).transform((dow) => (dow === 0 ? 7 : dow)),
    start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
    end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
    slot_minutes: z.coerce.number().int().positive().max(480).default(30),
    capacity: z.coerce.number().int().positive().max(100).default(1),
    is_active: z.coerce.number().int().min(0).max(1).default(1),
  }).refine((h) => h.end_time > h.start_time, {
    message: 'end_time_must_be_after_start_time',
    path: ['end_time'],
  })).max(50),
});

export async function updateMyAvailability(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  const parsed = availSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.issues } });

  const rRes = await db.execute(
    sql`SELECT id FROM resources WHERE external_ref_id = ${c.id} AND type = 'consultant' LIMIT 1`,
  );
  const rArr = Array.isArray((rRes as any)?.[0]) ? (rRes as any)[0] : (rRes as any);
  const resource = (rArr as any[])?.[0];
  if (!resource) return reply.code(400).send({ error: { message: 'resource_not_found' } });

  // Replace strategy: silib yeniden ekle (bulk update için en basit)
  await db.execute(sql`DELETE FROM resource_working_hours WHERE resource_id = ${resource.id}`);

  for (const h of parsed.data.hours) {
    await db.execute(
      sql`INSERT INTO resource_working_hours (id, resource_id, dow, start_time, end_time, slot_minutes, break_minutes, capacity, is_active)
          VALUES (UUID(), ${resource.id}, ${h.dow}, ${h.start_time}, ${h.end_time}, ${h.slot_minutes}, 0, ${h.capacity}, ${h.is_active})`,
    );
  }

  return reply.send({ data: { resource_id: resource.id, count: parsed.data.hours.length } });
}

/* ─── POST /me/consultant/availability/day ─── */
// T30-4: Tek seferlik gün kapatma/açma. Mevcut availability override altyapısını kullanır.
const availabilityDayOverrideSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  is_active: z.coerce.number().int().min(0).max(1),
});

export async function overrideMyAvailabilityDay(req: FastifyRequest, reply: FastifyReply) {
  const c = await getCallerConsultant(req);
  if (!c) return reply.code(403).send({ error: { message: 'not_consultant' } });

  const parsed = availabilityDayOverrideSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: { message: 'invalid_body', issues: parsed.error.issues } });
  }

  const rRes = await db.execute(
    sql`SELECT id FROM resources WHERE external_ref_id = ${c.id} AND type = 'consultant' LIMIT 1`,
  );
  const rArr = Array.isArray((rRes as any)?.[0]) ? (rRes as any)[0] : (rRes as any);
  const resource = (rArr as any[])?.[0];
  if (!resource) return reply.code(400).send({ error: { message: 'resource_not_found' } });

  try {
    const out = await overrideDaySlots({
      resource_id: String(resource.id),
      dateYmd: parsed.data.date,
      is_active: parsed.data.is_active as 0 | 1,
    });

    return reply.send({
      data: {
        resource_id: String(resource.id),
        date: parsed.data.date,
        is_active: parsed.data.is_active,
        ...out,
      },
    });
  } catch (e: any) {
    if (String(e?.code || '') === 'slot_has_reservations') {
      return reply.code(409).send({ error: { message: 'slot_has_reservations', details: e?.details } });
    }
    throw e;
  }
}
