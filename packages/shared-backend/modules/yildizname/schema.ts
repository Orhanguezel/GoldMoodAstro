// FAZ 24 / T24-1 — Yıldızname Drizzle schema
// 28 Ay Menzili sistemi (Türk-İslam yıldızname geleneği)
import {
  mysqlTable, char, varchar, text, smallint, tinyint, int, json, datetime,
  uniqueIndex, index,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { users } from '../auth/schema';

export const yildiznameResults = mysqlTable(
  'yildizname_results',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    menzilNo: tinyint('menzil_no').notNull(),
    nameAr: varchar('name_ar', { length: 50 }).notNull(),
    nameTr: varchar('name_tr', { length: 80 }).notNull(),
    shortSummary: varchar('short_summary', { length: 255 }),
    content: text('content').notNull(),
    category: json('category'),
    isActive: tinyint('is_active').notNull().default(1),
    createdAt: datetime('created_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updatedAt: datetime('updated_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`).$onUpdateFn(() => new Date()),
  },
  (t) => [
    uniqueIndex('yildizname_results_menzil_uq').on(t.menzilNo),
    index('yildizname_results_active_idx').on(t.isActive),
  ],
);

export const yildiznameReadings = mysqlTable(
  'yildizname_readings',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    userId: char('user_id', { length: 36 }).references(() => users.id, { onDelete: 'set null' }),
    guestSessionId: varchar('guest_session_id', { length: 100 }),
    name: varchar('name', { length: 120 }).notNull(),
    motherName: varchar('mother_name', { length: 120 }).notNull(),
    birthYear: smallint('birth_year').notNull(),
    ebcedTotal: int('ebced_total').notNull(),
    menzilNo: tinyint('menzil_no').notNull(),
    resultText: text('result_text'),
    llmExtra: text('llm_extra'),
    locale: char('locale', { length: 8 }).notNull().default('tr'),
    createdAt: datetime('created_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    index('yildizname_readings_user_idx').on(t.userId),
    index('yildizname_readings_menzil_idx').on(t.menzilNo),
  ],
);

export type YildiznameResultRow = typeof yildiznameResults.$inferSelect;
export type YildiznameReadingRow = typeof yildiznameReadings.$inferSelect;
