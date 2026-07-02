import { sql } from 'drizzle-orm';
import { db } from '@/db/client';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function rowsFromExecute<T = any>(result: unknown): T[] {
  const rows = Array.isArray((result as any)?.[0]) ? (result as any)[0] : result;
  return Array.isArray(rows) ? rows as T[] : [];
}

export async function runPaymentReconciliationSweep() {
  const creditDrift = rowsFromExecute(await db.execute(sql`
    SELECT uc.user_id, uc.balance, COALESCE(SUM(ct.amount), 0) AS ledger_balance
    FROM user_credits uc
    LEFT JOIN credit_transactions ct ON ct.user_id = uc.user_id
    GROUP BY uc.user_id, uc.balance
    HAVING ABS(uc.balance - ledger_balance) > 0.0001
    LIMIT 50
  `));

  const orderPaymentDrift = rowsFromExecute(await db.execute(sql`
    SELECT o.id, o.order_number, o.total_amount, COALESCE(SUM(p.amount), 0) AS paid_amount
    FROM orders o
    LEFT JOIN payments p ON p.order_id = o.id AND p.status = 'success'
    WHERE o.payment_status = 'paid'
    GROUP BY o.id, o.order_number, o.total_amount
    HAVING ABS(o.total_amount - paid_amount) > 0.0001
    LIMIT 50
  `));

  const walletDrift = rowsFromExecute(await db.execute(sql`
    SELECT w.id, w.user_id, w.balance, w.pending_balance,
           COALESCE(SUM(CASE
             WHEN wt.payment_status = 'completed' AND wt.type = 'credit' THEN wt.amount
             WHEN wt.payment_status = 'completed' AND wt.type = 'debit' THEN -wt.amount
             ELSE 0
           END), 0) AS ledger_balance,
           COALESCE(SUM(CASE
             WHEN wt.payment_status = 'pending' AND wt.type = 'credit' THEN wt.amount
             WHEN wt.payment_status = 'pending' AND wt.type = 'debit' THEN -wt.amount
             ELSE 0
           END), 0) AS ledger_pending
    FROM wallets w
    LEFT JOIN wallet_transactions wt ON wt.wallet_id = w.id
    GROUP BY w.id, w.user_id, w.balance, w.pending_balance
    HAVING ABS(w.balance - ledger_balance) > 0.0001
        OR ABS(w.pending_balance - ledger_pending) > 0.0001
    LIMIT 50
  `));

  if (creditDrift.length > 0 || orderPaymentDrift.length > 0 || walletDrift.length > 0) {
    console.error('[payment-reconciliation] drift_detected', {
      credit_count: creditDrift.length,
      order_payment_count: orderPaymentDrift.length,
      wallet_count: walletDrift.length,
      credit_sample: creditDrift.slice(0, 3),
      order_payment_sample: orderPaymentDrift.slice(0, 3),
      wallet_sample: walletDrift.slice(0, 3),
    });
  }
}

export function registerPaymentReconciliationCron() {
  const run = () => {
    void runPaymentReconciliationSweep().catch((error) => {
      console.error('[payment-reconciliation] hata:', error);
    });
  };

  setTimeout(run, 60_000);
  setInterval(run, ONE_DAY_MS);
  console.log('[cron] payment-reconciliation registered (daily)');
}
