// ===================================================================
// FILE: src/modules/mail/router.ts
// ===================================================================

import type { FastifyInstance } from "fastify";
import { requireAuth } from "../../middleware/auth";
import { requireAdmin } from "../../middleware/roles";
import {
  sendTestMail,
  sendMailHandler,
  sendOrderCreatedMailHandler,
} from "./controller";

const BASE = "/mail";

// SECURITY: serbest metin/alıcı ile site SMTP'sinden mail atan uçlar YALNIZ
// admin olabilir; requireAuth tek başına her kayıtlı kullanıcıya açık bir
// spam/phishing vektörüdür (2026-08-16 tespiti). Sipariş mailleri gibi
// kullanıcı akışları bu REST uçlarını değil backend içi servisleri kullanır.
export async function registerMail(app: FastifyInstance) {
  // SMTP test maili
  app.post(`${BASE}/test`, { preHandler: [requireAuth, requireAdmin] }, sendTestMail);

  // Genel mail gönderimi
  app.post(`${BASE}/send`, { preHandler: [requireAuth, requireAdmin] }, sendMailHandler);

  // Sipariş oluşturma maili (template: order_received)
  app.post(
    `${BASE}/order-created`,
    { preHandler: [requireAuth, requireAdmin] },
    sendOrderCreatedMailHandler,
  );
}
