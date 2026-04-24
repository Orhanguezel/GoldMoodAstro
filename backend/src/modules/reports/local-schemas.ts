// Local schema references for reports module
// resourcesI18n not in shared-backend, defined here for konigsmassage i18n pattern

import { mysqlTable, char, varchar, datetime, uniqueIndex, index } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export { resources } from '@vps/shared-backend/modules/resources/schema';
export { bookings } from '@vps/shared-backend/modules/bookings/schema';

export const resourcesI18n = mysqlTable(
  'resources_i18n',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    resource_id: char('resource_id', { length: 36 }).notNull(),
    locale: varchar('locale', { length: 10 }).notNull(),
    title: varchar('title', { length: 190 }).notNull(),
    created_at: datetime('created_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    uniqueIndex('ux_resources_i18n_unique').on(t.resource_id, t.locale),
    index('resources_i18n_resource_idx').on(t.resource_id),
    index('resources_i18n_locale_idx').on(t.locale),
  ],
);
