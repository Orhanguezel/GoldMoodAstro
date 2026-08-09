/**
 * İçerik Uyumluluk Denetimi — "bu post kaynağına sadık mı?"
 *
 * Üretim script'lerindeki guard'lar (assertClaimsAreDerived, assertSlidesDiffer,
 * loadSymbols) yalnız BİZİM ürettiğimiz içeriği koruyor. Panelden elle yazılan
 * postlar o guard'lardan geçmiyor. Bu modül aynı kuralları YAYINDAN ÖNCE, panelde
 * görünür hale getirir.
 *
 * Tasarım kararı: çıplak bir puan ne düzelteceğini söylemez. Bu yüzden her bulgu
 * kural adı + seviye + insan okunur mesaj + öneri taşır. Puan sadece sıralama içindir.
 *
 * Seviyeler:
 *   fail (kırmızı) → yayın öncesi düzeltilmeli; içerik yanlış/doğrulanamaz iddia taşıyor
 *   warn (sarı)    → iyileştirilebilir ama yayını engellemez
 *   ok   (yeşil)   → sorun yok
 */
import { db } from "../../db/client";
import { sql } from "drizzle-orm";

export type ComplianceLevel = "ok" | "warn" | "fail";

export type ComplianceFinding = {
  rule: string;
  level: Exclude<ComplianceLevel, "ok">;
  message: string;
  hint: string;
};

export type ComplianceResult = {
  postId: number;
  level: ComplianceLevel;
  score: number; // 0-100, sadece sıralama/özet için
  findings: ComplianceFinding[];
};

type AuditablePost = {
  id: number;
  title?: string | null;
  caption?: string | null;
  hashtags?: string | null;
  imageUrl?: string | null;
  mediaUrls?: unknown;
  postType?: string | null;
  sourceRef?: string | null;
  notes?: string | null;
};

const SIGN_NAMES_TR = [
  "Koç", "Boğa", "İkizler", "Yengeç", "Aslan", "Başak",
  "Terazi", "Akrep", "Yay", "Oğlak", "Kova", "Balık",
];

/** Motorca hesaplanmış lunasyon bloğunun imzası (risingHouseBlock çıktısı). */
const ASTRO_PROVENANCE_MARKERS = ["Yükselenine göre", "🌙"];

/** CTA sayılan kalıplar — rakip analizinde "her postta tek net CTA" kuralı vardı. */
const CTA_PATTERNS = [
  "yorumlara", "yaz", "kaydet", "paylaş", "profili incele", "randevu",
  "linkten", "seç", "etiketle", "oku",
];

let dictionaryCache: { meanings: string[]; names: string[] } | null = null;

/** Rüya + kahve + tarot sözlüklerinin anlam metinleri (provenance kanıtı için). */
async function loadDictionary(): Promise<{ meanings: string[]; names: string[] }> {
  if (dictionaryCache) return dictionaryCache;
  const rows = (await db.execute(sql`
    SELECT name_tr AS name, meaning AS meaning FROM dream_symbols
    UNION ALL SELECT name_tr, meaning FROM coffee_symbols
    UNION ALL SELECT name_tr, upright_meaning FROM tarot_cards
  `)) as unknown as Array<Array<{ name: string; meaning: string }>>;
  const list = (Array.isArray(rows[0]) ? rows[0] : (rows as unknown as Array<{ name: string; meaning: string }>)) ?? [];
  dictionaryCache = {
    names: list.map((r) => r.name).filter(Boolean),
    // Sondaki nokta üretimde kırpılıyor; karşılaştırma için normalize et.
    meanings: list.map((r) => (r.meaning || "").trim().replace(/\.$/, "")).filter(Boolean),
  };
  return dictionaryCache;
}

/** Test/yeniden yükleme için önbelleği boşalt. */
export function resetComplianceCache() {
  dictionaryCache = null;
}

function mentionsSign(text: string): string[] {
  // \b ASCII tabanlı; Türkçe karakterli burçlarda güvenilmez → Unicode lookaround.
  return SIGN_NAMES_TR.filter((sign) => new RegExp(`(?<!\\p{L})${sign}(?!\\p{L})`, "u").test(text));
}

function mediaCount(post: AuditablePost): number {
  const media = Array.isArray(post.mediaUrls) ? post.mediaUrls : [];
  return media.length || (post.imageUrl ? 1 : 0);
}

export async function auditPost(post: AuditablePost): Promise<ComplianceResult> {
  const findings: ComplianceFinding[] = [];
  const caption = (post.caption || "").trim();
  const text = `${post.title || ""}\n${caption}`;

  // ── R1: astrolojik iddia hesaba bağlı mı? (en kritik kural)
  //
  // Provenance üç yoldan gelebilir; üçünü de tanımazsak gösterge gürültüye boğulur
  // ve panelde ciddiye alınmaz (ilk denemede 167 postun 14'ü kırmızıydı, çoğu
  // aslında meşru içerikti):
  //   1. Caption'da hesaplanmış lunasyon bloğu (bizim üretimimiz)
  //   2. Günlük burç postları — içerik daily_horoscopes'tan (LLM job) geliyor
  //   3. Açık editöryel istisna (mizah postu vb.) — notes'ta [editorial] işareti
  const sourceRef = (post.sourceRef || "").toLowerCase();
  const notes = (post.notes || "").toLowerCase();
  const signs = mentionsSign(caption);
  const hasAstroProvenance =
    ASTRO_PROVENANCE_MARKERS.some((m) => caption.includes(m)) ||
    sourceRef.startsWith("daily-horoscope") ||
    notes.includes("[editorial]");
  if (signs.length && !hasAstroProvenance) {
    findings.push({
      rule: "astro-claim-unverified",
      level: "fail",
      message: `Metinde burç adı geçiyor (${signs.join(", ")}) ama hesaplanmış bir dayanak yok.`,
      hint: "Lunasyon içeriğiyse üretimde lunationDate ver; caption'a yükselen-ev dağılımı hesaplanarak eklenir. Elle burç gruplama yapma.",
    });
  }

  // ── R2: sembol/kart adı geçiyorsa anlamı sözlükle örtüşüyor mu?
  // Sadece içerik gerçekten bir sembol/kart AÇIKLIYORSA bak. Sözlükte "Ay", "Su",
  // "El", "Yol", "Kalp" gibi gündelik kelimeler var; bağlam süzgeci olmadan kural
  // 167 postun 80'inde tetikleniyordu (çoğu sembolden hiç söz etmiyordu).
  const explainsSymbol = /(sembol|falı|fali|kart|tarot|rüya|ruya)/i.test(text);
  const dict = explainsSymbol ? await loadDictionary().catch(() => null) : null;
  if (dict) {
    // Bazı sembol adları burç adlarıyla ÇAKIŞIYOR (Aslan, Balık, Yay hem burç hem
    // kahve falı sembolü). Burç kullanımı R1'in işi; burada saymazsak "Yeniay Aslan"
    // metni sembol iddiası sanılıp yanlış alarm veriyordu. Ayrıca tekrarları da ele.
    const namedSymbols = [
      ...new Set(
        dict.names.filter(
          (n) => !SIGN_NAMES_TR.includes(n) && new RegExp(`(?<!\\p{L})${n}(?!\\p{L})`, "u").test(caption),
        ),
      ),
    ];
    if (namedSymbols.length) {
      // Üretim, anlamı cümle içine yerleştirirken ilk harfi küçültüyor
      // ("Yolculuk…" → "Yol: yolculuk…"), bu yüzden karşılaştırma harf duyarsız.
      const captionLower = caption.toLocaleLowerCase("tr");
      const quotesDictionary = dict.meanings.some(
        (m) => m.length > 12 && captionLower.includes(m.toLocaleLowerCase("tr")),
      );
      if (!quotesDictionary) {
        findings.push({
          rule: "symbol-claim-unsourced",
          level: "warn",
          message: `Sembol/kart adı geçiyor (${namedSymbols.slice(0, 3).join(", ")}) ama metin site sözlüğündeki anlamı kullanmıyor.`,
          hint: "Üretimde symbols: { source, slugs } ver — gövde ve görsel aynı slug'dan türer, sitedeki anlamla birebir uyuşur.",
        });
      }
    }
  }

  // ── R3: medya
  if (mediaCount(post) === 0) {
    findings.push({
      rule: "media-missing",
      level: "fail",
      message: "Gönderiye görsel/medya bağlı değil.",
      hint: "Instagram medyasız gönderi kabul etmez; yayın anında hata verir.",
    });
  }

  // ── R4: CTA (rakip analizi: her postta tek net CTA)
  const lowered = caption.toLocaleLowerCase("tr");
  if (caption && !CTA_PATTERNS.some((p) => lowered.includes(p))) {
    findings.push({
      rule: "cta-missing",
      level: "warn",
      message: "Net bir çağrı (CTA) görünmüyor.",
      hint: "Tek ve net bir CTA ekle: 'Kaydet', 'Yükselenini yorumlara yaz', 'Danışman profilini incele'.",
    });
  }

  // ── R5: caption çok kısa
  if (caption.length > 0 && caption.length < 80) {
    findings.push({
      rule: "caption-thin",
      level: "warn",
      message: `Açıklama çok kısa (${caption.length} karakter).`,
      hint: "Görselde az metin, açıklamada uzun anlatım — asıl bağlamı caption taşımalı.",
    });
  }
  if (!caption) {
    findings.push({
      rule: "caption-missing",
      level: "fail",
      message: "Açıklama boş.",
      hint: "Caption olmadan gönderi bağlamsız kalır.",
    });
  }

  // ── R6: hashtag
  if (!(post.hashtags || "").trim() && !caption.includes("#")) {
    findings.push({
      rule: "hashtags-missing",
      level: "warn",
      message: "Hashtag yok.",
      hint: "Keşfet erişimi için marka + konu etiketleri ekle.",
    });
  }

  const fails = findings.filter((f) => f.level === "fail").length;
  const warns = findings.filter((f) => f.level === "warn").length;
  const level: ComplianceLevel = fails ? "fail" : warns ? "warn" : "ok";
  const score = Math.max(0, 100 - fails * 34 - warns * 8);

  return { postId: post.id, level, score, findings };
}

export async function auditPosts(posts: AuditablePost[]): Promise<Record<number, ComplianceResult>> {
  const out: Record<number, ComplianceResult> = {};
  for (const post of posts) out[post.id] = await auditPost(post);
  return out;
}
