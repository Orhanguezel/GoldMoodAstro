import { afterAll, beforeEach, expect, mock, test } from 'bun:test';

const plain = new Map<string, string>();
const secure = new Map<string, string>();
mock.module('@react-native-async-storage/async-storage', () => ({ default: {
  getItem: async (key: string) => plain.get(key) ?? null,
  setItem: async (key: string, value: string) => { plain.set(key, value); },
  removeItem: async (key: string) => { plain.delete(key); },
  multiSet: async (pairs: [string, string][]) => { pairs.forEach(([k, v]) => plain.set(k, v)); },
  multiRemove: async (keys: string[]) => { keys.forEach((key) => plain.delete(key)); },
} }));
mock.module('expo-secure-store', () => ({
  isAvailableAsync: async () => true,
  getItemAsync: async (key: string) => secure.get(key) ?? null,
  setItemAsync: async (key: string, value: string) => { secure.set(key, value); },
  deleteItemAsync: async (key: string) => { secure.delete(key); },
}));
mock.module('react-native', () => ({ Platform: { OS: 'android' } }));
mock.module('expo-constants', () => ({ default: { expoConfig: { extra: { apiUrl: 'https://example.test/api' } } } }));
mock.module('expo-router', () => ({ router: { replace: () => {} } }));
mock.module('../src/lib/logger', () => ({ logger: { error: () => {}, warn: () => {} } }));

const { storage } = await import('../src/lib/storage');
const { authApi, setAuthToken } = await import('../src/lib/api');
const originalFetch = globalThis.fetch;
afterAll(() => { globalThis.fetch = originalFetch; mock.restore(); });
beforeEach(async () => {
  setAuthToken(null);
  await storage.clearSession();
  secure.clear(); plain.clear();
});
async function login(token: string, refreshToken?: string) {
  await storage.setUserSession({ token, refreshToken, userId: token, role: 'user' });
  setAuthToken(token);
}
function fetcher(fn: (url: string, init: RequestInit) => Promise<Response>) {
  globalThis.fetch = ((url: string | URL | Request, init?: RequestInit) => fn(String(url), init ?? {})) as typeof fetch;
}
const response = (status: number, body: unknown = {}) => Response.json(body, { status });
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => { resolve = r; });
  return { promise, resolve };
}

test('a 403 never returns a previous successful private response', async () => {
  await login('A');
  fetcher(async () => response(200, { user: { id: 'A' } }));
  expect((await authApi.me()).user.id).toBe('A');
  fetcher(async () => response(403));
  await expect(authApi.me()).rejects.toMatchObject({ status: 403 });
  expect(await storage.getAuthToken()).toBe('A');
});
test('account B cannot receive in-flight account A response', async () => {
  await login('A');
  const started = deferred<void>(); const pending = deferred<Response>();
  fetcher(async () => { started.resolve(); return pending.promise; });
  const request = authApi.me();
  const rejection = request.then(() => null, (error: unknown) => error);
  await started.promise;
  await login('B');
  pending.resolve(response(200, { user: { id: 'A' } }));
  expect(await rejection).toMatchObject({ message: 'Session changed while the request was pending' });
  expect(await storage.getAuthToken()).toBe('B');
});
test('network outage preserves credentials but never serves old private data', async () => {
  await login('A', 'refresh-A');
  fetcher(async () => response(200, { user: { id: 'A' } }));
  await authApi.me();
  let attempts = 0;
  fetcher(async () => { attempts++; throw new Error('offline'); });
  await expect(authApi.me()).rejects.toThrow('offline');
  expect(attempts).toBe(3);
  expect(await storage.getAuthToken()).toBe('A');
  expect(await storage.getRefreshToken()).toBe('refresh-A');
});
test('new login without refresh token removes old account refresh token', async () => {
  await login('A', 'refresh-A');
  await login('B');
  expect(await storage.getRefreshToken()).toBeNull();
});
test('server failure during refresh preserves credentials', async () => {
  await login('A', 'refresh-A');
  fetcher(async (url) => response(url.endsWith('/refresh') ? 503 : 401));
  await expect(authApi.me()).rejects.toMatchObject({ status: 503 });
  expect(await storage.getAuthToken()).toBe('A');
  expect(await storage.getRefreshToken()).toBe('refresh-A');
});
test('definitive refresh rejection clears the expired session', async () => {
  await login('A', 'refresh-A');
  fetcher(async () => response(401));
  await expect(authApi.me()).rejects.toMatchObject({ status: 401 });
  expect(await storage.getAuthToken()).toBeNull();
});
test('concurrent unauthorized reads share refresh and recover', async () => {
  await login('A', 'refresh-A');
  let refreshes = 0;
  const started = deferred<void>(); const rotated = deferred<Response>();
  fetcher(async (url, init) => {
    if (url.endsWith('/refresh')) { refreshes++; started.resolve(); return rotated.promise; }
    return new Headers(init.headers).get('Authorization') === 'Bearer new-A'
      ? response(200, { user: { id: 'A' } }) : response(401);
  });
  const requests = [authApi.me(), authApi.me()];
  await started.promise;
  rotated.resolve(response(200, { access_token: 'new-A', refresh_token: 'new-refresh-A' }));
  const results = await Promise.all(requests);
  expect(results.map((r) => r.user.id)).toEqual(['A', 'A']);
  expect(refreshes).toBe(1);
  expect(await storage.getAuthToken()).toBe('new-A');
});
test('refresh cannot restore a logged-out session', async () => {
  await login('A', 'refresh-A');
  const started = deferred<void>(); const rotated = deferred<Response>();
  fetcher(async (url) => {
    if (!url.endsWith('/refresh')) return response(401);
    started.resolve(); return rotated.promise;
  });
  const request = authApi.me();
  const rejection = request.then(() => null, (error: unknown) => error);
  await started.promise;
  setAuthToken(null); await storage.clearSession();
  rotated.resolve(response(200, { access_token: 'old-account-new-token' }));
  expect(await rejection).toMatchObject({ message: 'Session changed while the request was pending' });
  expect(await storage.getAuthToken()).toBeNull();
});
test('refresh cannot overwrite a different logged-in account', async () => {
  await login('A', 'refresh-A');
  const started = deferred<void>(); const rotated = deferred<Response>();
  fetcher(async (url) => {
    if (!url.endsWith('/refresh')) return response(401);
    started.resolve(); return rotated.promise;
  });
  const request = authApi.me();
  const rejection = request.then(() => null, (error: unknown) => error);
  await started.promise; await login('B', 'refresh-B');
  rotated.resolve(response(200, { access_token: 'old-A' }));
  expect(await rejection).toMatchObject({ message: 'Session changed while the request was pending' });
  expect(await storage.getAuthToken()).toBe('B');
  expect(await storage.getRefreshToken()).toBe('refresh-B');
});
test('write is not automatically replayed after refreshing', async () => {
  await login('A', 'refresh-A');
  let writes = 0;
  fetcher(async (url) => {
    if (url.endsWith('/refresh')) return response(200, { access_token: 'new-A' });
    writes++; return response(401);
  });
  await expect(authApi.registerFcmToken('device')).rejects.toMatchObject({ status: 409 });
  expect(writes).toBe(1);
  expect(await storage.getAuthToken()).toBe('new-A');
});
