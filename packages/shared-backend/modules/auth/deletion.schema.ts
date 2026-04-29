// packages/shared-backend/modules/auth/deletion.schema.ts
import {
  mysqlTable, char, datetime, mysqlEnum, varchar, index, uniqueIndex
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { users } from './schema';

export const accountDeletionRequests = mysqlTable('account_deletion_requests', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  userId: char('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  requestedAt: datetime('requested_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  scheduledFor: datetime('scheduled_for', { fsp: 3 }).notNull(),
  status: mysqlEnum('status', ['pending', 'cancelled', 'completed']).notNull().default('pending'),
  cancelledAt: datetime('cancelled_at', { fsp: 3 }),
  completedAt: datetime('completed_at', { fsp: 3 }),
  reason: varchar('reason', { length: 500 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: datetime('created_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt: datetime('updated_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`).$onUpdateFn(() => new Date()),
}, (t) => [
  uniqueIndex('adr_user_pending_uq').on(t.userId, t.status),
  index('adr_scheduled_idx').on(t.scheduledFor, t.status),
]);
