/**
 * Burç uyumu (compatibility_readings) toplu üretici.
 *
 * NEDEN VAR: `GET /api/horoscopes/compatibility` bu tabloyu okuyor ama tabloya
 * YAZAN hiçbir kod yoktu. `handleSynastryQuick` (synastry/controller.ts) LLM'den
 * uyum üretiyor fakat KVKK gereği hiçbir şey saklamıyor — sonuç: tablo boş,
 * endpoint sürekli "Uyumluluk yorumu henüz mevcut değil" dönüyordu.
 *
 * Simetri: getCompatibilityReading (a,b) bulamazsa (b,a) deniyor. Bu yüzden
 * 144 değil, 78 benzersiz sırasız çift üretmek yeterli (aynı burç çiftleri dahil).
 *
 * Kullanım (backend/ dizininden):
 *   bun scripts/generate-compatibility.ts --dry              # ne üretilecek, LLM çağırmadan
 *   bun scripts/generate-compatibility.ts                    # tr, eksik olanları üret
 *   bun scripts/generate-compatibility.ts --locales tr,en    # çok dilli
 *   bun scripts/generate-compatibility.ts --limit 5          # ilk 5 çift (maliyet testi)
 *   bun scripts/generate-compatibility.ts --force            # mevcutların üzerine yaz
 *
 * Idempotent: mevcut (sign_a, sign_b, locale) satırı --force yoksa atlanır.
 */
import { randomUUID } from 'node:crypto';
import { generate, LlmError } from '@goldmood/shared-backend/modules/llm';
import { db } from '../src/db/client';

const ALL_SIGNS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
] as const;
type Sign = (typeof ALL_SIGNS)[number];

const LABELS: Record<string, Record<Sign, string>> = {
  tr: {
    aries: 'Koç', taurus: 'Boğa', gemini: 'İkizler', cancer: 'Yengeç',
    leo: 'Aslan', virgo: 'Başak', libra: 'Terazi', scorpio: 'Akrep',
    sagittarius: 'Yay', capricorn: 'Oğlak', aquarius: 'Kova', pisces: 'Balık',
  },
  en: {
    aries: 'Aries', taurus: 'Taurus', gemini: 'Gemini', cancer: 'Cancer',
    leo: 'Leo', virgo: 'Virgo', libra: 'Libra', scorpio: 'Scorpio',
    sagittarius: 'Sagittarius', capricorn: 'Capricorn', aquarius: 'Aquarius', pisces: 'Pisces',
  },
  de: {
    aries: 'Widder', taurus: 'Stier', gemini: 'Zwillinge', cancer: 'Krebs',
    leo: 'Löwe', virgo: 'Jungfrau', libra: 'Waage', scorpio: 'Skorpion',
    sagittarius: 'Schütze', capricorn: 'Steinbock', aquarius: 'Wassermann', pisces: 'Fische',
  },
};

const argv = process.argv.slice(2);
const flag = (n: string) => argv.includes(n);
const val = (n: string) => {
  const i = argv.indexOf(n);
  return i >= 0 ? argv[i + 1] : undefined;
};

const DRY = flag('--dry');
const FORCE = flag('--force');
const LIMIT = val('--limit') ? Number(val('--limit')) : Infinity;
const LOCALES = (val('--locales') ?? 'tr').split(',').map((s) => s.trim()).filter(Boolean);

/** 78 benzersiz sırasız çift (i <= j). */
function uniquePairs(): Array<[Sign, Sign]> {
  const out: Array<[Sign, Sign]> = [];
  for (let i = 0; i < ALL_SIGNS.length; i++) {
    for (let j = i; j < ALL_SIGNS.length; j++) out.push([ALL_SIGNS[i], ALL_SIGNS[j]]);
  }
  return out;
}

async function query<T = any>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [rows] = await (db as any).session.client.query(sql, params);
  return rows as T[];
}

/** Simetrik varlık kontrolü — (a,b) veya (b,a). */
async function exists(a: Sign, b: Sign, locale: string): Promise<boolean> {
  const rows = await query(
    `SELECT id FROM compatibility_readings
      WHERE ((sign_a = ? AND sign_b = ?) OR (sign_a = ? AND sign_b = ?)) AND locale = ? LIMIT 1`,
    [a, b, b, a, locale],
  );
  return rows.length > 0;
}

interface CompatPayload {
  title: string;
  summary: string;
  content: string;
  love_score: number;
  friendship_score: number;
  career_score: number;
  sexual_score: number;
}

/** Prompt JSON dönmek üzere kurgulanmış ama LLM bazen kod bloğu/önsöz ekliyor. */
function parsePayload(raw: string): CompatPayload | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  let obj: any;
  try {
    obj = JSON.parse(match[0]);
  } catch {
    return null;
  }
  if (!obj?.title || !obj?.content) return null;
  const score = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(100, Math.max(1, Math.round(n))) : 50;
  };
  return {
    title: String(obj.title).slice(0, 255),
    summary: String(obj.summary ?? ''),
    content: String(obj.content),
    love_score: score(obj.love_score),
    friendship_score: score(obj.friendship_score),
    career_score: score(obj.career_score),
    sexual_score: score(obj.sexual_score),
  };
}

async function upsert(a: Sign, b: Sign, locale: string, p: CompatPayload) {
  await query(
    `INSERT INTO compatibility_readings
       (id, sign_a, sign_b, locale, title, summary, content,
        love_score, friendship_score, career_score, sexual_score, source, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'llm', 1)
     ON DUPLICATE KEY UPDATE
       title = VALUES(title), summary = VALUES(summary), content = VALUES(content),
       love_score = VALUES(love_score), friendship_score = VALUES(friendship_score),
       career_score = VALUES(career_score), sexual_score = VALUES(sexual_score),
       source = 'llm', updated_at = CURRENT_TIMESTAMP(3)`,
    [randomUUID(), a, b, locale, p.title, p.summary, p.content,
     p.love_score, p.friendship_score, p.career_score, p.sexual_score],
  );
}

async function main() {
  const pairs = uniquePairs();
  console.log(`[compat] ${pairs.length} benzersiz cift x ${LOCALES.length} dil` +
    `${DRY ? ' — DRY (LLM cagrilmayacak)' : ''}${FORCE ? ' — FORCE' : ''}` +
    `${LIMIT !== Infinity ? ` — limit=${LIMIT}` : ''}`);

  for (const locale of LOCALES) {
    const labels = LABELS[locale];
    if (!labels) {
      console.warn(`[compat] '${locale}' icin etiket yok, atlaniyor.`);
      continue;
    }

    let generated = 0, skipped = 0, failed = 0, done = 0;
    for (const [a, b] of pairs) {
      if (done >= LIMIT) break;

      if (!FORCE && (await exists(a, b, locale))) { skipped++; continue; }
      done++;

      if (DRY) {
        console.log(`  [dry] ${locale}: ${labels[a]} + ${labels[b]}`);
        generated++;
        continue;
      }

      try {
        const llm = await generate({
          promptKey: 'compatibility_signs',
          locale,
          vars: { sign_a_label: labels[a], sign_b_label: labels[b] },
        });
        const payload = parsePayload(llm.content);
        if (!payload) {
          failed++;
          console.warn(`  [hata] ${locale}: ${a}+${b} — LLM JSON ayristirilamadi`);
          continue;
        }
        await upsert(a, b, locale, payload);
        generated++;
        console.log(`  [ok] ${locale}: ${labels[a]} + ${labels[b]} — ask:${payload.love_score} kariyer:${payload.career_score}`);
      } catch (err) {
        failed++;
        const msg = err instanceof LlmError ? `LLM: ${err.message}` : (err as Error).message;
        console.warn(`  [hata] ${locale}: ${a}+${b} — ${msg}`);
      }
    }
    console.log(`[compat] ${locale} bitti: ${generated} uretildi, ${skipped} zaten vardi, ${failed} hata`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('HATA:', (e as Error).message);
    process.exit(1);
  });
