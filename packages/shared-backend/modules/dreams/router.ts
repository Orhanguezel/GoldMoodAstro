// packages/shared-backend/modules/dreams/router.ts
import type { FastifyInstance } from 'fastify';
import * as controller from './controller';

export function registerDreamsPublic(fastify: FastifyInstance) {
  fastify.post('/dreams/interpret', controller.handleInterpret);
  fastify.get('/dreams/reading/:id', controller.handleGetInterpretation);
}

export function registerDreamsPrivate(fastify: FastifyInstance) {
  fastify.get('/dreams/me', controller.handleGetMyInterpretations);
}
