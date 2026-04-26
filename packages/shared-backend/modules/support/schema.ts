// =============================================================
// FILE: src/modules/support/schema.ts
// =============================================================

import {
  mysqlTable,
  char,
  varchar,
  text,
  mysqlEnum,
  datetime,
  tinyint,
  index,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const supportTickets = mysqlTable(
  "support_tickets",
  {
    id: char("id", { length: 36 }).notNull().primaryKey(),
    user_id: char("user_id", { length: 36 }).notNull(),
    subject: varchar("subject", { length: 255 }).notNull(),
    message: text("message").notNull(),
    status: mysqlEnum("status", [
      "open",
      "in_progress",
      "waiting_response",
      "closed",
    ])
      .notNull()
      .default("open"),
    priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"])
      .notNull()
      .default("medium"),
    created_at: datetime("created_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime("updated_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index("idx_support_tickets_user").on(t.user_id),
    index("idx_support_tickets_created").on(t.created_at),
    index("idx_support_tickets_updated").on(t.updated_at),
    index("idx_support_tickets_status").on(t.status),
    index("idx_support_tickets_priority").on(t.priority),
  ],
);

export type SupportTicketRow = typeof supportTickets.$inferSelect;
export type SupportTicketInsert = typeof supportTickets.$inferInsert;

export const ticketReplies = mysqlTable(
  "ticket_replies",
  {
    id: char("id", { length: 36 }).notNull().primaryKey(),
    ticket_id: char("ticket_id", { length: 36 }).notNull(),
    user_id: char("user_id", { length: 36 }),
    message: text("message").notNull(),
    is_admin: tinyint("is_admin").notNull().default(0),
    created_at: datetime("created_at", { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
  },
  (t) => [
    index("idx_ticket_replies_ticket").on(t.ticket_id),
    index("idx_ticket_replies_created").on(t.created_at),
  ],
);

export type TicketReplyRow = typeof ticketReplies.$inferSelect;
export type TicketReplyInsert = typeof ticketReplies.$inferInsert;
