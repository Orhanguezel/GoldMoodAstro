// =============================================================
// FILE: src/modules/resources/schema.ts
// FINAL — Resources schema (admin + bookings + availability)
// =============================================================

import {
  mysqlTable,
  char,
  varchar,
  tinyint,
  int,
  datetime,
  index,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const resources = mysqlTable(
  'resources',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),

    type: varchar('type', { length: 32 }).notNull().default('other'),
    title: varchar('title', { length: 255 }).notNull(),
    capacity: int('capacity').notNull().default(1),

    external_ref_id: char('external_ref_id', { length: 36 }),

    is_active: tinyint('is_active').notNull().default(1),

    created_at: datetime('created_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index('resources_type_idx').on(t.type),
    index('resources_active_idx').on(t.is_active),
    index('resources_title_idx').on(t.title),
    index('resources_extref_idx').on(t.external_ref_id),
    index('resources_created_idx').on(t.created_at),
    index('resources_updated_idx').on(t.updated_at),
  ],
);

export type ResourceRow = typeof resources.$inferSelect;
export type NewResourceRow = typeof resources.$inferInsert;
