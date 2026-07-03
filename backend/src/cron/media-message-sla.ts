import { sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { refundCredits } from '@goldmood/shared-backend/modules/credits/consume';
import { createUserNotification } from '@goldmood/shared-backend/modules/notifications/service';
import { dispatchPushToUser } from '@goldmood/shared-backend/modules/notifications/push';

type ExpiredMediaMessageRow = {
  id: string;
  user_id: string;
  price: string | number;
};

function rowsOf<T>(result: unknown): T[] {
  return Array.isArray((result as any)?.[0]) ? ((result as any)[0] as T[]) : (result as T[]);
}

async function listExpiredMediaMessages(): Promise<ExpiredMediaMessageRow[]> {
  const result = await db.execute(sql`
    SELECT id, user_id, price
    FROM media_messages
    WHERE direction = 'question'
      AND status = 'sent'
      AND reply_due_at IS NOT NULL
      AND reply_due_at < NOW(3)
    ORDER BY reply_due_at ASC
    LIMIT 200
  `);
  return rowsOf<ExpiredMediaMessageRow>(result);
}

async function refundExpiredMediaMessage(row: ExpiredMediaMessageRow) {
  const amount = Math.ceil(Number(row.price ?? 0));
  await refundCredits({
    userId: row.user_id,
    amount,
    referenceType: 'media_message',
    referenceId: row.id,
    description: 'Media message SLA expired',
  });

  await db.execute(sql`
    UPDATE media_messages
    SET status = 'expired', updated_at = NOW(3)
    WHERE id = ${row.id} AND status = 'sent'
  `);

  await createUserNotification({
    userId: row.user_id,
    type: 'media_message_refunded',
    title: 'Medya sorunuz iade edildi',
    message: 'Danışman süresi içinde yanıt vermediği için krediniz iade edildi.',
  });
  await dispatchPushToUser({
    userId: row.user_id,
    title: 'Medya sorunuz iade edildi',
    body: 'Danışman süresi içinde yanıt vermediği için krediniz iade edildi.',
    data: { type: 'media_message_refunded', media_message_id: row.id },
  });
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
  console.log('[cron] media-message-sla registered (hourly)');
}

