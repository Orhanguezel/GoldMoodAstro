// packages/shared-backend/modules/synastry/router.ts
import type { FastifyInstance } from 'fastify';
import * as controller from './controller';

export function registerSynastryRoutes(fastify: FastifyInstance) {
  fastify.post('/synastry/manual', controller.handleSynastryManual);
  fastify.post('/synastry/quick', controller.handleSynastryQuick);
  fastify.get('/synastry/me', controller.handleGetMySynastry);
  // FAZ 26 / T26-2 — Paylaşılabilir rapor (PII kısıtlı)
  fastify.get('/synastry/reading/:id', controller.handleGetSynastryReport);

  // Invite Mode (FAZ 25 / T25-3)
  fastify.post('/synastry/invite', controller.handleCreateSynastryInvite);
  fastify.get('/synastry/invites/me', controller.handleGetMyInvites);
  fastify.post('/synastry/invite/:id/accept', controller.handleAcceptInvite);
  fastify.post('/synastry/invite/:id/decline', controller.handleDeclineInvite);
}
