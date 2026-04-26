const EMBEDDING_DIMS = 128;

function hashToken(token: string) {
  let h = 2166136261;
  for (let i = 0; i < token.length; i += 1) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function normalize(v: number[]) {
  const norm = Math.sqrt(v.reduce((sum, n) => sum + n * n, 0)) || 1;
  return v.map((n) => Number((n / norm).toFixed(8)));
}

export function deterministicEmbedding(text: string) {
  const out = Array.from({ length: EMBEDDING_DIMS }, () => 0);
  for (const token of text.toLowerCase().split(/\W+/).filter(Boolean)) {
    const h = hashToken(token);
    out[h % EMBEDDING_DIMS] += h % 2 === 0 ? 1 : -1;
  }
  return normalize(out);
}

export async function createEmbedding(text: string): Promise<{ embedding: number[]; model: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
  if (!apiKey) return { embedding: deterministicEmbedding(text), model: 'deterministic-local' };

  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, input: text }),
  });

  if (!res.ok) return { embedding: deterministicEmbedding(text), model: 'deterministic-local' };
  const data = (await res.json()) as { data?: Array<{ embedding?: number[] }> };
  return { embedding: data.data?.[0]?.embedding ?? deterministicEmbedding(text), model };
}

export function cosineSimilarity(a: number[] | null | undefined, b: number[] | null | undefined) {
  if (!a?.length || !b?.length) return 0;
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let an = 0;
  let bn = 0;
  for (let i = 0; i < len; i += 1) {
    dot += a[i] * b[i];
    an += a[i] * a[i];
    bn += b[i] * b[i];
  }
  return dot / ((Math.sqrt(an) || 1) * (Math.sqrt(bn) || 1));
}
