// packages/shared-backend/modules/homeSections/schema.ts
import { mysqlTable, char, varchar, int, tinyint, json, datetime, uniqueIndex, index } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const homeSections = mysqlTable(
  'home_sections',
  {
    id: char('id', { length: 36 }).notNull().primaryKey(),
    slug: varchar('slug', { length: 80 }).notNull(),
    label: varchar('label', { length: 160 }).notNull(),
    component_key: varchar('component_key', { length: 80 }).notNull(),
    order_index: int('order_index').notNull().default(0),
    is_active: tinyint('is_active').notNull().default(1),
    config: json('config').$type<Record<string, unknown> | null>(),
    created_at: datetime('created_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
  },
  (t) => ({
    uniq_slug: uniqueIndex('uniq_home_sections_slug').on(t.slug),
    idx_order: index('idx_home_sections_order').on(t.order_index),
  }),
);

export type HomeSection = typeof homeSections.$inferSelect;
export type NewHomeSection = typeof homeSections.$inferInsert;
