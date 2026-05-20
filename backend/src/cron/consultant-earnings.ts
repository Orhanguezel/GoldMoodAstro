import { sql } from 'drizzle-orm';
import { db } from '@/db/client';

const HOUR_MS = 60 * 60 * 1000;
const DEFAULT_HOLD_DAYS = 7;

async function getHoldDays(): Promise<number> {
  const setting = await db.execute(sql`
    SELECT value
    FROM site_settings
    WHERE \`key\` = 'wallet_hold_days'
    ORDER BY locale = '*' DESC
    LIMIT 1
  `);
  const rows = Array.isArray((setting as any)?.[0]) ? (setting as any)[0] : (setting as any);
  const raw = Number((rows as any[])?.[0]?.value ?? process.env.CONSULTANT_EARNING_HOLD_DAYS);
  if (!Number.isFinite(raw) || raw < 0) return DEFAULT_HOLD_DAYS;
  return Math.min(Math.trunc(raw), 90);
}

export function registerConsultantEarningsCron() {
  setInterval(() => {
    runConsultantEarningsRelease().catch((error) => {
      console.error('[cron] consultant earnings release failed:', error);
    });
  }, HOUR_MS);
}

export async function runConsultantEarningsRelease() {
  const holdDays = await getHoldDays();

  await db.transaction(async (tx) => {
    await tx.execute(sql.raw(`
      UPDATE wallets w
      INNER JOIN (
        SELECT wallet_id, SUM(amount) AS amount
        FROM wallet_transactions
        WHERE purpose = 'session_earning'
          AND payment_status = 'pending'
          AND created_at <= DATE_SUB(NOW(3), INTERVAL ${holdDays} DAY)
        GROUP BY wallet_id
      ) ready ON ready.wallet_id = w.id
      SET w.balance = w.balance + ready.amount,
          w.pending_balance = GREATEST(w.pending_balance - ready.amount, 0),
          w.updated_at = NOW(3)
    `));

    await tx.execute(sql.raw(`
      UPDATE wallet_transactions
      SET payment_status = 'completed',
          updated_at = NOW(3)
      WHERE purpose = 'session_earning'
        AND payment_status = 'pending'
        AND created_at <= DATE_SUB(NOW(3), INTERVAL ${holdDays} DAY)
    `));
  });
}
