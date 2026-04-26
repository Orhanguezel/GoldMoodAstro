// backend/src/modules/numerology/router.ts

import type { FastifyInstance } from 'fastify';
import * as controller from './controller';

export async function registerNumerologyRoutes(fastify: FastifyInstance) {
  fastify.get('/calculate', {
    schema: {
      querystring: {
        type: 'object',
        properties: { dob: { type: 'string' } },
        required: ['dob']
      },
      tags: ['Numerology'],
    }
  }, controller.handleCalculate);
}
