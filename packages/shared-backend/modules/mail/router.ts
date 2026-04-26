// ===================================================================
// FILE: src/modules/mail/router.ts
// ===================================================================

import type { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/auth";
import {
  sendTestMail,
  sendMailHandler,
  sendOrderCreatedMailHandler,
} from "./controller";

const BASE = "/mail";

export async function registerMail(app: FastifyInstance) {
  // SMTP test maili
  app.post(`${BASE}/test`, { preHandler: [requireAuth] }, sendTestMail);

  // Genel mail gönderimi
  app.post(`${BASE}/send`, { preHandler: [requireAuth] }, sendMailHandler);

  // Sipariş oluşturma maili (template: order_received)
  app.post(
    `${BASE}/order-created`,
    { preHandler: [requireAuth] },
    sendOrderCreatedMailHandler,
  );
}
