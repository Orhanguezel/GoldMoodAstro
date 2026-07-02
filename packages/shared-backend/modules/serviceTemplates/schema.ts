import { mysqlTable, char, varchar, text, int, tinyint, decimal, datetime, mysqlEnum, uniqueIndex, index } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const serviceTemplates = mysqlTable(
  'service_templates',
  {
    id: char('id', { length: 36 }).notNull().primaryKey(),
    category_slug: varchar('category_slug', { length: 64 }).notNull(),
    name: varchar('name', { length: 160 }).notNull(),
    slug: varchar('slug', { length: 120 }).notNull(),
    description: text('description'),
    duration_minutes: int('duration_minutes').notNull().default(45),
    price: decimal('price', { precision: 10, scale: 2 }).notNull().default('0'),
    currency: varchar('currency', { length: 3 }).notNull().default('TRY'),
    media_type: mysqlEnum('media_type', ['audio', 'video']).notNull().default('audio'),
    is_free: tinyint('is_free').notNull().default(0),
    sort_order: int('sort_order').notNull().default(0),
    is_active: tinyint('is_active').notNull().default(1),
    created_at: datetime('created_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
  },
  (t) => ({
    uniq_template: uniqueIndex('uniq_service_template').on(t.category_slug, t.slug),
    idx_category: index('idx_service_templates_cat').on(t.category_slug, t.is_active, t.sort_order),
  }),
);

export const serviceTemplatesI18n = mysqlTable(
  'service_templates_i18n',
  {
    id: char('id', { length: 36 }).notNull().primaryKey(),
    template_id: char('template_id', { length: 36 }).notNull(),
    locale: char('locale', { length: 8 }).notNull(),
    name: varchar('name', { length: 160 }).notNull(),
    description: text('description'),
    created_at: datetime('created_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
  },
  (t) => ({
    uniq_template_locale: uniqueIndex('service_templates_i18n_template_locale_uq').on(t.template_id, t.locale),
    idx_locale: index('service_templates_i18n_locale_idx').on(t.locale),
  }),
);

export type ServiceTemplate = typeof serviceTemplates.$inferSelect;
export type NewServiceTemplate = typeof serviceTemplates.$inferInsert;
export type ServiceTemplateI18n = typeof serviceTemplatesI18n.$inferSelect;
export type NewServiceTemplateI18n = typeof serviceTemplatesI18n.$inferInsert;
