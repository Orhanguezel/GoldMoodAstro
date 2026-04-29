// packages/shared-backend/modules/numerology/controller.ts
import type { FastifyReply, FastifyRequest } from 'fastify';
import { randomUUID } from 'crypto';
import * as repo from './repository';
import * as llm from '../llm';
import { calculateNumerology } from './logic';
import { calculateNumerologySchema } from './validation';

export async function handleCalculate(req: FastifyRequest, reply: FastifyReply) {
  const user = (req as any).user;
  const { full_name, birth_date, locale } = calculateNumerologySchema.parse(req.body);

  const readingId = randomUUID();

  try {
    // 1) Logic Calculation
    const calculation = calculateNumerology(full_name, birth_date);

    // 2) Interpretation via LLM
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

    // 3) Save to DB
    await repo.createReading({
      id: readingId,
      userId: user?.id || null,
      fullName: full_name,
      birthDate: birth_date,
      calculationData: calculation,
      interpretation: result.content,
      locale,
    });

    return reply.send({
      data: {
        id: readingId,
        calculation,
        interpretation: result.content,
      }
    });

  } catch (err) {
    console.error('Numerology Calculation Error:', err);
    return reply.status(500).send({ error: 'Numeroloji hesaplanırken bir hata oluştu.' });
  }
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
  if (!row) return reply.status(404).send({ error: 'Numeroloji raporu bulunamadı.' });
  return reply.send({ data: row });
}
