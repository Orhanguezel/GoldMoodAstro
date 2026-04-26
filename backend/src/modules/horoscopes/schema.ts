// backend/src/modules/horoscopes/schema.ts

import { mysqlTable, char, date, mysqlEnum, text, tinyint, varchar, datetime, uniqueIndex } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const dailyHoroscopes = mysqlTable('daily_horoscopes', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  date: date('date').notNull(),
  sign: mysqlEnum('sign', [
    'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 
    'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
  ]).notNull(),
  contentTr: text('content_tr').notNull(),
  contentEn: text('content_en'),
  moodScore: tinyint('mood_score').default(5),
  luckyNumber: tinyint('lucky_number'),
  luckyColor: varchar('lucky_color', { length: 50 }),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at')
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdateFn(() => new Date()),
}, (table) => ({
  idxDateSign: uniqueIndex('idx_date_sign').on(table.date, table.sign),
}));
