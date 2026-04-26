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

export const liveSessions = mysqlTable(
  'live_sessions',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    booking_id: char('booking_id', { length: 36 }).notNull(),
    room_name: varchar('room_name', { length: 255 }).notNull(),
    host_token: text('host_token'),
    guest_token: text('guest_token'),
    media_type: mysqlEnum('media_type', ['audio', 'video']).default('audio'),
    started_at: datetime('started_at'),
    ended_at: datetime('ended_at'),
    duration_seconds: int('duration_seconds'),
    recording_url: text('recording_url'),
    recording_started_at: datetime('recording_started_at'),
    status: mysqlEnum('status', ['pending', 'active', 'ended', 'timed_out', 'cancelled']).default(
      'pending',
    ),
    created_at: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
    updated_at: datetime('updated_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex('live_sessions_booking_unique').on(t.booking_id),
    index('live_sessions_booking_idx').on(t.booking_id),
    index('live_sessions_status_idx').on(t.status),
    foreignKey({
      columns: [t.booking_id],
      foreignColumns: [bookings.id],
      name: 'fk_live_sessions_booking',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  ],
);

export type LiveSessionRow = typeof liveSessions.$inferSelect;
export type NewLiveSessionRow = typeof liveSessions.$inferInsert;
