import {
  mysqlTable,
  char,
  varchar,
  decimal,
  datetime,
  uniqueIndex,
  index,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const geocodeCache = mysqlTable(
  'geocode_cache',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    q: varchar('q', { length: 255 }).notNull(),
    lat: decimal('lat', { precision: 9, scale: 6 }).notNull(),
    lng: decimal('lng', { precision: 9, scale: 6 }).notNull(),
    label: varchar('label', { length: 500 }).notNull(),
    ttl: datetime('ttl').notNull(),
    created_at: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
    updated_at: datetime('updated_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    uniqueIndex('geocode_cache_q_uq').on(t.q),
    index('geocode_cache_ttl_idx').on(t.ttl),
  ],
);

export type GeocodeCacheRow = typeof geocodeCache.$inferSelect;
