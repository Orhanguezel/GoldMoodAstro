import { db } from '@/db/client';
import { bookings } from '@goldmood/shared-backend/modules/bookings/schema';
import { profiles } from '@goldmood/shared-backend/modules/profiles/schema';
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

  // 2. Similarly for 2h and 24h if needed (MVP prioritizes 15m)
}
