// src/modules/siteSettings/helpers/brand.ts
// FAZ 33 / HC-A6 — Backend getBrand() ince tüketici.
// DB site_settings brand.* → @goldmood/shared-config mergeBrand ⊕ config/brand.json.
// 60sn in-memory cache; siteSettings yazımında invalidateBrandCache() çağrılır.

import { mergeBrand, type Brand } from '@goldmood/shared-config/brand';
import { repoGetAllByConditions, rowToDto } from '../repository';

const TTL_MS = 60_000;
let cache: { brand: Brand; at: number } | null = null;

/** DB brand.* ⊕ brand.json fallback. force=true cache'i atlar. */
export async function getBrand(force = false): Promise<Brand> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) return cache.brand;

  const rows = await repoGetAllByConditions({ prefix: 'brand.' });
  const map: Record<string, unknown> = {};
  for (const r of rows) {
    const dto = rowToDto(r);
    // brand.* '*' locale ile seed'li; '*' önceliklidir, aksi halde ilk dolu değer.
    if (map[dto.key] === undefined || r.locale === '*') map[dto.key] = dto.value;
  }

  const brand = mergeBrand(map);
  cache = { brand, at: Date.now() };
  return brand;
}

/** siteSettings brand.* yazımı sonrası çağrılır (admin upsert). */
export function invalidateBrandCache(): void {
  cache = null;
}

export type { Brand };
