// packages/shared-backend/modules/coffee/schema.ts
import {
  mysqlTable, char, varchar, text, mysqlEnum, json, datetime
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { users } from '../auth/schema';

export const coffeeSymbols = mysqlTable('coffee_symbols', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  nameTr: varchar('name_tr', { length: 100 }).notNull(),
  meaning: text('meaning').notNull(),
  category: json('category'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const coffeeReadings = mysqlTable('coffee_readings', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  userId: char('user_id', { length: 36 }).references(() => users.id, { onDelete: 'set null' }),
  guestSessionId: varchar('guest_session_id', { length: 100 }),
  imageIds: json('image_ids').notNull(),
  detectedSymbols: json('detected_symbols'),
  interpretation: text('interpretation'),
  locale: char('locale', { length: 8 }).notNull().default('tr'),
  status: mysqlEnum('status', ['pending', 'processing', 'completed', 'failed']).default('pending'),
  embedding: json('embedding'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
});
