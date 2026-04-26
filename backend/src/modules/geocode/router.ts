import type { FastifyInstance } from 'fastify';
import { handleSearch } from './controller';

export async function registerGeocodeRoutes(app: FastifyInstance) {
  app.get('/', handleSearch);
}
