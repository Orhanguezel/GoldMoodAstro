import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../../core/env";
import { deleteTenantSetting, getTenantSecret, getTenantValue, setTenantSettings } from "../../core/tenant-settings";

const TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const USER_URL = "https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url";
const INIT_URL = "https://open.tiktokapis.com/v2/post/publish/inbox/video/init/";

async function config() {
  const tenant = "goldmoodastro";
  const clientKey = String(await getTenantValue(tenant, "tiktok", "client_key") || "").trim();
  const clientSecret = String(await getTenantSecret(tenant, "tiktok", "client_secret") || "").trim();
  const redirectUri = String(await getTenantValue(tenant, "tiktok", "redirect_uri") || "").trim();
  if (!clientKey || !clientSecret || !redirectUri) throw new Error("TikTok Sandbox ayarlari eksik");
  return { tenant, clientKey, clientSecret, redirectUri };
}

function stateToken() {
  const body = Buffer.from(JSON.stringify({ tenant: "goldmoodastro", exp: Date.now() + 600_000 })).toString("base64url");
  const sig = createHmac("sha256", env.COOKIE_SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyState(raw: string) {
  const [body, sig, extra] = raw.split(".");
  if (!body || !sig || extra) throw new Error("TikTok OAuth state gecersiz");
  const expected = createHmac("sha256", env.COOKIE_SECRET).update(body).digest();
  const actual = Buffer.from(sig, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error("TikTok OAuth state imzasi gecersiz");
  const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { tenant?: string; exp?: number };
  if (parsed.tenant !== "goldmoodastro" || !parsed.exp || parsed.exp < Date.now()) throw new Error("TikTok OAuth state suresi dolmus");
}

export async function saveConfig(clientKey: string, clientSecret: string | undefined, redirectUri: string) {
  const entries: Array<{ key: string; value: unknown; isSecret?: boolean }> = [
    { key: "client_key", value: clientKey.trim() },
    { key: "redirect_uri", value: redirectUri.trim() },
    { key: "environment", value: "sandbox" },
  ];
  if (clientSecret?.trim()) entries.push({ key: "client_secret", value: clientSecret.trim(), isSecret: true });
  else if (!(await getTenantSecret("goldmoodastro", "tiktok", "client_secret"))) throw new Error("Client secret gerekli");
  if (!clientKey.trim() || !redirectUri.trim()) throw new Error("Client key ve Redirect URI gerekli");
  await setTenantSettings("goldmoodastro", "tiktok", entries, { updatedBy: "tiktok-config" });
}

export async function summary() {
  const tenant = "goldmoodastro";
  const [clientKey, redirectUri, secret, access, refresh, openId, displayName] = await Promise.all([
    getTenantValue<string>(tenant, "tiktok", "client_key"), getTenantValue<string>(tenant, "tiktok", "redirect_uri"),
    getTenantSecret(tenant, "tiktok", "client_secret"), getTenantSecret(tenant, "tiktok", "access_token"),
    getTenantSecret(tenant, "tiktok", "refresh_token"), getTenantValue<string>(tenant, "tiktok", "open_id"),
    getTenantValue<string>(tenant, "tiktok", "display_name"),
  ]);
  return { clientKey: clientKey || null, redirectUri: redirectUri || null, hasClientSecret: !!secret, connected: !!(access && refresh && openId), openId: openId || null, displayName: displayName || null };
}

export async function authUrl() {
  const c = await config();
  const url = new URL("https://www.tiktok.com/v2/auth/authorize/");
  url.searchParams.set("client_key", c.clientKey);
  url.searchParams.set("scope", "user.info.basic,video.upload");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", c.redirectUri);
  url.searchParams.set("state", stateToken());
  return url.toString();
}

async function tokenRequest(params: URLSearchParams) {
  const res = await fetch(TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: params });
  const data = await res.json() as any;
  if (!res.ok || data.error || !data.access_token || !data.refresh_token) throw new Error(data.error_description || data.error || "TikTok token alinamadi");
  return data as { access_token: string; refresh_token: string; expires_in: number; refresh_expires_in: number; open_id: string; scope: string };
}

async function storeTokens(t: Awaited<ReturnType<typeof tokenRequest>>) {
  const res = await fetch(USER_URL, { headers: { Authorization: `Bearer ${t.access_token}` } });
  const userData = await res.json() as any;
  const user = userData?.data?.user || {};
  await setTenantSettings("goldmoodastro", "tiktok", [
    { key: "access_token", value: t.access_token, isSecret: true }, { key: "refresh_token", value: t.refresh_token, isSecret: true },
    { key: "access_token_expires_at", value: Date.now() + t.expires_in * 1000 }, { key: "refresh_token_expires_at", value: Date.now() + t.refresh_expires_in * 1000 },
    { key: "open_id", value: user.open_id || t.open_id }, { key: "display_name", value: user.display_name || "TikTok" }, { key: "scopes", value: t.scope },
  ], { updatedBy: "tiktok-oauth" });
}

export async function exchangeCode(code: string) {
  const c = await config();
  const t = await tokenRequest(new URLSearchParams({ client_key: c.clientKey, client_secret: c.clientSecret, code, grant_type: "authorization_code", redirect_uri: c.redirectUri }));
  await storeTokens(t);
}

async function accessToken() {
  const c = await config();
  const [access, refresh, expires] = await Promise.all([
    getTenantSecret(c.tenant, "tiktok", "access_token"), getTenantSecret(c.tenant, "tiktok", "refresh_token"), getTenantValue<number>(c.tenant, "tiktok", "access_token_expires_at"),
  ]);
  if (access && Number(expires || 0) > Date.now() + 300_000) return access;
  if (!refresh) throw new Error("TikTok hesabi bagli degil");
  const t = await tokenRequest(new URLSearchParams({ client_key: c.clientKey, client_secret: c.clientSecret, grant_type: "refresh_token", refresh_token: refresh }));
  await storeTokens(t); return t.access_token;
}

export async function uploadDraft(file: { filename: string; mimetype: string; buffer: Buffer }) {
  const size = file.buffer.length;
  if (!size || size > 128 * 1024 * 1024) throw new Error("Video 1 byte ile 128 MB arasinda olmali");
  const token = await accessToken();
  const initRes = await fetch(INIT_URL, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=UTF-8" }, body: JSON.stringify({ source_info: { source: "FILE_UPLOAD", video_size: size, chunk_size: size, total_chunk_count: 1 } }) });
  const init = await initRes.json() as any;
  if (!initRes.ok || init?.error?.code !== "ok" || !init?.data?.upload_url) throw new Error(init?.error?.message || init?.error?.code || "TikTok yukleme baslatilamadi");
  const put = await fetch(init.data.upload_url, { method: "PUT", headers: { "Content-Type": file.mimetype, "Content-Length": String(size), "Content-Range": `bytes 0-${size - 1}/${size}` }, body: new Uint8Array(file.buffer) });
  if (![200, 201, 206].includes(put.status)) throw new Error(`TikTok video aktarimi basarisiz (${put.status})`);
  return { publishId: String(init.data.publish_id), message: "Video TikTok taslak kutusuna gönderildi. TikTok uygulamasından yayınlayın." };
}

export async function disconnect() {
  for (const key of ["access_token", "refresh_token", "access_token_expires_at", "refresh_token_expires_at", "open_id", "display_name", "scopes"]) await deleteTenantSetting("goldmoodastro", "tiktok", key);
}
