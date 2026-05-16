import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { storage } from '@/lib/storage';
import { authApi, setAuthToken } from '@/lib/api';
import { registerPushToken } from '@/lib/notifications';
import type { User } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const initAuth = async () => {
    try {
      const token = await storage.getAuthToken();
      if (token) {
        setAuthToken(token);
        const res = await authApi.me().catch(() => null);
        if (res && res.user) {
          setUser(res.user);
          registerPushToken().catch(() => {});
        } else {
          // Token geçersiz veya expired
          await storage.clearSession();
          setAuthToken(null);
        }
      }
    } catch (err) {
      console.warn('Auth initialization failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const logout = async () => {
    await storage.clearSession();
    setAuthToken(null);
    setUser(null);
    router.replace('/auth/login');
  };

  return { 
    user, 
    /** @deprecated Prefer `authHydrating` for new code — same value. */
    loading,
    /** True while the first session check runs. Avoid guest-only UI while this is true. */
    authHydrating: loading,
    logout,
    refreshUser: initAuth,
    isAuthenticated: !!user
  };
}
