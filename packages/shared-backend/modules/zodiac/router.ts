import type { FastifyInstance } from 'fastify';
import { getZodiacSign } from './controller';

export async function registerZodiac(app: FastifyInstance) {
  app.get('/zodiac/:sign', getZodiacSign);
}
