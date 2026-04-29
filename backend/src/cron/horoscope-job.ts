// backend/src/cron/horoscope-job.ts
// FAZ 9 + FAZ 20-T20-1 — Burç yorumu üretici cron.
// Daily: her gece 02:00 (12 burç)
// Weekly: pazartesi 02:00 (12 burç)
// Monthly: ayın 1'i 02:00 (12 burç)
//
// setInterval ile saatte bir kontrol; generate fonksiyonu mevcut row varsa
// no-op döner (LLM çağrısı yapmaz). Bu yaklaşım idempotent.

import {
  generateAllForPeriod,
  generateDailyHoroscopes, // geriye uyumlu export
} from '@/modules/horoscopes/generator';
import type { HoroscopePeriod } from '@/modules/horoscopes/schema';

const HOUR_MS = 60 * 60 * 1000;
const TARGET_HOUR = 2; // 02:00 local

let lastRunBucket: Record<HoroscopePeriod, string> = {
  daily: '',
  weekly: '',
  monthly: '',
  transit: '',
};

function bucketKey(period: HoroscopePeriod, ref: Date): string {
  const y = ref.getFullYear();
  const m = String(ref.getMonth() + 1).padStart(2, '0');
  const d = String(ref.getDate()).padStart(2, '0');
  if (period === 'daily') return `${y}-${m}-${d}`;
  if (period === 'weekly') {
    // ISO week-ish: yıl + hafta numarası kabaca pazartesi tarihi ile
    const dow = ref.getDay() === 0 ? 7 : ref.getDay();
    const monday = new Date(ref);
    monday.setDate(ref.getDate() - dow + 1);
    return `${monday.getFullYear()}-w-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
  }
  // monthly
  return `${y}-${m}`;
}

async function runIfNeeded(period: HoroscopePeriod, ref: Date) {
  const bucket = bucketKey(period, ref);
  if (lastRunBucket[period] === bucket) return;

  // Hangi periyot bu saatte çalışmalı?
  const hour = ref.getHours();
  if (hour !== TARGET_HOUR) return;

  if (period === 'weekly' && ref.getDay() !== 1) return; // pazartesi
  if (period === 'monthly' && ref.getDate() !== 1) return; // ayın 1'i

  console.log(`[horoscope-cron] ${period} üretim başlıyor (bucket=${bucket})`);
  try {
    const stats = await generateAllForPeriod(period, 'tr');
    console.log(`[horoscope-cron] ${period} stats:`, stats);
    lastRunBucket[period] = bucket;
  } catch (err) {
    console.error(`[horoscope-cron] ${period} hata:`, (err as Error).message);
  }
}

export async function runHoroscopeGeneration() {
  const now = new Date();
  await runIfNeeded('daily', now);
  await runIfNeeded('weekly', now);
  await runIfNeeded('monthly', now);

  // Transit: ayın 25'inde gelecek ay için üretilir
  if (now.getDate() === 25) {
    const nextMonth = new Date(now);
    nextMonth.setMonth(now.getMonth() + 1);
    await runIfNeeded('transit', nextMonth);
  }
}

export function registerHoroscopeCron() {
  // İlk açılışta bir kez kontrol et — eğer 02:00 ise üretir, değilse no-op.
  void runHoroscopeGeneration();

  // Saat başı kontrol — TARGET_HOUR'da uygun periyotlar tetiklenir.
  setInterval(() => {
    void runHoroscopeGeneration();
  }, HOUR_MS);
}

// Eski API geriye uyumlu (eski cron tetikleyicileri için)
export { generateDailyHoroscopes };
