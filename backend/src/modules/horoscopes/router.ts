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

  fastify.get('/transit', {
    schema: {
      querystring: {
        type: 'object',
        properties: { 
          month: { type: 'string', pattern: '^\\d{4}-\\d{2}$' },
          locale: { type: 'string' }
        },
        required: ['month']
      },
      tags: ['Horoscopes'],
    }
  }, controller.handleGetTransit);

  fastify.get('/compatibility', {
    schema: {
      querystring: {
        type: 'object',
        properties: { 
          signA: { type: 'string' },
          signB: { type: 'string' },
          locale: { type: 'string' }
        },
        required: ['signA', 'signB']
      },
      tags: ['Horoscopes'],
    }
  }, controller.handleGetCompatibility);

  fastify.get('/:sign', {
    schema: {
      params: {
        type: 'object',
        properties: { sign: { type: 'string' } },
        required: ['sign'],
      },
      querystring: {
        type: 'object',
        properties: {
          locale: { type: 'string' },
          period: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'transit'] },
          date: { type: 'string' },
        },
      },
      tags: ['Horoscopes'],
    },
  }, controller.handleGetSign);
}
