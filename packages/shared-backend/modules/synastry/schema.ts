// packages/shared-backend/modules/synastry/schema.ts
import {
  mysqlTable, char, varchar, mysqlEnum, datetime, json,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { users } from '../auth/schema';

export const synastryReports = mysqlTable('synastry_reports', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  userId: char('user_id', { length: 36 }).references(() => users.id, { onDelete: 'cascade' }),
  mode: varchar('mode', { length: 20 }).notNull(), // 'manual' | 'invite' | 'quick'
  partnerUserId: char('partner_user_id', { length: 36 }),
  partnerData: json('partner_data'),
  result: json('result'),
  inviteStatus: mysqlEnum('invite_status', ['pending', 'accepted', 'declined', 'expired']),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
});
