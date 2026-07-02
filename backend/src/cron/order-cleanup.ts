import { sql } from 'drizzle-orm';
import { db } from '@/db/client';

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

export async function runOrderCleanupSweep() {
  const result = await db.execute(sql`
    UPDATE orders
    SET status = 'cancelled',
        payment_status = 'failed',
        updated_at = CURRENT_TIMESTAMP(3)
    WHERE status IN ('pending', 'processing')
      AND payment_status IN ('unpaid', 'pending')
      AND created_at < (NOW() - INTERVAL 24 HOUR)
  `);
  const info = Array.isArray(result) ? result[0] : result;
  const affected = Number((info as any)?.affectedRows ?? 0);
  if (affected > 0) {
    console.log(`[order-cleanup] ${affected} terk edilmiş order iptal edildi.`);
  }
}

export function registerOrderCleanupCron() {
  const run = () => {
    void runOrderCleanupSweep().catch((error) => {
      console.error('[order-cleanup] hata:', error);
    });
  };

  setTimeout(run, 45_000);
  setInterval(run, SIX_HOURS_MS);
  console.log('[cron] order-cleanup registered (every 6h)');
}
