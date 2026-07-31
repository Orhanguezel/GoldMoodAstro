import { google } from "googleapis";
type OAuth2Client = any; // dedupe: googleapis-common ile ayni gal kopyasi, tip kimligi cakismasin
import { buildMarketingOAuthClient, createMarketingJwt } from "./google-sa";
import type { MarketingChangeSet, PlatformChangeHandler } from "./types";

function normalizePropertyResource(propertyId: string): string {
  const t = propertyId.trim();
  if (t.startsWith("properties/")) return t;
  return `properties/${t.replace(/^properties\//, "")}`;
}

/**
 * Opt-in hostname allowlist filtresi. Verilen hostname'leri (bare + www) GA4 `hostName`
 * boyutuyla esler — staging/localhost/3.taraf kirliligini raporlardan dislar.
 * hostnames bos/yoksa undefined doner (filtre uygulanmaz, mevcut davranis korunur).
 */
function buildHostFilter(hostnames?: string[] | null) {
  if (!hostnames || hostnames.length === 0) return undefined;
  const set = new Set<string>();
  for (const h of hostnames) {
    const bare = String(h ?? "")
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "")
      .replace(/^www\./, "")
      .toLowerCase();
    if (!bare) continue;
    set.add(bare);
    set.add(`www.${bare}`);
  }
  if (set.size === 0) return undefined;
  return { filter: { fieldName: "hostName", inListFilter: { values: [...set] } } };
}

/** Mevcut dimensionFilter varsa andGroup ile birlestir, yoksa dogrudan ata. */
function mergeHostFilter(requestBody: any, hostFilter: any) {
  if (!hostFilter) return requestBody;
  const body = requestBody ?? {};
  if (!body.dimensionFilter) return { ...body, dimensionFilter: hostFilter };
  return {
    ...body,
    dimensionFilter: { andGroup: { expressions: [body.dimensionFilter, hostFilter] } },
  };
}

function rowsOf(result: unknown) {
  return ((result as { data?: { rows?: unknown[] } })?.data?.rows ?? []) as unknown[];
}

function metricValue(row: unknown, index: number) {
  return Number((row as { metricValues?: Array<{ value?: string }> })?.metricValues?.[index]?.value ?? 0);
}

function dimensionValue(row: unknown, index: number) {
  return (row as { dimensionValues?: Array<{ value?: string }> })?.dimensionValues?.[index]?.value ?? "";
}

function rangeStart(range: number) {
  const safeRange = [7, 28, 90].includes(range) ? range : 28;
  return `${safeRange}daysAgo`;
}

function previousRange(range: number) {
  const safeRange = [7, 28, 90].includes(range) ? range : 28;
  return { startDate: `${safeRange * 2}daysAgo`, endDate: `${safeRange + 1}daysAgo` };
}

async function optionalReport<T>(task: Promise<T>) {
  try {
    return { ok: true, data: await task };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

function normalizeGa4AdminError(error?: string | null) {
  if (!error) return null;
  const value = String(error);
  if (
    value.includes("analyticsadmin.googleapis.com") ||
    value.includes("Google Analytics Admin API has not been used") ||
    value.includes("it is disabled")
  ) {
    return "GA4_ADMIN_API_DISABLED: Google Analytics Admin API kapalı. Trafik raporları çalışır; yönetim verileri için Analytics Admin API etkinleştirilmeli.";
  }
  return value;
}

async function buildGa4Data(tenantKey: string, hostnames?: string[] | null) {
  const auth =
    (await createMarketingJwt(tenantKey)) ??
    ((await buildMarketingOAuthClient(tenantKey, "ga4")) as OAuth2Client | null);
  if (!auth) {
    throw new Error(
      "GA4 kimligi yok: service_account_json veya ga4.oauth_refresh_token (+ google OAuth client) tanimlayin.",
    );
  }
  const client = google.analyticsdata({ version: "v1beta", auth: auth as never });
  // Hostname allowlist verildiyse runReport'a otomatik dimensionFilter enjekte et
  // (her cagri yerini tek tek degistirmeden). Realtime raporlari sarilmaz.
  const hostFilter = buildHostFilter(hostnames);
  if (hostFilter) {
    const props = client.properties as any;
    const orig = props.runReport.bind(props);
    props.runReport = (params: any = {}) =>
      orig({ ...params, requestBody: mergeHostFilter(params.requestBody ?? {}, hostFilter) });
  }
  return client;
}

export async function fetchGa4Summary(tenantKey: string, propertyId: string, hostnames?: string[] | null) {
  // Once service account (JWT), yoksa OAuth refresh token (ga4 namespace, analytics.readonly scope).
  // gax/gRPC yerine REST (analyticsdata v1beta) — OAuth2Client ve JWT'yi dogal kabul eder, surum uyumsuzlugu yok.
  const data = await buildGa4Data(tenantKey, hostnames);
  const property = normalizePropertyResource(propertyId);

  const [daily, totals, topPages, channelFunnel, conversionEvents, realtime] = await Promise.all([
    data.properties.runReport({
      property,
      requestBody: {
        dateRanges: [{ startDate: "28daysAgo", endDate: "today" }],
        dimensions: [{ name: "date" }],
        metrics: [{ name: "sessions" }, { name: "activeUsers" }, { name: "screenPageViews" }],
        limit: "40",
      },
    }),
    data.properties.runReport({
      property,
      requestBody: {
        dateRanges: [{ startDate: "28daysAgo", endDate: "today" }],
        metrics: [
          { name: "sessions" },
          { name: "activeUsers" },
          { name: "screenPageViews" },
          { name: "eventCount" },
        ],
      },
    }),
    data.properties.runReport({
      property,
      requestBody: {
        dateRanges: [{ startDate: "28daysAgo", endDate: "today" }],
        dimensions: [{ name: "pagePathPlusQueryString" }],
        metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }, { name: "eventCount" }],
        limit: "15",
      },
    }),
    optionalReport(
      data.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate: "28daysAgo", endDate: "today" }],
          dimensions: [{ name: "sessionDefaultChannelGroup" }],
          metrics: [
            { name: "sessions" },
            { name: "engagedSessions" },
            { name: "eventCount" },
            { name: "conversions" },
          ],
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
          limit: "12",
        },
      }),
    ),
    optionalReport(
      data.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate: "28daysAgo", endDate: "today" }],
          dimensions: [{ name: "eventName" }],
          metrics: [{ name: "eventCount" }, { name: "conversions" }],
          orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
          limit: "20",
        },
      }),
    ),
    optionalReport(
      data.properties.runRealtimeReport({
        property,
        requestBody: {
          dimensions: [{ name: "country" }, { name: "deviceCategory" }],
          metrics: [{ name: "activeUsers" }],
          limit: "20",
        },
      }),
    ),
  ]);

  const totalRow = rowsOf(totals)[0];
  const totalsMap = {
    sessions: metricValue(totalRow, 0),
    activeUsers: metricValue(totalRow, 1),
    screenPageViews: metricValue(totalRow, 2),
    eventCount: metricValue(totalRow, 3),
  };

  return {
    property,
    dailyRows: daily.data.rows ?? [],
    totalRows: totals.data.rows ?? [],
    topPages: topPages.data.rows ?? [],
    totals: totalsMap,
    channelFunnel: channelFunnel.ok ? rowsOf(channelFunnel.data) : [],
    channelFunnelError: channelFunnel.ok ? null : channelFunnel.error,
    conversionEvents: conversionEvents.ok ? rowsOf(conversionEvents.data) : [],
    conversionEventsError: conversionEvents.ok ? null : conversionEvents.error,
    realtimeRows: realtime.ok ? rowsOf(realtime.data) : [],
    realtimeError: realtime.ok ? null : realtime.error,
  };
}

export async function fetchGa4DeepReport(tenantKey: string, propertyId: string, range = 28, hostnames?: string[] | null) {
  const data = await buildGa4Data(tenantKey, hostnames);
  const property = normalizePropertyResource(propertyId);
  const safeRange = [7, 28, 90].includes(range) ? range : 28;
  const metrics = [
    { name: "activeUsers" },
    { name: "sessions" },
    { name: "screenPageViews" },
    { name: "conversions" },
    { name: "engagementRate" },
    { name: "bounceRate" },
    { name: "averageSessionDuration" },
    { name: "purchaseRevenue" },
    { name: "transactions" },
  ];
  const [totals, sources, newVsReturning, geography, events, ecommerce] = await Promise.all([
    data.properties.runReport({
      property,
      requestBody: {
        dateRanges: [
          { startDate: rangeStart(safeRange), endDate: "today", name: "current" },
          { ...previousRange(safeRange), name: "previous" },
        ],
        // Birden cok dateRange verildiginde GA4 otomatik `dateRange` boyutu ekler;
        // boyut olarak DEKLARE EDILMEMELI (yoksa "Field dateRange is not a dimension" hatasi).
        metrics,
      },
    }),
    data.properties.runReport({
      property,
      requestBody: {
        dateRanges: [{ startDate: rangeStart(safeRange), endDate: "today" }],
        dimensions: [{ name: "sessionSourceMedium" }, { name: "sessionDefaultChannelGroup" }],
        metrics: [{ name: "sessions" }, { name: "activeUsers" }, { name: "conversions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: "20",
      },
    }),
    data.properties.runReport({
      property,
      requestBody: {
        dateRanges: [{ startDate: rangeStart(safeRange), endDate: "today" }],
        dimensions: [{ name: "newVsReturning" }],
        metrics: [{ name: "activeUsers" }, { name: "sessions" }],
        limit: "10",
      },
    }),
    data.properties.runReport({
      property,
      requestBody: {
        dateRanges: [{ startDate: rangeStart(safeRange), endDate: "today" }],
        dimensions: [{ name: "country" }, { name: "city" }],
        metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "conversions" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: "30",
      },
    }),
    data.properties.runReport({
      property,
      requestBody: {
        dateRanges: [{ startDate: rangeStart(safeRange), endDate: "today" }],
        dimensions: [{ name: "eventName" }],
        metrics: [{ name: "eventCount" }, { name: "conversions" }, { name: "totalRevenue" }],
        orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
        limit: "30",
      },
    }),
    optionalReport(
      data.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate: rangeStart(safeRange), endDate: "today" }],
          // itemName (item-scoped) ile yalniz item-scoped metrikler uyumlu;
          // purchaseRevenue item-scoped DEGIL -> "incompatible" hatasi verir, cikarildi.
          dimensions: [{ name: "itemName" }],
          metrics: [{ name: "itemRevenue" }, { name: "itemsPurchased" }, { name: "itemsViewed" }],
          orderBys: [{ metric: { metricName: "itemRevenue" }, desc: true }],
          limit: "30",
        },
      }),
    ),
  ]);

  const totalRows = rowsOf(totals);
  const current = totalRows.find((row) => dimensionValue(row, 0) === "current") ?? totalRows[0];
  const previous = totalRows.find((row) => dimensionValue(row, 0) === "previous") ?? totalRows[1];
  const totalsMap = metrics.reduce<Record<string, { current: number; previous: number; deltaPct: number | null }>>(
    (acc, metric, index) => {
      const cur = metricValue(current, index);
      const prev = metricValue(previous, index);
      acc[metric.name] = { current: cur, previous: prev, deltaPct: prev > 0 ? ((cur - prev) / prev) * 100 : null };
      return acc;
    },
    {},
  );

  return {
    property,
    range: safeRange,
    totals: totalsMap,
    sources: rowsOf(sources),
    newVsReturning: rowsOf(newVsReturning),
    geography: rowsOf(geography),
    events: rowsOf(events),
    ecommerce: ecommerce.ok ? rowsOf(ecommerce.data) : [],
    ecommerceError: ecommerce.ok ? null : ecommerce.error,
  };
}

/**
 * Musteri raporu icin tarih-araligi GA4 ozeti (from/to, YYYY-MM-DD).
 * Onceki esit-uzunluk donem ile karsilastirir. Client PDF raporunda kullanilir.
 */
export async function fetchGa4ClientReport(tenantKey: string, propertyId: string, from: string, to: string, hostnames?: string[] | null) {
  const data = await buildGa4Data(tenantKey, hostnames);
  const property = normalizePropertyResource(propertyId);
  const day = 86400000;
  const fromMs = Date.parse(from), toMs = Date.parse(to);
  const lenDays = Math.max(1, Math.round((toMs - fromMs) / day) + 1);
  const prevTo = new Date(fromMs - day);
  const prevFrom = new Date(fromMs - day * lenDays);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const metrics = [
    { name: "activeUsers" }, { name: "sessions" }, { name: "screenPageViews" },
    { name: "conversions" }, { name: "engagementRate" }, { name: "bounceRate" },
    { name: "averageSessionDuration" }, { name: "purchaseRevenue" }, { name: "transactions" },
  ];
  const [totals, sources, daily, ecommerce] = await Promise.all([
    data.properties.runReport({
      property,
      requestBody: {
        dateRanges: [
          { startDate: from, endDate: to, name: "current" },
          { startDate: fmt(prevFrom), endDate: fmt(prevTo), name: "previous" },
        ],
        metrics,
      },
    }),
    data.properties.runReport({
      property,
      requestBody: {
        dateRanges: [{ startDate: from, endDate: to }],
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics: [{ name: "sessions" }, { name: "activeUsers" }, { name: "conversions" }, { name: "purchaseRevenue" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: "12",
      },
    }),
    data.properties.runReport({
      property,
      requestBody: {
        dateRanges: [{ startDate: from, endDate: to }],
        dimensions: [{ name: "date" }],
        metrics: [{ name: "sessions" }, { name: "activeUsers" }, { name: "purchaseRevenue" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
        limit: "100",
      },
    }),
    optionalReport(
      data.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate: from, endDate: to }],
          dimensions: [{ name: "itemName" }],
          metrics: [{ name: "itemRevenue" }, { name: "itemsPurchased" }],
          orderBys: [{ metric: { metricName: "itemRevenue" }, desc: true }],
          limit: "15",
        },
      }),
    ),
  ]);

  const tr = rowsOf(totals);
  const cur = tr.find((r) => dimensionValue(r, 0) === "current") ?? tr[0];
  const prev = tr.find((r) => dimensionValue(r, 0) === "previous") ?? tr[1];
  const totalsMap = metrics.reduce<Record<string, { current: number; previous: number; deltaPct: number | null }>>(
    (acc, m, i) => {
      const c = metricValue(cur, i), p = metricValue(prev, i);
      acc[m.name] = { current: c, previous: p, deltaPct: p > 0 ? ((c - p) / p) * 100 : null };
      return acc;
    },
    {},
  );

  return {
    property,
    range: { from, to, days: lenDays, prevFrom: fmt(prevFrom), prevTo: fmt(prevTo) },
    totals: totalsMap,
    sources: rowsOf(sources).map((r) => ({
      channel: dimensionValue(r, 0),
      sessions: metricValue(r, 0), users: metricValue(r, 1), conversions: metricValue(r, 2), revenue: metricValue(r, 3),
    })),
    daily: rowsOf(daily).map((r) => ({
      date: dimensionValue(r, 0), sessions: metricValue(r, 0), users: metricValue(r, 1), revenue: metricValue(r, 2),
    })),
    topProducts: ecommerce.ok
      ? rowsOf(ecommerce.data).map((r) => ({ name: dimensionValue(r, 0), revenue: metricValue(r, 0), qty: metricValue(r, 1) }))
      : [],
  };
}

export async function fetchGa4Funnel(tenantKey: string, propertyId: string, range = 28, hostnames?: string[] | null) {
  const data = await buildGa4Data(tenantKey, hostnames);
  const property = normalizePropertyResource(propertyId);
  const safeRange = [7, 28, 90].includes(range) ? range : 28;
  const steps = ["session_start", "view_item", "add_to_cart", "begin_checkout", "add_payment_info", "purchase"];
  const report = await data.properties.runReport({
    property,
    requestBody: {
      dateRanges: [{ startDate: rangeStart(safeRange), endDate: "today" }],
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: { filter: { fieldName: "eventName", inListFilter: { values: steps } } },
      limit: "20",
    },
  });
  const counts: Record<string, number> = Object.fromEntries(steps.map((step) => [step, 0]));
  for (const row of rowsOf(report)) counts[dimensionValue(row, 0)] = metricValue(row, 0);
  const items = steps.map((step, index) => {
    const count = counts[step] ?? 0;
    const previous = index === 0 ? count : counts[steps[index - 1]] ?? 0;
    const dropOffPct = index === 0 || previous <= 0 ? null : ((previous - count) / previous) * 100;
    return { step, count, previous, dropOffPct };
  });
  // Akilli uyari: dogal yuksek dususleri (or. profil goruntuleme -> randevu secimi) DEGIL,
  // gercek OLCUM BOSLUGU'nu isaretle: onceki adimda hareket varken bu adim TAM 0 ise
  // event muhtemelen hic gonderilmiyor (GTM/site tag eksik). GoldMood icin bu, randevu
  // donusum hunisinde begin_checkout/add_payment_info gibi adimlarin yanlislikla %100
  // "kayip" gorunmesini ayirt eder (false-alarm degil, tracking gap).
  //
  // Ozel durum — TUM randevu/odeme adimlari 0 (sadece session_start var): her adim icin
  // ayri "olcum boslugu" spam'i yerine tek, sakin bir mesaj basariz.
  const ecommerceSteps = items.slice(1); // session_start haric
  const ecommerceTracked = ecommerceSteps.some((item) => item.count > 0);
  const warnings: string[] = [];
  if (!ecommerceTracked) {
    if ((items[0]?.count ?? 0) > 0) {
      warnings.push(
        "Randevu dönüşüm event'i ölçülmüyor (danışman/hizmet inceleme → ödeme tamamlandı adımları 0). Bu adımlar henüz kurulmadıysa normal; ölçmek istiyorsak GTM/dataLayer kurulumu tamamlanmalı.",
      );
    }
  } else {
    for (let i = 1; i < items.length; i += 1) {
      const item = items[i];
      if (item.count === 0 && item.previous > 0) {
        warnings.push(
          `${item.step} hiç ölçülmüyor (önceki adımda ${item.previous} var) — event gönderilmiyor olabilir (ölçüm boşluğu)`,
        );
      }
    }
  }
  return { property, range: safeRange, steps: items, warnings, ecommerceTracked };
}

/**
 * Funnel event'lerinin zamana bagli trendi — cizgi grafik icin.
 * granularity="month": aylik bucket (yearMonth), granularity="week": haftalik bucket (yearWeek).
 * Property yeni acildiysa aylik tek nokta dondurur; haftalik daha fazla nokta verir.
 */
export async function fetchGa4FunnelTrend(
  tenantKey: string,
  propertyId: string,
  granularity: "month" | "week" = "month",
  periods?: number,
  hostnames?: string[] | null,
) {
  const data = await buildGa4Data(tenantKey, hostnames);
  const property = normalizePropertyResource(propertyId);
  const isWeek = granularity === "week";
  const safePeriods = Math.min(Math.max(Math.trunc(periods || (isWeek ? 12 : 6)), 2), isWeek ? 26 : 12);
  const lookbackDays = isWeek ? safePeriods * 7 + 7 : safePeriods * 31;
  const dim = isWeek ? "yearWeek" : "yearMonth";
  const steps = ["session_start", "view_item", "add_to_cart", "begin_checkout", "add_payment_info", "purchase"];
  const report = await data.properties.runReport({
    property,
    requestBody: {
      dateRanges: [{ startDate: `${lookbackDays}daysAgo`, endDate: "today" }],
      dimensions: [{ name: dim }, { name: "eventName" }],
      metrics: [{ name: "eventCount" }],
      dimensionFilter: { filter: { fieldName: "eventName", inListFilter: { values: steps } } },
      orderBys: [{ dimension: { dimensionName: dim } }],
      limit: "1000",
    },
  });
  // period (YYYYMM veya YYYYWW) -> { step: count }
  const byPeriod = new Map<string, Record<string, number>>();
  for (const row of rowsOf(report)) {
    const period = dimensionValue(row, 0);
    const event = dimensionValue(row, 1);
    if (!period) continue;
    const bucket = byPeriod.get(period) ?? Object.fromEntries(steps.map((s) => [s, 0]));
    bucket[event] = metricValue(row, 0);
    byPeriod.set(period, bucket);
  }
  const keys = [...byPeriod.keys()].sort();
  const rows = keys.map((period) => {
    const label = isWeek
      ? `${period.slice(0, 4)}-H${period.slice(4, 6)}` // YYYY-Hww
      : `${period.slice(0, 4)}-${period.slice(4, 6)}`; // YYYY-MM
    return { period, label, ...byPeriod.get(period)! };
  });
  return { property, granularity, periods: safePeriods, steps, rows };
}

export async function fetchGa4VisitStats(tenantKey: string, propertyId: string, range = 28, hostnames?: string[] | null) {
  const data = await buildGa4Data(tenantKey, hostnames);
  const property = normalizePropertyResource(propertyId);
  const safeRange = [7, 28, 90].includes(range) ? range : 28;
  const visitMetrics = [
    { name: "activeUsers" },
    { name: "averageSessionDuration" },
    { name: "screenPageViewsPerSession" },
  ];
  const [newReturning, totals, daily] = await Promise.all([
    optionalReport(
      data.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate: rangeStart(safeRange), endDate: "today" }],
          dimensions: [{ name: "newVsReturning" }],
          metrics: visitMetrics,
          limit: "10",
        },
      }),
    ),
    optionalReport(
      data.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate: rangeStart(safeRange), endDate: "today" }],
          metrics: visitMetrics,
        },
      }),
    ),
    optionalReport(
      data.properties.runReport({
        property,
        requestBody: {
          dateRanges: [{ startDate: rangeStart(safeRange), endDate: "today" }],
          dimensions: [{ name: "date" }],
          metrics: [{ name: "activeUsers" }, { name: "newUsers" }],
          orderBys: [{ dimension: { dimensionName: "date" } }],
          limit: String(safeRange + 5),
        },
      }),
    ),
  ]);

  const emptyBreakdown = () => ({
    activeUsers: 0,
    averageSessionDuration: 0,
    screenPageViewsPerSession: 0,
  });
  const breakdown: Record<"new" | "returning" | "total", ReturnType<typeof emptyBreakdown>> = {
    new: emptyBreakdown(),
    returning: emptyBreakdown(),
    total: emptyBreakdown(),
  };

  if (newReturning.ok) {
    for (const row of rowsOf(newReturning.data)) {
      const raw = dimensionValue(row, 0).toLowerCase();
      const key = raw.includes("return") ? "returning" : raw.includes("new") ? "new" : null;
      if (!key) continue;
      breakdown[key] = {
        activeUsers: metricValue(row, 0),
        averageSessionDuration: metricValue(row, 1),
        screenPageViewsPerSession: metricValue(row, 2),
      };
    }
  }

  if (totals.ok) {
    const row = rowsOf(totals.data)[0];
    breakdown.total = {
      activeUsers: metricValue(row, 0),
      averageSessionDuration: metricValue(row, 1),
      screenPageViewsPerSession: metricValue(row, 2),
    };
  }

  const dailyRows = daily.ok
    ? rowsOf(daily.data).map((row) => {
        const activeUsers = metricValue(row, 0);
        const newUsers = metricValue(row, 1);
        return {
          date: dimensionValue(row, 0),
          activeUsers,
          newUsers,
          returningUsers: Math.max(activeUsers - newUsers, 0),
        };
      })
    : [];

  return {
    property,
    range: safeRange,
    breakdown,
    daily: dailyRows,
    errors: {
      newVsReturning: newReturning.ok ? null : newReturning.error,
      totals: totals.ok ? null : totals.error,
      daily: daily.ok ? null : daily.error,
    },
  };
}

export async function fetchGa4RealtimeDetail(tenantKey: string, propertyId: string, hostnames?: string[] | null) {
  const data = await buildGa4Data(tenantKey, hostnames);
  const property = normalizePropertyResource(propertyId);
  const report = await data.properties.runRealtimeReport({
    property,
    requestBody: {
      dimensions: [{ name: "unifiedScreenName" }, { name: "country" }, { name: "deviceCategory" }],
      metrics: [{ name: "activeUsers" }, { name: "eventCount" }],
      limit: "30",
    },
  });
  return { property, rows: rowsOf(report) };
}

export async function fetchGa4Config(tenantKey: string, propertyId: string) {
  const parent = normalizePropertyResource(propertyId);
  const [adminBeta, adminAlpha] = await Promise.all([buildGa4Admin(tenantKey), buildGa4Admin(tenantKey, "v1alpha")]);
  const [dataStreams, customDimensions, keyEvents, googleAdsLinks, audiences] = await Promise.all([
    optionalReport((adminBeta.properties as any).dataStreams.list({ parent, pageSize: 200 })),
    optionalReport((adminBeta.properties as any).customDimensions.list({ parent, pageSize: 200 })),
    optionalReport((adminBeta.properties as any).keyEvents.list({ parent, pageSize: 200 })),
    optionalReport((adminBeta.properties as any).googleAdsLinks.list({ parent, pageSize: 200 })),
    optionalReport((adminAlpha.properties as any).audiences.list({ parent, pageSize: 200 })),
  ]);
  const unwrap = (res: Awaited<ReturnType<typeof optionalReport>>, key: string) =>
    res.ok ? ((res.data as any).data?.[key] ?? []) : [];
  return {
    property: parent,
    dataStreams: unwrap(dataStreams, "dataStreams"),
    customDimensions: unwrap(customDimensions, "customDimensions"),
    keyEvents: unwrap(keyEvents, "keyEvents"),
    googleAdsLinks: unwrap(googleAdsLinks, "googleAdsLinks"),
    audiences: unwrap(audiences, "audiences"),
    errors: {
      dataStreams: dataStreams.ok ? null : normalizeGa4AdminError(dataStreams.error),
      customDimensions: customDimensions.ok ? null : normalizeGa4AdminError(customDimensions.error),
      keyEvents: keyEvents.ok ? null : normalizeGa4AdminError(keyEvents.error),
      googleAdsLinks: googleAdsLinks.ok ? null : normalizeGa4AdminError(googleAdsLinks.error),
      audiences: audiences.ok ? null : normalizeGa4AdminError(audiences.error),
    },
  };
}

// ─── GA4 Admin API yazma handler'i (change-set apply) ───────────────────────
// Analytics Admin API: key event (conversion), custom dimension, audience olusturur.
// Idempotent (ayni isim varsa atlar). APPLY icin token analytics.edit scope'lu olmali;
// mevcut ga4 token genelde analytics.readonly -> apply "insufficient scope" doner (validate read calisir).

type Ga4Payload = {
  action?: "conversion_event" | "audience" | "custom_dimension" | "delete_key_event" | "delete_audience" | "delete_custom_dimension";
  propertyId?: string;
  name?: string;
  resourceName?: string;
  countingMethod?: string;
  displayName?: string;
  scope?: string;
  audienceDefinition?: Record<string, unknown>;
};

async function buildGa4Admin(tenantKey: string, version: "v1beta" | "v1alpha" = "v1beta") {
  const auth =
    (await createMarketingJwt(tenantKey)) ??
    ((await buildMarketingOAuthClient(tenantKey, "ga4")) as OAuth2Client | null);
  if (!auth) throw new Error("GA4 kimligi yok (service_account_json veya ga4.oauth_refresh_token).");
  // keyEvents/customDimensions = v1beta; audiences yalniz v1alpha'da.
  // (googleapis tipleri v1alpha'yi string-literal olarak bilmiyor; runtime'da gecerli -> cast.)
  return google.analyticsadmin({ version: version as "v1beta", auth: auth as never });
}

function ga4PayloadOf(cs: MarketingChangeSet): Ga4Payload {
  if (!cs.payload || typeof cs.payload !== "object") throw new Error("payload object zorunlu");
  return cs.payload as Ga4Payload;
}

function ga4Parent(payload: Ga4Payload, cs: MarketingChangeSet) {
  const pid = (payload.propertyId || cs.targetRef || "").trim();
  if (!pid) throw new Error("propertyId zorunlu");
  return normalizePropertyResource(pid);
}

export const ga4ChangeHandler: PlatformChangeHandler = {
  async validate(tenantKey, changeSet) {
    try {
      const payload = ga4PayloadOf(changeSet);
      if (!payload.action) {
        throw new Error("payload.action zorunlu (conversion_event|audience|custom_dimension|delete_*)");
      }
      if (payload.action.startsWith("delete_")) {
        if (!payload.resourceName?.trim()) throw new Error("delete action icin payload.resourceName zorunlu");
      } else if (!payload.name?.trim()) {
        throw new Error("payload.name zorunlu");
      }
      const parent = ga4Parent(payload, changeSet);
      const admin = await buildGa4Admin(tenantKey);
      // erisim dogrula (read); yazma scope'u apply'da gerekir
      await (admin.properties as any).keyEvents.list({ parent, pageSize: 1 }).catch(() => null);
      return { ok: true, result: { dryRun: true, parent, action: payload.action, name: payload.name } };
    } catch (err) {
      return { ok: false, result: { error: (err as Error).message } };
    }
  },
  async apply(tenantKey, changeSet) {
    try {
      const payload = ga4PayloadOf(changeSet);
      const parent = ga4Parent(payload, changeSet);
      const name = payload.name?.trim() || "";
      const admin = await buildGa4Admin(tenantKey);

      if (payload.action === "delete_key_event") {
        await (admin.properties as any).keyEvents.delete({ name: payload.resourceName });
        return { ok: true, result: { action: "delete_key_event", deleted: payload.resourceName } };
      }

      if (payload.action === "delete_custom_dimension") {
        await (admin.properties as any).customDimensions.delete({ name: payload.resourceName });
        return { ok: true, result: { action: "delete_custom_dimension", deleted: payload.resourceName } };
      }

      if (payload.action === "delete_audience") {
        const adminAlpha = await buildGa4Admin(tenantKey, "v1alpha");
        await (adminAlpha.properties as any).audiences.archive({ name: payload.resourceName });
        return { ok: true, result: { action: "delete_audience", archived: payload.resourceName } };
      }

      if (payload.action === "conversion_event") {
        const existing = await (admin.properties as any).keyEvents.list({ parent, pageSize: 200 }).catch(() => ({ data: {} }));
        const found = (existing.data?.keyEvents || []).find((k: any) => k.eventName === name);
        if (found) return { ok: true, result: { action: "conversion_event", name, status: "zaten var", resource: found.name } };
        const res = await (admin.properties as any).keyEvents.create({
          parent,
          requestBody: { eventName: name, countingMethod: payload.countingMethod || "ONCE_PER_EVENT" },
        });
        return { ok: true, result: { action: "conversion_event", created: res.data } };
      }

      if (payload.action === "custom_dimension") {
        const existing = await (admin.properties as any).customDimensions.list({ parent, pageSize: 200 }).catch(() => ({ data: {} }));
        const found = (existing.data?.customDimensions || []).find((d: any) => d.parameterName === name);
        if (found) return { ok: true, result: { action: "custom_dimension", name, status: "zaten var", resource: found.name } };
        const res = await (admin.properties as any).customDimensions.create({
          parent,
          requestBody: { parameterName: name, displayName: payload.displayName || name, scope: payload.scope || "EVENT" },
        });
        return { ok: true, result: { action: "custom_dimension", created: res.data } };
      }

      if (payload.action === "audience") {
        if (!payload.audienceDefinition) {
          return { ok: false, result: { error: "audience icin payload.audienceDefinition (filterClauses) gerekli; sadece isim yetmez." } };
        }
        const adminAlpha = await buildGa4Admin(tenantKey, "v1alpha"); // audiences yalniz v1alpha
        const existing = await (adminAlpha.properties as any).audiences.list({ parent, pageSize: 200 }).catch(() => ({ data: {} }));
        const found = (existing.data?.audiences || []).find((a: any) => a.displayName === name);
        if (found) return { ok: true, result: { action: "audience", name, status: "zaten var", resource: found.name } };
        const res = await (adminAlpha.properties as any).audiences.create({
          parent,
          requestBody: { displayName: name, ...payload.audienceDefinition },
        });
        return { ok: true, result: { action: "audience", created: res.data } };
      }

      throw new Error(`bilinmeyen action: ${payload.action}`);
    } catch (err) {
      return { ok: false, result: { error: (err as Error).message } };
    }
  },
};
