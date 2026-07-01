// packages/shared-backend/modules/coffee/controller.ts
// FAZ 22 / T22-1 — Kahve Falı: 3 fotoğraf → Vision sembol tespit → KB harmanla → yorum
import type { FastifyReply, FastifyRequest } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import * as repo from './repository';
import * as llm from '../llm';
import { db } from '../../db/client';
import { storageAssets } from '../storage/schema';
import { inArray } from 'drizzle-orm';
import { createReadingSchema } from './validation';
import { apiMessage } from '../_shared/api-i18n';

type DetectedSymbol = {
  name: string;
  position: 'cup' | 'saucer';
  confidence: number;
};

const PUBLIC_URL = (process.env.PUBLIC_URL || '').replace(/\/$/, '');

function toAbsoluteUrl(publicUrl: string): string {
  if (/^https?:\/\//i.test(publicUrl)) return publicUrl;
  if (!PUBLIC_URL) return publicUrl; // local dev: Anthropic URL kabul etmez, yine de hata için bırak
  return `${PUBLIC_URL}${publicUrl.startsWith('/') ? '' : '/'}${publicUrl}`;
}

function parseSymbolsJson(raw: string): DetectedSymbol[] {
  if (!raw) return [];
  // LLM bazen ```json ... ``` veya açıklayıcı metin dönebilir → JSON object'i extract et
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]);
    const arr = Array.isArray(parsed?.symbols) ? parsed.symbols : [];
    return arr
      .filter((s: any) => s && typeof s.name === 'string')
      .map((s: any) => ({
        name: String(s.name).trim(),
        position: (s.position === 'saucer' ? 'saucer' : 'cup') as 'cup' | 'saucer',
        confidence: Math.max(0, Math.min(1, Number(s.confidence ?? 0))),
      }))
      .filter((s: DetectedSymbol) => s.confidence >= 0.5);
  } catch {
    return [];
  }
}

/** KB'den tespit edilen sembol isimlerine karşılık gelen anlam metinlerini topla. */
async function buildSymbolsKbContext(symbols: DetectedSymbol[], locale: string): Promise<string> {
  if (!symbols.length) return '(Tespit edilen sembol yok)';
  const names = [...new Set(symbols.map((s) => s.name))];
  const all = await repo.getSymbols(locale);
  const lookup = new Map<string, { name: string; meaning: string }>();
  for (const row of all as any[]) {
    const localizedName = String(row.name ?? row.nameTr ?? row.name_tr ?? '').toLowerCase().trim();
    const trName = String(row.nameTr ?? row.name_tr ?? '').toLowerCase().trim();
    const value = {
      name: String(row.name ?? row.nameTr ?? row.name_tr ?? ''),
      meaning: String(row.meaning ?? ''),
    };
    if (localizedName) lookup.set(localizedName, value);
    if (trName) lookup.set(trName, value);
  }
  const lines: string[] = [];
  for (const n of names) {
    const found = lookup.get(n.toLowerCase().trim());
    if (found) {
      lines.push(`- **${found.name}**: ${found.meaning}`);
    } else {
      lines.push(`- **${n}**: (KB'de yok — geleneksel anlamı LLM kendi bilgisinden çıkarsın)`);
    }
  }
  return lines.join('\n');
}

export async function handleRead(req: FastifyRequest, reply: FastifyReply) {
  const user = (req as any).user;
  const body = createReadingSchema.parse(req.body);
  const { image_ids, locale } = body;

  const readingId = uuidv4();

  // 1) Storage'den 3 görseli çek
  const images = await db
    .select()
    .from(storageAssets)
    .where(inArray(storageAssets.id, image_ids));
  if (images.length < 3) {
    return reply.status(400).send({ error: apiMessage(req, 'coffee_images_required') });
  }

  // 2) Pending kayıt
  await repo.createReading({
    id: readingId,
    userId: user?.id || null,
    imageIds: image_ids,
    status: 'processing',
    locale,
  });

  try {
    // 3) Vision API: Sembol tespit (3 fotoğraf → JSON)
    const absoluteUrls = images.map((img: any) => toAbsoluteUrl(img.publicUrl ?? img.public_url));
    const detection = await llm.generate({
      promptKey: 'coffee_symbol_detection',
      locale,
      vars: {},
      images: absoluteUrls,
    });

    const symbols = parseSymbolsJson(detection.content);

    // 4) KB harmanlama (sembol → klasik anlam)
    const symbolsKb = await buildSymbolsKbContext(symbols, locale);
    const symbolsContext = symbols.length
      ? symbols
          .map(
            (s) =>
              `- ${s.name} (${s.position}): %${Math.round(s.confidence * 100)} güven`,
          )
          .join('\n')
      : '(Sembol tespit edilemedi)';

    // 5) Yorum üret
    const interpretation = await llm.generate({
      promptKey: 'coffee_interpretation',
      locale,
      vars: {
        symbols_context: symbolsContext,
        symbols_kb: symbolsKb,
      },
    });

    // 6) Kaydı güncelle
    await repo.updateReading(readingId, {
      detectedSymbols: symbols,
      interpretation: interpretation.content,
      status: 'completed',
    });

    return reply.send({
      data: {
        id: readingId,
        symbols,
        interpretation: interpretation.content,
      },
    });
  } catch (err) {
    console.error('[coffee] reading_failed', err);
    await repo.updateReading(readingId, { status: 'failed' });
    return reply.status(500).send({
      error: apiMessage(req, 'coffee_failed'),
    });
  }
}

export async function handleGetMyReadings(req: FastifyRequest, reply: FastifyReply) {
  const user = (req as any).user;
  if (!user) return reply.status(401).send({ error: apiMessage(req, 'unauthorized') });
  const readings = await repo.getReadingsByUser(user.id);
  return reply.send({ data: readings });
}

export async function handleGetReading(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: string };
  const reading = await repo.getReadingById(id);
  if (!reading) return reply.status(404).send({ error: apiMessage(req, 'coffee_not_found') });
  // Sahiplik: bir kullanıcıya bağlı okuma yalnız sahibine görünür (KVKK). Anonim okuma açık kalır.
  const caller = (req as any).user;
  if ((reading as any).userId && (reading as any).userId !== caller?.id) {
    return reply.status(404).send({ error: apiMessage(req, 'coffee_not_found') });
  }
  return reply.send({ data: reading });
}
