import {
  mysqlTable,
  char,
  text,
  json,
  decimal,
  int,
  mysqlEnum,
  tinyint,
  datetime,
  index,
  uniqueIndex,
  foreignKey,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { users } from '@goldmood/shared-backend/modules/auth/schema';

export const consultants = mysqlTable(
  'consultants',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    user_id: char('user_id', { length: 36 }).notNull(),
    bio: text('bio'),
    expertise: json('expertise').$type<string[]>(),
    languages: json('languages').$type<string[]>(),
    meeting_platforms: json('meeting_platforms').$type<string[]>(),
    social_links: json('social_links').$type<Record<string, string>>(),
    session_price: decimal('session_price', { precision: 10, scale: 2 }).notNull(),
    session_duration: int('session_duration').notNull().default(30),
    supports_video: tinyint('supports_video').default(0),
    video_session_price: decimal('video_session_price', { precision: 10, scale: 2 }),
    currency: char('currency', { length: 3 }).default('TRY'),
    approval_status: mysqlEnum('approval_status', ['pending', 'approved', 'rejected']).default(
      'pending',
    ),
    rejection_reason: text('rejection_reason'),
    is_available: tinyint('is_available').default(1),
    rating_avg: decimal('rating_avg', { precision: 3, scale: 2 }).default('0.00'),
    rating_count: int('rating_count').default(0),
    total_sessions: int('total_sessions').default(0),
    created_at: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
    updated_at: datetime('updated_at')
      .default(sql`CURRENT_TIMESTAMP`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    uniqueIndex('consultants_user_id_unique').on(t.user_id),
    index('consultants_approval_idx').on(t.approval_status),
    index('consultants_available_idx').on(t.is_available),
    foreignKey({
      columns: [t.user_id],
      foreignColumns: [users.id],
      name: 'fk_consultants_user',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  ],
);

export type ConsultantRow = typeof consultants.$inferSelect;
export type NewConsultantRow = typeof consultants.$inferInsert;
