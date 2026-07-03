import { char, datetime, mysqlTable } from 'drizzle-orm/mysql-core';

export const consultantPresence = mysqlTable('consultant_presence', {
  consultant_id: char('consultant_id', { length: 36 }).primaryKey().notNull(),
  last_heartbeat_at: datetime('last_heartbeat_at', { mode: 'date', fsp: 3 }).notNull(),
  became_online_at: datetime('became_online_at', { mode: 'date', fsp: 3 }),
  updated_at: datetime('updated_at', { mode: 'date', fsp: 3 }).notNull(),
});

