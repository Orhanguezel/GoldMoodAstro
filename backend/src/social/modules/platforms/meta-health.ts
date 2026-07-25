import { and, eq } from "drizzle-orm";
import { env } from "../../core/env";
import { db } from "../../db/client";
import { platformAccounts } from "../../db/schema";
import { getTenantOAuthClient } from "./repository";

type HealthCheck<T = Record<string, unknown>> = {
  ok: boolean;
  message: string;
  details?: T;
};

export type MetaHealthResult = {
  tenantKey: string;
  healthy: boolean;
  checkedAt: string;
  checks: {
    token: HealthCheck<{ expiresAt: number | null; tokenType: string | null }>;
    permissions: HealthCheck<{ granted: string[]; missing: string[] }>;
    instagramLink: HealthCheck<{ pageId: string | null; instagramAccountId: string | null }>;
    publishingQuota: HealthCheck<{ quotaUsage: number | null }>;
  };
};

type GraphError = { error?: { message?: string; code?: number } };

function graphError(data: unknown, fallback: string): string {
  const message = (data as GraphError | null)?.error?.message;
  return typeof message === "string" && message.trim() ? message : fallback;
}

async function graphGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`https://graph.facebook.com/${env.META_GRAPH_API_VERSION}/${path.replace(/^\//, "")}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const response = await fetch(url);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(graphError(data, `Meta Graph API HTTP ${response.status}`));
  return data as T;
}

function failed<T>(message: string, details?: T): HealthCheck<T> {
  return details === undefined ? { ok: false, message } : { ok: false, message, details };
}

export async function getMetaHealth(tenantKey: string): Promise<MetaHealthResult> {
  const accounts = await db
    .select()
    .from(platformAccounts)
    .where(and(eq(platformAccounts.tenantKey, tenantKey), eq(platformAccounts.isActive, 1)));
  const facebook = accounts.find((item) => item.platform === "facebook");
  const instagram = accounts.find((item) => item.platform === "instagram");
  const pageId = facebook?.pageId || facebook?.accountId || null;
  const instagramAccountId = instagram?.accountId || null;
  const userToken = instagram?.accessToken || instagram?.pageToken || facebook?.pageToken || facebook?.accessToken || null;
  const oauthClient = await getTenantOAuthClient(tenantKey, "facebook");

  let token: MetaHealthResult["checks"]["token"] = failed("Meta access token bulunamadi", {
    expiresAt: null,
    tokenType: null,
  });
  let permissions: MetaHealthResult["checks"]["permissions"] = failed("Token dogrulanamadi", {
    granted: [],
    missing: ["instagram_content_publish", "pages_manage_posts"],
  });
  let instagramLink: MetaHealthResult["checks"]["instagramLink"] = failed("Facebook Sayfa veya Instagram hesabi bulunamadi", {
    pageId,
    instagramAccountId,
  });
  let publishingQuota: MetaHealthResult["checks"]["publishingQuota"] = failed("Instagram hesabi bulunamadi", {
    quotaUsage: null,
  });

  if (userToken && oauthClient) {
    try {
      const debug = await graphGet<{
        data?: {
          app_id?: string;
          is_valid?: boolean;
          expires_at?: number;
          type?: string;
          scopes?: string[];
        };
      }>("debug_token", {
        input_token: userToken,
        access_token: `${oauthClient.clientId}|${oauthClient.clientSecret}`,
      });
      const data = debug.data;
      const appMatches = !data?.app_id || data.app_id === oauthClient.clientId;
      token = data?.is_valid && appMatches
        ? {
            ok: true,
            message: data.expires_at ? "Token gecerli" : "Token gecerli (suresiz)",
            details: { expiresAt: data.expires_at ?? null, tokenType: data.type ?? null },
          }
        : failed(appMatches ? "Token gecersiz veya iptal edilmis" : "Token farkli bir Meta app'e ait", {
            expiresAt: data?.expires_at ?? null,
            tokenType: data?.type ?? null,
          });

      const required = ["instagram_content_publish", "pages_manage_posts"];
      const granted = Array.isArray(data?.scopes) ? data.scopes : [];
      const missing = required.filter((scope) => !granted.includes(scope));
      permissions = missing.length === 0
        ? { ok: true, message: "Gerekli yayin izinleri mevcut", details: { granted, missing } }
        : failed(`Eksik Meta izinleri: ${missing.join(", ")}`, { granted, missing });
    } catch (error) {
      token = failed((error as Error).message, { expiresAt: null, tokenType: null });
      permissions = failed("Token debug edilemedigi icin izinler dogrulanamadi", {
        granted: [],
        missing: ["instagram_content_publish", "pages_manage_posts"],
      });
    }
  } else if (!oauthClient) {
    token = failed("Tenant'a ozel Facebook OAuth client bulunamadi", { expiresAt: null, tokenType: null });
  }

  if (pageId && userToken) {
    try {
      const page = await graphGet<{ instagram_business_account?: { id?: string } }>(pageId, {
        fields: "instagram_business_account",
        access_token: userToken,
      });
      const linkedId = page.instagram_business_account?.id ?? null;
      instagramLink = linkedId && linkedId === instagramAccountId
        ? { ok: true, message: "Facebook Sayfa ile Instagram Business hesabi bagli", details: { pageId, instagramAccountId: linkedId } }
        : failed(linkedId ? "Sayfaya bagli Instagram hesabi tenant kaydiyla eslesmiyor" : "Sayfaya Instagram Business hesabi bagli degil", {
            pageId,
            instagramAccountId: linkedId,
          });
    } catch (error) {
      instagramLink = failed((error as Error).message, { pageId, instagramAccountId });
    }
  }

  if (instagramAccountId && userToken) {
    try {
      const limit = await graphGet<{ data?: Array<{ quota_usage?: number }> }>(`${instagramAccountId}/content_publishing_limit`, {
        fields: "quota_usage",
        access_token: userToken,
      });
      const quotaUsage = typeof limit.data?.[0]?.quota_usage === "number" ? limit.data[0].quota_usage : null;
      publishingQuota = quotaUsage === null
        ? failed("Instagram yayin kotasi yanitinda quota_usage yok", { quotaUsage })
        : { ok: true, message: `Instagram yayin kotasi kullanimi: ${quotaUsage}`, details: { quotaUsage } };
    } catch (error) {
      publishingQuota = failed((error as Error).message, { quotaUsage: null });
    }
  }

  const checks = { token, permissions, instagramLink, publishingQuota };
  return {
    tenantKey,
    healthy: Object.values(checks).every((check) => check.ok),
    checkedAt: new Date().toISOString(),
    checks,
  };
}
