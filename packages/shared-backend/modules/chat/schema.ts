// =============================================================
// FILE: src/modules/chat/schema.ts
// Projewin – Chat Schema (threads/participants/messages)
// Fastify + Drizzle (MySQL)
// =============================================================

import {
  mysqlTable,
  varchar,
  text,
  datetime,
  index,
  uniqueIndex,
  int,
  char,
} from "drizzle-orm/mysql-core";

export const chat_threads = mysqlTable(
  "chat_threads",
  {
    id: varchar("id", { length: 36 }).primaryKey(),

    context_type: varchar("context_type", { length: 20 }).notNull(), // job | request
    context_id: varchar("context_id", { length: 36 }).notNull(),

    created_by_user_id: varchar("created_by_user_id", { length: 36 }),
    created_at: datetime("created_at", { mode: "date" }).notNull(),
    updated_at: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (t) => ({
    // 1:1 sohbet context'leri (consultant_lead, support) için thread müşteri başına ayrı.
    // booking/job/request: created_by_user_id zaten her birinin doğal sahibidir.
    // Bu unique key, "aynı consultant'a iki müşteri mesaj attığında tek thread'e
    // birleşme" hatasını engeller.
    uq_ctx_creator: uniqueIndex("uq_chat_threads_ctx_creator").on(
      t.context_type,
      t.context_id,
      t.created_by_user_id,
    ),
    ix_ctx: index("ix_chat_threads_ctx").on(t.context_type, t.context_id),
    ix_updated: index("ix_chat_threads_updated").on(t.updated_at),
  }),
);

export const chat_participants = mysqlTable(
  "chat_participants",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    thread_id: varchar("thread_id", { length: 36 }).notNull(),
    user_id: varchar("user_id", { length: 36 }).notNull(),
    role: varchar("role", { length: 20 }).notNull(), // buyer|vendor|admin

    joined_at: datetime("joined_at", { mode: "date" }).notNull(),
    last_read_at: datetime("last_read_at", { mode: "date" }),
  },
  (t) => ({
    uq_thread_user: uniqueIndex("uq_chat_participants_thread_user").on(
      t.thread_id,
      t.user_id,
    ),
    ix_thread: index("ix_chat_participants_thread").on(t.thread_id),
    ix_user: index("ix_chat_participants_user").on(t.user_id),
  }),
);

export const chat_messages = mysqlTable(
  "chat_messages",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    thread_id: varchar("thread_id", { length: 36 }).notNull(),
    sender_user_id: varchar("sender_user_id", { length: 36 }).notNull(),

    client_id: varchar("client_id", { length: 64 }), // FE optimistic ack map
    text: text("text").notNull(),

    created_at: datetime("created_at", { mode: "date" }).notNull(),
  },
  (t) => ({
    ix_thread_time: index("ix_chat_messages_thread_time").on(
      t.thread_id,
      t.created_at,
    ),
    ix_sender_time: index("ix_chat_messages_sender_time").on(
      t.sender_user_id,
      t.created_at,
    ),
  }),
);

export const chat_blocks = mysqlTable('chat_blocks', {
  id: varchar('id', { length: 36 }).primaryKey(),
  blocker_user_id: char('blocker_user_id', { length: 36 }).notNull(),
  blocked_user_id: char('blocked_user_id', { length: 36 }).notNull(),
  created_at: datetime('created_at', { mode: 'date' }).notNull(),
}, (t) => ({
  uq_pair: uniqueIndex('uq_chat_blocks_pair').on(t.blocker_user_id, t.blocked_user_id),
  ix_blocked: index('ix_chat_blocks_blocked').on(t.blocked_user_id),
}));

export const chat_reports = mysqlTable('chat_reports', {
  id: varchar('id', { length: 36 }).primaryKey(),
  thread_id: varchar('thread_id', { length: 36 }).notNull(),
  message_id: varchar('message_id', { length: 36 }).notNull(),
  reporter_user_id: char('reporter_user_id', { length: 36 }).notNull(),
  reported_user_id: char('reported_user_id', { length: 36 }).notNull(),
  reason: varchar('reason', { length: 32 }).notNull(),
  details: text('details'),
  status: varchar('status', { length: 16 }).notNull(),
  created_at: datetime('created_at', { mode: 'date' }).notNull(),
}, (t) => ({
  uq_report: uniqueIndex('uq_chat_reports_reporter_message').on(t.reporter_user_id, t.message_id),
  ix_status: index('ix_chat_reports_status').on(t.status, t.created_at),
  ix_thread: index('ix_chat_reports_thread').on(t.thread_id),
  ix_message: index('ix_chat_reports_message').on(t.message_id),
  ix_reported: index('ix_chat_reports_reported').on(t.reported_user_id),
}));

export const chat_support_sessions = mysqlTable(
  "chat_support_sessions",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    thread_id: varchar("thread_id", { length: 36 }).notNull(),
    visitor_token_hash: varchar("visitor_token_hash", { length: 64 }),
    handoff_mode: varchar("handoff_mode", { length: 16 }).notNull(),
    ai_provider_preference: varchar("ai_provider_preference", { length: 20 }).notNull(),
    preferred_locale: varchar("preferred_locale", { length: 10 }),
    assigned_admin_user_id: varchar("assigned_admin_user_id", { length: 36 }),
    created_at: datetime("created_at", { mode: "date" }).notNull(),
    updated_at: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (t) => ({
    uq_thread: uniqueIndex("uq_chat_support_sessions_thread").on(t.thread_id),
    ix_mode: index("ix_chat_support_sessions_mode_updated").on(t.handoff_mode, t.updated_at),
  }),
);

export const chat_ai_message_meta = mysqlTable(
  "chat_ai_message_meta",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    message_id: varchar("message_id", { length: 36 }).notNull(),
    provider: varchar("provider", { length: 20 }).notNull(),
    model: varchar("model", { length: 100 }).notNull(),
    input_tokens: int("input_tokens").notNull().default(0),
    output_tokens: int("output_tokens").notNull().default(0),
    created_at: datetime("created_at", { mode: "date" }).notNull(),
  },
  (t) => ({ uq_message: uniqueIndex("uq_chat_ai_message_meta_message").on(t.message_id) }),
);

export const chat_ai_knowledge = mysqlTable(
  "chat_ai_knowledge",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    locale: varchar("locale", { length: 10 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content").notNull(),
    tags: text("tags"),
    is_active: int("is_active").notNull().default(1),
    priority: int("priority").notNull().default(100),
    created_at: datetime("created_at", { mode: "date" }).notNull(),
    updated_at: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (t) => ({ ix_locale: index("ix_chat_ai_knowledge_locale_active").on(t.locale, t.is_active, t.priority) }),
);

export type ChatThread = typeof chat_threads.$inferSelect;
export type ChatParticipant = typeof chat_participants.$inferSelect;
export type ChatMessage = typeof chat_messages.$inferSelect;

export type ChatThreadInsert = typeof chat_threads.$inferInsert;
export type ChatParticipantInsert = typeof chat_participants.$inferInsert;
export type ChatMessageInsert = typeof chat_messages.$inferInsert;
