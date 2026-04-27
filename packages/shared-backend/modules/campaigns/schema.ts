// src/modules/campaigns/schema.ts
// FAZ 13 / T13-1 — Drizzle schema for campaigns + campaign_redemptions

import {
  mysqlTable,
  char,
  varchar,
  int,
  tinyint,
  text,
  decimal,
  json,
  datetime,
  mysqlEnum,
  index,
  foreignKey,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import { users } from "@goldmood/shared-backend/modules/auth/schema";

export const campaigns = mysqlTable(
  "campaigns",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    code: varchar("code", { length: 50 }).notNull(),
    name_tr: varchar("name_tr", { length: 255 }).notNull(),
    name_en: varchar("name_en", { length: 255 }).notNull(),
    description_tr: text("description_tr"),
    description_en: text("description_en"),
    type: mysqlEnum("type", ["discount_percentage", "discount_fixed", "bonus_credits", "free_trial_days"]).notNull(),
    value: decimal("value", { precision: 10, scale: 2 }).notNull(),
    max_uses: int("max_uses"),
    max_uses_per_user: int("max_uses_per_user").notNull().default(1),
    used_count: int("used_count").notNull().default(0),
    starts_at: datetime("starts_at", { fsp: 3 }),
    ends_at: datetime("ends_at", { fsp: 3 }),
    applies_to: mysqlEnum("applies_to", ["subscription", "credit_package", "consultant_booking", "all"]).notNull().default("all"),
    target_audience: json("target_audience"),
    is_active: tinyint("is_active").notNull().default(1),
    created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`).$onUpdateFn(() => new Date()),
  },
  (t) => [
    index("campaigns_active_idx").on(t.is_active, t.starts_at, t.ends_at),
    index("campaigns_applies_idx").on(t.applies_to, t.is_active),
  ]
);

export const campaignRedemptions = mysqlTable(
  "campaign_redemptions",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    campaign_id: char("campaign_id", { length: 36 }).notNull(),
    user_id: char("user_id", { length: 36 }).notNull(),
    order_id: char("order_id", { length: 36 }),
    value_applied: decimal("value_applied", { precision: 10, scale: 2 }).notNull(),
    redeemed_at: datetime("redeemed_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    index("campaign_red_campaign_idx").on(t.campaign_id),
    index("campaign_red_user_idx").on(t.user_id),
    index("campaign_red_order_idx").on(t.order_id),
    foreignKey({ columns: [t.campaign_id], foreignColumns: [campaigns.id], name: "fk_campaign_red_campaign" }).onDelete("cascade").onUpdate("cascade"),
    foreignKey({ columns: [t.user_id], foreignColumns: [users.id], name: "fk_campaign_red_user" }).onDelete("cascade").onUpdate("cascade"),
  ]
);

export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;
export type CampaignRedemption = typeof campaignRedemptions.$inferSelect;
export type NewCampaignRedemption = typeof campaignRedemptions.$inferInsert;
