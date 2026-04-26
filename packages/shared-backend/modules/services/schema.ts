// Stub schema for bookings repository join compatibility.
// GoldMoodAstro does not use a services module; service_id in bookings is optional/null.

import { mysqlTable, char, varchar } from 'drizzle-orm/mysql-core';

export const services = mysqlTable('services', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  slug: varchar('slug', { length: 120 }).notNull(),
  is_active: char('is_active', { length: 1 }).notNull(),
});

export const servicesI18n = mysqlTable('services_i18n', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  service_id: char('service_id', { length: 36 }).notNull(),
  locale: varchar('locale', { length: 10 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
});
