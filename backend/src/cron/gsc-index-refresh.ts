import { eq } from "drizzle-orm";
import { db } from "@/social/db/client";
import { socialProjects } from "@/social/db/schema";
import { refreshGscIndex } from "@/social/modules/marketing/gsc";
import { buildGscSnapshot, appendGscSnapshot } from "@/social/modules/marketing/gsc-snapshot";

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_LIMIT = 500;
const TARGET_HOUR_UTC = Number(process.env.GSC_DAILY_INDEX_HOUR_UTC ?? 2);
const TARGET_MINUTE_UTC = Number(process.env.GSC_DAILY_INDEX_MINUTE_UTC ?? 30);

function nextRunDelayMs() {
  const now = new Date();
  const next = new Date(now);
  next.setUTCHours(TARGET_HOUR_UTC, TARGET_MINUTE_UTC, 0, 0);
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  return next.getTime() - now.getTime();
}

async function activeGscProjects() {
  return db
    .select()
    .from(socialProjects)
    .where(eq(socialProjects.isActive, 1));
}

async function tick() {
  const limit = Math.min(Math.max(Number(process.env.GSC_DAILY_INDEX_LIMIT ?? DEFAULT_LIMIT), 1), 500);
  const projects = await activeGscProjects();
  for (const project of projects) {
    const tenantKey = project.key;
    const siteUrl = project.searchConsoleSiteUrl?.trim();
    if (!tenantKey || !siteUrl) continue;
    try {
      const result = await refreshGscIndex(tenantKey, siteUrl, {
        websiteUrl: project.websiteUrl,
        force: false,
        limit,
      });
      console.log(
        `[gsc-index-refresh] ${tenantKey}: checked=${result.checked?.length ?? 0} refreshed=${result.refreshed ?? 0} limit=${limit}`,
      );
      // Refresh sonrası günlük snapshot'ı history'ye ekle (SEO migration H bloğu:
      // 7/14/28. gün karşılaştırması Gün-0 baseline'a göre otomatik birikir).
      try {
        const snapshot = await buildGscSnapshot(tenantKey, siteUrl);
        appendGscSnapshot(snapshot);
        console.log(
          `[gsc-index-refresh] ${tenantKey}: snapshot impressions=${(snapshot.performance as any)?.current?.impressions ?? "?"} pos=${(snapshot.performance as any)?.current?.position ?? "?"} indexed=${snapshot.index?.indexed ?? "?"} dupCanonical=${snapshot.index?.duplicateCanonical ?? "?"}`,
        );
      } catch (snapErr) {
        console.error(`[gsc-index-refresh] ${tenantKey} snapshot failed:`, (snapErr as Error).message);
      }
    } catch (error) {
      console.error(`[gsc-index-refresh] ${tenantKey} failed:`, (error as Error).message);
    }
  }
}

export async function runGscIndexRefreshOnce() {
  await tick();
}

export function registerGscIndexRefreshCron() {
  if (process.env.GSC_DAILY_INDEX_ENABLED === "0") {
    console.log("[gsc-index-refresh] disabled (GSC_DAILY_INDEX_ENABLED=0)");
    return;
  }

  const scheduleNext = () => {
    const delay = nextRunDelayMs();
    setTimeout(() => {
      void tick().finally(scheduleNext);
    }, delay);
  };

  scheduleNext();
  console.log(`[gsc-index-refresh] registered daily ${TARGET_HOUR_UTC}:${String(TARGET_MINUTE_UTC).padStart(2, "0")} UTC`);
}
