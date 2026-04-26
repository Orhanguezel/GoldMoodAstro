// backend/src/modules/horoscopes/controller.ts

import type { FastifyReply, FastifyRequest } from 'fastify';
import * as repo from './repository';

export async function handleGetDaily(req: FastifyRequest, reply: FastifyReply) {
  const { sign, date } = req.query as { sign?: string; date?: string };
  
  if (!sign) {
    return reply.status(400).send({ error: 'Burç parametresi (sign) eksik.' });
  }

  const horoscope = await repo.getDailyHoroscope(sign.toLowerCase(), date);
  if (!horoscope) {
    return reply.status(404).send({ error: 'İlgili tarih için yorum bulunamadı.' });
  }

  return reply.send({ data: horoscope });
}
