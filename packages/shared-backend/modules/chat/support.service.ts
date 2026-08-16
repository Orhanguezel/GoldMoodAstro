import { createHash, randomBytes, randomUUID, timingSafeEqual } from "crypto";
import { and, asc, desc, eq, like, or, sql } from "drizzle-orm";
import { db as sharedDb } from "../../db/client";
import { siteSettings } from "../siteSettings/schema";
import { chat, type LlmProvider } from "../llm/provider";
import {
  chat_ai_knowledge,
  chat_ai_message_meta,
  chat_messages,
  chat_support_sessions,
  chat_threads,
} from "./schema";

export const AI_ASSISTANT_USER_ID = "00000000-0000-0000-0000-00000000a11f";
const SUPPORT_CONTEXT_ID = "00000000-0000-4000-8000-000000000001";
const recentPosts = new Map<string, number[]>();

type User = { id: string; role: "admin" | "buyer" | "vendor" } | null;
type ProviderPreference = "auto" | "groq" | "openai" | "anthropic";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function safeHashEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function enforceRateLimit(key: string) {
  const now = Date.now();
  const active = (recentPosts.get(key) ?? []).filter((stamp) => now - stamp < 60_000);
  if (active.length >= 12) {
    const error: any = new Error("chat_rate_limited");
    error.statusCode = 429;
    throw error;
  }
  active.push(now);
  recentPosts.set(key, active);
}

function envProviderAvailable(provider: ProviderPreference) {
  if (provider === "groq") return Boolean(process.env.GROQ_API_KEY?.trim());
  if (provider === "openai") return Boolean(process.env.OPENAI_API_KEY?.trim());
  if (provider === "anthropic") return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
  return false;
}

export function chatSupportService() {
  const db = sharedDb as any;

  async function settings(keys: string[]) {
    const rows = await db
      .select({ key: siteSettings.key, value: siteSettings.value })
      .from(siteSettings)
      .where(and(sql`${siteSettings.key} IN (${sql.join(keys.map((key) => sql`${key}`), sql`, `)})`, eq(siteSettings.locale, "*")));
    return Object.fromEntries(rows.map((row: any) => [String(row.key), String(row.value ?? "")]));
  }

  async function getSession(threadId: string) {
    const [row] = await db
      .select({ session: chat_support_sessions, thread: chat_threads })
      .from(chat_support_sessions)
      .innerJoin(chat_threads, eq(chat_threads.id, chat_support_sessions.thread_id))
      .where(eq(chat_support_sessions.thread_id, threadId))
      .limit(1);
    return row ?? null;
  }

  function present(row: any) {
    return {
      ...row.thread,
      handoff_mode: row.session.handoff_mode,
      ai_provider_preference: row.session.ai_provider_preference,
      preferred_locale: row.session.preferred_locale,
      assigned_admin_user_id: row.session.assigned_admin_user_id,
    };
  }

  async function authorize(row: any, user: User, visitorToken?: string) {
    if (user?.role === "admin" || (user?.id && row.thread.created_by_user_id === user.id)) return;
    const expected = row.session.visitor_token_hash;
    const actual = visitorToken ? hashToken(visitorToken) : "";
    if (!expected || !actual || !safeHashEqual(expected, actual)) {
      const error: any = new Error("forbidden_support_session");
      error.statusCode = 403;
      throw error;
    }
  }

  async function insertMessage(threadId: string, senderId: string, text: string, clientId?: string) {
    const now = new Date();
    const message = {
      id: randomUUID(),
      thread_id: threadId,
      sender_user_id: senderId,
      client_id: clientId ?? null,
      text,
      created_at: now,
    };
    await db.insert(chat_messages).values(message);
    await Promise.all([
      db.update(chat_threads).set({ updated_at: now }).where(eq(chat_threads.id, threadId)),
      db.update(chat_support_sessions).set({ updated_at: now }).where(eq(chat_support_sessions.thread_id, threadId)),
    ]);
    return message;
  }

  async function generateAiReply(row: any, locale: string) {
    const cfg = await settings([
      "chat_ai_enabled",
      "chat_ai_default_provider",
      "chat_ai_provider_order",
      "chat_ai_system_prompt",
      "chat_ai_groq_model",
      "chat_ai_openai_model",
      "chat_ai_anthropic_model",
    ]);
    if (String(cfg.chat_ai_enabled).toLowerCase() === "false") throw new Error("chat_ai_disabled");

    const requested = String(row.session.ai_provider_preference || cfg.chat_ai_default_provider || "auto") as ProviderPreference;
    const order = requested === "auto"
      ? String(cfg.chat_ai_provider_order || "anthropic,groq,openai").split(",").map((x) => x.trim())
      : [requested];
    const providers = order.filter((x): x is ProviderPreference => ["groq", "openai", "anthropic"].includes(x));

    const [messages, knowledge] = await Promise.all([
      db.select().from(chat_messages).where(eq(chat_messages.thread_id, row.thread.id)).orderBy(desc(chat_messages.created_at)).limit(16),
      // TR is the editorial source of truth and also serves as a fallback for
      // EN/DE; the model must still answer in the visitor's locale.
      db.select().from(chat_ai_knowledge).where(and(eq(chat_ai_knowledge.is_active, 1), or(eq(chat_ai_knowledge.locale, locale), eq(chat_ai_knowledge.locale, "*"), eq(chat_ai_knowledge.locale, "tr")))).orderBy(asc(chat_ai_knowledge.priority)).limit(60),
    ]);
    const history = [...messages].reverse().map((message: any) => `${message.sender_user_id === AI_ASSISTANT_USER_ID ? "Asistan" : "Kullanıcı"}: ${message.text}`).join("\n");
    const kb = knowledge.map((item: any) => `- ${item.title}: ${item.content}`).join("\n");
    const system = `${cfg.chat_ai_system_prompt || "GoldMoodAstro destek asistanısın."}\nYanıt dili: ${locale}.\nBilgi bankası:\n${kb || "Kayıt yok. Bilmediğin konularda canlı destek öner."}`;

    let lastError: unknown;
    for (const provider of providers) {
      if (!envProviderAvailable(provider)) continue;
      try {
        const model = cfg[`chat_ai_${provider}_model`] || (provider === "groq" ? "llama-3.3-70b-versatile" : provider === "openai" ? "gpt-4o-mini" : "claude-haiku-4-5-20251001");
        const result = await chat({ provider: provider as LlmProvider, model, system, user: history, temperature: 0.25, maxTokens: 500, timeoutMs: 30_000 });
        if (!result.content) throw new Error("empty_ai_response");
        const message = await insertMessage(row.thread.id, AI_ASSISTANT_USER_ID, result.content);
        await db.insert(chat_ai_message_meta).values({
          id: randomUUID(), message_id: message.id, provider: result.provider, model: result.model,
          input_tokens: result.usage?.input ?? 0, output_tokens: result.usage?.output ?? 0, created_at: new Date(),
        });
        return message;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError ?? new Error("no_chat_ai_provider_available");
  }

  return {
    async createSession(user: User, locale: string, suppliedToken?: string) {
      const token = suppliedToken?.trim() || randomBytes(32).toString("base64url");
      if (user?.id) {
        const [existing] = await db.select({ session: chat_support_sessions, thread: chat_threads })
          .from(chat_support_sessions).innerJoin(chat_threads, eq(chat_threads.id, chat_support_sessions.thread_id))
          .where(and(eq(chat_threads.context_type, "support"), eq(chat_threads.created_by_user_id, user.id))).orderBy(desc(chat_threads.updated_at)).limit(1);
        if (existing) return { thread: present(existing), visitor_token: null, viewer_sender_id: user.id };
      } else if (suppliedToken) {
        const [existing] = await db.select({ session: chat_support_sessions, thread: chat_threads })
          .from(chat_support_sessions).innerJoin(chat_threads, eq(chat_threads.id, chat_support_sessions.thread_id))
          .where(eq(chat_support_sessions.visitor_token_hash, hashToken(suppliedToken))).limit(1);
        if (existing) return { thread: present(existing), visitor_token: suppliedToken, viewer_sender_id: existing.session.id };
      }

      const now = new Date();
      const threadId = randomUUID();
      const session = { id: randomUUID(), thread_id: threadId, visitor_token_hash: user ? null : hashToken(token), handoff_mode: "ai", ai_provider_preference: "auto", preferred_locale: locale, assigned_admin_user_id: null, created_at: now, updated_at: now };
      const thread = { id: threadId, context_type: "support", context_id: SUPPORT_CONTEXT_ID, created_by_user_id: user?.id ?? null, created_at: now, updated_at: now };
      await db.transaction(async (tx: any) => { await tx.insert(chat_threads).values(thread); await tx.insert(chat_support_sessions).values(session); });
      return { thread: present({ thread, session }), visitor_token: user ? null : token, viewer_sender_id: user?.id ?? session.id };
    },

    async listMessages(threadId: string, user: User, visitorToken?: string) {
      const row = await getSession(threadId);
      if (!row) throw Object.assign(new Error("support_session_not_found"), { statusCode: 404 });
      await authorize(row, user, visitorToken);
      const items = await db.select().from(chat_messages).where(eq(chat_messages.thread_id, threadId)).orderBy(asc(chat_messages.created_at)).limit(200);
      return { thread: present(row), items };
    },

    async postMessage(threadId: string, user: User, visitorToken: string | undefined, text: string, clientId?: string) {
      const row = await getSession(threadId);
      if (!row) throw Object.assign(new Error("support_session_not_found"), { statusCode: 404 });
      await authorize(row, user, visitorToken);
      enforceRateLimit(user?.id || row.session.visitor_token_hash || threadId);
      const message = await insertMessage(threadId, user?.id || row.session.id, text, clientId);
      let ai_message: Awaited<ReturnType<typeof insertMessage>> | null = null;
      let handed_off = row.session.handoff_mode === "admin";
      if (!handed_off) {
        try {
          ai_message = await generateAiReply(row, row.session.preferred_locale || "tr");
          if (ai_message.text.includes("[CANLI_DESTEK]")) {
            const locale = row.session.preferred_locale || "tr";
            const handoffText = locale === "en"
              ? "I could not find a verified solution for this request. I have forwarded your message to our support team; an administrator will reply here."
              : locale === "de"
                ? "Ich konnte keine bestätigte Lösung für diese Anfrage finden. Ich habe Ihre Nachricht an unser Support-Team weitergeleitet; ein Administrator antwortet Ihnen hier."
                : "Bu talep için doğrulanmış bir çözüm bulamadım. Mesajınızı destek ekibimize ilettim; bir yönetici size buradan yanıt verecek.";
            await db.update(chat_messages).set({ text: handoffText }).where(eq(chat_messages.id, ai_message.id));
            ai_message.text = handoffText;
            handed_off = true;
            await db.update(chat_support_sessions).set({ handoff_mode: "admin", updated_at: new Date() }).where(eq(chat_support_sessions.thread_id, threadId));
          }
        }
        catch (error) {
          handed_off = true;
          await db.update(chat_support_sessions).set({ handoff_mode: "admin", updated_at: new Date() }).where(eq(chat_support_sessions.thread_id, threadId));
          console.error("[chat-ai] reply_failed", { threadId, error: error instanceof Error ? error.message : String(error) });
        }
      }
      return { message, ai_message, handed_off };
    },

    async requestAdmin(threadId: string, user: User, visitorToken?: string) {
      const row = await getSession(threadId);
      if (!row) throw Object.assign(new Error("support_session_not_found"), { statusCode: 404 });
      await authorize(row, user, visitorToken);
      await db.update(chat_support_sessions).set({ handoff_mode: "admin", updated_at: new Date() }).where(eq(chat_support_sessions.thread_id, threadId));
      return { thread: { ...present(row), handoff_mode: "admin" } };
    },

    getSession,
    present,
  };
}
