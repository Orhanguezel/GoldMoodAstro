import { createReadStream } from "node:fs";
import { google } from "googleapis";
import { makeOAuthClient } from "./youtube-oauth";

export interface YouTubeAccount {
  tenantKey: string;
  accessToken: string;
  refreshToken: string;
  tokenExpires: Date;
  channelId: string;
}

export interface UploadVideoInput {
  videoFilePath: string;
  title: string;
  description: string;
  tags: string[];
  categoryId: string;
  privacyStatus: "public" | "unlisted" | "private";
  publishAt?: string;
  defaultLanguage?: string;
}

export interface UploadVideoResult {
  videoId: string;
  videoUrl: string;
}

function truncate(value: string, max: number): string {
  return value.length > max ? value.slice(0, max) : value;
}

function normalizeTags(tags: string[]): string[] {
  const output: string[] = [];
  let total = 0;
  for (const tag of tags) {
    const clean = tag.trim().replace(/^#/, "");
    if (!clean) continue;
    const nextTotal = total + clean.length + (output.length > 0 ? 1 : 0);
    if (nextTotal > 500) break;
    output.push(clean);
    total = nextTotal;
  }
  return output;
}

async function authedYouTube(account: YouTubeAccount) {
  const client = await makeOAuthClient(account.tenantKey);
  client.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken,
    expiry_date: account.tokenExpires.getTime(),
  });
  return google.youtube({ version: "v3", auth: client });
}

export async function uploadVideo(
  input: UploadVideoInput,
  account: YouTubeAccount,
): Promise<UploadVideoResult> {
  const youtube = await authedYouTube(account);
  const privacyStatus = input.publishAt ? "private" : input.privacyStatus;
  const res = await youtube.videos.insert({
    part: ["snippet", "status"],
    requestBody: {
      snippet: {
        title: truncate(input.title.trim() || "YouTube Video", 100),
        description: truncate(input.description.trim(), 5000),
        tags: normalizeTags(input.tags),
        categoryId: input.categoryId || "22",
        defaultLanguage: input.defaultLanguage || "tr",
      },
      status: {
        privacyStatus,
        publishAt: input.publishAt,
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      body: createReadStream(input.videoFilePath),
    },
  });

  const videoId = res.data.id;
  if (!videoId) throw new Error("YouTube video ID donmedi");
  return {
    videoId,
    videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
  };
}

export async function uploadThumbnail(
  videoId: string,
  thumbnailFilePath: string,
  account: YouTubeAccount,
): Promise<void> {
  const youtube = await authedYouTube(account);
  await youtube.thumbnails.set({
    videoId,
    media: {
      body: createReadStream(thumbnailFilePath),
    },
  });
}

export async function uploadCaptions(
  videoId: string,
  captionsFilePath: string,
  language: string,
  account: YouTubeAccount,
): Promise<void> {
  const youtube = await authedYouTube(account);
  await youtube.captions.insert({
    part: ["snippet"],
    requestBody: {
      snippet: {
        videoId,
        language,
        name: language.toUpperCase(),
        isDraft: false,
      },
    },
    media: {
      body: createReadStream(captionsFilePath),
    },
  });
}

// ─────────────────────────────────────────────────────────────
// Asagisi FB/IG/X ile ayni cizgiye getirmek icin: silme, icerik
// listesi, detay + yorumlar, yorum cevabi. Donen sekiller bilerek
// facebook.ts/instagram.ts ile AYNI (SocialPlatformPage tek bir
// normalize edilmis sekil bekliyor).
// ─────────────────────────────────────────────────────────────

/** googleapis (Gaxios) hatasindan HTTP durum kodunu cikarir. */
function httpStatusOf(err: unknown): number | undefined {
  const anyErr = err as { code?: unknown; status?: unknown; response?: { status?: unknown } };
  const candidates = [anyErr?.response?.status, anyErr?.status, anyErr?.code];
  for (const value of candidates) {
    const num = typeof value === "string" ? Number(value) : value;
    if (typeof num === "number" && Number.isFinite(num)) return num;
  }
  return undefined;
}

function withHttpStatus(message: string, err: unknown): Error & { httpStatus?: number } {
  const wrapped = new Error(message) as Error & { httpStatus?: number };
  wrapped.httpStatus = httpStatusOf(err);
  return wrapped;
}

/**
 * Videoyu YouTube'dan siler. facebookPostDelete ile ayni sozlesme:
 * zaten yoksa `{ alreadyGone: true }`, aksi halde httpStatus tasiyan hata.
 * (Silme icin kanal sahibi olmak sart — baskasinin videosunda 403 doner.)
 */
export async function deleteVideo(
  videoId: string,
  account: YouTubeAccount,
): Promise<{ alreadyGone?: boolean }> {
  if (!videoId) throw new Error("YouTube video ID gerekli");
  const youtube = await authedYouTube(account);
  try {
    await youtube.videos.delete({ id: videoId });
    return {};
  } catch (err) {
    const status = httpStatusOf(err);
    // 404 = zaten yok. YouTube silinmis/erisilemez videoda 403 videoNotFound da dondurebiliyor.
    const reason = (err as { errors?: Array<{ reason?: string }> })?.errors?.[0]?.reason;
    if (status === 404 || reason === "videoNotFound") return { alreadyGone: true };
    throw withHttpStatus(`YouTube video silinemedi: ${(err as Error).message}`, err);
  }
}

/** Kanalin yukleme (uploads) playlist ID'sini bulur; meta'da varsa onu kullanir. */
async function resolveUploadsPlaylistId(
  account: YouTubeAccount,
  cached?: string | null,
): Promise<string> {
  if (cached && cached.trim()) return cached.trim();
  const youtube = await authedYouTube(account);
  const res = await youtube.channels.list({ part: ["contentDetails"], id: [account.channelId] });
  const playlistId = res.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!playlistId) throw new Error("YouTube uploads playlist bulunamadi");
  return playlistId;
}

/** Kanalin son videolari — facebook.getPagePosts ile ayni sekil. */
export async function getChannelVideos(
  account: YouTubeAccount,
  opts?: { limit?: number; uploadsPlaylistId?: string | null },
) {
  const limit = Math.min(Math.max(opts?.limit ?? 25, 1), 50);
  const youtube = await authedYouTube(account);
  const playlistId = await resolveUploadsPlaylistId(account, opts?.uploadsPlaylistId);

  const playlist = await youtube.playlistItems.list({
    part: ["snippet", "contentDetails"],
    playlistId,
    maxResults: limit,
  });

  const entries = playlist.data.items || [];
  const videoIds = entries
    .map((item) => item.contentDetails?.videoId)
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  // Istatistikler ayri cagri — playlistItems view/like/comment sayisi vermiyor.
  const statsById = new Map<string, { views: number; likes: number; comments: number }>();
  if (videoIds.length) {
    const stats = await youtube.videos.list({ part: ["statistics"], id: videoIds });
    for (const video of stats.data.items || []) {
      if (!video.id) continue;
      statsById.set(video.id, {
        views: Number(video.statistics?.viewCount ?? 0),
        likes: Number(video.statistics?.likeCount ?? 0),
        comments: Number(video.statistics?.commentCount ?? 0),
      });
    }
  }

  const items = entries.map((item) => {
    const videoId = item.contentDetails?.videoId || "";
    const snippet = item.snippet;
    const stat = statsById.get(videoId);
    return {
      externalId: videoId,
      message: snippet?.title || "",
      createdTime: item.contentDetails?.videoPublishedAt || snippet?.publishedAt || null,
      permalink: videoId ? `https://www.youtube.com/watch?v=${videoId}` : null,
      imageUrl:
        snippet?.thumbnails?.high?.url ||
        snippet?.thumbnails?.medium?.url ||
        snippet?.thumbnails?.default?.url ||
        null,
      likes: stat?.likes ?? null,
      comments: stat?.comments ?? null,
      // FB'de "shares" olan alan YouTube'da izlenme — panelde ucuncu metrik olarak gosteriliyor.
      shares: 0,
      views: stat?.views ?? null,
    };
  });

  return { items, engagement: true };
}

/** Video detayi + yorumlar — facebook.getPagePostDetails ile ayni sekil. */
export async function getVideoDetails(videoId: string, account: YouTubeAccount) {
  if (!videoId) throw new Error("YouTube video ID gerekli");
  const youtube = await authedYouTube(account);

  const videoRes = await youtube.videos.list({ part: ["snippet", "statistics"], id: [videoId] });
  const video = videoRes.data.items?.[0];
  if (!video) throw new Error("YouTube video bulunamadi");

  // Yorumlar kapaliysa YouTube 403 (commentsDisabled) doner — detay yine dondurulmeli.
  let commentsReadable = true;
  let commentItems: Array<Record<string, unknown>> = [];
  try {
    const threads = await youtube.commentThreads.list({
      part: ["snippet", "replies"],
      videoId,
      maxResults: 50,
      order: "time",
    });
    commentItems = (threads.data.items || []).map((thread) => {
      const top = thread.snippet?.topLevelComment;
      const s = top?.snippet;
      return {
        id: String(top?.id || thread.id || ""),
        authorName: s?.authorDisplayName ?? null,
        authorId: s?.authorChannelId?.value ?? null,
        message: s?.textDisplay || s?.textOriginal || "",
        likeCount: Number(s?.likeCount ?? 0),
        createdTime: s?.publishedAt || null,
        replies: (thread.replies?.comments || []).map((reply) => ({
          id: String(reply.id || ""),
          authorName: reply.snippet?.authorDisplayName ?? null,
          authorId: reply.snippet?.authorChannelId?.value ?? null,
          message: reply.snippet?.textDisplay || reply.snippet?.textOriginal || "",
          likeCount: Number(reply.snippet?.likeCount ?? 0),
          createdTime: reply.snippet?.publishedAt || null,
        })),
      };
    });
  } catch {
    commentsReadable = false;
  }

  const snippet = video.snippet;
  return {
    externalId: video.id,
    message: snippet?.title || "",
    description: snippet?.description || "",
    createdTime: snippet?.publishedAt || null,
    permalink: `https://www.youtube.com/watch?v=${video.id}`,
    imageUrl:
      snippet?.thumbnails?.high?.url ||
      snippet?.thumbnails?.medium?.url ||
      snippet?.thumbnails?.default?.url ||
      null,
    likes: Number(video.statistics?.likeCount ?? 0),
    comments: Number(video.statistics?.commentCount ?? 0),
    shares: 0,
    views: Number(video.statistics?.viewCount ?? 0),
    commentsReadable,
    commentItems,
  };
}

/** Bir yoruma cevap yazar — facebook.replyToComment ile ayni sozlesme. */
export async function replyToComment(
  commentId: string,
  message: string,
  account: YouTubeAccount,
) {
  const text = message.trim();
  if (!commentId) throw new Error("YouTube yorum ID gerekli");
  if (!text) throw new Error("Cevap metni gerekli");

  const youtube = await authedYouTube(account);
  try {
    const res = await youtube.comments.insert({
      part: ["snippet"],
      requestBody: { snippet: { parentId: commentId, textOriginal: text } },
    });
    return { id: res.data.id || "" };
  } catch (err) {
    throw withHttpStatus(`YouTube yorum cevap hatasi: ${(err as Error).message}`, err);
  }
}

/**
 * Baglanti dogrulamasi. DIKKAT: FB/IG/X'te `/test` gercek bir test gonderisi
 * yayinlar; YouTube'da bunun karsiligi kanala GERCEK bir video yuklemek olurdu.
 * Bu yuzden burada yayin yapilmaz — token yenilenir ve kanal bilgisi okunur.
 */
export async function getChannelInfo(account: YouTubeAccount) {
  const youtube = await authedYouTube(account);
  const res = await youtube.channels.list({
    part: ["snippet", "statistics", "contentDetails"],
    id: [account.channelId],
  });
  const channel = res.data.items?.[0];
  if (!channel) throw new Error("YouTube kanali bulunamadi");
  return {
    channelId: channel.id,
    title: channel.snippet?.title || "",
    customUrl: channel.snippet?.customUrl || null,
    thumbnail: channel.snippet?.thumbnails?.default?.url || null,
    subscribers: Number(channel.statistics?.subscriberCount ?? 0),
    videoCount: Number(channel.statistics?.videoCount ?? 0),
    viewCount: Number(channel.statistics?.viewCount ?? 0),
    uploadsPlaylistId: channel.contentDetails?.relatedPlaylists?.uploads || null,
  };
}
