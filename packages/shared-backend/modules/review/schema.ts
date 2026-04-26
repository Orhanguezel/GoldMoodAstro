// =============================================================
// FILE: src/modules/review/schema.ts
// Danisman degerlendirme semasi
// target_type = 'consultant', target_id = consultants.id
// =============================================================
import {
  mysqlTable, char, varchar, text, boolean, int, tinyint, timestamp, index, foreignKey,
} from "drizzle-orm/mysql-core";
import { users } from "@goldmood/shared-backend/modules/auth/schema";

export const reviews = mysqlTable("reviews", {
  id: char("id", { length: 36 }).primaryKey().notNull(),

  // Değerlendirilen hedef (consultant)
  target_type: varchar("target_type", { length: 50 }).notNull().default('consultant'),
  target_id: char("target_id", { length: 36 }).notNull(),

  // Değerlendireni yapan kullanıcı
  user_id: char("user_id", { length: 36 }),

  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }),

  // Randevu bağlantısı (tamamlanmış randevu zorunlu)
  booking_id: char("booking_id", { length: 36 }),

  rating: tinyint("rating").notNull(), // 1..5
  comment: text("comment"),
  role: varchar("role", { length: 255 }),
  company: varchar("company", { length: 255 }),
  avatar_url: varchar("avatar_url", { length: 500 }),
  logo_url: varchar("logo_url", { length: 500 }),
  profile_href: varchar("profile_href", { length: 500 }),

  is_active: boolean("is_active").notNull().default(true),
  is_approved: boolean("is_approved").notNull().default(false),
  display_order: int("display_order").notNull().default(0),
  likes_count: int("likes_count").notNull().default(0),
  dislikes_count: int("dislikes_count").notNull().default(0),
  helpful_count: int("helpful_count").notNull().default(0),

  submitted_locale: varchar("submitted_locale", { length: 8 }).notNull().default('tr'),

  created_at: timestamp("created_at", { fsp: 3 }).notNull().defaultNow(),
  updated_at: timestamp("updated_at", { fsp: 3 }).notNull().defaultNow().onUpdateNow(),
},
(t) => [
  index("reviews_target_idx").on(t.target_type, t.target_id),
  index("reviews_user_idx").on(t.user_id),
  index("reviews_booking_idx").on(t.booking_id),
  index("reviews_approved_idx").on(t.is_approved),
  foreignKey({
    columns: [t.user_id],
    foreignColumns: [users.id],
    name: "fk_reviews_user",
  }).onDelete("cascade").onUpdate("cascade"),
]);

export type ReviewRow = typeof reviews.$inferSelect;
export type ReviewInsert = typeof reviews.$inferInsert;
export type ReviewView = Record<string, unknown>;
