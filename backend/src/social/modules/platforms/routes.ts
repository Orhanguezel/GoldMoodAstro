import type { FastifyInstance } from "fastify";
import { db } from "../../db/client";
import { platformAccounts, socialPosts } from "../../db/schema";
import { and, eq, desc, like } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { env } from "../../core/env";
import * as facebook from "./facebook";
import * as instagram from "./instagram";
import * as linkedin from "./linkedin";
import * as xPlatform from "./x";
import { getXCredsForTenant } from "./publisher";
import * as telegram from "./telegram";
import * as publisher from "./publisher";
import * as ytOauth from "./youtube-oauth";
import * as platformRepo from "./repository";
import { google } from "googleapis";
import { type OAuth1Creds } from "./x-oauth1";
import { getMetaHealth } from "./meta-health";
import * as postRepo from "../posts/repository";

function isCompleteOauth1(meta: unknown): meta is { oauth1: OAuth1Creds } {
  const oauth1 = (meta as { oauth1?: Partial<OAuth1Creds> } | null | undefined)?.oauth1;
  return !!(
    oauth1?.apiKey &&
    oauth1.apiSecret &&
    oauth1.accessToken &&
    oauth1.accessTokenSecret
  );
}

export async function platformsRoutes(app: FastifyInstance) {
  const sanitizeAccount = (account: typeof platformAccounts.$inferSelect) => ({
    ...account,
    accessToken: account.accessToken ? "***" : null,
    refreshToken: account.refreshToken ? "***" : null,
    pageToken: account.pageToken ? "***" : null,
    meta: isCompleteOauth1(account.meta) ? { oauth1: { connected: true } } : account.meta,
    hasAccessToken: !!account.accessToken,
    hasRefreshToken: !!account.refreshToken,
    hasPageToken: !!account.pageToken,
    hasOAuth1: isCompleteOauth1(account.meta),
  });

  const tenantKeyFrom = (_raw: unknown): string => "goldmoodastro"; // de-tenant: tek tenant

  const upsertPlatformAccount = async (params: {
    tenantKey: string;
    platform: "facebook" | "instagram" | "telegram" | "linkedin" | "x" | "youtube";
    accountName: string;
    accountId?: string | null;
    accessToken?: string | null;
    refreshToken?: string | null;
    pageId?: string | null;
    pageToken?: string | null;
    tokenExpires?: Date | null;
    meta?: unknown;
  }) => {
    const [existing] = await db
      .select()
      .from(platformAccounts)
      .where(and(eq(platformAccounts.tenantKey, params.tenantKey), eq(platformAccounts.platform, params.platform)))
      .limit(1);

    if (existing) {
      // `undefined` = bu kolona dokunma (mevcut deger korunur); `null` = bilincli temizle.
      const set: Record<string, unknown> = { accountName: params.accountName, isActive: 1 };
      if (params.accountId !== undefined) set.accountId = params.accountId ?? null;
      if (params.accessToken !== undefined) set.accessToken = params.accessToken ?? null;
      if (params.refreshToken !== undefined) set.refreshToken = params.refreshToken ?? null;
      if (params.pageId !== undefined) set.pageId = params.pageId ?? null;
      if (params.pageToken !== undefined) set.pageToken = params.pageToken ?? null;
      if (params.tokenExpires !== undefined) set.tokenExpires = params.tokenExpires ?? null;
      if (params.meta !== undefined) set.meta = (params.meta ?? null) as any;
      await db
        .update(platformAccounts)
        .set(set as any)
        .where(eq(platformAccounts.id, existing.id));
      return;
    }

    await db.insert(platformAccounts).values({
      uuid: uuidv4(),
      tenantKey: params.tenantKey,
      platform: params.platform,
      accountName: params.accountName,
      accountId: params.accountId ?? null,
      accessToken: params.accessToken ?? null,
      refreshToken: params.refreshToken ?? null,
      pageId: params.pageId ?? null,
      pageToken: params.pageToken ?? null,
      tokenExpires: params.tokenExpires ?? null,
      meta: (params.meta ?? null) as any,
      isActive: 1,
    });
  };

  app.get("/", async (req, reply) => {
    const tenantKey = tenantKeyFrom((req.query as any)?.tenantKey);
    const items = await db.select().from(platformAccounts).where(eq(platformAccounts.tenantKey, tenantKey));
    return reply.send({ items: items.map(sanitizeAccount) });
  });

  app.get("/status", async (req, reply) => {
    const tenantKey = typeof (req.query as any)?.tenantKey === "string" ? (req.query as any).tenantKey : undefined;
    return reply.send(await publisher.checkPlatformStatus(tenantKey));
  });

  app.get("/:tenantKey/health", async (req, reply) => {
    try {
      const tenantKey = tenantKeyFrom((req.params as { tenantKey?: string }).tenantKey);
      return reply.send(await getMetaHealth(tenantKey));
    } catch (error) {
      return reply.status(400).send({ error: (error as Error).message });
    }
  });

  app.get("/errors", async (req, reply) => {
    const tenantKey = tenantKeyFrom((req.query as any)?.tenantKey);
    const items = await db
      .select()
      .from(socialPosts)
      .where(and(eq(socialPosts.subType, tenantKey), eq(socialPosts.status, "failed")))
      .orderBy(desc(socialPosts.updatedAt))
      .limit(50);
    return reply.send({ items });
  });

  app.get("/:id/status", async (req, reply) => {
    const { id } = req.params as { id: string };
    const [row] = await db.select().from(platformAccounts).where(eq(platformAccounts.id, Number(id))).limit(1);
    if (!row) return reply.status(404).send({ error: "Platform bulunamadi" });
    return reply.send({
      ...sanitizeAccount(row),
      tokenValid: row.tokenExpires ? new Date(row.tokenExpires) > new Date() : null,
    });
  });

  app.post("/facebook/connect", async (req, reply) => {
    const { tenantKey, pageAccessToken, pageName, pageId } = req.body as any;
    if (!pageAccessToken) return reply.status(400).send({ error: "pageAccessToken gerekli" });

    let finalToken = pageAccessToken;
    try {
      finalToken = (await facebook.exchangeForLongLivedToken(pageAccessToken)).access_token;
    } catch {}

    await upsertPlatformAccount({
      tenantKey: tenantKeyFrom(tenantKey),
      platform: "facebook",
      accountName: pageName || "Facebook",
      accountId: pageId || null,
      pageId: pageId || null,
      pageToken: finalToken,
      accessToken: finalToken,
    });
    return reply.send({ ok: true });
  });

  app.get("/facebook/oauth-client", async (req, reply) => {
    try {
      const tenantKey = tenantKeyFrom((req.query as any)?.tenantKey);
      return reply.send({ item: await platformRepo.getTenantOAuthClientSummary(tenantKey, "facebook") });
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.post("/facebook/oauth-client", async (req, reply) => {
    try {
      const { tenantKey, clientId, clientSecret, redirectUri } = req.body as any;
      const normalizedTenant = tenantKeyFrom(tenantKey);
      const cleanClientId = typeof clientId === "string" ? clientId.trim() : "";
      const rawSecret = typeof clientSecret === "string" ? clientSecret.trim() : "";
      const cleanSecret = rawSecret === "__KEEP__" ? "" : rawSecret;
      const cleanRedirectUri = typeof redirectUri === "string" ? redirectUri.trim() : "";
      if (!cleanClientId || !cleanRedirectUri) return reply.status(400).send({ error: "clientId ve redirectUri gerekli" });
      await platformRepo.upsertTenantOAuthClient({
        tenantKey: normalizedTenant,
        platform: "facebook",
        clientId: cleanClientId,
        clientSecret: cleanSecret || null,
        redirectUri: cleanRedirectUri,
      });
      return reply.send({ ok: true });
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.post("/instagram/connect", async (req, reply) => {
    const { tenantKey, accessToken, accountId, accountName } = req.body as any;
    if (!accessToken || !accountId) return reply.status(400).send({ error: "accessToken ve accountId gerekli" });
    await upsertPlatformAccount({
      tenantKey: tenantKeyFrom(tenantKey),
      platform: "instagram",
      accountName: accountName || "Instagram",
      accountId,
      accessToken,
    });
    return reply.send({ ok: true });
  });

  app.post("/linkedin/connect", async (req, reply) => {
    const { tenantKey, accessToken, authorUrn, accountName } = req.body as any;
    if (!accessToken || !authorUrn) return reply.status(400).send({ error: "accessToken ve authorUrn gerekli" });
    await upsertPlatformAccount({
      tenantKey: tenantKeyFrom(tenantKey),
      platform: "linkedin",
      accountName: accountName || "LinkedIn",
      accountId: authorUrn,
      accessToken,
    });
    return reply.send({ ok: true });
  });

  app.post("/x/connect", async (req, reply) => {
    const { tenantKey, bearerToken, userId, accountName, oauth1 } = req.body as any;
    const o = oauth1 || {};
    const oauth1Complete = !!(o.apiKey && o.apiSecret && o.accessToken && o.accessTokenSecret);
    if (!bearerToken && !oauth1Complete) {
      return reply.status(400).send({ error: "bearerToken veya OAuth1 4 token gerekli" });
    }
    await upsertPlatformAccount({
      tenantKey: tenantKeyFrom(tenantKey),
      platform: "x",
      accountName: accountName || "X",
      accountId: userId || null,
      accessToken: bearerToken || undefined,
      meta: oauth1Complete
        ? {
            oauth1: {
              apiKey: String(o.apiKey),
              apiSecret: String(o.apiSecret),
              accessToken: String(o.accessToken),
              accessTokenSecret: String(o.accessTokenSecret),
            },
          }
        : undefined,
    });
    return reply.send({ ok: true });
  });

  app.post("/manual/connect", async (req, reply) => {
    const { tenantKey, platform, accountName, accountId, accessToken, refreshToken, pageId, pageToken, oauth1 } = req.body as any;
    if (!platform) return reply.status(400).send({ error: "platform gerekli" });

    // Maskeli/degismemis secret sentinel'i: bu deger gelirse "dokunma" (mevcut korunur).
    const KEEP = "__KEEP__";
    // Bos string veya sentinel => undefined (kolona dokunma). Gercek deger => set.
    const keepable = (v: unknown): string | null | undefined => {
      if (v === undefined || v === KEEP) return undefined;
      const s = typeof v === "string" ? v : v == null ? "" : String(v);
      return s.trim() === "" ? undefined : s;
    };

    let meta: unknown = undefined;
    let nextAccessToken = keepable(accessToken);
    let nextRefreshToken = keepable(refreshToken);
    let nextPageId = keepable(pageId);
    let nextPageToken = keepable(pageToken);

    if (platform === "x") {
      const o = oauth1 || {};
      const o1 = {
        apiKey: keepable(o.apiKey),
        apiSecret: keepable(o.apiSecret),
        accessToken: keepable(o.accessToken),
        accessTokenSecret: keepable(o.accessTokenSecret),
      };
      const allProvided = o1.apiKey && o1.apiSecret && o1.accessToken && o1.accessTokenSecret;
      if (allProvided) {
        meta = {
          oauth1: {
            apiKey: String(o1.apiKey),
            apiSecret: String(o1.apiSecret),
            accessToken: String(o1.accessToken),
            accessTokenSecret: String(o1.accessTokenSecret),
          },
        };
      } else {
        // Hicbiri girilmediyse: mevcut hesap tam oauth1'e sahipse koru, degilse hata.
        const [existingX] = await db
          .select()
          .from(platformAccounts)
          .where(and(eq(platformAccounts.tenantKey, tenantKeyFrom(tenantKey)), eq(platformAccounts.platform, "x")))
          .limit(1);
        const anyProvided = o1.apiKey || o1.apiSecret || o1.accessToken || o1.accessTokenSecret;
        if (anyProvided || !existingX || !isCompleteOauth1(existingX.meta)) {
          return reply.status(400).send({ error: "X icin 4 OAuth1 token zorunlu" });
        }
        meta = undefined; // mevcut meta korunur
      }
      nextAccessToken = undefined;
      nextRefreshToken = undefined;
      nextPageId = undefined;
      nextPageToken = undefined;
    }

    await upsertPlatformAccount({
      tenantKey: tenantKeyFrom(tenantKey),
      platform,
      accountName: accountName || platform,
      accountId: keepable(accountId),
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken,
      pageId: nextPageId,
      pageToken: nextPageToken,
      meta,
    });
    return reply.send({ ok: true });
  });

  app.get("/linkedin/auth-url", async (req, reply) => {
    const tenantKey = tenantKeyFrom((req.query as any)?.tenantKey);
    const client = await platformRepo.getTenantOAuthClient(tenantKey, "linkedin");
    if (!client) return reply.status(400).send({ error: "Tenant'a ozel LinkedIn OAuth client eksik" });
    const url = linkedin.buildLinkedInAuthUrl({
      clientId: client.clientId,
      redirectUri: client.redirectUri,
      state: tenantKey,
      scope: "openid profile email w_organization_social r_organization_social",
    });
    return reply.send({ url });
  });

  app.post("/linkedin/callback", async (req, reply) => {
    const { tenantKey, code, authorUrn, accountName, redirectUri } = req.body as any;
    if (!code) return reply.status(400).send({ error: "code gerekli" });
    const normalizedTenant = tenantKeyFrom(tenantKey);
    const client = await platformRepo.getTenantOAuthClient(normalizedTenant, "linkedin");
    if (!client) return reply.status(400).send({ error: "Tenant'a ozel LinkedIn OAuth client eksik" });
    const effectiveRedirectUri = redirectUri || client.redirectUri;
    const token = await linkedin.exchangeCodeForToken({
      clientId: client.clientId,
      clientSecret: client.clientSecret,
      code,
      redirectUri: effectiveRedirectUri,
    });
    let urn = typeof authorUrn === "string" ? authorUrn.trim() : "";
    let displayName = typeof accountName === "string" ? accountName.trim() : "";
    if (!urn) {
      const [existing] = await db
        .select()
        .from(platformAccounts)
        .where(and(eq(platformAccounts.tenantKey, normalizedTenant), eq(platformAccounts.platform, "linkedin")))
        .limit(1);
      const existingAccountId = typeof existing?.accountId === "string" ? existing.accountId.trim() : "";
      if (existingAccountId.startsWith("urn:li:organization:")) {
        urn = existingAccountId;
        if (!displayName) displayName = existing?.accountName || "LinkedIn";
      } else {
        const id = await linkedin.getLinkedInUserIdentity(token.access_token);
        urn = id.urn;
        if (!displayName) displayName = id.name;
      }
    }
    await upsertPlatformAccount({
      tenantKey: normalizedTenant,
      platform: "linkedin",
      accountName: displayName || "LinkedIn",
      accountId: urn,
      accessToken: token.access_token,
      refreshToken: token.refresh_token ?? null,
      tokenExpires: token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : null,
    });
    return reply.send({ ok: true });
  });

  app.get("/linkedin/oauth-client", async (req, reply) => {
    try {
      const tenantKey = tenantKeyFrom((req.query as any)?.tenantKey);
      const item = await platformRepo.getTenantOAuthClientSummary(tenantKey, "linkedin");
      return reply.send({ item });
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.post("/linkedin/oauth-client", async (req, reply) => {
    try {
      const { tenantKey, clientId, clientSecret, redirectUri } = req.body as any;
      const normalizedTenant = tenantKeyFrom(tenantKey);
      const cleanClientId = typeof clientId === "string" ? clientId.trim() : "";
      const rawSecret = typeof clientSecret === "string" ? clientSecret.trim() : "";
      const cleanSecret = rawSecret === "__KEEP__" ? "" : rawSecret;
      const cleanRedirectUri = typeof redirectUri === "string" ? redirectUri.trim() : "";
      if (!cleanClientId || !cleanRedirectUri) {
        return reply.status(400).send({ error: "clientId ve redirectUri gerekli" });
      }
      await platformRepo.upsertTenantOAuthClient({
        tenantKey: normalizedTenant,
        platform: "linkedin",
        clientId: cleanClientId,
        clientSecret: cleanSecret || null,
        redirectUri: cleanRedirectUri,
      });
      return reply.send({ ok: true });
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.get("/linkedin/manual-queue", async (req, reply) => {
    const tenantKey = tenantKeyFrom((req.query as any)?.tenantKey);
    const items = await db
      .select()
      .from(socialPosts)
      .where(and(eq(socialPosts.subType, tenantKey), like(socialPosts.notes, "%[linkedin_manual_pending]%")))
      .orderBy(desc(socialPosts.updatedAt));
    return reply.send({
      items: items.map((item) => ({ ...item, status: "manual_pending" as const })),
    });
  });

  app.post("/linkedin/manual-queue/:postId/posted", async (req, reply) => {
    const postId = Number((req.params as { postId: string }).postId);
    const tenantKey = tenantKeyFrom((req.body as { tenantKey?: string })?.tenantKey);
    if (!Number.isInteger(postId) || postId <= 0) return reply.status(400).send({ error: "postId gecersiz" });
    const [post] = await db
      .select({ id: socialPosts.id })
      .from(socialPosts)
      .where(and(eq(socialPosts.id, postId), eq(socialPosts.subType, tenantKey), like(socialPosts.notes, "%[linkedin_manual_pending]%")))
      .limit(1);
    if (!post) return reply.status(404).send({ error: "Manuel LinkedIn kuyruk kaydi bulunamadi" });
    await postRepo.markLinkedInManualPosted(postId);
    await db
      .update(platformAccounts)
      .set({ lastPostAt: new Date(), lastError: null })
      .where(and(eq(platformAccounts.tenantKey, tenantKey), eq(platformAccounts.platform, "linkedin")));
    return reply.send({ ok: true });
  });

  app.get("/x/auth-url", async (req, reply) => {
    const tenantKey = tenantKeyFrom((req.query as any)?.tenantKey);
    const codeChallenge = String((req.query as any)?.codeChallenge || "").trim();
    if (!env.X_CLIENT_ID || !env.X_REDIRECT_URI) return reply.status(400).send({ error: "X OAuth env eksik" });
    if (!codeChallenge) return reply.status(400).send({ error: "codeChallenge gerekli" });
    const url = xPlatform.buildXAuthUrl({
      clientId: env.X_CLIENT_ID,
      redirectUri: env.X_REDIRECT_URI,
      state: tenantKey,
      codeChallenge,
    });
    return reply.send({ url });
  });

  app.post("/x/callback", async (req, reply) => {
    const { tenantKey, code, codeVerifier, userId, accountName, redirectUri } = req.body as any;
    if (!code || !codeVerifier) return reply.status(400).send({ error: "code ve codeVerifier gerekli" });
    if (!env.X_CLIENT_ID || !env.X_CLIENT_SECRET) return reply.status(400).send({ error: "X OAuth env eksik" });
    const token = await xPlatform.exchangeCodeForToken({
      clientId: env.X_CLIENT_ID,
      clientSecret: env.X_CLIENT_SECRET,
      code,
      codeVerifier,
      redirectUri: redirectUri || env.X_REDIRECT_URI,
    });
    let uid = typeof userId === "string" ? userId.trim() : "";
    let displayName = typeof accountName === "string" ? accountName.trim() : "";
    if (!uid) {
      const me = await xPlatform.getOAuth2Me(token.access_token);
      uid = me.id;
      if (!displayName) {
        displayName = me.name ?? (me.username ? `@${me.username}` : "X");
      }
    }
    await upsertPlatformAccount({
      tenantKey: tenantKeyFrom(tenantKey),
      platform: "x",
      accountName: displayName || "X",
      accountId: uid,
      accessToken: token.access_token,
      refreshToken: token.refresh_token ?? null,
      tokenExpires: token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : null,
    });
    return reply.send({ ok: true });
  });

  app.get("/youtube/oauth-client", async (req, reply) => {
    try {
      const tenantKey = tenantKeyFrom((req.query as any)?.tenantKey);
      const client = await platformRepo.getTenantOAuthClientSummary(tenantKey, "youtube");
      return reply.send({
        item: client,
        devFallbackAvailable: !!(env.YOUTUBE_OAUTH_CLIENT_ID_DEV && env.YOUTUBE_OAUTH_CLIENT_SECRET_DEV),
      });
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.post("/youtube/oauth-client", async (req, reply) => {
    try {
      const { tenantKey, clientId, clientSecret, redirectUri } = req.body as any;
      const normalizedTenant = tenantKeyFrom(tenantKey);
      const cleanClientId = typeof clientId === "string" ? clientId.trim() : "";
      const cleanSecret = typeof clientSecret === "string" ? clientSecret.trim() : "";
      const cleanRedirectUri =
        typeof redirectUri === "string" && redirectUri.trim()
          ? redirectUri.trim()
          : env.YOUTUBE_OAUTH_REDIRECT_URI;
      if (!cleanClientId) return reply.status(400).send({ error: "clientId gerekli" });
      await platformRepo.upsertTenantOAuthClient({
        tenantKey: normalizedTenant,
        platform: "youtube",
        clientId: cleanClientId,
        clientSecret: cleanSecret || null,
        redirectUri: cleanRedirectUri,
      });
      return reply.send({ ok: true });
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.get("/youtube/oauth/start", async (req, reply) => {
    try {
      const tenantKey = tenantKeyFrom((req.query as any)?.tenantKey);
      const url = await ytOauth.buildAuthUrl(tenantKey);
      return reply.redirect(url);
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.get("/youtube/oauth/callback", async (req, reply) => {
    try {
      const code = typeof (req.query as any)?.code === "string" ? (req.query as any).code.trim() : "";
      const state = tenantKeyFrom((req.query as any)?.state);
      if (!code) return reply.status(400).send({ error: "code gerekli" });
      const tokens = await ytOauth.exchangeCodeForTokens(state, code);
      const channel = await ytOauth.fetchChannelInfo(state, tokens.accessToken);
      await platformRepo.upsertYouTubeAccount({
        tenantKey: state,
        channelId: channel.channelId,
        channelTitle: channel.title,
        uploadPlaylistId: channel.uploadPlaylistId,
        tokens,
      });
      return reply.redirect(`${env.FRONTEND_URL}/settings?oauth=youtube_ok`);
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.post("/youtube/disconnect", async (req, reply) => {
    try {
      const { accountUuid, accountId } = req.body as any;
      const target = String(accountUuid || accountId || "").trim();
      if (!target) return reply.status(400).send({ error: "accountUuid gerekli" });
      await platformRepo.deactivateAccount(target);
      return reply.send({ ok: true });
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.post("/facebook/test", async (req, reply) => {
    try {
      const tenantKey = tenantKeyFrom((req.body as any)?.tenantKey);
      const accounts = await db.select().from(platformAccounts).where(eq(platformAccounts.tenantKey, tenantKey));
      const fb = accounts.find((a) => a.platform === "facebook");
      const fbAccessToken = fb?.pageToken || fb?.accessToken;
      if (!fb?.pageId || !fbAccessToken) return reply.status(400).send({ error: "Tenant icin Facebook hesabi bulunamadi" });
      const result = await facebook.publishTextPost("🧪 Test", undefined, { pageId: fb.pageId, pageAccessToken: fbAccessToken });
      return reply.send({ ok: true, postId: result.id });
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.post("/instagram/test", async (req, reply) => {
    const { tenantKey, imageUrl } = req.body as any;
    try {
      const tk = tenantKeyFrom(tenantKey);
      const accounts = await db.select().from(platformAccounts).where(eq(platformAccounts.tenantKey, tk));
      const ig = accounts.find((a) => a.platform === "instagram");
      if (!ig?.accountId || !ig.accessToken) return reply.status(400).send({ error: "Tenant icin Instagram hesabi bulunamadi" });
      const img = (typeof imageUrl === "string" && imageUrl.trim()) || env.IG_TEST_IMAGE_URL?.trim();
      if (!img) return reply.status(400).send({ error: "imageUrl gerekli veya IG_TEST_IMAGE_URL .env ile tanimlayin" });
      const result = await instagram.publishPhotoPost(img, "🧪 Test", { accountId: ig.accountId, accessToken: ig.accessToken });
      return reply.send({ ok: true, mediaId: result.id });
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.post("/linkedin/test", async (req, reply) => {
    try {
      const tenantKey = tenantKeyFrom((req.body as any)?.tenantKey);
      const result = await publisher.publishLinkedInPost(tenantKey, "Ekosistem SaaS LinkedIn test postu");
      return reply.send({ ok: true, postId: result.id });
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.post("/x/test", async (req, reply) => {
    try {
      const tenantKey = tenantKeyFrom((req.body as any)?.tenantKey);
      const result = await publisher.publishXPost(tenantKey, "Ekosistem SaaS X test postu");
      return reply.send({ ok: true, postId: result.id });
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.post("/telegram/test", async (req, reply) => {
    const tenantKeyRaw = (req.body as any)?.tenantKey;
    const tenantKey = typeof tenantKeyRaw === "string" && tenantKeyRaw.trim() ? tenantKeyFrom(tenantKeyRaw) : undefined;
    const ok = await telegram.sendMessage("🧪 <b>Sosyal Medya Paneli Test</b>", undefined, { tenantKey });
    return reply.send({ ok });
  });

  app.get("/facebook/info", async (req, reply) => {
    try {
      const tenantKey = typeof (req.query as any)?.tenantKey === "string" ? (req.query as any).tenantKey.trim() : "";
      if (!tenantKey) return reply.send(await facebook.getPageInfo());
      const accounts = await db.select().from(platformAccounts).where(eq(platformAccounts.tenantKey, tenantKey));
      const acc = accounts.find((a) => a.platform === "facebook");
      const token = acc?.pageToken || acc?.accessToken;
      if (!acc?.pageId || !token) return reply.status(404).send({ error: "Facebook hesabi yok veya token/pageId eksik" });
      return reply.send(await facebook.getPageInfo({ pageId: acc.pageId, pageAccessToken: token }));
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.get("/facebook/posts", async (req, reply) => {
    try {
      const tenantKey = typeof (req.query as any)?.tenantKey === "string" ? (req.query as any).tenantKey.trim() : "";
      const limit = Number((req.query as any)?.limit) || 25;
      if (!tenantKey) return reply.send(await facebook.getPagePosts({ limit }));
      const accounts = await db.select().from(platformAccounts).where(eq(platformAccounts.tenantKey, tenantKey));
      const acc = accounts.find((a) => a.platform === "facebook");
      const token = acc?.pageToken || acc?.accessToken;
      if (!acc?.pageId || !token) return reply.status(404).send({ error: "Facebook hesabi yok veya token/pageId eksik" });
      return reply.send(await facebook.getPagePosts({ pageId: acc.pageId, pageAccessToken: token, limit }));
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.get("/facebook/posts/:postId/details", async (req, reply) => {
    try {
      const tenantKey = typeof (req.query as any)?.tenantKey === "string" ? (req.query as any).tenantKey.trim() : "";
      const postId = (req.params as { postId: string }).postId;
      if (!tenantKey) return reply.send(await facebook.getPagePostDetails(postId));
      const accounts = await db.select().from(platformAccounts).where(eq(platformAccounts.tenantKey, tenantKey));
      const acc = accounts.find((a) => a.platform === "facebook");
      const token = acc?.pageToken || acc?.accessToken;
      if (!token) return reply.status(404).send({ error: "Facebook hesabi yok veya token eksik" });
      return reply.send(await facebook.getPagePostDetails(postId, { pageAccessToken: token }));
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.post("/facebook/comments/:commentId/reply", async (req, reply) => {
    try {
      const tenantKey = typeof (req.body as any)?.tenantKey === "string" ? (req.body as any).tenantKey.trim() : "";
      const commentId = (req.params as { commentId: string }).commentId;
      const message = typeof (req.body as any)?.message === "string" ? (req.body as any).message : "";
      if (!tenantKey) return reply.send(await facebook.replyToComment(commentId, message));
      const accounts = await db.select().from(platformAccounts).where(eq(platformAccounts.tenantKey, tenantKey));
      const acc = accounts.find((a) => a.platform === "facebook");
      const token = acc?.pageToken || acc?.accessToken;
      if (!token) return reply.status(404).send({ error: "Facebook hesabi yok veya token eksik" });
      return reply.send(await facebook.replyToComment(commentId, message, { pageAccessToken: token }));
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.get("/instagram/media", async (req, reply) => {
    try {
      const tenantKey = typeof (req.query as any)?.tenantKey === "string" ? (req.query as any).tenantKey.trim() : "";
      const limit = Number((req.query as any)?.limit) || 25;
      if (!tenantKey) return reply.send(await instagram.getRecentMedia({ limit }));
      const accounts = await db.select().from(platformAccounts).where(eq(platformAccounts.tenantKey, tenantKey));
      const acc = accounts.find((a) => a.platform === "instagram");
      const token = acc?.accessToken || acc?.pageToken;
      if (!acc?.accountId || !token) return reply.status(404).send({ error: "Instagram hesabi yok veya token/accountId eksik" });
      return reply.send(await instagram.getRecentMedia({ accountId: acc.accountId, accessToken: token, limit }));
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.get("/instagram/media/:mediaId/details", async (req, reply) => {
    try {
      const tenantKey = typeof (req.query as any)?.tenantKey === "string" ? (req.query as any).tenantKey.trim() : "";
      const mediaId = (req.params as { mediaId: string }).mediaId;
      if (!tenantKey) return reply.send(await instagram.getMediaDetails(mediaId));
      const accounts = await db.select().from(platformAccounts).where(eq(platformAccounts.tenantKey, tenantKey));
      const acc = accounts.find((a) => a.platform === "instagram");
      const token = acc?.accessToken || acc?.pageToken;
      if (!token) return reply.status(404).send({ error: "Instagram hesabi yok veya token eksik" });
      return reply.send(await instagram.getMediaDetails(mediaId, { accessToken: token }));
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.post("/instagram/comments/:commentId/reply", async (req, reply) => {
    try {
      const tenantKey = typeof (req.body as any)?.tenantKey === "string" ? (req.body as any).tenantKey.trim() : "";
      const commentId = (req.params as { commentId: string }).commentId;
      const message = typeof (req.body as any)?.message === "string" ? (req.body as any).message : "";
      if (!tenantKey) return reply.send(await instagram.replyToComment(commentId, message));
      const accounts = await db.select().from(platformAccounts).where(eq(platformAccounts.tenantKey, tenantKey));
      const acc = accounts.find((a) => a.platform === "instagram");
      const token = acc?.accessToken || acc?.pageToken;
      if (!token) return reply.status(404).send({ error: "Instagram hesabi yok veya token eksik" });
      return reply.send(await instagram.replyToComment(commentId, message, { accessToken: token }));
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  // X hesap içeriği — CANLI X API'den (DB'ye bağımlı değil). FB/IG ile aynı mantık:
  // Hesap İçeriği sekmesi gerçek @hesap tweet'lerini + metrikleri gösterir.
  app.get("/x/account-tweets", async (req, reply) => {
    try {
      const tenantKey = typeof (req.query as any)?.tenantKey === "string" ? (req.query as any).tenantKey.trim() : "";
      const limit = Math.min(Math.max(Number((req.query as any)?.limit) || 25, 1), 100);

      // Bazı tenant'ların tweet'leri kendi sitesinin cross-DB feed'inde tutuluyor (örn. haldefiyat
      // siteyi yayınlıyor). O feed gösterim(impression)+medya+gerçek metrik döner — canlı X API'den
      // daha zengin. Tanımlıysa onu kullan; değilse canlı X API'ye düş.
      const X_FEED_URLS: Record<string, string> = {
        haldefiyat: "https://haldefiyat.com/api/v1/social/feed",
      };
      const feedUrl = X_FEED_URLS[tenantKey];
      if (feedUrl) {
        const fr = await fetch(`${feedUrl}?platform=twitter&limit=${limit}`, {
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(12000),
        });
        const data = (await fr.json()) as any;
        const items = (data?.items || []).map((t: any) => ({
          externalId: String(t.postId || ""),
          message: t.text || "",
          createdTime: t.postedAt || null,
          imageUrl: Array.isArray(t.mediaUrls) && t.mediaUrls[0] ? t.mediaUrls[0] : null,
          likes: t.likes ?? null,
          comments: t.comments ?? null,
          shares: t.shares ?? 0,
          impressions: t.impressions ?? t.reach ?? null,
          permalink: t.url || null,
        }));
        return reply.send({ items });
      }

      const creds = tenantKey ? await getXCredsForTenant(tenantKey) : null;
      if (!creds) return reply.status(404).send({ error: "X hesabi bagli degil" });
      // userId: platform_accounts.account_id, yoksa OAuth1 access token prefix ({userId}-{secret})
      const accounts = await db.select().from(platformAccounts).where(eq(platformAccounts.tenantKey, tenantKey));
      const acc = accounts.find((a) => a.platform === "x");
      const userId = (acc?.accountId || (creds.accessToken || "").split("-")[0] || "").trim();
      if (!userId) return reply.status(404).send({ error: "X user id bulunamadi" });
      const tweets = await xPlatform.getUserTweetsOAuth1(creds, userId, null, { maxPages: 1 });
      const items = tweets.slice(0, limit).map((t) => ({
        externalId: t.tweetId,
        message: t.text,
        createdTime: t.createdAt,
        imageUrl: null,
        likes: t.likeCount,
        comments: t.replyCount,
        shares: t.retweetCount,
        impressions: t.impressionCount,
        permalink: `https://x.com/i/web/status/${t.tweetId}`,
      }));
      return reply.send({ items });
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.get("/instagram/info", async (req, reply) => {
    try {
      const tenantKey = typeof (req.query as any)?.tenantKey === "string" ? (req.query as any).tenantKey.trim() : "";
      if (!tenantKey) return reply.send(await instagram.getAccountInfo());
      const accounts = await db.select().from(platformAccounts).where(eq(platformAccounts.tenantKey, tenantKey));
      const acc = accounts.find((a) => a.platform === "instagram");
      const token = acc?.accessToken || acc?.pageToken;
      if (!acc?.accountId || !token) return reply.status(404).send({ error: "Instagram hesabi yok veya token/accountId eksik" });
      return reply.send(await instagram.getAccountInfo({ accountId: acc.accountId, accessToken: token }));
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.get("/linkedin/info", async (req, reply) => {
    try {
      const tenantKey = tenantKeyFrom((req.query as any)?.tenantKey);
      const accounts = await db.select().from(platformAccounts).where(eq(platformAccounts.tenantKey, tenantKey));
      const acc = accounts.find((a) => a.platform === "linkedin");
      if (!acc?.accessToken) return reply.status(404).send({ error: "LinkedIn hesabi yok" });
      return reply.send(await linkedin.getAccountInfo(acc.accessToken));
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.get("/x/info", async (req, reply) => {
    try {
      const tenantKey = tenantKeyFrom((req.query as any)?.tenantKey);
      const accounts = await db.select().from(platformAccounts).where(eq(platformAccounts.tenantKey, tenantKey));
      const acc = accounts.find((a) => a.platform === "x");
      if (!acc?.accessToken || !acc.accountId) return reply.status(404).send({ error: "X hesabi yok veya userId eksik" });
      return reply.send(await xPlatform.getAccountInfo(acc.accessToken, acc.accountId));
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.get("/youtube/info", async (req, reply) => {
    try {
      const tenantKey = tenantKeyFrom((req.query as any)?.tenantKey);
      const acc = await platformRepo.getYouTubeAccountByTenant(tenantKey);
      if (!acc) return reply.status(404).send({ error: "YouTube hesabı bulunamadı" });

      let token = acc.accessToken;
      if (acc.tokenExpires && new Date(acc.tokenExpires) <= new Date()) {
        if (!acc.refreshToken) throw new Error("Yenileme tokenı eksik");
        const refreshed = await ytOauth.refreshAccessToken(tenantKey, acc.refreshToken);
        token = refreshed.accessToken;
        await db
          .update(platformAccounts)
          .set({
            accessToken: refreshed.accessToken,
            tokenExpires: refreshed.tokenExpires,
          })
          .where(eq(platformAccounts.id, acc.id));
      }
      if (!acc.accountId) throw new Error("YouTube kanal ID'si bulunamadı");
      const channelId = acc.accountId;

      const client = await ytOauth.makeOAuthClient(tenantKey);
      client.setCredentials({ access_token: token });
      const youtube = google.youtube({ version: "v3", auth: client });

      const channelRes = await youtube.channels.list({
        part: ["snippet", "statistics"],
        id: [channelId],
      });
      const channel = channelRes.data.items?.[0];

      const uploadPlaylistId = (acc.meta as any)?.uploadPlaylistId;
      let videos: any[] = [];
      if (uploadPlaylistId) {
        try {
          const playlistRes = await youtube.playlistItems.list({
            part: ["snippet", "contentDetails"],
            playlistId: uploadPlaylistId,
            maxResults: 10,
          });
          videos = (playlistRes.data.items || []).map((item: any) => ({
            videoId: item.contentDetails?.videoId || item.snippet?.resourceId?.videoId,
            title: item.snippet?.title,
            description: item.snippet?.description,
            publishedAt: item.snippet?.publishedAt,
            thumbnails: item.snippet?.thumbnails,
          }));
        } catch (e) {
          console.error("Playlist item fetch error:", e);
        }
      }

      return reply.send({
        channel: {
          id: acc.accountId,
          title: channel?.snippet?.title || acc.accountName,
          customUrl: channel?.snippet?.customUrl,
          description: channel?.snippet?.description,
          thumbnails: channel?.snippet?.thumbnails,
          statistics: {
            subscriberCount: channel?.statistics?.subscriberCount || "0",
            viewCount: channel?.statistics?.viewCount || "0",
            videoCount: channel?.statistics?.videoCount || "0",
          },
        },
        videos,
      });
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.post("/facebook/refresh-token", async (req, reply) => {
    const { token } = req.body as { token?: string };
    if (!token) return reply.status(400).send({ error: "token gerekli" });
    try {
      return reply.send(await facebook.exchangeForLongLivedToken(token));
    } catch (err) {
      return reply.status(400).send({ error: (err as Error).message });
    }
  });

  app.delete("/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    await db.delete(platformAccounts).where(eq(platformAccounts.id, Number(id)));
    return reply.send({ ok: true });
  });
}
