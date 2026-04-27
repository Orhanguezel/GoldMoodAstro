// src/modules/subscriptions/schema.ts
// FAZ 10 / T10-1 — Drizzle schema for subscription_plans + subscriptions
// SQL kaynak: backend/src/db/sql/065_subscriptions_schema.sql

import {
  mysqlTable,
  char,
  varchar,
  int,
  tinyint,
  text,
  json,
  datetime,
  mysqlEnum,
  index,
  foreignKey,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { users } from "@goldmood/shared-backend/modules/auth/schema";

export const subscriptionPlans = mysqlTable(
  "subscription_plans",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    code: varchar("code", { length: 50 }).notNull(),
    name_tr: varchar("name_tr", { length: 255 }).notNull(),
    name_en: varchar("name_en", { length: 255 }).notNull(),
    description_tr: text("description_tr"),
    description_en: text("description_en"),
    price_minor: int("price_minor").notNull(),
    currency: char("currency", { length: 3 }).notNull().default("TRY"),
    period: mysqlEnum("period", ["monthly", "yearly", "lifetime"]).notNull(),
    trial_days: int("trial_days").notNull().default(0),
    features: json("features"),
    is_active: tinyint("is_active").notNull().default(1),
    display_order: int("display_order").notNull().default(0),
    created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`).$onUpdateFn(() => new Date()),
  },
  (t) => [
    index("subscription_plans_active_idx").on(t.is_active, t.display_order),
  ]
);

export const subscriptions = mysqlTable(
  "subscriptions",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    user_id: char("user_id", { length: 36 }).notNull(),
    plan_id: char("plan_id", { length: 36 }).notNull(),
    provider: mysqlEnum("provider", ["iyzipay", "apple_iap", "google_iap", "manual"]).notNull().default("iyzipay"),
    provider_subscription_id: varchar("provider_subscription_id", { length: 255 }),
    provider_customer_id: varchar("provider_customer_id", { length: 255 }),
    status: mysqlEnum("status", ["pending", "active", "cancelled", "expired", "grace_period", "past_due"]).notNull().default("pending"),
    started_at: datetime("started_at", { fsp: 3 }),
    ends_at: datetime("ends_at", { fsp: 3 }),
    trial_ends_at: datetime("trial_ends_at", { fsp: 3 }),
    cancelled_at: datetime("cancelled_at", { fsp: 3 }),
    cancellation_reason: varchar("cancellation_reason", { length: 500 }),
    auto_renew: tinyint("auto_renew").notNull().default(1),
    price_minor: int("price_minor").notNull(),
    currency: char("currency", { length: 3 }).notNull().default("TRY"),
    created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`).$onUpdateFn(() => new Date()),
  },
  (t) => [
    index("subscriptions_user_idx").on(t.user_id, t.status),
    index("subscriptions_status_idx").on(t.status, t.ends_at),
    index("subscriptions_provider_idx").on(t.provider, t.provider_subscription_id),
    foreignKey({ columns: [t.user_id], foreignColumns: [users.id], name: "fk_subscriptions_user" }).onDelete("cascade").onUpdate("cascade"),
    foreignKey({ columns: [t.plan_id], foreignColumns: [subscriptionPlans.id], name: "fk_subscriptions_plan" }).onDelete("restrict").onUpdate("cascade"),
  ]
);

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type NewSubscriptionPlan = typeof subscriptionPlans.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
