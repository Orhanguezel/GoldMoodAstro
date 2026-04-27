// src/modules/credits/schema.ts
// FAZ 10 / T10-2 — Drizzle schema for credit_packages + user_credits + credit_transactions
// SQL kaynak: backend/src/db/sql/082_credits_schema.sql

import {
  mysqlTable,
  char,
  varchar,
  int,
  tinyint,
  text,
  datetime,
  mysqlEnum,
  index,
  foreignKey,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { users } from "@goldmood/shared-backend/modules/auth/schema";

export const creditPackages = mysqlTable(
  "credit_packages",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    code: varchar("code", { length: 50 }).notNull(),
    name_tr: varchar("name_tr", { length: 255 }).notNull(),
    name_en: varchar("name_en", { length: 255 }).notNull(),
    description_tr: text("description_tr"),
    description_en: text("description_en"),
    price_minor: int("price_minor").notNull(),
    currency: char("currency", { length: 3 }).notNull().default("TRY"),
    credits: int("credits").notNull(),
    bonus_credits: int("bonus_credits").notNull().default(0),
    is_active: tinyint("is_active").notNull().default(1),
    is_featured: tinyint("is_featured").notNull().default(0),
    display_order: int("display_order").notNull().default(0),
    created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`).$onUpdateFn(() => new Date()),
  },
  (t) => [
    index("credit_packages_active_idx").on(t.is_active, t.display_order),
  ]
);

export const userCredits = mysqlTable(
  "user_credits",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    user_id: char("user_id", { length: 36 }).notNull(),
    balance: int("balance").notNull().default(0),
    currency: varchar("currency", { length: 20 }).notNull().default("TRY-CREDIT"),
    created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`).$onUpdateFn(() => new Date()),
  },
  (t) => [
    index("user_credits_user_unique").on(t.user_id),
    foreignKey({ columns: [t.user_id], foreignColumns: [users.id], name: "fk_user_credits_user" }).onDelete("cascade").onUpdate("cascade"),
  ]
);

export const creditTransactions = mysqlTable(
  "credit_transactions",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    user_id: char("user_id", { length: 36 }).notNull(),
    type: mysqlEnum("type", ["purchase", "consumption", "refund", "bonus", "adjustment"]).notNull(),
    amount: int("amount").notNull(),
    balance_after: int("balance_after").notNull(),
    reference_type: varchar("reference_type", { length: 50 }),
    reference_id: char("reference_id", { length: 36 }),
    order_id: char("order_id", { length: 36 }),
    description: varchar("description", { length: 500 }),
    created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    index("credit_tx_user_idx").on(t.user_id, t.created_at),
    index("credit_tx_ref_idx").on(t.reference_type, t.reference_id),
    foreignKey({ columns: [t.user_id], foreignColumns: [users.id], name: "fk_credit_tx_user" }).onDelete("cascade").onUpdate("cascade"),
  ]
);

export type CreditPackage = typeof creditPackages.$inferSelect;
export type NewCreditPackage = typeof creditPackages.$inferInsert;
export type UserCredit = typeof userCredits.$inferSelect;
export type NewUserCredit = typeof userCredits.$inferInsert;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type NewCreditTransaction = typeof creditTransactions.$inferInsert;
