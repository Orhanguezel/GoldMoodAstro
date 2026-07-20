// backend/src/modules/horoscopes/controller.ts
// FAZ 9 + FAZ 20-T20-1 — Horoscope public endpoints

import type { FastifyReply, FastifyRequest } from 'fastify';
import * as repo from './repository';
import { apiMessage } from '@goldmood/shared-backend/modules/_shared/api-i18n';
import { generateHoroscope } from './generator';
import { ALL_SIGNS, type HoroscopePeriod, type SignKey } from './schema';

const PERIODS: HoroscopePeriod[] = ['daily', 'weekly', 'monthly', 'transit'];

function isSign(value: string): value is SignKey {
  return (ALL_SIGNS as string[]).includes(value);
}

function isPeriod(value: string): value is HoroscopePeriod {
  return (PERIODS as string[]).includes(value);
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/**
 * GET /horoscopes/today?sign=aries&locale=tr
 * Geriye uyumlu — daily yorumun kısa yolu.
 */
export async function handleGetDaily(req: FastifyRequest, reply: FastifyReply) {
  const { sign, date, locale } = req.query as { sign?: string; date?: string; locale?: string };
  if (!sign) {
    return reply.status(400).send({ error: apiMessage(req, 'sign_required') });
  }
  const horoscope = await repo.getHoroscopeByPeriod({
    sign,
    period: 'daily',
    date,
    locale: locale || 'tr',
  });
  if (!horoscope) {
    return reply.status(404).send({ error: apiMessage(req, 'horoscope_not_found') });
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
      return reply.status(404).send({ error: apiMessage(req, 'sign_info_not_found') });
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
      error: apiMessage(req, 'horoscope_not_found'),
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
    return reply.status(400).send({ error: apiMessage(req, 'compatibility_params_required') });
  }

  const reading = await repo.getCompatibilityReading(signA, signB, locale || 'tr');
  if (!reading) {
    // TODO T20-6: Eksik kombinasyonu LLM ile üret
    return reply.status(404).send({ error: apiMessage(req, 'compatibility_not_found') });
  }
  return reply.send({ data: reading });
}

export async function handleGetTransit(req: FastifyRequest, reply: FastifyReply) {
  const { month, locale } = req.query as { month?: string; locale?: string };
  
  if (!month) {
    return reply.status(400).send({ error: apiMessage(req, 'month_required') });
  }

  const horoscopes = await repo.getHoroscopesForTransit(month, locale || 'tr');
  return reply.send({ data: horoscopes });
}

export async function handleAdminListHoroscopes(req: FastifyRequest, reply: FastifyReply) {
  const { sign, period, date, locale, source, limit, offset } = req.query as {
    sign?: string;
    period?: string;
    date?: string;
    locale?: string;
    source?: string;
    limit?: string;
    offset?: string;
  };

  const result = await repo.listHoroscopesAdmin({
    sign,
    period,
    date,
    locale,
    source,
    limit: limit ? Number(limit) : undefined,
    offset: offset ? Number(offset) : undefined,
  });
  return reply.send({ data: result.items, meta: { total: result.total } });
}

export async function handleAdminUpdateHoroscope(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const body = req.body as {
    content?: string;
    mood_score?: number | null;
    lucky_number?: number | null;
    lucky_color?: string | null;
  };

  if (body.content !== undefined && !body.content.trim()) {
    return reply.status(400).send({ error: 'content_required' });
  }

  const updated = await repo.updateHoroscopeAdmin(id, {
    content: body.content,
    mood_score: body.mood_score,
    lucky_number: body.lucky_number,
    lucky_color: body.lucky_color,
  });

  if (!updated) {
    return reply.status(404).send({ error: apiMessage(req, 'horoscope_not_found') });
  }
  return reply.send({ data: updated });
}

export async function handleAdminGenerateHoroscope(req: FastifyRequest, reply: FastifyReply) {
  const body = req.body as {
    sign?: string;
    period?: string;
    locale?: string;
    date?: string;
    force?: boolean;
  };

  const sign = String(body.sign || '').toLowerCase();
  const period = String(body.period || 'daily').toLowerCase();
  const locale = String(body.locale || 'tr').toLowerCase().slice(0, 8);
  const date = body.date ? String(body.date) : undefined;

  if (!isSign(sign)) {
    return reply.status(400).send({ error: 'invalid_sign' });
  }
  if (!isPeriod(period)) {
    return reply.status(400).send({ error: 'invalid_period' });
  }
  if (date && !isIsoDate(date)) {
    return reply.status(400).send({ error: 'invalid_date' });
  }

  const result = await generateHoroscope({
    sign,
    period,
    locale,
    date,
    force: body.force ?? true,
  });
  const periodStart = date || undefined;
  const horoscope = await repo.getHoroscopeByPeriod({
    sign,
    period,
    locale,
    date: periodStart,
  });

  return reply.send({ data: { ...result, horoscope } });
}

/** GET /horoscopes/carousel-lines?topic=...&locale=tr — PUBLIC, auth yok. */
export async function handleCarouselLines(req: FastifyRequest, reply: FastifyReply) {
  const q = req.query as { topic?: string; locale?: string };
  if (!q.topic) return reply.code(400).send({ error: 'topic gerekli' });
  const data = await repo.getCarouselLines(q.topic, q.locale || 'tr');
  return reply.send({ data, count: data.length });
}
