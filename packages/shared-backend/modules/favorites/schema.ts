import { sql } from 'drizzle-orm';
import { char, datetime, index, mysqlTable, uniqueIndex } from 'drizzle-orm/mysql-core';

export const userFavorites = mysqlTable(
  'user_favorites',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    user_id: char('user_id', { length: 36 }).notNull(),
    consultant_id: char('consultant_id', { length: 36 }).notNull(),
    online_notified_at: datetime('online_notified_at', { fsp: 3 }),
    created_at: datetime('created_at', { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (table) => ({
    userConsultantUq: uniqueIndex('uf_user_consultant_uq').on(table.user_id, table.consultant_id),
    consultantIdx: index('uf_consultant_idx').on(table.consultant_id),
  }),
);

export type UserFavorite = typeof userFavorites.$inferSelect;
export type NewUserFavorite = typeof userFavorites.$inferInsert;
