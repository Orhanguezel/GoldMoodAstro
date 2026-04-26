import { mysqlTable, char, date, text, json, varchar, datetime, uniqueIndex, index } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { users } from '../auth/schema';
import type { TransitChart } from '../astrology';

export const dailyReadings = mysqlTable(
  'daily_readings',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    user_id: char('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    chart_id: char('chart_id', { length: 36 }).notNull(),
    reading_date: date('reading_date').notNull(),
    content: text('content').notNull(),
    embedding: json('embedding').$type<number[]>(),
    transits_snapshot: json('transits_snapshot').$type<TransitChart>(),
    model_used: varchar('model_used', { length: 120 }),
    created_at: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
    updated_at: datetime('updated_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    uniqueIndex('daily_readings_user_date_uq').on(t.user_id, t.reading_date),
    index('daily_readings_user_chart_idx').on(t.user_id, t.chart_id),
    index('daily_readings_date_idx').on(t.reading_date),
  ],
);

export type NewDailyReadingRow = typeof dailyReadings.$inferInsert;
