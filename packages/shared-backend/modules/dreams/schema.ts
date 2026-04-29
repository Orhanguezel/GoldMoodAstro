// packages/shared-backend/modules/dreams/schema.ts
import {
  mysqlTable, char, varchar, text, json, datetime
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { users } from '../auth/schema';

export const dreamSymbols = mysqlTable('dream_symbols', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  nameTr: varchar('name_tr', { length: 100 }).notNull(),
  meaning: text('meaning').notNull(),
  category: json('category'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const dreamInterpretations = mysqlTable('dream_interpretations', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  userId: char('user_id', { length: 36 }).references(() => users.id, { onDelete: 'set null' }),
  dreamText: text('dream_text').notNull(),
  detectedSymbols: json('detected_symbols'),
  interpretation: text('interpretation'),
  locale: char('locale', { length: 8 }).notNull().default('tr'),
  embedding: json('embedding'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
});
