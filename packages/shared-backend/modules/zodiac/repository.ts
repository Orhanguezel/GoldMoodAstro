import { getPool } from '../../db/client';

export const ZODIAC_SIGNS = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
] as const;

export type ZodiacSign = (typeof ZODIAC_SIGNS)[number];
export type ZodiacLocale = 'tr' | 'en' | 'de';

export type ZodiacSection = {
  id: string;
  kind: 'sign_section';
  key1: ZodiacSign;
  key2: string;
  title: string;
  content: string;
  short_summary: string | null;
};

export type ZodiacProfile = {
  id: string;
  kind: 'sign';
  key1: ZodiacSign;
  locale: string;
  title: string;
  content: string;
  short_summary: string | null;
  tone: string;
  source: string | null;
  author: string | null;
  image_url: string | null;
  sections: ZodiacSection[];
};

export function isZodiacSign(value: string): value is ZodiacSign {
  return (ZODIAC_SIGNS as readonly string[]).includes(value);
}

export function normalizeLocale(value?: string): ZodiacLocale {
  const locale = (value || 'tr').toLowerCase().split('-')[0];
  if (locale === 'en' || locale === 'de') return locale;
  return 'tr';
}

async function fetchProfile(sign: ZodiacSign, locale: ZodiacLocale): Promise<ZodiacProfile | null> {
  const pool = getPool();
  const [profileRows] = await pool.query(
    `SELECT id, kind, key1, locale, title, content, short_summary, tone, source, author, image_url
     FROM astrology_kb
     WHERE kind = 'sign' AND key1 = ? AND locale = ? AND is_active = 1
     ORDER BY updated_at DESC
     LIMIT 1`,
    [sign, locale],
  );

  const profile = (profileRows as any[])[0];
  if (!profile) return null;

  const [sectionRows] = await pool.query(
    `SELECT id, kind, key1, key2, title, content, short_summary
     FROM astrology_kb
     WHERE kind = 'sign_section' AND key1 = ? AND locale = ? AND is_active = 1
     ORDER BY FIELD(key2, 'personality', 'love', 'career', 'wellness'), key2 ASC, updated_at DESC`,
    [sign, locale],
  );

  return {
    id: String(profile.id),
    kind: 'sign',
    key1: profile.key1 as ZodiacSign,
    locale: String(profile.locale),
    title: String(profile.title),
    content: String(profile.content),
    short_summary: profile.short_summary ?? null,
    tone: profile.tone ?? 'warm',
    source: profile.source ?? null,
    author: profile.author ?? null,
    image_url: profile.image_url ?? null,
    sections: (sectionRows as any[]).map((row) => ({
      id: String(row.id),
      kind: 'sign_section',
      key1: row.key1 as ZodiacSign,
      key2: String(row.key2),
      title: String(row.title),
      content: String(row.content),
      short_summary: row.short_summary ?? null,
    })),
  };
}

export async function getZodiacProfile(sign: string, locale?: string): Promise<ZodiacProfile | null> {
  const normalizedSign = sign.toLowerCase();
  if (!isZodiacSign(normalizedSign)) return null;

  const requestedLocale = normalizeLocale(locale);
  const fallbackLocales: ZodiacLocale[] = requestedLocale === 'tr' ? ['tr', 'en'] : [requestedLocale, 'tr', 'en'];

  for (const candidate of fallbackLocales) {
    const profile = await fetchProfile(normalizedSign, candidate);
    if (profile) return profile;
  }

  return null;
}
