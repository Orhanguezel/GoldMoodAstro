import { db } from '@/db/client';
import { randomUUID } from 'node:crypto';
import { bookings } from '@goldmood/shared-backend/modules/bookings/schema';
import { profiles } from '@goldmood/shared-backend/modules/profiles/schema';
import { appConfig } from '@goldmood/shared-config/appConfig';
import { sendPushNotification } from '@/modules/firebase/service';
import { and, between, eq, sql } from 'drizzle-orm';

export function registerBookingReminderCron() {
  // Her 5 dakikada bir kontrol et
  setInterval(() => {
    runBookingReminders().catch(console.error);
  }, 5 * 60 * 1000);
}

export async function runBookingReminders() {
  const now = new Date();
  
  // 1. Find bookings starting in 15-20 minutes that haven't sent 15m reminder
  const in15m = new Date(now.getTime() + 15 * 60000);
  const in20m = new Date(now.getTime() + 20 * 60000);

  const pending15m = await db.select({
    booking: bookings,
    profile: profiles
  })
  .from(bookings)
  .innerJoin(profiles, eq(profiles.id, bookings.user_id))
  .where(and(
    eq(bookings.status, 'booked'),
    eq(bookings.reminder_15m_sent, 0),
    between(
      sql`STR_TO_DATE(CONCAT(${bookings.appointment_date}, ' ', ${bookings.appointment_time}), '%Y-%m-%d %H:%i')`,
      now,
      in20m,
    )
  ));

  for (const item of pending15m) {
    if (item.profile.fcm_token && item.profile.push_notifications) {
      try {
        await sendPushNotification({
          token: item.profile.fcm_token,
          title: 'Görüşmeniz Başlıyor!',
          body: `Danışmanınız ile görüşmenize 15 dakika kaldı. Hazır mısınız?`,
          data: { type: 'booking_reminder', booking_id: item.booking.id }
        });
        await db.update(bookings).set({ reminder_15m_sent: 1 }).where(eq(bookings.id, item.booking.id));
      } catch (e) {
        console.error('Push error (15m):', e);
      }
    }
  }

  await runIncomingCallPushes(now);

  // 2. Similarly for 2h and 24h if needed (MVP prioritizes 15m)
}

async function runIncomingCallPushes(now: Date) {
  const startsTo = new Date(now.getTime() + 5 * 60000);
  const startedFrom = new Date(now.getTime() - 2 * 60000);

  const result = await db.execute(sql`
    SELECT
      b.id,
      b.media_type,
      b.name AS customer_name,
      customer.fcm_token AS customer_fcm_token,
      consultant_user.full_name AS consultant_name,
      consultant_user.fcm_token AS consultant_fcm_token
    FROM bookings b
    INNER JOIN consultants c ON c.id = b.consultant_id
    INNER JOIN users customer ON customer.id = b.user_id
    INNER JOIN users consultant_user ON consultant_user.id = c.user_id
    LEFT JOIN live_sessions ls ON ls.booking_id = b.id
    WHERE b.status IN ('booked', 'confirmed')
      AND ls.booking_id IS NULL
      AND STR_TO_DATE(CONCAT(b.appointment_date, ' ', b.appointment_time), '%Y-%m-%d %H:%i')
        BETWEEN ${startedFrom} AND ${startsTo}
    LIMIT 100
  `);
  const rows = (Array.isArray((result as any)?.[0]) ? (result as any)[0] : result) as Array<{
    id: string;
    media_type: 'audio' | 'video' | null;
    customer_name: string | null;
    customer_fcm_token: string | null;
    consultant_name: string | null;
    consultant_fcm_token: string | null;
  }>;

  for (const row of rows ?? []) {
    const data = {
      type: 'incoming_call',
      booking_id: row.id,
      media_type: row.media_type === 'video' ? 'video' : 'audio',
      url: `/call/${row.id}`,
    };

    const tasks: Array<Promise<unknown>> = [];
    if (row.customer_fcm_token) {
      tasks.push(sendPushNotification({
        token: row.customer_fcm_token,
        title: 'Görüşmeniz başlıyor',
        body: `${row.consultant_name || 'Danışmanınız'} ile görüşmeye katılabilirsiniz.`,
        data,
      }));
    }
    if (row.consultant_fcm_token) {
      tasks.push(sendPushNotification({
        token: row.consultant_fcm_token,
        title: 'Görüşmeniz başlıyor',
        body: `${row.customer_name || 'Danışan'} görüşme için bekliyor.`,
        data,
      }));
    }

    const results = await Promise.allSettled(tasks);
    const failed = results.some((item) => item.status === 'rejected');
    if (failed) {
      console.error('[cron] incoming-call push failed:', { booking_id: row.id, results });
    }

    await db.execute(sql`
      INSERT INTO live_sessions (id, booking_id, room_name, media_type, status, created_at, updated_at)
      VALUES (
        ${randomUUID()},
        ${row.id},
        ${`${appConfig.livekit.roomPrefix}-${row.id}`},
        ${row.media_type === 'video' ? 'video' : 'audio'},
        'pending',
        NOW(),
        NOW()
      )
      ON DUPLICATE KEY UPDATE updated_at = updated_at
    `);
  }
}
