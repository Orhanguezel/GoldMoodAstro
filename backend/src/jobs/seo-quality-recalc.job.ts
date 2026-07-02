import { recalculateScores } from '@goldmood/shared-backend/modules/seoQuality';

const DAY_MS = 24 * 60 * 60 * 1000;

let running = false;

export async function runSeoQualityRecalcJob() {
  if (running) return;
  running = true;
  try {
    const result = await recalculateScores();
    console.log(`[seo-quality] recalculated ${result.count} entities`);
  } catch (error) {
    console.error('[seo-quality] recalculation job failed:', error);
  } finally {
    running = false;
  }
}

export function registerSeoQualityRecalcCron() {
  setTimeout(() => void runSeoQualityRecalcJob(), 30_000);
  setInterval(() => void runSeoQualityRecalcJob(), DAY_MS);
  console.log('[cron] seo-quality recalc registered (daily)');
}
