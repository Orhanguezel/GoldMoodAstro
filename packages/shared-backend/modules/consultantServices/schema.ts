// packages/shared-backend/modules/consultantServices/schema.ts
import { mysqlTable, char, varchar, text, int, tinyint, decimal, datetime, uniqueIndex, index } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const consultantServices = mysqlTable(
  'consultant_services',
  {
    id: char('id', { length: 36 }).notNull().primaryKey(),
    consultant_id: char('consultant_id', { length: 36 }).notNull(),
    name: varchar('name', { length: 160 }).notNull(),
    slug: varchar('slug', { length: 120 }).notNull(),
    description: text('description'),
    duration_minutes: int('duration_minutes').notNull().default(45),
    price: decimal('price', { precision: 10, scale: 2 }).notNull().default('0'),
    currency: varchar('currency', { length: 3 }).notNull().default('TRY'),
    is_free: tinyint('is_free').notNull().default(0),
    is_active: tinyint('is_active').notNull().default(1),
    sort_order: int('sort_order').notNull().default(0),
    created_at: datetime('created_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
  },
  (t) => ({
    uniq_slug: uniqueIndex('uniq_consultant_service_slug').on(t.consultant_id, t.slug),
    idx_consultant: index('idx_consultant_services_consultant').on(t.consultant_id),
    idx_active: index('idx_consultant_services_active').on(t.consultant_id, t.is_active, t.sort_order),
  }),
);

export type ConsultantService = typeof consultantServices.$inferSelect;
export type NewConsultantService = typeof consultantServices.$inferInsert;
