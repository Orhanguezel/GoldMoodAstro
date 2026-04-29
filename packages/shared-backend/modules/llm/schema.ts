// =============================================================
// llm_prompts — admin'den düzenlenebilir LLM prompt şablonları
// =============================================================
import {
  mysqlTable, char, varchar, text, mysqlEnum, decimal, int, tinyint, datetime,
  uniqueIndex, index,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const llmPrompts = mysqlTable(
  'llm_prompts',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    key: varchar('key', { length: 80 }).notNull(),
    locale: varchar('locale', { length: 8 }).notNull().default('tr'),
    provider: mysqlEnum('provider', ['openai', 'anthropic', 'groq', 'azure', 'local']).notNull().default('anthropic'),
    model: varchar('model', { length: 120 }).notNull().default('claude-haiku-4-5'),
    temperature: decimal('temperature', { precision: 3, scale: 2 }).notNull().default('0.80'),
    max_tokens: int('max_tokens').notNull().default(800),
    system_prompt: text('system_prompt').notNull(),
    user_template: text('user_template').notNull(),
    safety_check: tinyint('safety_check').notNull().default(1),
    similarity_threshold: decimal('similarity_threshold', { precision: 3, scale: 2 }).notNull().default('0.85'),
    max_attempts: tinyint('max_attempts').notNull().default(3),
    notes: text('notes'),
    is_active: tinyint('is_active').notNull().default(1),
    created_at: datetime('created_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`).$onUpdateFn(() => new Date()),
  },
  (t) => [
    uniqueIndex('llm_prompts_key_locale_uq').on(t.key, t.locale),
    index('llm_prompts_active_idx').on(t.is_active),
  ],
);

// =============================================================
// astrology_kb — astrolog onaylı altın metinler
// =============================================================
import { json } from 'drizzle-orm/mysql-core';

export const astrologyKb = mysqlTable(
  'astrology_kb',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    kind: mysqlEnum('kind', [
      'planet_sign', 'planet_house', 'sign_house',
      'aspect', 'sign', 'house', 'planet',
      'transit', 'synastry', 'misc',
    ]).notNull(),
    key1: varchar('key1', { length: 40 }).notNull(),
    key2: varchar('key2', { length: 40 }),
    key3: varchar('key3', { length: 40 }),
    locale: varchar('locale', { length: 8 }).notNull().default('tr'),
    title: varchar('title', { length: 255 }).notNull(),
    content: text('content').notNull(),
    short_summary: varchar('short_summary', { length: 500 }),
    tone: mysqlEnum('tone', ['neutral', 'warm', 'professional', 'poetic', 'direct']).notNull().default('warm'),
    embedding: json('embedding'),
    source: varchar('source', { length: 255 }),
    author: varchar('author', { length: 120 }),
    is_active: tinyint('is_active').notNull().default(1),
    reviewed_by: char('reviewed_by', { length: 36 }),
    reviewed_at: datetime('reviewed_at', { fsp: 3 }),
    created_at: datetime('created_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`).$onUpdateFn(() => new Date()),
  },
  (t) => [
    uniqueIndex('astrology_kb_combo_uq').on(t.kind, t.key1, t.key2, t.key3, t.locale),
    index('astrology_kb_lookup_idx').on(t.kind, t.key1, t.key2, t.locale, t.is_active),
    index('astrology_kb_active_idx').on(t.is_active, t.kind),
  ],
);

export type LlmPromptRow = typeof llmPrompts.$inferSelect;
export type AstrologyKbRow = typeof astrologyKb.$inferSelect;
