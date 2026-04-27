// FAZ 17 / T17-6 — Astrolog Karnesi Follow-up Cron
//
// Cron her 6 saatte bir çalışır:
// 1. follow_up_at <= NOW() AND user_response IS NULL AND push_sent_at IS NULL
//    olan review_outcomes kayıtlarını tara
// 2. Kullanıcıya push: "6 ay önce X astrologdan yorum aldın, gerçekleşti mi?"
// 3. push_sent_at = NOW
//
// review_outcomes kaydı oluşturma: review create handler tarafında yapılmalı
// (henüz hook eklenmedi — Codex/sonraki faz işi). Mevcut kayıtlar için manuel
// backfill scripti yazılabilir.

import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { sendPushNotification } from '@/modules/firebase/service';

const CRON_INTERVAL_HOURS = 6;

type FollowupRow = {
  outcome_id: string;
  review_id: string;
  user_id: string;
  consultant_id: string;
  user_fcm_token: string | null;
};

async function listPendingFollowups(): Promise<FollowupRow[]> {
  const rows = await db.execute(sql`
    SELECT
      ro.id AS outcome_id,
      ro.review_id,
      ro.user_id,
      ro.consultant_id,
      u.fcm_token AS user_fcm_token
    FROM review_outcomes ro
    INNER JOIN users u ON u.id = ro.user_id
    WHERE ro.user_response IS NULL
      AND ro.push_sent_at IS NULL
      AND ro.follow_up_at <= NOW(3)
    LIMIT 50
  `);

  const arr = Array.isArray((rows as unknown as unknown[])?.[0]) ? (rows as unknown as unknown[][])[0] : rows;
  return Array.isArray(arr) ? (arr as FollowupRow[]) : [];
}

async function markPushSent(outcomeId: string) {
  await db.execute(sql`
    UPDATE review_outcomes
    SET push_sent_at = NOW(3), updated_at = NOW(3)
    WHERE id = ${outcomeId}
  `);
}

async function sendFollowupPush(row: FollowupRow) {
  if (!row.user_fcm_token) {
    // Token yok ama yine de işaretliyoruz (tekrar denenmesin)
    await markPushSent(row.outcome_id);
    return;
  }

  await sendPushNotification({
    token: row.user_fcm_token,
    title: 'Astroloğa karne ver',
    body: '6 ay önceki yorumun gerçekleşti mi? Cevabın diğer kullanıcılara yardımcı olur.',
    data: {
      type: 'review_outcome_followup',
      outcome_id: row.outcome_id,
      review_id: row.review_id,
      consultant_id: row.consultant_id,
    },
  });

  await markPushSent(row.outcome_id);
}

export async function runReviewFollowupSweep() {
  const rows = await listPendingFollowups();
  for (const row of rows) {
    try {
      await sendFollowupPush(row);
    } catch (error) {
      console.error('review_followup_failed', { outcome_id: row.outcome_id, error });
    }
  }
}

export function registerReviewFollowupCron() {
  const run = () => {
    void runReviewFollowupSweep().catch((error) => {
      console.error('review_followup_sweep_failed', error);
    });
  };
  // Her 6 saatte bir
  setInterval(run, CRON_INTERVAL_HOURS * 60 * 60 * 1000);
}
