// =============================================================
// FILE: src/integrations/shared/seoSchema.ts
// goldmoodastro – SEO Schema (STRICT) + DB-backed Defaults
// SINGLE SOURCE OF TRUTH: open_graph.images[]
// =============================================================

import { z } from 'zod';
import brand from '../../../../config/brand.json';

const nonEmpty = z.string().trim().min(1);

/** -------------------------------------------------------------
 * STRICT SCHEMAS
 * ------------------------------------------------------------ */

export const seoOpenGraphSchema = z
  .object({
    type: z.enum(['website', 'article', 'product']).default('website'),
    /** ✅ SINGLE SOURCE: images[] only */
    images: z.array(z.string().trim().min(1)).default([]),
  })
  .strict();

export const seoTwitterSchema = z
  .object({
    card: z
      .enum(['summary', 'summary_large_image', 'app', 'player'])
      .default('summary_large_image'),
    site: z.string().trim().optional(),
    creator: z.string().trim().optional(),
  })
  .strict();

export const seoRobotsSchema = z
  .object({
    noindex: z.boolean().default(false),
    index: z.boolean().default(true),
    follow: z.boolean().default(true),
  })
  .strict();

export const seoSchema = z
  .object({
    site_name: nonEmpty,
    title_default: nonEmpty,
    title_template: nonEmpty,
    description: z.string().trim().optional(),

    open_graph: seoOpenGraphSchema.default({
      type: 'website',
      images: ['/img/og-default.jpg'],
    }),

    twitter: seoTwitterSchema.default({
      card: 'summary_large_image',
      site: '',
      creator: '',
    }),

    robots: seoRobotsSchema.default({
      noindex: false,
      index: true,
      follow: true,
    }),
  })
  .strict();

export type SeoObject = z.infer<typeof seoSchema>;

export const siteMetaDefaultSchema = z
  .object({
    title: nonEmpty,
    description: nonEmpty,
    keywords: z.string().trim().optional(),
  })
  .strict();

export type SiteMetaDefaultObject = z.infer<typeof siteMetaDefaultSchema>;

export const DEFAULT_OG_IMAGE = '/img/og-default.jpg';

/** -------------------------------------------------------------
 * GLOBAL FALLBACKS (when DB is empty or invalid)
 * ------------------------------------------------------------ */

/**
 * Global fallback used when DB values are empty or invalid.
 * Primary values come from site_settings.seo / site_settings.site_seo.
 */
export const DEFAULT_SEO_GLOBAL: SeoObject = {
  site_name: brand.name || 'GoldMoodAstro',
  title_default: `${brand.name} - Spiritual Guidance and Astrology Platform`,
  title_template: `%s - ${brand.name}`,
  description:
    brand.tagline || 'Get guidance on your spiritual journey. Meet expert consultants for astrology, tarot and mood coaching sessions.',
  open_graph: {
    type: 'website',
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    site: '',
    creator: '',
  },
  robots: {
    noindex: false,
    index: true,
    follow: true,
  },
};

/**
 * Locale-based meta fallback used when DB has no locale value.
 * Primary values come from site_settings.site_meta_default.
 */
export const DEFAULT_SITE_META_DEFAULT_BY_LOCALE: Record<string, SiteMetaDefaultObject> = {
  tr: {
    title: `${brand.name} - Spiritual Guidance and Astrology Platform`,
    description:
      brand.tagline || 'Explore yourself with astrology, tarot and mood coaching. Start your voice sessions with trusted consultants now.',
    keywords:
      'astrology, tarot, numerology, mood coaching, career guidance, relationship counseling, spiritual guidance, online session',
  },
  en: {
    title: `${brand.name} - Spiritual Guidance and Astrology Platform`,
    description:
      brand.tagline || 'Explore yourself with astrology, tarot, and mood coaching. Start your voice sessions with trusted consultants now.',
    keywords:
      'astrology, tarot, numerology, mood coaching, career guidance, relationship counseling, spiritual guidance, online session',
  },
  de: {
    title: `${brand.name} - Spiritual Guidance and Astrology Platform`,
    description:
      brand.tagline || 'Explore yourself with astrology, tarot and mood coaching. Start your sessions with trusted consultants now.',
    keywords:
      'astrology, tarot, numerology, mood coaching, career guidance, relationship counseling, spiritual guidance, online session',
  },
};

/* ------------------------------------------------------------------
 * HELPERS - DB site_settings.value -> type-safe objects
 * ------------------------------------------------------------------ */

function tryParseJson(input: unknown): unknown {
  if (typeof input !== 'string') return input;
  const s = input.trim();
  if (!s) return {};
  if (!((s.startsWith('{') && s.endsWith('}')) || (s.startsWith('[') && s.endsWith(']')))) {
    return input;
  }
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}

/**
 * open_graph.images normalizer:
 * - DB can sometimes return mixed formats such as images: [{url:"..."}] or {images:[...]}
 * - The normalized output is string[]
 */
function normalizeOgImages(input: unknown): string[] {
  const out: string[] = [];

  const pushIfString = (v: unknown) => {
    if (typeof v === 'string') {
      const s = v.trim();
      if (s) out.push(s);
    }
  };

  if (!input) return out;

  // direct array
  if (Array.isArray(input)) {
    for (const item of input) {
      if (typeof item === 'string') pushIfString(item);
      else if (item && typeof item === 'object' && !Array.isArray(item)) {
        // common shapes: { url: "..." } or { src: "..." }
        const anyObj = item as Record<string, unknown>;
        pushIfString(anyObj.url);
        pushIfString(anyObj.src);
      }
    }
    return out;
  }

  // object { images: [...] } or { url: '...' }
  if (typeof input === 'object') {
    const obj = input as Record<string, unknown>;
    if (Array.isArray(obj.images)) {
      return normalizeOgImages(obj.images);
    }
    pushIfString(obj.url);
    pushIfString(obj.src);
    return out;
  }

  // string
  pushIfString(input);
  return out;
}

/**
 * Parse helper for site_settings.seo / site_seo:
 *
 *  - input: value from DB (JSON string, object, etc.)
 *  - output: SeoObject
 *  - behavior:
 *      * validates with Zod
 *      * fills missing fields with DEFAULT_SEO_GLOBAL
 *      * open_graph.images normalize edilir (string[])
 *      * falls back to DEFAULT_SEO_GLOBAL when parsing fails
 */
export function parseSeoFromSettings(input: unknown): SeoObject {
  const base = DEFAULT_SEO_GLOBAL;

  if (input === null || input === undefined) return base;

  const raw = tryParseJson(input);

  try {
    const partial = seoSchema.partial().parse(raw) as Partial<SeoObject>;

    // normalize images (single source)
    const images = normalizeOgImages(partial.open_graph?.images);

    return {
      ...base,
      ...partial,
      open_graph: {
        ...base.open_graph,
        ...(partial.open_graph ?? {}),
        images: images.length ? images : base.open_graph.images,
      },
      twitter: {
        ...base.twitter,
        ...(partial.twitter ?? {}),
      },
      robots: {
        ...base.robots,
        ...(partial.robots ?? {}),
      },
    };
  } catch {
    return base;
  }
}

/**
 * site_settings.site_meta_default parse helper for GoldMoodAstro:
 *
 * Supported DB formats:
 *
 * A) New standard: one record per locale
 *    value = { "title":"...", "description":"...", "keywords":"..." }
 *
 * B) Legacy/alternative: map in a single record
 *    value = {
 *      "tr": { "title":"...", "description":"...", "keywords":"..." },
 *      "en": { ... },
 *      "de": { ... }
 *    }
 *
 * This helper normalizes both formats and returns:
 *   Record<string, SiteMetaDefaultObject>
 */
export function parseSiteMetaDefaultByLocale(
  input: unknown,
): Record<string, SiteMetaDefaultObject> {
  const base = DEFAULT_SITE_META_DEFAULT_BY_LOCALE;

  if (input === null || input === undefined) return base;

  const raw = tryParseJson(input);

  // Case A: direct object {title,description,...}
  // When the caller reads one DB record per locale, it may already know the locale;
  // this branch still normalizes the value to map format.
  const looksLikeSingle = (v: unknown) => {
    return (
      !!v &&
      typeof v === 'object' &&
      !Array.isArray(v) &&
      'title' in (v as any) &&
      'description' in (v as any)
    );
  };

  // Case B: map { tr:{...}, en:{...} }
  const looksLikeMap = (v: unknown) => {
    return !!v && typeof v === 'object' && !Array.isArray(v) && !looksLikeSingle(v);
  };

  // If it's a single meta object, we cannot know locale here; return base merged with "en" override as safest.
  // Prefer caller to use parseSiteMetaDefault(input) below when locale known.
  if (looksLikeSingle(raw)) {
    // validate single then merge as "en" override fallback
    try {
      const single = siteMetaDefaultSchema.parse(raw);
      return {
        ...base,
        en: single,
      };
    } catch {
      return base;
    }
  }

  if (!looksLikeMap(raw)) return base;

  const result: Record<string, SiteMetaDefaultObject> = {};

  for (const [locale, val] of Object.entries(raw as Record<string, unknown>)) {
    try {
      result[locale] = siteMetaDefaultSchema.parse(val);
    } catch {
      const fb = base[locale] || base.en || base.tr;
      if (fb) result[locale] = fb;
    }
  }

  for (const [loc, def] of Object.entries(base)) {
    if (!result[loc]) result[loc] = def;
  }

  return result;
}

/**
 * Practical helper for a single site_settings.site_meta_default record:
 * - input: value for that locale (single object)
 * - locale: 'tr' | 'en' | 'de' | ...
 */
export function parseSiteMetaDefault(input: unknown, locale: string): SiteMetaDefaultObject {
  const base =
    DEFAULT_SITE_META_DEFAULT_BY_LOCALE[locale] || DEFAULT_SITE_META_DEFAULT_BY_LOCALE.en;

  if (input === null || input === undefined) return base;

  const raw = tryParseJson(input);

  try {
    return siteMetaDefaultSchema.parse(raw);
  } catch {
    return base;
  }
}
