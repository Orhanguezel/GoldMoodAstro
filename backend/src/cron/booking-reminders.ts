import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { sendPushNotification } from '@/modules/firebase/service';

type ReminderKind = '24h' | '2h' | '15m';

type ReminderRow = {
  id: string;
  user_id: string;
  consultant_id: string;
  appointment_date: string;
  appointment_time: string | null;
  user_fcm_token: string | null;
  consultant_fcm_token: string | null;
  kind: ReminderKind;
};

const REMINDERS: Array<{
  kind: ReminderKind;
  flag: 'reminder_24h_sent' | 'reminder_2h_sent' | 'reminder_15m_sent';
  minMinutes: number;
  maxMinutes: number;
  title: string;
  body: string;
}> = [
  {
    kind: '24h',
    flag: 'reminder_24h_sent',
    minMinutes: 23 * 60 + 55,
    maxMinutes: 24 * 60 + 5,
    title: 'Yarin randevunuz var',
    body: 'Gorusmeniz yarin.',
  },
  {
    kind: '2h',
    flag: 'reminder_2h_sent',
    minMinutes: 115,
    maxMinutes: 125,
    title: '2 saat sonra randevunuz var',
    body: 'Gorusmeniz 2 saat sonra.',
  },
  {
    kind: '15m',
    flag: 'reminder_15m_sent',
    minMinutes: 10,
    maxMinutes: 20,
    title: 'Gorusmeniz 15 dakika sonra basliyor',
    body: 'Sesli gorusmeniz yaklasiyor.',
  },
];

async function listReminderRows(reminder: (typeof REMINDERS)[number]) {
  const rows = await db.execute(sql`
    SELECT
      b.id,
      b.user_id,
      b.consultant_id,
      b.appointment_date,
      b.appointment_time,
      u.fcm_token AS user_fcm_token,
      cu.fcm_token AS consultant_fcm_token,
      ${reminder.kind} AS kind
    FROM bookings b
    INNER JOIN users u ON u.id = b.user_id
    INNER JOIN consultants c ON c.id = b.consultant_id
    INNER JOIN users cu ON cu.id = c.user_id
    WHERE b.status IN ('booked', 'confirmed')
      AND b.${sql.raw(reminder.flag)} = 0
      AND TIMESTAMPDIFF(
        MINUTE,
        NOW(),
        STR_TO_DATE(CONCAT(b.appointment_date, ' ', COALESCE(b.appointment_time, '00:00')), '%Y-%m-%d %H:%i')
      ) BETWEEN ${reminder.minMinutes} AND ${reminder.maxMinutes}
  `);

  const resultRows = Array.isArray((rows as any)?.[0]) ? (rows as any)[0] : rows;
  return Array.isArray(resultRows) ? (resultRows as ReminderRow[]) : [];
}

async function markReminderSent(bookingId: string, flag: (typeof REMINDERS)[number]['flag']) {
  await db.execute(sql`
    UPDATE bookings
    SET ${sql.raw(flag)} = 1, updated_at = NOW(3)
    WHERE id = ${bookingId}
  `);
}

async function sendReminder(row: ReminderRow, reminder: (typeof REMINDERS)[number]) {
  if (!row.id) return;

  const data = {
    type: 'booking_reminder',
    booking_id: row.id,
    reminder: reminder.kind,
  };

  const tokens = [row.user_fcm_token, row.consultant_fcm_token].filter(
    (token): token is string => Boolean(token),
  );

  for (const token of tokens) {
    await sendPushNotification({
      token,
      title: reminder.title,
      body: reminder.body,
      data,
    });
  }

  await markReminderSent(row.id, reminder.flag);
}

export async function runBookingReminderSweep() {
  for (const reminder of REMINDERS) {
    const rows = await listReminderRows(reminder);
    for (const row of rows) {
      try {
        await sendReminder(row, reminder);
      } catch (error) {
        console.error('booking_reminder_failed', {
          booking_id: row.id,
          reminder: reminder.kind,
          error,
        });
      }
    }
  }
}

export function registerBookingReminderCron() {
  const run = () => {
    void runBookingReminderSweep().catch((error) => {
      console.error('booking_reminder_sweep_failed', error);
    });
  };

  const bunCron = (globalThis as unknown as { Bun?: { cron?: Function } }).Bun?.cron;
  if (typeof bunCron === 'function') {
    bunCron('booking-reminders', '*/5 * * * *', run);
    return;
  }

  setInterval(run, 5 * 60 * 1000);
}
