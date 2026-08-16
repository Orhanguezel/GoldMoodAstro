import type { FastifyInstance } from 'fastify';
import { contentCatalogHandler } from './content-catalog';
import { articlesHandler, productsHandler } from './content';
import { crmInboxHandler, crmContactReplyHandler } from './crm-inbox';

/**
 * Dış tüketici (ekosistem sosyal medya) için salt-okuma veri uçları.
 * Prefix `/ext` altında monte edilir (routes.ts) → tam yol `/api/ext/...`.
 * Grup seviyesinde `requireServiceToken` (X-Api-Key) korur.
 *
 * Teslim sırası: 1a içerik kataloğu → 1b dönüşüm → 1c danışman/hizmet → 1d blog.
 */
export async function registerExtApi(api: FastifyInstance) {
  // 1a — İçerik kataloğu (platformPostId ile; Graph insight join'i için)
  api.get('/social/content-catalog', {
    schema: {
      tags: ['ext'],
      summary: 'Sosyal içerik kataloğu (salt-okuma, keyset sayfalama)',
      querystring: {
        type: 'object',
        properties: {
          updatedSince: { type: 'string', format: 'date-time', description: 'ISO — artımlı çekim' },
          limit: { type: 'integer', minimum: 1, maximum: 500, default: 100, description: 'SATIR sayısı (flatten sonrası öğe daha fazla olabilir)' },
          cursor: { type: 'string', description: 'Önceki yanıtın nextCursor değeri (keyset)' },
          status: { type: 'string', description: "Varsayılan: posted,scheduled,publishing,manual_pending. 'all' = filtre yok. Virgülle çoklu." },
        },
      },
    },
  }, contentCatalogHandler);

  // ─── B. İçerik kaynağı (Content Source API v1) — base /api/ext/content ───
  // Ekosistem bunları çekip YENİ sosyal post üretir. Aynı X-Api-Key.
  api.get('/content/articles', {
    schema: {
      tags: ['ext'],
      summary: 'İçerik/blog/fal öğeleri (post üretimi için) — v1.1 {items,total,hasMore}',
      querystring: {
        type: 'object',
        properties: {
          type: { type: 'string', description: 'blog (varsayılan) | horoscope | tarot | coffee | dream' },
          locale: { type: 'string', default: 'tr' },
          limit: { type: 'integer', minimum: 1, maximum: 60, default: 20 },
          offset: { type: 'integer', minimum: 0, default: 0 },
          q: { type: 'string', description: 'arama (başlık/içerik)' },
          sort: { type: 'string' },
          period: { type: 'string', default: 'daily', description: 'type=horoscope için: daily|weekly|monthly|transit' },
        },
      },
    },
  }, articlesHandler);

  // ─── C. CRM köprüsü (gzl-gelir-crm) — admin gelen kutusu + yanıt ───
  api.get('/crm/inbox', {
    schema: {
      tags: ['ext'],
      summary: 'Admin gelen kutusu: iletişim + bekleyen randevu + başvuru + canlı destek (CRM için)',
      querystring: {
        type: 'object',
        properties: {
          updatedSince: { type: 'string', format: 'date-time', description: 'ISO — yalnız iletişim mesajlarını filtreler' },
          contactLimit: { type: 'integer', minimum: 1, maximum: 200, default: 50 },
        },
      },
    },
  }, crmInboxHandler);

  api.post('/crm/contacts/:id/reply', {
    schema: {
      tags: ['ext'],
      summary: 'İletişim mesajına CRM üzerinden yanıt (e-posta gönderir + thread kaydeder)',
      params: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: { message: { type: 'string', minLength: 1, maxLength: 5000 } },
        required: ['message'],
        additionalProperties: false,
      },
    },
  }, crmContactReplyHandler);

  api.get('/content/products', {
    schema: {
      tags: ['ext'],
      summary: 'Danışman profilleri (öne çıkan) + ücretsiz araçlar — v1.1 {items,total,hasMore}',
      querystring: {
        type: 'object',
        properties: {
          locale: { type: 'string', default: 'tr' },
          limit: { type: 'integer', minimum: 1, maximum: 60, default: 20 },
          offset: { type: 'integer', minimum: 0, default: 0 },
          q: { type: 'string', description: 'arama (isim/uzmanlık)' },
          sort: { type: 'string', default: 'popular' },
          include_tools: { type: 'string', description: "'0' → ücretsiz araçları hariç tut" },
        },
      },
    },
  }, productsHandler);
}
