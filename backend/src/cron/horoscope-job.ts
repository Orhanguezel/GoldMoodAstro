// backend/src/cron/horoscope-job.ts

import { generateDailyHoroscopes } from '@/modules/horoscopes/generator';

export async function runHoroscopeGeneration() {
  console.log('[Cron] Starting Daily Horoscope Generation...');
  try {
    await generateDailyHoroscopes();
    console.log('[Cron] Daily Horoscope Generation Completed.');
  } catch (error) {
    console.error('[Cron] Daily Horoscope Generation Failed:', error);
  }
}

export function registerHoroscopeCron() {
  // Run once on startup
  void runHoroscopeGeneration();

  // Run every 24 hours (86,400,000 ms)
  // Ideally this should run at 00:01 local time, but for simple setInterval:
  setInterval(() => {
    void runHoroscopeGeneration();
  }, 24 * 60 * 60 * 1000);
}
