// =============================================================
// FAZ 19 / T19-5 — Embedding-tabanlı anti-copy-paste
// OpenAI text-embedding-3-small (1536 boyut) — ucuz: $0.02/1M token
// =============================================================
//
// Kullanım:
//  const v = await embed("Senin için bugün...");
//  const sim = cosineSimilarity(v, otherVector);
//
// Bulk:
//  const vectors = await embedBulk(["t1", "t2", ...]);  // tek API çağrısı (max 2048 input)
//
// Provider: env.EMBEDDING_PROVIDER (default 'openai').
//   - 'openai': OPENAI_API_KEY (veya EMBEDDING_API_KEY override)
//   - 'voyage': VOYAGE_API_KEY (alternatif, henüz implement edilmedi)
// =============================================================

export type EmbeddingVector = number[];

export type EmbeddingProvider = 'openai' | 'voyage';

const DEFAULT_MODEL: Record<EmbeddingProvider, string> = {
  openai: 'text-embedding-3-small',
  voyage: 'voyage-2',
};

const DEFAULT_DIMENSIONS = 1536; // text-embedding-3-small

const OPENAI_BATCH_LIMIT = 2048;
const TIMEOUT_MS = 30_000;

export class EmbeddingError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'EmbeddingError';
  }
}

function getProvider(): EmbeddingProvider {
  const p = (process.env.EMBEDDING_PROVIDER || 'openai').toLowerCase();
  if (p === 'voyage') return 'voyage';
  return 'openai';
}

function getApiKey(provider: EmbeddingProvider): string {
  const overrideKey = process.env.EMBEDDING_API_KEY;
  if (overrideKey) return overrideKey;
  if (provider === 'openai') return process.env.OPENAI_API_KEY || '';
  if (provider === 'voyage') return process.env.VOYAGE_API_KEY || '';
  return '';
}

function getModel(): string {
  const override = process.env.EMBEDDING_MODEL;
  if (override) return override;
  return DEFAULT_MODEL[getProvider()];
}

// ─── OpenAI text-embedding-3-small ───────────────────────────
async function embedOpenAI(texts: string[]): Promise<EmbeddingVector[]> {
  const apiKey = getApiKey('openai');
  if (!apiKey) throw new EmbeddingError('OPENAI_API_KEY missing');

  const baseUrl = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';

  const res = await fetch(`${baseUrl}/embeddings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: getModel(),
      input: texts,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new EmbeddingError(`openai_embed_${res.status}: ${txt.slice(0, 200)}`, res.status);
  }

  const data = (await res.json()) as {
    data?: Array<{ embedding?: EmbeddingVector; index?: number }>;
  };

  const vectors = (data.data ?? [])
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .map((d) => d.embedding ?? []);

  if (vectors.length !== texts.length) {
    throw new EmbeddingError(`embedding_count_mismatch: expected ${texts.length}, got ${vectors.length}`);
  }
  return vectors;
}

// ─── Public API ──────────────────────────────────────────────

/** Tek metin için embedding hesapla. Batch için `embedBulk` daha verimli. */
export async function embed(text: string): Promise<EmbeddingVector> {
  const trimmed = (text ?? '').trim();
  if (!trimmed) return new Array(DEFAULT_DIMENSIONS).fill(0);
  const [vec] = await embedBulk([trimmed]);
  return vec;
}

/** Toplu embedding. OpenAI 2048 input limiti — bunu aşarsa otomatik chunk eder. */
export async function embedBulk(texts: string[]): Promise<EmbeddingVector[]> {
  if (!texts.length) return [];
  const provider = getProvider();
  if (provider !== 'openai') {
    throw new EmbeddingError(`provider_not_implemented: ${provider}`);
  }

  // Boş/sadece whitespace metinleri zero-vector ile işaretle (API çağırma)
  const nonEmptyIndices: number[] = [];
  const nonEmptyTexts: string[] = [];
  texts.forEach((t, i) => {
    if (t && t.trim()) {
      nonEmptyIndices.push(i);
      nonEmptyTexts.push(t.trim());
    }
  });

  // Sonuç vektör dizisi (boşlar için zero-vector)
  const out: EmbeddingVector[] = texts.map(() => new Array(DEFAULT_DIMENSIONS).fill(0));

  // Chunk'la (2048 batch)
  for (let i = 0; i < nonEmptyTexts.length; i += OPENAI_BATCH_LIMIT) {
    const chunk = nonEmptyTexts.slice(i, i + OPENAI_BATCH_LIMIT);
    const chunkVectors = await embedOpenAI(chunk);
    for (let j = 0; j < chunkVectors.length; j++) {
      const targetIndex = nonEmptyIndices[i + j];
      out[targetIndex] = chunkVectors[j];
    }
  }
  return out;
}

// ─── Cosine similarity ───────────────────────────────────────
export function cosineSimilarity(a: EmbeddingVector, b: EmbeddingVector): number {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  if (denom === 0) return 0;
  return dot / denom;
}

/** Verilen `query` vektörü ile `candidates` arasında en yüksek cosine similarity'yi döndürür.
 *  Eğer candidate vektörü boş/zero ise atlanır. */
export function maxCosineSimilarity(
  query: EmbeddingVector,
  candidates: EmbeddingVector[],
): number {
  if (!candidates.length) return 0;
  let max = 0;
  for (const c of candidates) {
    if (!c?.length || c.every((v) => v === 0)) continue;
    const sim = cosineSimilarity(query, c);
    if (sim > max) max = sim;
  }
  return max;
}

/** Embedding provider aktif mi? (env'de key var mı) */
export function isEmbeddingAvailable(): boolean {
  return Boolean(getApiKey(getProvider()));
}
