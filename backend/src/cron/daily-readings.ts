import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { sendPushNotification } from '@/modules/firebase/service';
import { generateDailyReading } from '@goldmood/shared-backend/modules/readings';

type ReadingTarget = {
  user_id: string;
  chart_id: string;
  fcm_token: string | null;
};

function todayYmd() {
  return new Date().toISOString().slice(0, 10);
}

async function tableExists(tableName: string) {
  const result = await db.execute(sql`
    SELECT COUNT(*) AS count
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = ${tableName}
  `);
  const rows = Array.isArray((result as any)?.[0]) ? (result as any)[0] : result;
  return Number(rows?.[0]?.count ?? 0) > 0;
}

async function listDailyReadingTargets() {
  const hasSubscriptions = await tableExists('subscriptions');
  const result = hasSubscriptions
    ? await db.execute(sql`
        SELECT bc.user_id, MIN(bc.id) AS chart_id, u.fcm_token
        FROM birth_charts bc
        INNER JOIN users u ON u.id = bc.user_id
        INNER JOIN subscriptions s ON s.user_id = bc.user_id
        WHERE s.status IN ('active', 'grace_period')
          AND (s.ends_at IS NULL OR s.ends_at >= NOW())
        GROUP BY bc.user_id, u.fcm_token
      `)
    : await db.execute(sql`
        SELECT bc.user_id, MIN(bc.id) AS chart_id, u.fcm_token
        FROM birth_charts bc
        INNER JOIN users u ON u.id = bc.user_id
        GROUP BY bc.user_id, u.fcm_token
      `);

  const rows = Array.isArray((result as any)?.[0]) ? (result as any)[0] : result;
  return Array.isArray(rows) ? (rows as ReadingTarget[]) : [];
}

export async function runDailyReadingsSweep() {
  const targets = await listDailyReadingTargets();
  for (const target of targets) {
    try {
      await generateDailyReading(target.user_id, target.chart_id);
      if (target.fcm_token) {
        await sendPushNotification({
          token: target.fcm_token,
          title: 'Bugünün yorumunuz hazır',
          body: 'Günlük astroloji yorumunuz GoldMoodAstro’da sizi bekliyor.',
          data: { type: 'daily_reading', date: todayYmd() },
        });
      }
    } catch (error) {
      console.error('daily_reading_generation_failed', {
        user_id: target.user_id,
        chart_id: target.chart_id,
        error,
      });
    }
  }
}

export function registerDailyReadingsCron() {
  let lastRunDate = '';
  const runIfDue = () => {
    const now = new Date();
    const date = todayYmd();
    if (now.getUTCHours() !== 6 || lastRunDate === date) return;
    lastRunDate = date;
    void runDailyReadingsSweep().catch((error) => {
      console.error('daily_readings_sweep_failed', error);
      lastRunDate = '';
    });
  };

  runIfDue();
  setInterval(runIfDue, 5 * 60 * 1000);
}
