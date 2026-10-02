import { describe, expect, test } from 'bun:test';
import { fetchWithPolicy, HttpError, isUnauthorized } from '../src/lib/core/transport';
import { createSecretStore } from '../src/lib/core/secretStore';
import { createSerialQueue } from '../src/lib/core/serialQueue';

describe('portable HTTP policy', () => {
  test('GET retries server failure then succeeds', async () => {
    let calls = 0;
    const res = await fetchWithPolicy('https://example.test', {}, {
      fetcher: async () => new Response(++calls === 1 ? 'busy' : 'ok', { status: calls === 1 ? 503 : 200 }),
      sleep: async () => {},
    });
    expect(await res.text()).toBe('ok');
    expect(calls).toBe(2);
  });
  for (const method of ['POST', 'PATCH', 'DELETE']) {
    test(method + ' never retries uncertain writes', async () => {
      let calls = 0;
      await expect(fetchWithPolicy('https://example.test', { method }, {
        fetcher: async () => { calls++; throw new Error('network lost after commit'); },
      })).rejects.toThrow();
      expect(calls).toBe(1);
    });
    test(method + ' does not retry 503', async () => {
      let calls = 0;
      const res = await fetchWithPolicy('https://example.test', { method }, {
        fetcher: async () => { calls++; return new Response(null, { status: 503 }); },
      });
      expect(res.status).toBe(503);
      expect(calls).toBe(1);
    });
  }
  for (const status of [401, 403, 404, 429]) {
    test('does not retry ' + status, async () => {
      let calls = 0;
      const res = await fetchWithPolicy('https://example.test', {}, {
        fetcher: async () => { calls++; return new Response(null, { status }); },
      });
      expect(res.status).toBe(status);
      expect(calls).toBe(1);
    });
  }
  test('caps read retries', async () => {
    let calls = 0;
    await fetchWithPolicy('https://example.test', {}, {
      retries: 100, sleep: async () => {},
      fetcher: async () => { calls++; return new Response(null, { status: 503 }); },
    });
    expect(calls).toBe(3);
  });
  test('deadline aborts a stalled request', async () => {
    await expect(fetchWithPolicy('https://example.test', {}, {
      retries: 0, timeoutMs: 5,
      fetcher: (_, init) => new Promise((_, reject) => {
        init.signal!.addEventListener('abort', () => reject(init.signal!.reason));
      }),
    })).rejects.toThrow('timed out');
  });
  test('caller cancellation sends no request', async () => {
    const controller = new AbortController();
    controller.abort(new Error('cancelled'));
    let calls = 0;
    await expect(fetchWithPolicy('https://example.test', { signal: controller.signal }, {
      fetcher: async () => { calls++; return new Response('no'); },
    })).rejects.toThrow('cancelled');
    expect(calls).toBe(0);
  });
  test('204 has no response body; only 401 is unauthorized', async () => {
    const res = await fetchWithPolicy('https://example.test', {}, {
      fetcher: async () => new Response(null, { status: 204 }),
    });
    expect(await res.text()).toBe('');
    expect(isUnauthorized(new HttpError(401))).toBe(true);
    expect(isUnauthorized(new HttpError(503))).toBe(false);
  });
});

function vaultFixture(available = true) {
  const secure = new Map<string, string>();
  const legacy = new Map<string, string>();
  const adapter = {
    available: async () => available,
    get: async (key: string) => secure.get(key) ?? null,
    set: async (key: string, value: string) => { secure.set(key, value); },
    remove: async (key: string) => { secure.delete(key); },
  };
  const old = {
    get: async (key: string) => legacy.get(key) ?? null,
    remove: async (key: string) => { legacy.delete(key); },
  };
  return { secure, legacy, adapter, old };
}
describe('portable secret storage', () => {
  test('native unavailable does not expose legacy token or write plaintext', async () => {
    const f = vaultFixture(false);
    f.legacy.set('token', 'old');
    const store = createSecretStore(f.adapter, f.old);
    await expect(store.get('token')).rejects.toThrow('unavailable');
    await expect(store.set('token', 'new')).rejects.toThrow('unavailable');
    expect(f.legacy.get('token')).toBe('old');
    expect(f.secure.size).toBe(0);
  });
  test('migrates before returning legacy token', async () => {
    const f = vaultFixture();
    f.legacy.set('token', 'old');
    expect(await createSecretStore(f.adapter, f.old).get('token')).toBe('old');
    expect(f.secure.get('token')).toBe('old');
    expect(f.legacy.size).toBe(0);
  });
  test('failed migration does not return plaintext fallback', async () => {
    const f = vaultFixture();
    f.legacy.set('token', 'old');
    f.adapter.set = async () => { throw new Error('locked'); };
    await expect(createSecretStore(f.adapter, f.old).get('token')).rejects.toThrow('locked');
    expect(f.legacy.get('token')).toBe('old');
  });
  test('web credentials live only in the instance memory', async () => {
    const f = vaultFixture(false);
    const store = createSecretStore(f.adapter, f.old, true);
    await store.set('token', 'session');
    expect(await store.get('token')).toBe('session');
    expect(await createSecretStore(f.adapter, f.old, true).get('token')).toBeNull();
    expect(f.legacy.size + f.secure.size).toBe(0);
    await store.remove('token');
    expect(await store.get('token')).toBeNull();
  });
  test('queue preserves order after a failed operation', async () => {
    const queue = createSerialQueue();
    const order: number[] = [];
    const first = queue(async () => { order.push(1); throw new Error('storage'); });
    const second = queue(async () => { order.push(2); });
    await expect(first).rejects.toThrow('storage');
    await second;
    expect(order).toEqual([1, 2]);
  });
});
