import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';

/**
 * Pro abone = house banner gizlenir (FAZ 41 T41-3).
 * Backend (T41-1) auth/me yanıtında is_premium alanını hesaplanmış olarak döner.
 */
export function usePremium() {
  const { user, isAuthenticated, authHydrating } = useAuth();

  const isPremium = useMemo(
    () => isAuthenticated && user?.is_premium === true,
    [isAuthenticated, user?.is_premium],
  );

  return {
    isPremium,
    subscription: user?.subscription ?? null,
    loading: authHydrating,
  };
}
