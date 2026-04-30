// =============================================================
// FILE: src/modules/chat/service.ts
// =============================================================

import type { FastifyInstance } from "fastify";

type WebSocket = {
  send(data: string): void;
  close(): void;
  readyState: number;
  on(event: string, handler: (...args: any[]) => void): void;
};
import { randomUUID } from "crypto";
import { chatRepo } from "./repository";
import type { ChatRole } from "./validation";
import { db as sharedDb } from "../../db/client";

type AuthedUser = {
  id: string;
  role: "admin" | "buyer" | "vendor";
};

type WsConn = {
  ws: WebSocket;
  user: AuthedUser;
  thread_id: string;
  tokens: number;
  lastRefillMs: number;
};

const TOKEN_BUCKET_CAP = 10; // 10 messages burst
const TOKEN_REFILL_PER_SEC = 5; // 5 msg / sec

function refill(conn: WsConn, nowMs: number) {
  const elapsed = Math.max(0, nowMs - conn.lastRefillMs) / 1000;
  const add = elapsed * TOKEN_REFILL_PER_SEC;
  conn.tokens = Math.min(TOKEN_BUCKET_CAP, conn.tokens + add);
  conn.lastRefillMs = nowMs;
}

function roleToChatRole(r: AuthedUser["role"]): ChatRole {
  if (r === "admin") return "admin";
  if (r === "vendor") return "vendor";
  return "buyer";
}

export function chatService(app: FastifyInstance) {
  // shared-backend standart db/client kullan (app.db pattern eski monorepo'dan kalma).
  const db = sharedDb as any;
  const repo = chatRepo(db);

  // In-memory WS registry (MVP). Later: Redis pub/sub.
  const connsByThread = new Map<string, Set<WsConn>>();

  function addConn(c: WsConn) {
    const set = connsByThread.get(c.thread_id) ?? new Set<WsConn>();
    set.add(c);
    connsByThread.set(c.thread_id, set);
  }

  function removeConn(c: WsConn) {
    const set = connsByThread.get(c.thread_id);
    if (!set) return;
    set.delete(c);
    if (set.size === 0) connsByThread.delete(c.thread_id);
  }

  async function assertMember(thread_id: string, user_id: string) {
    const ok = await repo.isParticipant(thread_id, user_id);
    if (!ok) {
      const err: any = new Error("forbidden_thread_membership");
      err.statusCode = 403;
      throw err;
    }
  }

  async function postMessageInternal(
    user: AuthedUser,
    thread_id: string,
    body: { text: string; client_id?: string },
  ) {
    await assertMember(thread_id, user.id);

    const now = new Date();
    const msg = {
      id: randomUUID(),
      thread_id,
      sender_user_id: user.id,
      client_id: body.client_id ?? null,
      text: body.text,
      created_at: now,
    };

    await repo.insertMessage(msg);
    await repo.touchThreadUpdatedAt(thread_id, now);

    // broadcast to all WS clients on the thread
    const set = connsByThread.get(thread_id);
    if (set?.size) {
      const payload = JSON.stringify({
        type: "message",
        message: {
          id: msg.id,
          thread_id: msg.thread_id,
          sender_user_id: msg.sender_user_id,
          text: msg.text,
          client_id: msg.client_id,
          created_at: msg.created_at.toISOString(),
        },
      });

      for (const c of set) {
        if (c.ws.readyState === (c.ws as any).OPEN) c.ws.send(payload);
      }
    }

    return msg;
  }

  return {
    repo,

    async getOrCreateThread(args: {
      context_type: "job" | "request" | "consultant_lead" | "booking" | "support";
      context_id: string;
      created_by: AuthedUser;
    }) {
      const existing = await repo.getThreadByContext({
        context_type: args.context_type,
        context_id: args.context_id,
      });

      if (existing) {
        await repo.upsertParticipant({
          id: randomUUID(),
          thread_id: existing.id,
          user_id: args.created_by.id,
          role: roleToChatRole(args.created_by.role),
          joined_at: new Date(),
          last_read_at: null,
        });
        return existing;
      }

      const now = new Date();
      const thread = {
        id: randomUUID(),
        context_type: args.context_type,
        context_id: args.context_id,
        created_by_user_id: args.created_by.id,
        created_at: now,
        updated_at: now,
      };

      await repo.insertThread(thread);

      await repo.upsertParticipant({
        id: randomUUID(),
        thread_id: thread.id,
        user_id: args.created_by.id,
        role: roleToChatRole(args.created_by.role),
        joined_at: now,
        last_read_at: null,
      });

      return thread;
    },

    async listThreadsForUser(
      user: AuthedUser,
      q: { limit: number; offset: number; context_type?: string; context_id?: string },
    ) {
      return repo.listThreadsForUser({
        user_id: user.id,
        limit: q.limit,
        offset: q.offset,
        context_type: q.context_type,
        context_id: q.context_id,
      });
    },

    async listMessages(
      user: AuthedUser,
      thread_id: string,
      q: { limit: number; before?: Date },
    ) {
      await assertMember(thread_id, user.id);
      return repo.listMessages({ thread_id, limit: q.limit, before: q.before });
    },

    async postMessage(
      user: AuthedUser,
      thread_id: string,
      body: { text: string; client_id?: string },
    ) {
      return postMessageInternal(user, thread_id, body);
    },

    async handleWsConnection(ws: WebSocket, user: AuthedUser, thread_id: string) {
      await assertMember(thread_id, user.id);

      const conn: WsConn = {
        ws,
        user,
        thread_id,
        tokens: TOKEN_BUCKET_CAP,
        lastRefillMs: Date.now(),
      };

      addConn(conn);

      ws.on("close", () => removeConn(conn));
      ws.on("error", () => removeConn(conn));

      ws.send(JSON.stringify({ type: "hello", thread_id }));

      ws.on("message", async (buf) => {
        const nowMs = Date.now();
        refill(conn, nowMs);

        if (conn.tokens < 1) {
          ws.send(JSON.stringify({ type: "error", code: "rate_limited" }));
          return;
        }
        conn.tokens -= 1;

        let raw: any;
        try {
          raw = JSON.parse(buf.toString());
        } catch {
          ws.send(JSON.stringify({ type: "error", code: "invalid_json" }));
          return;
        }

        if (
          raw?.type !== "message" ||
          typeof raw?.text !== "string" ||
          typeof raw?.client_id !== "string"
        ) {
          ws.send(JSON.stringify({ type: "error", code: "invalid_message_shape" }));
          return;
        }

        const text = String(raw.text).trim();
        if (!text || text.length > 2000) {
          ws.send(JSON.stringify({ type: "error", code: "invalid_text" }));
          return;
        }

        try {
          const inserted = await postMessageInternal(user, thread_id, {
            text,
            client_id: raw.client_id,
          });

          ws.send(
            JSON.stringify({
              type: "ack",
              client_id: raw.client_id,
              message_id: inserted.id,
              created_at: inserted.created_at.toISOString(),
            }),
          );
        } catch (e: any) {
          ws.send(JSON.stringify({ type: "error", code: e?.message ?? "server_error" }));
        }
      });
    },
  };
}
