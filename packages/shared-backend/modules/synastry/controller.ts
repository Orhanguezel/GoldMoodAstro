// packages/shared-backend/modules/synastry/controller.ts
// FAZ 25 / T25-1 — Sinastri (3 mod: manual, quick, invite)
import { createHash, randomUUID } from 'crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { computeNatalChart, computeSynastry } from '../astrology';
import { generate as llmGenerate } from '../llm';
import { db } from '../../db/client';
import * as repo from './repository';
import {
  synastryManualSchema,
  synastryQuickSchema,
  synastryInviteSchema,
} from './validation';
import { hasActiveSubscription, consumeCredits, refundCredits } from '../credits/consume';
import { apiMessage } from '../_shared/api-i18n';

// birthCharts tablosu backend/src/modules/birthCharts/'da (project-specific) — shared
// modülden import edilemez. Bu yüzden raw SQL ile çekiyoruz.
async function fetchUserChart(userId: string, chartId?: string) {
  const sqlStr = chartId
    ? `SELECT id, name, chart_data FROM birth_charts WHERE user_id = ? AND id = ? LIMIT 1`
    : `SELECT id, name, chart_data FROM birth_charts WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`;
  const args = chartId ? [userId, chartId] : [userId];
  const [rows] = await (db as any).session.client.query(sqlStr, args);
  const r = (rows as any[])[0];
  if (!r) return null;
  // chart_data MySQL JSON kolonu — driver auto-parse genellikle eder; emin olmak için cast
  let chart = r.chart_data;
  if (typeof chart === 'string') {
    try { chart = JSON.parse(chart); } catch { /* keep raw */ }
  }
  return { id: String(r.id), name: r.name as string | null, chart_data: chart };
}

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

function signLabel(sign: string, locale: string): string {
  const normalized = locale.toLowerCase().split('-')[0];
  return SIGN_LABELS[normalized]?.[sign] ?? SIGN_LABELS.tr[sign] ?? sign;
}

function userIdFromReq(req: FastifyRequest): string | null {
  const u = (req as any).user;
  return u?.sub ?? u?.id ?? null;
}

/**
 * MANUAL — Auth zorunlu. Kendi chart'ı (varsa chart_id, yoksa ilk) + manuel partner data
 * → Swiss Ephemeris chart compute → synastry → LLM yorum → DB kayıt.
 * MALİYET: Subscription varsa ücretsiz, yoksa 250 kredi.
 */
export async function handleSynastryManual(req: FastifyRequest, reply: FastifyReply) {
  const userId = userIdFromReq(req);
  if (!userId) return reply.status(401).send({ error: apiMessage(req, 'unauthorized') });

  const body = synastryManualSchema.parse(req.body);

  // 1) Kullanıcının chart'ı (raw SQL — birthCharts shared modülde değil)
  const userChart = await fetchUserChart(userId, body.chart_id);
  if (!userChart) {
    return reply.status(404).send({
      error: apiMessage(req, 'own_chart_required'),
      hint_action_path: '/birth-chart',
    });
  }
  const userChartData = userChart.chart_data;

  // 2) Pricing Guard (FAZ 25 / T25-3)
  const reportId = randomUUID();
  const chargeReferenceId = createHash('sha256')
    .update(JSON.stringify({ userId, chartId: userChart.id, partner: body.partner_data }))
    .digest('hex')
    .slice(0, 36);
  let charged = false;
  const isPremium = await hasActiveSubscription(userId);
  
  if (!isPremium) {
    const consume = await consumeCredits({
      userId,
      amount: 250,
      referenceType: 'synastry_manual',
      referenceId: chargeReferenceId,
      description: `Sinastri Analizi: ${userChart.name} & ${body.partner_data.name}`
    });

    if (consume.status === 'insufficient') {
      return reply.status(402).send({
        error: apiMessage(req, 'insufficient_credits'),
        required: 250,
        available: consume.available,
        hint_action_path: '/pricing'
      });
    }
    charged = consume.status === 'consumed';
  }

  try {
    // 3) Partner chart compute (Swiss Ephemeris)
    const partnerInput = body.partner_data;
    const tobKnown = !!partnerInput.tob;
    const partnerChart = await computeNatalChart({
      date: partnerInput.dob,
      time: partnerInput.tob ?? '12:00:00',
      tobKnown,
      latitude: partnerInput.pob_lat,
      longitude: partnerInput.pob_lng,
      tzIana: partnerInput.tz_iana,
    });

  // 4) Synastry compute
  const synastryResult = computeSynastry(userChartData, partnerChart);

  // 5) LLM yorumu (synastry_report prompt key — admin'den editable)
  let interpretation = '';
  let promptId: string | null = null;
  try {
    const aspectsCompact = (synastryResult as any).aspects
      ?.slice(0, 12)
      .map((a: any) => `${a.planet_a} ${a.type} ${a.planet_b} (orb ${a.orb?.toFixed(1)}°)`)
      .join('\n') ?? '';

    const llm = await llmGenerate({
      promptKey: 'synastry_report',
      locale: body.locale,
      vars: {
        user_name: userChart.name ?? 'Sen',
        partner_name: partnerInput.name,
        score: String((synastryResult as any).score ?? ''),
        aspects: aspectsCompact,
      },
    });
    interpretation = llm.content;
    promptId = llm.promptId;
  } catch (err) {
    console.warn('[synastry] llm_failed', err);
    interpretation = '';
  }

  // 6) DB kayıt
  const report = await repo.createSynastryReport({
    id: reportId,
    userId,
    mode: 'manual',
    partnerData: partnerInput,
    result: { ...synastryResult, interpretation, prompt_id: promptId },
  } as any);

    return reply.send({ data: report });
  } catch (err) {
    if (charged) {
      await refundCredits({
        userId,
        amount: 250,
        referenceType: 'synastry_manual',
        referenceId: chargeReferenceId,
        description: 'Sinastri analizi hata nedeniyle iade edildi.',
      });
    }
    throw err;
  }
}

/**
 * INVITE — Partner_user_id ile davet gönderir.
 */
export async function handleCreateSynastryInvite(req: FastifyRequest, reply: FastifyReply) {
  const userId = userIdFromReq(req);
  if (!userId) return reply.status(401).send({ error: apiMessage(req, 'unauthorized') });

  const body = synastryInviteSchema.parse(req.body);

  // Kendine davet atamaz
  if (body.partner_user_id === userId) {
    return reply.status(400).send({ error: apiMessage(req, 'self_invite_forbidden') });
  }

  // Rapor oluştur (invite modunda)
  const report = await repo.createSynastryReport({
    userId,
    partnerUserId: body.partner_user_id,
    mode: 'invite',
    inviteStatus: 'pending',
    result: { note: 'Awaiting partner acceptance' },
  });

  // Partner'a bildirim gönder (opsiyonel hata yakalama)
  try {
    const { createUserNotification } = await import('../notifications/service');
    await createUserNotification({
      userId: body.partner_user_id,
      title: 'Yeni Sinastri Daveti 💖',
      message: 'Biri seninle yıldız uyumuna bakmak istiyor! Onaylamak için sinastri sayfasına git.',
      type: 'info',
    });
  } catch (err) {
    console.warn('[synastry] notification_failed', err);
  }

  return reply.send({ data: report });
}

/** Kullanıcıya gelen davetleri listele */
export async function handleGetMyInvites(req: FastifyRequest, reply: FastifyReply) {
  const userId = userIdFromReq(req);
  if (!userId) return reply.status(401).send({ error: apiMessage(req, 'unauthorized') });
  const invites = await repo.getPendingInvites(userId);
  return reply.send({ data: invites });
}

/** Daveti onayla → Raporu oluştur */
export async function handleAcceptInvite(req: FastifyRequest, reply: FastifyReply) {
  const userId = userIdFromReq(req);
  if (!userId) return reply.status(401).send({ error: apiMessage(req, 'unauthorized') });

  const { id } = req.params as { id: string };
  const invite = await repo.getSynastryReportById(id);

  if (!invite || invite.partnerUserId !== userId || invite.inviteStatus !== 'pending') {
    return reply.status(404).send({ error: apiMessage(req, 'invite_invalid') });
  }

  // 1) Her iki kullanıcının chart'larını bul
  if (!invite.userId) {
    return reply.status(400).send({ error: apiMessage(req, 'inviter_not_found') });
  }
  const userAChart = await fetchUserChart(invite.userId); // Davet eden
  const userBChart = await fetchUserChart(userId);        // Onaylayan (partner)

  if (!userAChart || !userBChart) {
    return reply.status(400).send({ error: apiMessage(req, 'both_charts_required') });
  }

  // 2) Compute Synastry
  const synastryResult = computeSynastry(userAChart.chart_data, userBChart.chart_data);

  // 3) LLM yorumu
  let interpretation = '';
  try {
    const aspectsCompact = (synastryResult as any).aspects
      ?.slice(0, 12)
      .map((a: any) => `${a.planet_a} ${a.type} ${a.planet_b} (orb ${a.orb?.toFixed(1)}°)`)
      .join('\n') ?? '';

    const llm = await llmGenerate({
      promptKey: 'synastry_report',
      locale: String((req as any).locale || (req.headers['x-locale'] as string) || 'tr'),
      vars: {
        user_name: userAChart.name ?? 'Kullanıcı 1',
        partner_name: userBChart.name ?? 'Kullanıcı 2',
        score: String((synastryResult as any).score ?? ''),
        aspects: aspectsCompact,
      },
    });
    interpretation = llm.content;
  } catch (err) {
    console.warn('[synastry] invite_llm_failed', err);
  }

  // 4) Güncelle
  const updated = await repo.updateSynastryReport(id, {
    inviteStatus: 'accepted',
    result: { ...synastryResult, interpretation },
  });

  return reply.send({ data: updated });
}

/** Daveti reddet */
export async function handleDeclineInvite(req: FastifyRequest, reply: FastifyReply) {
  const userId = userIdFromReq(req);
  if (!userId) return reply.status(401).send({ error: apiMessage(req, 'unauthorized') });

  const { id } = req.params as { id: string };
  const invite = await repo.getSynastryReportById(id);

  if (!invite || invite.partnerUserId !== userId) {
    return reply.status(404).send({ error: apiMessage(req, 'invite_not_found') });
  }

  await repo.updateSynastryReport(id, { inviteStatus: 'declined' });
  return reply.send({ success: true });
}

/**
 * QUICK — Auth opsiyonel. Sadece 2 burç → ücretsiz uyum yorumu (LLM).
 * KVKK: hiçbir kişisel veri saklanmaz, ham LLM çıktısı döner.
 */
export async function handleSynastryQuick(req: FastifyRequest, reply: FastifyReply) {
  const body = synastryQuickSchema.parse(req.body);

  const llm = await llmGenerate({
    promptKey: 'compatibility_signs',
    locale: body.locale,
    vars: {
      sign_a_label: signLabel(body.sign_a, body.locale),
      sign_b_label: signLabel(body.sign_b, body.locale),
    },
  });

  // compatibility_signs prompt JSON dönmek üzere yapılandırıldı; ham metin de döndür.
  let parsed: Record<string, unknown> | null = null;
  const match = llm.content.match(/\{[\s\S]*\}/);
  if (match) {
    try { parsed = JSON.parse(match[0]); } catch { parsed = null; }
  }

  return reply.send({
    data: {
      sign_a: body.sign_a,
      sign_b: body.sign_b,
      result: parsed,
      raw: llm.content,
    },
  });
}

/** Geçmiş raporlar (auth) */
export async function handleGetMySynastry(req: FastifyRequest, reply: FastifyReply) {
  const userId = userIdFromReq(req);
  if (!userId) return reply.status(401).send({ error: apiMessage(req, 'unauthorized') });
  const reports = await repo.getMySynastryReports(userId);
  return reply.send({ data: reports });
}

/**
 * FAZ 26 / T26-2 — Tek rapor public endpoint (paylaşım linki için).
 * Quick mode raporlarını saklamadığımız için sadece manual/invite raporları döner.
 * Gizlilik: rapor sahibi olmayan biri ID'yi bilirse görebilir (paylaşım için zaten
 * URL'i biliyor demektir). KVKK için partner_data field'ları kısıtlı döndürülür.
 */
export async function handleGetSynastryReport(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const report = await repo.getSynastryReportById(id);
  if (!report) return reply.status(404).send({ error: apiMessage(req, 'report_not_found') });

  // Public görünüm: partner_data'dan PII'yi çıkar (sadece isim kalır)
  const partnerData = report.partnerData as any;
  const sanitizedPartnerData = partnerData
    ? { name: partnerData.name }
    : null;

  return reply.send({
    data: {
      id: report.id,
      mode: report.mode,
      partner_data: sanitizedPartnerData,
      result: report.result,
      created_at: report.createdAt,
    },
  });
}
