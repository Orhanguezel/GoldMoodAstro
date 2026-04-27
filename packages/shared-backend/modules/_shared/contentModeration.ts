// FAZ 17 / T17-3 — Ortak içerik moderasyon yardımcıları
//
// Şu an regex tabanlı (offline). Gelecekte ANTHROPIC_API_KEY veya
// OPENAI_API_KEY env tanımlıysa LLM moderation API'sine fallback.
//
// Kullanım:
//   - readings/safety.ts → reading üretiminde
//   - review/repository.ts → review create auto-approval kararı
//   - support/contact → spam/küfür filtresi (gelecek)

// ── Türkçe + İngilizce yaygın küfür / zarar verici ifadeler ──
// Liste eksiksiz değil, başlangıç seti. Genişletilebilir.
const PROFANITY_PATTERNS: RegExp[] = [
  // Türkçe ağır küfür kökleri
  /\bs[ie]ki[sş]/i,
  /\bama?[sş]?[ie]kt[ie]/i,
  /\bor(o|0)spu/i,
  /\bpe(z|s)evenk/i,
  /\b[gj]ot v(e|0)r/i,
  /\bya[ar]ra+[gk]/i,
  /\bgöt(ünü|üne)?\s*(ye|sik|si)/i,
  /\bana(y[ıi]n[ıi]?|n[ıi]?)\s*s[ie]k/i,
  /\bmal\s*(amk|amına?)/i,
  /\bp[ie]+çh?\b/i,
  // İngilizce
  /\bf+u+c+k+/i,
  /\b(ass|asshole)\b/i,
  /\bs+h+i+t+\b/i,
  /\bbitch\b/i,
  // Spam/url tarzı
  /https?:\/\/[^\s]{15,}/i,
  /\b(viagra|kumar|bahis|casino)\b/i,
];

// ── Astrolojide zarar verici kehanet kalıpları (mevcut readings/safety) ──
const HARMFUL_PROPHECY_PATTERNS: RegExp[] = [
  /öl(ü|u)m/i,
  /ağır hastalık/i,
  /agir hastalik/i,
  /ayrılık kesin/i,
  /ayrilik kesin/i,
  /ihanet/i,
  /kesinlikle/i,
  /kaçınılmaz/i,
  /kacinilmaz/i,
];

export type ModerationContext = 'review' | 'reading' | 'message' | 'profile';

export type ModerationResult = {
  safe: boolean;
  flags: string[];                  // tetiklenen kategoriler: 'profanity', 'spam', 'harmful_prophecy', ...
  matched_patterns?: string[];      // hangi regex eşleşti (debug için)
};

type OpenAIModerationResponse = {
  results?: Array<{
    flagged?: boolean;
    categories?: Record<string, boolean>;
    category_scores?: Record<string, number>;
  }>;
};

function toFlagsFromOpenAICategories(categories?: Record<string, boolean>) {
  if (!categories) return [];
  return Object.entries(categories)
    .filter(([, v]) => v)
    .map(([k]) => `openai:${k}`);
}

async function openAIModeration(content: string): Promise<ModerationResult> {
  const apiKey = String(process.env.OPENAI_API_KEY || '').trim();
  if (!apiKey) {
    return { safe: true, flags: [] };
  }

  const response = await fetch('https://api.openai.com/v1/moderations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: content,
    }),
  });

  if (!response.ok) {
    // Network / API hatası: güvenli tarafta kal, offline kurallar geçerli
    return { safe: true, flags: [] };
  }

  const payload = (await response.json()) as OpenAIModerationResponse;
  const first = payload?.results?.[0];
  if (!first) {
    return { safe: true, flags: [] };
  }

  const categoryFlags = toFlagsFromOpenAICategories(first.categories);
  const flagged = Boolean(first.flagged) || categoryFlags.length > 0;
  return {
    safe: !flagged,
    flags: categoryFlags,
    matched_patterns: first.category_scores ? Object.keys(first.category_scores).filter((k) => first.category_scores![k] > 0.45) : categoryFlags,
  };
}

export function checkContent(
  content: string,
  context: ModerationContext = 'review',
): ModerationResult {
  const text = String(content || '').trim();
  if (!text) return { safe: true, flags: [] };

  const flags: string[] = [];
  const matched: string[] = [];

  // Profanity / spam — tüm bağlamlarda kontrol
  for (const re of PROFANITY_PATTERNS) {
    if (re.test(text)) {
      flags.push(re.source.includes('http') || re.source.includes('viagra') ? 'spam' : 'profanity');
      matched.push(re.source);
      break;
    }
  }

  // Astrolojiye özgü zarar verici kehanet — sadece reading bağlamında
  if (context === 'reading') {
    for (const re of HARMFUL_PROPHECY_PATTERNS) {
      if (re.test(text)) {
        flags.push('harmful_prophecy');
        matched.push(re.source);
        break;
      }
    }
  }

  // Çok kısa içerik — şüpheli (review kuralı)
  if (context === 'review' && text.length < 8) {
    flags.push('too_short');
  }

  // Tüm büyük harf — bağırma/spam
  if (text.length > 20 && text === text.toUpperCase() && /[A-Z]/.test(text)) {
    flags.push('all_caps');
  }

  return {
    safe: flags.length === 0,
    flags: [...new Set(flags)],
    matched_patterns: matched.length > 0 ? matched : undefined,
  };
}

export async function checkContentAsync(
  content: string,
  context: ModerationContext = 'review',
): Promise<ModerationResult> {
  const syncResult = checkContent(content, context);
  if (!syncResult.safe) return syncResult;

  if (context !== 'review' || !String(content || '').trim()) return syncResult;

  try {
    const remoteResult = await openAIModeration(content);
    if (!remoteResult.safe) {
      return {
        safe: false,
        flags: [...new Set([...syncResult.flags, ...remoteResult.flags])],
        matched_patterns: [...new Set([...(syncResult.matched_patterns ?? []), ...(remoteResult.matched_patterns ?? [])])],
      };
    }
  } catch {
    return syncResult;
  }

  return syncResult;
}

// Backward-compat: mevcut readings/safety isUnsafeReading
export function isUnsafeReading(content: string): boolean {
  return !checkContent(content, 'reading').safe;
}

export function isUnsafeReview(content: string): boolean {
  return !checkContent(content, 'review').safe;
}
