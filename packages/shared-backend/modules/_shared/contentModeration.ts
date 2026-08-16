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

// ── YASAKLI/RİSKLİ KONULAR (2026-08-16 — Stripe + Meta/Google Ads uyumu) ──
// Kanonik liste BURADADIR; AGENTS.md/CLAUDE.md "Yasaklı içerik konuları"
// bölümü bu listeyi anlatır, uygulaması bu modüldür. Tüketiciler:
//   - social/posts/compliance.ts → panel uyumluluk süzgeci (FB/IG)
//   - checkContent() → review/reading/message moderasyonu
// Hukuki dayanak: AGB/mesafeli sözleşmedeki "sunulmaz" listesi + PSP (Stripe)
// ve reklam (Meta/Google) politikaları. Kategori gizleme = hesap kapatma riski.
//
// SEVİYE FELSEFESİ (gürültü dersinden — bkz. compliance.ts 05a0d42):
//   fail = tek başına yayın engeli (net ihlal kalıpları, dar regex)
//   warn = insan göz atsın (meşru kullanım olasılığı var)
export type RiskyTopicCategory =
  | 'buyu_ritueli'      // büyü, muska, bağlama, celp — PSP'lerin kesin reddi
  | 'kumar'             // bahis/şans oyunu tahmini
  | 'saglik_vaadi'      // teşhis/tedavi/şifa iddiası (HWG + reklam politikaları)
  | 'finans_vaadi'      // yatırım sinyali, zenginlik garantisi
  | 'garanti_vaadi'     // kesin sonuç/%100 vaadi, "geri getirme"
  | 'olum_tahmini'      // ölüm/ecel zamanı
  | 'korku_dili'        // lanet/beddua/felaket korkutması
  | 'hukuk_tavsiyesi';  // hukuki danışmanlık/dava vaadi

export type RiskyTopicMatch = {
  category: RiskyTopicCategory;
  level: 'fail' | 'warn';
  matched: string;
};

const RISKY_TOPIC_RULES: Array<{ category: RiskyTopicCategory; level: 'fail' | 'warn'; pattern: RegExp }> = [
  // Büyü/ritüel hizmeti — "büyülü" (sıfat) ve "büyük/büyüme" eşleşmez (unicode lookaround)
  { category: 'buyu_ritueli', level: 'fail', pattern: /(?<!\p{L})büyü(sü|yü|nün|ler|leri)?(?!\p{L})/iu },
  { category: 'buyu_ritueli', level: 'fail', pattern: /(?<!\p{L})(muska|vefk|hüddam|hüddem|celb?p?iye|musallat|cin\s*(çıkar|çarp))(?!\p{L})/iu },
  { category: 'buyu_ritueli', level: 'fail', pattern: /bağlama\s*(büyü|dua|ritüel)/iu },
  // Kumar/şans oyunu tahmini
  { category: 'kumar', level: 'fail', pattern: /(?<!\p{L})(bahis|iddaa|banko\s*kupon|şans\s*oyun\p{L}*|loto|piyango)(?!\p{L})/iu },
  // Sağlık — sert iddia fail, çıplak terim warn ("sağlığınıza dikkat" serbest; bu kelimeler değil)
  { category: 'saglik_vaadi', level: 'fail', pattern: /(hastalı\p{L}+|kanser|depresyon)\p{L}*\s*\p{L}*\s*(iyileştir|tedavi\s*ed)/iu },
  { category: 'saglik_vaadi', level: 'fail', pattern: /şifa\s*(garanti|dağıt|veriyor)/iu },
  { category: 'saglik_vaadi', level: 'warn', pattern: /(?<!\p{L})(teşhis|tedavi|şifa)(?!\p{L})/iu },
  // Finans — sinyal/garanti fail, "yatırım tavsiyesi" ibaresi warn
  // Aynı cümle içinde (≤40 karakter) borsa/kripto + tahmin/sinyal/al-sat birlikteliği
  { category: 'finans_vaadi', level: 'fail', pattern: /(borsa|hisse|kripto|coin)[^.!?\n]{0,40}(tahmin|öneri|sinyal|al[\s-]*sat)/iu },
  { category: 'finans_vaadi', level: 'fail', pattern: /(zengin\s*(olacak|edece)|bolluk\s*garanti|hangi\s*(hisse|coin))/iu },
  { category: 'finans_vaadi', level: 'warn', pattern: /yatırım\s*tavsiye/iu },
  // Garanti/kesin sonuç + klasik "geri getirme" vaadi
  { category: 'garanti_vaadi', level: 'fail', pattern: /(kesin|garantili?|%\s*100)\s*(sonuç|çözüm|tutar|tahmin)/iu },
  { category: 'garanti_vaadi', level: 'fail', pattern: /(sevgili|aşk|eş)\p{L}*\s*(geri\s*getir|kavuştur)/iu },
  // Ölüm tahmini
  { category: 'olum_tahmini', level: 'fail', pattern: /((ölüm|ecel)\s*(tarihi|zamanı)|ne\s*zaman\s*ölece)/iu },
  // Korku dili — insan göz atsın
  { category: 'korku_dili', level: 'warn', pattern: /(?<!\p{L})(lanetli?|beddua|kötü\s*ruh|başınıza\s*felaket)(?!\p{L})/iu },
  // Hukuk
  { category: 'hukuk_tavsiyesi', level: 'warn', pattern: /(hukuki\s*(tavsiye|danışmanlık)|dava\p{L}*\s*kazan)/iu },
];

/** Metinde yasaklı/riskli konu kalıplarını arar (tüm içerik yüzeyleri için ortak). */
export function findRiskyTopics(text: string): RiskyTopicMatch[] {
  const t = String(text || '');
  if (!t.trim()) return [];
  const out: RiskyTopicMatch[] = [];
  for (const rule of RISKY_TOPIC_RULES) {
    const m = t.match(rule.pattern);
    if (m) out.push({ category: rule.category, level: rule.level, matched: m[0] });
  }
  return out;
}

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

  // Yasaklı/riskli konular — fail seviyesi her bağlamda; warn yalnız LLM
  // çıktılarında (reading) katı, kullanıcı metinlerinde gürültü olmasın diye.
  for (const hit of findRiskyTopics(text)) {
    if (hit.level === 'fail' || context === 'reading') {
      flags.push(`risky_topic:${hit.category}`);
      matched.push(hit.matched);
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
