// packages/shared-backend/modules/numerology/controller.ts
import type { FastifyReply, FastifyRequest } from 'fastify';
import { randomUUID } from 'crypto';
import * as repo from './repository';
import * as llm from '../llm';
import { calculateNumerology } from './logic';
import { buildFallbackInterpretation } from './fallbackInterpretation';
import { calculateNumerologySchema } from './validation';
import { apiMessage } from '../_shared/api-i18n';

// JWT kimliği `sub`'da taşınır; `id` çoğu yolda undefined (bkz. favorites/controller).
function callerId(req: FastifyRequest): string | null {
  const u = (req as any).user;
  return u?.sub ?? u?.id ?? null;
}

export async function handleCalculate(req: FastifyRequest, reply: FastifyReply) {
  const userId = callerId(req);
  const { full_name, birth_date, locale } = calculateNumerologySchema.parse(req.body);

  const readingId = randomUUID();

  try {
    // 1) Logic Calculation
    const calculation = calculateNumerology(full_name, birth_date);

    // 2) Interpretation via LLM — sağlayıcılar düşükse deterministik yedek.
    let interpretation: string;
    try {
      const result = await llm.generate({
        promptKey: 'numerology_interpretation',
        locale,
        vars: {
          full_name,
          birth_date,
          life_path: calculation.lifePath.toString(),
          destiny: calculation.destiny.toString(),
          soul_urge: calculation.soulUrge.toString(),
          personality: calculation.personality.toString(),
        },
      });
      interpretation = result.content;
    } catch (err) {
      req.log.warn({ err, event: 'numerology_llm_fallback' }, 'numerology_llm_fallback');
      interpretation = buildFallbackInterpretation(calculation, locale);
    }

    // 3) Save to DB
    await repo.createReading({
      id: readingId,
      userId,
      fullName: full_name,
      birthDate: birth_date,
      calculationData: calculation,
      interpretation,
      locale,
    });

    return reply.send({
      data: {
        id: readingId,
        calculation,
        interpretation,
      }
    });

  } catch (err) {
    req.log.error({ err, event: 'numerology_calculate_failed' }, 'numerology_calculate_failed');
    return reply.status(500).send({ error: apiMessage(req, 'numerology_failed') });
  }
}

export async function handleGetMyReadings(req: FastifyRequest, reply: FastifyReply) {
  const userId = callerId(req);
  if (!userId) return reply.status(401).send({ error: apiMessage(req, 'unauthorized') });
  const rows = await repo.getReadingsByUser(userId);
  return reply.send({ data: rows });
}

export async function handleGetReading(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const row = await repo.getReadingById(id);
  if (!row) return reply.status(404).send({ error: apiMessage(req, 'numerology_not_found') });
  // Sahiplik: bir kullanıcıya bağlı okuma yalnız sahibine görünür (KVKK). Anonim okuma açık kalır.
  if ((row as any).userId && (row as any).userId !== callerId(req)) {
    return reply.status(404).send({ error: apiMessage(req, 'numerology_not_found') });
  }
  return reply.send({ data: row });
}
