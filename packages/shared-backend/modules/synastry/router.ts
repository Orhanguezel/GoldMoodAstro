// packages/shared-backend/modules/synastry/router.ts
import type { FastifyInstance } from 'fastify';
import * as controller from './controller';
import { tryAuth } from '../../middleware/auth';

export function registerSynastryRoutes(fastify: FastifyInstance) {
  fastify.post('/synastry/manual', { preHandler: [tryAuth] }, controller.handleSynastryManual);
  fastify.post('/synastry/quick', { preHandler: [tryAuth] }, controller.handleSynastryQuick);
  fastify.get('/synastry/me', { preHandler: [tryAuth] }, controller.handleGetMySynastry);
  // FAZ 26 / T26-2 — Paylaşılabilir rapor (PII kısıtlı)
  fastify.get('/synastry/reading/:id', { preHandler: [tryAuth] }, controller.handleGetSynastryReport);

  // Invite Mode (FAZ 25 / T25-3) — kullanıcının JWT cookie'sini parse etmek için
  // tryAuth zorunlu; yoksa handler içindeki userIdFromReq her zaman null döner ve
  // logged-in kullanıcıya bile 401 verir.
  fastify.post('/synastry/invite', { preHandler: [tryAuth] }, controller.handleCreateSynastryInvite);
  fastify.get('/synastry/invites/me', { preHandler: [tryAuth] }, controller.handleGetMyInvites);
  fastify.post('/synastry/invite/:id/accept', { preHandler: [tryAuth] }, controller.handleAcceptInvite);
  fastify.post('/synastry/invite/:id/decline', { preHandler: [tryAuth] }, controller.handleDeclineInvite);
}
