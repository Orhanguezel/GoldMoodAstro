// backend/src/modules/tarot/router.ts

import type { FastifyInstance } from 'fastify';
import * as controller from './controller';

export async function registerTarotRoutes(fastify: FastifyInstance) {
  fastify.post('/draw', {
    schema: {
      body: {
        type: 'object',
        properties: { spread: { type: 'string', enum: ['single', 'triple'] } },
        required: ['spread']
      },
      tags: ['Tarot'],
    }
  }, controller.handleDraw);
}
