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

// Backward-compat: mevcut readings/safety isUnsafeReading
export function isUnsafeReading(content: string): boolean {
  return !checkContent(content, 'reading').safe;
}

export function isUnsafeReview(content: string): boolean {
  return !checkContent(content, 'review').safe;
}
