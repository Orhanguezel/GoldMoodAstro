// =============================================================
// FILE: src/modules/ext/crm-inbox.ts
// Masaüstü CRM (gzl-gelir-crm) için admin gelen-kutusu köprüsü.
// Salt-okuma toplu görünüm + iletişim mesajına CRM'den yanıt.
// Grup seviyesinde requireServiceToken (X-Api-Key, fail-closed) korur.
// =============================================================
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { sendContactReplyMessage } from '@goldmood/shared-backend/modules/contact/reply.service';

function rows<T = any>(result: unknown): T[] {
  // drizzle mysql2 execute → [rows, fields]
  const r = result as any;
  if (Array.isArray(r) && Array.isArray(r[0])) return r[0] as T[];
  if (Array.isArray(r)) return r as T[];
  return (r?.rows ?? []) as T[];
}

const InboxQuerySchema = z.object({
  updatedSince: z.string().datetime({ offset: true }).optional(),
  contactLimit: z.coerce.number().int().min(1).max(200).default(50),
});

/** GET /ext/crm/inbox — iletişim mesajları, bekleyen randevular, danışman başvuruları, canlı destek kuyruğu */
export async function crmInboxHandler(req: FastifyRequest, reply: FastifyReply) {
  const q = InboxQuerySchema.parse(req.query ?? {});
  const since = q.updatedSince ? new Date(q.updatedSince) : null;

  const contactsRes = await db.execute(sql`
    SELECT id, name, email, phone, subject, message, status, created_at, updated_at
    FROM contact_messages
    WHERE status IN ('new','in_progress')
      ${since ? sql`AND updated_at >= ${since}` : sql``}
    ORDER BY created_at DESC
    LIMIT ${q.contactLimit}
  `);
  const contacts = rows(contactsRes);

  // Yanıt thread'leri (toplu — N+1 yerine tek sorgu)
  const contactIds = contacts.map((c: any) => c.id);
  let repliesByContact: Record<string, any[]> = {};
  if (contactIds.length > 0) {
    const repliesRes = await db.execute(sql`
      SELECT contact_id, message, direction, email_status, created_at
      FROM contact_replies
      WHERE contact_id IN (${sql.join(contactIds.map((id: string) => sql`${id}`), sql`, `)})
      ORDER BY created_at ASC
    `);
    for (const r of rows(repliesRes)) {
      (repliesByContact[r.contact_id] ??= []).push(r);
    }
  }

  const pendingBookingsRes = await db.execute(sql`
    SELECT b.id, b.name AS customer_name, b.email AS customer_email, b.appointment_date,
           b.appointment_time, b.session_duration, b.session_price, b.media_type, b.status,
           b.created_at, u.full_name AS consultant_name
    FROM bookings b
    LEFT JOIN consultants c ON c.id = b.consultant_id
    LEFT JOIN users u ON u.id = c.user_id
    WHERE b.status IN ('pending_payment','pending','confirmed')
      AND b.appointment_date >= DATE_FORMAT(UTC_TIMESTAMP(), '%Y-%m-%d')
    ORDER BY b.appointment_date ASC, b.appointment_time ASC
    LIMIT 100
  `);

  const pendingConsultantsRes = await db.execute(sql`
    SELECT c.id, u.full_name, u.email, c.created_at
    FROM consultants c JOIN users u ON u.id = c.user_id
    WHERE c.approval_status = 'pending'
    ORDER BY c.created_at ASC
    LIMIT 50
  `);

  // Canlı desteğe düşmüş (admin bekleyen) sohbetler + son mesaj
  const waitingChatsRes = await db.execute(sql`
    SELECT s.thread_id, s.preferred_locale, s.assigned_admin_user_id, s.updated_at,
           (SELECT m.text FROM chat_messages m WHERE m.thread_id = s.thread_id
            ORDER BY m.created_at DESC LIMIT 1) AS last_message
    FROM chat_support_sessions s
    WHERE s.handoff_mode = 'admin'
    ORDER BY s.updated_at DESC
    LIMIT 30
  `);

  const contactsOut = contacts.map((c: any) => ({ ...c, replies: repliesByContact[c.id] ?? [] }));
  const pendingBookings = rows(pendingBookingsRes);
  const pendingConsultants = rows(pendingConsultantsRes);
  const waitingChats = rows(waitingChatsRes);

  return reply.send({
    generated_at: new Date().toISOString(),
    counts: {
      contacts: contactsOut.length,
      pending_bookings: pendingBookings.length,
      pending_consultants: pendingConsultants.length,
      waiting_chats: waitingChats.length,
    },
    contacts: contactsOut,
    pending_bookings: pendingBookings,
    pending_consultants: pendingConsultants,
    waiting_chats: waitingChats,
  });
}

const ReplyBodySchema = z.object({
  message: z.string().trim().min(1).max(5000),
});

/** POST /ext/crm/contacts/:id/reply — CRM'den iletişim mesajına yanıt (e-posta + thread kaydı) */
export async function crmContactReplyHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const { message } = ReplyBodySchema.parse(req.body ?? {});

  const result = await sendContactReplyMessage({
    contactId: id,
    message,
    adminUserId: null, // servis-token kanalı; kayıtta kanal bilgisi direction=outbound
    log: req.log,
  });
  if (!result) return reply.code(404).send({ error: { message: 'contact_not_found' } });

  if (result.emailStatus === 'failed') {
    return reply.code(502).send({ reply: result.created, email: 'failed', message: 'reply_saved_email_failed' });
  }
  return reply.code(201).send({ reply: result.created, email: 'sent' });
}
