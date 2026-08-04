// Ekosistem modulleri artik goldmoodastro'nun KENDI backend'ine entegre
// (backend/src/social). Admin-only rotalar: /api/admin/social/*.
// Auth: goldmoodastro admin JWT (Bearer, localStorage mh_access_token) — ekosistem
// cookie auth'u DEGIL. Tek tenant (goldmoodastro), tenantKey backend'de sabit.
const GM_API = (process.env.NEXT_PUBLIC_API_URL || "/api").replace(/\/$/, "");
const API_URL = `${GM_API}/admin/social`;
export const API_ORIGIN = GM_API.replace(/\/api$/, "");

function authHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const t =
    window.localStorage.getItem("mh_access_token") ||
    window.localStorage.getItem("access_token") ||
    "";
  return t ? { Authorization: `Bearer ${t}` } : {};
}

function normalizeApiError(err: unknown, status: number): string {
  if (typeof err === "string" && err.trim()) return err;
  if (err && typeof err === "object") {
    const maybeError = (err as { error?: unknown }).error;
    if (typeof maybeError === "string" && maybeError.trim()) return maybeError;
    if (maybeError && typeof maybeError === "object") {
      const nestedMessage = (maybeError as { message?: unknown }).message;
      if (typeof nestedMessage === "string" && nestedMessage.trim()) return nestedMessage;
    }
    const maybeMessage = (err as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) return maybeMessage;
  }
  return `API hatasi: ${status}`;
}

async function fetcher<T>(path: string, options?: RequestInit): Promise<T> {
  const headers =
    options?.body instanceof FormData
      ? { ...authHeader(), ...options?.headers }
      : options?.body
        ? { "Content-Type": "application/json", ...authHeader(), ...options?.headers }
        : { ...authHeader(), ...options?.headers };

  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers,
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(normalizeApiError(err, res.status));
  }
  return res.json();
}


// ... existing auth, posts, templates, tenants ...
// (I will use multi_replace if needed, but for now let's just append)

export const siteSettings = {
  list: (params?: any) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetcher<{ items: any[] }>(`/site-settings${qs}`);
  },
  get: (key: string, locale: string = "tr") => 
    fetcher<any>(`/site-settings/${key}?locale=${locale}`),
  upsert: (data: { key: string; value: any; locale?: string; group?: string }) =>
    fetcher<any>("/admin/site-settings", { method: "POST", body: JSON.stringify(data) }),
  delete: (key: string, locale: string = "tr") =>
    fetcher<any>(`/admin/site-settings/${key}?locale=${locale}`, { method: "DELETE" }),
};

export const storage = {
  upload: (
    file: File,
    folder: string = "logo",
    bucket: string = "public",
    metadata?: Record<string, string | number | boolean>
  ) => {
    const formData = new FormData();
    formData.append("file", file, file.name);
    formData.append("bucket", bucket);
    if (folder) formData.append("folder", folder);
    if (metadata) formData.append("metadata", JSON.stringify(metadata));
    return fetcher<any>("/admin/storage/assets", {
      method: "POST",
      body: formData,
    });
  },
  list: async (params?: any) => {
    const cleanEntries = Object.entries(params ?? {}).filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    );
    const qs = cleanEntries.length
      ? "?" + new URLSearchParams(cleanEntries.map(([key, value]) => [key, String(value)])).toString()
      : "";
    const data = await fetcher<any>(`/admin/storage/assets${qs}`);
    if (Array.isArray(data)) return { items: data, total: data.length };
    return {
      items: Array.isArray(data?.items) ? data.items : [],
      total: Number(data?.total ?? data?.items?.length ?? 0),
    };
  },
};

// ─── Auth ────────────────────────────────────────────────────
export const auth = {
  login: (email: string, password: string) =>
    fetcher<{ access_token: string; user: any }>("/auth/token", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  refresh: () =>
    fetcher<{ access_token: string }>("/auth/token/refresh", { method: "POST" }),
  me: () => fetcher<any>("/auth/user"),
  status: () => fetcher<{ authenticated: boolean; user?: any }>("/auth/status"),
  logout: () =>
    fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" }),
  updateProfile: (data: any) =>
    fetcher<any>("/auth/user", { method: "PUT", body: JSON.stringify(data) }),
};

export const userAdmin = {
  bootstrapStatus: () => fetcher<{ canBootstrap: boolean; total: number }>("/users/bootstrap-status"),
  bootstrap: (data: { email: string; password: string; fullName?: string; phone?: string }) =>
    fetcher<any>("/users/bootstrap", { method: "POST", body: JSON.stringify(data) }),
  list: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetcher<{ items: any[]; total: number; limit: number; offset: number }>(`/users${qs}`);
  },
  create: (data: any) => fetcher<any>("/users", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    fetcher<any>(`/users/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(data) }),
  setPassword: (id: string, password: string) =>
    fetcher<{ ok: boolean }>(`/users/${encodeURIComponent(id)}/password`, {
      method: "POST",
      body: JSON.stringify({ password }),
    }),
  delete: (id: string) => fetcher<{ ok: boolean }>(`/users/${encodeURIComponent(id)}`, { method: "DELETE" }),
};

// ─── Posts ───────────────────────────────────────────────────
export const posts = {
  list: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return fetcher<{ items: any[]; total: number }>(`/posts${qs}`);
  },
  get: (id: number) => fetcher<any>(`/posts/${id}`),
  details: (id: number, refresh = false) =>
    fetcher<any>(`/posts/${id}/details${refresh ? "?refresh=1" : ""}`),
  create: (data: any) =>
    fetcher<any>("/posts", { method: "POST", body: JSON.stringify(data) }),
  uploadImage: (file: File) => {
    const fd = new FormData();
    fd.append("file", file, file.name);
    return fetcher<{ url: string; path: string }>("/posts/upload-image", { method: "POST", body: fd });
  },
  createXThread: (data: {
    tenantKey: string;
    postType?: string;
    title?: string;
    parts: Array<{ text: string; mediaUrls?: string[] }>;
    hashtags?: string;
    scheduledAt?: string;
    sourceType?: string;
    sourceRef?: string;
    notes?: string;
  }) => fetcher<any>("/posts/x/thread", { method: "POST", body: JSON.stringify(data) }),
  xInbox: (tenantKey: string, limit = 50) =>
    fetcher<{ items: any[] }>(`/posts/x/inbox?tenantKey=${encodeURIComponent(tenantKey)}&limit=${limit}`),
  syncXMentions: (tenantKey: string) =>
    fetcher<any>("/posts/x/mentions/sync", { method: "POST", body: JSON.stringify({ tenantKey }) }),
  xOwnTweets: (tenantKey: string, limit = 50) =>
    fetcher<{ items: any[] }>(`/posts/x/own-tweets?tenantKey=${encodeURIComponent(tenantKey)}&limit=${limit}`),
  syncXOwnTweets: (tenantKey: string) =>
    fetcher<any>("/posts/x/own-tweets/sync", { method: "POST", body: JSON.stringify({ tenantKey }) }),
  updateXReplyDraft: (commentId: number, data: { draft?: string; status?: string | null }) =>
    fetcher<any>(`/posts/x/comments/${commentId}/draft`, { method: "PATCH", body: JSON.stringify(data) }),
  publishXReply: (commentId: number, text?: string) =>
    fetcher<any>(`/posts/x/comments/${commentId}/reply`, {
      method: "POST",
      body: JSON.stringify(text ? { text } : {}),
    }),
  update: (id: number, data: any) =>
    fetcher<any>(`/posts/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: number) =>
    fetcher<any>(`/posts/${id}`, { method: "DELETE" }),
  schedule: (id: number, scheduledAt: string) =>
    fetcher<any>(`/posts/${id}/schedule`, {
      method: "POST",
      body: JSON.stringify({ scheduledAt }),
    }),
  publishNow: (id: number) =>
    fetcher<any>(`/posts/${id}/publish-now`, { method: "POST" }),
  refreshMetrics: (id: number) =>
    fetcher<any>(`/posts/${id}/refresh-metrics`, { method: "POST" }),
  startAutoEdit: (id: number, data?: { targetDurationSec?: number; contentStyle?: string }) =>
    fetcher<{ jobId: string; status: string }>(`/posts/${id}/auto-edit`, {
      method: "POST",
      body: JSON.stringify(data ?? {}),
    }),
  autoEditStatus: (id: number) =>
    fetcher<any>(`/posts/${id}/auto-edit/status`),
  approveAutoEdit: (id: number) =>
    fetcher<any>(`/posts/${id}/auto-edit/approve`, { method: "POST" }),
  retryAutoEdit: (id: number, data?: { targetDurationSec?: number; contentStyle?: string }) =>
    fetcher<{ jobId: string; status: string }>(`/posts/${id}/auto-edit/retry`, {
      method: "POST",
      body: JSON.stringify(data ?? {}),
    }),
  cancel: (id: number) =>
    fetcher<any>(`/posts/${id}/cancel`, { method: "POST" }),
  duplicate: (id: number) =>
    fetcher<any>(`/posts/${id}/duplicate`, { method: "POST" }),
  queue: () => fetcher<{ items: any[] }>("/posts/queue"),
  stats: (tenantKey?: string) =>
    fetcher<Record<string, number>>(
      `/posts/stats${tenantKey ? `?tenantKey=${encodeURIComponent(tenantKey)}` : ""}`
    ),
};

// ─── Templates ──────────────────────────────────────────────
export const templates = {
  list: (tenantKey?: string) =>
    fetcher<{ items: any[] }>(
      `/templates${tenantKey ? `?tenantKey=${encodeURIComponent(tenantKey)}` : ""}`
    ),
  get: (id: number) => fetcher<any>(`/templates/${id}`),
  create: (data: any) =>
    fetcher<any>("/templates", { method: "POST", body: JSON.stringify(data) }),
  generate: (
    id: number,
    variables: Record<string, string>,
    opts?: { platform?: string; scheduledAt?: string },
  ) =>
    fetcher<any>(`/templates/${id}/generate`, {
      method: "POST",
      body: JSON.stringify({ variables, ...(opts || {}) }),
    }),
};

// De-tenant: goldmoodastro tek tenant. Tenants modulu backend'e portlanmadi;
// istemci tarafinda tek sabit tenant dondururuz (tenant switcher devre disi).
const GOLDMOOD_TENANT_ROW = {
  key: "goldmoodastro",
  name: "GoldMoodAstro",
  websiteUrl: "https://goldmoodastro.com",
  isActive: 1,
  branding: { appName: "GoldMoodAstro" },
};
export const tenants = {
  list: async () => ({ items: [GOLDMOOD_TENANT_ROW] as any[] }),
  get: async (_tenantKey: string) => GOLDMOOD_TENANT_ROW as any,
};

export const tenantAdmin = {
  onboard: (data: {
    key: string;
    name: string;
    websiteUrl?: string;
    appName?: string;
    loginSubtitle?: string;
    defaultHashtags?: string;
  }) =>
    fetcher<any>("/tenants/admin/onboard", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateProfile: (tenantKey: string, data: Record<string, unknown>) =>
    fetcher<any>(`/tenants/admin/${encodeURIComponent(tenantKey)}/profile`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  getSourceDb: (tenantKey: string) =>
    fetcher<any>(`/tenants/admin/${encodeURIComponent(tenantKey)}/source-db`),
  saveSourceDb: (tenantKey: string, data: Record<string, unknown>) =>
    fetcher<any>(`/tenants/admin/${encodeURIComponent(tenantKey)}/source-db`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  testSourceDb: (tenantKey: string, data?: Record<string, unknown>) =>
    fetcher<any>(`/tenants/admin/${encodeURIComponent(tenantKey)}/source-db/test`, {
      method: "POST",
      body: JSON.stringify(data ?? {}),
    }),
};

export const tenantSettings = {
  get: (tenantKey: string, namespace: string) =>
    fetcher<{ tenantKey: string; namespace: string; items: any[] }>(
      `/admin/tenant-settings?tenantKey=${encodeURIComponent(tenantKey)}&namespace=${encodeURIComponent(namespace)}`
    ),
  save: (tenantKey: string, namespace: string, values: Record<string, unknown>) =>
    fetcher<{ ok: boolean; saved: string[] }>(`/admin/tenant-settings/${encodeURIComponent(namespace)}`, {
      method: "PUT",
      body: JSON.stringify({ tenantKey, values }),
    }),
  test: (tenantKey: string, namespace: string, data?: Record<string, unknown>) =>
    fetcher<any>(`/admin/tenant-settings/${encodeURIComponent(namespace)}/test`, {
      method: "POST",
      body: JSON.stringify({ tenantKey, ...(data ?? {}) }),
    }),
  delete: (tenantKey: string, namespace: string, key: string) =>
    fetcher<{ ok: boolean }>(
      `/admin/tenant-settings/${encodeURIComponent(namespace)}/${encodeURIComponent(key)}?tenantKey=${encodeURIComponent(tenantKey)}`,
      { method: "DELETE" }
    ),
};

export const googleConnect = {
  oauthClient: (tenantKey: string) =>
    fetcher<{ item: any | null }>(
      `/admin/google-connect/oauth-client?tenantKey=${encodeURIComponent(tenantKey)}`
    ),
  saveOAuthClient: (data: { tenantKey: string; clientId: string; clientSecret?: string; redirectUri: string }) =>
    fetcher<{ ok: boolean }>("/admin/google-connect/oauth-client", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  status: (tenantKey: string) =>
    fetcher<any>(`/admin/google-connect/status?tenantKey=${encodeURIComponent(tenantKey)}`),
  authUrl: (tenantKey: string) =>
    fetcher<{ url: string }>(`/admin/google-connect/auth-url?tenantKey=${encodeURIComponent(tenantKey)}`),
  exchange: (tenantKey: string, code: string) =>
    fetcher<any>("/admin/google-connect/exchange", {
      method: "POST",
      body: JSON.stringify({ tenantKey, code }),
    }),
  disconnect: (tenantKey: string) =>
    fetcher<{ ok: boolean }>("/admin/google-connect/disconnect", {
      method: "POST",
      body: JSON.stringify({ tenantKey }),
    }),
};

export const metaCapi = {
  test: (tenantKey: string, data?: { eventName?: string; eventSourceUrl?: string }) =>
    fetcher<any>("/admin/meta-capi/test", {
      method: "POST",
      body: JSON.stringify({ tenantKey, ...(data ?? {}) }),
    }),
};

export const marketing = {
  settings: (tenantKey: string) =>
    fetcher<any>(`/marketing/settings?tenantKey=${encodeURIComponent(tenantKey)}`),
  updateSettings: (data: Record<string, unknown>) =>
    fetcher<any>("/marketing/settings", { method: "PATCH", body: JSON.stringify(data) }),
  siteSettingsFetch: (tenantKey: string) =>
    fetcher<any>(`/marketing/site-settings-fetch?tenantKey=${encodeURIComponent(tenantKey)}`),
  discoverTrackingIds: (tenantKey: string) =>
    fetcher<any>(`/marketing/discover-ids?tenantKey=${encodeURIComponent(tenantKey)}`),
  gscSummary: (tenantKey: string) =>
    fetcher<any>(`/marketing/gsc-summary?tenantKey=${encodeURIComponent(tenantKey)}`),
  gscAnalytics: (tenantKey: string, range = 28, type = "web") =>
    fetcher<any>(`/marketing/gsc/analytics?tenantKey=${encodeURIComponent(tenantKey)}&range=${range}&type=${encodeURIComponent(type)}`),
  gscPageQueries: (tenantKey: string, page: string, range = 28) =>
    fetcher<any>(`/marketing/gsc/page-queries?tenantKey=${encodeURIComponent(tenantKey)}&page=${encodeURIComponent(page)}&range=${range}`),
  gscSites: (tenantKey: string) =>
    fetcher<any>(`/marketing/gsc/sites?tenantKey=${encodeURIComponent(tenantKey)}`),
  gscQuery: (tenantKey: string, requestBody: Record<string, unknown>) =>
    fetcher<any>("/marketing/gsc/query", {
      method: "POST",
      body: JSON.stringify({ tenantKey, requestBody }),
    }),
  gscIndex: (tenantKey: string, limit = 500) =>
    fetcher<any>(`/marketing/gsc/index?tenantKey=${encodeURIComponent(tenantKey)}&limit=${limit}`),
  refreshGscIndex: (tenantKey: string, data?: { force?: boolean; limit?: number }) =>
    fetcher<any>("/marketing/gsc/index/refresh", {
      method: "POST",
      body: JSON.stringify({ tenantKey, ...(data ?? {}) }),
    }),
  createGscWriteDraft: (
    tenantKey: string,
    data?: { kind?: "sitemap_submit" | "sitemap_delete" | "indexing_request"; url?: string },
  ) =>
    fetcher<any>("/marketing/gsc/write-draft", {
      method: "POST",
      body: JSON.stringify({ tenantKey, ...(data ?? {}) }),
    }),
  backlinks: (tenantKey: string) =>
    fetcher<any>(`/marketing/backlinks?tenantKey=${encodeURIComponent(tenantKey)}`),
  googleAdsLinks: (tenantKey: string) =>
    fetcher<any>(`/marketing/google-ads-links?tenantKey=${encodeURIComponent(tenantKey)}`),
  report: (tenantKey: string, from: string, to: string) =>
    fetcher<any>(`/marketing/report?tenantKey=${encodeURIComponent(tenantKey)}&from=${from}&to=${to}`),
  ga4Summary: (tenantKey: string) =>
    fetcher<any>(`/marketing/ga4-summary?tenantKey=${encodeURIComponent(tenantKey)}`),
  ga4Report: (tenantKey: string, range = 28) =>
    fetcher<any>(`/marketing/ga4/report?tenantKey=${encodeURIComponent(tenantKey)}&range=${range}`),
  ga4Funnel: (tenantKey: string, range = 28) =>
    fetcher<any>(`/marketing/ga4/funnel?tenantKey=${encodeURIComponent(tenantKey)}&range=${range}`),
  ga4FunnelTrend: (tenantKey: string, granularity: "month" | "week" = "month") =>
    fetcher<any>(`/marketing/ga4/funnel-trend?tenantKey=${encodeURIComponent(tenantKey)}&granularity=${granularity}`),
  ga4VisitStats: (tenantKey: string, range = 28) =>
    fetcher<any>(`/marketing/ga4/visit-stats?tenantKey=${encodeURIComponent(tenantKey)}&range=${range}`),
  ga4RealtimeDetail: (tenantKey: string) =>
    fetcher<any>(`/marketing/ga4/realtime-detail?tenantKey=${encodeURIComponent(tenantKey)}`),
  ga4Config: (tenantKey: string) =>
    fetcher<any>(`/marketing/ga4/config?tenantKey=${encodeURIComponent(tenantKey)}`),
  createGa4ConfigDraft: (
    tenantKey: string,
    data?: {
      kind?: "conversion_event" | "audience" | "custom_dimension" | "delete_key_event" | "delete_audience" | "delete_custom_dimension";
      name?: string;
      resourceName?: string;
    },
  ) =>
    fetcher<any>("/marketing/ga4/config-draft", {
      method: "POST",
      body: JSON.stringify({ tenantKey, ...(data ?? {}) }),
    }),
  gtmSummary: (tenantKey: string) =>
    fetcher<any>(`/marketing/gtm-summary?tenantKey=${encodeURIComponent(tenantKey)}`),
  createGtmTrackingFixSuggestion: (tenantKey: string) =>
    fetcher<any>("/marketing/gtm/tracking-fix-suggestions", {
      method: "POST",
      body: JSON.stringify({ tenantKey }),
    }),
  createGtmRollbackDraft: (tenantKey: string, data: { versionId?: string; versionPath?: string; versionName?: string }) =>
    fetcher<any>("/marketing/gtm/rollback-draft", {
      method: "POST",
      body: JSON.stringify({ tenantKey, ...data }),
    }),
  createGtmBuiltInVariablesDraft: (tenantKey: string, types: string[], containerPath?: string) =>
    fetcher<any>("/marketing/gtm/built-in-variables-draft", {
      method: "POST",
      body: JSON.stringify({ tenantKey, types, containerPath }),
    }),
  gtmVersionDiff: (tenantKey: string, versionA: string, versionB: string) =>
    fetcher<any>(
      `/marketing/gtm/version-diff?tenantKey=${encodeURIComponent(tenantKey)}&versionA=${encodeURIComponent(versionA)}&versionB=${encodeURIComponent(versionB)}`
    ),
  merchantSummary: (tenantKey: string) =>
    fetcher<any>(`/marketing/merchant/summary?tenantKey=${encodeURIComponent(tenantKey)}`),
  createMerchantAttributeFixDraft: (
    tenantKey: string,
    data?: { productId?: string; productIds?: string[]; attribute?: string; updates?: Record<string, unknown>; suggestionId?: string },
  ) =>
    fetcher<any>("/marketing/merchant/attribute-fix-draft", {
      method: "POST",
      body: JSON.stringify({ tenantKey, ...(data ?? {}) }),
    }),
  metaDiagnostics: (tenantKey: string) =>
    fetcher<any>(`/marketing/meta/diagnostics?tenantKey=${encodeURIComponent(tenantKey)}`),
  createMetaDiagnosticsDraft: (tenantKey: string) =>
    fetcher<any>("/marketing/meta/diagnostics-draft", {
      method: "POST",
      body: JSON.stringify({ tenantKey }),
    }),
  createAiChangeSetDraft: (tenantKey: string, data?: { platform?: string; goal?: string }) =>
    fetcher<any>("/marketing/ai/change-set-draft", {
      method: "POST",
      body: JSON.stringify({ tenantKey, ...(data ?? {}) }),
    }),
  googleAdsCampaigns: (tenantKey: string) =>
    fetcher<any>(`/marketing/google-ads-campaigns?tenantKey=${encodeURIComponent(tenantKey)}`),
  googleAdsAudit: (tenantKey: string) =>
    fetcher<any>(`/marketing/google-ads/audit?tenantKey=${encodeURIComponent(tenantKey)}`),
  googleAdsRecommendations: (tenantKey: string) =>
    fetcher<any>(`/marketing/google-ads/recommendations?tenantKey=${encodeURIComponent(tenantKey)}`),
  googleAdsKeywords: (tenantKey: string) =>
    fetcher<any>(`/marketing/google-ads/keywords?tenantKey=${encodeURIComponent(tenantKey)}`),
  googleAdsInsights: (tenantKey: string, range = "30d") =>
    fetcher<any>(`/marketing/google-ads/insights?tenantKey=${encodeURIComponent(tenantKey)}&range=${encodeURIComponent(range)}`),
  googleAdsAssetGroupAssets: (tenantKey: string, assetGroupId: string) =>
    fetcher<any>(
      `/marketing/google-ads/asset-group-assets?tenantKey=${encodeURIComponent(tenantKey)}&assetGroupId=${encodeURIComponent(assetGroupId)}`
    ),
  createGoogleAdsCampaignDraft: (
    tenantKey: string,
    data: {
      action: "status" | "budget" | "bidding" | "remove";
      campaignId?: string | null;
      campaignName?: string | null;
      campaignResourceName: string;
      campaignBudgetResourceName?: string | null;
      status?: "ENABLED" | "PAUSED";
      amountMicros?: number;
      removeConfirm?: boolean;
      bidding?:
        | { strategy: "MANUAL_CPC"; enhancedCpcEnabled?: boolean }
        | { strategy: "MAXIMIZE_CONVERSIONS" }
        | { strategy: "TARGET_ROAS"; targetRoas: number }
        | { strategy: "TARGET_CPA"; targetCpaMicros: number };
    }
  ) =>
    fetcher<any>("/marketing/google-ads/campaign-drafts", {
      method: "POST",
      body: JSON.stringify({ tenantKey, ...data }),
    }),
  createGoogleAdsKeywordDraft: (
    tenantKey: string,
    data: {
      campaignId?: string | null;
      campaignName?: string | null;
      keywordText?: string | null;
      adGroupCriterionResourceName: string;
      status: "ENABLED" | "PAUSED";
    }
  ) =>
    fetcher<any>("/marketing/google-ads/keyword-drafts", {
      method: "POST",
      body: JSON.stringify({ tenantKey, ...data }),
    }),
  createGoogleAdsImageAssetDraft: (
    tenantKey: string,
    data: {
      campaignId?: string | null;
      campaignName?: string | null;
      assetGroupResourceName?: string | null;
      assetGroupName?: string | null;
      name: string;
      imageBase64: string;
      fieldType?: string | null;
    }
  ) =>
    fetcher<any>("/marketing/google-ads/image-asset-drafts", {
      method: "POST",
      body: JSON.stringify({ tenantKey, ...data }),
    }),
  createGoogleAdsAssetRemoveDraft: (
    tenantKey: string,
    data: {
      campaignId?: string | null;
      campaignName?: string | null;
      assetGroupName?: string | null;
      assetGroupAssetResourceName: string;
      assetName?: string | null;
      fieldType?: string | null;
      removeConfirm: boolean;
    }
  ) =>
    fetcher<any>("/marketing/google-ads/asset-group-asset-remove-drafts", {
      method: "POST",
      body: JSON.stringify({ tenantKey, ...data }),
    }),
  createGoogleAdsAiRsaDraft: (
    tenantKey: string,
    data: {
      campaignId?: string | null;
      campaignName?: string | null;
      assetGroupResourceName: string;
      assetGroupName?: string | null;
      goal?: string | null;
      context?: string | null;
    }
  ) =>
    fetcher<any>("/marketing/google-ads/ai-rsa-drafts", {
      method: "POST",
      body: JSON.stringify({ tenantKey, ...data }),
    }),
  createGoogleAdsSearchRsaDraft: (
    tenantKey: string,
    data: {
      campaignId?: string | null;
      campaignName?: string | null;
      adGroupResourceName?: string | null;
      adGroupId?: string | null;
      adGroupName?: string | null;
      finalUrl?: string | null;
      goal?: string | null;
      context?: string | null;
    }
  ) =>
    fetcher<any>("/marketing/google-ads/search-rsa-drafts", {
      method: "POST",
      body: JSON.stringify({ tenantKey, ...data }),
    }),
  generateGoogleAdsAiRsaCopy: (
    tenantKey: string,
    data: {
      campaignName?: string | null;
      assetGroupName?: string | null;
      goal?: string | null;
      context?: string | null;
    }
  ) =>
    fetcher<any>("/marketing/google-ads/ai-rsa-copy", {
      method: "POST",
      body: JSON.stringify({ tenantKey, ...data }),
    }),
  createGoogleAdsTextAssetDraft: (
    tenantKey: string,
    data: {
      campaignId?: string | null;
      campaignName?: string | null;
      assetGroupResourceName: string;
      assetGroupName?: string | null;
      textAssets: {
        headlines?: string[];
        longHeadlines?: string[];
        descriptions?: string[];
        businessName?: string;
      };
    }
  ) =>
    fetcher<any>("/marketing/google-ads/text-asset-drafts", {
      method: "POST",
      body: JSON.stringify({ tenantKey, ...data }),
    }),
  createGoogleAdsSearchCampaignDraft: (
    tenantKey: string,
    spec: {
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
    }
  ) =>
    fetcher<any>("/marketing/google-ads/search-campaign-drafts", {
      method: "POST",
      body: JSON.stringify({ tenantKey, spec }),
    }),
  createGoogleAdsAutomationDrafts: (tenantKey: string) =>
    fetcher<any>("/marketing/google-ads/automation-drafts", {
      method: "POST",
      body: JSON.stringify({ tenantKey }),
    }),
  googleAdsChangeSets: (tenantKey: string) =>
    fetcher<any>(`/marketing/google-ads/change-sets?tenantKey=${encodeURIComponent(tenantKey)}`),
  createVistaSeedsPlan: (tenantKey: string, data?: { campaignId?: string; assetGroupResourceName?: string }) =>
    fetcher<any>("/marketing/google-ads/vistaseeds-plan", {
      method: "POST",
      body: JSON.stringify({ tenantKey, ...(data ?? {}) }),
    }),
  validateGoogleAdsChangeSet: (uuid: string) =>
    fetcher<any>(`/marketing/google-ads/change-sets/${encodeURIComponent(uuid)}/validate`, {
      method: "POST",
    }),
  applyGoogleAdsChangeSet: (uuid: string) =>
    fetcher<any>(`/marketing/google-ads/change-sets/${encodeURIComponent(uuid)}/apply`, {
      method: "POST",
      body: JSON.stringify({ confirmApply: true }),
    }),
  backlinksSync: (tenantKey: string) =>
    fetcher<any>("/marketing/backlinks/sync", {
      method: "POST",
      body: JSON.stringify({ tenantKey }),
    }),
};

export const marketingChangeSets = {
  list: (tenantKey: string, platform: string, status?: string) => {
    const params = new URLSearchParams({ tenantKey });
    if (status) params.set("status", status);
    return fetcher<{ items: any[] }>(`/marketing/${encodeURIComponent(platform)}/change-sets?${params.toString()}`);
  },
  create: (
    tenantKey: string,
    platform: string,
    data: { targetRef?: string | null; title?: string; description?: string | null; payload: unknown; source?: string },
  ) =>
    fetcher<any>(`/marketing/${encodeURIComponent(platform)}/change-sets`, {
      method: "POST",
      body: JSON.stringify({ tenantKey, ...data }),
    }),
  validate: (platform: string, uuid: string) =>
    fetcher<any>(`/marketing/${encodeURIComponent(platform)}/change-sets/${encodeURIComponent(uuid)}/validate`, {
      method: "POST",
    }),
  apply: (platform: string, uuid: string) =>
    fetcher<any>(`/marketing/${encodeURIComponent(platform)}/change-sets/${encodeURIComponent(uuid)}/apply`, {
      method: "POST",
      body: JSON.stringify({ confirmApply: true }),
    }),
};

// ─── Calendar ───────────────────────────────────────────────
export const calendar = {
  list: (from?: string, to?: string, tenantKey?: string) => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (tenantKey) params.set("tenantKey", tenantKey);
    return fetcher<{ items: any[] }>(`/calendar?${params}`);
  },
  generateWeek: (startDate?: string, tenantKey?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.set("start_date", startDate);
    if (tenantKey) params.set("tenantKey", tenantKey);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return fetcher<{ items: any[] }>(`/calendar/generate-week${qs}`, {
      method: "POST",
    });
  },
};

// ─── Platforms ──────────────────────────────────────────────
export const platforms = {
  status: (tenantKey?: string) =>
    fetcher<any>(
      `/platforms/status${tenantKey ? `?tenantKey=${encodeURIComponent(tenantKey)}` : ""}`
    ),
  list: (tenantKey: string) =>
    fetcher<{ items: any[] }>(`/platforms?tenantKey=${encodeURIComponent(tenantKey)}`),
  testTelegram: (tenantKey?: string) =>
    fetcher<any>("/platforms/telegram/test", {
      method: "POST",
      body: JSON.stringify(tenantKey ? { tenantKey } : {}),
    }),
  testLinkedIn: (tenantKey: string) =>
    fetcher<any>("/platforms/linkedin/test", {
      method: "POST",
      body: JSON.stringify({ tenantKey }),
    }),
  testX: (tenantKey: string) =>
    fetcher<any>("/platforms/x/test", {
      method: "POST",
      body: JSON.stringify({ tenantKey }),
    }),
  testFacebook: (tenantKey: string) =>
    fetcher<any>("/platforms/facebook/test", {
      method: "POST",
      body: JSON.stringify({ tenantKey }),
    }),
  testInstagram: (tenantKey: string, imageUrl?: string) =>
    fetcher<any>("/platforms/instagram/test", {
      method: "POST",
      body: JSON.stringify({ tenantKey, ...(imageUrl ? { imageUrl } : {}) }),
    }),
  linkedinAuthUrl: (tenantKey: string) =>
    fetcher<{ url: string }>(
      `/platforms/linkedin/auth-url?tenantKey=${encodeURIComponent(tenantKey)}`
    ),
  linkedinOAuthComplete: (body: { tenantKey: string; code: string; redirectUri?: string }) =>
    fetcher<{ ok: boolean }>("/platforms/linkedin/callback", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  linkedinOAuthClient: (tenantKey: string) =>
    fetcher<{ item: { clientId?: string; redirectUri?: string; hasClientSecret?: boolean } | null }>(
      `/platforms/linkedin/oauth-client?tenantKey=${encodeURIComponent(tenantKey)}`
    ),
  saveLinkedInOAuthClient: (data: {
    tenantKey: string;
    clientId: string;
    clientSecret?: string;
    redirectUri: string;
  }) =>
    fetcher<{ ok: boolean }>("/platforms/linkedin/oauth-client", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  metaHealth: (tenantKey: string) =>
    fetcher<any>(`/platforms/${encodeURIComponent(tenantKey)}/health`),
  facebookOAuthClient: (tenantKey: string) =>
    fetcher<{ item: { clientId?: string; redirectUri?: string; hasClientSecret?: boolean } | null }>(
      `/platforms/facebook/oauth-client?tenantKey=${encodeURIComponent(tenantKey)}`
    ),
  saveFacebookOAuthClient: (data: { tenantKey: string; clientId: string; clientSecret?: string; redirectUri: string }) =>
    fetcher<{ ok: boolean }>("/platforms/facebook/oauth-client", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  linkedinManualQueue: (tenantKey: string) =>
    fetcher<{ items: any[] }>(`/platforms/linkedin/manual-queue?tenantKey=${encodeURIComponent(tenantKey)}`),
  markLinkedInManualPosted: (tenantKey: string, postId: number) =>
    fetcher<{ ok: boolean }>(`/platforms/linkedin/manual-queue/${postId}/posted`, {
      method: "POST",
      body: JSON.stringify({ tenantKey }),
    }),
  xAuthUrl: (tenantKey: string, codeChallenge: string) =>
    fetcher<{ url: string }>(
      `/platforms/x/auth-url?tenantKey=${encodeURIComponent(tenantKey)}&codeChallenge=${encodeURIComponent(codeChallenge)}`
    ),
  xOAuthComplete: (body: {
    tenantKey: string;
    code: string;
    codeVerifier: string;
    redirectUri?: string;
  }) =>
    fetcher<{ ok: boolean }>("/platforms/x/callback", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  youtubeOAuthClient: (tenantKey: string) =>
    fetcher<{ item: any | null; devFallbackAvailable: boolean }>(
      `/platforms/youtube/oauth-client?tenantKey=${encodeURIComponent(tenantKey)}`
    ),
  saveYouTubeOAuthClient: (data: {
    tenantKey: string;
    clientId: string;
    clientSecret?: string;
    redirectUri: string;
  }) =>
    fetcher<{ ok: boolean }>("/platforms/youtube/oauth-client", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  youtubeOAuthStartUrl: (tenantKey: string) =>
    `${API_URL}/platforms/youtube/oauth/start?tenantKey=${encodeURIComponent(tenantKey)}`,
  youtubeDisconnect: (accountUuid: string) =>
    fetcher<{ ok: boolean }>("/platforms/youtube/disconnect", {
      method: "POST",
      body: JSON.stringify({ accountUuid }),
    }),
  youtubeInfo: (tenantKey: string) =>
    fetcher<any>(`/platforms/youtube/info?tenantKey=${encodeURIComponent(tenantKey)}`),
  tiktokConfig: () =>
    fetcher<{ item: { clientKey: string | null; redirectUri: string | null; hasClientSecret: boolean; connected: boolean; openId: string | null; displayName: string | null } }>("/platforms/tiktok/config"),
  saveTikTokConfig: (data: { clientKey: string; clientSecret?: string; redirectUri: string }) =>
    fetcher<{ ok: boolean }>("/platforms/tiktok/config", { method: "POST", body: JSON.stringify(data) }),
  tiktokAuthUrl: () => fetcher<{ url: string }>("/platforms/tiktok/oauth/auth-url"),
  tiktokUploadDraft: (file: File) => {
    const formData = new FormData();
    formData.append("video", file, file.name);
    return fetcher<{ ok: boolean; publishId: string; message: string }>("/platforms/tiktok/upload-draft", { method: "POST", body: formData });
  },
  tiktokDisconnect: () => fetcher<{ ok: boolean }>("/platforms/tiktok/disconnect", { method: "POST" }),
  manualConnect: (data: {
    tenantKey: string;
    platform: string;
    accountName: string;
    accountId?: string;
    accessToken?: string;
    refreshToken?: string;
    pageId?: string;
    pageToken?: string;
    oauth1?: {
      apiKey: string;
      apiSecret: string;
      accessToken: string;
      accessTokenSecret: string;
    };
  }) => fetcher<any>("/platforms/manual/connect", { method: "POST", body: JSON.stringify(data) }),
  delete: (id: string | number) =>
    fetcher<any>(`/platforms/${encodeURIComponent(String(id))}`, { method: "DELETE" }),
  facebookPosts: (tenantKey: string, limit = 25) =>
    fetcher<{ items: any[] }>(`/platforms/facebook/posts?tenantKey=${encodeURIComponent(tenantKey)}&limit=${limit}`),
  facebookInfo: (tenantKey: string) =>
    fetcher<any>(`/platforms/facebook/info?tenantKey=${encodeURIComponent(tenantKey)}`),
  facebookPostDetails: (tenantKey: string, postId: string) =>
    fetcher<any>(`/platforms/facebook/posts/${encodeURIComponent(postId)}/details?tenantKey=${encodeURIComponent(tenantKey)}`),
  replyFacebookComment: (tenantKey: string, commentId: string, message: string) =>
    fetcher<any>(`/platforms/facebook/comments/${encodeURIComponent(commentId)}/reply`, {
      method: "POST",
      body: JSON.stringify({ tenantKey, message }),
    }),
  instagramMedia: (tenantKey: string, limit = 25) =>
    fetcher<{ items: any[] }>(`/platforms/instagram/media?tenantKey=${encodeURIComponent(tenantKey)}&limit=${limit}`),
  instagramInfo: (tenantKey: string) =>
    fetcher<any>(`/platforms/instagram/info?tenantKey=${encodeURIComponent(tenantKey)}`),
  instagramMediaDetails: (tenantKey: string, mediaId: string) =>
    fetcher<any>(`/platforms/instagram/media/${encodeURIComponent(mediaId)}/details?tenantKey=${encodeURIComponent(tenantKey)}`),
  replyInstagramComment: (tenantKey: string, commentId: string, message: string) =>
    fetcher<any>(`/platforms/instagram/comments/${encodeURIComponent(commentId)}/reply`, {
      method: "POST",
      body: JSON.stringify({ tenantKey, message }),
    }),
  xAccountTweets: (tenantKey: string, limit = 25) =>
    fetcher<{ items: any[] }>(`/platforms/x/account-tweets?tenantKey=${encodeURIComponent(tenantKey)}&limit=${limit}`),
};

// ─── E-posta (tenant bazli SMTP / IMAP) ─────────────────────
export const email = {
  settings: (tenantKey: string) =>
    fetcher<{ tenantKey: string; settings: Record<string, unknown> }>(
      `/email/settings?tenantKey=${encodeURIComponent(tenantKey)}`
    ),
  updateSettings: (data: Record<string, unknown>) =>
    fetcher<{ ok: boolean }>("/email/settings", { method: "PATCH", body: JSON.stringify(data) }),
  testSmtp: (tenantKey: string, to?: string) =>
    fetcher<{ ok: boolean; sentTo?: string }>("/email/test-smtp", {
      method: "POST",
      body: JSON.stringify({ tenantKey, ...(to ? { to } : {}) }),
    }),
  inbox: (tenantKey: string, limit?: number) => {
    const q = new URLSearchParams({ tenantKey });
    if (limit) q.set("limit", String(limit));
    return fetcher<{ items: any[] }>(`/email/inbox?${q}`);
  },
  message: (tenantKey: string, uid: number) =>
    fetcher<any>(
      `/email/message?tenantKey=${encodeURIComponent(tenantKey)}&uid=${encodeURIComponent(String(uid))}`
    ),
  reply: (data: {
    tenantKey: string;
    to: string;
    subject?: string;
    text: string;
    inReplyTo?: string;
    references?: string;
  }) =>
    fetcher<{ ok: boolean }>("/email/reply", { method: "POST", body: JSON.stringify(data) }),
};

// ─── AI ─────────────────────────────────────────────────────
export const ai = {
  generateCaption: (data: { tenantKey?: string; title: string; content?: string; url?: string }) =>
    fetcher<any>("/ai/generate-caption", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  generatePost: (data: any) =>
    fetcher<any>("/ai/generate-post", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  engagementPost: (data: { tenantKey?: string; type?: string; topic?: string }) =>
    fetcher<any>("/ai/engagement-post", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  xThread: (data: { tenantKey?: string; topic: string; context?: string; scheduledAt?: string; queueDrafts?: boolean }) =>
    fetcher<any>("/ai/x-thread", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  xTemplate: (data: {
    tenantKey?: string;
    templateType?: "news_visual" | "quick_summary" | "question" | "list" | "daily_summary";
    source: {
      title?: string;
      summary?: string;
      content?: string;
      url?: string;
      tags?: string[];
      canonicalSlug?: string;
      productTitle?: string;
      eventTag?: string;
      dayTag?: string;
    };
    mediaUrls?: string[];
    queueDraft?: boolean;
    scheduledAt?: string;
  }) =>
    fetcher<any>("/ai/x-template", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  xImage: (data: {
    tenantKey?: string;
    template?: string;
    date?: string;
    rows: Array<{
      product: string;
      unit?: string;
      city?: string;
      price: number;
      minPrice?: number;
      maxPrice?: number;
      recordedDate?: string;
      prevPrice?: number;
      changePct?: number;
      displayName?: string;
      slug?: string;
    }>;
  }) =>
    fetcher<any>("/ai/x-image", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  xTrends: (tenantKey: string, limit = 6) =>
    fetcher<any>(`/ai/x-trends?tenantKey=${encodeURIComponent(tenantKey)}&limit=${limit}`),
  xSchedule: (tenantKey: string) =>
    fetcher<any>(`/ai/x-schedule?tenantKey=${encodeURIComponent(tenantKey)}`),
  hashtags: (postType?: string) =>
    fetcher<any>("/ai/hashtags", {
      method: "POST",
      body: JSON.stringify({ postType }),
    }),
  youtubeOptimize: (data: {
    topic: string;
    tenantKey: string;
    tenantNiche: string;
    videoTranscript?: string;
    targetAudience: string;
  }) =>
    fetcher<{
      title: string;
      description: string;
      tags: string[];
      hashtags: string[];
      chapters: Array<{ time: string; title: string }>;
      thumbnailConcept: string;
    }>("/ai/youtube-optimize", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ─── Analytics ──────────────────────────────────────────────
export const analytics = {
  overview: () => fetcher<any>("/analytics/overview"),
  topPosts: () => fetcher<{ items: any[] }>("/analytics/top-posts"),
  tenantSummary: (tenantKey: string) =>
    fetcher<any>(`/analytics/tenant-summary?tenantKey=${encodeURIComponent(tenantKey)}`),
  bestTime: (tenantKey: string, platform = "x") =>
    fetcher<any>(
      `/analytics/best-time?tenantKey=${encodeURIComponent(tenantKey)}&platform=${encodeURIComponent(platform)}`
    ),
  tenantReportPdfUrl: (tenantKey: string) =>
    `${API_URL}/analytics/tenant-report.pdf?tenantKey=${encodeURIComponent(tenantKey)}`,
  youtubeChannel: (accountUuid: string, rangeDays = 30) =>
    fetcher<any>(
      `/analytics/youtube/channel?accountUuid=${encodeURIComponent(accountUuid)}&rangeDays=${rangeDays}`
    ),
  youtubeVideo: (videoId: string, tenantKey = "default", rangeDays = 30) =>
    fetcher<any>(
      `/analytics/youtube/video/${encodeURIComponent(videoId)}?tenantKey=${encodeURIComponent(tenantKey)}&rangeDays=${rangeDays}`
    ),
};

export const xResearch = {
  overview: (tenantKey: string) =>
    fetcher<any>(`/x-research/overview?tenantKey=${encodeURIComponent(tenantKey)}`),
  targets: (tenantKey: string) =>
    fetcher<{ items: any[] }>(`/x-research/targets?tenantKey=${encodeURIComponent(tenantKey)}`),
  createTarget: (data: { tenantKey: string; type: string; label: string; query: string; userId?: string }) =>
    fetcher<any>("/x-research/targets", { method: "POST", body: JSON.stringify(data) }),
  updateTarget: (id: number, data: Record<string, unknown>) =>
    fetcher<any>(`/x-research/targets/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  syncTarget: (id: number) =>
    fetcher<any>(`/x-research/targets/${id}/sync`, { method: "POST" }),
  syncTenant: (tenantKey: string) =>
    fetcher<any>("/x-research/sync", { method: "POST", body: JSON.stringify({ tenantKey }) }),
  tweets: (tenantKey: string, params?: { targetId?: number; limit?: number }) => {
    const qs = new URLSearchParams({ tenantKey, limit: String(params?.limit || 50) });
    if (params?.targetId) qs.set("targetId", String(params.targetId));
    return fetcher<{ items: any[] }>(`/x-research/tweets?${qs.toString()}`);
  },
};

// ─── Ekosistem Feed ─────────────────────────────────────────
export const ekosistem = {
  news: (limit?: number) =>
    fetcher<any>(`/ekosistem/news?limit=${limit || 10}`),
  articles: (limit?: number) =>
    fetcher<any>(`/ekosistem/articles?limit=${limit || 10}`),
};
