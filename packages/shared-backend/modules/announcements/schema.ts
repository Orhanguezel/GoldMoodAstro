// =============================================================
// FILE: src/modules/announcements/schema.ts
// =============================================================
import {
  mysqlTable,
  char,
  varchar,
  text,
  mysqlEnum,
  tinyint,
  datetime,
  index,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const announcements = mysqlTable(
  "announcements",
  {
    id: char("id", { length: 36 }).notNull().primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body").notNull(),
    audience: mysqlEnum("audience", ["all", "users", "consultants"])
      .notNull()
      .default("all"),
    is_active: tinyint("is_active").notNull().default(1),
    starts_at: datetime("starts_at", { fsp: 3 }),
    ends_at: datetime("ends_at", { fsp: 3 }),
    created_at: datetime("created_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index("idx_announcements_audience").on(t.audience),
    index("idx_announcements_active").on(t.is_active),
    index("idx_announcements_starts").on(t.starts_at),
    index("idx_announcements_ends").on(t.ends_at),
    index("idx_announcements_created").on(t.created_at),
  ],
);

export type AnnouncementRow = typeof announcements.$inferSelect;
export type NewAnnouncementRow = typeof announcements.$inferInsert;
