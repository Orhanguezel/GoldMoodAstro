import { google } from "googleapis";
import * as platformRepo from "./repository";

// DIKKAT — kapsam degisiklikleri YENIDEN YETKILENDIRME ister:
// mevcut refresh token'lar verildikleri andaki kapsam setini tasir, listeye scope
// eklemek eski baglantilari otomatik yukseltmez. Kanal /admin/youtube'dan yeniden
// baglanana kadar yeni yetenekler 403 insufficientPermissions doner.
//
// force-ssl neden gerekli (2026-08-09'da eklendi):
//   videos.delete    -> youtube | youtube.force-ssl  (youtube.upload YETMEZ)
//   comments.insert  -> youtube.force-ssl
// Okuma taraflari (videos.list, playlistItems.list, commentThreads.list) zaten
// youtube.readonly ile calisiyor.
const YOUTUBE_SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/youtube.force-ssl",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
];

export async function makeOAuthClient(tenantKey: string) {
  const config = await platformRepo.getTenantOAuthClient(tenantKey, "youtube");
  if (!config) {
    throw new Error("YouTube OAuth client tanimli degil (tenant DB veya dev fallback)");
  }
  return new google.auth.OAuth2(config.clientId, config.clientSecret, config.redirectUri);
}

export async function buildAuthUrl(tenantKey: string): Promise<string> {
  const client = await makeOAuthClient(tenantKey);
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: YOUTUBE_SCOPES,
    state: tenantKey,
  });
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenExpires: Date;
}

export async function exchangeCodeForTokens(tenantKey: string, code: string): Promise<OAuthTokens> {
  const client = await makeOAuthClient(tenantKey);
  const { tokens } = await client.getToken(code);
  if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
    throw new Error("YouTube OAuth: eksik token alani");
  }
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    tokenExpires: new Date(tokens.expiry_date),
  };
}

export async function refreshAccessToken(
  tenantKey: string,
  refreshToken: string,
): Promise<{ accessToken: string; tokenExpires: Date }> {
  const client = await makeOAuthClient(tenantKey);
  client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await client.refreshAccessToken();
  if (!credentials.access_token || !credentials.expiry_date) {
    throw new Error("YouTube token refresh basarisiz");
  }
  return {
    accessToken: credentials.access_token,
    tokenExpires: new Date(credentials.expiry_date),
  };
}

export async function fetchChannelInfo(
  tenantKey: string,
  accessToken: string,
): Promise<{ channelId: string; title: string; uploadPlaylistId: string }> {
  const client = await makeOAuthClient(tenantKey);
  client.setCredentials({ access_token: accessToken });
  const youtube = google.youtube({ version: "v3", auth: client });
  const res = await youtube.channels.list({
    part: ["snippet", "contentDetails"],
    mine: true,
  });
  const channel = res.data.items?.[0];
  if (!channel?.id) throw new Error("YouTube kanali bulunamadi");
  return {
    channelId: channel.id,
    title: channel.snippet?.title || "YouTube",
    uploadPlaylistId: channel.contentDetails?.relatedPlaylists?.uploads || "",
  };
}
