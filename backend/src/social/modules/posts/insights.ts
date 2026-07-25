import { and, desc, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../db/client";
import { ensurePostCommentsTable } from "../../db/ensure";
import {
  platformAccounts,
  postAnalytics,
  postComments,
  socialPosts,
} from "../../db/schema";
import * as xPlatform from "../platforms/x";
import { type OAuth1Creds } from "../platforms/x-oauth1";
import * as ytAnalytics from "../analytics/youtube";
import * as ytOauth from "../platforms/youtube-oauth";
import * as platformRepo from "../platforms/repository";
import { env } from "../../core/env";

const GRAPH_URL = `https://graph.facebook.com/${env.META_GRAPH_API_VERSION}`;
const COMMENT_LIMIT = 25;

type MetaPlatform = "facebook" | "instagram";
type AnalyticsPlatform = MetaPlatform | "x" | "youtube";
type SocialPost = typeof socialPosts.$inferSelect;
type PlatformAccount = typeof platformAccounts.$inferSelect;

type NormalizedMetric = {
  platform: AnalyticsPlatform;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  reach: number;
  impressions: number;
  clicks: number;
  engagementRate: number;
  fetchedAt: Date;
};

type RemoteComment = {
  platform: MetaPlatform;
  externalCommentId: string;
  parentCommentId?: string | null;
  authorName?: string | null;
  authorId?: string | null;
  message: string;
  likeCount: number;
  createdTime: Date | null;
};

type RemotePostSnapshot = {
  platform: AnalyticsPlatform;
  permalink?: string | null;
  mediaUrl?: string | null;
  message?: string | null;
  createdTime?: string | null;
};

type PlatformRefreshResult = {
  metric: NormalizedMetric;
  comments: RemoteComment[];
  remote: RemotePostSnapshot;
};

function toNumber(value: unknown): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function clampEngagementRate(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(999.99, Number(value.toFixed(2)));
}

function calculateEngagementRate(metric: Omit<NormalizedMetric, "engagementRate" | "fetchedAt">) {
  const interactions =
    metric.likes + metric.comments + metric.shares + metric.saves + metric.clicks;
  const denominator = metric.reach || metric.impressions;
  if (!denominator) return 0;
  return clampEngagementRate((interactions / denominator) * 100);
}

function serializeMetric(row: typeof postAnalytics.$inferSelect) {
  return {
    ...row,
    likes: toNumber(row.likes),
    comments: toNumber(row.comments),
    shares: toNumber(row.shares),
    saves: toNumber(row.saves),
    reach: toNumber(row.reach),
    impressions: toNumber(row.impressions),
    clicks: toNumber(row.clicks),
    engagementRate: toNumber(row.engagementRate),
  };
}

function serializeComment(row: typeof postComments.$inferSelect) {
  return {
    ...row,
    likeCount: toNumber(row.likeCount),
  };
}

function graphErrorMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object") {
    const error = (data as { error?: { message?: unknown } }).error;
    if (typeof error?.message === "string" && error.message.trim()) {
      return error.message;
    }
  }
  return fallback;
}

async function graphGet<T>(
  path: string,
  token: string,
  params: Record<string, string> = {},
): Promise<T> {
  const url = new URL(`${GRAPH_URL}/${path.replace(/^\//, "")}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("access_token", token);

  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(graphErrorMessage(data, res.statusText));
  }
  return data as T;
}

async function getPost(postId: number) {
  const [post] = await db
    .select()
    .from(socialPosts)
    .where(eq(socialPosts.id, postId))
    .limit(1);
  return post ?? null;
}

async function getActiveAccount(tenantKey: string | null, platform: MetaPlatform) {
  const keys = [tenantKey || "goldmoodastro"];
  if (!keys.includes("goldmoodastro")) keys.push("goldmoodastro");

  for (const key of keys) {
    const [account] = await db
      .select()
      .from(platformAccounts)
      .where(
        and(
          eq(platformAccounts.tenantKey, key),
          eq(platformAccounts.platform, platform),
          eq(platformAccounts.isActive, 1),
        ),
      )
      .limit(1);
    if (account) return account;
  }

  return null;
}

function resolveToken(account: PlatformAccount, platform: MetaPlatform) {
  if (platform === "facebook") return account.pageToken || account.accessToken || null;
  return account.accessToken || account.pageToken || null;
}

function resolveTargets(post: SocialPost): MetaPlatform[] {
  const targets: MetaPlatform[] = [];
  if (post.fbPostId) targets.push("facebook");
  if (post.igMediaId) targets.push("instagram");
  return targets;
}

function isCompleteOauth1(meta: unknown): meta is { oauth1: OAuth1Creds } {
  const oauth1 = (meta as { oauth1?: Partial<OAuth1Creds> } | null | undefined)?.oauth1;
  return !!(
    oauth1?.apiKey &&
    oauth1.apiSecret &&
    oauth1.accessToken &&
    oauth1.accessTokenSecret
  );
}

async function resolveXOAuth1Credentials(tenantKey: string | null) {
  const normalizedTenant = tenantKey || "goldmoodastro";
  const [account] = await db
    .select()
    .from(platformAccounts)
    .where(
      and(
        eq(platformAccounts.tenantKey, normalizedTenant),
        eq(platformAccounts.platform, "x"),
        eq(platformAccounts.isActive, 1),
      ),
    )
    .limit(1);
  if (isCompleteOauth1(account?.meta)) return account.meta.oauth1;
  if (normalizedTenant === "haldefiyat" && xPlatform.hasOAuth1Credentials()) {
    return xPlatform.getOAuth1Creds();
  }
  return null;
}

async function fetchFacebookPost(
  post: SocialPost,
  token: string,
): Promise<PlatformRefreshResult> {
  if (!post.fbPostId) throw new Error("Facebook post ID bulunamadi");

  const fields = [
    "id",
    "message",
    "created_time",
    "permalink_url",
    "full_picture",
    "shares",
    "reactions.summary(true).limit(0)",
    `comments.summary(true).limit(${COMMENT_LIMIT}){id,message,created_time,from,like_count}`,
  ].join(",");

  const data = await graphGet<any>(post.fbPostId, token, { fields });
  const baseMetric = {
    platform: "facebook" as const,
    likes: toNumber(data.reactions?.summary?.total_count),
    comments: toNumber(data.comments?.summary?.total_count),
    shares: toNumber(data.shares?.count),
    saves: 0,
    reach: 0,
    impressions: 0,
    clicks: 0,
  };

  const comments = Array.isArray(data.comments?.data)
    ? data.comments.data
        .filter((comment: any) => typeof comment?.id === "string")
        .map((comment: any): RemoteComment => ({
          platform: "facebook",
          externalCommentId: comment.id,
          authorName: typeof comment.from?.name === "string" ? comment.from.name : null,
          authorId: typeof comment.from?.id === "string" ? comment.from.id : null,
          message: typeof comment.message === "string" ? comment.message : "",
          likeCount: toNumber(comment.like_count),
          createdTime: parseDate(comment.created_time),
        }))
    : [];

  return {
    metric: {
      ...baseMetric,
      engagementRate: calculateEngagementRate(baseMetric),
      fetchedAt: new Date(),
    },
    comments,
    remote: {
      platform: "facebook",
      permalink: data.permalink_url ?? null,
      mediaUrl: data.full_picture ?? null,
      message: data.message ?? null,
      createdTime: data.created_time ?? null,
    },
  };
}

async function fetchInstagramPost(
  post: SocialPost,
  token: string,
): Promise<PlatformRefreshResult> {
  if (!post.igMediaId) throw new Error("Instagram medya ID bulunamadi");

  const fieldsWithComments = [
    "id",
    "caption",
    "media_type",
    "media_url",
    "permalink",
    "timestamp",
    "like_count",
    "comments_count",
    `comments.limit(${COMMENT_LIMIT}){id,text,timestamp,username,like_count}`,
  ].join(",");

  let data: any;
  try {
    data = await graphGet<any>(post.igMediaId, token, { fields: fieldsWithComments });
  } catch {
    data = await graphGet<any>(post.igMediaId, token, {
      fields: "id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count",
    });
  }

  const insightValues = await fetchInstagramInsightValues(post.igMediaId, token);
  const baseMetric = {
    platform: "instagram" as const,
    likes: toNumber(data.like_count),
    comments: toNumber(data.comments_count),
    shares: toNumber(insightValues.shares),
    saves: toNumber(insightValues.saved),
    reach: toNumber(insightValues.reach),
    // Meta v21+ media insights'ta impressions yerine views donuyor. Mevcut
    // DB/rapor kolonu geriye uyumluluk icin impressions adini koruyor.
    impressions: insightValues.views,
    clicks: 0,
  };

  const comments = Array.isArray(data.comments?.data)
    ? data.comments.data
        .filter((comment: any) => typeof comment?.id === "string")
        .map((comment: any): RemoteComment => ({
          platform: "instagram",
          externalCommentId: comment.id,
          authorName: typeof comment.username === "string" ? comment.username : null,
          message: typeof comment.text === "string" ? comment.text : "",
          likeCount: toNumber(comment.like_count),
          createdTime: parseDate(comment.timestamp),
        }))
    : [];

  return {
    metric: {
      ...baseMetric,
      engagementRate: calculateEngagementRate(baseMetric),
      fetchedAt: new Date(),
    },
    comments,
    remote: {
      platform: "instagram",
      permalink: data.permalink ?? null,
      mediaUrl: data.media_url ?? null,
      message: data.caption ?? null,
      createdTime: data.timestamp ?? null,
    },
  };
}

async function fetchInstagramInsightValues(mediaId: string, token: string) {
  const metricNames = ["views", "reach", "saved", "shares", "total_interactions"] as const;
  const data = await graphGet<any>(`${mediaId}/insights`, token, {
    metric: metricNames.join(","),
  });
  const result: Partial<Record<(typeof metricNames)[number], number>> = {};
  for (const item of data.data || []) {
    if (metricNames.includes(item?.name)) {
      result[item.name as (typeof metricNames)[number]] = toNumber(item.values?.[0]?.value);
    }
  }
  const missing = metricNames.filter((name) => result[name] === undefined);
  if (missing.length > 0) throw new Error(`Instagram insight metrikleri eksik: ${missing.join(", ")}`);
  return result as Record<(typeof metricNames)[number], number>;
}

async function saveMetric(postId: number, metric: NormalizedMetric) {
  await db.insert(postAnalytics).values({
    postId,
    platform: metric.platform,
    likes: metric.likes,
    comments: metric.comments,
    shares: metric.shares,
    saves: metric.saves,
    reach: metric.reach,
    impressions: metric.impressions,
    clicks: metric.clicks,
    engagementRate: metric.engagementRate.toFixed(2),
    fetchedAt: metric.fetchedAt,
  });
}

function normalizeXMetric(metric: xPlatform.XTweetMetric, fetchedAt: Date): NormalizedMetric {
  const baseMetric = {
    platform: "x" as const,
    likes: metric.likes,
    comments: metric.comments,
    shares: metric.shares,
    saves: 0,
    reach: 0,
    impressions: metric.impressions,
    clicks: metric.clicks,
  };
  return {
    ...baseMetric,
    engagementRate: calculateEngagementRate(baseMetric),
    fetchedAt,
  };
}

async function refreshXMetric(post: SocialPost, fetchedAt: Date) {
  if (!post.xTweetId) return null;
  const creds = await resolveXOAuth1Credentials(post.subType);
  if (!creds) throw new Error("X hesabi bagli degil");

  const [metric] = await xPlatform.getTweetMetricsOAuth1(creds, [post.xTweetId]);
  if (!metric) throw new Error("X metrik yaniti bos");

  const normalized = normalizeXMetric(metric, fetchedAt);
  await saveMetric(post.id, normalized);
  return {
    metric: normalized,
    remote: {
      platform: "x" as const,
      permalink: `https://x.com/i/web/status/${post.xTweetId}`,
      message: post.caption,
      createdTime: post.postedAt?.toISOString?.() ?? null,
    },
  };
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function upsertComment(postId: number, comment: RemoteComment, fetchedAt: Date) {
  const [existing] = await db
    .select({ id: postComments.id })
    .from(postComments)
    .where(
      and(
        eq(postComments.postId, postId),
        eq(postComments.platform, comment.platform),
        eq(postComments.externalCommentId, comment.externalCommentId),
      ),
    )
    .limit(1);

  const values = {
    parentCommentId: comment.parentCommentId ?? null,
    authorName: comment.authorName ?? null,
    authorId: comment.authorId ?? null,
    message: comment.message,
    likeCount: comment.likeCount,
    createdTime: comment.createdTime,
    fetchedAt,
  };

  if (existing) {
    await db
      .update(postComments)
      .set(values)
      .where(eq(postComments.id, existing.id));
    return;
  }

  await db.insert(postComments).values({
    uuid: uuidv4(),
    postId,
    platform: comment.platform,
    externalCommentId: comment.externalCommentId,
    ...values,
  });
}

export async function refreshPostMetrics(
  postId: number,
  opts: { includeX?: boolean } = {},
) {
  await ensurePostCommentsTable();

  const post = await getPost(postId);
  if (!post) throw new Error("Post bulunamadi");

  const targets = resolveTargets(post);
  const analytics: NormalizedMetric[] = [];
  const remotes: RemotePostSnapshot[] = [];
  const errors: string[] = [];
  const fetchedAt = new Date();
  const includeX = opts.includeX ?? true;

  if (targets.length === 0) {
    if (!post.xTweetId || !includeX) {
      errors.push("Bu kayitta yayin ID'si bulunamadi");
    }
  }

  for (const platform of targets) {
    const account = await getActiveAccount(post.subType, platform);
    const token = account ? resolveToken(account, platform) : null;
    if (!account || !token) {
      errors.push(`${platform}: bagli hesap tokeni bulunamadi`);
      continue;
    }

    try {
      const result =
        platform === "facebook"
          ? await fetchFacebookPost(post, token)
          : await fetchInstagramPost(post, token);

      await saveMetric(post.id, { ...result.metric, fetchedAt });
      for (const comment of result.comments) {
        await upsertComment(post.id, comment, fetchedAt);
      }

      analytics.push({ ...result.metric, fetchedAt });
      remotes.push(result.remote);
      if (account.lastError?.startsWith("Instagram insights:")) {
        await db.update(platformAccounts).set({ lastError: null }).where(eq(platformAccounts.id, account.id));
      }
    } catch (err) {
      const message = `${platform}: ${(err as Error).message}`;
      errors.push(message);
      if (platform === "instagram") {
        await db
          .update(platformAccounts)
          .set({
            lastError: `Instagram insights: ${(err as Error).message}`.slice(0, 500),
            errorCount: (account.errorCount ?? 0) + 1,
          })
          .where(eq(platformAccounts.id, account.id));
      }
    }
  }

  if (includeX && post.xTweetId) {
    try {
      const result = await refreshXMetric(post, fetchedAt);
      if (result) {
        analytics.push(result.metric);
        remotes.push(result.remote);
      }
    } catch (err) {
      errors.push(`x: ${(err as Error).message}`);
    }
  }

  if (post.youtubeVideoId) {
    try {
      const account = await platformRepo.getYouTubeAccountByTenant(post.subType || "goldmoodastro");
      if (!account) {
        errors.push("youtube: bagli hesap bulunamadi");
      } else {
        let token = account.accessToken;
        if (account.tokenExpires && new Date(account.tokenExpires) <= new Date()) {
          if (!account.refreshToken) throw new Error("Yenileme tokeni eksik");
          const refreshed = await ytOauth.refreshAccessToken(account.tenantKey, account.refreshToken);
          token = refreshed.accessToken;
          await db
            .update(platformAccounts)
            .set({
              accessToken: refreshed.accessToken,
              tokenExpires: refreshed.tokenExpires,
            })
            .where(eq(platformAccounts.id, account.id));
        }

        const ytAccountInput = {
          tenantKey: account.tenantKey,
          accessToken: token || "",
          refreshToken: account.refreshToken || "",
          tokenExpires: account.tokenExpires || new Date(),
          channelId: account.accountId || "",
        };

        const ytStats = await ytAnalytics.fetchVideoStats(post.youtubeVideoId, ytAccountInput);
        const baseMetric = {
          platform: "youtube" as const,
          likes: ytStats.statistics.likes,
          comments: ytStats.statistics.comments,
          shares: 0,
          saves: 0,
          reach: 0,
          impressions: ytStats.statistics.views,
          clicks: 0,
        };

        const normalized = {
          ...baseMetric,
          engagementRate: calculateEngagementRate(baseMetric),
          fetchedAt,
        };

        await saveMetric(post.id, normalized);
        analytics.push(normalized);
        remotes.push({
          platform: "youtube",
          permalink: `https://www.youtube.com/watch?v=${post.youtubeVideoId}`,
          message: ytStats.title,
          createdTime: ytStats.publishedAt,
        });
      }
    } catch (err) {
      errors.push(`youtube: ${(err as Error).message}`);
    }
  }

  return {
    ok: analytics.length > 0 && errors.length === 0,
    postId,
    refreshedAt: fetchedAt,
    analytics,
    remotes,
    errors,
  };
}

export async function refreshXPostMetricsBatch(posts: SocialPost[]) {
  const xPosts = posts.filter((post) => post.xTweetId);
  const fetchedAt = new Date();
  const analytics: NormalizedMetric[] = [];
  const errors: string[] = [];

  const byTenant = new Map<string, SocialPost[]>();
  for (const post of xPosts) {
    const tenantKey = post.subType || "goldmoodastro";
    const rows = byTenant.get(tenantKey) || [];
    rows.push(post);
    byTenant.set(tenantKey, rows);
  }

  for (const [tenantKey, tenantPosts] of byTenant) {
    const creds = await resolveXOAuth1Credentials(tenantKey);
    if (!creds) {
      errors.push(`${tenantKey}: X hesabi bagli degil`);
      continue;
    }

    const byTweetId = new Map<string, SocialPost[]>();
    for (const post of tenantPosts) {
      const tweetId = post.xTweetId?.trim();
      if (!tweetId) continue;
      const rows = byTweetId.get(tweetId) || [];
      rows.push(post);
      byTweetId.set(tweetId, rows);
    }

    for (const ids of chunk(Array.from(byTweetId.keys()), 100)) {
      try {
        const metrics = await xPlatform.getTweetMetricsOAuth1(creds, ids);
        const returnedIds = new Set<string>();
        for (const metric of metrics) {
          returnedIds.add(metric.tweetId);
          const normalized = normalizeXMetric(metric, fetchedAt);
          for (const post of byTweetId.get(metric.tweetId) || []) {
            await saveMetric(post.id, normalized);
            analytics.push(normalized);
          }
        }
        for (const id of ids) {
          if (!returnedIds.has(id)) {
            errors.push(`${tenantKey}/${id}: X metrik yaniti bos`);
          }
        }
      } catch (err) {
        errors.push(`${tenantKey}: ${(err as Error).message}`);
      }
    }
  }

  return {
    ok: analytics.length > 0 && errors.length === 0,
    refreshedAt: fetchedAt,
    analytics,
    errors,
  };
}

export async function getPostDetails(postId: number, opts: { refresh?: boolean } = {}) {
  await ensurePostCommentsTable();

  let refreshResult: Awaited<ReturnType<typeof refreshPostMetrics>> | null = null;
  if (opts.refresh) {
    refreshResult = await refreshPostMetrics(postId);
  }

  const post = await getPost(postId);
  if (!post) throw new Error("Post bulunamadi");

  const analyticsRows = await db
    .select()
    .from(postAnalytics)
    .where(eq(postAnalytics.postId, postId))
    .orderBy(desc(postAnalytics.fetchedAt))
    .limit(40);

  const commentsRows = await db
    .select()
    .from(postComments)
    .where(eq(postComments.postId, postId))
    .orderBy(desc(postComments.createdTime), desc(postComments.fetchedAt))
    .limit(50);

  const latestByPlatform = new Map<AnalyticsPlatform, ReturnType<typeof serializeMetric>>();
  for (const row of analyticsRows) {
    const platform = row.platform as AnalyticsPlatform;
    if (!latestByPlatform.has(platform)) {
      latestByPlatform.set(platform, serializeMetric(row));
    }
  }

  return {
    post,
    analytics: Array.from(latestByPlatform.values()),
    analyticsHistory: analyticsRows.map(serializeMetric),
    comments: commentsRows.map(serializeComment),
    refreshed: refreshResult,
  };
}
