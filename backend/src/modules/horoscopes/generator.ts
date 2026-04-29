// backend/src/modules/horoscopes/generator.ts
// FAZ 9 + FAZ 20-T20-1 — LLM ile burç yorumu üretimi (daily/weekly/monthly).
// Cron her gece/hafta/ay çalışır, her burç için eksik period'ları doldurur.
// LLM hata verirse (API key yok, rate limit, vs.) o burç-period atlanır,
// loglanır, sonraki burca geçilir. KB'den sign profili otomatik çekilir.

import { randomUUID } from 'crypto';
import { db } from '@/db/client';
import { sql, and, eq } from 'drizzle-orm';
import { dailyHoroscopes, ALL_SIGNS, getPeriodStartDate, type HoroscopePeriod, type SignKey } from './schema';
import { generate, LlmError } from '@goldmood/shared-backend/modules/llm';

const SIGN_LABELS_TR: Record<SignKey, string> = {
  aries: 'Koç',
  taurus: 'Boğa',
  gemini: 'İkizler',
  cancer: 'Yengeç',
  leo: 'Aslan',
  virgo: 'Başak',
  libra: 'Terazi',
  scorpio: 'Akrep',
  sagittarius: 'Yay',
  capricorn: 'Oğlak',
  aquarius: 'Kova',
  pisces: 'Balık',
};

const PROMPT_KEYS: Record<HoroscopePeriod, string> = {
  daily: 'horoscope_daily_general',
  weekly: 'horoscope_weekly_general',
  monthly: 'horoscope_monthly_general',
  transit: 'horoscope_monthly_general', // şimdilik aynı template, ileride transit-spesifik
};

async function loadSignKbProfile(sign: SignKey, locale: string): Promise<string> {
  const [rows] = await (db as any).session.client.query(
    `SELECT title, content, short_summary FROM astrology_kb
     WHERE kind = 'sign' AND key1 = ? AND locale = ? AND is_active = 1 LIMIT 1`,
    [sign, locale],
  );
  const r = (rows as any[])[0];
  if (!r) return '(Astrolog metni henüz yok)';
  return `${r.title}\n\n${r.content}\n\n${r.short_summary ?? ''}`.trim();
}

async function existsHoroscope(args: {
  period: HoroscopePeriod;
  periodStart: string;
  sign: SignKey;
  locale: string;
}): Promise<boolean> {
  const rows = await db
    .select({ id: dailyHoroscopes.id })
    .from(dailyHoroscopes)
    .where(
      and(
        eq(dailyHoroscopes.period, args.period),
        eq(dailyHoroscopes.periodStartDate, args.periodStart as any),
        eq(dailyHoroscopes.sign, args.sign as any),
        eq(dailyHoroscopes.locale, args.locale),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

async function insertHoroscope(args: {
  period: HoroscopePeriod;
  periodStart: string;
  sign: SignKey;
  locale: string;
  content: string;
  promptId?: string | null;
}) {
  await db.insert(dailyHoroscopes).values({
    id: randomUUID(),
    period: args.period,
    periodStartDate: args.periodStart as any,
    sign: args.sign as any,
    locale: args.locale,
    content: args.content,
    source: 'llm',
    promptId: args.promptId ?? null,
  }).onDuplicateKeyUpdate({
    set: {
      content: args.content,
      source: 'llm',
      updatedAt: new Date(),
    },
  });
}

/**
 * Tek burç + tek period için yorum üret.
 * LLM hata verirse exception fırlatır — caller catch eder.
 */
export async function generateHoroscope(args: {
  sign: SignKey;
  period: HoroscopePeriod;
  locale?: string;
  /** Override: override edilmişse mevcut row üzerine yazar; yoksa skip */
  force?: boolean;
}): Promise<{ generated: boolean; reason?: string }> {
  const locale = args.locale || 'tr';
  const periodStart = getPeriodStartDate(args.period);

  if (!args.force) {
    const exists = await existsHoroscope({
      period: args.period,
      periodStart,
      sign: args.sign,
      locale,
    });
    if (exists) return { generated: false, reason: 'already_exists' };
  }

  const kbProfile = await loadSignKbProfile(args.sign, locale);
  const promptKey = PROMPT_KEYS[args.period];

  const today = new Date().toISOString().split('T')[0];
  const result = await generate({
    promptKey,
    locale,
    vars: {
      sign_key: args.sign,
      sign_label: SIGN_LABELS_TR[args.sign],
      kb_sign_profile: kbProfile,
      today,
      week_start: periodStart,
      month_start: periodStart,
    },
  });

  await insertHoroscope({
    period: args.period,
    periodStart,
    sign: args.sign,
    locale,
    content: result.content.trim(),
    promptId: result.promptId,
  });

  return { generated: true };
}

/** 12 burç × period için toplu üretim. Hata verenleri loglar, devam eder. */
export async function generateAllForPeriod(period: HoroscopePeriod, locale: string = 'tr'): Promise<{
  total: number;
  generated: number;
  skipped: number;
  failed: number;
}> {
  const stats = { total: ALL_SIGNS.length, generated: 0, skipped: 0, failed: 0 };

  for (const sign of ALL_SIGNS) {
    try {
      const res = await generateHoroscope({ sign, period, locale });
      if (res.generated) stats.generated++;
      else stats.skipped++;
    } catch (err) {
      stats.failed++;
      if (err instanceof LlmError) {
        console.warn(`[horoscope-gen] LLM error for ${period}/${sign}/${locale}:`, err.message);
      } else {
        console.warn(`[horoscope-gen] Failed ${period}/${sign}/${locale}:`, (err as Error).message);
      }
    }
  }
  return stats;
}

/** Geriye uyumluluk: eski API */
export async function generateDailyHoroscopes(_dateStr?: string) {
  return generateAllForPeriod('daily', 'tr');
}
