// frontend/src/app/robots.ts
//
// AI crawler explicit allow politikası — T31-A2
// AI sistemleri (ChatGPT, Claude, Perplexity, Google AI Overviews, Bing Copilot)
// için marka içeriğinin alıntılanabilir olduğunu net olarak belirtir.

import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://goldmoodastro.com';

// Kişiye özel sonuç sayfaları (tarot/reading, */result) robots ile DEĞİL
// sayfa içi `noindex` ile dışarıda tutulur (seo/privateResultRobots.ts).
// 2026-07-20'de burada robots Disallow vardı; ama robots engeli Google'ın
// noindex'i görmesini de engelliyor ve liste EN/DE kanonik adreslerini
// (/en/coffee-reading/result/...) hiç kapsamıyordu (2026-10-03).

// /_next/ ENGELLENMEZ (SEO katalog 2026-10-03): Google sayfayı tarayıcı gibi
// çizer; CSS/JS chunk'larına ve /_next/image görsellerine erişemezse düzeni ve
// istemci içeriğini göremez, görseller Google Görseller'e düşmez.
// Hesap alanları locale önekiyle yaşar (/tr/me/…); öneksiz kural tek başına
// hiçbirini kapsamıyordu.
const PRIVATE_AREAS = ['/dashboard', '/me/'];
const COMMON_DISALLOW = [
  '/api/',
  '/admin/',
  ...PRIVATE_AREAS,
  ...['tr', 'en', 'de'].flatMap((lc) => PRIVATE_AREAS.map((p) => `/${lc}${p}`)),
];

/** AI crawler bot listesi — explicit allow ile site içeriğine erişim onaylanır. */
const AI_BOTS = [
  // OpenAI
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  // Anthropic
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  // Perplexity
  'PerplexityBot',
  'Perplexity-User',
  // Google AI (Gemini, AI Overviews — Google-Extended ayrı bir token, Googlebot ile birlikte gelir)
  'Google-Extended',
  // Common Crawl (LLM eğitim verisi kaynağı)
  'CCBot',
  // Apple Intelligence
  'Applebot-Extended',
  // Meta AI
  'FacebookBot',
  'Meta-ExternalAgent',
  // Cohere
  'cohere-ai',
];

/** Geleneksel arama motoru bot'ları — explicit listede tutulması SEO sinyali için faydalı. */
const SEARCH_BOTS = ['Googlebot', 'Googlebot-Image', 'Bingbot', 'Slurp', 'DuckDuckBot', 'YandexBot'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Default catch-all — diğer tüm crawler'lar
      {
        userAgent: '*',
        allow: '/',
        disallow: COMMON_DISALLOW,
      },
      ...SEARCH_BOTS.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: COMMON_DISALLOW,
      })),
      ...AI_BOTS.map((userAgent) => ({
        userAgent,
        allow: '/',
        disallow: COMMON_DISALLOW,
      })),
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
