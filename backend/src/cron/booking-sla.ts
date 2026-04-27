// FAZ 14 / T14-3 — 15dk SLA Timer + Otomatik İade
//
// Booking confirm edildikten sonra astrolog 15 dk içinde live_session başlatmadıysa:
// 1. booking.status = 'timed_out'
// 2. Kredi/order iadesi (credit_transactions refund OR orders refund flag)
// 3. Push notification (kullanıcıya: "Astrolog katılmadı, kredin iade edildi")
//
// Timer mantığı:
//   - Booking.appointment_time'dan +15 dakika geçmiş ve
//   - Booking.status hala 'confirmed' veya 'booked' (live_session başlamamış)
//
// Cron her dakika çalışır (15dk pencere kaçırılmasın diye).

import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { sendPushNotification } from '@/modules/firebase/service';
import { randomUUID } from 'crypto';

const SLA_MINUTES = 15;

type TimedOutRow = {
  booking_id: string;
  user_id: string;
  user_fcm_token: string | null;
  price_minor: number;
  credit_amount: number | null;       // varsa booking'e karşılık ödenen kredi
};

async function listTimedOutBookings(): Promise<TimedOutRow[]> {
  // Booking.confirmed/booked + 15dk geçmiş + henüz live_session başlamamış
  const rows = await db.execute(sql`
    SELECT
      b.id AS booking_id,
      b.user_id,
      u.fcm_token AS user_fcm_token,
      COALESCE(o.amount_minor, 0) AS price_minor,
      ct.amount AS credit_amount
    FROM bookings b
    INNER JOIN users u ON u.id = b.user_id
    LEFT JOIN orders o ON o.booking_id = b.id AND o.status = 'paid'
    LEFT JOIN credit_transactions ct ON ct.reference_type = 'booking'
      AND ct.reference_id = b.id AND ct.type = 'consumption'
    LEFT JOIN live_sessions ls ON ls.booking_id = b.id
    WHERE b.status IN ('booked', 'confirmed')
      AND ls.id IS NULL
      AND TIMESTAMPDIFF(
        MINUTE,
        STR_TO_DATE(CONCAT(b.appointment_date, ' ', COALESCE(b.appointment_time, '00:00')), '%Y-%m-%d %H:%i'),
        NOW()
      ) >= ${SLA_MINUTES}
  `);

  const arr = Array.isArray((rows as unknown as unknown[])?.[0]) ? (rows as unknown as unknown[][])[0] : rows;
  return Array.isArray(arr) ? (arr as TimedOutRow[]) : [];
}

async function markTimedOutAndRefund(row: TimedOutRow) {
  // 1. booking → timed_out
  await db.execute(sql`
    UPDATE bookings SET status = 'timed_out', updated_at = NOW(3) WHERE id = ${row.booking_id}
  `);

  // 2. Kredi varsa iade
  if (row.credit_amount && row.credit_amount < 0) {
    const refundAmount = Math.abs(row.credit_amount);
    const refundId = randomUUID();
    await db.execute(sql`
      UPDATE user_credits SET balance = balance + ${refundAmount}, updated_at = NOW(3)
      WHERE user_id = ${row.user_id}
    `);
    await db.execute(sql`
      INSERT INTO credit_transactions (id, user_id, type, amount, balance_after, reference_type, reference_id, description, created_at)
      SELECT ${refundId}, ${row.user_id}, 'refund', ${refundAmount},
             (SELECT balance FROM user_credits WHERE user_id = ${row.user_id}),
             'booking', ${row.booking_id},
             'SLA timeout — astrolog 15 dk içinde katılmadı', NOW(3)
    `);
  }

  // 3. Push notification kullanıcıya
  if (row.user_fcm_token) {
    await sendPushNotification({
      token: row.user_fcm_token,
      title: 'Görüşmeniz iptal edildi',
      body: 'Astrolog 15 dakika içinde katılmadığı için kredilerin iade edildi.',
      data: {
        type: 'booking_timed_out',
        booking_id: row.booking_id,
      },
    });
  }
}

export async function runBookingSlaSweep() {
  const rows = await listTimedOutBookings();
  for (const row of rows) {
    try {
      await markTimedOutAndRefund(row);
      console.log('booking_sla_timeout', { booking_id: row.booking_id, user_id: row.user_id });
    } catch (error) {
      console.error('booking_sla_failed', { booking_id: row.booking_id, error });
    }
  }
}

export function registerBookingSlaCron() {
  const run = () => {
    void runBookingSlaSweep().catch((error) => {
      console.error('booking_sla_sweep_failed', error);
    });
  };
  // Her dakika kontrol — 15dk window kaçırma
  setInterval(run, 60 * 1000);
}
