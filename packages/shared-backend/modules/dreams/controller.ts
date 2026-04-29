// packages/shared-backend/modules/dreams/controller.ts
import type { FastifyReply, FastifyRequest } from 'fastify';
import { randomUUID } from 'crypto';
import * as repo from './repository';
import * as llm from '../llm';
import { interpretDreamSchema } from './validation';

export async function handleInterpret(req: FastifyRequest, reply: FastifyReply) {
  const user = (req as any).user;
  const { dream_text, locale } = interpretDreamSchema.parse(req.body);

  const interpretationId = randomUUID();

  try {
    // 1) Symbol Detection
    const detection = await llm.generate({
      promptKey: 'dream_symbol_detection',
      locale,
      vars: { dream_text },
    });

    let symbols: Array<{ name?: string; confidence?: number }> = [];
    const jsonMatch = detection.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        symbols = Array.isArray(parsed.symbols) ? parsed.symbols : [];
      } catch (e) {
        console.error('Failed to parse dream symbols JSON:', e);
      }
    }

    // 2) KB Context
    const allKbSymbols = await repo.getSymbols();
    const lookup = new Map<string, string>();
    for (const s of allKbSymbols as any[]) {
      lookup.set(String(s.nameTr || '').toLowerCase(), String(s.meaning || ''));
    }

    const kbLines: string[] = [];
    for (const s of symbols) {
      const meaning = lookup.get(String(s.name || '').toLowerCase());
      if (meaning) {
        kbLines.push(`- **${s.name}**: ${meaning}`);
      }
    }
    const symbolsKb = kbLines.length > 0 ? kbLines.join('\n') : '(KB eşleşmesi yok)';

    // 3) Final Interpretation
    const result = await llm.generate({
      promptKey: 'dream_interpretation',
      locale,
      vars: {
        dream_text,
        symbols_context: symbols.map((s: any) => `- ${s.name} (%${Math.round(s.confidence * 100)} güven)`).join('\n'),
        symbols_kb: symbolsKb,
      },
    });

    // 4) Save
    await repo.createInterpretation({
      id: interpretationId,
      userId: user?.id || null,
      dreamText: dream_text,
      detectedSymbols: symbols,
      interpretation: result.content,
      locale,
    });

    return reply.send({
      data: {
        id: interpretationId,
        symbols,
        interpretation: result.content,
      }
    });

  } catch (err) {
    console.error('Dream Interpretation Error:', err);
    return reply.status(500).send({ error: 'Rüya yorumlanırken bir hata oluştu.' });
  }
}

export async function handleGetMyInterpretations(req: FastifyRequest, reply: FastifyReply) {
  const user = (req as any).user;
  if (!user) return reply.status(401).send({ error: 'Yetkisiz erişim.' });
  const rows = await repo.getInterpretationsByUser(user.id);
  return reply.send({ data: rows });
}

export async function handleGetInterpretation(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const row = await repo.getInterpretationById(id);
  if (!row) return reply.status(404).send({ error: 'Rüya yorumu bulunamadı.' });
  return reply.send({ data: row });
}
