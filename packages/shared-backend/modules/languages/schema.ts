import { mysqlTable, char, varchar, int, tinyint, datetime, uniqueIndex, index } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const languages = mysqlTable(
  'languages',
  {
    id: char('id', { length: 36 }).notNull().primaryKey(),
    slug: varchar('slug', { length: 8 }).notNull(),
    name_tr: varchar('name_tr', { length: 50 }).notNull(),
    name_en: varchar('name_en', { length: 50 }).notNull(),
    name_de: varchar('name_de', { length: 50 }),
    sort_order: int('sort_order').notNull().default(0),
    is_active: tinyint('is_active').notNull().default(1),
    created_at: datetime('created_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
  },
  (t) => ({
    uniq_slug: uniqueIndex('uniq_languages_slug').on(t.slug),
    idx_active: index('idx_languages_active').on(t.is_active, t.sort_order),
  }),
);

export type Language = typeof languages.$inferSelect;
export type NewLanguage = typeof languages.$inferInsert;
