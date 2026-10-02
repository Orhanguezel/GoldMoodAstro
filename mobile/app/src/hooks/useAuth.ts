import { useEffect, useSyncExternalStore } from 'react';
import { router } from 'expo-router';
import { storage } from '@/lib/storage';
import { authApi, getAuthEpoch, hydrateAuthTokenFromStorage, setAuthToken, subscribeToAuth } from '@/lib/api';
import { registerPushToken } from '@/lib/notifications';
import type { User } from '@/types';
import { logger } from '@/lib/logger';

type AuthState = { user: User | null; loading: boolean; epoch: number };
let state: AuthState = { user: null, loading: true, epoch: getAuthEpoch() };
const listeners = new Set<() => void>();
const flights = new Map<number, Promise<void>>();
const getSnapshot = () => state;
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};
function publish(next: AuthState) {
  state = next;
  for (const listener of listeners) listener();
}
subscribeToAuth(() => {
  publish({ user: null, loading: true, epoch: getAuthEpoch() });
});

async function initAuth(): Promise<void> {
  try {
    const token = await hydrateAuthTokenFromStorage();
    const epoch = getAuthEpoch();
    if (!token) { publish({ user: null, loading: false, epoch }); return; }
    const pending = flights.get(epoch);
    if (pending) return pending;
    const check = (async () => {
      try {
        const result = await authApi.me();
        if (epoch !== getAuthEpoch()) return;
        publish({ user: result.user ?? null, loading: false, epoch });
        if (result.user) void registerPushToken().catch(() => {});
      } catch {
        // Offline/5xx preserves credentials, without asserting a verified user.
        if (epoch === getAuthEpoch()) publish({ user: null, loading: false, epoch });
        logger.warn('Auth check unavailable; credentials were not cleared by the view');
      } finally {
        flights.delete(epoch);
      }
    })();
    flights.set(epoch, check);
    return check;
  } catch {
    publish({ user: null, loading: false, epoch: getAuthEpoch() });
    logger.warn('Secure session bootstrap unavailable');
  }
}

async function logout() {
  await authApi.unregisterFcmToken().catch(() => {});
  setAuthToken(null);
  try {
    await storage.clearSession();
    await storage.clearPushToken();
  } finally {
    publish({ user: null, loading: false, epoch: getAuthEpoch() });
  }
  router.replace('/auth/login');
}

export function useAuth() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useEffect(() => {
    if (snapshot.loading) void initAuth();
  }, [snapshot.epoch, snapshot.loading]);
  return {
    user: snapshot.user,
    /** @deprecated Prefer authHydrating. */
    loading: snapshot.loading,
    authHydrating: snapshot.loading,
    logout,
    refreshUser: initAuth,
    isAuthenticated: !!snapshot.user,
  };
}
