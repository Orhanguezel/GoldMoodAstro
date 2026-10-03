import { beforeAll, expect, test } from 'bun:test';
import type { PurgeObject, PurgeRepository } from './account-storage-purge';

process.env.JWT_SECRET ||= 'purge-test-secret';
process.env.COOKIE_SECRET ||= 'purge-test-secret';

let processPurgeCandidate: typeof import('./account-storage-purge').processPurgeCandidate;
beforeAll(async () => { ({ processPurgeCandidate } = await import('./account-storage-purge')); });

const object: PurgeObject = {
  asset_id: 'asset-1', provider: 'cloudinary', provider_public_id: 'uploads/asset-1',
  resource_type: 'image', attempts: 0,
};

class FakeRepository implements PurgeRepository {
  current: PurgeObject | null = { ...object };
  lease: string | null = null;
  failures: unknown[] = [];
  async claim(_id: string, token: string) {
    if (!this.current || this.lease) return null;
    this.lease = token;
    return { ...this.current };
  }
  async complete(_id: string, token: string) {
    if (this.lease !== token) throw new Error('wrong lease');
    this.current = null;
    this.lease = null;
  }
  async fail(_id: string, token: string, attempts: number, error: unknown) {
    if (this.lease !== token) throw new Error('wrong lease');
    this.failures.push(error);
    this.current = { ...this.current!, attempts };
    this.lease = null;
  }
}

test('provider failure retains object identity and allows a later successful retry', async () => {
  const repository = new FakeRepository();
  expect(await processPurgeCandidate(repository, object.asset_id, async () => { throw new Error('provider outage'); })).toBe(false);
  expect(repository.current?.attempts).toBe(1);
  expect(repository.current?.provider_public_id).toBe(object.provider_public_id);
  const purged: string[] = [];
  expect(await processPurgeCandidate(repository, object.asset_id, async (item) => { purged.push(item.provider_public_id); })).toBe(true);
  expect(purged).toEqual([object.provider_public_id]);
  expect(repository.current).toBeNull();
});

test('leased object cannot be processed concurrently', async () => {
  const repository = new FakeRepository();
  repository.lease = 'other-worker';
  let called = false;
  expect(await processPurgeCandidate(repository, object.asset_id, async () => { called = true; })).toBe(false);
  expect(called).toBe(false);
});
