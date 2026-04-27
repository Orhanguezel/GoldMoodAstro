// =============================================================
// FILE: src/modules/subscriptions/admin.routes.ts
// =============================================================
import type { FastifyInstance } from 'fastify';
import * as controller from './controller';

const BASE = '/subscriptions';
const PLAN_BASE = '/subscription-plans';

export async function registerSubscriptionsAdmin(app: FastifyInstance) {
  app.get(`${BASE}`, controller.listSubscriptionsAdmin);
  app.get(`${BASE}/:id`, controller.getSubscriptionAdmin);
  app.post<{ Params: { id: string } }>(`${BASE}/:id/refund`, controller.refundSubscriptionAdmin);

  app.get(`${PLAN_BASE}`, controller.listSubscriptionPlansAdmin);
  app.get<{ Params: { id: string } }>(`${PLAN_BASE}/:id`, controller.getSubscriptionPlanAdmin);
  app.post(PLAN_BASE, controller.createSubscriptionPlanAdmin);
  app.patch<{ Params: { id: string } }>(`${PLAN_BASE}/:id`, controller.updateSubscriptionPlanAdmin);
  app.delete<{ Params: { id: string } }>(`${PLAN_BASE}/:id`, controller.deleteSubscriptionPlanAdmin);
}

