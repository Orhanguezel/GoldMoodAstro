// Account deletion sweep. A failed transaction leaves the request pending for
// the next run; deleting the user cascades the request after a successful run.
import { sql } from 'drizzle-orm';
import { db, pool } from '@/db/client';
import { runAccountStoragePurgeSweep } from './account-storage-purge';

type PendingRow = { request_id: string; user_id: string };
type QueryRows = Record<string, unknown>[];

export function resolveStoredObjectId(asset: Record<string, unknown>): string {
  const explicit = String(asset.provider_public_id || '').trim();
  if (explicit) return explicit;
  const storedPath = String(asset.path || '').trim();
  if (asset.provider === 'local') return storedPath;
  if (asset.provider === 'cloudinary') return storedPath.replace(/\.[^/.]+$/, '');
  return storedPath;
}

export interface DeletionConnection {
  beginTransaction(): Promise<void>;
  execute(query: string, values?: string[]): Promise<[unknown, unknown]>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

function rows(result: [unknown, unknown]): QueryRows {
  return Array.isArray(result[0]) ? result[0] as QueryRows : [];
}

async function execute(conn: DeletionConnection, query: string, ...values: string[]) {
  return conn.execute(query, values);
}

/** Returns false when a concurrent cancellation or sweep already handled it. */
export async function deleteDueAccount(conn: DeletionConnection, row: PendingRow): Promise<boolean> {
  await conn.beginTransaction();
  try {
    // Lock and recheck the request. A cancellation that wins the lock must not
    // be followed by a sweep based on a stale pending row.
    const due = rows(await execute(conn,
      "SELECT user_id FROM account_deletion_requests WHERE id = ? AND user_id = ? AND status = 'pending' AND scheduled_for <= NOW(3) FOR UPDATE",
      row.request_id, row.user_id));
    if (due.length === 0) {
      await conn.rollback();
      return false;
    }

    // Safety tables are seeded separately; older installations may not have
    // them yet. Explicit cleanup also covers installations without FKs.
    const safetyTables = rows(await execute(conn,
      "SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('chat_reports', 'chat_blocks')"));
    const hasSafetyTable = (name: string) => safetyTables.some((table) => table.name === name);
    if (hasSafetyTable('chat_reports')) {
      await execute(conn, 'DELETE FROM chat_reports WHERE reporter_user_id = ? OR reported_user_id = ?', row.user_id, row.user_id);
    }
    if (hasSafetyTable('chat_blocks')) {
      await execute(conn, 'DELETE FROM chat_blocks WHERE blocker_user_id = ? OR blocked_user_id = ?', row.user_id, row.user_id);
    }

    // These tables have no user FK, or use SET NULL. Remove personal records
    // before users CASCADE so neither authored content nor orphan IDs remain.
    const threadRows = rows(await execute(conn,
      `SELECT DISTINCT t.id FROM chat_threads t
       LEFT JOIN chat_participants p ON p.thread_id = t.id
       WHERE t.created_by_user_id = ? OR p.user_id = ?
          OR (t.context_type = 'consultant_lead' AND t.context_id IN (SELECT id FROM consultants WHERE user_id = ?))
          OR (t.context_type = 'booking' AND t.context_id IN
              (SELECT id FROM bookings WHERE user_id = ? OR consultant_id IN (SELECT id FROM consultants WHERE user_id = ?)))`,
      row.user_id, row.user_id, row.user_id, row.user_id, row.user_id));
    for (const thread of threadRows) {
      const threadId = String(thread.id);
      if (hasSafetyTable('chat_reports')) {
        await execute(conn, 'DELETE FROM chat_reports WHERE thread_id = ?', threadId);
      }
      await execute(conn, 'DELETE m FROM chat_ai_message_meta m JOIN chat_messages cm ON cm.id = m.message_id WHERE cm.thread_id = ?', threadId);
      await execute(conn, 'DELETE FROM chat_support_sessions WHERE thread_id = ?', threadId);
      await execute(conn, 'DELETE FROM chat_messages WHERE thread_id = ?', threadId);
      await execute(conn, 'DELETE FROM chat_participants WHERE thread_id = ?', threadId);
      await execute(conn, 'DELETE FROM chat_threads WHERE id = ?', threadId);
    }
    await execute(conn, 'DELETE m FROM chat_ai_message_meta m JOIN chat_messages cm ON cm.id = m.message_id WHERE cm.sender_user_id = ?', row.user_id);
    await execute(conn, 'DELETE FROM chat_messages WHERE sender_user_id = ?', row.user_id);
    await execute(conn, 'DELETE FROM chat_participants WHERE user_id = ?', row.user_id);
    await execute(conn, 'UPDATE chat_support_sessions SET assigned_admin_user_id = NULL WHERE assigned_admin_user_id = ?', row.user_id);

    await execute(conn, 'DELETE FROM user_favorites WHERE user_id = ? OR consultant_id IN (SELECT id FROM consultants WHERE user_id = ?)', row.user_id, row.user_id);
    await execute(conn, 'DELETE FROM consultant_time_blocks WHERE consultant_id IN (SELECT id FROM consultants WHERE user_id = ?)', row.user_id);
    await execute(conn, 'DELETE FROM consultant_presence WHERE consultant_id IN (SELECT id FROM consultants WHERE user_id = ?)', row.user_id);
    await execute(conn, 'DELETE FROM custom_pages WHERE author_consultant_id IN (SELECT id FROM consultants WHERE user_id = ?)', row.user_id);
    await execute(conn, 'DELETE FROM consultant_applications WHERE user_id = ?', row.user_id);
    await execute(conn, 'DELETE FROM reviews WHERE user_id = ?', row.user_id);
    await execute(conn, 'DELETE FROM ticket_replies WHERE user_id = ?', row.user_id);
    await execute(conn, 'DELETE FROM tarot_readings WHERE user_id = ?', row.user_id);
    await execute(conn, 'DELETE FROM coffee_readings WHERE user_id = ?', row.user_id);
    await execute(conn, 'DELETE FROM dream_interpretations WHERE user_id = ?', row.user_id);
    await execute(conn, 'DELETE FROM numerology_readings WHERE user_id = ?', row.user_id);
    await execute(conn, 'DELETE FROM yildizname_readings WHERE user_id = ?', row.user_id);
    // Enqueue provider objects in the same transaction as deleting their DB
    // records. The outbox has no user FK, so the user cascade cannot erase it.
    const assets = rows(await execute(conn,
      'SELECT id, provider, provider_public_id, provider_resource_type, path FROM storage_assets WHERE user_id = ? FOR UPDATE',
      row.user_id));
    for (const asset of assets) {
      // Missing legacy identifiers remain in the retry queue with their
      // resolved path (or empty ID), so deletion does not strand the account.
      await execute(conn,
        `INSERT INTO account_storage_purge (asset_id, provider, provider_public_id, resource_type)
         VALUES (?, ?, ?, ?)`,
        String(asset.id), String(asset.provider || 'unresolved'), resolveStoredObjectId(asset),
        String(asset.provider_resource_type || 'image'));
    }
    await execute(conn, 'DELETE FROM storage_assets WHERE user_id = ?', row.user_id);
    await execute(conn, 'UPDATE astrology_kb SET reviewed_by = NULL WHERE reviewed_by = ?', row.user_id);
    await execute(conn, 'UPDATE contact_replies SET admin_user_id = NULL WHERE admin_user_id = ?', row.user_id);
    // Issued invoice snapshots need a separate, documented retention policy.
    await execute(conn, 'UPDATE invoices SET user_id = NULL WHERE user_id = ?', row.user_id);

    await execute(conn, 'DELETE FROM users WHERE id = ?', row.user_id);
    await conn.commit();
    return true;
  } catch (error) {
    await conn.rollback();
    throw error;
  }
}

async function listScheduledForDeletion(): Promise<PendingRow[]> {
  const result = await db.execute(sql`
    SELECT id AS request_id, user_id FROM account_deletion_requests
    WHERE status = 'pending' AND scheduled_for <= NOW(3)
    ORDER BY scheduled_for LIMIT 50
  `);
  const arr = Array.isArray((result as unknown as unknown[])?.[0]) ? (result as unknown as unknown[][])[0] : result;
  return Array.isArray(arr) ? arr as PendingRow[] : [];
}

export async function runAccountDeletionSweep() {
  for (const row of await listScheduledForDeletion()) {
    const conn = await pool.getConnection();
    try {
      if (await deleteDueAccount(conn, row)) {
        console.log('account_deletion_completed', { request_id: row.request_id, at: new Date().toISOString() });
      }
    } catch (error) {
      console.error('account_deletion_failed', { request_id: row.request_id, error });
    } finally {
      conn.release();
    }
  }
}

export function registerAccountDeletionCron() {
  const run = () => { void runAccountDeletionSweep().catch((error) => console.error('account_deletion_sweep_failed', error)); };
  setInterval(run, 6 * 60 * 60 * 1000);
  run();
  const purge = () => { void runAccountStoragePurgeSweep().catch((error) => console.error('account_storage_purge_sweep_failed', error)); };
  setInterval(purge, 5 * 60 * 1000);
  purge();
}
