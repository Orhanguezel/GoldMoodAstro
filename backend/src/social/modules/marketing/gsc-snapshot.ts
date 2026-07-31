// =============================================================================
// GSC izleme snapshot yardımcıları — seo-i18n-url-migration checklist H bloğu.
//
// Google performans verisi (gösterim/tıklama/pozisyon/CTR, 28g current vs prev)
// + gsc_url_index verdict dağılımını (indexed / not_indexed / issue + duplicate
// canonical) tek objeye toplar ve append-only NDJSON history'ye yazar. Migration
// sinyallerinin Gün-0 baseline'a göre zamanla nasıl oturduğunu ölçmek için.
//
// Hem CLI (scripts/gsc-snapshot.ts) hem günlük cron (cron/gsc-index-refresh.ts)
// aynı fonksiyonları kullanır.
// =============================================================================

import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fetchGscAnalytics, listGscIndexItems } from "./gsc";

export const GSC_HISTORY_PATH =
  process.env.GSC_HISTORY_PATH ?? join(process.cwd(), "var", "gsc-history.ndjson");

function round(n: number, d = 2) {
  const f = 10 ** d;
  return Math.round((Number(n) || 0) * f) / f;
}

export interface GscSnapshot {
  capturedAt: string;
  tenantKey: string;
  siteUrl: string;
  range: unknown;
  performance: unknown;
  index: Record<string, number>;
}

export async function buildGscSnapshot(tenantKey: string, siteUrl: string): Promise<GscSnapshot> {
  const [analytics, index] = await Promise.all([
    fetchGscAnalytics(tenantKey, siteUrl, 28).catch((err) => {
      console.error("[gsc-snapshot] analytics hata:", (err as Error)?.message ?? err);
      return null;
    }),
    listGscIndexItems(tenantKey, 500).catch((err) => {
      console.error("[gsc-snapshot] index hata:", (err as Error)?.message ?? err);
      return null;
    }),
  ]);

  // Duplicate canonical: Google'ın seçtiği canonical, URL'nin kendisinden farklı olanlar.
  let duplicateCanonical = 0;
  let totalUrls = 0;
  if (index?.items) {
    totalUrls = index.items.length;
    for (const row of index.items as any[]) {
      const g = (row.google_canonical ?? row.googleCanonical ?? "").trim();
      const u = (row.url ?? "").trim();
      if (g && u && g !== u) duplicateCanonical += 1;
    }
  }

  const cur = (analytics as any)?.totals?.current;
  const prev = (analytics as any)?.totals?.previous;

  return {
    capturedAt: new Date().toISOString(),
    tenantKey,
    siteUrl,
    range: (analytics as any)?.range ?? null,
    performance: cur
      ? {
          current: { clicks: cur.clicks, impressions: cur.impressions, ctr: round(cur.ctr, 4), position: round(cur.position) },
          previous: prev
            ? { clicks: prev.clicks, impressions: prev.impressions, ctr: round(prev.ctr, 4), position: round(prev.position) }
            : null,
          deltaPct: (analytics as any)?.totals?.deltaPct ?? null,
        }
      : null,
    index: index?.summary
      ? { ...index.summary, totalUrls, duplicateCanonical }
      : { totalUrls, duplicateCanonical },
  };
}

export function appendGscSnapshot(snapshot: GscSnapshot, historyPath = GSC_HISTORY_PATH): void {
  try {
    mkdirSync(dirname(historyPath), { recursive: true });
    appendFileSync(historyPath, JSON.stringify(snapshot) + "\n");
  } catch (err) {
    console.error("[gsc-snapshot] append hata:", (err as Error)?.message ?? err);
  }
}
