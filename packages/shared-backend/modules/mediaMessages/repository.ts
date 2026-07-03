import { randomUUID } from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';

import { db } from '../../db/client';
import { consultants } from '../consultants/schema';
import { consumeCredits } from '../credits/consume';
import { createUserNotification } from '../notifications/service';
import { dispatchPushToUser } from '../notifications/push';
import { notifyText } from '../_shared/notify-i18n';

export type MediaKind = 'audio' | 'video';

function rowsOf<T>(result: unknown): T[] {
  return Array.isArray((result as any)?.[0]) ? ((result as any)[0] as T[]) : (result as T[]);
}

function affectedRows(result: unknown): number {
  return Number((result as any)?.[0]?.affectedRows ?? (result as any)?.affectedRows ?? 0);
}

export async function getConsultantForUser(userId: string) {
  const [row] = await db
    .select({ id: consultants.id, user_id: consultants.user_id })
    .from(consultants)
    .where(and(eq(consultants.user_id, userId), eq(consultants.approval_status, 'approved')))
    .limit(1);
  return row ?? null;
}

export async function getPublicMediaSettings(consultantId: string) {
  const result = await db.execute(sql`
    SELECT
      c.id AS consultant_id,
      COALESCE(s.audio_enabled, 0) AS audio_enabled,
      COALESCE(s.audio_price, 0) AS audio_price,
      COALESCE(s.video_enabled, 0) AS video_enabled,
      COALESCE(s.video_price, 0) AS video_price,
      COALESCE(s.reply_sla_hours, 72) AS reply_sla_hours
    FROM consultants c
    LEFT JOIN consultant_media_settings s ON s.consultant_id = c.id
    WHERE c.id = ${consultantId} OR c.slug = ${consultantId}
    LIMIT 1
  `);
  const row = rowsOf<any>(result)[0];
  if (!row) return null;
  return {
    consultant_id: row.consultant_id,
    audio_enabled: Boolean(row.audio_enabled),
    audio_price: Number(row.audio_price ?? 0),
    video_enabled: Boolean(row.video_enabled),
    video_price: Number(row.video_price ?? 0),
    reply_sla_hours: Number(row.reply_sla_hours ?? 72),
    currency: 'TRY',
  };
}

export async function upsertMediaSettings(consultantId: string, input: {
  audio_enabled: boolean;
  audio_price: number;
  video_enabled: boolean;
  video_price: number;
  reply_sla_hours: number;
}) {
  await db.execute(sql`
    INSERT INTO consultant_media_settings (
      consultant_id, audio_enabled, audio_price, video_enabled, video_price, reply_sla_hours, updated_at
    ) VALUES (
      ${consultantId}, ${input.audio_enabled ? 1 : 0}, ${input.audio_price.toFixed(2)},
      ${input.video_enabled ? 1 : 0}, ${input.video_price.toFixed(2)}, ${input.reply_sla_hours}, NOW(3)
    )
    ON DUPLICATE KEY UPDATE
      audio_enabled = VALUES(audio_enabled),
      audio_price = VALUES(audio_price),
      video_enabled = VALUES(video_enabled),
      video_price = VALUES(video_price),
      reply_sla_hours = VALUES(reply_sla_hours),
      updated_at = NOW(3)
  `);
  return getPublicMediaSettings(consultantId);
}

function normalizeMediaMessage(row: any) {
  return {
    ...row,
    price: Number(row.price ?? 0),
    duration_seconds: row.duration_seconds == null ? null : Number(row.duration_seconds),
    reply_sla_hours: row.reply_sla_hours == null ? null : Number(row.reply_sla_hours),
  };
}

async function getCommissionPercent(): Promise<number> {
  try {
    const result = await db.execute(sql`
      SELECT value FROM site_settings WHERE \`key\` = 'platform_commission_rate' ORDER BY locale = '*' DESC LIMIT 1
    `);
    const value = rowsOf<any>(result)[0]?.value;
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    const raw = typeof parsed === 'object' && parsed ? parsed.new_percent ?? parsed.percent : parsed;
    const n = Number(raw);
    return Number.isFinite(n) ? Math.min(Math.max(n, 0), 100) : 30;
  } catch {
    return 30;
  }
}

async function createWalletEarning(consultantId: string, consultantUserId: string, mediaMessageId: string, gross: number) {
  const existing = await db.execute(sql`
    SELECT id FROM wallet_transactions WHERE transaction_ref = ${`media_message:${mediaMessageId}`} LIMIT 1
  `);
  if (rowsOf(existing).length > 0) return;

  const commissionPercent = await getCommissionPercent();
  const commissionAmount = gross * (commissionPercent / 100);
  const net = Math.max(gross - commissionAmount, 0);
  const walletRows = await db.execute(sql`
    SELECT id, consultant_id FROM wallets
    WHERE consultant_id = ${consultantId} OR user_id = ${consultantUserId}
    ORDER BY CASE WHEN consultant_id = ${consultantId} THEN 0 ELSE 1 END, created_at ASC
    LIMIT 1
  `);
  let wallet = rowsOf<any>(walletRows)[0];
  if (!wallet) {
    const walletId = randomUUID();
    await db.execute(sql`
      INSERT INTO wallets (id, user_id, consultant_id, balance, pending_balance, total_earnings, total_withdrawn, currency, status)
      VALUES (${walletId}, ${consultantUserId}, ${consultantId}, 0.00, 0.00, 0.00, 0.00, 'TRY', 'active')
    `);
    wallet = { id: walletId };
  } else if (!wallet.consultant_id) {
    await db.execute(sql`UPDATE wallets SET consultant_id = ${consultantId}, updated_at = NOW(3) WHERE id = ${wallet.id}`);
  }

  const description = JSON.stringify({
    gross: Number(gross.toFixed(2)),
    commission_percent: commissionPercent,
    commission_amount: Number(commissionAmount.toFixed(2)),
    net: Number(net.toFixed(2)),
  });
  const insertResult = await db.execute(sql`
    INSERT IGNORE INTO wallet_transactions (
      id, wallet_id, user_id, booking_id, type, amount, currency, purpose,
      description, payment_method, payment_status, transaction_ref, is_admin_created
    )
    VALUES (
      ${randomUUID()}, ${wallet.id}, ${consultantUserId}, NULL,
      'credit', ${net.toFixed(2)}, 'TRY', 'media_message_earning',
      ${description}, 'admin_manual', 'pending', ${`media_message:${mediaMessageId}`}, 0
    )
  `);
  if (affectedRows(insertResult) < 1) return;
  await db.execute(sql`
    UPDATE wallets
    SET pending_balance = pending_balance + ${net.toFixed(2)},
        total_earnings = total_earnings + ${net.toFixed(2)},
        updated_at = NOW(3)
    WHERE id = ${wallet.id}
  `);
}

export async function createQuestion(userId: string, input: {
  consultant_id: string;
  kind: MediaKind;
  storage_path: string;
  duration_seconds?: number;
  note?: string | null;
}) {
  const settings = await getPublicMediaSettings(input.consultant_id);
  if (!settings) return { status: 'not_found' as const };

  const enabled = input.kind === 'audio' ? settings.audio_enabled : settings.video_enabled;
  const price = input.kind === 'audio' ? settings.audio_price : settings.video_price;
  if (!enabled) return { status: 'disabled' as const };

  const id = randomUUID();
  const credits = Math.ceil(price);
  const consume = await consumeCredits({
    userId,
    amount: credits,
    referenceType: 'media_message',
    referenceId: id,
    description: `Media message ${input.kind}`,
  });
  if (consume.status === 'insufficient') return { status: 'insufficient' as const, consume };

  await db.execute(sql`
    INSERT INTO media_messages (
      id, user_id, consultant_id, kind, direction, storage_bucket, storage_path,
      duration_seconds, note, price, currency, charge_ref, status, reply_due_at, created_at, updated_at
    ) VALUES (
      ${id}, ${userId}, ${settings.consultant_id}, ${input.kind}, 'question', 'media_messages', ${input.storage_path},
      ${input.duration_seconds ?? null}, ${input.note ?? null}, ${price.toFixed(2)}, 'TRY',
      ${`media_message:${id}`}, 'sent', DATE_ADD(NOW(3), INTERVAL ${settings.reply_sla_hours} HOUR), NOW(3), NOW(3)
    )
  `);

  const cRows = await db.execute(sql`
    SELECT u.id AS consultant_user_id, u.full_name
    FROM consultants c INNER JOIN users u ON u.id = c.user_id
    WHERE c.id = ${settings.consultant_id}
    LIMIT 1
  `);
  const consultant = rowsOf<any>(cRows)[0];
  if (consultant?.consultant_user_id) {
    const text = notifyText('tr', 'media_message_received');
    await createUserNotification({
      userId: consultant.consultant_user_id,
      type: 'media_message_received',
      title: text.title,
      message: text.message,
    });
    await dispatchPushToUser({
      userId: consultant.consultant_user_id,
      title: text.title,
      body: text.message,
      data: { type: 'media_message_received', media_message_id: id },
    });
  }

  return { status: 'created' as const, data: await getMediaMessageForUser(id, userId) };
}

export async function listCustomerMessages(userId: string) {
  const result = await db.execute(sql`
    SELECT mm.*, cu.full_name AS consultant_name, cu.avatar_url AS consultant_avatar_url,
      reply.id AS reply_id, reply.kind AS reply_kind, reply.storage_path AS reply_storage_path,
      reply.duration_seconds AS reply_duration_seconds, reply.note AS reply_note, reply.created_at AS reply_created_at
    FROM media_messages mm
    INNER JOIN consultants c ON c.id = mm.consultant_id
    INNER JOIN users cu ON cu.id = c.user_id
    LEFT JOIN media_messages reply ON reply.parent_id = mm.id AND reply.direction = 'reply'
    WHERE mm.user_id = ${userId} AND mm.direction = 'question'
    ORDER BY mm.created_at DESC
  `);
  return rowsOf<any>(result).map(normalizeMediaMessage);
}

export async function listConsultantMessages(consultantId: string) {
  const result = await db.execute(sql`
    SELECT mm.*, u.full_name AS customer_name, u.avatar_url AS customer_avatar_url,
      reply.id AS reply_id, reply.kind AS reply_kind, reply.storage_path AS reply_storage_path,
      reply.duration_seconds AS reply_duration_seconds, reply.note AS reply_note, reply.created_at AS reply_created_at
    FROM media_messages mm
    INNER JOIN users u ON u.id = mm.user_id
    LEFT JOIN media_messages reply ON reply.parent_id = mm.id AND reply.direction = 'reply'
    WHERE mm.consultant_id = ${consultantId} AND mm.direction = 'question'
    ORDER BY CASE WHEN mm.status = 'sent' THEN 0 ELSE 1 END, mm.reply_due_at ASC, mm.created_at DESC
  `);
  return rowsOf<any>(result).map(normalizeMediaMessage);
}

export async function listAdminMediaMessages(status?: string | null) {
  const result = await db.execute(sql`
    SELECT mm.*, customer.full_name AS customer_name, consultant_user.full_name AS consultant_name,
      reply.id AS reply_id, reply.kind AS reply_kind, reply.created_at AS reply_created_at
    FROM media_messages mm
    INNER JOIN users customer ON customer.id = mm.user_id
    INNER JOIN consultants c ON c.id = mm.consultant_id
    INNER JOIN users consultant_user ON consultant_user.id = c.user_id
    LEFT JOIN media_messages reply ON reply.parent_id = mm.id AND reply.direction = 'reply'
    WHERE mm.direction = 'question'
      AND (${status ?? null} IS NULL OR mm.status = ${status ?? null})
    ORDER BY mm.created_at DESC
    LIMIT 500
  `);
  return rowsOf<any>(result).map(normalizeMediaMessage);
}

export async function getAdminMediaMessageStats() {
  const result = await db.execute(sql`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'answered' THEN 1 ELSE 0 END) AS answered,
      SUM(CASE WHEN status IN ('expired','refunded') THEN 1 ELSE 0 END) AS refunded,
      SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) AS waiting
    FROM media_messages
    WHERE direction = 'question'
  `);
  const row = rowsOf<any>(result)[0] ?? {};
  const total = Number(row.total ?? 0);
  const answered = Number(row.answered ?? 0);
  return {
    total,
    answered,
    refunded: Number(row.refunded ?? 0),
    waiting: Number(row.waiting ?? 0),
    response_rate: total > 0 ? Math.round((answered / total) * 100) : 0,
  };
}

export async function getMediaMessageForUser(id: string, userId: string) {
  const result = await db.execute(sql`
    SELECT mm.*, c.user_id AS consultant_user_id
    FROM media_messages mm
    INNER JOIN consultants c ON c.id = mm.consultant_id
    WHERE mm.id = ${id}
    LIMIT 1
  `);
  const row = rowsOf<any>(result)[0];
  if (!row) return null;
  if (row.user_id !== userId && row.consultant_user_id !== userId) return null;
  return normalizeMediaMessage(row);
}

export async function getMediaMessageById(id: string) {
  const result = await db.execute(sql`
    SELECT mm.*, c.user_id AS consultant_user_id
    FROM media_messages mm
    INNER JOIN consultants c ON c.id = mm.consultant_id
    WHERE mm.id = ${id}
    LIMIT 1
  `);
  const row = rowsOf<any>(result)[0];
  return row ? normalizeMediaMessage(row) : null;
}

export async function createReply(consultantId: string, consultantUserId: string, id: string, input: {
  kind: MediaKind;
  storage_path: string;
  duration_seconds?: number;
  note?: string | null;
}) {
  const parentRows = await db.execute(sql`
    SELECT * FROM media_messages
    WHERE id = ${id} AND consultant_id = ${consultantId} AND direction = 'question'
    LIMIT 1
  `);
  const parent = rowsOf<any>(parentRows)[0];
  if (!parent) return { status: 'not_found' as const };
  if (parent.status !== 'sent') return { status: 'not_answerable' as const };

  const replyId = randomUUID();
  await db.execute(sql`
    INSERT INTO media_messages (
      id, user_id, consultant_id, parent_id, kind, direction, storage_bucket, storage_path,
      duration_seconds, note, price, currency, status, created_at, updated_at
    ) VALUES (
      ${replyId}, ${parent.user_id}, ${consultantId}, ${parent.id}, ${input.kind}, 'reply',
      'media_messages', ${input.storage_path}, ${input.duration_seconds ?? null}, ${input.note ?? null},
      0.00, 'TRY', 'answered', NOW(3), NOW(3)
    )
  `);
  await db.execute(sql`
    UPDATE media_messages
    SET status = 'answered', answered_at = NOW(3), updated_at = NOW(3)
    WHERE id = ${parent.id}
  `);
  await createWalletEarning(consultantId, consultantUserId, parent.id, Number(parent.price ?? 0));

  const text = notifyText('tr', 'media_message_replied');
  await createUserNotification({
    userId: parent.user_id,
    type: 'media_message_replied',
    title: text.title,
    message: text.message,
  });
  await dispatchPushToUser({
    userId: parent.user_id,
    title: text.title,
    body: text.message,
    data: { type: 'media_message_replied', media_message_id: parent.id },
  });

  return { status: 'created' as const, data: await getMediaMessageForUser(replyId, consultantUserId) };
}
