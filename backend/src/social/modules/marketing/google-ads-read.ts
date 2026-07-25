import { env } from "../../core/env";
import { getTenantSecret, getTenantValue } from "../../core/tenant-settings";

type GoogleAdsRow = Record<string, unknown>;

export type GoogleAdsOperation = Record<string, unknown>;

export type GoogleAdsChangeSetPayload = {
  kind:
    | "performance_max_text_asset_plan"
    | "campaign_status_update"
    | "campaign_budget_update"
    | "campaign_bidding_update"
    | "keyword_status_update"
    | "image_asset_create"
    | "asset_group_asset_remove"
    | "search_campaign_create"
    | "search_rsa_create"
    | "campaign_remove"
    | "campaign_update"
    | "budget_update";
  notes?: string;
  campaignResourceName?: string;
  campaignBudgetResourceName?: string;
  updateMask?: string;
  assetGroupResourceName?: string;
  assetGroupAssetResourceName?: string;
  adGroupCriterionResourceName?: string;
  assetResourceName?: string;
  fieldType?: string;
  textAssets?: {
    headlines?: string[];
    longHeadlines?: string[];
    descriptions?: string[];
    businessName?: string;
  };
  imageChecklist?: string[];
  operations?: GoogleAdsOperation[];
  manualSteps?: string[];
};

export type GoogleAdsBiddingDraftInput =
  | { strategy: "MANUAL_CPC"; enhancedCpcEnabled?: boolean }
  | { strategy: "MAXIMIZE_CONVERSIONS" }
  | { strategy: "TARGET_ROAS"; targetRoas: number }
  | { strategy: "TARGET_CPA"; targetCpaMicros: number };

export type GoogleAdsSearchCampaignCreateSpec = {
  name: string;
  dailyBudgetMicros: number;
  finalUrl: string;
  adGroupName?: string;
  headlines: string[];
  descriptions: string[];
  keywords?: string[];
  locationIds?: string[];
  languageIds?: string[];
  bidding?: { strategy: "MANUAL_CPC"; cpcBidMicros?: number } | { strategy: "MAXIMIZE_CONVERSIONS" };
};

type GoogleAdsContext = {
  customerId: string;
  managerId?: string;
};

const GOOGLE_ADS_RANGE_MAP: Record<string, string> = {
  "7d": "LAST_7_DAYS",
  "14d": "LAST_14_DAYS",
  "30d": "LAST_30_DAYS",
  "90d": "LAST_90_DAYS",
};

export function normalizeCustomerId(id: string): string {
  return id.replace(/-/g, "").trim();
}

function apiVersion() {
  return env.GOOGLE_ADS_API_VERSION || "v22";
}

async function resolveCredentials(tenantKey: string) {
  const developerToken = (await getTenantSecret(tenantKey, "google_ads", "developer_token"))?.trim();
  const clientId = (await getTenantValue<string>(tenantKey, "google", "oauth_client_id"))?.trim();
  const clientSecret = (await getTenantSecret(tenantKey, "google", "oauth_client_secret"))?.trim();
  const refreshToken = (await getTenantSecret(tenantKey, "google", "oauth_refresh_token"))?.trim();
  const missing = [
    !developerToken ? "google_ads.developer_token" : "",
    !clientId ? "google.oauth_client_id" : "",
    !clientSecret ? "google.oauth_client_secret" : "",
    !refreshToken ? "google.oauth_refresh_token" : "",
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(
      `Google Ads API baglantisi eksik: ${missing.join(", ")}. Tenant ayarlarina ekleyin veya env fallback degerlerini tanimlayin.`
    );
  }

  return {
    developerToken: developerToken as string,
    clientId: clientId as string,
    clientSecret: clientSecret as string,
    refreshToken: refreshToken as string,
  };
}

function makeContext(customerIdRaw: string, managerIdRaw?: string | null): GoogleAdsContext {
  const customerId = normalizeCustomerId(customerIdRaw);
  if (!customerId) throw new Error("Google Ads musteri ID gecersiz");
  const managerId = managerIdRaw?.trim() ? normalizeCustomerId(managerIdRaw) : undefined;
  return { customerId, managerId };
}

async function fetchAccessToken(tenantKey: string) {
  const { clientId, clientSecret, refreshToken } = await resolveCredentials(tenantKey);
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(
      typeof json.error_description === "string"
        ? json.error_description
        : `Google OAuth token hatasi: ${res.status}`
    );
  }
  const accessToken = json.access_token;
  if (typeof accessToken !== "string" || !accessToken) {
    throw new Error("Google OAuth access token alinamadi");
  }
  return accessToken;
}

async function googleAdsRequest<T>(
  tenantKey: string,
  ctx: GoogleAdsContext,
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  const { developerToken } = await resolveCredentials(tenantKey);
  const accessToken = await fetchAccessToken(tenantKey);
  const url = `https://googleads.googleapis.com/${apiVersion()}${path}`;
  const bodyJson = JSON.stringify(body);

  const doFetch = async (withManager: boolean) => {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "developer-token": developerToken,
    };
    if (withManager && ctx.managerId) headers["login-customer-id"] = ctx.managerId;
    return fetch(url, { method: "POST", headers, body: bodyJson });
  };

  let res = await doFetch(true);
  // login-customer-id (manager) ile 403/404 -> manager bu musteriyi yonetmiyor olabilir
  // (yanlis MCC baglaminda mutate "entity not found"=404 doner). Token dogrudan erisebiliyorsa
  // manager'siz tekrar dene (lastik gibi MCC-zorunlu hesaplari etkilemez; entity gercekten yoksa yine hata).
  if (!res.ok && (res.status === 403 || res.status === 404) && ctx.managerId) {
    res = await doFetch(false);
  }

  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const details = JSON.stringify(json);
    throw new Error(`Google Ads API hatasi (${res.status}): ${details}`);
  }
  return json as T;
}

async function searchGoogleAds(tenantKey: string, ctx: GoogleAdsContext, query: string): Promise<GoogleAdsRow[]> {
  const payload = await googleAdsRequest<unknown>(
    tenantKey,
    ctx,
    `/customers/${ctx.customerId}/googleAds:searchStream`,
    { query }
  );
  const chunks = Array.isArray(payload) ? payload : [payload];
  return chunks.flatMap((chunk) => {
    if (!chunk || typeof chunk !== "object") return [];
    const results = (chunk as { results?: unknown }).results;
    return Array.isArray(results) ? (results as GoogleAdsRow[]) : [];
  });
}

export async function mutateGoogleAds(
  tenantKey: string,
  customerIdRaw: string,
  managerIdRaw: string | null | undefined,
  operations: GoogleAdsOperation[],
  validateOnly: boolean
) {
  const ctx = makeContext(customerIdRaw, managerIdRaw);
  return googleAdsRequest<Record<string, unknown>>(
    tenantKey,
    ctx,
    `/customers/${ctx.customerId}/googleAds:mutate`,
    {
      mutateOperations: operations,
      validateOnly,
      partialFailure: false,
      responseContentType: "RESOURCE_NAME_ONLY",
    }
  );
}

function readNestedString(row: GoogleAdsRow, key: string, nestedKey: string) {
  const obj = row[key] as Record<string, unknown> | undefined;
  const value = obj?.[nestedKey];
  return value == null ? null : String(value);
}

function readNestedNumber(row: GoogleAdsRow, key: string, nestedKey: string) {
  const raw = readNestedString(row, key, nestedKey);
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function microsToNumber(value: number | null) {
  return value == null ? 0 : Number(value);
}

function ratio(numerator: number | null, denominator: number | null) {
  const top = Number(numerator ?? 0);
  const bottom = Number(denominator ?? 0);
  return bottom > 0 ? top / bottom : null;
}

function biddingStrategyLabel(row: GoogleAdsRow) {
  const campaign = row.campaign as Record<string, unknown> | undefined;
  const type = campaign?.biddingStrategyType ? String(campaign.biddingStrategyType) : null;
  if (type && type !== "UNSPECIFIED" && type !== "UNKNOWN") return type;
  if (campaign?.manualCpc) return "MANUAL_CPC";
  if (campaign?.maximizeConversions) return "MAXIMIZE_CONVERSIONS";
  if (campaign?.targetRoas) return "TARGET_ROAS";
  if (campaign?.targetCpa) return "TARGET_CPA";
  return type ?? null;
}

function normalizeRange(range?: string) {
  return GOOGLE_ADS_RANGE_MAP[String(range || "").toLowerCase()] || "LAST_30_DAYS";
}

/**
 * Paylasimli Ads hesaplarinda (orn. tarim 702-033-4476: haldefiyat+bereketfide+vistaseeds)
 * tenant'i kampanya ADI on-ekiyle ayirmak icin GAQL WHERE parcasi.
 * marketing_json.adsCampaignFilter ("Haldefiyat" gibi) verildiginde yalniz o tenant'in
 * kampanyalari doner. Bos/yoksa filtre uygulanmaz (tekil hesaplar bozulmaz).
 */
export function campaignNameClause(filter?: string | null): string {
  const f = String(filter ?? "").replace(/['"\\%]/g, "").trim();
  return f ? `AND campaign.name LIKE '${f}%'` : "";
}

export async function fetchGoogleAdsCampaigns(
  tenantKey: string,
  customerIdRaw: string,
  managerIdRaw?: string | null,
  campaignFilter?: string | null
) {
  const ctx = makeContext(customerIdRaw, managerIdRaw);
  const rows = await searchGoogleAds(
    tenantKey,
    ctx,
    `
      SELECT
        campaign.resource_name,
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
        campaign.brand_guidelines_enabled,
        campaign.optimization_score,
        campaign.bidding_strategy_type,
        campaign_budget.resource_name,
        campaign_budget.name,
        campaign_budget.amount_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value
      FROM campaign
      WHERE campaign.status != 'REMOVED'
        AND segments.date DURING LAST_30_DAYS
        ${campaignNameClause(campaignFilter)}
      ORDER BY metrics.cost_micros DESC
      LIMIT 50
    `
  );

  return rows.map((r) => {
    const impressions = readNestedNumber(r, "metrics", "impressions");
    const clicks = readNestedNumber(r, "metrics", "clicks");
    const costMicros = readNestedNumber(r, "metrics", "costMicros");
    const conversions = readNestedNumber(r, "metrics", "conversions");
    const conversionsValue = readNestedNumber(r, "metrics", "conversionsValue");
    return {
      id: readNestedString(r, "campaign", "id"),
      resourceName: readNestedString(r, "campaign", "resourceName"),
      name: readNestedString(r, "campaign", "name"),
      status: readNestedString(r, "campaign", "status"),
      channelType: readNestedString(r, "campaign", "advertisingChannelType"),
      brandGuidelinesEnabled: ((r.campaign as Record<string, unknown> | undefined)?.brandGuidelinesEnabled as boolean) ?? false,
      optimizationScore: readNestedNumber(r, "campaign", "optimizationScore"),
      biddingStrategyType: biddingStrategyLabel(r),
      budget: {
        resourceName: readNestedString(r, "campaignBudget", "resourceName"),
        name: readNestedString(r, "campaignBudget", "name"),
        amountMicros: readNestedNumber(r, "campaignBudget", "amountMicros"),
      },
      metrics: {
        impressions,
        clicks,
        costMicros,
        conversions,
        conversionsValue,
        ctr: ratio(clicks, impressions),
        averageCpcMicros: ratio(costMicros, clicks),
        cpaMicros: ratio(costMicros, conversions),
        roas: ratio(conversionsValue, microsToNumber(costMicros) / 1_000_000),
      },
    };
  });
}

/** Musteri raporu icin tarih-araligi (from/to, YYYY-MM-DD) kampanya metrikleri (aralik geneli toplam). */
export async function fetchGoogleAdsClientReport(
  tenantKey: string,
  customerIdRaw: string,
  managerIdRaw: string | null | undefined,
  from: string,
  to: string,
) {
  const ctx = makeContext(customerIdRaw, managerIdRaw);
  const safe = (s: string) => s.replace(/[^0-9-]/g, "");
  const rows = await searchGoogleAds(
    tenantKey,
    ctx,
    `
      SELECT campaign.name, campaign.advertising_channel_type, campaign.status,
             metrics.cost_micros, metrics.clicks, metrics.impressions,
             metrics.conversions, metrics.conversions_value
      FROM campaign
      WHERE segments.date BETWEEN '${safe(from)}' AND '${safe(to)}'
        AND campaign.status != 'REMOVED'
      ORDER BY metrics.cost_micros DESC
    `,
  );
  const campaigns = rows.map((r) => {
    const costMicros = readNestedNumber(r, "metrics", "costMicros");
    return {
      name: readNestedString(r, "campaign", "name"),
      channelType: readNestedString(r, "campaign", "advertisingChannelType"),
      status: readNestedString(r, "campaign", "status"),
      cost: microsToNumber(costMicros) / 1_000_000,
      clicks: readNestedNumber(r, "metrics", "clicks") ?? 0,
      impressions: readNestedNumber(r, "metrics", "impressions") ?? 0,
      conversions: readNestedNumber(r, "metrics", "conversions") ?? 0,
      value: readNestedNumber(r, "metrics", "conversionsValue") ?? 0,
    };
  });
  const t = campaigns.reduce(
    (a, c) => { a.cost += c.cost; a.clicks += c.clicks; a.impressions += c.impressions; a.conversions += c.conversions; a.value += c.value; return a; },
    { cost: 0, clicks: 0, impressions: 0, conversions: 0, value: 0 },
  );
  return {
    campaigns,
    totals: {
      ...t,
      roas: t.cost > 0 ? t.value / t.cost : null,
      cpc: t.clicks > 0 ? t.cost / t.clicks : null,
      ctr: t.impressions > 0 ? t.clicks / t.impressions : null,
      cpa: t.conversions > 0 ? t.cost / t.conversions : null,
    },
  };
}

export async function fetchGoogleAdsInsights(
  tenantKey: string,
  customerIdRaw: string,
  managerIdRaw?: string | null,
  range = "30d",
  campaignFilter?: string | null
) {
  const ctx = makeContext(customerIdRaw, managerIdRaw);
  const during = normalizeRange(range);
  const campClause = campaignNameClause(campaignFilter);
  const [searchTermRows, keywordRows, deviceRows] = await Promise.all([
    searchGoogleAds(
      tenantKey,
      ctx,
      `
        SELECT
          campaign.id,
          campaign.name,
          ad_group.id,
          ad_group.name,
          search_term_view.search_term,
          search_term_view.status,
          metrics.impressions,
          metrics.clicks,
          metrics.ctr,
          metrics.cost_micros,
          metrics.conversions,
          metrics.conversions_value
        FROM search_term_view
        WHERE segments.date DURING ${during}
          AND metrics.cost_micros > 0
          ${campClause}
        ORDER BY metrics.cost_micros DESC
        LIMIT 50
      `
    ),
    searchGoogleAds(
      tenantKey,
      ctx,
      `
        SELECT
          campaign.id,
          campaign.name,
          ad_group.id,
          ad_group.name,
          ad_group_criterion.resource_name,
          ad_group_criterion.keyword.text,
          ad_group_criterion.keyword.match_type,
          metrics.impressions,
          metrics.clicks,
          metrics.ctr,
          metrics.cost_micros,
          metrics.conversions,
          metrics.conversions_value
        FROM keyword_view
        WHERE segments.date DURING ${during}
          AND ad_group_criterion.type = KEYWORD
          AND ad_group_criterion.status != 'REMOVED'
          AND metrics.cost_micros > 0
          ${campClause}
        ORDER BY metrics.cost_micros DESC
        LIMIT 50
      `
    ),
    searchGoogleAds(
      tenantKey,
      ctx,
      `
        SELECT
          segments.device,
          metrics.impressions,
          metrics.clicks,
          metrics.cost_micros,
          metrics.conversions,
          metrics.conversions_value
        FROM campaign
        WHERE segments.date DURING ${during}
          AND campaign.status != 'REMOVED'
          ${campClause}
        ORDER BY metrics.cost_micros DESC
        LIMIT 20
      `
    ),
  ]);

  const metricShape = (row: GoogleAdsRow) => {
    const impressions = readNestedNumber(row, "metrics", "impressions");
    const clicks = readNestedNumber(row, "metrics", "clicks");
    const costMicros = readNestedNumber(row, "metrics", "costMicros");
    const conversions = readNestedNumber(row, "metrics", "conversions");
    const conversionsValue = readNestedNumber(row, "metrics", "conversionsValue");
    return {
      impressions,
      clicks,
      ctr: readNestedNumber(row, "metrics", "ctr") ?? ratio(clicks, impressions),
      costMicros,
      conversions,
      conversionsValue,
      cpaMicros: ratio(costMicros, conversions),
      roas: ratio(conversionsValue, microsToNumber(costMicros) / 1_000_000),
    };
  };

  return {
    range: during,
    searchTerms: searchTermRows.map((r) => ({
      campaignId: readNestedString(r, "campaign", "id"),
      campaignName: readNestedString(r, "campaign", "name"),
      adGroupId: readNestedString(r, "adGroup", "id"),
      adGroupName: readNestedString(r, "adGroup", "name"),
      term: readNestedString(r, "searchTermView", "searchTerm"),
      status: readNestedString(r, "searchTermView", "status"),
      metrics: metricShape(r),
      note: "Alakasiz terimler negatif kelime adayi olarak incelenmeli.",
    })),
    keywords: keywordRows.map((r) => {
      const criterion = r.adGroupCriterion as Record<string, unknown> | undefined;
      const keyword = criterion?.keyword as Record<string, unknown> | undefined;
      return {
        campaignId: readNestedString(r, "campaign", "id"),
        campaignName: readNestedString(r, "campaign", "name"),
        adGroupId: readNestedString(r, "adGroup", "id"),
        adGroupName: readNestedString(r, "adGroup", "name"),
        resourceName: readNestedString(r, "adGroupCriterion", "resourceName"),
        text: keyword?.text ? String(keyword.text) : null,
        matchType: keyword?.matchType ? String(keyword.matchType) : null,
        metrics: metricShape(r),
        note: "Dusuk CTR + yuksek maliyet kombinasyonu gozden gecirilmeli.",
      };
    }),
    devices: deviceRows.map((r) => ({
      device: readNestedString(r, "segments", "device"),
      metrics: metricShape(r),
    })),
  };
}

export async function fetchGoogleAdsRecommendations(
  tenantKey: string,
  customerIdRaw: string,
  managerIdRaw?: string | null
) {
  const ctx = makeContext(customerIdRaw, managerIdRaw);
  const rows = await searchGoogleAds(
    tenantKey,
    ctx,
    `
      SELECT
        recommendation.resource_name,
        recommendation.type,
        recommendation.campaign,
        recommendation.dismissed,
        recommendation.impact
      FROM recommendation
      LIMIT 50
    `
  );

  return rows.map((r) => ({
    resourceName: readNestedString(r, "recommendation", "resourceName"),
    type: readNestedString(r, "recommendation", "type"),
    campaign: readNestedString(r, "recommendation", "campaign"),
    dismissed: (r.recommendation as Record<string, unknown> | undefined)?.dismissed ?? null,
    impact: (r.recommendation as Record<string, unknown> | undefined)?.impact ?? null,
  }));
}

export async function fetchGoogleAdsKeywords(
  tenantKey: string,
  customerIdRaw: string,
  managerIdRaw?: string | null,
  campaignFilter?: string | null
) {
  const ctx = makeContext(customerIdRaw, managerIdRaw);
  const rows = await searchGoogleAds(
    tenantKey,
    ctx,
    `
      SELECT
        campaign.id,
        campaign.name,
        ad_group.id,
        ad_group.name,
        ad_group_criterion.resource_name,
        ad_group_criterion.status,
        ad_group_criterion.keyword.text,
        ad_group_criterion.keyword.match_type,
        ad_group_criterion.quality_info.quality_score,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions
      FROM keyword_view
      WHERE ad_group_criterion.type = KEYWORD
        AND ad_group_criterion.status != 'REMOVED'
        AND segments.date DURING LAST_30_DAYS
        ${campaignNameClause(campaignFilter)}
      ORDER BY metrics.cost_micros DESC
      LIMIT 100
    `
  );

  return rows.map((r) => {
    const criterion = r.adGroupCriterion as Record<string, unknown> | undefined;
    const keyword = criterion?.keyword as Record<string, unknown> | undefined;
    const quality = criterion?.qualityInfo as Record<string, unknown> | undefined;
    return {
      campaignId: readNestedString(r, "campaign", "id"),
      campaignName: readNestedString(r, "campaign", "name"),
      adGroupId: readNestedString(r, "adGroup", "id"),
      adGroupName: readNestedString(r, "adGroup", "name"),
      resourceName: readNestedString(r, "adGroupCriterion", "resourceName"),
      status: readNestedString(r, "adGroupCriterion", "status"),
      text: keyword?.text ? String(keyword.text) : null,
      matchType: keyword?.matchType ? String(keyword.matchType) : null,
      qualityScore: quality?.qualityScore == null ? null : Number(quality.qualityScore),
      metrics: {
        impressions: readNestedNumber(r, "metrics", "impressions"),
        clicks: readNestedNumber(r, "metrics", "clicks"),
        costMicros: readNestedNumber(r, "metrics", "costMicros"),
        conversions: readNestedNumber(r, "metrics", "conversions"),
      },
    };
  });
}

async function fetchAssetGroups(tenantKey: string, ctx: GoogleAdsContext, campaignId: string) {
  const rows = await searchGoogleAds(
    tenantKey,
    ctx,
    `
      SELECT
        campaign.id,
        campaign.name,
        asset_group.resource_name,
        asset_group.id,
        asset_group.name,
        asset_group.status,
        asset_group.ad_strength,
        asset_group.primary_status,
        asset_group.primary_status_reasons,
        asset_group.final_urls
      FROM asset_group
      WHERE campaign.id = ${campaignId}
      LIMIT 50
    `
  );
  return rows.map((r) => ({
    id: readNestedString(r, "assetGroup", "id"),
    resourceName: readNestedString(r, "assetGroup", "resourceName"),
    name: readNestedString(r, "assetGroup", "name"),
    status: readNestedString(r, "assetGroup", "status"),
    adStrength: readNestedString(r, "assetGroup", "adStrength"),
    primaryStatus: readNestedString(r, "assetGroup", "primaryStatus"),
    primaryStatusReasons:
      (r.assetGroup as Record<string, unknown> | undefined)?.primaryStatusReasons ?? [],
    finalUrls: (r.assetGroup as Record<string, unknown> | undefined)?.finalUrls ?? [],
  }));
}

async function fetchAssetGroupAssets(tenantKey: string, ctx: GoogleAdsContext, assetGroupId: string) {
  const rows = await searchGoogleAds(
    tenantKey,
    ctx,
    `
      SELECT
        asset_group_asset.asset_group,
        asset_group_asset.resource_name,
        asset_group_asset.field_type,
        asset_group_asset.status,
        asset_group_asset.primary_status,
        asset_group_asset.primary_status_reasons,
        asset.resource_name,
        asset.id,
        asset.name,
        asset.type,
        asset.text_asset.text,
        asset.image_asset.full_size.url
      FROM asset_group_asset
      WHERE asset_group.id = ${assetGroupId}
        AND asset_group_asset.status != 'REMOVED'
      LIMIT 200
    `
  );
  return rows.map((r) => ({
    assetGroup: readNestedString(r, "assetGroupAsset", "assetGroup"),
    resourceName: readNestedString(r, "assetGroupAsset", "resourceName"),
    fieldType: readNestedString(r, "assetGroupAsset", "fieldType"),
    status: readNestedString(r, "assetGroupAsset", "status"),
    primaryStatus: readNestedString(r, "assetGroupAsset", "primaryStatus"),
    primaryStatusReasons:
      (r.assetGroupAsset as Record<string, unknown> | undefined)?.primaryStatusReasons ?? [],
    performanceLabel: readNestedString(r, "assetGroupAsset", "performanceLabel"),
    asset: {
      resourceName: readNestedString(r, "asset", "resourceName"),
      id: readNestedString(r, "asset", "id"),
      name: readNestedString(r, "asset", "name"),
      type: readNestedString(r, "asset", "type"),
      text: ((r.asset as Record<string, unknown> | undefined)?.textAsset as
        | Record<string, unknown>
        | undefined)?.text,
      imageUrl: (((r.asset as Record<string, unknown> | undefined)?.imageAsset as
        | Record<string, unknown>
        | undefined)?.fullSize as Record<string, unknown> | undefined)?.url,
    },
  }));
}

export async function fetchGoogleAdsAssetGroupAssets(
  tenantKey: string,
  customerIdRaw: string,
  managerIdRaw: string | null | undefined,
  assetGroupIdRaw: string
) {
  const ctx = makeContext(customerIdRaw, managerIdRaw);
  const assetGroupId = assetGroupIdRaw.trim();
  if (!/^\d+$/.test(assetGroupId)) throw new Error("assetGroupId numerik olmali");
  return fetchAssetGroupAssets(tenantKey, ctx, assetGroupId);
}

function countByFieldType(assets: Array<{ fieldType: string | null }>) {
  const counts: Record<string, number> = {};
  for (const asset of assets) {
    if (!asset.fieldType) continue;
    counts[asset.fieldType] = (counts[asset.fieldType] ?? 0) + 1;
  }
  return counts;
}

function buildAssetGroupFindings(assetGroup: Record<string, unknown>, counts: Record<string, number>) {
  const issues: string[] = [];
  const recommendations: string[] = [];
  const adStrength = String(assetGroup.adStrength ?? "");

  if (!adStrength || ["NO_ADS", "POOR", "PENDING"].includes(adStrength)) {
    issues.push(`Reklam gucu dusuk veya hazir degil: ${adStrength || "BILINMIYOR"}`);
  }
  if ((counts.HEADLINE ?? 0) < 3) issues.push("Minimum 3 kisa baslik eksik");
  if ((counts.HEADLINE ?? 0) < 11) recommendations.push("11+ kisa baslik hedefleyin");
  if ((counts.LONG_HEADLINE ?? 0) < 1) issues.push("Minimum 1 uzun baslik eksik");
  if ((counts.LONG_HEADLINE ?? 0) < 2) recommendations.push("2+ uzun baslik ekleyin");
  if ((counts.DESCRIPTION ?? 0) < 2) issues.push("Minimum 2 aciklama eksik");
  if ((counts.DESCRIPTION ?? 0) < 4) recommendations.push("4+ aciklama ekleyin");
  if ((counts.MARKETING_IMAGE ?? 0) < 1) issues.push("Yatay pazarlama gorseli eksik");
  if ((counts.SQUARE_MARKETING_IMAGE ?? 0) < 1) issues.push("Kare pazarlama gorseli eksik");
  if ((counts.LOGO ?? 0) < 1) recommendations.push("1:1 logo varligini dogrulayin");

  return { issues, recommendations };
}

/** SEARCH kampanyalari icin RSA reklam icerigi (basliklar/aciklamalar/ad_strength). */
async function fetchSearchAds(tenantKey: string, ctx: GoogleAdsContext, campaignId: string) {
  const rows = await searchGoogleAds(
    tenantKey,
    ctx,
    `
      SELECT
        ad_group.id,
        ad_group.name,
        ad_group_ad.resource_name,
        ad_group_ad.ad.id,
        ad_group_ad.ad.responsive_search_ad.headlines,
        ad_group_ad.ad.responsive_search_ad.descriptions,
        ad_group_ad.status,
        ad_group_ad.ad_strength
      FROM ad_group_ad
      WHERE campaign.id = ${campaignId}
        AND ad_group_ad.ad.type = 'RESPONSIVE_SEARCH_AD'
        AND ad_group_ad.status != 'REMOVED'
      LIMIT 50
    `
  );
  return rows.map((r) => {
    const aga = (r.adGroupAd as Record<string, any>) || {};
    const rsa = (aga.ad?.responsiveSearchAd as Record<string, any>) || {};
    const adGroup = (r.adGroup as Record<string, any>) || {};
    return {
      adGroupId: adGroup.id ?? null,
      adGroupName: adGroup.name ?? null,
      resourceName: aga.resourceName ?? null,
      adId: aga.ad?.id ?? null,
      status: aga.status ?? null,
      adStrength: aga.adStrength ?? null,
      headlines: (rsa.headlines || []).map((h: any) => ({ text: h.text, pinnedField: h.pinnedField ?? null })),
      descriptions: (rsa.descriptions || []).map((d: any) => ({ text: d.text, pinnedField: d.pinnedField ?? null })),
    };
  });
}

/** Kampanya seviyesi marka varliklari (logo / isletme adi). Brand Guidelines'ta gorunmeyebilir. */
async function fetchCampaignBrandAssets(tenantKey: string, ctx: GoogleAdsContext, campaignId: string) {
  const rows = await searchGoogleAds(
    tenantKey,
    ctx,
    `
      SELECT
        campaign_asset.field_type,
        campaign_asset.status,
        asset.image_asset.full_size.url,
        asset.text_asset.text
      FROM campaign_asset
      WHERE campaign.id = ${campaignId}
        AND campaign_asset.status != 'REMOVED'
        AND campaign_asset.field_type IN ('LOGO','LANDSCAPE_LOGO','BUSINESS_NAME')
    `
  );
  return rows.map((r) => {
    const ca = (r.campaignAsset as Record<string, any>) || {};
    const asset = (r.asset as Record<string, any>) || {};
    return {
      fieldType: ca.fieldType ?? null,
      status: ca.status ?? null,
      imageUrl: asset.imageAsset?.fullSize?.url ?? null,
      text: asset.textAsset?.text ?? null,
    };
  });
}

export async function fetchGoogleAdsAudit(
  tenantKey: string,
  customerIdRaw: string,
  managerIdRaw?: string | null,
  campaignFilter?: string | null
) {
  const ctx = makeContext(customerIdRaw, managerIdRaw);
  const campaigns = await fetchGoogleAdsCampaigns(tenantKey, customerIdRaw, managerIdRaw, campaignFilter);
  const auditedCampaigns: Array<Record<string, unknown>> = [];

  for (const campaign of campaigns) {
    const campaignId = campaign.id;
    const channel = String(campaign.channelType || "");
    if (!campaignId) {
      auditedCampaigns.push({ ...campaign, assetGroups: [], searchAds: [], brandAssets: [], audit: { issues: [], recommendations: [] } });
      continue;
    }

    try {
      const enrichedAssetGroups: Array<Record<string, unknown> & { audit: { issues: string[]; recommendations: string[] } }> = [];
      let searchAds: Array<Record<string, unknown>> = [];

      if (channel === "PERFORMANCE_MAX") {
        const assetGroups = await fetchAssetGroups(tenantKey, ctx, campaignId);
        for (const assetGroup of assetGroups) {
          const assetGroupId = String(assetGroup.id ?? "");
          const assets = assetGroupId ? await fetchAssetGroupAssets(tenantKey, ctx, assetGroupId) : [];
          const counts = countByFieldType(assets);
          const findings = buildAssetGroupFindings(assetGroup, counts);
          enrichedAssetGroups.push({ ...assetGroup, assets, counts, audit: findings });
        }
      } else if (channel === "SEARCH") {
        searchAds = await fetchSearchAds(tenantKey, ctx, campaignId);
      }

      const brandAssets = await fetchCampaignBrandAssets(tenantKey, ctx, campaignId).catch(() => []);

      auditedCampaigns.push({
        ...campaign,
        assetGroups: enrichedAssetGroups,
        searchAds,
        brandAssets,
        audit: {
          issues: enrichedAssetGroups.flatMap((g) => g.audit.issues),
          recommendations: enrichedAssetGroups.flatMap((g) => g.audit.recommendations),
        },
      });
    } catch (err) {
      auditedCampaigns.push({
        ...campaign,
        assetGroups: [],
        searchAds: [],
        brandAssets: [],
        audit: { issues: [`İçerik okunamadi: ${(err as Error).message}`], recommendations: [] },
      });
    }
  }

  return {
    fetchedAt: new Date().toISOString(),
    customerId: ctx.customerId,
    campaigns: auditedCampaigns,
  };
}

function clip(text: string, max: number) {
  return text.length <= max ? text : text.slice(0, max).trim();
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function requireResourceName(value: string, label: string) {
  const resourceName = value.trim();
  if (!resourceName.startsWith("customers/")) {
    throw new Error(`${label} resourceName gecersiz`);
  }
  return resourceName;
}

function requireMicros(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${label} pozitif sayi olmali`);
  return Math.round(value);
}

function cleanBase64ImageData(value: string) {
  const trimmed = value.trim();
  const data = trimmed.includes(",") ? trimmed.split(",").pop() ?? "" : trimmed;
  if (!data || !/^[A-Za-z0-9+/=]+$/.test(data)) throw new Error("imageBase64 gecersiz");
  return data;
}

function requireUrl(value: string) {
  const url = value.trim();
  if (!/^https?:\/\/[^ ]+\.[^ ]+/.test(url)) throw new Error("finalUrl gecersiz");
  return url;
}

export function buildCampaignStatusChangePayload(input: {
  campaignResourceName: string;
  status: "ENABLED" | "PAUSED";
}) {
  const campaignResourceName = requireResourceName(input.campaignResourceName, "campaign");
  const payload: GoogleAdsChangeSetPayload = {
    kind: "campaign_status_update",
    campaignResourceName,
    updateMask: "status",
    notes:
      input.status === "PAUSED"
        ? "Kampanya duraklatma taslagi. Canli uygulama validate ve kullanici onayi gerektirir."
        : "Kampanya etkinlestirme taslagi. Canli uygulama validate ve kullanici onayi gerektirir.",
    operations: [
      {
        campaignOperation: {
          update: {
            resourceName: campaignResourceName,
            status: input.status,
          },
          updateMask: "status",
        },
      },
    ],
  };
  return payload;
}

export function buildCampaignBudgetChangePayload(input: {
  campaignResourceName: string;
  campaignBudgetResourceName: string;
  amountMicros: number;
}) {
  const campaignResourceName = requireResourceName(input.campaignResourceName, "campaign");
  const campaignBudgetResourceName = requireResourceName(input.campaignBudgetResourceName, "campaignBudget");
  const amountMicros = requireMicros(input.amountMicros, "amountMicros");
  const payload: GoogleAdsChangeSetPayload = {
    kind: "campaign_budget_update",
    campaignResourceName,
    campaignBudgetResourceName,
    updateMask: "amount_micros",
    notes: "Kampanya butce guncelleme taslagi. Canli uygulama validate ve kullanici onayi gerektirir.",
    operations: [
      {
        campaignBudgetOperation: {
          update: {
            resourceName: campaignBudgetResourceName,
            amountMicros,
          },
          updateMask: "amount_micros",
        },
      },
    ],
  };
  return payload;
}

export function buildCampaignBiddingChangePayload(input: {
  campaignResourceName: string;
  bidding: GoogleAdsBiddingDraftInput;
}) {
  const campaignResourceName = requireResourceName(input.campaignResourceName, "campaign");
  const campaignUpdate: Record<string, unknown> = { resourceName: campaignResourceName };
  let updateMask = "";
  let label = "";

  if (input.bidding.strategy === "MANUAL_CPC") {
    campaignUpdate.manualCpc = { enhancedCpcEnabled: input.bidding.enhancedCpcEnabled ?? true };
    updateMask = "manual_cpc.enhanced_cpc_enabled";
    label = "Manual CPC";
  } else if (input.bidding.strategy === "MAXIMIZE_CONVERSIONS") {
    campaignUpdate.maximizeConversions = {};
    updateMask = "maximize_conversions";
    label = "Maximize Conversions";
  } else if (input.bidding.strategy === "TARGET_ROAS") {
    if (!Number.isFinite(input.bidding.targetRoas) || input.bidding.targetRoas <= 0) {
      throw new Error("targetRoas pozitif sayi olmali");
    }
    campaignUpdate.targetRoas = { targetRoas: input.bidding.targetRoas };
    updateMask = "target_roas.target_roas";
    label = `Target ROAS ${input.bidding.targetRoas}`;
  } else {
    campaignUpdate.targetCpa = { targetCpaMicros: requireMicros(input.bidding.targetCpaMicros, "targetCpaMicros") };
    updateMask = "target_cpa.target_cpa_micros";
    label = `Target CPA ${input.bidding.targetCpaMicros} micros`;
  }

  const payload: GoogleAdsChangeSetPayload = {
    kind: "campaign_bidding_update",
    campaignResourceName,
    updateMask,
    notes: `Kampanya bidding guncelleme taslagi: ${label}. Canli uygulama validate ve kullanici onayi gerektirir.`,
    operations: [
      {
        campaignOperation: {
          update: campaignUpdate,
          updateMask,
        },
      },
    ],
  };
  return payload;
}

export function buildCampaignRemovePayload(input: {
  campaignResourceName: string;
}) {
  const campaignResourceName = requireResourceName(input.campaignResourceName, "campaign");
  const payload: GoogleAdsChangeSetPayload = {
    kind: "campaign_remove",
    campaignResourceName,
    notes: "Kampanya REMOVE taslagi. Bu islem geri alinamaz; canli uygulama validate ve cift kullanici onayi gerektirir.",
    operations: [
      {
        campaignOperation: {
          remove: campaignResourceName,
        },
      },
    ],
  };
  return payload;
}

export function buildKeywordStatusChangePayload(input: {
  adGroupCriterionResourceName: string;
  status: "ENABLED" | "PAUSED";
}) {
  const adGroupCriterionResourceName = requireResourceName(input.adGroupCriterionResourceName, "adGroupCriterion");
  const payload: GoogleAdsChangeSetPayload = {
    kind: "keyword_status_update",
    adGroupCriterionResourceName,
    updateMask: "status",
    notes:
      input.status === "PAUSED"
        ? "Keyword duraklatma taslagi. Canli uygulama validate ve kullanici onayi gerektirir."
        : "Keyword etkinlestirme taslagi. Canli uygulama validate ve kullanici onayi gerektirir.",
    operations: [
      {
        adGroupCriterionOperation: {
          update: {
            resourceName: adGroupCriterionResourceName,
            status: input.status,
          },
          updateMask: "status",
        },
      },
    ],
  };
  return payload;
}

export function buildImageAssetCreatePayload(input: {
  customerId: string;
  assetGroupResourceName?: string | null;
  name: string;
  imageBase64: string;
  fieldType?: string | null;
}) {
  const customerId = normalizeCustomerId(input.customerId);
  const assetGroupResourceName = input.assetGroupResourceName
    ? requireResourceName(input.assetGroupResourceName, "assetGroup")
    : null;
  const name = clip(input.name.trim(), 255);
  if (!name) throw new Error("asset name zorunlu");
  const fieldType = input.fieldType?.trim() || "MARKETING_IMAGE";
  const assetResourceName = `customers/${customerId}/assets/-1`;
  const operations: GoogleAdsOperation[] = [
    {
      assetOperation: {
        create: {
          resourceName: assetResourceName,
          name,
          type: "IMAGE",
          imageAsset: {
            data: cleanBase64ImageData(input.imageBase64),
          },
        },
      },
    },
  ];

  if (assetGroupResourceName) {
    operations.push({
      assetGroupAssetOperation: {
        create: {
          assetGroup: assetGroupResourceName,
          asset: assetResourceName,
          fieldType,
        },
      },
    });
  }

  const payload: GoogleAdsChangeSetPayload = {
    kind: "image_asset_create",
    assetGroupResourceName: assetGroupResourceName ?? undefined,
    assetResourceName,
    fieldType,
    notes: assetGroupResourceName
      ? `Gorsel asset olusturup asset group'a ${fieldType} olarak baglama taslagi.`
      : "Gorsel asset olusturma taslagi.",
    operations,
  };
  return payload;
}

export function buildAssetGroupAssetRemovePayload(input: {
  assetGroupAssetResourceName: string;
  assetName?: string | null;
  fieldType?: string | null;
}) {
  const resourceName = input.assetGroupAssetResourceName.trim();
  if (!resourceName) throw new Error("assetGroupAssetResourceName zorunlu");
  const payload: GoogleAdsChangeSetPayload = {
    kind: "asset_group_asset_remove",
    assetGroupAssetResourceName: resourceName,
    fieldType: input.fieldType ?? undefined,
    notes: `Asset group baglantisi kaldirma taslagi${input.assetName ? `: ${input.assetName}` : ""}.`,
    operations: [{ assetGroupAssetOperation: { remove: resourceName } }],
  };
  return payload;
}

export function buildSearchCampaignCreatePayload(input: {
  customerId: string;
  spec: GoogleAdsSearchCampaignCreateSpec;
}) {
  const customerId = normalizeCustomerId(input.customerId);
  const name = clip(input.spec.name.trim(), 128);
  if (!name) throw new Error("campaign name zorunlu");
  const dailyBudgetMicros = requireMicros(input.spec.dailyBudgetMicros, "dailyBudgetMicros");
  const finalUrl = requireUrl(input.spec.finalUrl);
  const headlines = unique(input.spec.headlines || []).map((text) => clip(text, 30)).filter(Boolean).slice(0, 15);
  const descriptions = unique(input.spec.descriptions || []).map((text) => clip(text, 90)).filter(Boolean).slice(0, 4);
  if (headlines.length < 3) throw new Error("En az 3 headline zorunlu");
  if (descriptions.length < 2) throw new Error("En az 2 description zorunlu");

  const budgetResourceName = `customers/${customerId}/campaignBudgets/-1`;
  const campaignResourceName = `customers/${customerId}/campaigns/-2`;
  const adGroupResourceName = `customers/${customerId}/adGroups/-3`;
  const operations: GoogleAdsOperation[] = [
    {
      campaignBudgetOperation: {
        create: {
          resourceName: budgetResourceName,
          name: `${name} Budget`,
          amountMicros: dailyBudgetMicros,
          deliveryMethod: "STANDARD",
          explicitlyShared: false,
        },
      },
    },
    {
      campaignOperation: {
        create: {
          resourceName: campaignResourceName,
          name,
          status: "PAUSED",
          advertisingChannelType: "SEARCH",
          campaignBudget: budgetResourceName,
          ...(input.spec.bidding?.strategy === "MANUAL_CPC"
            ? { manualCpc: { enhancedCpcEnabled: true } }
            : { maximizeConversions: {} }),
          networkSettings: {
            targetGoogleSearch: true,
            targetSearchNetwork: true,
            targetContentNetwork: false,
            targetPartnerSearchNetwork: false,
          },
        },
      },
    },
    {
      adGroupOperation: {
        create: {
          resourceName: adGroupResourceName,
          campaign: campaignResourceName,
          name: clip(input.spec.adGroupName?.trim() || `${name} Ad Group`, 128),
          status: "PAUSED",
          type: "SEARCH_STANDARD",
          cpcBidMicros:
            input.spec.bidding?.strategy === "MANUAL_CPC"
              ? requireMicros(input.spec.bidding.cpcBidMicros || 1_000_000, "cpcBidMicros")
              : undefined,
        },
      },
    },
    {
      adGroupAdOperation: {
        create: {
          adGroup: adGroupResourceName,
          status: "PAUSED",
          ad: {
            finalUrls: [finalUrl],
            responsiveSearchAd: {
              headlines: headlines.map((text) => ({ text })),
              descriptions: descriptions.map((text) => ({ text })),
            },
          },
        },
      },
    },
  ];

  for (const keyword of unique(input.spec.keywords || []).slice(0, 50)) {
    operations.push({
      adGroupCriterionOperation: {
        create: {
          adGroup: adGroupResourceName,
          status: "PAUSED",
          keyword: {
            text: clip(keyword, 80),
            matchType: "PHRASE",
          },
        },
      },
    });
  }

  for (const locationId of unique(input.spec.locationIds || []).slice(0, 20)) {
    if (!/^\d+$/.test(locationId)) throw new Error("locationIds sadece numerik geo target ID icermeli");
    operations.push({
      campaignCriterionOperation: {
        create: {
          campaign: campaignResourceName,
          location: {
            geoTargetConstant: `geoTargetConstants/${locationId}`,
          },
        },
      },
    });
  }

  for (const languageId of unique(input.spec.languageIds || []).slice(0, 10)) {
    if (!/^\d+$/.test(languageId)) throw new Error("languageIds sadece numerik language constant ID icermeli");
    operations.push({
      campaignCriterionOperation: {
        create: {
          campaign: campaignResourceName,
          language: {
            languageConstant: `languageConstants/${languageId}`,
          },
        },
      },
    });
  }

  const payload: GoogleAdsChangeSetPayload = {
    kind: "search_campaign_create",
    campaignResourceName,
    campaignBudgetResourceName: budgetResourceName,
    notes: "PAUSED Search kampanya olusturma taslagi. Canli uygulama validate ve kullanici onayi gerektirir.",
    manualSteps: [
      "Validate sonucunu kontrol et",
      "Kampanya PAUSED olusacagi icin yayina almadan once ayarlari manuel gozden gecir",
      "Keyword, hedef URL ve butceyi Google Ads panelinde son kez dogrula",
    ],
    operations,
  };
  return payload;
}

function buildTextAssetOperations(
  customerId: string,
  assetGroupResourceName: string,
  textAssets: NonNullable<GoogleAdsChangeSetPayload["textAssets"]>
) {
  let tempId = -1;
  const operations: GoogleAdsOperation[] = [];
  const addTextAsset = (fieldType: string, text: string) => {
    const resourceName = `customers/${customerId}/assets/${tempId--}`;
    operations.push({
      assetOperation: {
        create: {
          resourceName,
          textAsset: { text },
        },
      },
    });
    operations.push({
      assetGroupAssetOperation: {
        create: {
          assetGroup: assetGroupResourceName,
          asset: resourceName,
          fieldType,
        },
      },
    });
  };

  for (const text of textAssets.headlines ?? []) addTextAsset("HEADLINE", clip(text, 30));
  for (const text of textAssets.longHeadlines ?? []) addTextAsset("LONG_HEADLINE", clip(text, 90));
  for (const text of textAssets.descriptions ?? []) addTextAsset("DESCRIPTION", clip(text, 90));
  if (textAssets.businessName) addTextAsset("BUSINESS_NAME", clip(textAssets.businessName, 25));

  return operations;
}

/** SEARCH kampanyasinda mevcut bir reklam grubuna YENI (PAUSED) RSA ekleyen change-set. */
export function buildSearchRsaCreatePayload(input: {
  customerId: string;
  adGroupResourceName: string;
  finalUrl: string;
  headlines: string[];
  descriptions: string[];
  path1?: string;
  path2?: string;
  notes?: string;
}): GoogleAdsChangeSetPayload {
  const adGroupResourceName = requireResourceName(input.adGroupResourceName, "adGroup");
  const headlines = unique(input.headlines || []).map((t) => clip(t, 30)).filter(Boolean).slice(0, 15);
  const descriptions = unique(input.descriptions || []).map((t) => clip(t, 90)).filter(Boolean).slice(0, 4);
  if (headlines.length < 3) throw new Error("RSA icin en az 3 baslik zorunlu");
  if (descriptions.length < 2) throw new Error("RSA icin en az 2 aciklama zorunlu");
  const finalUrl = input.finalUrl.trim();
  if (!/^https?:\/\//.test(finalUrl)) throw new Error("Gecerli finalUrl zorunlu (https://...)");

  const ad: Record<string, unknown> = {
    finalUrls: [finalUrl],
    responsiveSearchAd: {
      headlines: headlines.map((text) => ({ text })),
      descriptions: descriptions.map((text) => ({ text })),
      ...(input.path1 ? { path1: clip(input.path1, 15) } : {}),
      ...(input.path2 ? { path2: clip(input.path2, 15) } : {}),
    },
  };

  return {
    kind: "search_rsa_create",
    notes: input.notes,
    operations: [
      { adGroupAdOperation: { create: { adGroup: adGroupResourceName, status: "PAUSED", ad } } },
    ],
  };
}

export function buildTextAssetChangePayload(input: {
  customerId: string;
  assetGroupResourceName: string;
  textAssets: NonNullable<GoogleAdsChangeSetPayload["textAssets"]>;
  notes?: string;
}) {
  const assetGroupResourceName = requireResourceName(input.assetGroupResourceName, "assetGroup");
  const payload: GoogleAdsChangeSetPayload = {
    kind: "performance_max_text_asset_plan",
    assetGroupResourceName,
    notes: input.notes || "Google Ads metin asset taslagi. Canli uygulama validate ve kullanici onayi gerektirir.",
    textAssets: input.textAssets,
    operations: buildTextAssetOperations(normalizeCustomerId(input.customerId), assetGroupResourceName, input.textAssets),
  };
  return payload;
}

export function buildVistaSeedsPmaxPlan(input: {
  customerId: string;
  campaignResourceName?: string | null;
  campaignName?: string | null;
  assetGroupResourceName?: string | null;
}) {
  const textAssets = {
    headlines: unique([
      "Vista Seeds",
      "Sebze Tohumları",
      "Biber Tohumu",
      "Domates Tohumu",
      "Üreticiye Güven",
      "Yüksek Çimlenme",
      "Kaliteli Sebze Tohumu",
      "Antalya'dan Tohum",
      "Yeni Sezon Tohumları",
      "Tarımda Güçlü Başlangıç",
      "Profesyonel Tohum",
    ]).map((v) => clip(v, 30)),
    longHeadlines: unique([
      "Vista Seeds ile sebze üretiminde güçlü ve verimli bir başlangıç yapın",
      "Profesyonel üreticiler için seçilmiş sebze tohumu çözümleri",
      "Biber ve sebze tohumu ihtiyaçlarınız için Vista Seeds yanınızda",
    ]).map((v) => clip(v, 90)),
    descriptions: unique([
      "Biber ve sebze tohumu çeşitlerini güvenilir Vista Seeds deneyimiyle keşfedin.",
      "Antalya merkezli hizmet, üretici odaklı destek ve kaliteli tohum seçenekleri.",
      "Yeni sezon sebze tohumu ihtiyaçlarınız için Vista Seeds ile iletişime geçin.",
      "Bahçeniz ve üretiminiz için uygun tohum seçeneklerini hemen inceleyin.",
    ]).map((v) => clip(v, 90)),
    businessName: "Vista Seeds",
  };

  const imageChecklist = [
    "4+ yatay urun/sera/tarla gorseli: onerilen 1200x628, minimum 600x314",
    "4+ kare ozgun gorsel: onerilen 1200x1200, minimum 300x300",
    "2+ dikey gorsel: onerilen 960x1200, minimum 480x600",
    "1 adet 1:1 logo ve mumkunse 1 adet 4:1 yatay logo",
    "Stok gorsel, agir metin bindirme ve tekrar eden gorsellerden kacin",
  ];

  const payload: GoogleAdsChangeSetPayload = {
    kind: "performance_max_text_asset_plan",
    campaignResourceName: input.campaignResourceName ?? undefined,
    assetGroupResourceName: input.assetGroupResourceName ?? undefined,
    notes:
      "VistaSeeds Performance Max kampanyasinda reklam gucunu artirmak ve 'yetersiz orijinal icerik' riskini azaltmak icin metin + gorsel plan.",
    textAssets,
    imageChecklist,
    manualSteps: [
      "Landing page icerigini kampanya vaadiyle eslestir",
      "Ozgun VistaSeeds urun, sera ve ambalaj gorsellerini yukle",
      "Politika incelemesi tamamlanana kadar kampanya durumunu takip et",
    ],
  };

  if (input.assetGroupResourceName) {
    payload.operations = buildTextAssetChangePayload({
      customerId: input.customerId,
      assetGroupResourceName: input.assetGroupResourceName,
      textAssets,
    }).operations;
  }

  return {
    title: `VistaSeeds PMax asset düzeltme planı${input.campaignName ? ` — ${input.campaignName}` : ""}`,
    payload,
  };
}

export function validateChangeSetPayload(payload: GoogleAdsChangeSetPayload) {
  const errors: string[] = [];
  if (!payload.kind) errors.push("payload.kind zorunlu");
  if (payload.kind === "performance_max_text_asset_plan") {
    if (!payload.assetGroupResourceName) {
      errors.push("Metin asset operasyonlari icin assetGroupResourceName zorunlu");
    }
    if (!payload.operations?.length) {
      errors.push("Uygulanabilir Google Ads operasyonu bulunamadi");
    }
  }
  if (
    payload.kind === "campaign_status_update" ||
    payload.kind === "campaign_budget_update" ||
    payload.kind === "campaign_bidding_update" ||
    payload.kind === "campaign_remove"
  ) {
    if (!payload.campaignResourceName) errors.push("campaignResourceName zorunlu");
    if (!payload.operations?.length) errors.push("Uygulanabilir Google Ads operasyonu bulunamadi");
  }
  if (payload.kind === "campaign_budget_update") {
    if (!payload.campaignBudgetResourceName) errors.push("campaignBudgetResourceName zorunlu");
  }
  if (payload.kind === "keyword_status_update") {
    if (!payload.adGroupCriterionResourceName) errors.push("adGroupCriterionResourceName zorunlu");
    if (!payload.operations?.length) errors.push("Uygulanabilir Google Ads operasyonu bulunamadi");
  }
  if (payload.kind === "image_asset_create") {
    if (!payload.operations?.length) errors.push("Uygulanabilir Google Ads operasyonu bulunamadi");
  }
  if (payload.kind === "asset_group_asset_remove") {
    if (!payload.assetGroupAssetResourceName) errors.push("assetGroupAssetResourceName zorunlu");
    if (!payload.operations?.length) errors.push("Uygulanabilir Google Ads operasyonu bulunamadi");
  }
  if (payload.kind === "search_campaign_create") {
    if (!payload.operations?.length) errors.push("Uygulanabilir Google Ads operasyonu bulunamadi");
    if (!payload.campaignResourceName) errors.push("campaignResourceName zorunlu");
    if (!payload.campaignBudgetResourceName) errors.push("campaignBudgetResourceName zorunlu");
  }
  if (payload.kind === "search_rsa_create") {
    if (!payload.operations?.length) errors.push("Uygulanabilir Google Ads operasyonu bulunamadi");
  }
  return { ok: errors.length === 0, errors };
}
