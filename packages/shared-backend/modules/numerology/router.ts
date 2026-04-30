// packages/shared-backend/modules/numerology/router.ts
import type { FastifyInstance } from 'fastify';
import * as controller from './controller';
import { tryAuth } from '../../middleware/auth';

export function registerNumerologyPublic(fastify: FastifyInstance) {
  fastify.post('/numerology/calculate', { preHandler: [tryAuth] }, controller.handleCalculate);
  fastify.get('/numerology/reading/:id', controller.handleGetReading);
}

export function registerNumerologyPrivate(fastify: FastifyInstance) {
  fastify.get('/numerology/me', controller.handleGetMyReadings);
}
