import { google } from "googleapis";
import { createHash, randomUUID } from "crypto";
import { buildMarketingOAuthClient, createMarketingJwt } from "./google-sa";
import { pool } from "../../db/client";
import type { MarketingChangeSet, PlatformChangeHandler } from "./types";

function rowsOf(result: unknown) {
  return ((result as { data?: { rows?: unknown[] } })?.data?.rows ?? []) as unknown[];
}

async function optionalReport<T>(task: Promise<T>) {
  try {
    return { ok: true, data: await task };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

function numericValue(row: Record<string, unknown>, key: string) {
  const value = Number(row[key] ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function buildCtrOpportunities(rows: unknown[]) {
  return rows
    .map((row) => row as Record<string, unknown>)
    .filter((row) => numericValue(row, "impressions") >= 100 && numericValue(row, "position") <= 20)
    .filter((row) => numericValue(row, "ctr") < 0.03)
    .sort((a, b) => numericValue(b, "impressions") - numericValue(a, "impressions"))
    .slice(0, 12);
}

function dateRange(range: number, offset = 0) {
  const safeRange = [7, 28, 90].includes(range) ? range : 28;
  const end = new Date();
  end.setDate(end.getDate() - 3 - offset);
  const start = new Date(end);
  start.setDate(end.getDate() - safeRange + 1);
  return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10), range: safeRange };
}

async function buildGscClient(tenantKey: string) {
  const auth = (await createMarketingJwt(tenantKey)) ?? (await buildMarketingOAuthClient(tenantKey, "gsc"));
  if (!auth) {
    throw new Error(
      "GSC kimligi yok: service_account_json veya gsc.oauth_refresh_token (+ google OAuth client) tanimlayin.",
    );
  }
  return google.webmasters({ version: "v3", auth });
}

type GscChangePayload = {
  action?: "sitemap_submit" | "sitemap_delete" | "indexing_request";
  siteUrl?: string;
  url?: string;
};

function gscPayload(changeSet: MarketingChangeSet): GscChangePayload {
  const payload = changeSet.payload as GscChangePayload | null;
  if (!payload || typeof payload !== "object") throw new Error("payload object zorunlu");
  if (!payload.siteUrl?.trim()) throw new Error("GSC siteUrl zorunlu");
  if (!payload.url?.trim()) throw new Error("GSC sitemap/url zorunlu");
  return payload;
}

function assertSitemapAction(payload: GscChangePayload) {
  if (payload.action !== "sitemap_submit" && payload.action !== "sitemap_delete") {
    throw new Error("GSC apply yalniz sitemap_submit ve sitemap_delete icin aktif");
  }
}

export const gscChangeHandler: PlatformChangeHandler = {
  async validate(_tenantKey, changeSet) {
    try {
      const payload = gscPayload(changeSet);
      assertSitemapAction(payload);
      return {
        ok: true,
        result: {
          action: payload.action,
          siteUrl: payload.siteUrl,
          url: payload.url,
          api:
            payload.action === "sitemap_delete"
              ? "webmasters.sitemaps.delete"
              : "webmasters.sitemaps.submit",
          message: "GSC sitemap change-set dogrulandi; apply canli Search Console sitemap durumunu degistirir.",
        },
      };
    } catch (err) {
      return { ok: false, result: { error: (err as Error).message } };
    }
  },
  async apply(tenantKey, changeSet) {
    try {
      const payload = gscPayload(changeSet);
      assertSitemapAction(payload);
      const webmasters = await buildGscClient(tenantKey);
      if (payload.action === "sitemap_delete") {
        await webmasters.sitemaps.delete({ siteUrl: payload.siteUrl!, feedpath: payload.url! });
      } else {
        await webmasters.sitemaps.submit({ siteUrl: payload.siteUrl!, feedpath: payload.url! });
      }
      return {
        ok: true,
        result: {
          action: payload.action,
          siteUrl: payload.siteUrl,
          url: payload.url,
          appliedAt: new Date().toISOString(),
        },
      };
    } catch (err) {
      return { ok: false, result: { error: (err as Error).message } };
    }
  },
};

async function buildSearchConsoleClient(tenantKey: string) {
  const auth = (await createMarketingJwt(tenantKey)) ?? (await buildMarketingOAuthClient(tenantKey, "gsc"));
  if (!auth) {
    throw new Error(
      "GSC kimligi yok: service_account_json veya gsc.oauth_refresh_token (+ google OAuth client) tanimlayin.",
    );
  }
  return google.searchconsole({ version: "v1", auth });
}

function totals(rows: unknown[]) {
  const total = rows.reduce<{ clicks: number; impressions: number; positionWeighted: number }>(
    (acc, row) => {
      const r = row as Record<string, unknown>;
      acc.clicks += numericValue(r, "clicks");
      acc.impressions += numericValue(r, "impressions");
      acc.positionWeighted += numericValue(r, "position") * numericValue(r, "impressions");
      return acc;
    },
    { clicks: 0, impressions: 0, positionWeighted: 0 },
  );
  const ctr = total.impressions > 0 ? total.clicks / total.impressions : 0;
  const position = total.impressions > 0 ? total.positionWeighted / total.impressions : 0;
  return { clicks: total.clicks, impressions: total.impressions, ctr, position };
}

function delta(current: number, previous: number) {
  return previous > 0 ? ((current - previous) / previous) * 100 : null;
}

export async function queryGsc(
  tenantKey: string,
  siteUrl: string,
  requestBody: Record<string, unknown>
) {
  const webmasters = await buildGscClient(tenantKey);
  const res = await webmasters.searchanalytics.query({ siteUrl, requestBody });
  return res.data.rows ?? [];
}

export async function fetchGscAnalytics(tenantKey: string, siteUrl: string, range = 28, searchType = "web") {
  const webmasters = await buildGscClient(tenantKey);
  const currentRange = dateRange(range);
  const previousRange = dateRange(range, currentRange.range);
  const base = {
    type: searchType,
    rowLimit: 250,
  };
  const [currentRows, previousRows, dates, devices, countries] = await Promise.all([
    webmasters.searchanalytics.query({
      siteUrl,
      requestBody: { ...base, startDate: currentRange.startDate, endDate: currentRange.endDate, dimensions: ["query"] },
    }),
    webmasters.searchanalytics.query({
      siteUrl,
      requestBody: { ...base, startDate: previousRange.startDate, endDate: previousRange.endDate, dimensions: ["query"] },
    }),
    webmasters.searchanalytics.query({
      siteUrl,
      requestBody: { ...base, startDate: currentRange.startDate, endDate: currentRange.endDate, dimensions: ["date"], rowLimit: 500 },
    }),
    webmasters.searchanalytics.query({
      siteUrl,
      requestBody: { ...base, startDate: currentRange.startDate, endDate: currentRange.endDate, dimensions: ["device"], rowLimit: 10 },
    }),
    webmasters.searchanalytics.query({
      siteUrl,
      requestBody: { ...base, startDate: currentRange.startDate, endDate: currentRange.endDate, dimensions: ["country"], rowLimit: 25 },
    }),
  ]);
  const currentTotals = totals(currentRows.data.rows ?? []);
  const previousTotals = totals(previousRows.data.rows ?? []);
  return {
    siteUrl,
    range: currentRange,
    type: searchType,
    totals: {
      current: currentTotals,
      previous: previousTotals,
      deltaPct: {
        clicks: delta(currentTotals.clicks, previousTotals.clicks),
        impressions: delta(currentTotals.impressions, previousTotals.impressions),
        ctr: delta(currentTotals.ctr, previousTotals.ctr),
        position: delta(currentTotals.position, previousTotals.position),
      },
    },
    dateRows: dates.data.rows ?? [],
    deviceRows: devices.data.rows ?? [],
    countryRows: countries.data.rows ?? [],
  };
}

export async function fetchGscPageQueries(tenantKey: string, siteUrl: string, page: string, range = 28) {
  const currentRange = dateRange(range);
  return queryGsc(tenantKey, siteUrl, {
    startDate: currentRange.startDate,
    endDate: currentRange.endDate,
    dimensions: ["query"],
    dimensionFilterGroups: [
      {
        filters: [{ dimension: "page", operator: "equals", expression: page }],
      },
    ],
    rowLimit: 50,
  });
}

export async function listGscSites(tenantKey: string) {
  const webmasters = await buildGscClient(tenantKey);
  const res = await webmasters.sites.list();
  return res.data.siteEntry ?? [];
}

function normalizeUrl(input: string) {
  try {
    const url = new URL(input.trim());
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

function urlsFromSitemapXml(xml: string) {
  const urls = new Set<string>();
  for (const match of xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)) {
    const value = normalizeUrl(match[1] ?? "");
    if (value) urls.add(value);
  }
  return [...urls];
}

function defaultSitemapUrl(siteUrl: string, websiteUrl?: string | null) {
  const base = siteUrl.startsWith("http") ? siteUrl : websiteUrl;
  if (!base) return null;
  try {
    return new URL("/sitemap.xml", base).toString();
  } catch {
    return null;
  }
}

async function fetchSitemapUrls(sitemapUrl: string) {
  try {
    const res = await fetch(sitemapUrl);
    if (!res.ok) return [];
    const xml = await res.text();
    return urlsFromSitemapXml(xml);
  } catch {
    return [];
  }
}

async function ensureGscUrlIndexTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`gsc_url_index\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`uuid\` char(36) NOT NULL,
      \`tenant_key\` varchar(100) NOT NULL,
      \`url\` varchar(1000) NOT NULL,
      \`url_hash\` char(64) NOT NULL,
      \`verdict\` varchar(64),
      \`coverage_state\` varchar(255),
      \`last_crawl_time\` datetime(3),
      \`robots_txt_state\` varchar(64),
      \`indexing_state\` varchar(64),
      \`page_fetch_state\` varchar(64),
      \`google_canonical\` varchar(1000),
      \`user_canonical\` varchar(1000),
      \`status_text\` varchar(255),
      \`recommendation\` text,
      \`raw_result\` json,
      \`checked_at\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`created_at\` datetime(3) DEFAULT CURRENT_TIMESTAMP(3),
      \`updated_at\` datetime(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY(\`id\`),
      UNIQUE KEY \`gsc_url_index_uuid_unique\` (\`uuid\`),
      UNIQUE KEY \`uk_gsc_url_index_tenant_url_hash\` (\`tenant_key\`, \`url_hash\`)
    ) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  try {
    await pool.query("ALTER TABLE `gsc_url_index` ADD COLUMN `url_hash` char(64) NULL AFTER `url`");
    await pool.query("UPDATE `gsc_url_index` SET `url_hash` = SHA2(`url`, 256) WHERE `url_hash` IS NULL OR `url_hash` = ''");
    await pool.query("ALTER TABLE `gsc_url_index` MODIFY COLUMN `url_hash` char(64) NOT NULL");
  } catch {}
  try {
    await pool.query("CREATE UNIQUE INDEX `uk_gsc_url_index_tenant_url_hash` ON `gsc_url_index` (`tenant_key`, `url_hash`)");
  } catch {}
  try {
    await pool.query("CREATE INDEX `idx_gsc_url_index_tenant` ON `gsc_url_index` (`tenant_key`)");
  } catch {}
  try {
    await pool.query("CREATE INDEX `idx_gsc_url_index_verdict` ON `gsc_url_index` (`tenant_key`, `verdict`)");
  } catch {}
  try {
    await pool.query("CREATE INDEX `idx_gsc_url_index_checked` ON `gsc_url_index` (`checked_at`)");
  } catch {}
}

function hashGscUrl(url: string) {
  return createHash("sha256").update(url).digest("hex");
}

async function existingIndexedUrls(tenantKey: string) {
  await ensureGscUrlIndexTable();
  const [rows] = (await pool.query(
    "SELECT `url` FROM `gsc_url_index` WHERE `tenant_key` = ? ORDER BY `checked_at` DESC LIMIT 500",
    [tenantKey],
  )) as any;
  return (rows as Array<{ url?: string }>).map((row) => row.url).filter((url): url is string => Boolean(url));
}

export async function collectGscUrls(tenantKey: string, siteUrl: string, websiteUrl?: string | null, limit = 500) {
  const webmasters = await buildGscClient(tenantKey);
  const urls = new Set<string>();
  const sitemaps = await optionalReport(webmasters.sitemaps.list({ siteUrl }));
  const sitemapEntries = sitemaps.ok
    ? ((sitemaps.data as { data?: { sitemap?: Array<{ path?: string | null }> } }).data?.sitemap ?? [])
    : [];
  const sitemapUrls = sitemapEntries.map((row) => row.path).filter((value): value is string => Boolean(value));
  const fallbackSitemap = defaultSitemapUrl(siteUrl, websiteUrl);
  if (fallbackSitemap && sitemapUrls.length === 0) sitemapUrls.push(fallbackSitemap);

  for (const sitemapUrl of sitemapUrls.slice(0, 20)) {
    for (const url of await fetchSitemapUrls(sitemapUrl)) {
      urls.add(url);
      if (urls.size >= limit) break;
    }
    if (urls.size >= limit) break;
  }

  for (const url of await existingIndexedUrls(tenantKey)) {
    urls.add(url);
    if (urls.size >= limit) break;
  }

  return {
    urls: [...urls].slice(0, limit),
    sitemaps: sitemapUrls,
    sitemapError: sitemaps.ok ? null : sitemaps.error,
  };
}

function indexCategory(verdict?: string | null, coverageState?: string | null) {
  const joined = `${verdict ?? ""} ${coverageState ?? ""}`.toLowerCase();
  if (verdict === "PASS") return "indexed";
  if (joined.includes("indexed")) return "indexed";
  if (joined.includes("duplicate") || joined.includes("noindex") || joined.includes("soft 404")) return "issue";
  if (joined.includes("not") || joined.includes("discovered") || joined.includes("crawled")) return "not_indexed";
  return "unknown";
}

function statusForInspection(indexStatus: Record<string, any>) {
  const verdict = indexStatus?.verdict ?? null;
  const coverageState = indexStatus?.coverageState ?? null;
  const category = indexCategory(verdict, coverageState);
  if (category === "indexed") {
    return { statusText: "Dizinde", recommendation: "Ek aksiyon gerekmiyor; sayfa Google dizininde gorunuyor." };
  }
  const state = String(coverageState ?? "").toLowerCase();
  if (state.includes("duplicate")) {
    return { statusText: "Kopya", recommendation: "Canonical URL ve yinelenen icerik sinyallerini kontrol edin." };
  }
  if (state.includes("noindex")) {
    return { statusText: "Noindex", recommendation: "Indexlenmesi isteniyorsa robots meta/header noindex ayarini kaldirin." };
  }
  if (state.includes("soft 404")) {
    return { statusText: "Soft 404", recommendation: "Sayfanin gercek icerik, baslik ve HTTP durumunu kontrol edin." };
  }
  if (state.includes("redirect")) {
    return { statusText: "Redirect", recommendation: "Hedef canonical ve sitemap URL'lerinin final URL ile uyumunu kontrol edin." };
  }
  if (state.includes("discovered")) {
    return { statusText: "Kesfedildi", recommendation: "Ic link ve sitemap sinyallerini guclendirin; yeniden tarama istegi dusunulebilir." };
  }
  if (state.includes("crawled")) {
    return { statusText: "Tarandi", recommendation: "Indexlenmeme nedeni icin canonical, kalite ve robots sinyallerini kontrol edin." };
  }
  return { statusText: verdict ?? "Bilinmiyor", recommendation: "URL Inspection detaylarini kontrol edin." };
}

async function persistInspection(tenantKey: string, url: string, inspection: Record<string, any>) {
  await ensureGscUrlIndexTable();
  const indexStatus = inspection?.inspectionResult?.indexStatusResult ?? {};
  const { statusText, recommendation } = statusForInspection(indexStatus);
  const lastCrawl = indexStatus?.lastCrawlTime ? new Date(indexStatus.lastCrawlTime) : null;
  await pool.query(
    `
      INSERT INTO \`gsc_url_index\`
      (
        \`uuid\`, \`tenant_key\`, \`url\`, \`url_hash\`, \`verdict\`, \`coverage_state\`, \`last_crawl_time\`,
        \`robots_txt_state\`, \`indexing_state\`, \`page_fetch_state\`, \`google_canonical\`,
        \`user_canonical\`, \`status_text\`, \`recommendation\`, \`raw_result\`, \`checked_at\`
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON), CURRENT_TIMESTAMP(3))
      ON DUPLICATE KEY UPDATE
        \`url\` = VALUES(\`url\`),
        \`verdict\` = VALUES(\`verdict\`),
        \`coverage_state\` = VALUES(\`coverage_state\`),
        \`last_crawl_time\` = VALUES(\`last_crawl_time\`),
        \`robots_txt_state\` = VALUES(\`robots_txt_state\`),
        \`indexing_state\` = VALUES(\`indexing_state\`),
        \`page_fetch_state\` = VALUES(\`page_fetch_state\`),
        \`google_canonical\` = VALUES(\`google_canonical\`),
        \`user_canonical\` = VALUES(\`user_canonical\`),
        \`status_text\` = VALUES(\`status_text\`),
        \`recommendation\` = VALUES(\`recommendation\`),
        \`raw_result\` = VALUES(\`raw_result\`),
        \`checked_at\` = CURRENT_TIMESTAMP(3)
    `,
    [
      randomUUID(),
      tenantKey,
      url,
      hashGscUrl(url),
      indexStatus?.verdict ?? null,
      indexStatus?.coverageState ?? null,
      lastCrawl,
      indexStatus?.robotsTxtState ?? null,
      indexStatus?.indexingState ?? null,
      indexStatus?.pageFetchState ?? null,
      indexStatus?.googleCanonical ?? null,
      indexStatus?.userCanonical ?? null,
      statusText,
      recommendation,
      JSON.stringify(inspection),
    ],
  );
}

// Cift-indirme onleme: bazi tenant'lar (orn. haldefiyat) GSC'yi BASKA bir
// servis indiriyor; biz GSC'ye gitmek yerine o servisin export'undan okuruz.
// Config: env GSC_MIRROR_SOURCES = {"haldefiyat":{"url":"https://haldefiyat.com/api/v1/gsc/export","token":"..."}}
function gscMirrorSource(tenantKey: string): { url: string; token: string } | null {
  try {
    const raw = process.env.GSC_MIRROR_SOURCES;
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, { url?: string; token?: string }>;
    const c = map[tenantKey];
    return c?.url && c?.token ? { url: c.url, token: c.token } : null;
  } catch {
    return null;
  }
}

async function persistMirror(
  tenantKey: string,
  item: { url: string; verdict?: string | null; coverageState?: string | null; lastCrawl?: string | null; category?: string; label?: string },
) {
  const lastCrawl = item.lastCrawl ? new Date(item.lastCrawl) : null;
  await pool.query(
    `
      INSERT INTO \`gsc_url_index\`
      (\`uuid\`, \`tenant_key\`, \`url\`, \`url_hash\`, \`verdict\`, \`coverage_state\`, \`last_crawl_time\`,
       \`status_text\`, \`recommendation\`, \`raw_result\`, \`checked_at\`)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS JSON), CURRENT_TIMESTAMP(3))
      ON DUPLICATE KEY UPDATE
        \`verdict\` = VALUES(\`verdict\`), \`coverage_state\` = VALUES(\`coverage_state\`),
        \`last_crawl_time\` = VALUES(\`last_crawl_time\`), \`status_text\` = VALUES(\`status_text\`),
        \`recommendation\` = VALUES(\`recommendation\`), \`raw_result\` = VALUES(\`raw_result\`),
        \`checked_at\` = CURRENT_TIMESTAMP(3)
    `,
    [
      randomUUID(),
      tenantKey,
      item.url,
      hashGscUrl(item.url),
      item.verdict ?? null,
      item.coverageState ?? null,
      lastCrawl,
      item.label ?? null,
      `mirror:${item.category ?? "unknown"}`,
      JSON.stringify({ mirrored: true, source: "haldefiyat", ...item }),
    ],
  );
}

// Kaynak servisin export'undan toplu cek + tenant gsc_url_index'e yaz (GSC cagrisi YOK).
export async function mirrorGscIndex(tenantKey: string, source: { url: string; token: string }) {
  await ensureGscUrlIndexTable();
  const sep = source.url.includes("?") ? "&" : "?";
  const res = await fetch(`${source.url}${sep}token=${encodeURIComponent(source.token)}`, {
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`GSC mirror fetch failed: HTTP ${res.status}`);
  const data = (await res.json()) as { items?: Array<Record<string, any>> };
  const items = data.items ?? [];
  for (const it of items) await persistMirror(tenantKey, it as any);
  return { mirrored: true, source: source.url, count: items.length, refreshed: items.length };
}

export async function refreshGscIndex(
  tenantKey: string,
  siteUrl: string,
  opts: { websiteUrl?: string | null; force?: boolean; limit?: number } = {},
) {
  // Tek-indirici tenant'lar: GSC'ye gitme, kaynak servisten mirror'la.
  const mirror = gscMirrorSource(tenantKey);
  if (mirror) {
    const r = await mirrorGscIndex(tenantKey, mirror);
    return { urls: [], sitemaps: [], sitemapError: null, checked: [], ...r };
  }

  await ensureGscUrlIndexTable();
  const limit = Math.min(Math.max(Number(opts.limit ?? 50), 1), 500);
  const collected = await collectGscUrls(tenantKey, siteUrl, opts.websiteUrl, limit);
  const searchconsole = await buildSearchConsoleClient(tenantKey);
  const staleCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const checked: Array<{ url: string; ok: boolean; error?: string }> = [];

  for (const url of collected.urls.slice(0, limit)) {
    if (!opts.force) {
      const [cached] = (await pool.query(
        "SELECT `checked_at` FROM `gsc_url_index` WHERE `tenant_key` = ? AND `url` = ? LIMIT 1",
        [tenantKey, url],
      )) as any;
      if (cached[0]?.checked_at && new Date(cached[0].checked_at) > staleCutoff) {
        checked.push({ url, ok: true });
        continue;
      }
    }
    try {
      const res = await searchconsole.urlInspection.index.inspect({
        requestBody: { inspectionUrl: url, siteUrl },
      } as any);
      await persistInspection(tenantKey, url, res.data as Record<string, any>);
      checked.push({ url, ok: true });
    } catch (err) {
      checked.push({ url, ok: false, error: (err as Error).message });
    }
  }

  return { ...collected, checked, refreshed: checked.filter((row) => row.ok).length };
}

export async function listGscIndexItems(tenantKey: string, limit = 100) {
  await ensureGscUrlIndexTable();
  const [rows] = (await pool.query(
    "SELECT * FROM `gsc_url_index` WHERE `tenant_key` = ? ORDER BY `checked_at` DESC LIMIT ?",
    [tenantKey, Math.min(Math.max(Number(limit), 1), 500)],
  )) as any;
  const items = rows as any[];
  const summary = items.reduce(
    (acc: Record<string, number>, row) => {
      const category = indexCategory(row.verdict, row.coverage_state);
      acc[category] = (acc[category] ?? 0) + 1;
      return acc;
    },
    { indexed: 0, not_indexed: 0, issue: 0, unknown: 0 },
  );
  return { items, summary };
}

export async function fetchGscSearchAnalytics(tenantKey: string, siteUrl: string) {
  // Once service account, yoksa OAuth refresh token (gsc namespace, webmasters scope)
  const webmasters = await buildGscClient(tenantKey);
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 28);
  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);

  const [queries, pages, queryPages, devices, sitemaps] = await Promise.all([
    webmasters.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: startStr,
        endDate: endStr,
        dimensions: ["query"],
        rowLimit: 50,
      },
    }),
    webmasters.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: startStr,
        endDate: endStr,
        dimensions: ["page"],
        rowLimit: 30,
      },
    }),
    webmasters.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: startStr,
        endDate: endStr,
        dimensions: ["query", "page"],
        rowLimit: 100,
      },
    }),
    webmasters.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: startStr,
        endDate: endStr,
        dimensions: ["device"],
        rowLimit: 10,
      },
    }),
    optionalReport(webmasters.sitemaps.list({ siteUrl })),
  ]);

  const topQueries = queries.data.rows ?? [];
  const topPages = pages.data.rows ?? [];
  const queryPageRows = queryPages.data.rows ?? [];

  return {
    dateRange: { start: startStr, end: endStr },
    topQueries,
    topPages,
    queryPageRows,
    deviceRows: devices.data.rows ?? [],
    ctrOpportunities: buildCtrOpportunities([...topQueries, ...queryPageRows]),
    coverage: {
      sitemaps: sitemaps.ok ? ((sitemaps.data as { data?: { sitemap?: unknown[] } }).data?.sitemap ?? []) : [],
      sitemapError: sitemaps.ok ? null : sitemaps.error,
    },
  };
}
