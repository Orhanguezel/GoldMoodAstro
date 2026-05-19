import { sql } from 'drizzle-orm';
import { db } from '@/db/client';

const DAY_MS = 24 * 60 * 60 * 1000;

export function registerConsultantAnalyticsCron() {
  setInterval(() => {
    runConsultantAnalyticsMaintenance().catch((error) => {
      console.error('[cron] consultant analytics maintenance failed:', error);
    });
  }, DAY_MS);
}

export async function runConsultantAnalyticsMaintenance() {
  await db.execute(sql`
    UPDATE consultant_profile_views
    SET viewer_user_id = NULL,
        viewer_ip_hash = NULL
    WHERE viewed_at < DATE_SUB(NOW(3), INTERVAL 90 DAY)
      AND (viewer_user_id IS NOT NULL OR viewer_ip_hash IS NOT NULL)
  `);

  await db.execute(sql`
    UPDATE service_boosts
    SET status = 'expired',
        updated_at = NOW(3)
    WHERE status = 'active'
      AND ends_at <= NOW(3)
  `);
}
