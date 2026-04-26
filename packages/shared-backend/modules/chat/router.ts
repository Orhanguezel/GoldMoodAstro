// =============================================================
// FILE: src/modules/chat/router.ts
// =============================================================

import type { FastifyInstance } from "fastify";
import { chatController } from "./controller";

const BASE = "/chat";

export async function registerChat(app: FastifyInstance) {
  const c = chatController(app);

  // REST
  app.get(`${BASE}/threads`, { config: { public: true } }, c.listThreads);
  app.post(`${BASE}/threads`, { config: { public: true } }, c.createOrGetThread);

  app.get(`${BASE}/threads/:id/messages`, { config: { public: true } }, c.listMessages);
  app.post(`${BASE}/threads/:id/messages`, { config: { public: true } }, c.postMessage);

  // WS upgrade route
  // NOTE: fastify-websocket registers ws handler by putting { websocket: true }
  (app as any).get(
    `${BASE}/ws`,
    { websocket: true, config: { public: true } },
    c.chatWs,
  );
}
