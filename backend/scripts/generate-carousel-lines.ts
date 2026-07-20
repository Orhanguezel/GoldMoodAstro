/**
 * Instagram CAROUSEL kareleri icin burc basina TEK SATIR uretir.
 *
 * NEDEN VAR: carousel gonderisi "Burçların ilişkideki zayıf noktası" diyorsa kareler
 * cevabi TASIMALI. Aksi halde kullanici kaydirir, cevap bulamaz, cikar — kaydetme degil
 * hayal kirikligi uretir.
 *
 * astrology_kb'deki `sign_section` metinleri bu is icin UYGUN DEGIL: sablon nesir,
 * ayni kalip her burcta tekrar ediyor ("X için Aşk başlığı yakınlık, güven, çekim ve
 * sevgi dili üzerinden okunur..."). Carousel keskin ve spesifik satir ister.
 *
 * Bu script gunluk burc motorunun yaptigini yapar: burc profilini (kind='sign') LLM'e
 * besler, konuya ozel tek satir urettirir ve astrology_kb'ye kind='carousel_line'
 * olarak yazar. Bir kez uretilir; admin panelden duzenlenebilir.
 *
 * Kullanim (backend/ dizininden):
 *   bun scripts/generate-carousel-lines.ts --dry             # ne uretilecek, LLM cagirmadan
 *   bun scripts/generate-carousel-lines.ts                   # eksikleri uret
 *   bun scripts/generate-carousel-lines.ts --topic gizli-yetenegi
 *   bun scripts/generate-carousel-lines.ts --force           # mevcutlarin uzerine yaz
 *
 * Idempotent: mevcut (sign, topic) satiri --force yoksa atlanir.
 */
import { randomUUID } from 'node:crypto';
import { generate, LlmError } from '@goldmood/shared-backend/modules/llm';
import { db } from '../src/db/client';

const SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
] as const;
type Sign = (typeof SIGNS)[number];

const SIGN_TR: Record<Sign, string> = {
  aries: 'Koç', taurus: 'Boğa', gemini: 'İkizler', cancer: 'Yengeç',
  leo: 'Aslan', virgo: 'Başak', libra: 'Terazi', scorpio: 'Akrep',
  sagittarius: 'Yay', capricorn: 'Oğlak', aquarius: 'Kova', pisces: 'Balık',
};

/** Konular goldmood-monthly.ts icindeki CAROUSEL_TOPICS ile AYNI key'leri kullanmali. */
const TOPICS: Record<string, string> = {
  'iliskide-zayif-noktasi': 'ilişkideki zayıf noktası',
  'en-cok-neye-kizar': 'en çok neye kızdığı',
  'gizli-yetenegi': 'gizli yeteneği',
};

const argv = process.argv.slice(2);
const flag = (n: string) => argv.includes(n);
const val = (n: string) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : undefined; };

const DRY = flag('--dry');
const FORCE = flag('--force');
const ONLY_TOPIC = val('--topic');
const LOCALE = val('--locale') ?? 'tr';

async function q<T = any>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [rows] = await (db as any).session.client.query(sql, params);
  return rows as T[];
}

async function loadSignProfile(sign: Sign): Promise<string> {
  const rows = await q<any>(
    `SELECT title, content, short_summary FROM astrology_kb
      WHERE kind = 'sign' AND key1 = ? AND locale = ? AND is_active = 1 LIMIT 1`,
    [sign, LOCALE],
  );
  const r = rows[0];
  if (!r) return '(Astrolog metni henüz yok)';
  return `${r.title}\n\n${r.content}\n\n${r.short_summary ?? ''}`.trim();
}

async function exists(sign: Sign, topic: string): Promise<boolean> {
  const rows = await q(
    `SELECT id FROM astrology_kb WHERE kind = 'carousel_line' AND key1 = ? AND key2 = ? AND locale = ? LIMIT 1`,
    [sign, topic, LOCALE],
  );
  return rows.length > 0;
}

/** LLM bazen tirnak/aciklama ekliyor — temizle ve uzunlugu zorla. */
function clean(raw: string): string | null {
  let t = (raw ?? '').trim().split('\n').map((l) => l.trim()).filter(Boolean)[0] ?? '';
  t = t.replace(/^["'«»]|["'«»]$/g, '').replace(/^[-•*]\s*/, '').trim();
  if (!t || t.length < 8) return null;
  if (t.length > 70) t = `${t.slice(0, 67).trimEnd()}…`;
  return t;
}

/**
 * ⚠️ ON DUPLICATE KEY KULLANILAMAZ.
 *
 * astrology_kb unique kisiti (kind, key1, key2, key3, locale) — key3 dahil. Bu kind'da
 * key3 NULL kaliyor ve MySQL unique indekste NULL'lari BIRBIRINDEN FARKLI sayiyor.
 * Yani ON DUPLICATE KEY tetiklenmez; --force her calistirmada MUKERRER satir ekler.
 * Bu yuzden acik update-or-insert yapiliyor.
 */
async function upsert(sign: Sign, topic: string, line: string) {
  const title = `${SIGN_TR[sign]} — ${TOPICS[topic]}`;
  const found = await q<any>(
    `SELECT id FROM astrology_kb WHERE kind = 'carousel_line' AND key1 = ? AND key2 = ? AND locale = ? LIMIT 1`,
    [sign, topic, LOCALE],
  );
  if (found.length) {
    await q(
      `UPDATE astrology_kb SET title = ?, content = ?, short_summary = ?, source = 'llm',
              is_active = 1, updated_at = CURRENT_TIMESTAMP(3) WHERE id = ?`,
      [title, line, line, found[0].id],
    );
    return;
  }
  await q(
    `INSERT INTO astrology_kb (id, kind, key1, key2, locale, title, content, short_summary, source, is_active)
     VALUES (?, 'carousel_line', ?, ?, ?, ?, ?, ?, 'llm', 1)`,
    [randomUUID(), sign, topic, LOCALE, title, line, line],
  );
}

async function main() {
  const topics = ONLY_TOPIC ? [ONLY_TOPIC] : Object.keys(TOPICS);
  for (const t of topics) {
    if (!TOPICS[t]) { console.warn(`[atla] bilinmeyen konu: ${t}`); continue; }
  }

  console.log(
    `[carousel] ${topics.length} konu x ${SIGNS.length} burc` +
      `${DRY ? ' — DRY (LLM cagrilmayacak)' : ''}${FORCE ? ' — FORCE' : ''}`,
  );

  let made = 0, skipped = 0, failed = 0;
  for (const topic of topics) {
    if (!TOPICS[topic]) continue;
    for (const sign of SIGNS) {
      if (!FORCE && (await exists(sign, topic))) { skipped++; continue; }

      if (DRY) {
        console.log(`  [dry] ${topic} / ${SIGN_TR[sign]}`);
        made++;
        continue;
      }

      try {
        const res = await generate({
          promptKey: 'carousel_line',
          locale: LOCALE,
          vars: {
            sign_label: SIGN_TR[sign],
            topic_label: TOPICS[topic],
            kb_sign_profile: await loadSignProfile(sign),
          },
        });
        const line = clean(res.content);
        if (!line) { failed++; console.warn(`  [hata] ${topic}/${sign} — bos/kisa cikti`); continue; }
        await upsert(sign, topic, line);
        made++;
        console.log(`  [ok] ${SIGN_TR[sign].padEnd(8)} ${topic.padEnd(24)} → ${line}`);
      } catch (err) {
        failed++;
        const msg = err instanceof LlmError ? `LLM: ${err.message}` : (err as Error).message;
        console.warn(`  [hata] ${topic}/${sign} — ${msg}`);
      }
    }
  }
  console.log(`\n[ozet] ${made} uretildi, ${skipped} zaten vardi, ${failed} hata`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error('HATA:', (e as Error).message); process.exit(1); });
