/**
 * Tenant müşteri analiz raporu — tarih aralığı (from/to) için GA4 + Google Ads + GSC verilerini
 * tek yapıda toplar, türetilmiş metrikleri ve içgörü/önerileri hesaplar.
 * Frontend bunu print-optimize rapor sayfasında render eder (PDF olarak kaydedilir).
 */
import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { socialProjects } from "../../db/schema";
import { fetchGa4ClientReport } from "./ga4";
import { fetchGoogleAdsClientReport } from "./google-ads-read";
import { queryGsc } from "./gsc";

const DAY = 86400000;

function prevPeriod(from: string, to: string) {
  const f = Date.parse(from), t = Date.parse(to);
  const len = Math.max(1, Math.round((t - f) / DAY) + 1);
  const pTo = new Date(f - DAY), pFrom = new Date(f - DAY * len);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { prevFrom: fmt(pFrom), prevTo: fmt(pTo), days: len };
}

function gscTotals(rows: any[]) {
  const r = rows?.[0];
  return r
    ? { clicks: r.clicks ?? 0, impressions: r.impressions ?? 0, ctr: r.ctr ?? 0, position: r.position ?? 0 }
    : { clicks: 0, impressions: 0, ctr: 0, position: 0 };
}

export interface TenantReport {
  meta: {
    tenantKey: string;
    name: string;
    websiteUrl: string | null;
    from: string;
    to: string;
    days: number;
    generatedAt: string;
  };
  ga4: { available: boolean; error?: string; data?: any };
  ads: { available: boolean; error?: string; data?: any };
  gsc: { available: boolean; error?: string; data?: any };
  insights: string[];
}

export async function buildTenantReport(tenantKey: string, from: string, to: string): Promise<TenantReport> {
  const [row] = await db.select().from(socialProjects).where(eq(socialProjects.key, tenantKey)).limit(1);
  if (!row) throw new Error("Tenant bulunamadi");
  const { prevFrom, prevTo, days } = prevPeriod(from, to);

  // ─── GA4 ───
  const ga4Hosts = (() => {
    const mj = (row.marketingJson ?? null) as { analyticsHostnames?: unknown } | null;
    const list = Array.isArray(mj?.analyticsHostnames)
      ? (mj!.analyticsHostnames as unknown[]).filter(
          (h): h is string => typeof h === "string" && h.trim().length > 0,
        )
      : [];
    return list.length ? list : null;
  })();
  const ga4Res = row.ga4PropertyId?.trim()
    ? await fetchGa4ClientReport(tenantKey, row.ga4PropertyId.trim(), from, to, ga4Hosts).then(
        (data) => ({ available: true as const, data }),
        (e) => ({ available: false as const, error: (e as Error).message }),
      )
    : { available: false as const, error: "GA4 property tanimli degil" };

  // ─── Google Ads ───
  const adsRes = row.googleAdsCustomerId?.trim()
    ? await fetchGoogleAdsClientReport(tenantKey, row.googleAdsCustomerId.trim(), row.googleAdsManagerId, from, to).then(
        (data) => ({ available: true as const, data }),
        (e) => ({ available: false as const, error: (e as Error).message }),
      )
    : { available: false as const, error: "Google Ads musteri ID tanimli degil" };

  // ─── GSC ───
  const gscRes = await (async () => {
    const site = row.searchConsoleSiteUrl?.trim();
    if (!site) return { available: false as const, error: "GSC site_url tanimli degil" };
    try {
      const base = { type: "web", rowLimit: 12 };
      const [cur, prev, queries, pages] = await Promise.all([
        queryGsc(tenantKey, site, { startDate: from, endDate: to }),
        queryGsc(tenantKey, site, { startDate: prevFrom, endDate: prevTo }),
        queryGsc(tenantKey, site, { ...base, startDate: from, endDate: to, dimensions: ["query"] }),
        queryGsc(tenantKey, site, { ...base, startDate: from, endDate: to, dimensions: ["page"] }),
      ]);
      const c = gscTotals(cur), p = gscTotals(prev);
      return {
        available: true as const,
        data: {
          site,
          totals: {
            clicks: { current: c.clicks, previous: p.clicks, deltaPct: p.clicks > 0 ? ((c.clicks - p.clicks) / p.clicks) * 100 : null },
            impressions: { current: c.impressions, previous: p.impressions, deltaPct: p.impressions > 0 ? ((c.impressions - p.impressions) / p.impressions) * 100 : null },
            ctr: { current: c.ctr, previous: p.ctr },
            position: { current: c.position, previous: p.position },
          },
          topQueries: (queries as any[]).map((r) => ({ query: r.keys?.[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position })),
          topPages: (pages as any[]).map((r) => ({ page: r.keys?.[0], clicks: r.clicks, impressions: r.impressions, position: r.position })),
        },
      };
    } catch (e) {
      return { available: false as const, error: (e as Error).message };
    }
  })();

  // ─── Icgoruler ───
  const insights: string[] = [];
  if (ga4Res.available) {
    const t = ga4Res.data.totals;
    const sDelta = t.sessions?.deltaPct;
    if (sDelta != null) insights.push(`Oturumlar önceki döneme göre ${sDelta >= 0 ? "+" : ""}${sDelta.toFixed(0)}% değişti (${t.sessions.current.toLocaleString("tr-TR")} oturum).`);
    if ((t.transactions?.current ?? 0) > 0) {
      const rev = t.purchaseRevenue?.current ?? 0;
      const cr = t.sessions?.current > 0 ? (t.transactions.current / t.sessions.current) * 100 : 0;
      insights.push(`${t.transactions.current} işlem · ${rev.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} TL gelir · dönüşüm oranı %${cr.toFixed(2)}.`);
      if (cr < 0.5 && t.sessions?.current > 500) insights.push("⚠️ Dönüşüm oranı düşük — yüksek trafik az satışa dönüyor; ürün/sepet sayfası ve hedefleme optimize edilebilir.");
    }
    if ((t.bounceRate?.current ?? 0) > 0.5) insights.push(`⚠️ Hemen çıkma (bounce) oranı yüksek: %${(t.bounceRate.current * 100).toFixed(0)}.`);
  }
  if (adsRes.available) {
    const a = adsRes.data.totals;
    if (a.cost > 0) {
      insights.push(`Google Ads: ${a.cost.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} TL harcama, ${a.conversions.toFixed(0)} dönüşüm${a.roas != null ? `, ROAS ${a.roas.toFixed(2)}x` : ""}.`);
      if (a.roas != null && a.roas >= 3) insights.push("✅ Reklam kârlı (ROAS ≥ 3) — bütçe artırımı değerlendirilebilir.");
      if (a.roas != null && a.roas < 1.5 && a.roas > 0) insights.push("⚠️ ROAS düşük — kampanya/feed/teklif optimizasyonu önerilir.");
    }
  }
  if (gscRes.available) {
    const cd = gscRes.data.totals.clicks.deltaPct;
    if (cd != null) insights.push(`Organik (GSC) tıklamalar ${cd >= 0 ? "+" : ""}${cd.toFixed(0)}% (${gscRes.data.totals.clicks.current} tık).`);
    const opp = (gscRes.data.topQueries as any[]).filter((q) => q.impressions > 500 && q.position > 5).sort((a, b) => b.impressions - a.impressions)[0];
    if (opp) insights.push(`🎯 SEO fırsatı: "${opp.query}" ${opp.impressions} gösterim, pozisyon ${opp.position.toFixed(1)} — içerik/SEO ile yükseltilirse ciddi tık kazancı.`);
  }
  if (insights.length === 0) insights.push("Bu dönem için yeterli veri bulunamadı veya kanallar yapılandırılmadı.");

  return {
    meta: {
      tenantKey,
      name: row.name,
      websiteUrl: row.websiteUrl ?? null,
      from, to, days,
      generatedAt: new Date().toISOString(),
    },
    ga4: ga4Res,
    ads: adsRes,
    gsc: gscRes,
    insights,
  };
}
