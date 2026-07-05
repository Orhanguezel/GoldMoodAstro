/**
 * Tek seferlik günlük/haftalık/aylık burç yorumu üretici (manuel tetik).
 *
 * Kullanım (backend/ dizininden):
 *   bun scripts/generate-horoscopes-now.ts daily en,de
 *   bun scripts/generate-horoscopes-now.ts daily,weekly,monthly en,de
 *
 * Idempotent: generateAllForPeriod mevcut (period,date,sign,locale) satırını
 * atlar; sadece eksik olanları LLM ile üretir. Cron ile aynı fonksiyonu çağırır.
 */
import { generateAllForPeriod } from '../src/modules/horoscopes/generator';
import type { HoroscopePeriod } from '../src/modules/horoscopes/schema';

async function main() {
  const periodsArg = (process.argv[2] || 'daily').split(',').map((s) => s.trim()).filter(Boolean);
  const localesArg = (process.argv[3] || 'en,de').split(',').map((s) => s.trim()).filter(Boolean);

  console.log(`[gen-horo] periyotlar=${periodsArg.join(',')} diller=${localesArg.join(',')}`);

  for (const period of periodsArg as HoroscopePeriod[]) {
    for (const locale of localesArg) {
      const t0 = Date.now();
      try {
        const res = await generateAllForPeriod(period, locale);
        console.log(`[gen-horo] ${period}/${locale} bitti (${Date.now() - t0}ms):`, JSON.stringify(res));
      } catch (err) {
        console.error(`[gen-horo] ${period}/${locale} HATA:`, (err as Error).message);
      }
    }
  }
  console.log('[gen-horo] tamamlandı.');
  process.exit(0);
}

void main();
