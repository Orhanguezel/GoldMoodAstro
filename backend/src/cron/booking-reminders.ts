import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { sendPushNotification } from '@/modules/firebase/service';

type ReminderKind = '24h' | '2h' | '15m' | '5m';

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
  flag?: 'reminder_24h_sent' | 'reminder_2h_sent' | 'reminder_15m_sent';
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
  {
    kind: '5m',
    minMinutes: 4,
    maxMinutes: 6,
    title: '5 dakika içinde görüşme başlıyor',
    body: 'Katılmak için hazır olun, görüşmeniz 5 dakika içinde başlıyor.',
  },
];

const inProcessReminderCache = new Map<string, number>();
const FIVE_MIN_MEMORY_TTL_MS = 15 * 60 * 1000;

function makeReminderCacheKey(kind: ReminderKind, bookingId: string) {
  return `${kind}:${bookingId}`;
}

function shouldSkipUntrackedReminder(kind: ReminderKind, bookingId: string) {
  if (!kind || kind !== '5m') return false;

  const key = makeReminderCacheKey(kind, bookingId);
  const last = inProcessReminderCache.get(key) ?? 0;
  const now = Date.now();
  if (!last) return false;
  return now - last < FIVE_MIN_MEMORY_TTL_MS;
}

function trackUntrackedReminder(kind: ReminderKind, bookingId: string) {
  if (kind !== '5m') return;
  inProcessReminderCache.set(makeReminderCacheKey(kind, bookingId), Date.now());
}

async function listReminderRows(reminder: (typeof REMINDERS)[number]) {
  const flagClause = reminder.flag ? sql.raw(`AND b.${reminder.flag} = 0`) : sql.raw('');

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
      ${flagClause}
      AND TIMESTAMPDIFF(
        MINUTE,
        NOW(),
        STR_TO_DATE(CONCAT(b.appointment_date, ' ', COALESCE(b.appointment_time, '00:00')), '%Y-%m-%d %H:%i')
      ) BETWEEN ${reminder.minMinutes} AND ${reminder.maxMinutes}
  `);

  const resultRows = Array.isArray((rows as any)?.[0]) ? (rows as any)[0] : rows;
  return Array.isArray(resultRows) ? (resultRows as ReminderRow[]) : [];
}

async function markReminderSent(bookingId: string, flag: string) {
  await db.execute(sql`
    UPDATE bookings
    SET ${sql.raw(flag)} = 1, updated_at = NOW(3)
    WHERE id = ${bookingId}
  `);
}

async function sendReminder(row: ReminderRow, reminder: (typeof REMINDERS)[number]) {
  if (shouldSkipUntrackedReminder(reminder.kind, row.id)) return;
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

  if (reminder.flag) {
    await markReminderSent(row.id, reminder.flag);
    return;
  }

  trackUntrackedReminder(reminder.kind, row.id);
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
  setInterval(run, 5 * 60 * 1000);
}
