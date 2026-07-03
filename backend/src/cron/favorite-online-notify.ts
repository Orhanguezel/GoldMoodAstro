import { sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { createUserNotification } from '@goldmood/shared-backend/modules/notifications/service';
import { dispatchPushToUser } from '@goldmood/shared-backend/modules/notifications/push';
import { notifyText } from '@goldmood/shared-backend/modules/_shared/notify-i18n';

type OnlineConsultantRow = {
  consultant_id: string;
  full_name: string | null;
};

type FavoriteUserRow = {
  user_id: string;
};

function rowsOf<T>(result: unknown): T[] {
  return Array.isArray((result as any)?.[0]) ? ((result as any)[0] as T[]) : (result as T[]);
}

async function listNewlyOnlineConsultants(): Promise<OnlineConsultantRow[]> {
  const result = await db.execute(sql`
    SELECT
      cp.consultant_id,
      u.full_name
    FROM consultant_presence cp
    INNER JOIN consultants c ON c.id = cp.consultant_id
    INNER JOIN users u ON u.id = c.user_id
    WHERE cp.last_heartbeat_at > (NOW(3) - INTERVAL 2 MINUTE)
      AND cp.became_online_at >= (NOW(3) - INTERVAL 2 MINUTE)
      AND c.approval_status = 'approved'
    ORDER BY cp.became_online_at DESC
    LIMIT 100
  `);
  return rowsOf<OnlineConsultantRow>(result);
}

async function listFavoriteUsersToNotify(consultantId: string): Promise<FavoriteUserRow[]> {
  const result = await db.execute(sql`
    SELECT uf.user_id
    FROM user_favorites uf
    WHERE uf.consultant_id = ${consultantId}
      AND (uf.online_notified_at IS NULL OR uf.online_notified_at <= (NOW(3) - INTERVAL 6 HOUR))
    ORDER BY uf.created_at ASC
    LIMIT 500
  `);
  return rowsOf<FavoriteUserRow>(result);
}

async function markFavoriteUserNotified(userId: string, consultantId: string) {
  await db.execute(sql`
    UPDATE user_favorites
    SET online_notified_at = NOW(3)
    WHERE user_id = ${userId} AND consultant_id = ${consultantId}
  `);
}

export async function runFavoriteOnlineNotifySweep() {
  const consultants = await listNewlyOnlineConsultants();

  for (const consultant of consultants) {
    const consultantName = consultant.full_name || 'GoldMoodAstro';
    const favorites = await listFavoriteUsersToNotify(consultant.consultant_id);

    for (const favorite of favorites) {
      const text = notifyText('tr', 'favorite_online', { name: consultantName });
      try {
        await createUserNotification({
          userId: favorite.user_id,
          type: 'favorite_online',
          title: text.title,
          message: text.message,
        });
        await dispatchPushToUser({
          userId: favorite.user_id,
          title: text.title,
          body: text.message,
          data: {
            type: 'favorite_online',
            consultant_id: consultant.consultant_id,
          },
        });
        await markFavoriteUserNotified(favorite.user_id, consultant.consultant_id);
      } catch (error) {
        console.error('[cron] favorite-online notify failed:', {
          consultantId: consultant.consultant_id,
          userId: favorite.user_id,
          error,
        });
      }
    }
  }
}

export function registerFavoriteOnlineNotifyCron() {
  const run = () => {
    void runFavoriteOnlineNotifySweep().catch((error) => {
      console.error('[cron] favorite-online sweep failed:', error);
    });
  };

  setInterval(run, 60 * 1000);
  console.log('[cron] favorite-online-notify registered (every 60s)');
}
