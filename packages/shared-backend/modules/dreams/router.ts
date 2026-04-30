// packages/shared-backend/modules/dreams/router.ts
import type { FastifyInstance } from 'fastify';
import * as controller from './controller';
import { tryAuth } from '../../middleware/auth';

export function registerDreamsPublic(fastify: FastifyInstance) {
  fastify.post('/dreams/interpret', { preHandler: [tryAuth] }, controller.handleInterpret);
  fastify.get('/dreams/reading/:id', controller.handleGetInterpretation);
}

export function registerDreamsPrivate(fastify: FastifyInstance) {
  fastify.get('/dreams/me', controller.handleGetMyInterpretations);
}
