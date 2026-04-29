// packages/shared-backend/modules/numerology/schema.ts
import {
  mysqlTable, char, varchar, date, json, datetime, text
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { users } from '../auth/schema';

export const numerologyReadings = mysqlTable('numerology_readings', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  userId: char('user_id', { length: 36 }).references(() => users.id, { onDelete: 'set null' }),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  birthDate: date('birth_date').notNull(),
  calculationData: json('calculation_data').notNull(),
  interpretation: text('interpretation'),
  locale: char('locale', { length: 8 }).notNull().default('tr'),
  embedding: json('embedding'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
});
