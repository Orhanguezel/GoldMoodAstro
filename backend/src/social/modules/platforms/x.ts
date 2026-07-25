import { env } from "../../core/env";
import { buildOAuth1Header, type OAuth1Creds } from "./x-oauth1";
import { consumeXApiUsage } from "./x-budget";

export interface XPostResult {
  id: string;
}

export interface PublishTweetOpts {
  text: string;
  mediaIds?: string[];
  replyToTweetId?: string;
}

export interface ThreadPartInput {
  text: string;
  mediaIds?: string[];
}

export interface XTweetMetric {
  tweetId: string;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  clicks: number;
}

export interface XMention {
  tweetId: string;
  authorId: string;
  authorName?: string | null;
  authorUsername?: string | null;
  text: string;
  createdAt: Date | null;
  conversationId?: string | null;
  repliedToTweetId?: string | null;
  likeCount: number;
}

export interface XObservedTweet {
  tweetId: string;
  authorId?: string | null;
  authorName?: string | null;
  authorUsername?: string | null;
  text: string;
  createdAt: Date | null;
  likeCount: number;
  replyCount: number;
  retweetCount: number;
  quoteCount: number;
  impressionCount: number;
}

type XTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
};

const TWEET_ENDPOINT = "https://api.twitter.com/2/tweets";
const TWEETS_LOOKUP_ENDPOINT = "https://api.twitter.com/2/tweets";
const USER_ENDPOINT = "https://api.twitter.com/2/users";
const RECENT_SEARCH_ENDPOINT = "https://api.twitter.com/2/tweets/search/recent";
const MEDIA_UPLOAD_ENDPOINT = "https://upload.twitter.com/1.1/media/upload.json";
const MEDIA_CHUNK_BYTES = 4 * 1024 * 1024;
const MEDIA_PROCESSING_TIMEOUT_MS = 90_000;
const SUPPORTED_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const SUPPORTED_VIDEO_MIME_TYPES = new Set(["video/mp4"]);

export function getOAuth1Creds(): OAuth1Creds {
  const creds = {
    apiKey: env.X_API_KEY,
    apiSecret: env.X_API_SECRET,
    accessToken: env.X_ACCESS_TOKEN,
    accessTokenSecret: env.X_ACCESS_TOKEN_SECRET,
  };
  if (!hasOAuth1Credentials()) {
    throw new Error("X OAuth 1.0a credentials eksik (.env X_API_KEY/X_API_SECRET/X_ACCESS_TOKEN/X_ACCESS_TOKEN_SECRET)");
  }
  return creds;
}

export function hasOAuth1Credentials(): boolean {
  return !!(env.X_API_KEY && env.X_API_SECRET && env.X_ACCESS_TOKEN && env.X_ACCESS_TOKEN_SECRET);
}

export function buildXAuthUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
  scope?: string;
}) {
  const scope = params.scope || "tweet.read tweet.write users.read offline.access";
  const q = new URLSearchParams({
    response_type: "code",
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    scope,
    state: params.state,
    code_challenge: params.codeChallenge,
    code_challenge_method: "S256",
  });
  return `https://twitter.com/i/oauth2/authorize?${q.toString()}`;
}

export async function exchangeCodeForToken(params: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<XTokenResponse> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    redirect_uri: params.redirectUri,
    client_id: params.clientId,
    code_verifier: params.codeVerifier,
  });
  const basic = Buffer.from(`${params.clientId}:${params.clientSecret}`).toString("base64");
  const res = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: body.toString(),
  });
  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(String(data.error_description ?? data.error ?? "X token exchange failed"));
  }
  return data as unknown as XTokenResponse;
}

export async function publishTextPost(bearerToken: string, text: string): Promise<XPostResult> {
  const res = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
  const data = (await res.json()) as any;
  if (!res.ok) {
    throw new Error(data?.detail ?? data?.title ?? "X publish failed");
  }
  return { id: String(data?.data?.id ?? "unknown") };
}

export function validateTweetText(text: string) {
  if (!text.trim()) {
    throw new Error("X tweet metni bos olamaz");
  }
  if (text.length > 280) {
    throw new Error("X tweet metni 280 karakteri asamaz");
  }
}

function parseXError(data: any, fallback: string) {
  return data?.detail ?? data?.title ?? data?.error ?? (JSON.stringify(data).slice(0, 300) || fallback);
}

async function parseJsonResponse(res: Response) {
  return (await res.json().catch(() => ({}))) as any;
}

function parseXUsers(includes: any) {
  const users = new Map<string, { name?: string; username?: string }>();
  for (const user of Array.isArray(includes?.users) ? includes.users : []) {
    if (user?.id) {
      users.set(String(user.id), {
        name: typeof user.name === "string" ? user.name : undefined,
        username: typeof user.username === "string" ? user.username : undefined,
      });
    }
  }
  return users;
}

function parseXDate(value: unknown) {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function parseObservedTweets(data: any): XObservedTweet[] {
  const users = parseXUsers(data.includes);
  return (Array.isArray(data.data) ? data.data : []).map((tweet: any) => {
    const authorId = typeof tweet.author_id === "string" ? tweet.author_id : null;
    const author = authorId ? users.get(authorId) : undefined;
    const publicMetrics = tweet.public_metrics || {};
    const organicMetrics = tweet.organic_metrics || {};
    const nonPublicMetrics = tweet.non_public_metrics || {};
    return {
      tweetId: String(tweet.id),
      authorId,
      authorName: author?.name ?? null,
      authorUsername: author?.username ?? null,
      text: String(tweet.text ?? ""),
      createdAt: parseXDate(tweet.created_at),
      likeCount: Number(publicMetrics.like_count ?? 0),
      replyCount: Number(publicMetrics.reply_count ?? 0),
      retweetCount: Number(publicMetrics.retweet_count ?? 0),
      quoteCount: Number(publicMetrics.quote_count ?? 0),
      impressionCount: Number(organicMetrics.impression_count ?? nonPublicMetrics.impression_count ?? 0),
    };
  });
}

async function postMediaForm(creds: OAuth1Creds, params: Record<string, string>) {
  const body = new URLSearchParams(params);
  const authHeader = buildOAuth1Header("POST", MEDIA_UPLOAD_ENDPOINT, creds, params);
  await consumeXApiUsage("write");
  const res = await fetch(MEDIA_UPLOAD_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(`X media upload failed: HTTP ${res.status} ${parseXError(data, "media upload failed")}`);
  }
  return data;
}

async function postMediaMultipart(
  creds: OAuth1Creds,
  params: { command: "APPEND"; media_id: string; segment_index: string; media: Buffer },
) {
  const form = new FormData();
  form.append("command", params.command);
  form.append("media_id", params.media_id);
  form.append("segment_index", params.segment_index);
  form.append("media", new Blob([params.media]), "media");

  const authHeader = buildOAuth1Header("POST", MEDIA_UPLOAD_ENDPOINT, creds, {});
  await consumeXApiUsage("write");
  const res = await fetch(MEDIA_UPLOAD_ENDPOINT, {
    method: "POST",
    headers: { Authorization: authHeader },
    body: form,
  });
  if (res.status === 204) return;
  const data = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(`X media append failed: HTTP ${res.status} ${parseXError(data, "media append failed")}`);
  }
}

async function getMediaStatus(creds: OAuth1Creds, mediaId: string) {
  const params = { command: "STATUS", media_id: mediaId };
  const qs = new URLSearchParams(params);
  const authHeader = buildOAuth1Header("GET", MEDIA_UPLOAD_ENDPOINT, creds, params);
  await consumeXApiUsage("write");
  const res = await fetch(`${MEDIA_UPLOAD_ENDPOINT}?${qs.toString()}`, {
    method: "GET",
    headers: { Authorization: authHeader },
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(`X media status failed: HTTP ${res.status} ${parseXError(data, "media status failed")}`);
  }
  return data;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForMediaProcessing(creds: OAuth1Creds, mediaId: string) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < MEDIA_PROCESSING_TIMEOUT_MS) {
    const status = await getMediaStatus(creds, mediaId);
    const info = status.processing_info;
    if (!info || info.state === "succeeded") return;
    if (info.state === "failed") {
      throw new Error(`X media processing failed: ${info.error?.message ?? "unknown error"}`);
    }
    await wait(Math.max(1, Number(info.check_after_secs ?? 5)) * 1000);
  }
  throw new Error("X media processing timeout");
}

export async function uploadMediaOAuth1(
  creds: OAuth1Creds,
  data: Buffer,
  mimeType: string,
): Promise<{ mediaId: string }> {
  if (data.length === 0) {
    throw new Error("X media dosyasi bos olamaz");
  }
  const isImage = SUPPORTED_IMAGE_MIME_TYPES.has(mimeType);
  const isVideo = SUPPORTED_VIDEO_MIME_TYPES.has(mimeType);
  if (!isImage && !isVideo) {
    throw new Error(`X media tipi desteklenmiyor: ${mimeType}`);
  }
  if (isVideo && data.length > 512 * 1024 * 1024) {
    throw new Error("X video boyutu 512MB sinirini asamaz");
  }

  const init = await postMediaForm(creds, {
    command: "INIT",
    total_bytes: String(data.length),
    media_type: mimeType,
    media_category: isVideo ? "tweet_video" : "tweet_image",
  });
  const mediaId = String(init.media_id_string ?? init.media_id ?? "");
  if (!mediaId) {
    throw new Error("X media upload media_id dondurmedi");
  }

  for (let offset = 0, segment = 0; offset < data.length; offset += MEDIA_CHUNK_BYTES, segment += 1) {
    await postMediaMultipart(creds, {
      command: "APPEND",
      media_id: mediaId,
      segment_index: String(segment),
      media: data.subarray(offset, offset + MEDIA_CHUNK_BYTES),
    });
  }

  const finalized = await postMediaForm(creds, { command: "FINALIZE", media_id: mediaId });
  if (finalized.processing_info) {
    await waitForMediaProcessing(creds, mediaId);
  }

  return { mediaId };
}

export async function publishTweetOAuth1(creds: OAuth1Creds, opts: PublishTweetOpts): Promise<XPostResult> {
  validateTweetText(opts.text);
  const body: Record<string, unknown> = { text: opts.text };
  if (opts.mediaIds?.length) {
    body.media = { media_ids: opts.mediaIds };
  }
  if (opts.replyToTweetId) {
    body.reply = { in_reply_to_tweet_id: opts.replyToTweetId };
  }

  const authHeader = buildOAuth1Header("POST", TWEET_ENDPOINT, creds, {});
  await consumeXApiUsage("write");
  const res = await fetch(TWEET_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(`X publish failed: HTTP ${res.status} ${parseXError(data, "X publish failed")}`);
  }
  return { id: String(data?.data?.id ?? "unknown") };
}

export async function publishTextPostOAuth1(creds: OAuth1Creds, text: string): Promise<XPostResult> {
  return publishTweetOAuth1(creds, { text });
}

/**
 * @haldefiyat hesabindaki yayinlanmis bir tweet'i X'ten siler (DELETE /2/tweets/:id).
 * 404 = tweet zaten yok (elle silinmis) → idempotent: { deleted: false } doner, hata atmaz.
 * Not: Thread'lerde yalnizca kok tweet ID'si saklandigi icin sadece kok tweet silinir;
 * cevap (reply) tweet'leri X'te kalir.
 */
export async function deleteTweetOAuth1(
  creds: OAuth1Creds,
  tweetId: string
): Promise<{ deleted: boolean; alreadyGone?: boolean }> {
  const url = `${TWEET_ENDPOINT}/${encodeURIComponent(tweetId)}`;
  const authHeader = buildOAuth1Header("DELETE", url, creds, {});
  await consumeXApiUsage("write");
  const res = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: authHeader },
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) {
    if (res.status === 404) return { deleted: false, alreadyGone: true };
    const err = new Error(`X delete failed: HTTP ${res.status} ${parseXError(data, "X delete failed")}`);
    (err as Error & { httpStatus?: number }).httpStatus = res.status;
    throw err;
  }
  return { deleted: Boolean(data?.data?.deleted) };
}

export async function publishThreadOAuth1(
  creds: OAuth1Creds,
  parts: ThreadPartInput[],
): Promise<{ tweetIds: string[]; failedAtIndex?: number; error?: string }> {
  if (parts.length === 0) {
    throw new Error("X thread en az bir parca icermeli");
  }
  const tweetIds: string[] = [];
  let replyToTweetId: string | undefined;

  for (let index = 0; index < parts.length; index += 1) {
    try {
      const result = await publishTweetOAuth1(creds, {
        text: parts[index]!.text,
        mediaIds: parts[index]!.mediaIds,
        replyToTweetId,
      });
      tweetIds.push(result.id);
      replyToTweetId = result.id;
    } catch (err) {
      return { tweetIds, failedAtIndex: index, error: (err as Error).message };
    }
  }

  return { tweetIds };
}

export async function getTweetMetricsOAuth1(
  creds: OAuth1Creds,
  tweetIds: string[],
): Promise<XTweetMetric[]> {
  const ids = [...new Set(tweetIds.map((id) => id.trim()).filter(Boolean))];
  if (ids.length === 0) return [];

  const params = {
    ids: ids.join(","),
    "tweet.fields": "public_metrics,organic_metrics,non_public_metrics",
  };
  const authHeader = buildOAuth1Header("GET", TWEETS_LOOKUP_ENDPOINT, creds, params);
  const url = new URL(TWEETS_LOOKUP_ENDPOINT);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  await consumeXApiUsage("read");
  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: authHeader },
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(`X metrics failed: HTTP ${res.status} ${parseXError(data, "X metrics failed")}`);
  }

  return (Array.isArray(data.data) ? data.data : []).map((tweet: any) => {
    const publicMetrics = tweet.public_metrics || {};
    const organicMetrics = tweet.organic_metrics || {};
    const nonPublicMetrics = tweet.non_public_metrics || {};
    return {
      tweetId: String(tweet.id),
      likes: Number(publicMetrics.like_count ?? 0),
      comments: Number(publicMetrics.reply_count ?? 0),
      shares: Number(publicMetrics.retweet_count ?? 0) + Number(publicMetrics.quote_count ?? 0),
      impressions: Number(organicMetrics.impression_count ?? nonPublicMetrics.impression_count ?? 0),
      clicks: Number(organicMetrics.url_link_clicks ?? nonPublicMetrics.url_link_clicks ?? 0),
    };
  });
}

export async function getMentionsOAuth1(
  creds: OAuth1Creds,
  userId: string,
  sinceId?: string | null,
): Promise<XMention[]> {
  const trimmedUserId = userId.trim();
  if (!trimmedUserId) {
    throw new Error("X user id zorunlu");
  }

  const endpoint = `${USER_ENDPOINT}/${encodeURIComponent(trimmedUserId)}/mentions`;
  const params: Record<string, string> = {
    max_results: "100",
    "tweet.fields": "author_id,created_at,conversation_id,referenced_tweets,public_metrics",
    expansions: "author_id",
    "user.fields": "username,name",
  };
  if (sinceId?.trim()) params.since_id = sinceId.trim();

  const authHeader = buildOAuth1Header("GET", endpoint, creds, params);
  const url = new URL(endpoint);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  await consumeXApiUsage("read");
  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: authHeader },
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(`X mentions failed: HTTP ${res.status} ${parseXError(data, "X mentions failed")}`);
  }

  const users = parseXUsers(data.includes);

  return (Array.isArray(data.data) ? data.data : []).map((tweet: any) => {
    const authorId = String(tweet.author_id ?? "");
    const author = users.get(authorId);
    const repliedToTweetId =
      Array.isArray(tweet.referenced_tweets)
        ? tweet.referenced_tweets.find((item: any) => item?.type === "replied_to")?.id
        : null;
    const createdAt = parseXDate(tweet.created_at);
    return {
      tweetId: String(tweet.id),
      authorId,
      authorName: author?.name ?? null,
      authorUsername: author?.username ?? null,
      text: String(tweet.text ?? ""),
      createdAt,
      conversationId: typeof tweet.conversation_id === "string" ? tweet.conversation_id : null,
      repliedToTweetId: repliedToTweetId ? String(repliedToTweetId) : null,
      likeCount: Number(tweet.public_metrics?.like_count ?? 0),
    };
  });
}

export async function searchRecentOAuth1(
  creds: OAuth1Creds,
  query: string,
  sinceId?: string | null,
): Promise<XObservedTweet[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) throw new Error("X search query zorunlu");

  const params: Record<string, string> = {
    query: trimmedQuery,
    max_results: "100",
    "tweet.fields": "author_id,created_at,public_metrics",
    expansions: "author_id",
    "user.fields": "username,name",
  };
  if (sinceId?.trim()) params.since_id = sinceId.trim();

  const authHeader = buildOAuth1Header("GET", RECENT_SEARCH_ENDPOINT, creds, params);
  const url = new URL(RECENT_SEARCH_ENDPOINT);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  await consumeXApiUsage("read");
  const res = await fetch(url, { method: "GET", headers: { Authorization: authHeader } });
  const data = await parseJsonResponse(res);
  if (!res.ok) {
    throw new Error(`X search failed: HTTP ${res.status} ${parseXError(data, "X search failed")}`);
  }
  return parseObservedTweets(data);
}

export async function getUserTweetsOAuth1(
  creds: OAuth1Creds,
  userId: string,
  sinceId?: string | null,
  opts: { maxPages?: number } = {},
): Promise<XObservedTweet[]> {
  const trimmedUserId = userId.trim();
  if (!trimmedUserId) throw new Error("X user id zorunlu");

  const endpoint = `${USER_ENDPOINT}/${encodeURIComponent(trimmedUserId)}/tweets`;
  const maxPages = Math.max(1, Math.min(opts.maxPages ?? 1, 2));
  const tweets: XObservedTweet[] = [];
  let paginationToken: string | undefined;

  for (let page = 0; page < maxPages; page += 1) {
    const params: Record<string, string> = {
      max_results: "100",
      "tweet.fields": "author_id,created_at,public_metrics",
      expansions: "author_id",
      "user.fields": "username,name",
    };
    if (sinceId?.trim()) params.since_id = sinceId.trim();
    if (paginationToken) params.pagination_token = paginationToken;

    const authHeader = buildOAuth1Header("GET", endpoint, creds, params);
    const url = new URL(endpoint);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    await consumeXApiUsage("read");
    const res = await fetch(url, { method: "GET", headers: { Authorization: authHeader } });
    const data = await parseJsonResponse(res);
    if (!res.ok) {
      throw new Error(`X user tweets failed: HTTP ${res.status} ${parseXError(data, "X user tweets failed")}`);
    }

    tweets.push(...parseObservedTweets(data));
    paginationToken = typeof data?.meta?.next_token === "string" ? data.meta.next_token : undefined;
    if (!paginationToken) break;
  }

  return tweets;
}

export async function getAccountInfo(bearerToken: string, userId: string) {
  const res = await fetch(`https://api.twitter.com/2/users/${encodeURIComponent(userId)}`, {
    headers: { Authorization: `Bearer ${bearerToken}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data as any)?.detail ?? "X info failed");
  return data;
}

export async function getOAuth2Me(bearerToken: string): Promise<{ id: string; username: string; name?: string }> {
  const res = await fetch("https://api.twitter.com/2/users/me?user.fields=username,name", {
    headers: { Authorization: `Bearer ${bearerToken}` },
  });
  const data = (await res.json()) as {
    data?: { id?: string; username?: string; name?: string };
    detail?: string;
    title?: string;
  };
  if (!res.ok) {
    throw new Error(String(data.detail ?? data.title ?? "X users/me failed"));
  }
  const id = data.data?.id;
  const username = data.data?.username ?? "";
  if (!id) throw new Error("X user id alinamadi");
  return { id, username, name: data.data?.name };
}
