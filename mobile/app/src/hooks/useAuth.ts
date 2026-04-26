import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { storage } from '@/lib/storage';
import { authApi, setAuthToken } from '@/lib/api';
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
    loading, 
    logout,
    refreshUser: initAuth,
    isAuthenticated: !!user
  };
}
