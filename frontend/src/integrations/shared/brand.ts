// FAZ 33 / HC-A7 — Frontend brand mapper (pure, izomorfik).
// site_settings brand.* satırları → @goldmood/shared-config mergeBrand ⊕ brand.json.
// React İÇERMEZ → hem RSC server hem client tarafında güvenli (FAZ32 dersi).
// Barrel'a (index.ts export *) EKLENMEZ — doğrudan import edilir, blast radius düşük.

import { mergeBrand, type Brand } from '@goldmood/shared-config/brand';
import type { SiteSettingRow } from './site_settings.types';

export type { Brand };

/**
 * site_settings satırlarını (key='brand.x') {key:value} haritasına çevirip
 * mergeBrand ile tam Brand üretir. '*' locale önceliklidir.
 */
export function rowsToBrand(rows?: SiteSettingRow[] | null): Brand {
  if (!rows?.length) return mergeBrand(null);
  const map: Record<string, unknown> = {};
  for (const r of rows) {
    if (!r?.key?.startsWith('brand.')) continue;
    if (map[r.key] === undefined || r.locale === '*') map[r.key] = r.value;
  }
  return mergeBrand(map);
}
