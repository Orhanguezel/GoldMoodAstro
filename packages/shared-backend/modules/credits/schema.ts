// packages/shared-backend/modules/credits/schema.ts
import {
  mysqlTable, char, varchar, int, datetime, mysqlEnum, index, uniqueIndex, text
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { users } from '../auth/schema';

export const creditPackages = mysqlTable('credit_packages', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  nameTr: varchar('name_tr', { length: 255 }).notNull(),
  nameEn: varchar('name_en', { length: 255 }).notNull(),
  descriptionTr: text('description_tr'),
  descriptionEn: text('description_en'),
  priceMinor: int('price_minor').notNull(),
  currency: char('currency', { length: 3 }).default('TRY').notNull(),
  credits: int('credits').notNull(),
  bonusCredits: int('bonus_credits').default(0).notNull(),
  isActive: int('is_active').default(1).notNull(),
  isFeatured: int('is_featured').default(0).notNull(),
  displayOrder: int('display_order').default(0).notNull(),
  createdAt: datetime('created_at', { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt: datetime('updated_at', { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).$onUpdateFn(() => new Date()),
}, (t) => [
  uniqueIndex('credit_packages_code_uq').on(t.code),
  index('credit_packages_active_idx').on(t.isActive, t.displayOrder),
]);

export const userCredits = mysqlTable('user_credits', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  userId: char('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  balance: int('balance').default(0).notNull(),
  currency: varchar('currency', { length: 20 }).default('TRY-CREDIT').notNull(),
  createdAt: datetime('created_at', { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt: datetime('updated_at', { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`).$onUpdateFn(() => new Date()),
}, (t) => [
  uniqueIndex('user_credits_user_id_uq').on(t.userId),
]);

export const creditTransactions = mysqlTable('credit_transactions', {
  id: char('id', { length: 36 }).primaryKey().notNull(),
  userId: char('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: mysqlEnum('type', ['purchase', 'consumption', 'refund', 'bonus', 'adjustment']).notNull(),
  amount: int('amount').notNull(),
  balanceAfter: int('balance_after').notNull(),
  referenceType: varchar('reference_type', { length: 50 }),
  referenceId: char('reference_id', { length: 36 }),
  orderId: char('order_id', { length: 36 }),
  description: varchar('description', { length: 500 }),
  createdAt: datetime('created_at', { fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
}, (t) => [
  index('credit_tx_user_idx').on(t.userId, t.createdAt),
  index('credit_tx_ref_idx').on(t.referenceType, t.referenceId),
]);
