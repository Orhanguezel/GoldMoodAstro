// T29-4 — Anlık görüşme talepleri için 5dk timeout cron
//
// Kullanıcı "Hemen Görüşme Talep Et" butonuna basar → booking status='requested_now'
// Danışman 5 dakika içinde Onayla/Reddet etmezse otomatik iptal edilir.
// Cron her dakika çalışır.

import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import {
  createUserNotification,
  dispatchPushToUser,
} from '@goldmood/shared-backend/modules/notifications';
import { sendTemplatedEmail } from '@goldmood/shared-backend/modules/emailTemplates/mailer';
import { getDefaultLocale } from '@goldmood/shared-backend/modules/_shared';

const TIMEOUT_MINUTES = 5;

async function run() {
  try {
    // Önce zamanı dolan talepleri bul (kullanıcıya bildirim için ID + user_id + email + locale)
    const expiredRows = await db.execute(
      sql`SELECT id, user_id, email, name, locale FROM bookings
          WHERE status = 'requested_now'
            AND created_at < (NOW() - INTERVAL ${TIMEOUT_MINUTES} MINUTE)`,
    );
    const arr = Array.isArray((expiredRows as any)?.[0]) ? (expiredRows as any)[0] : (expiredRows as any);
    const expired: Array<{ id: string; user_id: string; email: string | null; name: string | null; locale: string | null }> = (arr as any[]) ?? [];

    if (expired.length === 0) return;

    const result = await db.execute(
      sql`UPDATE bookings
          SET status = 'cancelled',
              decision_note = 'Otomatik iptal: danışman 5 dakika içinde yanıt vermedi',
              updated_at = CURRENT_TIMESTAMP(3)
          WHERE status = 'requested_now'
            AND created_at < (NOW() - INTERVAL ${TIMEOUT_MINUTES} MINUTE)`,
    );
    const info: any = Array.isArray(result) ? result[0] : result;
    const affected = (info as any)?.affectedRows ?? 0;
    if (affected > 0) {
      console.log(`[request-now-timeout] ${affected} talep otomatik iptal edildi.`);
    }

    // Müşterilere bildirim + email — fire-and-forget
    const title = '⏰ Anlık Görüşme Talebiniz Zaman Aşımına Uğradı';
    const message = 'Danışman 5 dakika içinde yanıt veremedi. Başka bir danışman seçebilir veya tekrar deneyebilirsiniz.';
    const defaultLocale = await getDefaultLocale();
    const publicUrl = (process.env.PUBLIC_URL || 'https://goldmoodastro.com').replace(/\/$/, '');
    for (const row of expired) {
      if (!row.user_id) continue;
      const locale = row.locale || defaultLocale;
      const consultantsUrl = `${publicUrl}/${locale}/consultants`;
      Promise.allSettled([
        createUserNotification({ userId: row.user_id, title, message, type: 'booking' }),
        dispatchPushToUser({
          userId: row.user_id,
          title,
          body: message,
          data: { type: 'booking_request_now_timeout', booking_id: row.id, url: '/consultants' },
        }),
        row.email
          ? sendTemplatedEmail({
              to: row.email,
              key: 'booking_request_now_timeout_customer',
              locale,
              defaultLocale,
              params: {
                customer_name: row.name || 'Değerli müşterimiz',
                consultants_url: consultantsUrl,
              },
              allowMissing: true,
            })
          : Promise.resolve(null),
      ]).catch(() => undefined);
    }
  } catch (err) {
    console.error('[request-now-timeout] hata:', err);
  }
}

export function registerRequestNowTimeoutCron() {
  // İlk çalıştırma 10 sn sonra
  setTimeout(run, 10_000);
  // Her dakika
  setInterval(run, 60_000);
  console.log('[cron] request-now-timeout registered (every 60s)');
}
