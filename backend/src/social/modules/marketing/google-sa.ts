import { google } from "googleapis";
type OAuth2Client = any; // dedupe: googleapis-common ile ayni gal kopyasi, tip kimligi cakismasin
import { getTenantSecret, getTenantValue } from "../../core/tenant-settings";

const SCOPES = [
  // GSC reporting and URL Inspection are read-only, but the same integration
  // also supports explicit sitemap submit/delete change-sets.
  "https://www.googleapis.com/auth/webmasters",
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/tagmanager.readonly",
  "https://www.googleapis.com/auth/content",
];

/**
 * GSC/GA4 icin OAuth2 istemcisi. Service account YOKSA kullanilir.
 * client_id/secret paylasilan OAuth app'ten (google namespace, env fallback GOOGLE_ADS_CLIENT_ID/SECRET);
 * refresh token SCOPE'a ozeldir → her servis kendi namespace'inden okur (gsc / ga4).
 * (adwords scope'lu google.oauth_refresh_token BURADA KULLANILMAZ — yanlis scope.)
 */
export async function buildMarketingOAuthClient(
  tenantKey: string,
  namespace: "gsc" | "ga4" | "gtm",
): Promise<OAuth2Client | null> {
  // Token namespace'e (scope'a) ozeldir; her servis kendi namespace'inden okur.
  // google namespace'e FALLBACK YAPILMAZ: google:oauth_refresh_token env fallback'i
  // (GOOGLE_ADS_REFRESH_TOKEN) adwords scope'ludur, tagmanager/analytics write icermez.
  const refreshToken = (await getTenantSecret(tenantKey, namespace, "oauth_refresh_token"))?.trim();
  if (!refreshToken) return null;
  const clientId = (await getTenantValue<string>(tenantKey, "google", "oauth_client_id"))?.trim();
  const clientSecret = (await getTenantSecret(tenantKey, "google", "oauth_client_secret"))?.trim();
  if (!clientId || !clientSecret) return null;
  const client = new google.auth.OAuth2(clientId, clientSecret);
  client.setCredentials({ refresh_token: refreshToken });
  // GA4 BetaAnalyticsDataClient (gax) OAuth2Client'tan getUniverseDomain() bekler;
  // bazi google-auth-library surumlerinde bu metot yok → gax patlar. Shim ekle (REST/GSC'yi etkilemez).
  if (typeof (client as unknown as { getUniverseDomain?: unknown }).getUniverseDomain !== "function") {
    (client as unknown as { getUniverseDomain: () => Promise<string> }).getUniverseDomain =
      async () => "googleapis.com";
  }
  return client;
}

export async function parseServiceAccountJson(
  tenantKey: string
): Promise<{ client_email: string; private_key: string } | null> {
  const raw = (await getTenantSecret(tenantKey, "google", "service_account_json"))?.trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { client_email: string; private_key: string };
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON gecerli JSON degil");
  }
}

export async function createMarketingJwt(tenantKey: string) {
  const credentials = await parseServiceAccountJson(tenantKey);
  if (!credentials) return null;
  return new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: SCOPES,
  });
}

export async function getServiceAccountCredentialsForAnalyticsData(tenantKey: string) {
  const c = await parseServiceAccountJson(tenantKey);
  if (!c) return null;
  return {
    client_email: c.client_email,
    private_key: c.private_key,
  };
}
