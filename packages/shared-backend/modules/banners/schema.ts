// src/modules/banners/schema.ts
// FAZ 12 / T12-1 — Drizzle schema for banners
// SQL kaynak: backend/src/db/sql/160_banners_schema.sql

import {
  mysqlTable,
  char,
  varchar,
  int,
  tinyint,
  datetime,
  mysqlEnum,
  index,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const banners = mysqlTable(
  "banners",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    code: varchar("code", { length: 50 }).notNull(),
    title_tr: varchar("title_tr", { length: 255 }),
    title_en: varchar("title_en", { length: 255 }),
    subtitle_tr: varchar("subtitle_tr", { length: 500 }),
    subtitle_en: varchar("subtitle_en", { length: 500 }),
    image_url: varchar("image_url", { length: 500 }).notNull(),
    image_url_mobile: varchar("image_url_mobile", { length: 500 }),
    link_url: varchar("link_url", { length: 500 }),
    cta_label_tr: varchar("cta_label_tr", { length: 100 }),
    cta_label_en: varchar("cta_label_en", { length: 100 }),
    placement: mysqlEnum("placement", [
      "home_hero", "home_sidebar", "home_footer", "consultant_list",
      "home_mid_1", "home_mid_2", "home_mid_3",
      "consultant_detail_top", "consultant_detail_bottom",
      "dashboard_top", "blog_sidebar", "blog_inline",
      "mobile_welcome", "mobile_home", "mobile_call_end", "admin_dashboard",
    ]).notNull(),
    locale: char("locale", { length: 8 }).notNull().default("*"),
    starts_at: datetime("starts_at", { fsp: 3 }),
    ends_at: datetime("ends_at", { fsp: 3 }),
    target_segment: mysqlEnum("target_segment", ["all", "free", "paid", "new_user", "existing_user"]).notNull().default("all"),
    campaign_id: char("campaign_id", { length: 36 }),
    priority: int("priority").notNull().default(0),
    is_active: tinyint("is_active").notNull().default(1),
    view_count: int("view_count").notNull().default(0),
    click_count: int("click_count").notNull().default(0),
    created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`).$onUpdateFn(() => new Date()),
  },
  (t) => [
    index("banners_placement_idx").on(t.placement, t.is_active, t.starts_at, t.ends_at),
    index("banners_locale_idx").on(t.locale, t.is_active),
    index("banners_campaign_idx").on(t.campaign_id),
  ]
);

export type Banner = typeof banners.$inferSelect;
export type NewBanner = typeof banners.$inferInsert;
