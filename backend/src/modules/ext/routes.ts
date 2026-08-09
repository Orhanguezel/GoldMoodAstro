import type { FastifyInstance } from 'fastify';
import { contentCatalogHandler } from './content-catalog';

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
}
