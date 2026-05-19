import { mysqlTable, char, varchar, text, int, tinyint, datetime, uniqueIndex, index } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const serviceCategories = mysqlTable(
  'service_categories',
  {
    id: char('id', { length: 36 }).notNull().primaryKey(),
    slug: varchar('slug', { length: 64 }).notNull(),
    name: varchar('name', { length: 120 }).notNull(),
    description: text('description'),
    icon: varchar('icon', { length: 64 }),
    sort_order: int('sort_order').notNull().default(0),
    is_active: tinyint('is_active').notNull().default(1),
    created_at: datetime('created_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
  },
  (t) => ({
    uniq_slug: uniqueIndex('uniq_service_category_slug').on(t.slug),
    idx_active: index('idx_service_categories_active').on(t.is_active, t.sort_order),
  }),
);

export type ServiceCategory = typeof serviceCategories.$inferSelect;
export type NewServiceCategory = typeof serviceCategories.$inferInsert;
