import { char, datetime, decimal, int, mysqlEnum, mysqlTable, text, tinyint, varchar, index, uniqueIndex } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const consultantMediaSettings = mysqlTable('consultant_media_settings', {
  consultant_id: char('consultant_id', { length: 36 }).primaryKey().notNull(),
  audio_enabled: tinyint('audio_enabled').notNull().default(0),
  audio_price: decimal('audio_price', { precision: 10, scale: 2 }).notNull().default('0.00'),
  video_enabled: tinyint('video_enabled').notNull().default(0),
  video_price: decimal('video_price', { precision: 10, scale: 2 }).notNull().default('0.00'),
  reply_sla_hours: int('reply_sla_hours').notNull().default(72),
  updated_at: datetime('updated_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
});

export const mediaMessages = mysqlTable('media_messages', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  user_id: char('user_id', { length: 36 }).notNull(),
  consultant_id: char('consultant_id', { length: 36 }).notNull(),
  parent_id: char('parent_id', { length: 36 }),
  kind: mysqlEnum('kind', ['audio', 'video']).notNull(),
  direction: mysqlEnum('direction', ['question', 'reply']).notNull().default('question'),
  storage_bucket: varchar('storage_bucket', { length: 64 }).notNull().default('media_messages'),
  storage_path: varchar('storage_path', { length: 500 }).notNull(),
  duration_seconds: int('duration_seconds'),
  note: text('note'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull().default('0.00'),
  currency: varchar('currency', { length: 3 }).notNull().default('TRY'),
  charge_ref: varchar('charge_ref', { length: 64 }),
  status: mysqlEnum('status', ['sent', 'answered', 'expired', 'refunded']).notNull().default('sent'),
  reply_due_at: datetime('reply_due_at', { fsp: 3 }),
  answered_at: datetime('answered_at', { fsp: 3 }),
  created_at: datetime('created_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updated_at: datetime('updated_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
}, (t) => [
  index('mm_user_idx').on(t.user_id, t.created_at),
  index('mm_consultant_idx').on(t.consultant_id, t.status, t.created_at),
  index('mm_parent_idx').on(t.parent_id),
  index('mm_due_idx').on(t.status, t.reply_due_at),
  uniqueIndex('mm_charge_ref_uq').on(t.charge_ref),
]);

export type ConsultantMediaSettings = typeof consultantMediaSettings.$inferSelect;
export type MediaMessage = typeof mediaMessages.$inferSelect;

