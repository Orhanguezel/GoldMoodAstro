// =============================================================
// FILE: src/modules/chat/controller.ts
// =============================================================

import type { FastifyReply, FastifyRequest } from "fastify";
import {
  CreateOrGetThreadBodySchema,
  ListMessagesQuerySchema,
  ListThreadsQuerySchema,
  PostMessageBodySchema,
  ThreadIdParamsSchema,
  WsQuerySchema,
} from "./validation";
import { chatService } from "./service";

function getUser(req: any) {
  // JWT payload'da id varsa kullan, yoksa sub'tan map et (fastify-jwt sub döner)
  const u = req.user as { id?: string; sub?: string; role?: string } | undefined;
  const id = u?.id ?? u?.sub;
  if (!id) {
    const err: any = new Error("unauthorized");
    err.statusCode = 401;
    throw err;
  }
  return { id: String(id), role: (u?.role as any) ?? 'buyer' } as { id: string; role: "admin" | "buyer" | "vendor" };
}

function setListHeaders(reply: FastifyReply, total: number, offset: number, limit: number) {
  reply.header("x-total-count", String(total));
  reply.header("content-range", `items ${offset}-${Math.max(offset, offset + limit - 1)}/${total}`);
}

export function chatController(app: any) {
  const svc = chatService(app);

  return {
    // GET /chat/threads
    async listThreads(req: FastifyRequest, reply: FastifyReply) {
      const user = getUser(req);
      const q = ListThreadsQuerySchema.parse((req as any).query ?? {});
      const { rows, total } = await svc.listThreadsForUser(user, q);
      setListHeaders(reply, total, q.offset, q.limit);
      return { items: rows };
    },

    // POST /chat/threads (create or get by context)
    async createOrGetThread(req: FastifyRequest, reply: FastifyReply) {
      const user = getUser(req);
      const body = CreateOrGetThreadBodySchema.parse((req as any).body ?? {});
      const thread = await svc.getOrCreateThread({
        context_type: body.context_type,
        context_id: body.context_id,
        created_by: user,
      });
      return { thread };
    },

    // GET /chat/threads/:id/messages
    async listMessages(req: FastifyRequest, reply: FastifyReply) {
      const user = getUser(req);
      const params = ThreadIdParamsSchema.parse((req as any).params ?? {});
      const q = ListMessagesQuerySchema.parse((req as any).query ?? {});
      const before = q.before ? new Date(q.before) : undefined;

      const { rows, total } = await svc.listMessages(user, params.id, { limit: q.limit, before });
      // UI genelde eski→yeni ister; repo yeni→eski çekti, ters çevir:
      const items = [...rows].reverse();

      setListHeaders(reply, total, 0, q.limit);
      return { items };
    },

    // POST /chat/threads/:id/messages (REST fallback)
    async postMessage(req: FastifyRequest, reply: FastifyReply) {
      const user = getUser(req);
      const params = ThreadIdParamsSchema.parse((req as any).params ?? {});
      const body = PostMessageBodySchema.parse((req as any).body ?? {});
      const msg = await svc.postMessage(user, params.id, body);
      return { message: msg };
    },

    // WS handler: GET /chat/ws?thread_id=...
    async chatWs(req: any, socket: any /* WebSocket */, _head: any) {
      const user = getUser(req);
      const q = WsQuerySchema.parse(req.query ?? {});
      await svc.handleWsConnection(socket, user, q.thread_id);
    },
  };
}
