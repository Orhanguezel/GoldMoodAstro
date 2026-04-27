// src/modules/reviewOutcomes/schema.ts
// FAZ 17 / T17-6 — Astrolog Karnesi (review outcomes)

import {
  mysqlTable,
  char,
  text,
  datetime,
  mysqlEnum,
  index,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const reviewOutcomes = mysqlTable(
  "review_outcomes",
  {
    id: char("id", { length: 36 }).primaryKey().notNull(),
    review_id: char("review_id", { length: 36 }).notNull(),
    user_id: char("user_id", { length: 36 }).notNull(),
    consultant_id: char("consultant_id", { length: 36 }).notNull(),
    follow_up_at: datetime("follow_up_at", { fsp: 3 }).notNull(),
    user_response: mysqlEnum("user_response", ["happened", "partially", "did_not_happen", "no_answer"]),
    user_response_at: datetime("user_response_at", { fsp: 3 }),
    notes: text("notes"),
    push_sent_at: datetime("push_sent_at", { fsp: 3 }),
    created_at: datetime("created_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`).$onUpdateFn(() => new Date()),
  },
  (t) => [
    index("review_outcomes_review_uq").on(t.review_id),
    index("review_outcomes_user_idx").on(t.user_id),
    index("review_outcomes_consultant_idx").on(t.consultant_id),
    index("review_outcomes_followup_idx").on(t.follow_up_at, t.user_response),
  ]
);

export type ReviewOutcome = typeof reviewOutcomes.$inferSelect;
export type NewReviewOutcome = typeof reviewOutcomes.$inferInsert;
