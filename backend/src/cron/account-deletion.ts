// FAZ 18 / T18 — KVKK F9: Hesap Silme Sweep Cron
//
// Her 6 saatte bir tarama:
//   account_deletion_requests.status='pending' AND scheduled_for <= NOW()
//   olan kayıtlar için:
//   1. users tablosundan kaydı sil (CASCADE FK'lerle tüm bağlı veriler temizlenir:
//      birth_charts, bookings, orders, reviews, user_credits, credit_transactions,
//      subscriptions, support_tickets, ...)
//   2. account_deletion_requests.status='completed', completed_at = NOW

import { sql } from 'drizzle-orm';
import { db } from '@/db/client';

type PendingRow = {
  request_id: string;
  user_id: string;
};

async function listScheduledForDeletion(): Promise<PendingRow[]> {
  const rows = await db.execute(sql`
    SELECT id AS request_id, user_id
    FROM account_deletion_requests
    WHERE status = 'pending'
      AND scheduled_for <= NOW(3)
    LIMIT 50
  `);
  const arr = Array.isArray((rows as unknown as unknown[])?.[0]) ? (rows as unknown as unknown[][])[0] : rows;
  return Array.isArray(arr) ? (arr as PendingRow[]) : [];
}

async function permanentDeleteUser(row: PendingRow) {
  // 1. Önce request'i completed olarak işaretle (idempotent — user silinince FK CASCADE
  //    nedeniyle bu request de silinebilir; status önce update edilir)
  await db.execute(sql`
    UPDATE account_deletion_requests
    SET status = 'completed', completed_at = NOW(3), updated_at = NOW(3)
    WHERE id = ${row.request_id}
  `);

  // 2. User'ı sil — CASCADE FK'ler tüm bağlı veriyi siler
  await db.execute(sql`
    DELETE FROM users WHERE id = ${row.user_id}
  `);

  console.log('account_deletion_completed', {
    request_id: row.request_id,
    user_id: row.user_id,
    at: new Date().toISOString(),
  });
}

export async function runAccountDeletionSweep() {
  const rows = await listScheduledForDeletion();
  for (const row of rows) {
    try {
      await permanentDeleteUser(row);
    } catch (error) {
      console.error('account_deletion_failed', { request_id: row.request_id, error });
    }
  }
}

export function registerAccountDeletionCron() {
  const run = () => {
    void runAccountDeletionSweep().catch((error) => {
      console.error('account_deletion_sweep_failed', error);
    });
  };
  // Her 6 saatte bir
  setInterval(run, 6 * 60 * 60 * 1000);
}
