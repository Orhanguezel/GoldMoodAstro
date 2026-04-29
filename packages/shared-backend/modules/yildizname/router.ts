// FAZ 24 / T24-1
// NOT: Path'ler relative — backend register'da `/yildizname` prefix ile mount edilir.
import type { FastifyInstance } from 'fastify';
import * as controller from './controller';

export function registerYildiznamePublic(fastify: FastifyInstance) {
  fastify.post('/read', controller.handleRead);
  fastify.get('/menzils', controller.handleListMenzils);
  fastify.get('/reading/:id', controller.handleGetReading);
  // FAZ 24 / T24-1 PREMIUM — Hibrit yorum (auth zorunlu, credit guard)
  fastify.post('/reading/:id/chart-extra', controller.handleChartExtra);
}

export function registerYildiznamePrivate(fastify: FastifyInstance) {
  fastify.get('/me', controller.handleGetMyReadings);
}
