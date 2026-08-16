import type { FastifyRequest } from "fastify";
import { chatSupportService } from "./support.service";
import { SupportAccessQuerySchema, SupportPostMessageBodySchema, SupportSessionBodySchema, ThreadIdParamsSchema } from "./validation";

function optionalUser(req: any) {
  const raw = req.user as { id?: string; sub?: string; role?: string } | undefined;
  const id = raw?.id ?? raw?.sub;
  return id ? { id: String(id), role: (raw?.role || "buyer") as "admin" | "buyer" | "vendor" } : null;
}

export function chatSupportController() {
  const service = chatSupportService();
  return {
    async createSession(req: FastifyRequest) {
      const body = SupportSessionBodySchema.parse((req as any).body ?? {});
      return service.createSession(optionalUser(req), body.locale, body.visitor_token);
    },
    async listMessages(req: FastifyRequest) {
      const { id } = ThreadIdParamsSchema.parse((req as any).params ?? {});
      const query = SupportAccessQuerySchema.parse((req as any).query ?? {});
      return service.listMessages(id, optionalUser(req), query.visitor_token);
    },
    async postMessage(req: FastifyRequest) {
      const { id } = ThreadIdParamsSchema.parse((req as any).params ?? {});
      const body = SupportPostMessageBodySchema.parse((req as any).body ?? {});
      return service.postMessage(id, optionalUser(req), body.visitor_token, body.text, body.client_id);
    },
    async requestAdmin(req: FastifyRequest) {
      const { id } = ThreadIdParamsSchema.parse((req as any).params ?? {});
      const body = SupportAccessQuerySchema.parse((req as any).body ?? {});
      return service.requestAdmin(id, optionalUser(req), body.visitor_token);
    },
  };
}
