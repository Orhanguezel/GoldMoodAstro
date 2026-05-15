'use client';

// FAZ 33 / HC-A7 — useBrand() client hook.
// RTK site_settings (prefix 'brand.') → rowsToBrand ⊕ brand.json fallback.
// DB boş/yükleniyorken brand.json defaults döner → site asla çökmez.
// RSC tarafı: site_settings fetch + rowsToBrand(rows) doğrudan çağrılır (hook'suz).

import { useMemo } from 'react';
import { useListSiteSettingsQuery } from '@/integrations/rtk/public/site_settings.endpoints';
import { rowsToBrand, type Brand } from '@/integrations/shared/brand';

export function useBrand(): { brand: Brand; isLoading: boolean } {
  const { data, isLoading } = useListSiteSettingsQuery({ prefix: 'brand.' });
  const brand = useMemo(() => rowsToBrand(data), [data]);
  return { brand, isLoading };
}
