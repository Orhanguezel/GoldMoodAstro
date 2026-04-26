import {
  mysqlTable,
  char,
  varchar,
  date,
  time,
  decimal,
  smallint,
  json,
  datetime,
  uniqueIndex,
  index,
  foreignKey,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { users } from '@goldmood/shared-backend/modules/auth/schema';
import type { NatalChart } from '@goldmood/shared-backend/modules/astrology';

export const birthCharts = mysqlTable(
  'birth_charts',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    user_id: char('user_id', { length: 36 }).notNull(),
    name: varchar('name', { length: 120 }).notNull(),
    dob: date('dob').notNull(),
    tob: time('tob').notNull(),
    pob_lat: decimal('pob_lat', { precision: 9, scale: 6 }).notNull(),
    pob_lng: decimal('pob_lng', { precision: 9, scale: 6 }).notNull(),
    pob_label: varchar('pob_label', { length: 255 }).notNull(),
    tz_offset: smallint('tz_offset').notNull().default(0),
    chart_data: json('chart_data').$type<NatalChart>().notNull(),
    created_at: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
    updated_at: datetime('updated_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    uniqueIndex('birth_charts_user_name_uq').on(t.user_id, t.name),
    index('birth_charts_user_idx').on(t.user_id),
    foreignKey({
      columns: [t.user_id],
      foreignColumns: [users.id],
      name: 'fk_birth_charts_user',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  ],
);

export type BirthChartRow = typeof birthCharts.$inferSelect;
export type NewBirthChartRow = typeof birthCharts.$inferInsert;
