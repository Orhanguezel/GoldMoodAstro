import { randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';

import { db } from '../../db/client';

export type FavoriteConsultantCard = {
  id: string;
  slug: string | null;
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  expertise: unknown;
  languages: unknown;
  session_price: string | number | null;
  session_duration: number | null;
  currency: string | null;
  rating_avg: string | number | null;
  rating_count: number | null;
  favorite_count: number;
  is_online: boolean;
  favorited_at: string | Date;
};

function rowsOf<T>(result: unknown): T[] {
  return Array.isArray((result as any)?.[0]) ? ((result as any)[0] as T[]) : (result as T[]);
}

export async function addFavorite(userId: string, consultantId: string) {
  const id = randomUUID();
  await db.execute(sql`
    INSERT IGNORE INTO user_favorites (id, user_id, consultant_id, created_at)
    VALUES (${id}, ${userId}, ${consultantId}, NOW(3))
  `);
  return { consultant_id: consultantId, is_favorited: true };
}

export async function removeFavorite(userId: string, consultantId: string) {
  await db.execute(sql`
    DELETE FROM user_favorites
    WHERE user_id = ${userId} AND consultant_id = ${consultantId}
  `);
  return { consultant_id: consultantId, is_favorited: false };
}

export async function listFavoriteIds(userId: string): Promise<string[]> {
  const result = await db.execute(sql`
    SELECT consultant_id
    FROM user_favorites
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `);
  return rowsOf<{ consultant_id: string }>(result).map((row) => row.consultant_id);
}

export async function listFavoriteConsultants(userId: string): Promise<FavoriteConsultantCard[]> {
  const result = await db.execute(sql`
    SELECT
      c.id,
      c.slug,
      u.full_name,
      u.avatar_url,
      COALESCE(NULLIF(ci.headline, ''), NULLIF(ci_tr.headline, ''), NULL) AS headline,
      c.expertise,
      c.languages,
      c.session_price,
      c.session_duration,
      c.currency,
      c.rating_avg,
      c.rating_count,
      (SELECT COUNT(*) FROM user_favorites uf_count WHERE uf_count.consultant_id = c.id) AS favorite_count,
      EXISTS(
        SELECT 1
        FROM consultant_presence cp
        WHERE cp.consultant_id = c.id
          AND cp.last_heartbeat_at > (NOW(3) - INTERVAL 2 MINUTE)
      ) AS is_online,
      uf.created_at AS favorited_at
    FROM user_favorites uf
    INNER JOIN consultants c ON c.id = uf.consultant_id
    INNER JOIN users u ON u.id = c.user_id
    LEFT JOIN consultant_i18n ci ON ci.consultant_id = c.id AND ci.locale = 'tr'
    LEFT JOIN consultant_i18n ci_tr ON ci_tr.consultant_id = c.id AND ci_tr.locale = 'tr'
    WHERE uf.user_id = ${userId}
      AND c.approval_status = 'approved'
    ORDER BY is_online DESC, uf.created_at DESC
  `);

  return rowsOf<any>(result).map((row) => ({
    ...row,
    favorite_count: Number(row.favorite_count || 0),
    is_online: Boolean(row.is_online),
  }));
}

export async function favoriteExistsForUser(userId: string | null, consultantId: string) {
  if (!userId) return false;
  const result = await db.execute(sql`
    SELECT 1 AS ok
    FROM user_favorites
    WHERE user_id = ${userId} AND consultant_id = ${consultantId}
    LIMIT 1
  `);
  return rowsOf<{ ok: number }>(result).length > 0;
}
