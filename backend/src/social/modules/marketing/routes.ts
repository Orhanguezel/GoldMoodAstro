import type { FastifyInstance } from "fastify";
import { randomUUID } from "crypto";
import { db } from "../../db/client";
import { googleAdsChangeSets, socialProjects } from "../../db/schema";
import { desc, eq } from "drizzle-orm";
import {
  fetchGscAnalytics,
  fetchGscPageQueries,
  fetchGscSearchAnalytics,
  listGscIndexItems,
  listGscSites,
  queryGsc,
  refreshGscIndex,
} from "./gsc";
import { fetchRemoteSiteSettingsJson } from "./site-fetch";
import { buildTenantReport } from "./report";
import { fetchGa4Config, fetchGa4DeepReport, fetchGa4Funnel, fetchGa4FunnelTrend, fetchGa4RealtimeDetail, fetchGa4Summary, fetchGa4VisitStats } from "./ga4";
import { diffGtmVersions, fetchGtmSummary } from "./gtm";
import { fetchMerchantSummary } from "./merchant";
import { fetchMetaDiagnostics } from "./meta";
import {
  buildCampaignBiddingChangePayload,
  buildCampaignBudgetChangePayload,
  buildCampaignRemovePayload,
  buildCampaignStatusChangePayload,
  buildAssetGroupAssetRemovePayload,
  buildImageAssetCreatePayload,
  buildKeywordStatusChangePayload,
  buildSearchCampaignCreatePayload,
  buildSearchRsaCreatePayload,
  buildTextAssetChangePayload,
  buildVistaSeedsPmaxPlan,
  fetchGoogleAdsAudit,
  fetchGoogleAdsAssetGroupAssets,
  fetchGoogleAdsCampaigns,
  fetchGoogleAdsInsights,
  fetchGoogleAdsKeywords,
  fetchGoogleAdsRecommendations,
  type GoogleAdsBiddingDraftInput,
  type GoogleAdsSearchCampaignCreateSpec,
  mutateGoogleAds,
  type GoogleAdsChangeSetPayload,
  validateChangeSetPayload,
} from "./google-ads-read";
import { fetchDataForSeoDomainSummary } from "./dataforseo";
import { hostnameFromWebsiteUrl } from "./domain";
import type { MarketingJsonShape } from "./types";
import { normalizeBranding } from "../tenants/service";
import { createAiMarketingChangeSetDraft } from "../ai/marketing-change-set";
import { generateGoogleAdsRsaCopy } from "../ai/generator";
import { applyChangeSet, createChangeSet, listChangeSets, parseMarketingPlatform, validateChangeSet } from "./change-sets";

function mergeMarketingJson(
  prev: MarketingJsonShape | null | undefined,
  patch: MarketingJsonShape
): MarketingJsonShape {
  const base = { ...(prev ?? {}) };
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    (base as Record<string, unknown>)[k] = v;
  }
  return base;
}

// De-tenant: goldmoodastro tek tenant. Frontend ne gonderirse gondersin
// (ya da hic gondermesin) daima sabit tenant kullanilir. (Eski multi-tenant
// intake tamamen bu sabite pinlendi.)
const GOLDMOOD_TENANT = "goldmoodastro";
function tenantKeyFrom(_raw: unknown): string {
  return GOLDMOOD_TENANT;
}

async function getProject(tenantKey: string) {
  const [row] = await db.select().from(socialProjects).where(eq(socialProjects.key, tenantKey)).limit(1);
  return row ?? null;
}

/**
 * Tenant'a ozgu GA4 hostname allowlist'i (marketing_json.analyticsHostnames).
 * Tanimli ise GA4 raporlari yalniz bu hostname'lerden gelen trafigi sayar
 * (staging/localhost/3.taraf kirliligini disar). Yoksa null -> filtre uygulanmaz.
 */
function analyticsHostnames(row: { marketingJson?: unknown } | null): string[] | null {
  const mj = (row?.marketingJson ?? null) as { analyticsHostnames?: unknown } | null;
  const list = Array.isArray(mj?.analyticsHostnames)
    ? (mj!.analyticsHostnames as unknown[]).filter(
        (h): h is string => typeof h === "string" && h.trim().length > 0,
      )
    : [];
  return list.length ? list : null;
}

/**
 * Tenant analitik tipi: "lead" (form/telefon/WhatsApp odakli) | "ecommerce" (satin alma odakli).
 * marketing_json.analyticsType'tan okunur; tanimli degilse "ecommerce" (mevcut davranis korunur).
 */
function analyticsTypeOf(row: { marketingJson?: unknown } | null): "lead" | "ecommerce" {
  const mj = (row?.marketingJson ?? null) as { analyticsType?: unknown } | null;
  return mj?.analyticsType === "lead" ? "lead" : "ecommerce";
}

/**
 * Paylasimli Ads hesabinda tenant'i kampanya ADI on-ekiyle ayirma filtresi.
 * marketing_json.adsCampaignFilter ("Haldefiyat" gibi). Yoksa null → filtre yok.
 */
function adsCampaignFilter(row: { marketingJson?: unknown } | null): string | null {
  const mj = (row?.marketingJson ?? null) as { adsCampaignFilter?: unknown } | null;
  const v = typeof mj?.adsCampaignFilter === "string" ? mj.adsCampaignFilter.trim() : "";
  return v.length ? v : null;
}

export async function marketingRoutes(app: FastifyInstance) {
  app.get("/settings", async (req, reply) => {
    const tenantKey = tenantKeyFrom((req.query as { tenantKey?: string })?.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    return reply.send({
      tenantKey: row.key,
      name: row.name,
      websiteUrl: row.websiteUrl,
      gtmContainerId: row.gtmContainerId,
      ga4MeasurementId: row.ga4MeasurementId,
      ga4PropertyId: row.ga4PropertyId,
      googleAdsCustomerId: row.googleAdsCustomerId,
      googleAdsManagerId: row.googleAdsManagerId,
      searchConsoleSiteUrl: row.searchConsoleSiteUrl,
      siteSettingsApiUrl: row.siteSettingsApiUrl,
      marketingJson: (row.marketingJson as MarketingJsonShape | null) ?? {},
      branding: normalizeBranding((row.marketingJson as MarketingJsonShape | null)?.branding, {
        name: row.name,
        websiteUrl: row.websiteUrl,
      }),
    });
  });

  app.patch("/settings", async (req, reply) => {
    const body = req.body as {
      tenantKey?: string;
      gtmContainerId?: string | null;
      ga4MeasurementId?: string | null;
      ga4PropertyId?: string | null;
      googleAdsCustomerId?: string | null;
      googleAdsManagerId?: string | null;
      searchConsoleSiteUrl?: string | null;
      siteSettingsApiUrl?: string | null;
      marketingJson?: MarketingJsonShape | null;
    };
    const tenantKey = tenantKeyFrom(body.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });

    const nextJson =
      body.marketingJson !== undefined
        ? mergeMarketingJson((row.marketingJson as MarketingJsonShape | null) ?? {}, body.marketingJson ?? {})
        : undefined;

    await db
      .update(socialProjects)
      .set({
        gtmContainerId: body.gtmContainerId !== undefined ? body.gtmContainerId : row.gtmContainerId,
        ga4MeasurementId: body.ga4MeasurementId !== undefined ? body.ga4MeasurementId : row.ga4MeasurementId,
        ga4PropertyId: body.ga4PropertyId !== undefined ? body.ga4PropertyId : row.ga4PropertyId,
        googleAdsCustomerId:
          body.googleAdsCustomerId !== undefined ? body.googleAdsCustomerId : row.googleAdsCustomerId,
        googleAdsManagerId:
          body.googleAdsManagerId !== undefined ? body.googleAdsManagerId : row.googleAdsManagerId,
        searchConsoleSiteUrl:
          body.searchConsoleSiteUrl !== undefined ? body.searchConsoleSiteUrl : row.searchConsoleSiteUrl,
        siteSettingsApiUrl:
          body.siteSettingsApiUrl !== undefined ? body.siteSettingsApiUrl : row.siteSettingsApiUrl,
        ...(nextJson !== undefined ? { marketingJson: nextJson } : {}),
      })
      .where(eq(socialProjects.id, row.id));

    return reply.send({ ok: true });
  });

  app.get("/site-settings-fetch", async (req, reply) => {
    const tenantKey = tenantKeyFrom((req.query as { tenantKey?: string })?.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const url = row.siteSettingsApiUrl?.trim();
    if (!url) return reply.status(400).send({ error: "siteSettingsApiUrl bos" });
    try {
      const remote = await fetchRemoteSiteSettingsJson(url);
      return reply.send({ ok: true, remote });
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.get("/discover-ids", async (req, reply) => {
    const tenantKey = tenantKeyFrom((req.query as { tenantKey?: string })?.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    if (!row.websiteUrl) return reply.status(400).send({ error: "websiteUrl tanimli degil" });
    try {
      const { discoverTrackingIds } = await import("./site-fetch");
      const data = await discoverTrackingIds(row.websiteUrl);
      return reply.send({ ok: true, ...data });
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.get("/gsc-summary", async (req, reply) => {
    const tenantKey = tenantKeyFrom((req.query as { tenantKey?: string })?.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const siteUrl = row.searchConsoleSiteUrl?.trim();
    if (!siteUrl) {
      return reply.send({
        configured: false,
        message: "Search Console site URL tanimli degil",
      });
    }
    try {
      const data = await fetchGscSearchAnalytics(tenantKey, siteUrl);
      return reply.send({ configured: true, siteUrl, ...data });
    } catch (err) {
      return reply.send({
        configured: true,
        siteUrl,
        error: (err as Error).message,
      });
    }
  });

  app.get("/gsc/analytics", async (req, reply) => {
    const query = req.query as { tenantKey?: string; range?: string; type?: string };
    const tenantKey = tenantKeyFrom(query.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const siteUrl = row.searchConsoleSiteUrl?.trim();
    if (!siteUrl) return reply.send({ configured: false, message: "Search Console site URL tanimli degil" });
    try {
      const data = await fetchGscAnalytics(tenantKey, siteUrl, Number(query.range ?? 28), query.type || "web");
      return reply.send({ configured: true, ...data });
    } catch (err) {
      return reply.send({ configured: true, error: (err as Error).message });
    }
  });

  app.get("/gsc/page-queries", async (req, reply) => {
    const query = req.query as { tenantKey?: string; page?: string; range?: string };
    const tenantKey = tenantKeyFrom(query.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const siteUrl = row.searchConsoleSiteUrl?.trim();
    if (!siteUrl) return reply.send({ configured: false, message: "Search Console site URL tanimli degil" });
    if (!query.page?.trim()) return reply.status(400).send({ error: "page zorunlu" });
    try {
      const rows = await fetchGscPageQueries(tenantKey, siteUrl, query.page, Number(query.range ?? 28));
      return reply.send({ configured: true, siteUrl, page: query.page, rows });
    } catch (err) {
      return reply.send({ configured: true, error: (err as Error).message });
    }
  });

  app.post("/gsc/query", async (req, reply) => {
    const body = req.body as { tenantKey?: string; requestBody?: Record<string, unknown> };
    const tenantKey = tenantKeyFrom(body.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const siteUrl = row.searchConsoleSiteUrl?.trim();
    if (!siteUrl) return reply.status(400).send({ error: "Search Console site URL tanimli degil" });
    if (!body.requestBody || typeof body.requestBody !== "object") return reply.status(400).send({ error: "requestBody zorunlu" });
    try {
      const rows = await queryGsc(tenantKey, siteUrl, body.requestBody);
      return reply.send({ configured: true, siteUrl, rows });
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.get("/gsc/sites", async (req, reply) => {
    const tenantKey = tenantKeyFrom((req.query as { tenantKey?: string })?.tenantKey);
    try {
      const sites = await listGscSites(tenantKey);
      return reply.send({ configured: true, sites });
    } catch (err) {
      return reply.send({ configured: true, error: (err as Error).message });
    }
  });

  app.get("/gsc/index", async (req, reply) => {
    const query = req.query as { tenantKey?: string; limit?: string };
    const tenantKey = tenantKeyFrom(query.tenantKey);
    try {
      const data = await listGscIndexItems(tenantKey, Number(query.limit ?? 100));
      return reply.send({ configured: true, ...data });
    } catch (err) {
      return reply.send({ configured: true, error: (err as Error).message });
    }
  });

  app.post("/gsc/index/refresh", async (req, reply) => {
    const body = req.body as { tenantKey?: string; force?: boolean; limit?: number };
    const tenantKey = tenantKeyFrom(body.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const siteUrl = row.searchConsoleSiteUrl?.trim();
    if (!siteUrl) return reply.status(400).send({ error: "Search Console site URL tanimli degil" });
    try {
      const data = await refreshGscIndex(tenantKey, siteUrl, {
        websiteUrl: row.websiteUrl,
        force: body.force === true,
        limit: Number(body.limit ?? 50),
      });
      return reply.send({ configured: true, siteUrl, ...data });
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.post("/gsc/write-draft", async (req, reply) => {
    const body = req.body as {
      tenantKey?: string;
      kind?: "sitemap_submit" | "sitemap_delete" | "indexing_request";
      url?: string;
      createdBy?: string;
    };
    const tenantKey = tenantKeyFrom(body.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const siteUrl = row.searchConsoleSiteUrl?.trim();
    if (!siteUrl) return reply.status(400).send({ error: "Search Console site URL tanimli degil" });

    const kind = body.kind || "sitemap_submit";
    const fallbackUrl =
      kind === "sitemap_submit" || kind === "sitemap_delete"
        ? new URL("/sitemap.xml", row.websiteUrl || siteUrl).toString()
        : row.websiteUrl || siteUrl;
    const targetUrl = body.url?.trim() || fallbackUrl;
    const isSitemapDelete = kind === "sitemap_delete";
    const isIndexingRequest = kind === "indexing_request";
    const item = await createChangeSet(tenantKey, "gsc", {
      targetRef: targetUrl,
      title: isIndexingRequest
        ? "GSC indexing request taslagi"
        : isSitemapDelete
          ? "GSC sitemap delete taslagi"
          : "GSC sitemap submit taslagi",
      description: isIndexingRequest
        ? "Search Console indexing request taslagi. Bu aksiyon icin apply handler aktif degil; canli yazma yapmaz."
        : "Search Console sitemap islemi icin onayli change-set taslagi. Validate sonrasi apply canli GSC sitemap durumunu degistirir.",
      source: "automation",
      createdBy: body.createdBy || "system",
      payload: {
        action: kind,
        siteUrl,
        url: targetUrl,
        api:
          isIndexingRequest
            ? "indexing.urlNotifications.publish"
            : isSitemapDelete
              ? "webmasters.sitemaps.delete"
              : "webmasters.sitemaps.submit",
        dryRunOnly: isIndexingRequest,
        notes:
          isIndexingRequest
            ? "Indexing API kapsami ayrica acilana kadar apply islemi canliya yazmaz."
            : "Bu taslak validate edildikten sonra confirmApply=true ile canli GSC sitemap islemi yapar.",
      },
    });

    return reply.send({ ok: true, item });
  });

  app.get("/backlinks", async (req, reply) => {
    const tenantKey = tenantKeyFrom((req.query as { tenantKey?: string })?.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const mj = (row.marketingJson as MarketingJsonShape | null) ?? {};
    return reply.send({
      tenantKey,
      backlinks: mj.backlinks ?? { rows: [] },
      backlinksEnriched: mj.backlinksEnriched ?? null,
      hint:
        "GSC tam dis baglanti listesi vermez. DataForSEO (DATAFORSEO_LOGIN/PASSWORD) ile domain ozeti cekilebilir; manuel satirlar marketingJson.backlinks ile saklanir.",
      searchConsoleSiteUrl: row.searchConsoleSiteUrl,
    });
  });

  app.post("/backlinks/sync", async (req, reply) => {
    const { tenantKey } = req.body as { tenantKey?: string };
    const tk = tenantKeyFrom(tenantKey);
    const row = await getProject(tk);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const host = hostnameFromWebsiteUrl(row.websiteUrl ?? "");
    if (!host) {
      return reply.status(400).send({ error: "websiteUrl uzerinden domain cikarilamadi" });
    }
    try {
      const data = await fetchDataForSeoDomainSummary(host);
      const mj = mergeMarketingJson((row.marketingJson as MarketingJsonShape | null) ?? {}, {
        backlinksEnriched: {
          provider: "dataforseo",
          fetchedAt: new Date().toISOString(),
          data,
        },
      });
      await db.update(socialProjects).set({ marketingJson: mj }).where(eq(socialProjects.id, row.id));
      return reply.send({ ok: true, domain: host, summary: data });
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.get("/report", async (req, reply) => {
    const q = req.query as { tenantKey?: string; from?: string; to?: string };
    const tenantKey = tenantKeyFrom(q.tenantKey);
    const re = /^\d{4}-\d{2}-\d{2}$/;
    const to = (q.to || "").trim() || new Date().toISOString().slice(0, 10);
    const from = (q.from || "").trim() || new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    if (!re.test(from) || !re.test(to)) return reply.status(400).send({ error: "from/to YYYY-MM-DD olmali" });
    try {
      const report = await buildTenantReport(tenantKey, from, to);
      return reply.send(report);
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.get("/ga4-summary", async (req, reply) => {
    const tenantKey = tenantKeyFrom((req.query as { tenantKey?: string })?.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const pid = row.ga4PropertyId?.trim();
    if (!pid) {
      return reply.send({
        configured: false,
        message: "GA4 mulk ID (sayisal) tanimli degil — Analytics Data API icin Admin > Mulk Ayarlari",
      });
    }
    try {
      const data = await fetchGa4Summary(tenantKey, pid, analyticsHostnames(row));
      return reply.send({ configured: true, analyticsType: analyticsTypeOf(row), ...data });
    } catch (err) {
      return reply.send({
        configured: true,
        error: (err as Error).message,
      });
    }
  });

  async function ga4PropertyForTenant(tenantKey: string, reply: any) {
    const row = await getProject(tenantKey);
    if (!row) {
      reply.status(404).send({ error: "Tenant bulunamadi" });
      return null;
    }
    const propertyId = row.ga4PropertyId?.trim();
    if (!propertyId) {
      reply.send({
        configured: false,
        message: "GA4 mulk ID (sayisal) tanimli degil — Analytics Data API icin Admin > Mulk Ayarlari",
      });
      return null;
    }
    return { row, propertyId };
  }

  app.get("/ga4/report", async (req, reply) => {
    const query = req.query as { tenantKey?: string; range?: string };
    const tenantKey = tenantKeyFrom(query.tenantKey);
    const found = await ga4PropertyForTenant(tenantKey, reply);
    if (!found) return;
    try {
      const data = await fetchGa4DeepReport(tenantKey, found.propertyId, Number(query.range ?? 28), analyticsHostnames(found.row));
      return reply.send({ configured: true, ...data });
    } catch (err) {
      return reply.send({ configured: true, error: (err as Error).message });
    }
  });

  app.get("/ga4/funnel", async (req, reply) => {
    const query = req.query as { tenantKey?: string; range?: string };
    const tenantKey = tenantKeyFrom(query.tenantKey);
    const found = await ga4PropertyForTenant(tenantKey, reply);
    if (!found) return;
    try {
      const data = await fetchGa4Funnel(tenantKey, found.propertyId, Number(query.range ?? 28), analyticsHostnames(found.row));
      return reply.send({ configured: true, ...data });
    } catch (err) {
      return reply.send({ configured: true, error: (err as Error).message });
    }
  });

  app.get("/ga4/funnel-trend", async (req, reply) => {
    const query = req.query as { tenantKey?: string; granularity?: string; periods?: string };
    const tenantKey = tenantKeyFrom(query.tenantKey);
    const found = await ga4PropertyForTenant(tenantKey, reply);
    if (!found) return;
    const granularity = query.granularity === "week" ? "week" : "month";
    try {
      const data = await fetchGa4FunnelTrend(
        tenantKey,
        found.propertyId,
        granularity,
        query.periods ? Number(query.periods) : undefined,
        analyticsHostnames(found.row),
      );
      return reply.send({ configured: true, ...data });
    } catch (err) {
      return reply.send({ configured: true, error: (err as Error).message });
    }
  });

  app.get("/ga4/visit-stats", async (req, reply) => {
    const query = req.query as { tenantKey?: string; range?: string };
    const tenantKey = tenantKeyFrom(query.tenantKey);
    const found = await ga4PropertyForTenant(tenantKey, reply);
    if (!found) return;
    try {
      const data = await fetchGa4VisitStats(tenantKey, found.propertyId, Number(query.range ?? 28), analyticsHostnames(found.row));
      return reply.send({ configured: true, ...data });
    } catch (err) {
      return reply.send({ configured: true, error: (err as Error).message });
    }
  });

  app.get("/ga4/realtime-detail", async (req, reply) => {
    const tenantKey = tenantKeyFrom((req.query as { tenantKey?: string })?.tenantKey);
    const found = await ga4PropertyForTenant(tenantKey, reply);
    if (!found) return;
    try {
      const data = await fetchGa4RealtimeDetail(tenantKey, found.propertyId);
      return reply.send({ configured: true, ...data });
    } catch (err) {
      return reply.send({ configured: true, error: (err as Error).message });
    }
  });

  app.get("/ga4/config", async (req, reply) => {
    const tenantKey = tenantKeyFrom((req.query as { tenantKey?: string })?.tenantKey);
    const found = await ga4PropertyForTenant(tenantKey, reply);
    if (!found) return;
    try {
      const data = await fetchGa4Config(tenantKey, found.propertyId);
      return reply.send({ configured: true, ...data });
    } catch (err) {
      return reply.send({ configured: true, error: (err as Error).message });
    }
  });

  app.post("/ga4/config-draft", async (req, reply) => {
    const body = req.body as {
      tenantKey?: string;
      kind?: "conversion_event" | "audience" | "custom_dimension" | "delete_key_event" | "delete_audience" | "delete_custom_dimension";
      name?: string;
      resourceName?: string;
      createdBy?: string;
    };
    const tenantKey = tenantKeyFrom(body.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const propertyId = row.ga4PropertyId?.trim();
    if (!propertyId) return reply.status(400).send({ error: "GA4 property ID tanimli degil" });

    const kind = body.kind || "conversion_event";
    const name =
      body.name?.trim() ||
      (kind === "audience" ? "high_intent_users" : kind === "custom_dimension" ? "tenant_source" : "generate_lead");
    const item = await createChangeSet(tenantKey, "ga4", {
      targetRef: propertyId,
      title:
        kind === "audience"
          ? "GA4 audience config taslagi"
          : kind === "custom_dimension"
            ? "GA4 custom dimension config taslagi"
            : "GA4 conversion event config taslagi",
      description:
        "GA4 Admin API konfigürasyonu icin onayli change-set taslagi. Apply handler aktif olmadigi icin canli yazma yapmaz.",
      source: "automation",
      createdBy: body.createdBy || "system",
      payload: {
        action: kind,
        propertyId,
        name,
        resourceName: body.resourceName,
        adminApi: "analyticsadmin.properties",
        dryRunOnly: !kind.startsWith("delete_"),
        notes:
          "Bu taslak validate edilebilir; apply islemi kullanici onayi olmadan calismaz.",
      },
    });

    return reply.send({ ok: true, item });
  });

  app.get("/gtm-summary", async (req, reply) => {
    const tenantKey = tenantKeyFrom((req.query as { tenantKey?: string })?.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const containerId = row.gtmContainerId?.trim();
    if (!containerId) {
      return reply.send({
        configured: false,
        message: "GTM container ID tanimli degil",
      });
    }
    try {
      const data = await fetchGtmSummary(tenantKey, containerId);
      return reply.send(data);
    } catch (err) {
      return reply.send({
        configured: true,
        containerId,
        error: (err as Error).message,
      });
    }
  });

  app.post("/gtm/tracking-fix-suggestions", async (req, reply) => {
    const body = req.body as { tenantKey?: string; createdBy?: string };
    const tenantKey = tenantKeyFrom(body.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const containerId = row.gtmContainerId?.trim();
    const measurementId = row.ga4MeasurementId?.trim();
    if (!containerId) return reply.status(400).send({ error: "GTM container ID tanimli degil" });
    if (!measurementId) return reply.status(400).send({ error: "GA4 measurement ID tanimli degil" });

    const summary = await fetchGtmSummary(tenantKey, containerId);
    if ((summary as any).configured === false || (summary as any).needsAccountPath || (summary as any).error) {
      return reply.send({
        ok: true,
        created: false,
        message: (summary as any).message || (summary as any).error || "GTM container okunamadi; eksik tag varsayimi yapilmadi.",
      });
    }
    const tags = Array.isArray((summary as any).tags) ? ((summary as any).tags as Array<Record<string, unknown>>) : [];
    const hasGa4Tag = tags.some((tag) => {
      const raw = JSON.stringify(tag).toLowerCase();
      return raw.includes(measurementId.toLowerCase()) || raw.includes("ga4") || raw.includes("google tag");
    });
    if (hasGa4Tag) {
      return reply.send({ ok: true, created: false, message: "GA4/Google tag benzeri bir tag zaten gorunuyor." });
    }

    const containerPath = (summary as any).container || containerId;
    const item = await createChangeSet(tenantKey, "gtm", {
      targetRef: containerPath,
      title: "GA4 temel tag eksigi duzeltme taslagi",
      description: "GTM container icinde GA4/Google tag gorunmedigi icin otomasyon tarafindan taslak olusturuldu.",
      source: "automation",
      createdBy: body.createdBy || "system",
      payload: {
        action: "upsert_tag",
        containerPath,
        publish: false,
        tag: {
          name: `GA4 - ${measurementId}`,
          type: "googtag",
          parameter: [
            { type: "template", key: "tagId", value: measurementId },
            { type: "boolean", key: "sendPageView", value: "true" },
          ],
          firingTriggerId: ["2147479553"],
        },
        notes: "Otomatik taslak: uygulamadan once validate ve kullanici onayi gerekir.",
      },
    });
    return reply.send({ ok: true, created: true, item });
  });

  app.post("/gtm/rollback-draft", async (req, reply) => {
    const body = req.body as { tenantKey?: string; versionId?: string; versionPath?: string; versionName?: string; createdBy?: string };
    const tenantKey = tenantKeyFrom(body.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const containerId = row.gtmContainerId?.trim();
    if (!containerId) return reply.status(400).send({ error: "GTM container ID tanimli degil" });
    if (!body.versionId?.trim() && !body.versionPath?.trim()) {
      return reply.status(400).send({ error: "versionId veya versionPath zorunlu" });
    }
    const summary = await fetchGtmSummary(tenantKey, containerId);
    if ((summary as any).configured === false || (summary as any).needsAccountPath || (summary as any).error) {
      return reply.status(400).send({
        error: (summary as any).message || (summary as any).error || "GTM container okunamadi",
      });
    }
    const containerPath = (summary as any).container || containerId;
    const versionId = body.versionId?.trim() || body.versionPath?.split("/").pop() || "";
    const item = await createChangeSet(tenantKey, "gtm", {
      targetRef: containerPath,
      title: `GTM rollback taslagi: v${versionId}`,
      description:
        "GTM container'i secilen eski versiyona dondurmek icin onayli change-set. Apply edilirse yayindaki container versiyonu degisir.",
      source: "manual",
      createdBy: body.createdBy || "system",
      payload: {
        action: "rollback",
        containerPath,
        versionId,
        versionPath: body.versionPath,
        versionName: body.versionName,
        notes: "Rollback production etkiler; validate ve kullanici onayi olmadan apply edilmez.",
      },
    });
    return reply.send({ ok: true, item });
  });

  app.post("/gtm/built-in-variables-draft", async (req, reply) => {
    const body = req.body as { tenantKey?: string; types?: string[]; containerPath?: string; createdBy?: string };
    const tenantKey = tenantKeyFrom(body.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const containerId = row.gtmContainerId?.trim();
    if (!containerId) return reply.status(400).send({ error: "GTM container ID tanimli degil" });
    const types = Array.isArray(body.types) ? body.types.map((type) => String(type).trim()).filter(Boolean) : [];
    if (types.length === 0) return reply.status(400).send({ error: "types zorunlu" });
    let containerPath = body.containerPath?.trim();
    if (containerPath && !/^accounts\/[^/]+\/containers\/[^/]+$/.test(containerPath)) {
      return reply.status(400).send({ error: "containerPath accounts/{accountId}/containers/{containerId} formatinda olmali" });
    }
    if (!containerPath) {
      const summary = await fetchGtmSummary(tenantKey, containerId);
      if ((summary as any).configured === false || (summary as any).needsAccountPath || (summary as any).error) {
        return reply.status(400).send({
          error: (summary as any).message || (summary as any).error || "GTM container okunamadi",
        });
      }
      containerPath = (summary as any).container || containerId;
    }
    const item = await createChangeSet(tenantKey, "gtm", {
      targetRef: containerPath,
      title: "GTM built-in variables enable taslagi",
      description: "Click/Page/Event built-in variable tiplerini change-set apply ile etkinlestirir.",
      source: "manual",
      createdBy: body.createdBy || "system",
      payload: {
        action: "enable_built_in_variables",
        containerPath,
        builtInVariableTypes: types,
        publish: false,
        notes: "Built-in variables workspace degisikligi yapar; yayina almak icin ayrica publish change-set gerekir.",
      },
    });
    return reply.send({ ok: true, item });
  });

  app.get("/gtm/version-diff", async (req, reply) => {
    const query = req.query as { tenantKey?: string; versionA?: string; versionB?: string };
    const tenantKey = tenantKeyFrom(query.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const containerId = row.gtmContainerId?.trim();
    if (!containerId) return reply.status(400).send({ error: "GTM container ID tanimli degil" });
    if (!query.versionA?.trim() || !query.versionB?.trim()) {
      return reply.status(400).send({ error: "versionA ve versionB zorunlu" });
    }
    try {
      const diff = await diffGtmVersions(tenantKey, containerId, query.versionA, query.versionB);
      return reply.send({ configured: true, diff });
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.get("/merchant/summary", async (req, reply) => {
    const tenantKey = tenantKeyFrom((req.query as { tenantKey?: string })?.tenantKey);
    try {
      const data = await fetchMerchantSummary(tenantKey);
      return reply.send(data);
    } catch (err) {
      return reply.send({ configured: true, error: (err as Error).message });
    }
  });

  app.post("/merchant/attribute-fix-draft", async (req, reply) => {
    const body = req.body as {
      tenantKey?: string;
      productId?: string;
      productIds?: string[];
      attribute?: string;
      updates?: Record<string, unknown>;
      suggestionId?: string;
      createdBy?: string;
    };
    const tenantKey = tenantKeyFrom(body.tenantKey);
    const summary = await fetchMerchantSummary(tenantKey);
    const merchantId = String((summary as { merchantId?: string }).merchantId ?? "").trim();
    if (!merchantId) return reply.status(400).send({ error: "Merchant Center account ID tanimli degil" });
    const issue = Array.isArray((summary as any).issues) ? (summary as any).issues[0] : null;
    const suggestions = Array.isArray((summary as any).feedSuggestions) ? (summary as any).feedSuggestions : [];
    const suggestion = body.suggestionId ? suggestions.find((item: any) => item.id === body.suggestionId) : null;
    const productIds =
      body.productIds?.length
        ? body.productIds.map((id) => String(id).trim()).filter(Boolean)
        : suggestion?.productIds?.length
          ? suggestion.productIds
          : body.productId?.trim()
            ? [body.productId.trim()]
            : issue?.productId
              ? [issue.productId]
              : [];
    if (productIds.length === 0) return reply.status(400).send({ error: "productId/productIds zorunlu" });
    const updates = body.updates && Object.keys(body.updates).length > 0 ? body.updates : suggestion?.updates;
    if (!updates || Object.keys(updates).length === 0) {
      return reply.status(400).send({ error: "updates zorunlu (ornek: { condition: 'used' })" });
    }
    const attribute = body.attribute?.trim() || Object.keys(updates).join(",");
    const item = await createChangeSet(tenantKey, "merchant", {
      targetRef: productIds.length === 1 ? productIds[0] : `${productIds.length} products`,
      title: suggestion ? `Merchant feed önerisi: ${suggestion.title}` : "Merchant attribute fix taslagi",
      description:
        "Merchant Center urun feed/issue analizi sonucu attribute duzeltme taslagi. Apply edilirse Content API ile urun feed'i guncellenir.",
      source: suggestion ? "recommendation" : "automation",
      createdBy: body.createdBy || "system",
      payload: {
        action: "attribute_fix",
        merchantId,
        productId: productIds[0],
        productIds,
        attribute,
        updates,
        detectedIssue: issue ?? null,
        suggestion: suggestion ?? null,
        api: "content.products.update",
        notes:
          "Validate ilk urunu okuyup before/after farkini gosterir; apply kullanici onayi olmadan calismaz.",
      },
    });
    return reply.send({ ok: true, item });
  });

  app.get("/meta/diagnostics", async (req, reply) => {
    const tenantKey = tenantKeyFrom((req.query as { tenantKey?: string })?.tenantKey);
    try {
      const data = await fetchMetaDiagnostics(tenantKey);
      return reply.send(data);
    } catch (err) {
      return reply.send({ configured: false, error: (err as Error).message });
    }
  });

  app.post("/meta/diagnostics-draft", async (req, reply) => {
    const body = req.body as { tenantKey?: string; createdBy?: string };
    const tenantKey = tenantKeyFrom(body.tenantKey);
    const diagnostics = await fetchMetaDiagnostics(tenantKey);
    const item = await createChangeSet(tenantKey, "meta", {
      targetRef: "meta-pixel-capi",
      title: "Meta Pixel/CAPI diagnostics taslagi",
      description:
        "Meta Pixel/CAPI eksiklerini duzeltmek icin onayli change-set taslagi. Secret degerler payload'a yazilmaz.",
      source: "automation",
      createdBy: body.createdBy || "system",
      payload: {
        action: "diagnostics_fix",
        checks: diagnostics.checks,
        recommendations: diagnostics.recommendations,
        dryRunOnly: true,
        notes:
          "Pixel ID ve CAPI token Settings > Meta namespace altindan girilmeli; secret payload'a eklenmez.",
      },
    });
    return reply.send({ ok: true, item });
  });

  app.post("/ai/change-set-draft", async (req, reply) => {
    const body = req.body as {
      tenantKey?: string;
      platform?: "merchant" | "meta" | "gsc" | "ga4" | "gtm" | "google_ads";
      goal?: string;
      createdBy?: string;
    };
    const tenantKey = tenantKeyFrom(body.tenantKey);
    const item = await createAiMarketingChangeSetDraft({
      tenantKey,
      platform: body.platform,
      goal: body.goal,
      createdBy: body.createdBy,
    });
    return reply.send({ ok: true, item });
  });

  app.get("/google-ads-campaigns", async (req, reply) => {
    const tenantKey = tenantKeyFrom((req.query as { tenantKey?: string })?.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const cid = row.googleAdsCustomerId?.trim();
    if (!cid) {
      return reply.send({
        configured: false,
        message: "Google Ads musteri ID tanimli degil",
      });
    }
    try {
      const campaigns = await fetchGoogleAdsCampaigns(tenantKey, cid, row.googleAdsManagerId, adsCampaignFilter(row));
      return reply.send({ configured: true, customerId: cid, campaigns });
    } catch (err) {
      return reply.send({
        configured: true,
        customerId: cid,
        error: (err as Error).message,
      });
    }
  });

  app.get("/google-ads/audit", async (req, reply) => {
    const tenantKey = tenantKeyFrom((req.query as { tenantKey?: string })?.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const cid = row.googleAdsCustomerId?.trim();
    if (!cid) {
      return reply.send({
        configured: false,
        message: "Google Ads musteri ID tanimli degil",
      });
    }
    try {
      const audit = await fetchGoogleAdsAudit(tenantKey, cid, row.googleAdsManagerId, adsCampaignFilter(row));
      return reply.send({ configured: true, tenantKey, ...audit });
    } catch (err) {
      return reply.send({
        configured: true,
        tenantKey,
        customerId: cid,
        error: (err as Error).message,
      });
    }
  });

  app.get("/google-ads/recommendations", async (req, reply) => {
    const tenantKey = tenantKeyFrom((req.query as { tenantKey?: string })?.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const cid = row.googleAdsCustomerId?.trim();
    if (!cid) {
      return reply.send({
        configured: false,
        message: "Google Ads musteri ID tanimli degil",
      });
    }
    try {
      const recommendations = await fetchGoogleAdsRecommendations(tenantKey, cid, row.googleAdsManagerId);
      return reply.send({ configured: true, tenantKey, customerId: cid, recommendations });
    } catch (err) {
      return reply.send({
        configured: true,
        tenantKey,
        customerId: cid,
        error: (err as Error).message,
      });
    }
  });

  app.get("/google-ads/keywords", async (req, reply) => {
    const tenantKey = tenantKeyFrom((req.query as { tenantKey?: string })?.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const cid = row.googleAdsCustomerId?.trim();
    if (!cid) {
      return reply.send({
        configured: false,
        message: "Google Ads musteri ID tanimli degil",
      });
    }
    try {
      const keywords = await fetchGoogleAdsKeywords(tenantKey, cid, row.googleAdsManagerId, adsCampaignFilter(row));
      return reply.send({ configured: true, tenantKey, customerId: cid, keywords });
    } catch (err) {
      return reply.send({
        configured: true,
        tenantKey,
        customerId: cid,
        error: (err as Error).message,
      });
    }
  });

  app.get("/google-ads/insights", async (req, reply) => {
    const query = req.query as { tenantKey?: string; range?: string };
    const tenantKey = tenantKeyFrom(query.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const cid = row.googleAdsCustomerId?.trim();
    if (!cid) {
      return reply.send({
        configured: false,
        message: "Google Ads musteri ID tanimli degil",
      });
    }
    try {
      const insights = await fetchGoogleAdsInsights(tenantKey, cid, row.googleAdsManagerId, query.range, adsCampaignFilter(row));
      return reply.send({ configured: true, tenantKey, customerId: cid, ...insights });
    } catch (err) {
      return reply.send({
        configured: true,
        tenantKey,
        customerId: cid,
        error: (err as Error).message,
      });
    }
  });

  app.get("/google-ads/asset-group-assets", async (req, reply) => {
    const query = req.query as { tenantKey?: string; assetGroupId?: string };
    const tenantKey = tenantKeyFrom(query.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const cid = row.googleAdsCustomerId?.trim();
    if (!cid) {
      return reply.send({
        configured: false,
        message: "Google Ads musteri ID tanimli degil",
      });
    }
    const assetGroupId = query.assetGroupId?.trim();
    if (!assetGroupId) return reply.status(400).send({ error: "assetGroupId zorunlu" });
    try {
      const assets = await fetchGoogleAdsAssetGroupAssets(tenantKey, cid, row.googleAdsManagerId, assetGroupId);
      return reply.send({ configured: true, tenantKey, customerId: cid, assetGroupId, assets });
    } catch (err) {
      return reply.send({
        configured: true,
        tenantKey,
        customerId: cid,
        error: (err as Error).message,
      });
    }
  });

  app.post("/google-ads/campaign-drafts", async (req, reply) => {
    const body = req.body as {
      tenantKey?: string;
      action?: "status" | "budget" | "bidding" | "remove";
      campaignId?: string | null;
      campaignName?: string | null;
      campaignResourceName?: string | null;
      campaignBudgetResourceName?: string | null;
      status?: "ENABLED" | "PAUSED";
      removeConfirm?: boolean;
      amountMicros?: number;
      bidding?: GoogleAdsBiddingDraftInput;
      createdBy?: string;
    };
    const tenantKey = tenantKeyFrom(body.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const cid = row.googleAdsCustomerId?.trim();
    if (!cid) return reply.status(400).send({ error: "Google Ads musteri ID tanimli degil" });

    const campaignResourceName = body.campaignResourceName?.trim();
    if (!campaignResourceName) return reply.status(400).send({ error: "campaignResourceName zorunlu" });

    let payload: GoogleAdsChangeSetPayload;
    let title = "Google Ads kampanya degisiklik taslagi";
    if (body.action === "status") {
      if (body.status !== "ENABLED" && body.status !== "PAUSED") {
        return reply.status(400).send({ error: "status ENABLED veya PAUSED olmali" });
      }
      payload = buildCampaignStatusChangePayload({ campaignResourceName, status: body.status });
      title = `Kampanya ${body.status === "PAUSED" ? "duraklat" : "etkinlestir"} taslagi`;
    } else if (body.action === "budget") {
      const campaignBudgetResourceName = body.campaignBudgetResourceName?.trim();
      if (!campaignBudgetResourceName) {
        return reply.status(400).send({ error: "campaignBudgetResourceName zorunlu" });
      }
      payload = buildCampaignBudgetChangePayload({
        campaignResourceName,
        campaignBudgetResourceName,
        amountMicros: Number(body.amountMicros),
      });
      title = "Kampanya butce guncelleme taslagi";
    } else if (body.action === "bidding") {
      if (!body.bidding) return reply.status(400).send({ error: "bidding zorunlu" });
      payload = buildCampaignBiddingChangePayload({ campaignResourceName, bidding: body.bidding });
      title = "Kampanya bidding guncelleme taslagi";
    } else if (body.action === "remove") {
      if (body.removeConfirm !== true) return reply.status(400).send({ error: "REMOVE icin removeConfirm=true zorunlu" });
      payload = buildCampaignRemovePayload({ campaignResourceName });
      title = "Kampanya REMOVE taslagi";
    } else {
      return reply.status(400).send({ error: "action status, budget, bidding veya remove olmali" });
    }

    const local = validateChangeSetPayload(payload);
    if (!local.ok) return reply.status(400).send({ ok: false, validation: local });

    const uuid = randomUUID();
    await db.insert(googleAdsChangeSets).values({
      uuid,
      tenantKey,
      customerId: cid,
      managerId: row.googleAdsManagerId,
      campaignId: body.campaignId ?? null,
      campaignName: body.campaignName ?? null,
      title: body.campaignName ? `${title} — ${body.campaignName}` : title,
      source: "manual",
      payload,
      createdBy: body.createdBy?.trim() || "system",
    });
    const [created] = await db
      .select()
      .from(googleAdsChangeSets)
      .where(eq(googleAdsChangeSets.uuid, uuid))
      .limit(1);
    return reply.send({ ok: true, item: created });
  });

  app.post("/google-ads/keyword-drafts", async (req, reply) => {
    const body = req.body as {
      tenantKey?: string;
      campaignId?: string | null;
      campaignName?: string | null;
      keywordText?: string | null;
      adGroupCriterionResourceName?: string | null;
      status?: "ENABLED" | "PAUSED";
      createdBy?: string;
    };
    const tenantKey = tenantKeyFrom(body.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const cid = row.googleAdsCustomerId?.trim();
    if (!cid) return reply.status(400).send({ error: "Google Ads musteri ID tanimli degil" });
    if (body.status !== "ENABLED" && body.status !== "PAUSED") {
      return reply.status(400).send({ error: "status ENABLED veya PAUSED olmali" });
    }
    const adGroupCriterionResourceName = body.adGroupCriterionResourceName?.trim();
    if (!adGroupCriterionResourceName) {
      return reply.status(400).send({ error: "adGroupCriterionResourceName zorunlu" });
    }

    const payload = buildKeywordStatusChangePayload({ adGroupCriterionResourceName, status: body.status });
    const local = validateChangeSetPayload(payload);
    if (!local.ok) return reply.status(400).send({ ok: false, validation: local });

    const uuid = randomUUID();
    await db.insert(googleAdsChangeSets).values({
      uuid,
      tenantKey,
      customerId: cid,
      managerId: row.googleAdsManagerId,
      campaignId: body.campaignId ?? null,
      campaignName: body.campaignName ?? null,
      title: `Keyword ${body.status === "PAUSED" ? "duraklat" : "etkinlestir"} taslagi${body.keywordText ? ` — ${body.keywordText}` : ""}`,
      source: "manual",
      payload,
      createdBy: body.createdBy?.trim() || "system",
    });
    const [created] = await db
      .select()
      .from(googleAdsChangeSets)
      .where(eq(googleAdsChangeSets.uuid, uuid))
      .limit(1);
    return reply.send({ ok: true, item: created });
  });

  app.post("/google-ads/image-asset-drafts", { bodyLimit: 12 * 1024 * 1024 }, async (req, reply) => {
    const body = req.body as {
      tenantKey?: string;
      campaignId?: string | null;
      campaignName?: string | null;
      assetGroupResourceName?: string | null;
      assetGroupName?: string | null;
      name?: string;
      imageBase64?: string;
      fieldType?: string | null;
      createdBy?: string;
    };
    const tenantKey = tenantKeyFrom(body.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const cid = row.googleAdsCustomerId?.trim();
    if (!cid) return reply.status(400).send({ error: "Google Ads musteri ID tanimli degil" });
    if (!body.name?.trim()) return reply.status(400).send({ error: "name zorunlu" });
    if (!body.imageBase64?.trim()) return reply.status(400).send({ error: "imageBase64 zorunlu" });

    const payload = buildImageAssetCreatePayload({
      customerId: cid,
      assetGroupResourceName: body.assetGroupResourceName,
      name: body.name,
      imageBase64: body.imageBase64,
      fieldType: body.fieldType,
    });
    const local = validateChangeSetPayload(payload);
    if (!local.ok) return reply.status(400).send({ ok: false, validation: local });

    const uuid = randomUUID();
    await db.insert(googleAdsChangeSets).values({
      uuid,
      tenantKey,
      customerId: cid,
      managerId: row.googleAdsManagerId,
      campaignId: body.campaignId ?? null,
      campaignName: body.campaignName ?? null,
      title: `Gorsel asset taslagi${body.assetGroupName ? ` — ${body.assetGroupName}` : ""}`,
      source: "manual",
      payload,
      createdBy: body.createdBy?.trim() || "system",
    });
    const [created] = await db
      .select()
      .from(googleAdsChangeSets)
      .where(eq(googleAdsChangeSets.uuid, uuid))
      .limit(1);
    return reply.send({ ok: true, item: created });
  });

  app.post("/google-ads/asset-group-asset-remove-drafts", async (req, reply) => {
    const body = req.body as {
      tenantKey?: string;
      campaignId?: string | null;
      campaignName?: string | null;
      assetGroupName?: string | null;
      assetGroupAssetResourceName?: string | null;
      assetName?: string | null;
      fieldType?: string | null;
      removeConfirm?: boolean;
      createdBy?: string;
    };
    const tenantKey = tenantKeyFrom(body.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const cid = row.googleAdsCustomerId?.trim();
    if (!cid) return reply.status(400).send({ error: "Google Ads musteri ID tanimli degil" });
    const assetGroupAssetResourceName = body.assetGroupAssetResourceName?.trim();
    if (!assetGroupAssetResourceName) return reply.status(400).send({ error: "assetGroupAssetResourceName zorunlu" });
    if (body.removeConfirm !== true) return reply.status(400).send({ error: "REMOVE icin removeConfirm=true zorunlu" });

    const payload = buildAssetGroupAssetRemovePayload({
      assetGroupAssetResourceName,
      assetName: body.assetName,
      fieldType: body.fieldType,
    });
    const local = validateChangeSetPayload(payload);
    if (!local.ok) return reply.status(400).send({ ok: false, validation: local });

    const uuid = randomUUID();
    await db.insert(googleAdsChangeSets).values({
      uuid,
      tenantKey,
      customerId: cid,
      managerId: row.googleAdsManagerId,
      campaignId: body.campaignId ?? null,
      campaignName: body.campaignName ?? null,
      title: `Asset baglantisi kaldirma taslagi${body.assetGroupName ? ` — ${body.assetGroupName}` : ""}`,
      source: "manual",
      payload,
      createdBy: body.createdBy?.trim() || "system",
    });
    const [created] = await db
      .select()
      .from(googleAdsChangeSets)
      .where(eq(googleAdsChangeSets.uuid, uuid))
      .limit(1);
    return reply.send({ ok: true, item: created });
  });

  app.post("/google-ads/ai-rsa-drafts", async (req, reply) => {
    const body = req.body as {
      tenantKey?: string;
      campaignId?: string | null;
      campaignName?: string | null;
      assetGroupResourceName?: string | null;
      assetGroupName?: string | null;
      goal?: string | null;
      context?: string | null;
      createdBy?: string;
    };
    const tenantKey = tenantKeyFrom(body.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const cid = row.googleAdsCustomerId?.trim();
    if (!cid) return reply.status(400).send({ error: "Google Ads musteri ID tanimli degil" });
    const assetGroupResourceName = body.assetGroupResourceName?.trim();
    if (!assetGroupResourceName) return reply.status(400).send({ error: "assetGroupResourceName zorunlu" });

    const copy = await generateGoogleAdsRsaCopy({
      tenantKey,
      goal: body.goal,
      context: body.context || body.campaignName || body.assetGroupName,
    });
    const payload = buildTextAssetChangePayload({
      customerId: cid,
      assetGroupResourceName,
      textAssets: {
        headlines: copy.headlines,
        longHeadlines: copy.longHeadlines,
        descriptions: copy.descriptions,
        businessName: copy.businessName,
      },
      notes: `AI kaynakli Google Ads reklam metni taslagi (${copy.provider}/${copy.model}). Canli uygulama validate ve kullanici onayi gerektirir.`,
    });
    const local = validateChangeSetPayload(payload);
    if (!local.ok) return reply.status(400).send({ ok: false, validation: local });

    const uuid = randomUUID();
    await db.insert(googleAdsChangeSets).values({
      uuid,
      tenantKey,
      customerId: cid,
      managerId: row.googleAdsManagerId,
      campaignId: body.campaignId ?? null,
      campaignName: body.campaignName ?? null,
      title: `AI RSA metin taslagi${body.assetGroupName ? ` — ${body.assetGroupName}` : ""}`,
      source: "ai",
      payload,
      createdBy: body.createdBy?.trim() || "ai",
    });
    const [created] = await db
      .select()
      .from(googleAdsChangeSets)
      .where(eq(googleAdsChangeSets.uuid, uuid))
      .limit(1);
    return reply.send({ ok: true, item: created, copy });
  });

  app.post("/google-ads/ai-rsa-copy", async (req, reply) => {
    const body = req.body as {
      tenantKey?: string;
      campaignName?: string | null;
      assetGroupName?: string | null;
      goal?: string | null;
      context?: string | null;
    };
    const tenantKey = tenantKeyFrom(body.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const copy = await generateGoogleAdsRsaCopy({
      tenantKey,
      goal: body.goal,
      context: body.context || body.campaignName || body.assetGroupName,
    });
    return reply.send({ ok: true, copy });
  });

  app.post("/google-ads/text-asset-drafts", async (req, reply) => {
    const body = req.body as {
      tenantKey?: string;
      campaignId?: string | null;
      campaignName?: string | null;
      assetGroupResourceName?: string | null;
      assetGroupName?: string | null;
      textAssets?: GoogleAdsChangeSetPayload["textAssets"];
      createdBy?: string;
    };
    const tenantKey = tenantKeyFrom(body.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const cid = row.googleAdsCustomerId?.trim();
    if (!cid) return reply.status(400).send({ error: "Google Ads musteri ID tanimli degil" });
    const assetGroupResourceName = body.assetGroupResourceName?.trim();
    if (!assetGroupResourceName) return reply.status(400).send({ error: "assetGroupResourceName zorunlu" });
    if (!body.textAssets || typeof body.textAssets !== "object") return reply.status(400).send({ error: "textAssets zorunlu" });

    const payload = buildTextAssetChangePayload({
      customerId: cid,
      assetGroupResourceName,
      textAssets: body.textAssets,
      notes: "Manuel Google Ads PMax metin asset taslagi. Canli uygulama validate ve kullanici onayi gerektirir.",
    });
    const local = validateChangeSetPayload(payload);
    if (!local.ok) return reply.status(400).send({ ok: false, validation: local });

    const uuid = randomUUID();
    await db.insert(googleAdsChangeSets).values({
      uuid,
      tenantKey,
      customerId: cid,
      managerId: row.googleAdsManagerId,
      campaignId: body.campaignId ?? null,
      campaignName: body.campaignName ?? null,
      title: `PMax metin asset taslagi${body.assetGroupName ? ` — ${body.assetGroupName}` : ""}`,
      source: "manual",
      payload,
      createdBy: body.createdBy?.trim() || "system",
    });
    const [created] = await db
      .select()
      .from(googleAdsChangeSets)
      .where(eq(googleAdsChangeSets.uuid, uuid))
      .limit(1);
    return reply.send({ ok: true, item: created });
  });

  app.post("/google-ads/search-campaign-drafts", async (req, reply) => {
    const body = req.body as {
      tenantKey?: string;
      spec?: GoogleAdsSearchCampaignCreateSpec;
      createdBy?: string;
    };
    const tenantKey = tenantKeyFrom(body.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const cid = row.googleAdsCustomerId?.trim();
    if (!cid) return reply.status(400).send({ error: "Google Ads musteri ID tanimli degil" });
    if (!body.spec || typeof body.spec !== "object") return reply.status(400).send({ error: "spec zorunlu" });

    const payload = buildSearchCampaignCreatePayload({ customerId: cid, spec: body.spec });
    const local = validateChangeSetPayload(payload);
    if (!local.ok) return reply.status(400).send({ ok: false, validation: local });

    const uuid = randomUUID();
    await db.insert(googleAdsChangeSets).values({
      uuid,
      tenantKey,
      customerId: cid,
      managerId: row.googleAdsManagerId,
      campaignId: null,
      campaignName: body.spec.name,
      title: `PAUSED Search kampanya taslagi — ${body.spec.name}`,
      source: "manual",
      payload,
      createdBy: body.createdBy?.trim() || "system",
    });
    const [created] = await db
      .select()
      .from(googleAdsChangeSets)
      .where(eq(googleAdsChangeSets.uuid, uuid))
      .limit(1);
    return reply.send({ ok: true, item: created });
  });

  app.post("/google-ads/search-rsa-drafts", async (req, reply) => {
    const body = req.body as {
      tenantKey?: string;
      campaignId?: string | null;
      campaignName?: string | null;
      adGroupResourceName?: string | null;
      adGroupId?: string | null;
      adGroupName?: string | null;
      finalUrl?: string | null;
      goal?: string | null;
      context?: string | null;
      headlines?: string[];
      descriptions?: string[];
      createdBy?: string;
    };
    const tenantKey = tenantKeyFrom(body.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const cid = row.googleAdsCustomerId?.trim();
    if (!cid) return reply.status(400).send({ error: "Google Ads musteri ID tanimli degil" });

    const cidDigits = cid.replace(/[^0-9]/g, ""); // resource name tiresiz olmali
    const adGroupResourceName =
      body.adGroupResourceName?.trim() ||
      (body.adGroupId?.trim() ? `customers/${cidDigits}/adGroups/${body.adGroupId.trim()}` : "");
    if (!adGroupResourceName) return reply.status(400).send({ error: "adGroupResourceName veya adGroupId zorunlu" });

    const finalUrl = (body.finalUrl?.trim() || row.websiteUrl?.trim() || "").trim();
    if (!finalUrl) return reply.status(400).send({ error: "finalUrl bulunamadi (tenant website_url tanimli degil)" });

    // Metin: gonderilen manuel headlines/descriptions varsa onu kullan; yoksa AI ile uret.
    let headlines = (body.headlines || []).map((s) => String(s).trim()).filter(Boolean);
    let descriptions = (body.descriptions || []).map((s) => String(s).trim()).filter(Boolean);
    let copyMeta = "manuel";
    if (headlines.length < 3 || descriptions.length < 2) {
      try {
        const copy = await generateGoogleAdsRsaCopy({
          tenantKey,
          goal: body.goal,
          context: body.context || body.campaignName || body.adGroupName,
        });
        headlines = [...(copy.headlines || []), ...(copy.longHeadlines || [])];
        descriptions = copy.descriptions || [];
        copyMeta = `${copy.provider}/${copy.model}`;
      } catch (err) {
        return reply.status(400).send({ error: `AI metin üretilemedi (${(err as Error).message}). Manuel headlines (≥3) + descriptions (≥2) gönderin.` });
      }
    }

    let payload;
    try {
      payload = buildSearchRsaCreatePayload({
        customerId: cid,
        adGroupResourceName,
        finalUrl,
        headlines,
        descriptions,
        notes: `Search RSA taslagi (${copyMeta}). PAUSED olarak eklenir; canli uygulama validate + kullanici onayi gerektirir.`,
      });
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }

    const local = validateChangeSetPayload(payload);
    if (!local.ok) return reply.status(400).send({ ok: false, validation: local });

    const uuid = randomUUID();
    await db.insert(googleAdsChangeSets).values({
      uuid,
      tenantKey,
      customerId: cid,
      managerId: row.googleAdsManagerId,
      campaignId: body.campaignId ?? null,
      campaignName: body.campaignName ?? null,
      title: `Search RSA taslagi${body.adGroupName ? ` — ${body.adGroupName}` : ""}`,
      source: copyMeta === "manuel" ? "manual" : "ai",
      payload,
      createdBy: body.createdBy?.trim() || (copyMeta === "manuel" ? "system" : "ai"),
    });
    const [created] = await db
      .select()
      .from(googleAdsChangeSets)
      .where(eq(googleAdsChangeSets.uuid, uuid))
      .limit(1);
    return reply.send({ ok: true, item: created, source: copyMeta });
  });

  app.post("/google-ads/automation-drafts", async (req, reply) => {
    const body = req.body as { tenantKey?: string; createdBy?: string };
    const tenantKey = tenantKeyFrom(body.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const cid = row.googleAdsCustomerId?.trim();
    if (!cid) return reply.status(400).send({ error: "Google Ads musteri ID tanimli degil" });

    const [audit, keywords] = await Promise.all([
      fetchGoogleAdsAudit(tenantKey, cid, row.googleAdsManagerId, adsCampaignFilter(row)),
      fetchGoogleAdsKeywords(tenantKey, cid, row.googleAdsManagerId, adsCampaignFilter(row)).catch(() => []),
    ]);
    const campaignCandidates = (audit.campaigns as Array<Record<string, any>>).filter((campaign) => {
      const score = Number(campaign.optimizationScore ?? 1);
      const cost = Number(campaign.metrics?.costMicros ?? 0);
      const conversions = Number(campaign.metrics?.conversions ?? 0);
      return (Number.isFinite(score) && score > 0 && score < 0.7) || (cost > 0 && conversions === 0);
    });
    const keywordCandidates = (keywords as Array<Record<string, any>>).filter((keyword) => {
      const score = Number(keyword.qualityScore ?? 10);
      const cost = Number(keyword.metrics?.costMicros ?? 0);
      const conversions = Number(keyword.metrics?.conversions ?? 0);
      return (Number.isFinite(score) && score > 0 && score <= 3) || (cost > 0 && conversions === 0);
    });

    if (campaignCandidates.length === 0 && keywordCandidates.length === 0) {
      return reply.send({ ok: true, created: false, message: "Otomasyon taslagi gerektiren dusuk skor/butce anomalisi bulunamadi." });
    }

    const primaryCampaign = campaignCandidates[0];
    const primaryKeyword = keywordCandidates[0];
    const existingAdvisory = await db
      .select()
      .from(googleAdsChangeSets)
      .where(eq(googleAdsChangeSets.tenantKey, tenantKey))
      .orderBy(desc(googleAdsChangeSets.createdAt))
      .limit(30);
    const duplicate = existingAdvisory.find((item) => {
      const payload = item.payload as { kind?: string; operations?: unknown[] } | null;
      return (
        item.source === "automation" &&
        item.status !== "applied" &&
        item.status !== "cancelled" &&
        payload?.kind === "campaign_update" &&
        (!Array.isArray(payload.operations) || payload.operations.length === 0)
      );
    });
    if (duplicate) {
      return reply.send({
        ok: true,
        created: false,
        item: duplicate,
        message: "Ayni tenant icin acik audit/advisory taslagi zaten var; yeni kopya olusturulmadi.",
      });
    }

    const uuid = randomUUID();
    await db.insert(googleAdsChangeSets).values({
      uuid,
      tenantKey,
      customerId: cid,
      managerId: row.googleAdsManagerId,
      campaignId: primaryCampaign?.id ? String(primaryCampaign.id) : primaryKeyword?.campaignId ? String(primaryKeyword.campaignId) : null,
      campaignName: primaryCampaign?.name ? String(primaryCampaign.name) : primaryKeyword?.campaignName ? String(primaryKeyword.campaignName) : null,
      title: "Google Ads otomasyon audit taslagi",
      source: "automation",
      payload: {
        kind: "campaign_update",
        notes: "Dusuk optimizasyon skoru, dusuk keyword kalite skoru veya butce anomalisi tespit edildi. Bu taslak otomatik olusturuldu; canli uygulama kullanici onayi gerektirir.",
        manualSteps: [
          ...campaignCandidates.slice(0, 5).map((campaign) => `Kampanya kontrolu: ${campaign.name ?? campaign.id} — score=${campaign.optimizationScore ?? "-"}, costMicros=${campaign.metrics?.costMicros ?? 0}, conversions=${campaign.metrics?.conversions ?? 0}`),
          ...keywordCandidates.slice(0, 5).map((keyword) => `Keyword kontrolu: ${keyword.text ?? keyword.resourceName} — quality=${keyword.qualityScore ?? "-"}, costMicros=${keyword.metrics?.costMicros ?? 0}, conversions=${keyword.metrics?.conversions ?? 0}`),
        ],
        operations: [],
      },
      createdBy: body.createdBy?.trim() || "system",
    });
    const [created] = await db
      .select()
      .from(googleAdsChangeSets)
      .where(eq(googleAdsChangeSets.uuid, uuid))
      .limit(1);
    return reply.send({ ok: true, created: true, item: created, campaignCandidates, keywordCandidates });
  });

  app.get("/google-ads/change-sets", async (req, reply) => {
    const tenantKey = tenantKeyFrom((req.query as { tenantKey?: string })?.tenantKey);
    const items = await db
      .select()
      .from(googleAdsChangeSets)
      .where(eq(googleAdsChangeSets.tenantKey, tenantKey))
      .orderBy(desc(googleAdsChangeSets.createdAt))
      .limit(50);
    return reply.send({ items });
  });

  app.post("/google-ads/change-sets", async (req, reply) => {
    const body = req.body as {
      tenantKey?: string;
      title?: string;
      campaignId?: string | null;
      campaignName?: string | null;
      payload?: GoogleAdsChangeSetPayload;
      source?: string;
      createdBy?: string;
    };
    const tenantKey = tenantKeyFrom(body.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const cid = row.googleAdsCustomerId?.trim();
    if (!cid) return reply.status(400).send({ error: "Google Ads musteri ID tanimli degil" });
    if (!body.payload) return reply.status(400).send({ error: "payload zorunlu" });

    const uuid = randomUUID();
    await db.insert(googleAdsChangeSets).values({
      uuid,
      tenantKey,
      customerId: cid,
      managerId: row.googleAdsManagerId,
      campaignId: body.campaignId ?? null,
      campaignName: body.campaignName ?? null,
      title: body.title?.trim() || "Google Ads degisiklik taslagi",
      source: body.source?.trim() || "manual",
      payload: body.payload,
      createdBy: body.createdBy?.trim() || "system",
    });
    const [created] = await db
      .select()
      .from(googleAdsChangeSets)
      .where(eq(googleAdsChangeSets.uuid, uuid))
      .limit(1);
    return reply.send({ ok: true, item: created });
  });

  app.post("/google-ads/vistaseeds-plan", async (req, reply) => {
    const body = req.body as {
      tenantKey?: string;
      campaignId?: string | null;
      assetGroupResourceName?: string | null;
      createdBy?: string;
    };
    const tenantKey = tenantKeyFrom(body.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const cid = row.googleAdsCustomerId?.trim();
    if (!cid) return reply.status(400).send({ error: "Google Ads musteri ID tanimli degil" });

    let campaignId = body.campaignId?.trim() || "";
    let campaignName: string | null = null;
    let campaignResourceName: string | null = null;
    let assetGroupResourceName = body.assetGroupResourceName?.trim() || "";

    try {
      const audit = await fetchGoogleAdsAudit(tenantKey, cid, row.googleAdsManagerId, adsCampaignFilter(row));
      const candidates = audit.campaigns as Array<Record<string, unknown>>;
      const selected =
        candidates.find((c) => campaignId && String(c.id) === campaignId) ??
        candidates.find((c) => String(c.name ?? "").toLowerCase().includes("vista")) ??
        candidates.find((c) => c.channelType === "PERFORMANCE_MAX") ??
        candidates[0];

      if (selected) {
        campaignId = String(selected.id ?? campaignId);
        campaignName = selected.name ? String(selected.name) : null;
        campaignResourceName = selected.resourceName ? String(selected.resourceName) : null;
        const assetGroups = Array.isArray(selected.assetGroups) ? selected.assetGroups : [];
        const firstAssetGroup = assetGroups[0] as Record<string, unknown> | undefined;
        assetGroupResourceName ||= firstAssetGroup?.resourceName ? String(firstAssetGroup.resourceName) : "";
      }
    } catch {
      // Plan yine de olusturulabilir; yalnizca API operasyonlari asset group olmadan pasif kalir.
    }

    const plan = buildVistaSeedsPmaxPlan({
      customerId: cid,
      campaignResourceName,
      campaignName,
      assetGroupResourceName: assetGroupResourceName || null,
    });
    const uuid = randomUUID();
    await db.insert(googleAdsChangeSets).values({
      uuid,
      tenantKey,
      customerId: cid,
      managerId: row.googleAdsManagerId,
      campaignId: campaignId || null,
      campaignName,
      title: plan.title,
      source: "vistaseeds_pmax_audit",
      payload: plan.payload,
      createdBy: body.createdBy?.trim() || "system",
    });
    const [created] = await db
      .select()
      .from(googleAdsChangeSets)
      .where(eq(googleAdsChangeSets.uuid, uuid))
      .limit(1);
    return reply.send({ ok: true, item: created });
  });

  app.post("/google-ads/change-sets/:uuid/validate", async (req, reply) => {
    const { uuid } = req.params as { uuid: string };
    const [item] = await db
      .select()
      .from(googleAdsChangeSets)
      .where(eq(googleAdsChangeSets.uuid, uuid))
      .limit(1);
    if (!item) return reply.status(404).send({ error: "Degisiklik taslagi bulunamadi" });

    const payload = item.payload as GoogleAdsChangeSetPayload;
    const local = validateChangeSetPayload(payload);
    if (!local.ok) {
      await db
        .update(googleAdsChangeSets)
        .set({ status: "validation_failed", validationResult: local })
        .where(eq(googleAdsChangeSets.id, item.id));
      return reply.status(400).send({ ok: false, validation: local });
    }

    // Advisory/operasyonsuz taslak (eski audit kind'lari, or. "campaign_update"): mutate etme.
    // Bos operations ile Google Ads validateOnly anlamsiz API hatasi verir -> net mesaj don.
    if (!payload.operations?.length) {
      const advisory = {
        ok: false,
        advisory: true,
        error:
          "Bu taslak yalnizca audit/tavsiye notudur; uygulanabilir Google Ads operasyonu icermez. Kampanya yonetimi icin tablodan Duraklat/Butce/Bidding kullanin.",
      };
      await db
        .update(googleAdsChangeSets)
        .set({ status: "validation_failed", validationResult: advisory })
        .where(eq(googleAdsChangeSets.id, item.id));
      return reply.status(400).send(advisory);
    }

    try {
      const result = await mutateGoogleAds(
        item.tenantKey,
        item.customerId,
        item.managerId,
        payload.operations ?? [],
        true
      );
      await db
        .update(googleAdsChangeSets)
        .set({ status: "validated", validationResult: { ok: true, result } })
        .where(eq(googleAdsChangeSets.id, item.id));
      return reply.send({ ok: true, result });
    } catch (err) {
      const result = { ok: false, error: (err as Error).message };
      await db
        .update(googleAdsChangeSets)
        .set({ status: "validation_failed", validationResult: result })
        .where(eq(googleAdsChangeSets.id, item.id));
      return reply.status(400).send(result);
    }
  });

  app.post("/google-ads/change-sets/:uuid/apply", async (req, reply) => {
    const { uuid } = req.params as { uuid: string };
    const body = req.body as { confirmApply?: boolean };
    if (body.confirmApply !== true) {
      return reply.status(400).send({ error: "Canli Google Ads degisikligi icin confirmApply=true zorunlu" });
    }
    const [item] = await db
      .select()
      .from(googleAdsChangeSets)
      .where(eq(googleAdsChangeSets.uuid, uuid))
      .limit(1);
    if (!item) return reply.status(404).send({ error: "Degisiklik taslagi bulunamadi" });
    if (item.status !== "validated") {
      return reply.status(400).send({ error: "Once validate endpoint'i ile taslagi dogrulayin" });
    }

    const payload = item.payload as GoogleAdsChangeSetPayload;
    try {
      const result = await mutateGoogleAds(
        item.tenantKey,
        item.customerId,
        item.managerId,
        payload.operations ?? [],
        false
      );
      await db
        .update(googleAdsChangeSets)
        .set({ status: "applied", appliedResult: { ok: true, result } })
        .where(eq(googleAdsChangeSets.id, item.id));
      return reply.send({ ok: true, result });
    } catch (err) {
      const result = { ok: false, error: (err as Error).message };
      await db
        .update(googleAdsChangeSets)
        .set({ status: "failed", appliedResult: result })
        .where(eq(googleAdsChangeSets.id, item.id));
      return reply.status(400).send(result);
    }
  });

  app.get("/google-ads-links", async (req, reply) => {
    const tenantKey = tenantKeyFrom((req.query as { tenantKey?: string })?.tenantKey);
    const row = await getProject(tenantKey);
    if (!row) return reply.status(404).send({ error: "Tenant bulunamadi" });
    const uiBase = "https://ads.google.com/aw";
    const links = {
      overview: `${uiBase}/overview`,
      campaigns: `${uiBase}/campaigns`,
      googleAdsHome: "https://ads.google.com/",
    };
    const sc = row.searchConsoleSiteUrl?.trim();
    return reply.send({
      tenantKey,
      customerId: row.googleAdsCustomerId,
      managerId: row.googleAdsManagerId,
      links,
      searchConsoleUiUrl: sc
        ? `https://search.google.com/search-console?resource_id=${encodeURIComponent(sc)}`
        : "https://search.google.com/search-console",
      note:
        "Kampanya API icin Google Ads developer token + OAuth gerekir. Musteri ID panelde referans; arayuze genel baglantilar.",
    });
  });

  app.get("/:platform/change-sets", async (req, reply) => {
    const { platform } = req.params as { platform: string };
    const parsedPlatform = parseMarketingPlatform(platform);
    const query = req.query as { tenantKey?: string; status?: string };
    const tenantKey = tenantKeyFrom(query.tenantKey);
    const items = await listChangeSets(tenantKey, parsedPlatform, query.status);
    return reply.send({ items });
  });

  app.post("/:platform/change-sets", async (req, reply) => {
    const { platform } = req.params as { platform: string };
    const parsedPlatform = parseMarketingPlatform(platform);
    const body = req.body as {
      tenantKey?: string;
      targetRef?: string | null;
      title?: string;
      description?: string | null;
      payload?: unknown;
      source?: string;
      createdBy?: string;
    };
    const tenantKey = tenantKeyFrom(body.tenantKey);
    const item = await createChangeSet(tenantKey, parsedPlatform, body);
    return reply.send({ ok: true, item });
  });

  app.post("/:platform/change-sets/:uuid/validate", async (req, reply) => {
    const { platform, uuid } = req.params as { platform: string; uuid: string };
    parseMarketingPlatform(platform);
    try {
      const result = await validateChangeSet(uuid);
      return reply.status(result.ok ? 200 : 400).send(result);
    } catch (err) {
      return reply.status(400).send({ ok: false, error: (err as Error).message });
    }
  });

  app.post("/:platform/change-sets/:uuid/apply", async (req, reply) => {
    const { platform, uuid } = req.params as { platform: string; uuid: string };
    parseMarketingPlatform(platform);
    const body = req.body as { confirmApply?: boolean };
    try {
      const result = await applyChangeSet(uuid, body.confirmApply === true);
      return reply.status(result.ok ? 200 : 400).send(result);
    } catch (err) {
      return reply.status(400).send({ ok: false, error: (err as Error).message });
    }
  });
}
