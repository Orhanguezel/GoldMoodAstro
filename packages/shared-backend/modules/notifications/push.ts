// =============================================================
// FILE: shared-backend/modules/notifications/push.ts
// FCM push dispatcher registry — backend startup registers concrete sender,
// shared-backend modules call dispatch() without firebase-admin dependency.
// =============================================================

import { db } from '../../db/client';
import { sql } from 'drizzle-orm';

export type PushSenderFn = (params: {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}) => Promise<void>;

let sender: PushSenderFn | null = null;

export function registerPushSender(fn: PushSenderFn) {
  sender = fn;
}

/**
 * Best-effort push dispatch — fetches FCM token by userId, sends if available.
 * Never throws; logs failures via console (caller doesn't await it).
 */
export async function dispatchPushToUser(params: {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<void> {
  if (!sender) return;
  try {
    const rows = await db.execute(
      sql`SELECT fcm_token FROM users WHERE id = ${params.userId} LIMIT 1`,
    );
    const arr = Array.isArray((rows as any)?.[0]) ? (rows as any)[0] : (rows as any);
    const token = (arr as any[])?.[0]?.fcm_token;
    if (!token) return;
    await sender({
      token,
      title: params.title,
      body: params.body,
      data: params.data,
    });
  } catch (err) {
    console.warn('[push] dispatch failed:', (err as Error)?.message);
  }
}
