import { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { fetchStoreDisplayPrices } from '@/lib/iap';

export function useStorePrices(productIds: string[], type: 'in-app' | 'subs') {
  const key = useMemo(() => [...new Set(productIds.filter(Boolean))].sort().join('\u0000'), [productIds]);
  const [state, setState] = useState<{ key: string; prices: Record<string, string>; loading: boolean }>({
    key: '', prices: {}, loading: true,
  });

  useEffect(() => {
    if (Platform.OS === 'web') return;
    let alive = true;
    const ids = key ? key.split('\u0000') : [];
    if (ids.length === 0) {
      setState({ key, prices: {}, loading: false });
      return;
    }
    setState({ key, prices: {}, loading: true });
    void fetchStoreDisplayPrices(ids, type)
      .then((prices) => { if (alive) setState({ key, prices, loading: false }); })
      .catch(() => { if (alive) setState({ key, prices: {}, loading: false }); });
    return () => { alive = false; };
  }, [key, type]);

  return Platform.OS === 'web'
    ? { prices: {} as Record<string, string>, loading: false }
    : state.key === key ? state : { prices: {} as Record<string, string>, loading: true };
}
