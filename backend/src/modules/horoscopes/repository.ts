// backend/src/modules/horoscopes/repository.ts
// FAZ 9 + FAZ 20-T20-1 — Horoscope read API

import { db } from '@/db/client';
import { and, eq, desc } from 'drizzle-orm';
import {
  dailyHoroscopes,
  ALL_SIGNS,
  getPeriodStartDate,
  type HoroscopePeriod,
  type SignKey,
} from './schema';

export type SignInfo = {
  id: string;
  kind: 'sign';
  key1: SignKey;
  locale: string;
  title: string;
  content: string;
  short_summary: string | null;
  tone: string;
  source: string | null;
  sections: SignSection[];
};

export type SignSection = {
  id: string;
  key1: SignKey;
  key2: string;
  title: string;
  content: string;
  short_summary: string | null;
};

function isValidSign(s: string): s is SignKey {
  return (ALL_SIGNS as string[]).includes(s);
}

function isValidPeriod(p: string): p is HoroscopePeriod {
  return p === 'daily' || p === 'weekly' || p === 'monthly' || p === 'transit';
}

/**
 * astrology_kb'den genel burç profili + alt-konular.
 * sign_section'lar key2 (personality/love/career/health/compatibility) ile filtrelenir.
 */
export async function getSignInfo(sign: string, locale: string = 'tr'): Promise<SignInfo | null> {
  const s = sign.toLowerCase();
  if (!isValidSign(s)) return null;

  const [rows] = await (db as any).session.client.query(
    `SELECT id, key1, locale, title, content, short_summary, tone, source
     FROM astrology_kb
     WHERE kind = 'sign' AND key1 = ? AND locale = ? AND is_active = 1
     LIMIT 1`,
    [s, locale],
  );
  const main = (rows as any[])[0];
  if (!main) return null;

  const [sectionRows] = await (db as any).session.client.query(
    `SELECT id, key1, key2, title, content, short_summary
     FROM astrology_kb
     WHERE kind = 'sign_section' AND key1 = ? AND locale = ? AND is_active = 1
     ORDER BY key2 ASC`,
    [s, locale],
  );

  return {
    id: String(main.id),
    kind: 'sign',
    key1: main.key1 as SignKey,
    locale: main.locale,
    title: main.title,
    content: main.content,
    short_summary: main.short_summary ?? null,
    tone: main.tone ?? 'warm',
    source: main.source ?? null,
    sections: (sectionRows as any[]).map((r) => ({
      id: String(r.id),
      key1: r.key1 as SignKey,
      key2: r.key2,
      title: r.title,
      content: r.content,
      short_summary: r.short_summary ?? null,
    })),
  };
}

/**
 * Burç + period için yorum oku. Eğer yoksa null döner (cron henüz üretmemiştir).
 * Locale fallback: istenen locale yoksa 'tr' denenir.
 */
export async function getHoroscopeByPeriod(args: {
  sign: string;
  period: string;
  locale?: string;
  date?: string; // override (ISO YYYY-MM-DD) — yoksa period_start_date hesaplanır
}): Promise<{
  id: string;
  period: HoroscopePeriod;
  period_start_date: string;
  sign: SignKey;
  locale: string;
  content: string;
  mood_score: number | null;
  lucky_number: number | null;
  lucky_color: string | null;
  source: string;
  created_at: string;
} | null> {
  const sign = args.sign.toLowerCase();
  const locale = (args.locale || 'tr').toLowerCase();
  const period = args.period.toLowerCase();
  if (!isValidSign(sign) || !isValidPeriod(period)) return null;

  const periodStart = args.date || getPeriodStartDate(period as HoroscopePeriod);

  const tryFetch = async (loc: string) => {
    const rows = await db
      .select()
      .from(dailyHoroscopes)
      .where(
        and(
          eq(dailyHoroscopes.sign, sign as any),
          eq(dailyHoroscopes.period, period as any),
          eq(dailyHoroscopes.periodStartDate, periodStart as any),
          eq(dailyHoroscopes.locale, loc),
        ),
      )
      .limit(1);
    return rows[0];
  };

  let row = await tryFetch(locale);
  if (!row && locale !== 'tr') row = await tryFetch('tr');
  if (!row) return null;

  return {
    id: String(row.id),
    period: row.period as HoroscopePeriod,
    period_start_date: String(row.periodStartDate),
    sign: row.sign as SignKey,
    locale: row.locale,
    content: row.content,
    mood_score: row.moodScore ?? null,
    lucky_number: row.luckyNumber ?? null,
    lucky_color: row.luckyColor ?? null,
    source: row.source,
    created_at: String(row.createdAt),
  };
}

/** Eski API geriye uyumlu: getDailyHoroscope(sign, dateStr?) */
export async function getDailyHoroscope(sign: string, dateStr?: string) {
  return getHoroscopeByPeriod({ sign, period: 'daily', date: dateStr, locale: 'tr' });
}

/** En son N daily horoscope (admin/dashboard için) */
export async function getRecentHoroscopes(limit: number = 12) {
  const rows = await db
    .select()
    .from(dailyHoroscopes)
    .orderBy(desc(dailyHoroscopes.createdAt))
    .limit(limit);
  return rows;
}

export async function getCompatibilityReading(signA: string, signB: string, locale: string = 'tr') {
  const a = signA.toLowerCase();
  const b = signB.toLowerCase();
  if (!isValidSign(a) || !isValidSign(b)) return null;

  // Try signA-signB
  const [rows] = await (db as any).session.client.query(
    `SELECT * FROM compatibility_readings WHERE sign_a = ? AND sign_b = ? AND locale = ? LIMIT 1`,
    [a, b, locale]
  );
  const row = (rows as any[])[0];
  if (row) return row;

  // Try signB-signA (symmetric)
  const [rowsRev] = await (db as any).session.client.query(
    `SELECT * FROM compatibility_readings WHERE sign_a = ? AND sign_b = ? AND locale = ? LIMIT 1`,
    [b, a, locale]
  );
  return (rowsRev as any[])[0] || null;
}

export async function getHoroscopesForTransit(month: string, locale: string = 'tr') {
  // month: "2026-05" -> periodStartDate: "2026-05-01"
  const periodStartDate = `${month}-01`;
  
  const rows = await db
    .select()
    .from(dailyHoroscopes)
    .where(
      and(
        eq(dailyHoroscopes.period, 'transit'),
        eq(dailyHoroscopes.periodStartDate, periodStartDate as any),
        eq(dailyHoroscopes.locale, locale)
      )
    );
    
  return rows;
}
