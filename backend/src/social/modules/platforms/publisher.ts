import * as facebook from "./facebook";
import * as instagram from "./instagram";
import * as linkedin from "./linkedin";
import * as xPlatform from "./x";
import * as youtube from "./youtube";
import * as ytOauth from "./youtube-oauth";
import * as telegram from "./telegram";
import * as postproxy from "./postproxy";
import * as postRepo from "../posts/repository";
import { db } from "../../db/client";
import { platformAccounts, socialPosts } from "../../db/schema";
import { and, eq } from "drizzle-orm";
import { emitPublishEvent } from "../../core/events";
import { getLinkedInPublishMode, getPublishProvider, getTenantValue } from "../../core/tenant-settings";
import { type OAuth1Creds } from "./x-oauth1";
import { validatePublishContent } from "./content-guard";
import { createWriteStream } from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

export interface PublishResult {
  success: boolean;
  fbPostId?: string;
  igMediaId?: string;
  xTweetId?: string;
  youtubeVideoId?: string;
  linkedinPostId?: string;
  manualPending?: boolean;
  notes?: string[];
  errors: string[];
}

/**
 * Bir post IG Story mu? Sema degisikligi olmadan kanonik isaret:
 * title "[STORY]" icerir VEYA sourceRef "story" gecer (orn. weekly-story:..., story:manual:...).
 */
export function isStoryPost(post: { title?: string | null; sourceRef?: string | null }): boolean {
  const title = (post.title || "").toUpperCase();
  const ref = (post.sourceRef || "").toLowerCase();
  return title.includes("[STORY]") || /(^|[-:_])story/.test(ref);
}

/**
 * Reel isareti: title "[REEL]" veya sourceRef "reel" geciyorsa video/reel yayini denenir.
 */
export function isReelPost(post: { title?: string | null; sourceRef?: string | null }): boolean {
  const title = (post.title || "").toUpperCase();
  const ref = (post.sourceRef || "").toLowerCase();
  return title.includes("[REEL]") || /(^|[-:_])reel/.test(ref);
}

// Platform gruplari: hangi platform degerinde hangi kanallar yayinlanir
function resolvePlatforms(platform: string) {
  return {
    facebook: ["facebook", "both", "all"].includes(platform),
    instagram: ["instagram", "both", "all"].includes(platform),
    linkedin: ["linkedin", "all"].includes(platform),
    x: ["x", "all"].includes(platform),
    telegram: ["telegram", "all"].includes(platform),
    youtube: ["youtube", "all"].includes(platform),
  };
}

export function isCompleteOauth1(meta: unknown): meta is { oauth1: OAuth1Creds } {
  const oauth1 = (meta as { oauth1?: Partial<OAuth1Creds> } | null | undefined)?.oauth1;
  return !!(
    oauth1?.apiKey &&
    oauth1.apiSecret &&
    oauth1.accessToken &&
    oauth1.accessTokenSecret
  );
}

function canUseXEnvFallback(tenantKey: string): boolean {
  return tenantKey === "haldefiyat" && xPlatform.hasOAuth1Credentials();
}

type PublishTargets = ReturnType<typeof resolvePlatforms>;
type PostproxyPlatform = "facebook" | "instagram" | "twitter" | "linkedin";
const PUBLIC_BASE = (process.env.SOCIAL_PUBLIC_BASE || process.env.PUBLIC_URL || "https://goldmoodastro.com").replace(/\/$/, "");

const POSTPROXY_PLATFORM_MAP: Partial<Record<keyof PublishTargets, PostproxyPlatform>> = {
  facebook: "facebook",
  instagram: "instagram",
  linkedin: "linkedin",
  x: "twitter",
};

function accountMeta(account: typeof platformAccounts.$inferSelect): Record<string, unknown> {
  return account.meta && typeof account.meta === "object" && !Array.isArray(account.meta)
    ? account.meta as Record<string, unknown>
    : {};
}

function collectPostproxyMedia(post: typeof socialPosts.$inferSelect): string[] {
  const urls = new Set<string>();
  if (post.imageUrl?.trim()) urls.add(post.imageUrl.trim());
  for (const url of post.mediaUrls ?? []) {
    if (typeof url === "string" && url.trim()) urls.add(url.trim());
  }
  return [...urls];
}

function shouldUseNativeForSpecialPost(post: typeof socialPosts.$inferSelect, targets: PublishTargets): boolean {
  return Boolean(
      targets.telegram ||
      targets.youtube ||
      (targets.instagram && isStoryPost(post)) ||
      ((targets.instagram || targets.facebook) && isReelPost(post)) ||
      (targets.facebook && isStoryPost(post)) ||
      (targets.x && post.xThreadGroup),
  );
}

function postproxyBodyPlatform(targets: PublishTargets): "facebook" | "instagram" | "x" | "linkedin" {
  if (targets.x && !targets.facebook && !targets.instagram && !targets.linkedin) return "x";
  if (targets.instagram && !targets.facebook && !targets.linkedin && !targets.x) return "instagram";
  if (targets.linkedin && !targets.facebook && !targets.instagram && !targets.x) return "linkedin";
  return "facebook";
}

function collectPostproxyProfiles(
  accounts: Array<typeof platformAccounts.$inferSelect>,
  targets: PublishTargets,
): postproxy.PostproxyProfileTarget[] {
  const profiles: postproxy.PostproxyProfileTarget[] = [];

  for (const [platform, postproxyPlatform] of Object.entries(POSTPROXY_PLATFORM_MAP) as Array<
    [keyof typeof POSTPROXY_PLATFORM_MAP, PostproxyPlatform]
  >) {
    if (!targets[platform]) continue;
    const account = accounts.find((item) => item.platform === platform);
    if (!account) continue;
    const profileId = accountMeta(account).postproxyProfileId;
    profiles.push({
      profile: typeof profileId === "string" && profileId.trim() ? profileId.trim() : postproxyPlatform,
      platform: postproxyPlatform,
    });
  }

  if (profiles.length > 0) return profiles;

  return (Object.entries(POSTPROXY_PLATFORM_MAP) as Array<[keyof typeof POSTPROXY_PLATFORM_MAP, PostproxyPlatform]>)
    .filter(([platform]) => targets[platform])
    .map(([, platform]) => ({ profile: platform, platform }));
}

function resolveXOAuth1Credentials(
  tenantKey: string,
  account?: typeof platformAccounts.$inferSelect
): OAuth1Creds {
  if (isCompleteOauth1(account?.meta)) {
    return account.meta.oauth1;
  }
  if (canUseXEnvFallback(tenantKey)) {
    return xPlatform.getOAuth1Creds();
  }
  throw new Error(`Tenant (${tenantKey}) icin X hesabi bagli degil`);
}

/**
 * Bir tenant'in aktif X hesabi icin OAuth1 credential'larini cozer:
 * once platform_accounts.meta.oauth1 (tenant'a ozel), yoksa haldefiyat icin env fallback.
 * Hicbiri yoksa null doner (X hesabi bagli degil). Publisher ile ayni kaynagi kullanir.
 */
export async function getXCredsForTenant(tenantKey: string): Promise<OAuth1Creds | null> {
  const rows = await db
    .select()
    .from(platformAccounts)
    .where(
      and(
        eq(platformAccounts.tenantKey, tenantKey),
        eq(platformAccounts.platform, "x"),
        eq(platformAccounts.isActive, 1)
      )
    );
  try {
    return resolveXOAuth1Credentials(tenantKey, rows[0]);
  } catch {
    return null;
  }
}

/** Tenant'in aktif Facebook page hesabi (pageId + token). Panel silmesi FB'den de silsin diye. */
export async function getFbCredsForTenant(
  tenantKey: string
): Promise<{ pageId: string; token: string } | null> {
  const rows = await db
    .select()
    .from(platformAccounts)
    .where(
      and(
        eq(platformAccounts.tenantKey, tenantKey),
        eq(platformAccounts.platform, "facebook"),
        eq(platformAccounts.isActive, 1)
      )
    );
  const acc = rows[0];
  const token = acc?.pageToken || acc?.accessToken;
  if (!acc?.pageId || !token) return null;
  return { pageId: acc.pageId, token };
}

function inferMimeTypeFromUrl(url: string): string | null {
  const pathname = new URL(url).pathname.toLowerCase();
  if (pathname.endsWith(".jpg") || pathname.endsWith(".jpeg")) return "image/jpeg";
  if (pathname.endsWith(".png")) return "image/png";
  if (pathname.endsWith(".webp")) return "image/webp";
  if (pathname.endsWith(".gif")) return "image/gif";
  if (pathname.endsWith(".mp4")) return "video/mp4";
  return null;
}

function collectXMediaUrls(post: typeof socialPosts.$inferSelect): string[] {
  const urls = new Set<string>();
  if (post.imageUrl) urls.add(post.imageUrl);
  for (const url of post.mediaUrls ?? []) {
    if (typeof url === "string" && url.trim()) urls.add(url.trim());
  }
  return [...urls];
}

function collectMediaUrls(post: typeof socialPosts.$inferSelect): string[] {
  const urls = new Set<string>();
  if (post.imageUrl?.trim()) urls.add(toPublicUrl(post.imageUrl.trim()));
  for (const url of post.mediaUrls ?? []) {
    if (typeof url === "string" && url.trim()) urls.add(toPublicUrl(url.trim()));
  }
  return [...urls];
}

function toPublicUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${PUBLIC_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
}

function pickVideoUrl(post: typeof socialPosts.$inferSelect): string | null {
  return collectMediaUrls(post).find(isProbablyVideoUrl) ?? null;
}

function pickImageUrl(post: typeof socialPosts.$inferSelect): string | null {
  return collectMediaUrls(post).find((url) => !isProbablyVideoUrl(url)) ?? null;
}

async function uploadXMediaUrl(creds: OAuth1Creds, url: string): Promise<{ mediaId: string; mimeType: string }> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`X media indirilemedi: HTTP ${res.status}`);
  }
  const mimeType = (res.headers.get("content-type")?.split(";")[0]?.trim() || inferMimeTypeFromUrl(url) || "").toLowerCase();
  if (!mimeType) {
    throw new Error("X media tipi belirlenemedi");
  }
  const data = Buffer.from(await res.arrayBuffer());
  const uploaded = await xPlatform.uploadMediaOAuth1(creds, data, mimeType);
  return { mediaId: uploaded.mediaId, mimeType };
}

async function uploadAllXMedia(creds: OAuth1Creds, post: typeof socialPosts.$inferSelect): Promise<string[]> {
  const urls = collectXMediaUrls(post);
  if (urls.length === 0) return [];
  if (urls.length > 4) {
    throw new Error("X en fazla 4 gorsel veya 1 video destekler");
  }

  const uploaded: Array<{ mediaId: string; mimeType: string }> = [];
  for (const url of urls) {
    uploaded.push(await uploadXMediaUrl(creds, url));
  }

  const videoCount = uploaded.filter((item) => item.mimeType.startsWith("video/")).length;
  if (videoCount > 0 && uploaded.length > 1) {
    throw new Error("X video ile baska medya birlikte paylasilamaz");
  }

  return uploaded.map((item) => item.mediaId);
}

async function toXThreadPartInput(creds: OAuth1Creds, post: typeof socialPosts.$inferSelect) {
  return {
    text: buildCaption(post.caption, post.hashtags),
    mediaIds: await uploadAllXMedia(creds, post),
  };
}

function isProbablyVideoUrl(url: string): boolean {
  const pathname = (() => {
    try {
      return new URL(url).pathname.toLowerCase();
    } catch {
      return url.toLowerCase();
    }
  })();
  return [".mp4", ".mov", ".m4v", ".webm"].some((ext) => pathname.endsWith(ext));
}

function localUploadPath(value: string): string {
  if (path.isAbsolute(value)) return value;
  if (value.startsWith("/uploads/")) return path.join(process.cwd(), value.slice(1));
  return path.resolve(process.cwd(), value);
}

async function downloadToTmp(url: string, postUuid: string): Promise<string> {
  const ext = path.extname(new URL(url).pathname) || ".mp4";
  const target = path.join(os.tmpdir(), `yt-upload-${postUuid}${ext}`);
  const res = await fetch(url);
  if (!res.ok || !res.body) {
    throw new Error(`YouTube video indirilemedi: HTTP ${res.status}`);
  }
  await pipeline(Readable.fromWeb(res.body as any), createWriteStream(target));
  return target;
}

async function resolveVideoPath(post: typeof socialPosts.$inferSelect): Promise<{ path: string; cleanup: boolean }> {
  const candidates = [
    ...(post.mediaUrls ?? []),
    post.imageUrl,
    post.imageLocal,
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0);

  const videoSource = candidates.find((candidate) => isProbablyVideoUrl(candidate)) ?? candidates[0];
  if (!videoSource) {
    throw new Error("YouTube icin video dosyasi bulunamadi");
  }

  if (/^https?:\/\//i.test(videoSource)) {
    return { path: await downloadToTmp(videoSource, post.uuid), cleanup: true };
  }

  return { path: localUploadPath(videoSource), cleanup: false };
}

function buildYouTubeDescription(post: typeof socialPosts.$inferSelect): string {
  const parts = [post.caption?.trim(), post.hashtags?.trim(), post.linkUrl?.trim()].filter(Boolean);
  return parts.join("\n\n").slice(0, 5000);
}

function parseHashtags(hashtagsField?: string | null): string[] {
  return (hashtagsField || "")
    .split(/[\s,]+/)
    .map((item) => item.trim().replace(/^#/, ""))
    .filter(Boolean)
    .slice(0, 15);
}

function youtubeMeta(account: typeof platformAccounts.$inferSelect): Record<string, any> {
  return account.meta && typeof account.meta === "object" && !Array.isArray(account.meta)
    ? account.meta as Record<string, any>
    : {};
}

function youtubePostMeta(post: typeof socialPosts.$inferSelect): Record<string, any> {
  if (!post.notes) return {};
  try {
    const parsed = JSON.parse(post.notes);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) && (parsed as any).youtube
      ? (parsed as any).youtube
      : {};
  } catch {
    return {};
  }
}

function makeYouTubeAccountFromDb(
  account: typeof platformAccounts.$inferSelect,
  accessToken: string,
): youtube.YouTubeAccount {
  if (!account.tenantKey || !account.accountId || !account.refreshToken || !account.tokenExpires) {
    throw new Error("YouTube hesap bilgisi eksik");
  }
  return {
    tenantKey: account.tenantKey,
    accessToken,
    refreshToken: account.refreshToken,
    tokenExpires: new Date(account.tokenExpires),
    channelId: account.accountId,
  };
}

async function ensureFreshYouTubeToken(account: typeof platformAccounts.$inferSelect): Promise<string> {
  if (!account.accessToken || !account.refreshToken) {
    throw new Error("YouTube token bilgisi eksik");
  }

  const expiresAt = account.tokenExpires ? new Date(account.tokenExpires).getTime() : 0;
  const refreshAt = Date.now() + 10 * 60 * 1000;
  if (expiresAt > refreshAt) return account.accessToken;

  const refreshed = await ytOauth.refreshAccessToken(account.tenantKey, account.refreshToken);
  await db
    .update(platformAccounts)
    .set({
      accessToken: refreshed.accessToken,
      tokenExpires: refreshed.tokenExpires,
      lastError: null,
    })
    .where(eq(platformAccounts.id, account.id));
  return refreshed.accessToken;
}

async function publishViaPostproxy(
  post: typeof socialPosts.$inferSelect,
  tenantKey: string,
  accounts: Array<typeof platformAccounts.$inferSelect>,
  targets: PublishTargets,
  notifyPublish: (platform: string, status: "success" | "failed", error?: string) => Promise<boolean>,
): Promise<PublishResult> {
  await postRepo.markPostAsPublishing(post.id);

  const profileGroupId = await getTenantValue<string>(tenantKey, "postproxy", "profile_group_id");
  if (!profileGroupId) {
    const message = `Tenant (${tenantKey}) icin Postproxy profile_group_id tanimli degil`;
    await postRepo.markPostAsFailed(post.id, message);
    await notifyPublish("postproxy", "failed", message);
    await emitPublishEvent({ tenantKey, postId: post.id, status: "failed", errors: [message] });
    return { success: false, errors: [message] };
  }

  const profiles = collectPostproxyProfiles(accounts, targets);
  if (profiles.length === 0) {
    const message = `Tenant (${tenantKey}) icin Postproxy hedef profili bulunamadi`;
    await postRepo.markPostAsFailed(post.id, message);
    await notifyPublish("postproxy", "failed", message);
    await emitPublishEvent({ tenantKey, postId: post.id, status: "failed", errors: [message] });
    return { success: false, errors: [message] };
  }

  try {
    const result = await postproxy.publishToPostproxy({
      tenantKey,
      body: adaptForPlatform(postproxyBodyPlatform(targets), {
        caption: post.caption,
        hashtags: post.hashtags,
        linkUrl: post.linkUrl,
      }),
      profiles,
      media: collectPostproxyMedia(post),
      scheduledAt: post.scheduledAt && post.scheduledAt > new Date() ? post.scheduledAt.toISOString() : undefined,
    });

    const requestedPlatforms = [...new Set(profiles.map((profile) => profile.platform || profile.profile))];
    if (result.success) {
      await Promise.all(requestedPlatforms.map((platform) => notifyPublish(platform, "success")));
    } else {
      await notifyPublish("postproxy", "failed", result.errors.join("; "));
    }

    if (result.success || result.fbPostId || result.igMediaId || result.xTweetId || result.youtubeVideoId || result.linkedinPostId || result.postproxyPostId) {
      await postRepo.markPostAsPublished(
        post.id,
        result.fbPostId,
        result.igMediaId,
        result.xTweetId,
        result.youtubeVideoId,
        result.postproxyPostId,
      );
      if (result.linkedinPostId) await postRepo.saveLinkedInPostId(post.id, result.linkedinPostId);
      await emitPublishEvent({ tenantKey, postId: post.id, status: "success", errors: result.errors });
    } else {
      await postRepo.markPostAsFailed(post.id, result.errors.join("; ") || "Postproxy publish failed");
      await emitPublishEvent({ tenantKey, postId: post.id, status: "failed", errors: result.errors });
    }

    return result;
  } catch (err) {
    const message = (err as Error).message;
    await postRepo.markPostAsFailed(post.id, message);
    await notifyPublish("postproxy", "failed", message);
    await emitPublishEvent({ tenantKey, postId: post.id, status: "failed", errors: [message] });
    return { success: false, errors: [message] };
  }
}

// ─── Post Yayinla (Birlesik) ────────────────────────────────
export async function publishPost(postId: number): Promise<PublishResult> {
  const post = await postRepo.getPostById(postId);
  if (!post) throw new Error("Post bulunamadi");

  const result: PublishResult = { success: true, errors: [] };
  const tenantKey = (post.subType || "").trim();
  if (!tenantKey) {
    throw new Error("Post tenant bilgisi eksik (sub_type/tenantKey)");
  }
  const notificationTitle = () => post.title || post.caption.substring(0, 50);
  const notifyPublish = (
    platform: string,
    status: "success" | "failed",
    error?: string,
  ) => telegram.notifyPostPublished(platform, notificationTitle(), status, error, { tenantKey });

  // Yayin-oncesi icerik dogrulama — placeholder URL / yabanci dil bloklanir.
  // AI uretimi bozuk icerik (ornek: "nossa ... example.com") canliya cikamaz.
  //
  // Hashtag limiti PLATFORMA GORE: bu guard orijinal olarak haldefiyat X otomasyonu icin
  // yazildi (X'te 1-2, max ~4 hashtag iyi pratiktir). Ama Instagram'da 10-30 hashtag normaldir
  // (cebelstore haftalik stratejisi 12 kullanir). Tum platformlara max 4 uygulamak IG/FB
  // postlarini yanlislikla blokluyordu (cebelstore'da 8 post "hashtag limiti asildi" ile dustu).
  // X icin 4 korunur; IG/FB/cok-platformlu icin IG'nin gercek ust limiti (30) kullanilir.
  const HASHTAG_LIMIT: Record<string, number> = {
    x: 4,
    linkedin: 10,
    facebook: 30,
    instagram: 30,
    both: 30,
    all: 30,
    telegram: 30,
    youtube: 30,
  };
  const guard = validatePublishContent({
    caption: post.caption,
    hashtags: post.hashtags,
    linkUrl: post.linkUrl,
    maxHashtags: HASHTAG_LIMIT[post.platform] ?? 30,
  });
  if (!guard.ok) {
    await postRepo.markPostAsFailed(postId, `İçerik kontrolü: ${guard.reason}`);
    await notifyPublish(post.platform, "failed", guard.reason);
    await emitPublishEvent({ tenantKey, postId, status: "failed", errors: [guard.reason!] });
    return { success: false, errors: [guard.reason!] };
  }

  const accounts = await db
    .select()
    .from(platformAccounts)
    .where(and(eq(platformAccounts.tenantKey, tenantKey), eq(platformAccounts.isActive, 1)));

  const byPlatform = new Map(accounts.map((a) => [a.platform, a] as const));
  const targets = resolvePlatforms(post.platform);
  // GoldMoodAstro'nun ana FB+IG gönderilerini public Telegram akışına da taşı.
  // Story içerikleri geçmiş/kalıcı grup akışını gereksiz doldurmasın.
  if (tenantKey === "goldmoodastro" && post.platform === "both" && !isStoryPost(post)) {
    targets.telegram = true;
  }
  const linkedInPublishMode = targets.linkedin ? await getLinkedInPublishMode(tenantKey) : "api";

  if ((await getPublishProvider(tenantKey)) === "postproxy" && linkedInPublishMode !== "manual" && !shouldUseNativeForSpecialPost(post, targets)) {
    return publishViaPostproxy(post, tenantKey, accounts, targets, notifyPublish);
  }

  if (targets.x && post.xThreadGroup && post.xThreadOrder !== 0) {
    return result;
  }

  // Status'u publishing'e cevir
  await postRepo.markPostAsPublishing(postId);

  // ─── Facebook ───────────────────────────────────────────
  if (targets.facebook) {
    try {
      const caption = adaptForPlatform("facebook", { caption: post.caption, hashtags: post.hashtags });
      const fbAccount = byPlatform.get("facebook");
      const fbAccessToken = fbAccount?.pageToken || fbAccount?.accessToken;
      if (!fbAccessToken || !fbAccount?.pageId) {
        throw new Error(`Tenant (${tenantKey}) icin Facebook hesabi bagli degil`);
      }
      let fbResult;
      if (isReelPost(post)) {
        const videoUrl = pickVideoUrl(post);
        if (!videoUrl) throw new Error("Reel icin public video URL gerekli (.mp4/.mov/.m4v/.webm)");
        fbResult = await facebook.publishReel(videoUrl, caption, {
          pageId: fbAccount.pageId,
          pageAccessToken: fbAccessToken,
        });
      } else if (isStoryPost(post)) {
        const imageUrl = pickImageUrl(post);
        if (!imageUrl) throw new Error("Facebook Story icin gorsel URL gerekli");
        fbResult = await facebook.publishPhotoStory(imageUrl, {
          pageId: fbAccount.pageId,
          pageAccessToken: fbAccessToken,
        });
      } else if (post.imageUrl) {
        // 2+ gorsel varsa FB'de de carousel (albüm) — IG ile ayni format.
        const fbCarouselUrls = collectMediaUrls(post).filter((u) => !isProbablyVideoUrl(u));
        if (fbCarouselUrls.length >= 2) {
          fbResult = await facebook.publishCarouselPost(fbCarouselUrls.slice(0, 10), caption, {
            pageId: fbAccount.pageId,
            pageAccessToken: fbAccessToken,
          });
        } else {
          const imageUrl = pickImageUrl(post);
          if (!imageUrl) throw new Error("Facebook foto post icin gorsel URL gerekli");
          fbResult = await facebook.publishPhotoPost(imageUrl, caption, {
            pageId: fbAccount.pageId,
            pageAccessToken: fbAccessToken,
          });
        }
      } else {
        fbResult = await facebook.publishTextPost(caption, post.linkUrl ?? undefined, {
          pageId: fbAccount.pageId,
          pageAccessToken: fbAccessToken,
        });
      }
      result.fbPostId = fbResult.id;
      await notifyPublish("facebook", "success");
    } catch (err) {
      result.errors.push(`Facebook: ${(err as Error).message}`);
      result.success = false;
      await notifyPublish("facebook", "failed", (err as Error).message);
    }
  }

  // ─── Instagram ──────────────────────────────────────────
  if (targets.instagram) {
    try {
      if (!post.imageUrl && !pickVideoUrl(post)) {
        result.errors.push("Instagram: Gorsel olmadan post paylasilamaz");
        if (!targets.facebook) result.success = false;
      } else {
        const caption = adaptForPlatform("instagram", { caption: post.caption, hashtags: post.hashtags, linkUrl: post.linkUrl });
        const igAccount = byPlatform.get("instagram");
        const igAccessToken = igAccount?.accessToken || igAccount?.pageToken;
        if (!igAccessToken || !igAccount?.accountId) {
          throw new Error(`Tenant (${tenantKey}) icin Instagram hesabi bagli degil`);
        }
        // Story mu, feed postu mu? (sema degisikligi yok — title "[STORY]" veya sourceRef "story" isareti)
        const isStory = isStoryPost(post);
        const isReel = isReelPost(post);
        // 2+ gorsel varsa CAROUSEL — kaydetme orani en yuksek format. Story haric.
        const carouselUrls = collectMediaUrls(post).filter((u) => !isProbablyVideoUrl(u));
        const useCarousel = !isStory && !isReel && carouselUrls.length >= 2;
        const igResult = isReel
          ? await instagram.publishReel((() => {
              const videoUrl = pickVideoUrl(post);
              if (!videoUrl) throw new Error("Reel icin public video URL gerekli (.mp4/.mov/.m4v/.webm)");
              return videoUrl;
            })(), caption, {
              accountId: igAccount.accountId,
              accessToken: igAccessToken,
              coverUrl: pickImageUrl(post) ?? undefined,
            })
          : isStory
          ? await instagram.publishStory((() => {
              const imageUrl = pickImageUrl(post);
              if (!imageUrl) throw new Error("Instagram Story icin gorsel URL gerekli");
              return imageUrl;
            })(), {
              accountId: igAccount.accountId,
              accessToken: igAccessToken,
            })
          : useCarousel
            ? await instagram.publishCarouselPost(carouselUrls.slice(0, 10), caption, {
                accountId: igAccount.accountId,
                accessToken: igAccessToken,
              })
            : await instagram.publishPhotoPost((() => {
                const imageUrl = pickImageUrl(post);
                if (!imageUrl) throw new Error("Instagram foto post icin gorsel URL gerekli");
                return imageUrl;
              })(), caption, {
                accountId: igAccount.accountId,
                accessToken: igAccessToken,
              });
        result.igMediaId = igResult.id;
        await notifyPublish("instagram", "success");
      }
    } catch (err) {
      result.errors.push(`Instagram: ${(err as Error).message}`);
      result.success = false;
      await notifyPublish("instagram", "failed", (err as Error).message);
    }
  }

  // ─── LinkedIn ───────────────────────────────────────────
  if (targets.linkedin) {
    try {
      if (linkedInPublishMode === "manual") {
        await postRepo.markLinkedInManualPending(postId);
        result.manualPending = true;
        result.notes = [...(result.notes ?? []), "LinkedIn — elle paylasilacak kuyruğuna eklendi"];
      } else {
      const acc = byPlatform.get("linkedin");
      if (!acc?.accessToken || !acc.accountId) {
        throw new Error(`Tenant (${tenantKey}) icin LinkedIn hesabi bagli degil`);
      }
      const text = adaptForPlatform("linkedin", { caption: post.caption, hashtags: post.hashtags, linkUrl: post.linkUrl });
      const linkedInResult = post.imageUrl
        ? await linkedin.publishImagePost(acc.accessToken, acc.accountId, text, [post.imageUrl])
        : await linkedin.publishTextPost(acc.accessToken, acc.accountId, text);
      result.linkedinPostId = linkedInResult.id;
      await notifyPublish("linkedin", "success");
      }
    } catch (err) {
      result.errors.push(`LinkedIn: ${(err as Error).message}`);
      result.success = false;
      await notifyPublish("linkedin", "failed", (err as Error).message);
    }
  }

  // ─── YouTube ────────────────────────────────────────────
  if (targets.youtube) {
    let videoPath: string | null = null;
    let cleanupVideo = false;
    try {
      const acc = byPlatform.get("youtube");
      if (!acc) throw new Error(`Tenant (${tenantKey}) icin YouTube hesabi bagli degil`);
      const accessToken = await ensureFreshYouTubeToken(acc);
      const resolved = await resolveVideoPath(post);
      videoPath = resolved.path;
      cleanupVideo = resolved.cleanup;
      const ytAccount = makeYouTubeAccountFromDb(acc, accessToken);
      const meta = youtubeMeta(acc);
      const postMeta = youtubePostMeta(post);
      const publishAt = post.scheduledAt && post.scheduledAt > new Date()
        ? post.scheduledAt.toISOString()
        : undefined;
      const rawPrivacy = typeof postMeta.privacyStatus === "string"
        ? postMeta.privacyStatus
        : typeof meta.privacyStatus === "string"
          ? meta.privacyStatus
          : "";
      const privacyStatus: "public" | "unlisted" | "private" =
        rawPrivacy === "unlisted" || rawPrivacy === "private" || rawPrivacy === "public"
          ? rawPrivacy
          : "public";
      const ytResult = await youtube.uploadVideo({
        videoFilePath: videoPath,
        title: (post.title || post.caption || "YouTube Video").slice(0, 100),
        description: buildYouTubeDescription(post),
        tags: parseHashtags(post.hashtags),
        categoryId: typeof postMeta.categoryId === "string"
          ? postMeta.categoryId
          : typeof meta.defaultCategoryId === "string"
            ? meta.defaultCategoryId
            : "22",
        privacyStatus,
        publishAt,
        defaultLanguage: typeof meta.defaultLanguage === "string" ? meta.defaultLanguage : "tr",
      }, ytAccount);

      if (post.imageLocal) {
        await youtube.uploadThumbnail(ytResult.videoId, localUploadPath(post.imageLocal), ytAccount);
      }

      result.youtubeVideoId = ytResult.videoId;
      await notifyPublish("youtube", "success");
    } catch (err) {
      result.errors.push(`YouTube: ${(err as Error).message}`);
      result.success = false;
      await notifyPublish("youtube", "failed", (err as Error).message);
    } finally {
      if (videoPath && cleanupVideo) {
        await fs.unlink(videoPath).catch(() => {});
      }
    }
  }

  // ─── X (Twitter) ────────────────────────────────────────
  if (targets.x) {
    try {
      const text = adaptForPlatform("x", { caption: post.caption, hashtags: post.hashtags });
      const acc = byPlatform.get("x");
      const creds = resolveXOAuth1Credentials(tenantKey, acc);
      if (post.xThreadGroup) {
        const groupPosts = await postRepo.getThreadGroup(post.xThreadGroup);
        const parts = await Promise.all(groupPosts.map((groupPost) => toXThreadPartInput(creds, groupPost)));
        const threadResult = await xPlatform.publishThreadOAuth1(creds, parts);
        await postRepo.applyThreadResult(post.xThreadGroup, groupPosts, threadResult);
        if (threadResult.failedAtIndex != null) {
          result.errors.push(`X thread part ${threadResult.failedAtIndex}: ${threadResult.error}`);
          result.success = false;
          await notifyPublish("x", "failed", threadResult.error);
          await emitPublishEvent({ tenantKey, postId, status: "failed", errors: result.errors });
        } else {
          result.xTweetId = threadResult.tweetIds[0];
          await notifyPublish("x", "success");
          await emitPublishEvent({ tenantKey, postId, status: "success", errors: result.errors });
        }
        return result;
      }
      const mediaIds = await uploadAllXMedia(creds, post);
      const xResult = await xPlatform.publishTweetOAuth1(creds, {
        text,
        mediaIds,
        replyToTweetId: post.xReplyToTweetId ?? undefined,
      });
      result.xTweetId = xResult.id;
      await notifyPublish("x", "success");
    } catch (err) {
      result.errors.push(`X: ${(err as Error).message}`);
      result.success = false;
      await notifyPublish("x", "failed", (err as Error).message);
    }
  }

  // ─── Telegram ───────────────────────────────────────────
  if (targets.telegram) {
    try {
      const acc = byPlatform.get("telegram");
      const text = adaptForPlatform("telegram", { caption: post.caption, hashtags: post.hashtags, linkUrl: post.linkUrl });
      const mediaUrls = [post.imageUrl, ...(post.mediaUrls ?? [])]
        .filter((url): url is string => typeof url === "string" && url.trim().length > 0)
        .filter((url, index, all) => all.indexOf(url) === index);
      const ok = await telegram.sendPost(text, mediaUrls, acc?.accountId ?? undefined, { tenantKey });
      if (!ok) {
        throw new Error(`Tenant (${tenantKey}) icin Telegram bot token/chat ayari eksik veya gecersiz`);
      }
      await notifyPublish("telegram", "success");
    } catch (err) {
      result.errors.push(`Telegram: ${(err as Error).message}`);
      result.success = false;
    }
  }

  // Sonucu DB'ye kaydet
  if (result.manualPending && !result.fbPostId && !result.igMediaId && !result.xTweetId && !result.youtubeVideoId && !result.linkedinPostId) {
    await emitPublishEvent({ tenantKey, postId, status: "success", errors: [] });
  } else if (result.success || result.fbPostId || result.igMediaId || result.xTweetId || result.youtubeVideoId || result.linkedinPostId) {
    await postRepo.markPostAsPublished(postId, result.fbPostId, result.igMediaId, result.xTweetId, result.youtubeVideoId);
    if (result.linkedinPostId) await postRepo.saveLinkedInPostId(postId, result.linkedinPostId);
    await emitPublishEvent({ tenantKey, postId, status: "success", errors: result.errors });
  } else {
    await postRepo.markPostAsFailed(postId, result.errors.join("; "));
    await emitPublishEvent({ tenantKey, postId, status: "failed", errors: result.errors });
  }

  return result;
}

// ─── Caption Birlestir ──────────────────────────────────────
function buildCaption(caption: string, hashtags?: string | null): string {
  if (!hashtags) return caption;
  if (caption.includes("#")) return caption;
  return `${caption}\n\n${hashtags}`;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Yayin aninda platforma gore icerik uyarlamasi.
 * Tek caption + hashtag + link girdisinden her platform icin uygun metni uretir:
 *  - x: tek tweet <=280 (caption kisaltilir, mumkun oldugunca hashtag korunur)
 *  - instagram: caption + ayri hashtag blogu (+ link varsa "Link bio'da")
 *  - telegram: HTML-escape + link (Telegram link onizleme gosterir)
 *  - facebook/linkedin: tam metin + hashtag + link
 */
export function adaptForPlatform(
  platform: "facebook" | "instagram" | "x" | "telegram" | "linkedin",
  input: { caption: string; hashtags?: string | null; linkUrl?: string | null },
): string {
  const caption = (input.caption || "").trim();
  const hashtags = (input.hashtags || "").trim();
  const link = (input.linkUrl || "").trim();
  const hasHashInCaption = caption.includes("#");

  if (platform === "x") {
    const LIMIT = 280;
    let tags = !hashtags || hasHashInCaption ? "" : hashtags;
    // Once caption + tag birlestir, 280'i asarsa once tag'leri sonra caption'i kis.
    let body = caption;
    let composed = tags ? `${body}\n\n${tags}` : body;
    if (composed.length > LIMIT && tags) {
      // hashtag'leri tek tek azalt
      const tagArr = tags.split(/\s+/).filter(Boolean);
      while (tagArr.length && `${body}\n\n${tagArr.join(" ")}`.length > LIMIT) tagArr.pop();
      tags = tagArr.join(" ");
      composed = tags ? `${body}\n\n${tags}` : body;
    }
    if (composed.length > LIMIT) {
      const reserve = tags ? tags.length + 2 : 0;
      body = body.slice(0, Math.max(0, LIMIT - reserve - 1)).trimEnd() + "…";
      composed = tags ? `${body}\n\n${tags}` : body;
    }
    return composed.slice(0, LIMIT);
  }

  if (platform === "instagram") {
    // IG: caption + ayri hashtag blogu; link tiklanmaz -> not dus
    let out = caption;
    if (hashtags && !hasHashInCaption) out += `\n.\n.\n${hashtags}`;
    if (link) out += `\n\n🔗 Link profilde / bio'da`;
    return out.slice(0, 2200);
  }

  if (platform === "telegram") {
    let out = escapeHtml(caption);
    if (hashtags && !hasHashInCaption) out += `\n\n${escapeHtml(hashtags)}`;
    if (link) out += `\n\n${escapeHtml(link)}`;
    return out.slice(0, 4000);
  }

  // facebook / linkedin: tam metin
  let out = caption;
  if (hashtags && !hasHashInCaption) out += `\n\n${hashtags}`;
  if (link && !caption.includes(link)) out += `\n\n${link}`;
  return out;
}

// ─── Platform Durumunu Kontrol Et ───────────────────────────
export async function checkPlatformStatus(tenantKey?: string): Promise<{
  facebook: { connected: boolean; info?: unknown };
  instagram: { connected: boolean; info?: unknown };
  linkedin: { connected: boolean };
  x: { connected: boolean };
  telegram: { connected: boolean };
  youtube: { connected: boolean };
}> {
  const status = {
    facebook: { connected: false as boolean, info: undefined as unknown },
    instagram: { connected: false as boolean, info: undefined as unknown },
    linkedin: { connected: false as boolean },
    x: { connected: false as boolean },
    telegram: { connected: false as boolean },
    youtube: { connected: false as boolean },
  };

  if (tenantKey) {
    const accounts = await db
      .select()
      .from(platformAccounts)
      .where(and(eq(platformAccounts.tenantKey, tenantKey), eq(platformAccounts.isActive, 1)));
    status.facebook.connected = accounts.some((a) => a.platform === "facebook" && !!a.pageId && !!(a.pageToken || a.accessToken));
    status.instagram.connected = accounts.some((a) => a.platform === "instagram" && !!a.accountId && !!(a.accessToken || a.pageToken));
    status.linkedin.connected = accounts.some((a) => a.platform === "linkedin" && !!a.accountId && !!a.accessToken);
    status.x.connected = accounts.some((a) => a.platform === "x" && isCompleteOauth1(a.meta)) || canUseXEnvFallback(tenantKey);
    status.telegram.connected = accounts.some((a) => a.platform === "telegram" && !!a.accountId && !!a.accessToken);
    status.youtube.connected = accounts.some((a) => a.platform === "youtube" && !!a.accountId && !!a.refreshToken);
    return status;
  }

  try {
    status.facebook.info = await facebook.getPageInfo();
    status.facebook.connected = true;
  } catch {
    status.facebook.connected = false;
  }

  try {
    status.instagram.info = await instagram.getAccountInfo();
    status.instagram.connected = true;
  } catch {
    status.instagram.connected = false;
  }

  status.telegram.connected = !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);

  return status;
}

export async function publishLinkedInPost(tenantKey: string, text: string) {
  const [acc] = await db
    .select()
    .from(platformAccounts)
    .where(and(eq(platformAccounts.platform, "linkedin"), eq(platformAccounts.tenantKey, tenantKey), eq(platformAccounts.isActive, 1)))
    .limit(1);
  if (!acc?.accessToken || !acc.accountId) throw new Error("LinkedIn hesabi bagli degil");
  return linkedin.publishTextPost(acc.accessToken, acc.accountId, text);
}

export async function publishXPost(tenantKey: string, text: string) {
  const [acc] = await db
    .select()
    .from(platformAccounts)
    .where(and(eq(platformAccounts.platform, "x"), eq(platformAccounts.tenantKey, tenantKey), eq(platformAccounts.isActive, 1)))
    .limit(1);
  return xPlatform.publishTextPostOAuth1(resolveXOAuth1Credentials(tenantKey, acc), text);
}
