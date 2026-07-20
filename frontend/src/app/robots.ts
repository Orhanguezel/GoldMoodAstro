// frontend/src/app/robots.ts
//
// AI crawler explicit allow politikası — T31-A2
// AI sistemleri (ChatGPT, Claude, Perplexity, Google AI Overviews, Bing Copilot)
// için marka içeriğinin alıntılanabilir olduğunu net olarak belirtir.

import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://goldmoodastro.com';

// 2026-07-20 (GSC kapsam analizi): kisiye ozel sonuc sayfalari taranmamali.
// Bunlar oturum/kayit gerektirdigi icin bot'a bos govde donuyordu; Google
// yuzlerce ozdes bos sayfa gorup "tarandi ama indekslenmedi" isaretliyordu.
const RESULT_PATHS = [
  '/tr/tarot/reading/', '/en/tarot/reading/', '/de/tarot/reading/',
  '/tr/kahve-fali/result/', '/en/kahve-fali/result/', '/de/kahve-fali/result/',
  '/tr/ruya-tabiri/result/', '/en/ruya-tabiri/result/', '/de/ruya-tabiri/result/',
  '/tr/yildizname/result/', '/en/yildizname/result/', '/de/yildizname/result/',
  '/tr/sinastri/result/', '/en/sinastri/result/', '/de/sinastri/result/',
];

const COMMON_DISALLOW = ['/api/', '/admin/', '/_next/', '/dashboard', '/me/', ...RESULT_PATHS];

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
