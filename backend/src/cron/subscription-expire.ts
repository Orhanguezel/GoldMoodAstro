import { sql } from 'drizzle-orm';
import { db } from '@/db/client';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export async function runSubscriptionExpireSweep() {
  const result = await db.execute(sql`
    UPDATE subscriptions
    SET status = 'expired', updated_at = CURRENT_TIMESTAMP(3)
    WHERE status IN ('active', 'grace_period')
      AND ends_at IS NOT NULL
      AND ends_at < NOW()
  `);
  const info = Array.isArray(result) ? result[0] : result;
  const affected = Number((info as any)?.affectedRows ?? 0);
  if (affected > 0) {
    console.log(`[subscription-expire] ${affected} abonelik expired yapıldı.`);
  }
}

export function registerSubscriptionExpireCron() {
  const run = () => {
    void runSubscriptionExpireSweep().catch((error) => {
      console.error('[subscription-expire] hata:', error);
    });
  };

  setTimeout(run, 30_000);
  setInterval(run, ONE_DAY_MS);
  console.log('[cron] subscription-expire registered (daily)');
}
