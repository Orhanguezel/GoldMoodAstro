import type { FastifyInstance } from 'fastify';
import { getAiBillingSummary } from './service';

export async function registerAiBillingAdmin(app: FastifyInstance) {
  app.get('/ai-billing/summary', async (_request, reply) => {
    try {
      return reply.send({ data: await getAiBillingSummary() });
    } catch (error) {
      return reply.status(500).send({ error: { message: error instanceof Error ? error.message : 'ai_billing_failed' } });
    }
  });
}

