// Blog içerik kalite yükseltme uygulama script'i.
// 8 konu × tr/en/de zengin içeriği + meta + alt + tema-uygun SVG kapağı DB'ye yazar.
// Parameterized (escape sorunsuz). SEO puanlama sistemine DOKUNMAZ — sadece içerik iyileşir.
//
// Çalıştırma (prod veya local): backend/ içinde `bun scripts/apply-blog-uplift.ts`
// DB creds .env'den (DB_HOST/PORT/USER/PASSWORD/NAME).
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(HERE, 'blog-uplift-data');

// page_id son hane → tema SVG'si (frontend/public/img/blog/)
const SVG_BY_TAIL: Record<string, string> = {
  '1': '/img/blog/birth-chart.svg',
  '2': '/img/blog/synastry.svg',
  '3': '/img/blog/tarot.svg',
  '4': '/img/blog/numerology.svg',
  '5': '/img/blog/moon-sign.svg',
  '6': '/img/blog/retrograde.svg',
  '7': '/img/blog/consultant.svg',
  '8': '/img/blog/daily-ritual.svg',
};

function contentOf(loc: any): string {
  return String(loc?.content ?? loc?.content_html ?? '').trim();
}
function packContent(html: string): string {
  return JSON.stringify({ html });
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',
  });

  const files = readdirSync(DATA_DIR).filter((f) => f.endsWith('.json')).sort();
  let pages = 0;
  let locales = 0;

  for (const file of files) {
    const data = JSON.parse(readFileSync(join(DATA_DIR, file), 'utf8'));
    const pageId: string = data.page_id;
    if (!pageId) { console.warn(`[skip] ${file}: page_id yok`); continue; }
    const tail = pageId.slice(-1);
    const svg = SVG_BY_TAIL[tail];
    if (!svg) { console.warn(`[skip] ${file}: bilinmeyen tail ${tail}`); continue; }

    // Kapak görseli (parent) — tema-uygun SVG.
    await conn.execute(
      'UPDATE custom_pages SET featured_image = ?, image_url = ? WHERE id = ? AND module_key = ?',
      [svg, svg, pageId, 'blog'],
    );
    pages++;

    for (const locale of ['tr', 'en', 'de'] as const) {
      const loc = data[locale];
      if (!loc) continue;
      const html = contentOf(loc);
      if (!html) { console.warn(`[skip] ${file}:${locale}: içerik boş`); continue; }
      const [res]: any = await conn.execute(
        `UPDATE custom_pages_i18n
         SET content = ?, meta_title = ?, meta_description = ?, tags = ?, featured_image_alt = ?, updated_at = NOW(3)
         WHERE custom_page_id = ? AND locale = ?`,
        [
          packContent(html),
          String(loc.meta_title ?? '').slice(0, 255) || null,
          String(loc.meta_description ?? '').slice(0, 500) || null,
          String(loc.tags ?? '').slice(0, 500) || null,
          String(loc.alt ?? loc.featured_image_alt ?? '').slice(0, 255) || null,
          pageId,
          locale,
        ],
      );
      locales += res.affectedRows > 0 ? 1 : 0;
      if (res.affectedRows === 0) console.warn(`[warn] ${file}:${locale}: satır güncellenmedi (custom_page_id/locale eşleşmedi?)`);
    }
    console.log(`[ok] ${file} → ${pageId} (kapak ${svg})`);
  }

  await conn.end();
  console.log(`\nTAMAM: ${pages} sayfa kapağı, ${locales} locale içeriği güncellendi.`);
}

main().catch((e) => { console.error('HATA:', e); process.exit(1); });
