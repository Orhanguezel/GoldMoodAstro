// =============================================================
// FILE: src/modules/chat/repository.ts
// =============================================================

import { and, desc, eq, lt, sql } from "drizzle-orm";
import type { MySql2Database } from "drizzle-orm/mysql2";
import { chat_messages, chat_participants, chat_threads } from "./schema";

export function chatRepo(db: MySql2Database<Record<string, never>>) {
  return {
    async getThreadByContext(ctx: { context_type: string; context_id: string }) {
      const rows = await db
        .select()
        .from(chat_threads)
        .where(
          and(
            eq(chat_threads.context_type, ctx.context_type),
            eq(chat_threads.context_id, ctx.context_id),
          ),
        )
        .limit(1);
      return rows[0] ?? null;
    },

    async getThreadById(id: string) {
      const rows = await db
        .select()
        .from(chat_threads)
        .where(eq(chat_threads.id, id))
        .limit(1);
      return rows[0] ?? null;
    },

    async insertThread(row: typeof chat_threads.$inferInsert) {
      await db.insert(chat_threads).values(row);
      return row;
    },

    async listThreadsForUser(args: {
      user_id: string;
      limit: number;
      offset: number;
      context_type?: string;
      context_id?: string;
    }) {
      const where = and(
        eq(chat_participants.user_id, args.user_id),
        args.context_type
          ? eq(chat_threads.context_type, args.context_type)
          : undefined,
        args.context_id ? eq(chat_threads.context_id, args.context_id) : undefined,
      );

      const rows = await db
        .select({
          thread: chat_threads,
          participant: chat_participants,
        })
        .from(chat_participants)
        .innerJoin(chat_threads, eq(chat_threads.id, chat_participants.thread_id))
        .where(where)
        .orderBy(desc(chat_threads.updated_at))
        .limit(args.limit)
        .offset(args.offset);

      const totalRow = await db
        .select({ c: sql<number>`count(*)` })
        .from(chat_participants)
        .innerJoin(chat_threads, eq(chat_threads.id, chat_participants.thread_id))
        .where(where);

      return { rows, total: Number(totalRow?.[0]?.c ?? 0) };
    },

    async isParticipant(thread_id: string, user_id: string) {
      const rows = await db
        .select()
        .from(chat_participants)
        .where(
          and(eq(chat_participants.thread_id, thread_id), eq(chat_participants.user_id, user_id)),
        )
        .limit(1);
      return !!rows[0];
    },

    async upsertParticipant(row: typeof chat_participants.$inferInsert) {
      // MySQL upsert pattern: insert ignore + update optional
      // MVP: insert ignore is enough; role changes admin-only later.
      await db.insert(chat_participants).values(row).onDuplicateKeyUpdate({
        set: { last_read_at: row.last_read_at ?? null },
      });
    },

    async listMessages(args: {
      thread_id: string;
      limit: number;
      before?: Date;
    }) {
      const where = and(
        eq(chat_messages.thread_id, args.thread_id),
        args.before ? lt(chat_messages.created_at, args.before) : undefined,
      );

      // newest-first fetch then reverse on controller if needed
      const rows = await db
        .select()
        .from(chat_messages)
        .where(where)
        .orderBy(desc(chat_messages.created_at))
        .limit(args.limit);

      const totalRow = await db
        .select({ c: sql<number>`count(*)` })
        .from(chat_messages)
        .where(eq(chat_messages.thread_id, args.thread_id));

      return { rows, total: Number(totalRow?.[0]?.c ?? 0) };
    },

    async insertMessage(row: typeof chat_messages.$inferInsert) {
      await db.insert(chat_messages).values(row);
      return row;
    },

    async touchThreadUpdatedAt(thread_id: string, updated_at: Date) {
      await db
        .update(chat_threads)
        .set({ updated_at })
        .where(eq(chat_threads.id, thread_id));
    },
  };
}
