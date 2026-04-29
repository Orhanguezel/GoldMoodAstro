import type { RouteHandler } from 'fastify';
import { sendPushNotification } from './service';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

type PushCampaignRow = {
  id: string;
  slug: string;
  title: string;
  body: string;
  target_segment: 'all' | 'users' | 'consultants' | 'users_without_booking' | 'inactive_7d';
  deep_link: string | null;
  is_active: number;
};

function rowsOf<T>(result: unknown): T[] {
  if (Array.isArray(result) && Array.isArray(result[0])) return result[0] as T[];
  if (Array.isArray(result)) return result as T[];
  return [];
}

async function queryTargetUsers(segment: PushCampaignRow['target_segment']) {
  const base = sql`
    SELECT id, fcm_token
    FROM users
    WHERE fcm_token IS NOT NULL AND fcm_token <> ''
  `;

  if (segment === 'users') {
    return rowsOf<{ id: string; fcm_token: string }>(
      await db.execute(sql`${base} AND role = 'user'`),
    );
  }

  if (segment === 'consultants') {
    return rowsOf<{ id: string; fcm_token: string }>(
      await db.execute(sql`${base} AND role = 'consultant'`),
    );
  }

  if (segment === 'users_without_booking') {
    return rowsOf<{ id: string; fcm_token: string }>(
      await db.execute(sql`
        ${base}
        AND role = 'user'
        AND NOT EXISTS (
          SELECT 1 FROM bookings b WHERE b.user_id = users.id
        )
      `),
    );
  }

  if (segment === 'inactive_7d') {
    return rowsOf<{ id: string; fcm_token: string }>(
      await db.execute(sql`
        ${base}
        AND updated_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
      `),
    );
  }

  return rowsOf<{ id: string; fcm_token: string }>(await db.execute(base));
}

async function createInAppNotification(params: {
  userId: string;
  title: string;
  body: string;
  campaignSlug?: string;
}) {
  await db.execute(sql`
    INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
    VALUES (UUID(), ${params.userId}, ${params.title}, ${params.body}, ${params.campaignSlug ?? 'push_campaign'}, 0, NOW(3))
  `);
}

export const sendManualPushHandler: RouteHandler = async (req, reply) => {
  const { title, body, user_id, target_all } = req.body as {
    title: string;
    body: string;
    user_id?: string;
    target_all?: boolean;
  };

  if (!title || !body) {
    return reply.code(400).send({ error: { message: 'title_and_body_required' } });
  }

  try {
    if (target_all) {
      const rows = await db.execute(sql`SELECT fcm_token FROM users WHERE fcm_token IS NOT NULL`);
      const tokens = rowsOf<{ fcm_token: string }>(rows);
      
      let successCount = 0;
      for (const row of (tokens as any[])) {
        try {
          await sendPushNotification({ token: row.fcm_token, title, body });
          successCount++;
        } catch (e) {
          console.error('Failed to send to token', row.fcm_token, e);
        }
      }
      return { success: true, sent_count: successCount };
    } 
    
    if (user_id) {
      const [row] = await db.execute(sql`SELECT fcm_token FROM users WHERE id = ${user_id}`);
      const user = Array.isArray(row) ? row[0] : row;
      
      if (!user?.fcm_token) {
        return reply.code(404).send({ error: { message: 'user_has_no_token' } });
      }
      
      await sendPushNotification({ token: user.fcm_token, title, body });
      return { success: true };
    }

    return reply.code(400).send({ error: { message: 'target_missing' } });
  } catch (error) {
    return reply.code(500).send({
      error: { message: error instanceof Error ? error.message : 'push_failed' },
    });
  }
};

export const listPushCampaignsHandler: RouteHandler = async () => {
  const rows = await db.execute(sql`
    SELECT id, slug, title, body, target_segment, deep_link, is_active, created_at, updated_at
    FROM push_campaigns
    ORDER BY is_active DESC, slug ASC
  `);
  return { data: rowsOf(rows) };
};

export const sendPushCampaignHandler: RouteHandler = async (req, reply) => {
  const { slug } = req.params as { slug: string };

  try {
    const campaignRows = rowsOf<PushCampaignRow>(
      await db.execute(sql`
        SELECT id, slug, title, body, target_segment, deep_link, is_active
        FROM push_campaigns
        WHERE slug = ${slug}
        LIMIT 1
      `),
    );
    const campaign = campaignRows[0];

    if (!campaign) {
      return reply.code(404).send({ error: { message: 'push_campaign_not_found' } });
    }
    if (Number(campaign.is_active) !== 1) {
      return reply.code(400).send({ error: { message: 'push_campaign_inactive' } });
    }

    const targets = await queryTargetUsers(campaign.target_segment);
    let sentCount = 0;
    let failedCount = 0;

    for (const target of targets) {
      try {
        await sendPushNotification({
          token: target.fcm_token,
          title: campaign.title,
          body: campaign.body,
          data: {
            type: 'push_campaign',
            campaign_slug: campaign.slug,
            deep_link: campaign.deep_link ?? '',
          },
        });
        await createInAppNotification({
          userId: target.id,
          title: campaign.title,
          body: campaign.body,
          campaignSlug: campaign.slug,
        });
        sentCount++;
      } catch (error) {
        failedCount++;
        console.error('push_campaign_send_failed', { slug, userId: target.id, error });
      }
    }

    return {
      success: true,
      campaign_slug: campaign.slug,
      target_segment: campaign.target_segment,
      target_count: targets.length,
      sent_count: sentCount,
      failed_count: failedCount,
    };
  } catch (error) {
    return reply.code(500).send({
      error: { message: error instanceof Error ? error.message : 'push_campaign_failed' },
    });
  }
};
