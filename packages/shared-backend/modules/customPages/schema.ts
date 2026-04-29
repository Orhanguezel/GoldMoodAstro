// src/modules/customPages/schema.ts
// Drizzle schema: custom_pages + custom_pages_i18n
// SQL kaynak: backend/src/db/sql/197_custom_pages_schema.sql

import {
  mysqlTable,
  char,
  varchar,
  text,
  longtext,
  int,
  tinyint,
  datetime,
  json,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const customPages = mysqlTable(
  "custom_pages",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    module_key: varchar("module_key", { length: 64 }).notNull().default("page"),
    is_published: tinyint("is_published").notNull().default(1),
    featured: tinyint("featured").notNull().default(0),
    featured_image: varchar("featured_image", { length: 500 }),
    featured_image_asset_id: char("featured_image_asset_id", { length: 36 }),
    display_order: int("display_order").notNull().default(0),
    order_num: int("order_num").notNull().default(0),
    image_url: varchar("image_url", { length: 500 }),
    storage_asset_id: char("storage_asset_id", { length: 36 }),
    images: json("images"),
    storage_image_ids: json("storage_image_ids"),
    created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => ({
    moduleIdx: index("custom_pages_module_idx").on(t.module_key),
    pubOrderIdx: index("custom_pages_pub_order_idx").on(t.is_published, t.display_order),
  }),
);

export const customPagesI18n = mysqlTable(
  "custom_pages_i18n",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    custom_page_id: char("custom_page_id", { length: 36 }).notNull(),
    locale: char("locale", { length: 8 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 160 }).notNull(),
    content: longtext("content"),
    summary: text("summary"),
    featured_image_alt: varchar("featured_image_alt", { length: 255 }),
    meta_title: varchar("meta_title", { length: 255 }),
    meta_description: varchar("meta_description", { length: 500 }),
    tags: varchar("tags", { length: 500 }),
    created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => ({
    pidLocaleUq: uniqueIndex("custom_pages_i18n_pid_locale_uq").on(t.custom_page_id, t.locale),
    slugLocaleUq: uniqueIndex("custom_pages_i18n_slug_locale_uq").on(t.slug, t.locale),
  }),
);

export type CustomPage = typeof customPages.$inferSelect;
export type CustomPageI18n = typeof customPagesI18n.$inferSelect;
