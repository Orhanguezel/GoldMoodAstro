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
          date: { type: 'string' },
          locale: { type: 'string' }
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

export async function registerHoroscopeAdminRoutes(fastify: FastifyInstance) {
  fastify.get('/horoscopes', {
    schema: {
      querystring: {
        type: 'object',
        properties: {
          sign: { type: 'string' },
          period: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'transit'] },
          date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
          locale: { type: 'string' },
          source: { type: 'string', enum: ['llm', 'astrolog_manual', 'seed'] },
          limit: { type: 'integer', minimum: 1, maximum: 200 },
          offset: { type: 'integer', minimum: 0 },
        },
      },
      tags: ['Admin Horoscopes'],
    },
  }, controller.handleAdminListHoroscopes);

  fastify.put('/horoscopes/:id', {
    schema: {
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          content: { type: 'string' },
          mood_score: { type: ['integer', 'null'], minimum: 1, maximum: 10 },
          lucky_number: { type: ['integer', 'null'], minimum: 0, maximum: 99 },
          lucky_color: { type: ['string', 'null'] },
        },
        additionalProperties: false,
      },
      tags: ['Admin Horoscopes'],
    },
  }, controller.handleAdminUpdateHoroscope);

  fastify.post('/horoscopes/generate', {
    schema: {
      body: {
        type: 'object',
        properties: {
          sign: { type: 'string' },
          period: { type: 'string', enum: ['daily', 'weekly', 'monthly', 'transit'] },
          locale: { type: 'string' },
          date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
          force: { type: 'boolean' },
        },
        required: ['sign', 'period', 'locale'],
        additionalProperties: false,
      },
      tags: ['Admin Horoscopes'],
    },
  }, controller.handleAdminGenerateHoroscope);
}
