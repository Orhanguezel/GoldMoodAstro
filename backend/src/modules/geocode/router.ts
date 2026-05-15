import type { FastifyInstance } from 'fastify';
import { handleSearch, handleTimezone } from './controller';

export async function registerGeocodeRoutes(app: FastifyInstance) {
  app.get('/', handleSearch);
  app.get('/timezone', handleTimezone);
}
