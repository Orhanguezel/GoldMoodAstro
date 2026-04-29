// packages/shared-backend/modules/tarot/router.ts
import type { FastifyInstance } from 'fastify';
import * as controller from './controller';

export function registerTarotPublic(fastify: FastifyInstance) {
  fastify.post('/tarot/draw', controller.handleDraw);
  fastify.get('/tarot/reading/:id', controller.handleGetReading);
}

export function registerTarotPrivate(fastify: FastifyInstance) {
  fastify.get('/tarot/me', controller.handleGetMyReadings);
}
