import {
  mysqlTable,
  char,
  varchar,
  text,
  mysqlEnum,
  datetime,
  int,
  uniqueIndex,
  index,
  foreignKey,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { bookings } from '@goldmood/shared-backend/modules/bookings/schema';

export const voiceSessions = mysqlTable(
  'voice_sessions',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    booking_id: char('booking_id', { length: 36 }).notNull(),
    channel_name: varchar('channel_name', { length: 255 }).notNull(),
    token_user: text('token_user'),
    token_consultant: text('token_consultant'),
    status: mysqlEnum('status', ['pending', 'active', 'ended', 'missed']).default('pending'),
    started_at: datetime('started_at'),
    ended_at: datetime('ended_at'),
    duration_seconds: int('duration_seconds'),
    created_at: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    uniqueIndex('voice_sessions_booking_unique').on(t.booking_id),
    index('voice_sessions_status_idx').on(t.status),
    foreignKey({
      columns: [t.booking_id],
      foreignColumns: [bookings.id],
      name: 'fk_voice_sessions_booking',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  ],
);

export type VoiceSessionRow = typeof voiceSessions.$inferSelect;
export type NewVoiceSessionRow = typeof voiceSessions.$inferInsert;
