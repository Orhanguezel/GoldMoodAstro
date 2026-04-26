// backend/src/modules/horoscopes/router.ts

import type { FastifyInstance } from 'fastify';
import * as controller from './controller';

export async function registerHoroscopeRoutes(fastify: FastifyInstance) {
  fastify.get('/today', {
    schema: {
      querystring: {
        type: 'object',
        properties: { 
          sign: { type: 'string' },
          date: { type: 'string' }
        },
        required: ['sign']
      },
      tags: ['Horoscopes'],
    }
  }, controller.handleGetDaily);
}
