// src/modules/navigation/schema.ts
// FAZ B — Drizzle schema: footer_sections, footer_sections_i18n, menu_items, menu_items_i18n
// SQL kaynak: backend/src/db/sql/195_navigation_schema.sql

import {
  mysqlTable,
  char,
  varchar,
  text,
  int,
  tinyint,
  datetime,
  mysqlEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const footerSections = mysqlTable(
  "footer_sections",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    slug: varchar("slug", { length: 100 }).notNull(),
    is_active: tinyint("is_active").notNull().default(1),
    display_order: int("display_order").notNull().default(0),
    created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => ({
    slugUq: uniqueIndex("footer_sections_slug_uq").on(t.slug),
    activeOrderIdx: index("footer_sections_active_order_idx").on(t.is_active, t.display_order),
  }),
);

export const footerSectionsI18n = mysqlTable(
  "footer_sections_i18n",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    footer_section_id: char("footer_section_id", { length: 36 }).notNull(),
    locale: char("locale", { length: 8 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => ({
    uq: uniqueIndex("footer_sections_i18n_uq").on(t.footer_section_id, t.locale),
  }),
);

export const menuItems = mysqlTable(
  "menu_items",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    location: mysqlEnum("location", ["header", "footer"]).notNull(),
    section_id: char("section_id", { length: 36 }),
    parent_id: char("parent_id", { length: 36 }),
    type: mysqlEnum("type", ["page", "custom"]).notNull().default("custom"),
    page_id: char("page_id", { length: 36 }),
    url: varchar("url", { length: 500 }),
    icon: varchar("icon", { length: 100 }),
    is_active: tinyint("is_active").notNull().default(1),
    display_order: int("display_order").notNull().default(0),
    created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => ({
    locActiveOrderIdx: index("menu_items_loc_active_order_idx").on(
      t.location,
      t.is_active,
      t.display_order,
    ),
    sectionIdx: index("menu_items_section_idx").on(t.section_id),
    parentIdx: index("menu_items_parent_idx").on(t.parent_id),
  }),
);

export const menuItemsI18n = mysqlTable(
  "menu_items_i18n",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    menu_item_id: char("menu_item_id", { length: 36 }).notNull(),
    locale: char("locale", { length: 8 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => ({
    uq: uniqueIndex("menu_items_i18n_uq").on(t.menu_item_id, t.locale),
  }),
);

export type FooterSection = typeof footerSections.$inferSelect;
export type MenuItem = typeof menuItems.$inferSelect;
