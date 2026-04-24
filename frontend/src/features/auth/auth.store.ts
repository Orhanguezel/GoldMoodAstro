'use client';

import { useMemo } from 'react';
import { useMeQuery } from '@/integrations/rtk/hooks';
import { tokenStore } from '@/integrations/rtk/token';
import type { User } from '@/integrations/shared';

type AuthState = {
  isAuthenticated: boolean;
  user: User | null;
};

export function useAuthStore(): AuthState {
  const hasToken = typeof window !== 'undefined' ? !!tokenStore.get() : false;
  const { data } = useMeQuery(undefined, { skip: !hasToken });

  return useMemo<AuthState>(() => {
    const user = data?.user ?? null;
    return {
      isAuthenticated: !!user,
      user,
    };
  }, [data]);
}
