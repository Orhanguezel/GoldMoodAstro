import { randomUUID } from "crypto";
import type { FastifyReply, FastifyRequest } from "fastify";
import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db as sharedDb } from "../../db/client";
import { chat_ai_knowledge, chat_messages, chat_support_sessions, chat_threads } from "./schema";
import { chatSupportService } from "./support.service";
import { ListMessagesQuerySchema, PostMessageBodySchema, ThreadIdParamsSchema } from "./validation";

const ProviderSchema = z.enum(["auto", "groq", "grok", "openai", "anthropic"]);
const ThreadListSchema = z.object({
  handoff_mode: z.enum(["ai", "admin"]).optional(),
  q: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
const KnowledgeParams = z.object({ id: z.string().uuid() });
const KnowledgeQuery = z.object({ locale: z.string().max(10).optional(), is_active: z.coerce.number().int().min(0).max(1).optional(), q: z.string().max(120).optional(), limit: z.coerce.number().int().min(1).max(200).default(100), offset: z.coerce.number().int().min(0).default(0) });
const KnowledgeCreate = z.object({ locale: z.string().min(1).max(10), title: z.string().trim().min(1).max(255), content: z.string().trim().min(1).max(20_000), tags: z.string().max(1000).nullable().optional(), priority: z.coerce.number().int().min(0).max(1000).default(100), is_active: z.coerce.number().int().min(0).max(1).default(1) });
const KnowledgeUpdate = KnowledgeCreate.partial();

function adminId(req: any) {
  return String(req.user?.id ?? req.user?.sub ?? "");
}

function setListHeaders(reply: FastifyReply, total: number, offset: number, limit: number) {
  reply.header("x-total-count", String(total));
  reply.header("content-range", `items ${offset}-${Math.max(offset, offset + limit - 1)}/${total}`);
}

export function chatAdminController() {
  const db = sharedDb as any;
  const support = chatSupportService();

  async function threadRow(id: string) {
    const row = await support.getSession(id);
    if (!row) throw Object.assign(new Error("support_session_not_found"), { statusCode: 404 });
    return row;
  }

  return {
    async adminListThreads(req: FastifyRequest, reply: FastifyReply) {
      const q = ThreadListSchema.parse((req as any).query ?? {});
      const where = and(
        q.handoff_mode ? eq(chat_support_sessions.handoff_mode, q.handoff_mode) : undefined,
        q.q ? sql`EXISTS (SELECT 1 FROM chat_messages search_message WHERE search_message.thread_id = ${chat_support_sessions.thread_id} AND search_message.text LIKE ${`%${q.q}%`})` : undefined,
      );
      const rows = await db.select({ session: chat_support_sessions, thread: chat_threads })
        .from(chat_support_sessions).innerJoin(chat_threads, eq(chat_threads.id, chat_support_sessions.thread_id))
        .where(where).orderBy(desc(chat_support_sessions.updated_at)).limit(q.limit).offset(q.offset);
      const [count] = await db.select({ c: sql<number>`count(*)` }).from(chat_support_sessions).where(where);
      setListHeaders(reply, Number(count?.c ?? 0), q.offset, q.limit);
      const items = await Promise.all(rows.map(async (row: any) => {
        const [last] = await db.select({ text: chat_messages.text, created_at: chat_messages.created_at })
          .from(chat_messages).where(eq(chat_messages.thread_id, row.thread.id)).orderBy(desc(chat_messages.created_at)).limit(1);
        const [messageCount] = await db.select({ c: sql<number>`count(*)` }).from(chat_messages).where(eq(chat_messages.thread_id, row.thread.id));
        return { ...support.present(row), last_message: last?.text ?? null, last_message_at: last?.created_at ?? null, message_count: Number(messageCount?.c ?? 0) };
      }));
      return { items };
    },

    async adminListMessages(req: FastifyRequest, reply: FastifyReply) {
      const { id } = ThreadIdParamsSchema.parse((req as any).params ?? {});
      const q = ListMessagesQuerySchema.parse((req as any).query ?? {});
      await threadRow(id);
      const rows = await db.select().from(chat_messages).where(eq(chat_messages.thread_id, id)).orderBy(desc(chat_messages.created_at)).limit(q.limit);
      const [count] = await db.select({ c: sql<number>`count(*)` }).from(chat_messages).where(eq(chat_messages.thread_id, id));
      setListHeaders(reply, Number(count?.c ?? 0), 0, q.limit);
      return { items: [...rows].reverse() };
    },

    async adminPostMessage(req: FastifyRequest) {
      const { id } = ThreadIdParamsSchema.parse((req as any).params ?? {});
      const body = PostMessageBodySchema.parse((req as any).body ?? {});
      await threadRow(id);
      const message = { id: randomUUID(), thread_id: id, sender_user_id: adminId(req), client_id: body.client_id ?? null, text: body.text, created_at: new Date() };
      await db.transaction(async (tx: any) => {
        await tx.insert(chat_messages).values(message);
        await tx.update(chat_threads).set({ updated_at: message.created_at }).where(eq(chat_threads.id, id));
        await tx.update(chat_support_sessions).set({ handoff_mode: "admin", assigned_admin_user_id: adminId(req), updated_at: message.created_at }).where(eq(chat_support_sessions.thread_id, id));
      });
      return { message };
    },

    async takeover(req: FastifyRequest) {
      const { id } = ThreadIdParamsSchema.parse((req as any).params ?? {});
      await threadRow(id);
      await db.update(chat_support_sessions).set({ handoff_mode: "admin", assigned_admin_user_id: adminId(req), updated_at: new Date() }).where(eq(chat_support_sessions.thread_id, id));
      return { thread: support.present(await threadRow(id)) };
    },

    async releaseToAi(req: FastifyRequest) {
      const { id } = ThreadIdParamsSchema.parse((req as any).params ?? {});
      const body = z.object({ provider: ProviderSchema.optional() }).parse((req as any).body ?? {});
      await threadRow(id);
      await db.update(chat_support_sessions).set({ handoff_mode: "ai", assigned_admin_user_id: null, ai_provider_preference: body.provider === "grok" ? "groq" : body.provider, updated_at: new Date() }).where(eq(chat_support_sessions.thread_id, id));
      return { thread: support.present(await threadRow(id)) };
    },

    async setProvider(req: FastifyRequest) {
      const { id } = ThreadIdParamsSchema.parse((req as any).params ?? {});
      const { provider } = z.object({ provider: ProviderSchema }).parse((req as any).body ?? {});
      await threadRow(id);
      await db.update(chat_support_sessions).set({ ai_provider_preference: provider === "grok" ? "groq" : provider, updated_at: new Date() }).where(eq(chat_support_sessions.thread_id, id));
      return { thread: support.present(await threadRow(id)) };
    },

    async listKnowledge(req: FastifyRequest, reply: FastifyReply) {
      const q = KnowledgeQuery.parse((req as any).query ?? {});
      const where = and(q.locale ? eq(chat_ai_knowledge.locale, q.locale) : undefined, q.is_active === undefined ? undefined : eq(chat_ai_knowledge.is_active, q.is_active), q.q ? or(like(chat_ai_knowledge.title, `%${q.q}%`), like(chat_ai_knowledge.content, `%${q.q}%`)) : undefined);
      const items = await db.select().from(chat_ai_knowledge).where(where).orderBy(asc(chat_ai_knowledge.priority), desc(chat_ai_knowledge.updated_at)).limit(q.limit).offset(q.offset);
      const [count] = await db.select({ c: sql<number>`count(*)` }).from(chat_ai_knowledge).where(where);
      setListHeaders(reply, Number(count?.c ?? 0), q.offset, q.limit);
      return { items };
    },
    async getKnowledge(req: FastifyRequest) {
      const { id } = KnowledgeParams.parse((req as any).params ?? {});
      const [item] = await db.select().from(chat_ai_knowledge).where(eq(chat_ai_knowledge.id, id)).limit(1);
      if (!item) throw Object.assign(new Error("knowledge_not_found"), { statusCode: 404 });
      return item;
    },
    async createKnowledge(req: FastifyRequest) {
      const body = KnowledgeCreate.parse((req as any).body ?? {}); const now = new Date();
      const item = { id: randomUUID(), ...body, tags: body.tags ?? null, created_at: now, updated_at: now };
      await db.insert(chat_ai_knowledge).values(item); return item;
    },
    async updateKnowledge(req: FastifyRequest) {
      const { id } = KnowledgeParams.parse((req as any).params ?? {}); const body = KnowledgeUpdate.parse((req as any).body ?? {});
      await db.update(chat_ai_knowledge).set({ ...body, updated_at: new Date() }).where(eq(chat_ai_knowledge.id, id));
      const [item] = await db.select().from(chat_ai_knowledge).where(eq(chat_ai_knowledge.id, id)).limit(1);
      if (!item) throw Object.assign(new Error("knowledge_not_found"), { statusCode: 404 }); return item;
    },
    async deleteKnowledge(req: FastifyRequest, reply: FastifyReply) {
      const { id } = KnowledgeParams.parse((req as any).params ?? {}); await db.delete(chat_ai_knowledge).where(eq(chat_ai_knowledge.id, id)); return reply.code(204).send();
    },
  };
}
