// packages/shared-backend/modules/tarot/schema.ts
import {
  mysqlTable, char, varchar, int, text, mysqlEnum, json, datetime
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { users } from '../auth/schema';

export const tarotCards = mysqlTable('tarot_cards', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  nameTr: varchar('name_tr', { length: 100 }).notNull(),
  nameEn: varchar('name_en', { length: 100 }),
  arcana: mysqlEnum('arcana', ['major', 'minor']).notNull(),
  suit: mysqlEnum('suit', ['cups', 'pentacles', 'swords', 'wands', 'none']).default('none'),
  number: int('number'),
  uprightMeaning: text('upright_meaning').notNull(),
  reversedMeaning: text('reversed_meaning').notNull(),
  imageUrl: varchar('image_url', { length: 255 }),
  keywords: json('keywords'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`).$onUpdate(() => new Date()),
});

export const tarotReadings = mysqlTable('tarot_readings', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  userId: char('user_id', { length: 36 }).references(() => users.id, { onDelete: 'set null' }),
  guestSessionId: varchar('guest_session_id', { length: 100 }),
  spreadType: mysqlEnum('spread_type', ['one_card', 'three_card_general', 'three_card_decision', 'celtic_cross']).notNull(),
  cards: json('cards').notNull(), // Array of { card_id, is_reversed, position_name }
  question: text('question'),
  interpretation: text('interpretation'),
  locale: char('locale', { length: 8 }).notNull().default('tr'),
  source: mysqlEnum('source', ['llm', 'manual']).default('llm'),
  promptId: char('prompt_id', { length: 36 }),
  embedding: json('embedding'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
});
