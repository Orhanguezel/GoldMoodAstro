// packages/shared-backend/modules/tarot/router.ts
import type { FastifyInstance } from 'fastify';
import * as controller from './controller';
import { tryAuth } from '../../middleware/auth';

export function registerTarotPublic(fastify: FastifyInstance) {
  fastify.get('/tarot/cards', controller.handleListCards);
  fastify.post('/tarot/draw', { preHandler: [tryAuth] }, controller.handleDraw);
  fastify.get('/tarot/reading/:id', { preHandler: [tryAuth] }, controller.handleGetReading);
}

export function registerTarotPrivate(fastify: FastifyInstance) {
  fastify.get('/tarot/me', controller.handleGetMyReadings);
}
