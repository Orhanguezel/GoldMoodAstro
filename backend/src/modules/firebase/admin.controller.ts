import type { RouteHandler } from 'fastify';
import { sendPushNotification } from './service';
import { db } from '@/db/client';
import { sql } from 'drizzle-orm';

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
      const tokens = Array.isArray(rows[0]) ? rows[0] : rows;
      
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
