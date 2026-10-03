import { randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { createUserNotification } from '@goldmood/shared-backend/modules/notifications/service';
import { dispatchPushToUser } from '@goldmood/shared-backend/modules/notifications/push';
import { notifyText } from '@goldmood/shared-backend/modules/_shared/notify-i18n';

type ExpiredMediaMessageRow = {
  id: string;
};

function rowsOf<T>(result: unknown): T[] {
  return Array.isArray((result as any)?.[0]) ? ((result as any)[0] as T[]) : (result as T[]);
}

async function listExpiredMediaMessages(): Promise<ExpiredMediaMessageRow[]> {
  const result = await db.execute(sql`
    SELECT mm.id
    FROM media_messages mm
    WHERE mm.direction = 'question'
      AND mm.status = 'sent'
      AND mm.reply_due_at IS NOT NULL
      AND mm.reply_due_at < NOW(3)
    ORDER BY mm.reply_due_at ASC
    LIMIT 200
  `);
  return rowsOf<ExpiredMediaMessageRow>(result);
}

async function refundExpiredMediaMessage(row: ExpiredMediaMessageRow) {
  const userId = await db.transaction(async (tx) => {
    const [question] = rowsOf<{ user_id: string }>(await tx.execute(sql`
      SELECT user_id FROM media_messages
      WHERE id = ${row.id} AND direction = 'question' AND status = 'sent'
        AND reply_due_at < NOW(3)
      FOR UPDATE
    `));
    if (!question) return null;
    const [debit] = rowsOf<{ amount: number }>(await tx.execute(sql`
      SELECT amount FROM credit_transactions
      WHERE reference_type = 'media_message' AND reference_id = ${row.id} AND type = 'consumption'
      LIMIT 1
    `));
    // Refund the exact debit, including older questions charged under the
    // former conversion. Missing transaction history needs manual review.
    const amount = -Number(debit?.amount ?? 0);
    if (!Number.isInteger(amount) || amount <= 0) throw new Error('media_message_charge_missing');
    const [existingRefund] = rowsOf<{ id: string }>(await tx.execute(sql`
      SELECT id FROM credit_transactions
      WHERE reference_type = 'media_message' AND reference_id = ${row.id} AND type = 'refund'
      LIMIT 1
    `));
    if (!existingRefund) {
      const updated = await tx.execute(sql`
        UPDATE user_credits SET balance = balance + ${amount}, updated_at = NOW(3)
        WHERE user_id = ${question.user_id}
      `);
      const affected = Number((updated as any)?.[0]?.affectedRows ?? (updated as any)?.affectedRows ?? 0);
      if (affected !== 1) throw new Error('media_message_credit_wallet_missing');
      const [wallet] = rowsOf<{ balance: number }>(await tx.execute(sql`
        SELECT balance FROM user_credits WHERE user_id = ${question.user_id} LIMIT 1
      `));
      await tx.execute(sql`
        INSERT INTO credit_transactions
          (id, user_id, type, amount, balance_after, reference_type, reference_id, description, created_at)
        VALUES (${randomUUID()}, ${question.user_id}, 'refund', ${amount}, ${Number(wallet.balance)},
          'media_message', ${row.id}, 'Media message SLA expired', NOW(3))
      `);
    }
    await tx.execute(sql`
      UPDATE media_messages SET status = 'expired', updated_at = NOW(3)
      WHERE id = ${row.id} AND status = 'sent'
    `);
    return question.user_id;
  });
  if (!userId) return;

  try {
    const text = notifyText('tr', 'media_message_refunded');
    await createUserNotification({
      userId,
      type: 'media_message_refunded',
      title: text.title,
      message: text.message,
    });
    await dispatchPushToUser({
      userId,
      title: text.title,
      body: text.message,
      data: { type: 'media_message_refunded', media_message_id: row.id },
    });
  } catch (error) {
    console.error('[cron] media-message SLA refund notification failed:', { mediaMessageId: row.id, error });
  }
}

export async function runMediaMessageSlaSweep() {
  const rows = await listExpiredMediaMessages();
  for (const row of rows) {
    try {
      await refundExpiredMediaMessage(row);
    } catch (error) {
      console.error('[cron] media-message SLA refund failed:', { mediaMessageId: row.id, error });
    }
  }
}

export function registerMediaMessageSlaCron() {
  const run = () => {
    void runMediaMessageSlaSweep().catch((error) => {
      console.error('[cron] media-message SLA sweep failed:', error);
    });
  };

  setInterval(run, 60 * 60 * 1000);
  run();
  console.log('[cron] media-message-sla registered (hourly)');
}
