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

const SIGN_LABEL_TR: Record<string, string> = {
  aries: 'Koç', taurus: 'Boğa', gemini: 'İkizler', cancer: 'Yengeç',
  leo: 'Aslan', virgo: 'Başak', libra: 'Terazi', scorpio: 'Akrep',
  sagittarius: 'Yay', capricorn: 'Oğlak', aquarius: 'Kova', pisces: 'Balık',
};

const YILDIZNAME_EXTRA_COST = 50; // 50 kredi ek hibrit yorum

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

  // 2) Menzil yorumunu çek
  const result = await repo.getResultByMenzil(menzilNo);
  if (!result) {
    return reply.status(500).send({
      error: 'Yıldızname menzili bulunamadı; seed eksik olabilir.',
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
  if (!user) return reply.status(401).send({ error: 'Yetkisiz erişim.' });
  const rows = await repo.getReadingsByUser(user.id);
  return reply.send({ data: rows });
}

export async function handleGetReading(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const row = await repo.getReadingById(id);
  if (!row) return reply.status(404).send({ error: 'Yıldızname bulunamadı.' });

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
  if (!userId) return reply.status(401).send({ error: 'Yetkisiz erişim.' });

  const { id } = req.params as { id: string };
  const reading = await repo.getReadingById(id);
  if (!reading || reading.userId !== userId) {
    return reply.status(404).send({ error: 'Yıldızname bulunamadı.' });
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
      amount: YILDIZNAME_EXTRA_COST,
      referenceType: 'yildizname_chart_extra',
      referenceId: id,
      description: `Yıldızname hibrit yorum (menzil ${reading.menzilNo})`,
    });
    if (consume.status === 'insufficient') {
      return reply.status(402).send({
        error: 'Yetersiz kredi.',
        required: YILDIZNAME_EXTRA_COST,
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
      error: 'Doğum haritan bulunamadı; önce harita oluşturmalısın.',
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
    return reply.status(500).send({ error: 'Menzil yorumu bulunamadı.' });
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
        sun_sign_label: SIGN_LABEL_TR[sunSign] ?? sunSign ?? '?',
        moon_sign_label: SIGN_LABEL_TR[moonSign] ?? moonSign ?? '?',
        asc_sign_label: SIGN_LABEL_TR[ascSign] ?? ascSign ?? '?',
      },
    });
    llmExtra = result.content.trim();
  } catch (err) {
    console.warn('[yildizname] chart_extra_llm_failed', err);
    return reply.status(500).send({ error: 'LLM yorum üretilemedi, tekrar dene.' });
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
