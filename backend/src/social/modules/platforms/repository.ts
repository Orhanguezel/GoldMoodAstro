import { and, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../db/client";
import { platformAccounts, tenantOauthClients } from "../../db/schema";
import { decryptSecret, encryptSecret } from "../../core/crypto";
import { env } from "../../core/env";

/** tenant_oauth_clients.platform enum ile ayni kume */
export type OAuthPlatform =
  | "youtube"
  | "google"
  | "facebook"
  | "instagram"
  | "linkedin"
  | "x";

export interface TenantOAuthClient {
  tenantKey: string;
  platform: OAuthPlatform;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  source: "db" | "dev-fallback";
}

export async function getTenantOAuthClient(
  tenantKey: string,
  platform: OAuthPlatform,
): Promise<TenantOAuthClient | null> {
  const [row] = await db
    .select()
    .from(tenantOauthClients)
    .where(
      and(
        eq(tenantOauthClients.tenantKey, tenantKey),
        eq(tenantOauthClients.platform, platform),
        eq(tenantOauthClients.isActive, 1),
      ),
    )
    .limit(1);

  if (row) {
    return {
      tenantKey: row.tenantKey,
      platform: row.platform,
      clientId: row.clientId,
      clientSecret: decryptSecret(row.clientSecretEncrypted),
      redirectUri: row.redirectUri,
      source: "db",
    };
  }

  if (
    platform === "youtube" &&
    env.YOUTUBE_OAUTH_CLIENT_ID_DEV &&
    env.YOUTUBE_OAUTH_CLIENT_SECRET_DEV
  ) {
    return {
      tenantKey,
      platform,
      clientId: env.YOUTUBE_OAUTH_CLIENT_ID_DEV,
      clientSecret: env.YOUTUBE_OAUTH_CLIENT_SECRET_DEV,
      redirectUri: env.YOUTUBE_OAUTH_REDIRECT_URI,
      source: "dev-fallback",
    };
  }

  return null;
}

export async function getTenantOAuthClientSummary(tenantKey: string, platform: OAuthPlatform) {
  const [row] = await db
    .select({
      id: tenantOauthClients.id,
      uuid: tenantOauthClients.uuid,
      tenantKey: tenantOauthClients.tenantKey,
      platform: tenantOauthClients.platform,
      clientId: tenantOauthClients.clientId,
      redirectUri: tenantOauthClients.redirectUri,
      isActive: tenantOauthClients.isActive,
      updatedAt: tenantOauthClients.updatedAt,
    })
    .from(tenantOauthClients)
    .where(and(eq(tenantOauthClients.tenantKey, tenantKey), eq(tenantOauthClients.platform, platform)))
    .limit(1);

  return row ? { ...row, hasClientSecret: true } : null;
}

export async function upsertTenantOAuthClient(input: {
  tenantKey: string;
  platform: OAuthPlatform;
  clientId: string;
  clientSecret?: string | null;
  redirectUri: string;
}) {
  const [existing] = await db
    .select()
    .from(tenantOauthClients)
    .where(and(eq(tenantOauthClients.tenantKey, input.tenantKey), eq(tenantOauthClients.platform, input.platform)))
    .limit(1);

  const set: Record<string, unknown> = {
    clientId: input.clientId,
    redirectUri: input.redirectUri,
    isActive: 1,
  };

  if (input.clientSecret) {
    set.clientSecretEncrypted = encryptSecret(input.clientSecret);
  }

  if (existing) {
    if (!input.clientSecret && !existing.clientSecretEncrypted) {
      throw new Error("clientSecret gerekli");
    }
    await db.update(tenantOauthClients).set(set as any).where(eq(tenantOauthClients.id, existing.id));
    return;
  }

  if (!input.clientSecret) {
    throw new Error("clientSecret gerekli");
  }

  await db.insert(tenantOauthClients).values({
    uuid: uuidv4(),
    tenantKey: input.tenantKey,
    platform: input.platform,
    clientId: input.clientId,
    clientSecretEncrypted: encryptSecret(input.clientSecret),
    redirectUri: input.redirectUri,
    isActive: 1,
  });
}

export async function upsertYouTubeAccount(input: {
  tenantKey: string;
  channelId: string;
  channelTitle: string;
  uploadPlaylistId: string;
  tokens: {
    accessToken: string;
    refreshToken: string;
    tokenExpires: Date;
  };
}) {
  const [existing] = await db
    .select()
    .from(platformAccounts)
    .where(and(eq(platformAccounts.tenantKey, input.tenantKey), eq(platformAccounts.platform, "youtube")))
    .limit(1);

  const values = {
    accountName: input.channelTitle || "YouTube",
    accountId: input.channelId,
    accessToken: input.tokens.accessToken,
    refreshToken: input.tokens.refreshToken,
    tokenExpires: input.tokens.tokenExpires,
    meta: {
      channelTitle: input.channelTitle,
      uploadPlaylistId: input.uploadPlaylistId,
    },
    isActive: 1,
  };

  if (existing) {
    await db.update(platformAccounts).set(values as any).where(eq(platformAccounts.id, existing.id));
    return;
  }

  await db.insert(platformAccounts).values({
    uuid: uuidv4(),
    tenantKey: input.tenantKey,
    platform: "youtube",
    ...values,
  });
}

export async function getYouTubeAccountByTenant(tenantKey: string) {
  const [row] = await db
    .select()
    .from(platformAccounts)
    .where(
      and(
        eq(platformAccounts.tenantKey, tenantKey),
        eq(platformAccounts.platform, "youtube"),
        eq(platformAccounts.isActive, 1),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function deactivateAccount(uuidOrId: string) {
  const numericId = Number(uuidOrId);
  const where = Number.isFinite(numericId)
    ? eq(platformAccounts.id, numericId)
    : eq(platformAccounts.uuid, uuidOrId);
  await db.update(platformAccounts).set({ isActive: 0 }).where(where);
}
