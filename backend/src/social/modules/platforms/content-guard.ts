/**
 * Yayin-oncesi icerik dogrulama kapisi.
 *
 * AI ureticileri (Groq/llama gibi zayif modeller) zaman zaman:
 *  - placeholder URL uydurur (https://example.com)
 *  - yabanci dile kayar ("nossa sayfasini ziyaret edin")
 * Bu icerik X/Facebook'a yayinlanmadan ONCE burada bloklanir; publisher postu
 * "failed" isaretler ve Telegram'a bildirir. Boylece bozuk tweet canliya cikmaz.
 *
 * Olay: 2026-06-03 @haldefiyat "...nossa sayfasini ziyaret edin 👉 https://example.com".
 */

export interface GuardResult {
  ok: boolean;
  reason?: string;
}

// Gercek markaya ait olmayan, model tarafindan uydurulan placeholder host'lar.
const PLACEHOLDER_HOSTS = [
  "example.com",
  "example.org",
  "example.net",
  "example.edu",
  "yourdomain.com",
  "your-site.com",
  "your-website.com",
  "site.com",
  "domain.com",
  "link.com",
  "url.com",
  "website.com",
];

// Turkce icerikte gorulmemesi gereken yabanci dil belirtecleri (PT/ES/IT/EN/DE/FR).
// Kelime sinirlariyla eslesir; Turkce metinde false-positive riski dusuk tutuldu.
const FOREIGN_MARKERS = [
  "nossa", "nosso", "nuestra", "nuestro", "nuestros",
  "página", "pagina web", "sitio web", "visite", "visita nuestra",
  "visit our", "our page", "our website", "our site", "click here",
  "notre site", "notre page", "besuchen sie", "unsere seite",
  "la nostra", "il nostro", "visita il",
];

const URL_RE = /https?:\/\/[^\s<>"')]+/gi;
const BRAND_TAG = "#halfiyatları";
const GENERIC_HALDEFIYAT_HOOKS = [
  "bugün hal fiyatlarında büyük değişiklik",
  "bugun hal fiyatlarinda buyuk degisiklik",
  "hal fiyatlarında büyük değişiklik",
  "hal fiyatlarinda buyuk degisiklik",
];
const SPAMMY_PATTERNS = [
  "bugün x'de",
  "bugun x'de",
  "bugün twitter'da",
  "bugun twitter'da",
  "son dakika",
  "otomatik haber",
  "otomatik paylaşım",
  "otomatik paylasim",
  "ai tarafından",
  "ai tarafindan",
];

function extractHosts(text: string): string[] {
  const hosts: string[] = [];
  for (const match of text.matchAll(URL_RE)) {
    try {
      hosts.push(new URL(match[0]).host.toLowerCase().replace(/^www\./, ""));
    } catch {
      // bozuk URL — host cikarilamadi, ignore
    }
  }
  return hosts;
}

/**
 * Yayinlanacak metni dogrular. ok=false donen post yayinlanmaz.
 */
export function validatePublishContent(input: {
  caption?: string | null;
  hashtags?: string | null;
  linkUrl?: string | null;
  requiredBrandTag?: string | null;
  maxHashtags?: number | null;
}): GuardResult {
  const caption = (input.caption || "").trim();
  if (!caption) {
    return { ok: false, reason: "Bos caption — yayinlanmadi" };
  }

  const haystack = `${caption}\n${input.linkUrl || ""}`;

  const hosts = extractHosts(haystack);
  const badHost = hosts.find((host) =>
    PLACEHOLDER_HOSTS.some((bad) => host === bad || host.endsWith(`.${bad}`)),
  );
  if (badHost) {
    return { ok: false, reason: `Placeholder URL tespit edildi (${badHost}) — AI uydurmasi, yayinlanmadi` };
  }

  const lower = haystack.toLowerCase();
  const foreign = FOREIGN_MARKERS.find((marker) => {
    const re = new RegExp(`(^|[^\\p{L}])${marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^\\p{L}]|$)`, "iu");
    return re.test(lower);
  });
  if (foreign) {
    return { ok: false, reason: `Yabanci dil belirteci tespit edildi ("${foreign}") — Turkce disi icerik, yayinlanmadi` };
  }

  const genericHook = GENERIC_HALDEFIYAT_HOOKS.find((phrase) => lower.includes(phrase));
  if (genericHook) {
    return { ok: false, reason: `Jenerik hal fiyat hook'u tespit edildi ("${genericHook}") — yayinlanmadi` };
  }
  const spammy = SPAMMY_PATTERNS.find((phrase) => lower.includes(phrase));
  if (spammy) {
    return { ok: false, reason: `Spam gorunumlu kalip tespit edildi ("${spammy}") — yayinlanmadi` };
  }

  const tags = (input.hashtags || "")
    .split(/\s+/)
    .map((tag) => tag.trim())
    .filter(Boolean);
  if (tags.some((tag) => tag === "#" || !tag.startsWith("#"))) {
    return { ok: false, reason: "Gecersiz hashtag formati — yayinlanmadi" };
  }
  const normalizedTags = tags.map((tag) => tag.toLocaleLowerCase("tr-TR"));
  if (new Set(normalizedTags).size !== normalizedTags.length) {
    return { ok: false, reason: "Tekrarlanan hashtag tespit edildi — yayinlanmadi" };
  }
  const maxHashtags = input.maxHashtags ?? 4;
  if (tags.length > maxHashtags) {
    return { ok: false, reason: `Hashtag limiti asildi (max ${maxHashtags}) — yayinlanmadi` };
  }

  const requiredBrandTag = input.requiredBrandTag?.trim() || (tags.includes(BRAND_TAG) ? BRAND_TAG : "");
  if (requiredBrandTag) {
    const hasBrand = normalizedTags.includes(requiredBrandTag.toLocaleLowerCase("tr-TR"));
    if (!hasBrand) {
      return { ok: false, reason: "Marka hashtag'i eksik — yayinlanmadi" };
    }
  }

  return { ok: true };
}
