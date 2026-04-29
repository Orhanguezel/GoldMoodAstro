// packages/shared-backend/modules/coffee/router.ts
import type { FastifyInstance } from 'fastify';
import * as controller from './controller';

export function registerCoffeePublic(fastify: FastifyInstance) {
  fastify.post('/coffee/read', controller.handleRead);
  fastify.get('/coffee/reading/:id', controller.handleGetReading);
}

export function registerCoffeePrivate(fastify: FastifyInstance) {
  fastify.get('/coffee/me', controller.handleGetMyReadings);
}
