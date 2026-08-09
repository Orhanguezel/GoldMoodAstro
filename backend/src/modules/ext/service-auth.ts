import type { FastifyReply, FastifyRequest } from 'fastify';
import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Dış tüketici (ekosistem sosyal medya backend'i) için servisten-servise auth.
 * Statik, rotate edilebilir API key(ler). Header: `X-Api-Key` veya `Authorization: Bearer`.
 *
 * FAIL-CLOSED: EXT_API_KEY set edilmemişse HİÇBİR istek geçmez (403/503). Secret
 * fallback varsayılanı YASAK (workspace kuralı) — bu yüzden burada da default key yok.
 *
 * EXT_API_KEY birden fazla değeri virgülle taşıyabilir → anahtar rotasyonu sırasında
 * eski + yeni key aynı anda geçerli olur.
 */
function loadKeys(): string[] {
  const raw = process.env.EXT_API_KEY ?? '';
  return raw
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
}

function extractKey(req: FastifyRequest): string | null {
  const apiKey = req.headers['x-api-key'];
  if (typeof apiKey === 'string' && apiKey.trim()) return apiKey.trim();
  const auth = req.headers['authorization'];
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) return auth.slice(7).trim();
  return null;
}

// Sabit-zaman karşılaştırma. Girişleri sha256'la → uzunluk sızıntısını da engeller.
function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

export async function requireServiceToken(req: FastifyRequest, reply: FastifyReply) {
  const keys = loadKeys();
  if (keys.length === 0) {
    // Fail-closed: key yapılandırılmamış → dış API tamamen kapalı.
    return reply.code(503).send({ error: { message: 'ext_api_disabled' } });
  }
  const provided = extractKey(req);
  if (!provided) {
    return reply.code(401).send({ error: { message: 'missing_api_key' } });
  }
  if (!keys.some((k) => safeEqual(k, provided))) {
    return reply.code(401).send({ error: { message: 'invalid_api_key' } });
  }
}
