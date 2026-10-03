import { beforeAll, expect, test } from 'bun:test';
import type { DeletionConnection } from './account-deletion';

process.env.JWT_SECRET ||= 'deletion-test-secret';
process.env.COOKIE_SECRET ||= 'deletion-test-secret';

let deleteDueAccount: typeof import('./account-deletion').deleteDueAccount;
let resolveStoredObjectId: typeof import('./account-deletion').resolveStoredObjectId;
beforeAll(async () => { ({ deleteDueAccount, resolveStoredObjectId } = await import('./account-deletion')); });

class FakeConnection implements DeletionConnection {
  statements: string[] = [];
  committed = 0;
  rolledBack = 0;
  due = true;
  failOn = '';
  legacyAsset = false;

  async beginTransaction() { this.statements.push('BEGIN'); }
  async execute(query: string): Promise<[unknown, unknown]> {
    this.statements.push(query);
    if (this.failOn && query.includes(this.failOn)) throw new Error('simulated database failure');
    if (query.includes('FOR UPDATE')) return [this.due ? [{ user_id: 'user-1' }] : [], []];
    if (query.includes('information_schema.TABLES')) return [[{ name: 'chat_reports' }, { name: 'chat_blocks' }], []];
    if (query.includes('SELECT DISTINCT t.id')) return [[{ id: 'thread-1' }], []];
    if (query.includes('FROM storage_assets WHERE user_id = ? FOR UPDATE')) return [this.legacyAsset ? [{ id: 'legacy-asset', provider: 'local', provider_public_id: null, path: 'private/legacy.jpg' }] : [{ id: 'asset-1', provider: 'cloudinary', provider_public_id: 'private/asset-1', path: 'private/asset-1.jpg' }], []];
    return [[], []];
  }
  async commit() { this.committed++; this.statements.push('COMMIT'); }
  async rollback() { this.rolledBack++; this.statements.push('ROLLBACK'); }
}

const request = { request_id: 'request-1', user_id: 'user-1' };

test('deletes related chat data before user and commits only after user deletion', async () => {
  const conn = new FakeConnection();
  expect(await deleteDueAccount(conn, request)).toBe(true);
  expect(conn.committed).toBe(1);
  expect(conn.rolledBack).toBe(0);
  const pos = (needle: string) => conn.statements.findIndex((statement) => statement.includes(needle));
  expect(pos('DELETE FROM chat_reports WHERE thread_id')).toBeLessThan(pos('DELETE FROM chat_messages WHERE thread_id'));
  expect(pos('DELETE FROM chat_messages WHERE thread_id')).toBeLessThan(pos('DELETE FROM chat_threads WHERE id'));
  expect(pos('DELETE FROM chat_threads WHERE id')).toBeLessThan(pos('DELETE FROM users WHERE id'));
  expect(pos('INSERT INTO account_storage_purge')).toBeLessThan(pos('DELETE FROM storage_assets'));
  expect(pos('DELETE FROM storage_assets')).toBeLessThan(pos('DELETE FROM users WHERE id'));
  expect(pos('DELETE FROM users WHERE id')).toBeLessThan(pos('COMMIT'));
  expect(conn.statements.some((statement) => statement.includes("SET status = 'completed'"))).toBe(false);
});

test('legacy asset without provider ID is queued via local path and account deletion commits', async () => {
  const conn = new FakeConnection();
  conn.legacyAsset = true;
  expect(resolveStoredObjectId({ provider: 'local', provider_public_id: null, path: 'private/legacy.jpg' })).toBe('private/legacy.jpg');
  expect(resolveStoredObjectId({ provider: 'cloudinary', provider_public_id: null, path: 'private/legacy.jpg' })).toBe('private/legacy');
  expect(await deleteDueAccount(conn, request)).toBe(true);
  expect(conn.committed).toBe(1);
  expect(conn.statements.some((statement) => statement.includes('INSERT INTO account_storage_purge'))).toBe(true);
});

test('failed user deletion rolls back request and all prior cleanup for retry', async () => {
  const conn = new FakeConnection();
  conn.failOn = 'DELETE FROM users WHERE id';
  await expect(deleteDueAccount(conn, request)).rejects.toThrow('simulated database failure');
  expect(conn.committed).toBe(0);
  expect(conn.rolledBack).toBe(1);
});

test('cancelled or previously handled request is never deleted', async () => {
  const conn = new FakeConnection();
  conn.due = false;
  expect(await deleteDueAccount(conn, request)).toBe(false);
  expect(conn.committed).toBe(0);
  expect(conn.rolledBack).toBe(1);
  expect(conn.statements.some((statement) => statement.includes('DELETE FROM users'))).toBe(false);
});
