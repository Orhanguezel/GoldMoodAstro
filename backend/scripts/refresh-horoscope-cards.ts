/**
 * Günlük burç carousel kartlarını yeniden basar.
 *
 * Neden: kartlar yayından ~8 gün önce planlanır, o an `daily_horoscopes` boştur ve
 * görsele jenerik fallback metni basılır. `renderZodiacCard` existsSync ile cache'lediği
 * için bir daha güncellenmez → aynı metin her gün tekrar eder.
 *
 * Kullanım (backend/ dizininden):
 *   bun run scripts/refresh-horoscope-cards.ts 2026-08-10 2026-08-17
 *   bun run scripts/refresh-horoscope-cards.ts 2026-08-10            # tek gün
 *
 * Varsayılan mod --allow-fallback: LLM yorumu beklemeden, o güne özel plan metniyle
 * yeniden basar (gelecek günler için). `--llm-only` verilirse sadece gerçek günlük
 * yorum hazırsa basar (cron'un yaptığı iş).
 *
 * Sadece `scheduled` durumdaki postlara dokunur; yayınlanmışları değiştirmez.
 */
import { refreshHoroscopeCardsForDate } from '@/cron/social-horoscope';

function* dateRange(startStr: string, endStr: string): Generator<string> {
  const start = Date.parse(`${startStr}T00:00:00.000Z`);
  const end = Date.parse(`${endStr}T00:00:00.000Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) throw new Error('Gecersiz tarih (YYYY-MM-DD bekleniyor)');
  for (let t = start; t <= end; t += 86_400_000) {
    yield new Date(t).toISOString().slice(0, 10);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const llmOnly = args.includes('--llm-only');
  const dates = args.filter((a) => !a.startsWith('--'));
  if (!dates.length) {
    console.error('Kullanim: bun run scripts/refresh-horoscope-cards.ts <baslangic> [bitis] [--llm-only]');
    process.exit(1);
  }
  const [start, end = start] = dates as [string, string?];

  for (const dateStr of dateRange(start, end!)) {
    const res = await refreshHoroscopeCardsForDate(dateStr, { allowFallback: !llmOnly });
    console.log(`${dateStr} → ${res.status}${res.detail ? ` (${res.detail})` : ''}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[refresh-horoscope-cards] hata:', err);
    process.exit(1);
  });
