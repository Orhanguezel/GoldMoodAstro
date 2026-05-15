import { z } from 'zod';
import brandJson from '../../../config/brand.json';

/**
 * FAZ 33 / HC-A6+A7 — Marka kimliği izomorfik resolver primitive'i.
 *
 * Tek kaynak önceliği: DB `site_settings brand.*` > `config/brand.json` > .env.
 * Saf TS + zod + JSON import → backend (Fastify) ve frontend (RSC + client)
 * tarafında güvenli. `server-only`/`next/headers` İÇERMEZ (FAZ32 dersi:
 * client ağacına server-only sızdırma).
 *
 * Anahtarlar `config/brand.json` ve DB seed `014_brand_seed.sql` ile BİREBİR
 * (snake-case). Yeni marka: brand.json + DB seed + .env değiştir, KOD'a dokunma.
 */

const contactSchema = z.object({
  email: z.string().default(''),
  phone: z.string().default(''),
  address: z.string().default(''),
});

const socialSchema = z.object({
  instagram: z.string().default(''),
  twitter: z.string().default(''),
  facebook: z.string().default(''),
  linkedin: z.string().default(''),
  youtube: z.string().default(''),
});

export const brandSchema = z.object({
  name: z.string(),
  legal_name: z.string(),
  domain: z.string(),
  public_url: z.string(),
  logo_light: z.string().default(''),
  logo_dark: z.string().default(''),
  favicon: z.string().default(''),
  og_image: z.string().default(''),
  theme_color: z.string().default('#000000'),
  contact: contactSchema.default({ email: '', phone: '', address: '' }),
  social: socialSchema.default({ instagram: '', twitter: '', facebook: '', linkedin: '', youtube: '' }),
  assets: z.record(z.string()).default({}),
});

export type Brand = z.infer<typeof brandSchema>;

// brand.json'daki yorum alanı (_doc) ayıklanır, kalan doğrulanır.
const { _doc: _brandDoc, ...rawBrandDefaults } = brandJson as Record<string, unknown>;

/** Statik fallback — config/brand.json (build-time, izomorfik). */
export const brandDefaults: Brand = brandSchema.parse(rawBrandDefaults);

function nonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function resolveObject<T>(raw: unknown, fallback: T): T {
  if (raw && typeof raw === 'object') return raw as T;
  if (nonEmptyString(raw)) {
    try {
      return { ...fallback, ...(JSON.parse(raw) as object) } as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

/**
 * DB `site_settings brand.*` düz {key:value} haritası ⊕ brandDefaults → tam Brand.
 * Boş/eksik DB değeri brand.json fallback'ine düşer.
 *
 * @param dbValues  { 'brand.name': 'X', 'brand.contact': '{"email":...}' , ... }
 */
export function mergeBrand(dbValues?: Record<string, unknown> | null): Brand {
  if (!dbValues) return brandDefaults;

  const str = (key: keyof Brand, fb: string): string => {
    const v = dbValues[`brand.${key}`];
    return nonEmptyString(v) ? v : fb;
  };

  return {
    name: str('name', brandDefaults.name),
    legal_name: str('legal_name', brandDefaults.legal_name),
    domain: str('domain', brandDefaults.domain),
    public_url: str('public_url', brandDefaults.public_url),
    logo_light: str('logo_light', brandDefaults.logo_light),
    logo_dark: str('logo_dark', brandDefaults.logo_dark),
    favicon: str('favicon', brandDefaults.favicon),
    og_image: str('og_image', brandDefaults.og_image),
    theme_color: str('theme_color', brandDefaults.theme_color),
    contact: resolveObject(dbValues['brand.contact'], brandDefaults.contact),
    social: resolveObject(dbValues['brand.social'], brandDefaults.social),
    assets: resolveObject(dbValues['brand.assets'], brandDefaults.assets),
  };
}
