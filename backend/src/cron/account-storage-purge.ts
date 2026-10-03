import { randomUUID } from 'node:crypto';
import { realpath, unlink } from 'node:fs/promises';
import path from 'node:path';
import { v2 as cloudinary } from 'cloudinary';
import { pool } from '@/db/client';
import { env } from '@/core/env';
import { getCloudinaryConfig } from '@goldmood/shared-backend/modules/storage/cloudinary';
import { getStorageSettings } from '@goldmood/shared-backend/modules/siteSettings';

export type PurgeObject = {
  asset_id: string;
  provider: string;
  provider_public_id: string;
  resource_type: string;
  attempts: number;
};

/** Never use storage_assets.path: uploads can have a different provider ID. */
export async function purgeStorageObject(object: PurgeObject): Promise<void> {
  const publicId = object.provider_public_id;
  if (!publicId || publicId.includes('\0')) throw new Error('storage_purge_missing_public_id');
  const cfg = await getCloudinaryConfig();
  if (object.provider === 'local') {
    const root = path.resolve(cfg?.localRoot || env.LOCAL_STORAGE_ROOT || path.join(process.cwd(), 'uploads'));
    if (path.isAbsolute(publicId) || publicId.split(/[\\/]+/).some((part) => part === '..')) {
      throw new Error('storage_purge_invalid_local_path');
    }
    const resolved = path.resolve(root, publicId);
    if (!resolved.startsWith(`${root}${path.sep}`)) throw new Error('storage_purge_invalid_local_path');
    try {
      // Check the parent on disk as well, so a symlinked directory cannot
      // redirect a database path outside the configured storage root.
      const [realRoot, realParent] = await Promise.all([realpath(root), realpath(path.dirname(resolved))]);
      if (!realParent.startsWith(`${realRoot}${path.sep}`) && realParent !== realRoot) {
        throw new Error('storage_purge_invalid_local_path');
      }
      await unlink(resolved);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    return;
  }
  if (object.provider !== 'cloudinary') throw new Error('storage_purge_unknown_provider');
  // Historical objects retain their own provider even if today's default
  // storage driver has changed to local.
  const cloudSettings = await getStorageSettings();
  if (!cloudSettings.cloudName || !cloudSettings.apiKey || !cloudSettings.apiSecret) {
    throw new Error('storage_purge_cloudinary_not_configured');
  }
  // Configure this SDK instance explicitly; the shared package may resolve a
  // separate Cloudinary module instance in workspace installs.
  cloudinary.config({ cloud_name: cloudSettings.cloudName, api_key: cloudSettings.apiKey, api_secret: cloudSettings.apiSecret, secure: true });
  const resourceType = object.resource_type || 'image';
  if (!['image', 'video', 'raw'].includes(resourceType)) throw new Error('storage_purge_invalid_resource_type');
  const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, invalidate: true });
  if (result.result !== 'ok' && result.result !== 'not found') {
    throw new Error(`storage_purge_cloudinary_${String(result.result || 'unknown')}`);
  }
}

export interface PurgeRepository {
  claim(assetId: string, token: string): Promise<PurgeObject | null>;
  complete(assetId: string, token: string): Promise<void>;
  fail(assetId: string, token: string, attempts: number, error: unknown): Promise<void>;
}

export async function processPurgeCandidate(
  repository: PurgeRepository,
  assetId: string,
  purge: (object: PurgeObject) => Promise<void> = purgeStorageObject,
): Promise<boolean> {
  const token = randomUUID();
  const object = await repository.claim(assetId, token);
  if (!object) return false;
  try {
    await purge(object);
    await repository.complete(assetId, token);
    return true;
  } catch (error) {
    await repository.fail(assetId, token, object.attempts + 1, error);
    return false;
  }
}

export const purgeRepository: PurgeRepository = {
  async claim(assetId, token) {
    const [result] = await pool.execute(
      `UPDATE account_storage_purge SET lease_token = ?, lease_until = DATE_ADD(NOW(3), INTERVAL 10 MINUTE)
       WHERE asset_id = ? AND next_attempt_at <= NOW(3) AND (lease_until IS NULL OR lease_until < NOW(3))`,
      [token, assetId],
    );
    if ((result as { affectedRows: number }).affectedRows !== 1) return null;
    const [rows] = await pool.execute(
      'SELECT asset_id, provider, provider_public_id, resource_type, attempts FROM account_storage_purge WHERE asset_id = ? AND lease_token = ?',
      [assetId, token],
    );
    return (rows as PurgeObject[])[0] ?? null;
  },
  async complete(assetId, token) {
    await pool.execute('DELETE FROM account_storage_purge WHERE asset_id = ? AND lease_token = ?', [assetId, token]);
  },
  async fail(assetId, token, attempts, error) {
    const message = error instanceof Error ? error.message : String(error);
    const delaySeconds = Math.min(24 * 60 * 60, 60 * 2 ** Math.min(attempts - 1, 10));
    await pool.execute(
      `UPDATE account_storage_purge SET attempts = ?, last_error = ?,
       next_attempt_at = DATE_ADD(NOW(3), INTERVAL ? SECOND), lease_token = NULL, lease_until = NULL
       WHERE asset_id = ? AND lease_token = ?`,
      [attempts, message.slice(0, 500), delaySeconds, assetId, token],
    );
  },
};

export async function runAccountStoragePurgeSweep(): Promise<void> {
  const [rows] = await pool.execute(
    `SELECT asset_id FROM account_storage_purge
     WHERE next_attempt_at <= NOW(3) AND (lease_until IS NULL OR lease_until < NOW(3))
     ORDER BY next_attempt_at LIMIT 50`,
  );
  for (const row of rows as { asset_id: string }[]) {
    try {
      await processPurgeCandidate(purgeRepository, row.asset_id);
    } catch (error) {
      console.error('account_storage_purge_failed', { asset_id: row.asset_id, error });
    }
  }
}
