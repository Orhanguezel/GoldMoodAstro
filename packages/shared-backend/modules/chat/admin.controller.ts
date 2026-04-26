// =============================================================
// FILE: src/modules/chat/admin.controller.ts
// =============================================================

import type { FastifyReply, FastifyRequest } from "fastify";
import { ListThreadsQuerySchema, ThreadIdParamsSchema, ListMessagesQuerySchema } from "./validation";
import { chatService } from "./service";

function setListHeaders(reply: FastifyReply, total: number, offset: number, limit: number) {
  reply.header("x-total-count", String(total));
  reply.header("content-range", `items ${offset}-${Math.max(offset, offset + limit - 1)}/${total}`);
}

export function chatAdminController(app: any) {
  const svc = chatService(app);

  return {
    // GET /admin/chat/threads
    async adminListThreads(req: FastifyRequest, reply: FastifyReply) {
      const q = ListThreadsQuerySchema.parse((req as any).query ?? {});
      // Admin list: reuse listThreadsForUser? MVP: admin is participant of everything değil.
      // Bu nedenle phase-2’de repo’ya "listThreadsAdmin" eklemek daha doğru.
      // MVP quick: context filter zorunlu yapıp context üzerinden thread çek.
      if (!q.context_type || !q.context_id) {
        return { items: [], note: "MVP: admin requires context_type+context_id filter" };
      }
      const thread = await svc.repo.getThreadByContext({
        context_type: q.context_type,
        context_id: q.context_id,
      });
      const items = thread ? [{ thread }] : [];
      setListHeaders(reply, items.length, 0, q.limit);
      return { items };
    },

    // GET /admin/chat/threads/:id/messages
    async adminListMessages(req: FastifyRequest, reply: FastifyReply) {
      const params = ThreadIdParamsSchema.parse((req as any).params ?? {});
      const q = ListMessagesQuerySchema.parse((req as any).query ?? {});
      const before = q.before ? new Date(q.before) : undefined;

      // Admin bypass membership (policy): admin sees all
      const { rows, total } = await svc.repo.listMessages({
        thread_id: params.id,
        limit: q.limit,
        before,
      });

      setListHeaders(reply, total, 0, q.limit);
      return { items: [...rows].reverse() };
    },
  };
}
