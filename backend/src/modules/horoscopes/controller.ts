// backend/src/modules/horoscopes/controller.ts
// FAZ 9 + FAZ 20-T20-1 — Horoscope public endpoints

import type { FastifyReply, FastifyRequest } from 'fastify';
import * as repo from './repository';

/**
 * GET /horoscopes/today?sign=aries&locale=tr
 * Geriye uyumlu — daily yorumun kısa yolu.
 */
export async function handleGetDaily(req: FastifyRequest, reply: FastifyReply) {
  const { sign, date, locale } = req.query as { sign?: string; date?: string; locale?: string };
  if (!sign) {
    return reply.status(400).send({ error: 'Burç parametresi (sign) eksik.' });
  }
  const horoscope = await repo.getHoroscopeByPeriod({
    sign,
    period: 'daily',
    date,
    locale: locale || 'tr',
  });
  if (!horoscope) {
    return reply.status(404).send({ error: 'İlgili tarih için yorum bulunamadı.' });
  }
  return reply.send({ data: horoscope });
}

/**
 * GET /horoscopes/:sign?period=daily|weekly|monthly|transit&locale=tr&date=YYYY-MM-DD
 * Period verilmezse `meta` (burç profili + alt-konular) döner.
 * Period verilirse o periyot yorumu döner.
 */
export async function handleGetSign(req: FastifyRequest, reply: FastifyReply) {
  const { sign } = req.params as { sign: string };
  const { period, locale, date } = req.query as {
    period?: string;
    locale?: string;
    date?: string;
  };

  const lc = locale || 'tr';

  // Period yoksa: burç profili + sections
  if (!period) {
    const info = await repo.getSignInfo(sign, lc);
    if (!info) {
      return reply.status(404).send({ error: 'Burç bilgisi bulunamadı.' });
    }
    return reply.send({ data: info });
  }

  // Period varsa: ilgili periyot yorumu
  const horoscope = await repo.getHoroscopeByPeriod({
    sign,
    period,
    locale: lc,
    date,
  });
  if (!horoscope) {
    return reply.status(404).send({
      error: 'Bu burç-periyot için henüz yorum hazırlanmadı.',
      hint: 'Cron her gece 02:00 üretir; manuel tetiklemek için admin panel.',
    });
  }
  return reply.send({ data: horoscope });
}

/** Eski alias — geriye uyumlu */
export const handleGetSignInfo = handleGetSign;

/**
 * GET /horoscopes/compatibility?signA=aries&signB=libra&locale=tr
 * T20-6 hazırlık — kompatibilite tablosu henüz seed edilmemişse 404.
 */
export async function handleGetCompatibility(req: FastifyRequest, reply: FastifyReply) {
  const { signA, signB, locale } = req.query as {
    signA?: string;
    signB?: string;
    locale?: string;
  };

  if (!signA || !signB) {
    return reply.status(400).send({ error: 'signA ve signB parametreleri zorunludur.' });
  }

  const reading = await repo.getCompatibilityReading(signA, signB, locale || 'tr');
  if (!reading) {
    // TODO T20-6: Eksik kombinasyonu LLM ile üret
    return reply.status(404).send({ error: 'Uyumluluk yorumu henüz mevcut değil.' });
  }
  return reply.send({ data: reading });
}

export async function handleGetTransit(req: FastifyRequest, reply: FastifyReply) {
  const { month, locale } = req.query as { month?: string; locale?: string };
  
  if (!month) {
    return reply.status(400).send({ error: 'month parametresi (YYYY-MM) zorunludur.' });
  }

  const horoscopes = await repo.getHoroscopesForTransit(month, locale || 'tr');
  return reply.send({ data: horoscopes });
}
