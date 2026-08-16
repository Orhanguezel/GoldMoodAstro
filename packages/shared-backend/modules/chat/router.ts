// =============================================================
// FILE: src/modules/chat/router.ts
// =============================================================

import type { FastifyInstance } from "fastify";
import { chatController } from "./controller";
import { tryAuth } from "../../middleware/auth";
import { chatSupportController } from "./support.controller";

const BASE = "/chat";

export async function registerChat(app: FastifyInstance) {
  const c = chatController(app);
  const support = chatSupportController();

  app.post(`${BASE}/support/session`, { preHandler: [tryAuth], config: { public: true } }, support.createSession);
  app.get(`${BASE}/support/:id/messages`, { preHandler: [tryAuth], config: { public: true } }, support.listMessages);
  app.post(`${BASE}/support/:id/messages`, { preHandler: [tryAuth], config: { public: true } }, support.postMessage);
  app.post(`${BASE}/support/:id/request-admin`, { preHandler: [tryAuth], config: { public: true } }, support.requestAdmin);

  // REST — tryAuth ile cookie/Bearer decode olur, getUser req.user'ı bulur.
  // Endpoint'lerin kendi içinde auth zorunluluğu yapılır (getUser 401 atar).
  app.get(`${BASE}/threads`, { preHandler: [tryAuth], config: { public: true } }, c.listThreads);
  app.post(`${BASE}/threads`, { preHandler: [tryAuth], config: { public: true } }, c.createOrGetThread);

  app.get(`${BASE}/threads/:id/messages`, { preHandler: [tryAuth], config: { public: true } }, c.listMessages);
  app.post(`${BASE}/threads/:id/messages`, { preHandler: [tryAuth], config: { public: true } }, c.postMessage);

  // WS upgrade route
  // NOTE: fastify-websocket registers ws handler by putting { websocket: true }
  (app as any).get(
    `${BASE}/ws`,
    { websocket: true, preHandler: [tryAuth], config: { public: true } },
    c.chatWs,
  );
}
