// src/modules/kvkk/schema.ts
// FAZ 18 / T18 — KVKK uyumluluk: data export + account deletion

import {
  mysqlTable,
  char,
  varchar,
  datetime,
  mysqlEnum,
  index,
  uniqueIndex,
  foreignKey,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { users } from '@goldmood/shared-backend/modules/auth/schema';

export const accountDeletionRequests = mysqlTable(
  'account_deletion_requests',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    user_id: char('user_id', { length: 36 }).notNull(),
    requested_at: datetime('requested_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    scheduled_for: datetime('scheduled_for', { fsp: 3 }).notNull(),
    status: mysqlEnum('status', ['pending', 'cancelled', 'completed']).notNull().default('pending'),
    cancelled_at: datetime('cancelled_at', { fsp: 3 }),
    completed_at: datetime('completed_at', { fsp: 3 }),
    reason: varchar('reason', { length: 500 }),
    ip_address: varchar('ip_address', { length: 45 }),
    created_at: datetime('created_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`).$onUpdateFn(() => new Date()),
  },
  (t) => [
    uniqueIndex('adr_user_pending_uq').on(t.user_id, t.status),
    index('adr_scheduled_idx').on(t.scheduled_for, t.status),
    foreignKey({ columns: [t.user_id], foreignColumns: [users.id], name: 'fk_adr_user' }).onDelete('cascade').onUpdate('cascade'),
  ],
);

export type AccountDeletionRequest = typeof accountDeletionRequests.$inferSelect;
export type NewAccountDeletionRequest = typeof accountDeletionRequests.$inferInsert;
