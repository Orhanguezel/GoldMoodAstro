// backend/src/modules/horoscopes/schema.ts
// FAZ 9 + FAZ 20-T20-1 — Horoscope tablosu (period: daily/weekly/monthly/transit)

import {
  mysqlTable, char, date, mysqlEnum, text, tinyint, varchar, datetime,
  uniqueIndex, json,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const dailyHoroscopes = mysqlTable('daily_horoscopes', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  period: mysqlEnum('period', ['daily', 'weekly', 'monthly', 'transit']).notNull().default('daily'),
  periodStartDate: date('period_start_date').notNull(),
  sign: mysqlEnum('sign', [
    'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
    'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
  ]).notNull(),
  locale: char('locale', { length: 8 }).notNull().default('tr'),
  content: text('content').notNull(),
  moodScore: tinyint('mood_score').default(5),
  luckyNumber: tinyint('lucky_number'),
  luckyColor: varchar('lucky_color', { length: 50 }),
  source: mysqlEnum('source', ['llm', 'astrolog_manual', 'seed']).notNull().default('llm'),
  promptId: char('prompt_id', { length: 36 }),
  embedding: json('embedding'),
  createdAt: datetime('created_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt: datetime('updated_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`)
    .$onUpdateFn(() => new Date()),
}, (table) => ({
  uqPeriodSignLocale: uniqueIndex('horoscope_period_sign_locale_uq').on(
    table.period, table.periodStartDate, table.sign, table.locale,
  ),
}));

export type SignKey =
  | 'aries' | 'taurus' | 'gemini' | 'cancer'
  | 'leo' | 'virgo' | 'libra' | 'scorpio'
  | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';

export type HoroscopePeriod = 'daily' | 'weekly' | 'monthly' | 'transit';

export const ALL_SIGNS: SignKey[] = [
  'aries', 'taurus', 'gemini', 'cancer',
  'leo', 'virgo', 'libra', 'scorpio',
  'sagittarius', 'capricorn', 'aquarius', 'pisces',
];

/** Period için "period_start_date" hesapla:
 * - daily: aynı gün
 * - weekly: o haftanın Pazartesi'si (TR: hafta başı pazartesi)
 * - monthly: o ayın 1'i
 * - transit: o ayın 1'i (monthly ile aynı, ileride farklılaşabilir)
 */
export function getPeriodStartDate(period: HoroscopePeriod, ref: Date = new Date()): string {
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  if (period === 'daily') {
    return toIsoDate(d);
  }
  if (period === 'weekly') {
    const dow = d.getDay(); // 0=Sun..6=Sat
    const offset = dow === 0 ? -6 : 1 - dow; // pazartesi = +1 - dow
    const monday = new Date(d);
    monday.setDate(d.getDate() + offset);
    return toIsoDate(monday);
  }
  // monthly + transit
  return toIsoDate(new Date(d.getFullYear(), d.getMonth(), 1));
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
