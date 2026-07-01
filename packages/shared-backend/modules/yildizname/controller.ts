// packages/shared-backend/modules/yildizname/controller.ts
// FAZ 24 / T24-1 — Yıldızname (Ebced) controller, 28 Ay Menzili sistemi
import type { FastifyReply, FastifyRequest } from 'fastify';
import { randomUUID } from 'crypto';
import { readYildiznameSchema } from './validation';
import * as repo from './repository';
import { computeYildiznameNumber, menzilNumberOf } from './ebced';
import { db } from '../../db/client';
import { generate as llmGenerate } from '../llm';
import { hasActiveSubscription, consumeCredits } from '../credits/consume';
import { appConfig } from '@goldmood/shared-config/appConfig';
import { apiMessage } from '../_shared/api-i18n';

const SIGN_LABELS: Record<string, Record<string, string>> = {
  tr: {
    aries: 'Koç', taurus: 'Boğa', gemini: 'İkizler', cancer: 'Yengeç',
    leo: 'Aslan', virgo: 'Başak', libra: 'Terazi', scorpio: 'Akrep',
    sagittarius: 'Yay', capricorn: 'Oğlak', aquarius: 'Kova', pisces: 'Balık',
  },
  en: {
    aries: 'Aries', taurus: 'Taurus', gemini: 'Gemini', cancer: 'Cancer',
    leo: 'Leo', virgo: 'Virgo', libra: 'Libra', scorpio: 'Scorpio',
    sagittarius: 'Sagittarius', capricorn: 'Capricorn', aquarius: 'Aquarius', pisces: 'Pisces',
  },
  de: {
    aries: 'Widder', taurus: 'Stier', gemini: 'Zwillinge', cancer: 'Krebs',
    leo: 'Löwe', virgo: 'Jungfrau', libra: 'Waage', scorpio: 'Skorpion',
    sagittarius: 'Schütze', capricorn: 'Steinbock', aquarius: 'Wassermann', pisces: 'Fische',
  },
};

function signLabel(sign: string | undefined, locale: string): string {
  if (!sign) return '?';
  const normalized = locale.toLowerCase().split('-')[0];
  return SIGN_LABELS[normalized]?.[sign] ?? SIGN_LABELS.tr[sign] ?? sign;
}

function userIdFromReq(req: FastifyRequest): string | null {
  const u = (req as any).user;
  return u?.sub ?? u?.id ?? null;
}

export async function handleRead(req: FastifyRequest, reply: FastifyReply) {
  const user = (req as any).user;
  const body = readYildiznameSchema.parse(req.body);

  // 1) Ebced hesapla → menzil
  const ebcedTotal = computeYildiznameNumber({
    name: body.name,
    motherName: body.mother_name,
    birthYear: body.birth_year,
  });
  const menzilNo = menzilNumberOf(ebcedTotal);

  // 2) Menzil yorumunu çek (locale'e göre en/de çeviri, yoksa tr)
  const result = await repo.getResultByMenzil(menzilNo, body.locale);
  if (!result) {
    return reply.status(500).send({
      error: apiMessage(req, 'yildizname_result_missing'),
    });
  }

  // 3) DB'ye kayıt
  const id = randomUUID();
  await repo.createReading({
    id,
    userId: user?.id || null,
    name: body.name,
    motherName: body.mother_name,
    birthYear: body.birth_year,
    ebcedTotal,
    menzilNo,
    resultText: result.content,
    locale: body.locale,
  });

  return reply.send({
    data: {
      id,
      ebced_total: ebcedTotal,
      menzil_no: menzilNo,
      menzil: {
        name_ar: result.nameAr,
        name_tr: result.nameTr,
        short_summary: result.shortSummary,
        category: result.category,
      },
      interpretation: result.content,
    },
  });
}

export async function handleGetMyReadings(req: FastifyRequest, reply: FastifyReply) {
  const user = (req as any).user;
  if (!user) return reply.status(401).send({ error: apiMessage(req, 'unauthorized') });
  const rows = await repo.getReadingsByUser(user.id);
  return reply.send({ data: rows });
}

export async function handleGetReading(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const row = await repo.getReadingById(id);
  if (!row) return reply.status(404).send({ error: apiMessage(req, 'yildizname_not_found') });

  // Drizzle camelCase → frontend snake_case eşlemesi
  return reply.send({
    data: {
      id: row.id,
      name: row.name,
      mother_name: row.motherName,
      birth_year: row.birthYear,
      ebced_total: row.ebcedTotal,
      menzil_no: row.menzilNo,
      result_text: row.resultText,
      llm_extra: row.llmExtra,
      locale: row.locale,
      created_at: row.createdAt,
      menzil: row.menzil
        ? {
            name_ar: row.menzil.nameAr,
            name_tr: row.menzil.nameTr,
            short_summary: row.menzil.shortSummary,
            content: row.menzil.content,
            category: row.menzil.category,
          }
        : null,
    },
  });
}

export async function handleListMenzils(_req: FastifyRequest, reply: FastifyReply) {
  const rows = await repo.getAllResults();
  return reply.send({ data: rows });
}

/**
 * FAZ 24 / T24-1 PREMIUM — Yıldızname × Doğum Haritası hibrit yorum.
 * Kullanıcının chart'ını çeker, menzil + Güneş/Ay/Yükselen birlikte LLM yorumu üretir.
 * Maliyet: subscription varsa ücretsiz, yoksa 50 kredi.
 */
export async function handleChartExtra(req: FastifyRequest, reply: FastifyReply) {
  const userId = userIdFromReq(req);
  if (!userId) return reply.status(401).send({ error: apiMessage(req, 'unauthorized') });

  const { id } = req.params as { id: string };
  const reading = await repo.getReadingById(id);
  if (!reading || reading.userId !== userId) {
    return reply.status(404).send({ error: apiMessage(req, 'yildizname_not_found') });
  }

  // Eğer zaten llm_extra varsa direkt döndür (idempotent)
  if (reading.llmExtra) {
    return reply.send({
      data: { id, llm_extra: reading.llmExtra, cached: true },
    });
  }

  // Pricing guard
  const isPremium = await hasActiveSubscription(userId);
  if (!isPremium) {
    const consume = await consumeCredits({
      userId,
      amount: appConfig.credits.yildiznameExtraCost,
      referenceType: 'yildizname_chart_extra',
      referenceId: id,
      description: `Yıldızname hibrit yorum (menzil ${reading.menzilNo})`,
    });
    if (consume.status === 'insufficient') {
      return reply.status(402).send({
        error: apiMessage(req, 'insufficient_credits'),
        required: appConfig.credits.yildiznameExtraCost,
        available: consume.available,
        hint_action_path: '/pricing',
      });
    }
  }

  // Kullanıcının en son chart'ını çek (raw SQL — birthCharts shared'de değil)
  const [chartRows] = await (db as any).session.client.query(
    `SELECT chart_data FROM birth_charts WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
    [userId],
  );
  const chartRow = (chartRows as any[])[0];
  if (!chartRow) {
    return reply.status(404).send({
      error: apiMessage(req, 'birth_chart_required'),
      hint_action_path: '/birth-chart',
    });
  }

  let chart = chartRow.chart_data;
  if (typeof chart === 'string') {
    try { chart = JSON.parse(chart); } catch { /* keep raw */ }
  }
  const sunSign = chart?.planets?.sun?.sign;
  const moonSign = chart?.planets?.moon?.sign;
  const ascSign = chart?.ascendant?.sign;

  // Menzil yorumu (zaten kayıtlı)
  const menzil = await repo.getResultByMenzil(reading.menzilNo);
  if (!menzil) {
    return reply.status(500).send({ error: apiMessage(req, 'menzil_not_found') });
  }

  // LLM hibrit
  let llmExtra = '';
  try {
    const result = await llmGenerate({
      promptKey: 'yildizname_chart_extra',
      locale: reading.locale ?? 'tr',
      vars: {
        menzil_no: String(reading.menzilNo),
        menzil_name_tr: menzil.nameTr,
        menzil_name_ar: menzil.nameAr,
        menzil_content: menzil.content,
        sun_sign_label: signLabel(sunSign, reading.locale ?? 'tr'),
        moon_sign_label: signLabel(moonSign, reading.locale ?? 'tr'),
        asc_sign_label: signLabel(ascSign, reading.locale ?? 'tr'),
      },
    });
    llmExtra = result.content.trim();
  } catch (err) {
    console.warn('[yildizname] chart_extra_llm_failed', err);
    return reply.status(500).send({ error: apiMessage(req, 'llm_failed') });
  }

  // DB güncelle
  await (db as any).session.client.query(
    `UPDATE yildizname_readings SET llm_extra = ? WHERE id = ?`,
    [llmExtra, id],
  );

  return reply.send({
    data: { id, llm_extra: llmExtra, cached: false },
  });
}
