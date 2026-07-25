import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "../../db/client";
import { platformAccounts, siteSettings } from "../../db/schema";
import { assertXApiBudget } from "../platforms/x-budget";
import * as xPlatform from "../platforms/x";
import type { XObservedTweet } from "../platforms/x";
import type { OAuth1Creds } from "../platforms/x-oauth1";
import * as postRepo from "./repository";

type PlatformAccount = typeof platformAccounts.$inferSelect;

type SyncDeps = {
  getAccount: (tenantKey: string) => Promise<PlatformAccount | null>;
  resolveCreds: (tenantKey: string, account: PlatformAccount | null) => OAuth1Creds | null;
  getSetting: (key: string) => Promise<string | null>;
  setSetting: (key: string, value: string) => Promise<void>;
  assertReadBudget: () => Promise<void>;
  fetchTweets: (
    creds: OAuth1Creds,
    userId: string,
    sinceId: string | null,
    opts: { maxPages: number },
  ) => Promise<XObservedTweet[]>;
  existsBySourceRef: (sourceRef: string, tenantKey: string) => Promise<boolean>;
  insertImportedTweet: (input: {
    tenantKey: string;
    caption: string;
    xTweetId: string;
    postedAt: Date;
    sourceRef: string;
  }) => Promise<unknown>;
};

export type XOwnTweetSyncResult = {
  tenantKey: string;
  fetched: number;
  imported: number;
  skipped: number;
  sinceId: string | null;
};

function isCompleteOauth1(meta: unknown): meta is { oauth1: OAuth1Creds } {
  const oauth1 = (meta as { oauth1?: Partial<OAuth1Creds> } | null | undefined)?.oauth1;
  return !!(
    oauth1?.apiKey &&
    oauth1.apiSecret &&
    oauth1.accessToken &&
    oauth1.accessTokenSecret
  );
}

function ownTweetsSinceKey(tenantKey: string) {
  return `x:owntweets:since:${tenantKey}`;
}

async function upsertSetting(key: string, value: string, locale = "tr") {
  const [existing] = await db
    .select()
    .from(siteSettings)
    .where(and(eq(siteSettings.key, key), eq(siteSettings.locale, locale)))
    .limit(1);

  if (existing) {
    await db.update(siteSettings).set({ value }).where(eq(siteSettings.id, existing.id));
    return;
  }

  await db.insert(siteSettings).values({ id: randomUUID(), key, locale, value });
}

async function getSetting(key: string, locale = "tr") {
  const [row] = await db
    .select()
    .from(siteSettings)
    .where(and(eq(siteSettings.key, key), eq(siteSettings.locale, locale)))
    .limit(1);
  return row?.value ?? null;
}

async function getXAccount(tenantKey: string) {
  const [account] = await db
    .select()
    .from(platformAccounts)
    .where(
      and(
        eq(platformAccounts.tenantKey, tenantKey),
        eq(platformAccounts.platform, "x"),
        eq(platformAccounts.isActive, 1),
      ),
    )
    .limit(1);
  return account ?? null;
}

function resolveCreds(tenantKey: string, account: PlatformAccount | null) {
  if (isCompleteOauth1(account?.meta)) return account.meta.oauth1;
  if (tenantKey === "haldefiyat" && xPlatform.hasOAuth1Credentials()) return xPlatform.getOAuth1Creds();
  return null;
}

function maxTweetId(current: string | null, next: string) {
  try {
    if (!current) return next;
    return BigInt(next) > BigInt(current) ? next : current;
  } catch {
    return current;
  }
}

export async function syncXOwnTweetsWithDeps(
  rawTenantKey: string,
  deps: SyncDeps,
): Promise<XOwnTweetSyncResult> {
  const tenantKey = rawTenantKey.trim();
  if (!tenantKey) throw new Error("Tenant key zorunlu");

  const account = await deps.getAccount(tenantKey);
  const creds = deps.resolveCreds(tenantKey, account);
  const userId = account?.accountId?.trim();
  if (!creds) throw new Error(`Tenant (${tenantKey}) icin X OAuth1 hesabi bagli degil`);
  if (!userId) throw new Error(`Tenant (${tenantKey}) icin X user id/accountId eksik`);

  const sinceKey = ownTweetsSinceKey(tenantKey);
  const previousSinceId = await deps.getSetting(sinceKey);
  await deps.assertReadBudget();

  const tweets = await deps.fetchTweets(creds, userId, previousSinceId, {
    maxPages: previousSinceId ? 1 : 2,
  });

  let imported = 0;
  let skipped = 0;
  let newestTweetId = previousSinceId;

  for (const tweet of tweets) {
    newestTweetId = maxTweetId(newestTweetId, tweet.tweetId);
    const sourceRef = `${tenantKey}:owntweet:${tweet.tweetId}`;
    if (await deps.existsBySourceRef(sourceRef, tenantKey)) {
      skipped += 1;
      continue;
    }

    await deps.insertImportedTweet({
      tenantKey,
      caption: tweet.text,
      xTweetId: tweet.tweetId,
      postedAt: tweet.createdAt ?? new Date(),
      sourceRef,
    });
    imported += 1;
  }

  if (newestTweetId && newestTweetId !== previousSinceId) {
    await deps.setSetting(sinceKey, newestTweetId);
  }

  return {
    tenantKey,
    fetched: tweets.length,
    imported,
    skipped,
    sinceId: newestTweetId ?? null,
  };
}

export async function syncXOwnTweets(tenantKey: string) {
  return syncXOwnTweetsWithDeps(tenantKey, {
    getAccount: getXAccount,
    resolveCreds,
    getSetting,
    setSetting: upsertSetting,
    assertReadBudget: () => assertXApiBudget("read"),
    fetchTweets: xPlatform.getUserTweetsOAuth1,
    existsBySourceRef: postRepo.existsBySourceRef,
    insertImportedTweet: postRepo.insertImportedTweet,
  });
}
