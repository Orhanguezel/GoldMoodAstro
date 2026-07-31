import { env } from "../../core/env";

const FB_GRAPH_URL = `https://graph.facebook.com/${env.META_GRAPH_API_VERSION}`;

interface FBPostResult {
  id: string;
}

interface FBError {
  error: {
    message: string;
    type: string;
    code: number;
  };
}

function graphError(data: unknown, fallback: string) {
  const message = (data as { error?: { message?: unknown } } | null)?.error?.message;
  return typeof message === "string" && message.trim() ? message : fallback;
}

// ─── Metin + Link Postu ─────────────────────────────────────
export async function publishTextPost(
  message: string,
  link?: string,
  opts?: { pageId?: string; pageAccessToken?: string }
): Promise<FBPostResult> {
  const pageId = opts?.pageId || env.FB_PAGE_ID;
  const token = opts?.pageAccessToken || env.FB_PAGE_ACCESS_TOKEN;

  if (!pageId || !token) {
    throw new Error("Facebook yapilandirmasi eksik: FB_PAGE_ID ve FB_PAGE_ACCESS_TOKEN gerekli");
  }

  const body: Record<string, string> = { message, access_token: token };
  if (link) body.link = link;

  const res = await fetch(`${FB_GRAPH_URL}/${pageId}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    const err = data as FBError;
    throw new Error(`Facebook API hatasi: ${err.error?.message || res.statusText}`);
  }

  return data as FBPostResult;
}

// ─── Gorsel + Metin Postu ───────────────────────────────────
export async function publishPhotoPost(
  imageUrl: string,
  caption: string,
  opts?: { pageId?: string; pageAccessToken?: string }
): Promise<FBPostResult> {
  const pageId = opts?.pageId || env.FB_PAGE_ID;
  const token = opts?.pageAccessToken || env.FB_PAGE_ACCESS_TOKEN;

  if (!pageId || !token) {
    throw new Error("Facebook yapilandirmasi eksik");
  }

  const res = await fetch(`${FB_GRAPH_URL}/${pageId}/photos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: imageUrl,
      caption,
      access_token: token,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    const err = data as FBError;
    throw new Error(`Facebook API hatasi: ${err.error?.message || res.statusText}`);
  }

  return data as FBPostResult;
}

// ─── Facebook Story (Foto) ──────────────────────────────────
/**
 * Page Story yayını: önce unpublished photo oluşturur, sonra photo_stories endpoint'i
 * ile story olarak yayınlar. Story'de caption garantili görünmez; görsel ana içeriktir.
 */
export async function publishPhotoStory(
  imageUrl: string,
  opts?: { pageId?: string; pageAccessToken?: string },
): Promise<FBPostResult> {
  const pageId = opts?.pageId || env.FB_PAGE_ID;
  const token = opts?.pageAccessToken || env.FB_PAGE_ACCESS_TOKEN;
  if (!pageId || !token) throw new Error("Facebook yapilandirmasi eksik");

  const photoRes = await fetch(`${FB_GRAPH_URL}/${pageId}/photos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: imageUrl,
      published: false,
      access_token: token,
    }),
  });
  const photoData = (await photoRes.json()) as any;
  if (!photoRes.ok) {
    throw new Error(`Facebook story foto hazirlama hatasi: ${photoData?.error?.message || photoRes.statusText}`);
  }
  const photoId = String(photoData.id || "");
  if (!photoId) throw new Error("Facebook story icin photo_id donmedi");

  const storyRes = await fetch(`${FB_GRAPH_URL}/${pageId}/photo_stories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      photo_id: photoId,
      access_token: token,
    }),
  });
  const storyData = (await storyRes.json()) as any;
  if (!storyRes.ok) {
    throw new Error(`Facebook story yayinlama hatasi: ${storyData?.error?.message || storyRes.statusText}`);
  }
  return { id: String(storyData.id || storyData.post_id || photoId) };
}

// ─── Facebook Reel (Video) ──────────────────────────────────
/**
 * Facebook Page Reel yayını. `videoUrl` public erişilebilir MP4/MOV olmalıdır.
 * Graph API'nin resumable upload akışını kullanır: start -> transfer -> finish.
 */
export async function publishReel(
  videoUrl: string,
  description: string,
  opts?: { pageId?: string; pageAccessToken?: string },
): Promise<FBPostResult> {
  const pageId = opts?.pageId || env.FB_PAGE_ID;
  const token = opts?.pageAccessToken || env.FB_PAGE_ACCESS_TOKEN;
  if (!pageId || !token) throw new Error("Facebook yapilandirmasi eksik");

  const startRes = await fetch(`${FB_GRAPH_URL}/${pageId}/video_reels`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      upload_phase: "start",
      access_token: token,
    }),
  });
  const startData = (await startRes.json()) as any;
  if (!startRes.ok) {
    throw new Error(`Facebook reel baslatma hatasi: ${startData?.error?.message || startRes.statusText}`);
  }
  const videoId = String(startData.video_id || startData.id || "");
  const uploadUrl = String(startData.upload_url || "");
  if (!videoId || !uploadUrl) throw new Error("Facebook reel upload bilgisi donmedi");

  const transferRes = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `OAuth ${token}`,
      file_url: videoUrl,
    },
  });
  const transferData = (await transferRes.json().catch(() => ({}))) as any;
  if (!transferRes.ok) {
    throw new Error(`Facebook reel video yukleme hatasi: ${transferData?.error?.message || transferRes.statusText}`);
  }

  const finishRes = await fetch(`${FB_GRAPH_URL}/${pageId}/video_reels`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      upload_phase: "finish",
      video_id: videoId,
      video_state: "PUBLISHED",
      description,
      access_token: token,
    }),
  });
  const finishData = (await finishRes.json()) as any;
  if (!finishRes.ok) {
    throw new Error(`Facebook reel yayinlama hatasi: ${finishData?.error?.message || finishRes.statusText}`);
  }
  return { id: String(finishData.post_id || finishData.id || videoId) };
}

// ─── Post Metriklerini Cek ──────────────────────────────────
export async function getPostInsights(postId: string) {
  const token = env.FB_PAGE_ACCESS_TOKEN;
  if (!token) throw new Error("FB_PAGE_ACCESS_TOKEN eksik");

  const fields = "likes.summary(true),comments.summary(true),shares";
  const res = await fetch(
    `${FB_GRAPH_URL}/${postId}?fields=${fields}&access_token=${token}`
  );

  const data = (await res.json()) as any;
  if (!res.ok) {
    const err = data as FBError;
    throw new Error(`Facebook API hatasi: ${err.error?.message || res.statusText}`);
  }

  return {
    likes: data.likes?.summary?.total_count ?? 0,
    comments: data.comments?.summary?.total_count ?? 0,
    shares: data.shares?.count ?? 0,
  };
}

// ─── Sayfa Gonderilerini Al ─────────────────────────────────
/** Sayfanin yayinlanmis gonderilerini ceker (begeni/yorum/paylasim sayilariyla). */
export async function getPagePosts(
  opts?: { pageId?: string; pageAccessToken?: string; limit?: number },
) {
  const pageId = opts?.pageId || env.FB_PAGE_ID;
  const token = opts?.pageAccessToken || env.FB_PAGE_ACCESS_TOKEN;
  if (!pageId || !token) throw new Error("Facebook yapilandirmasi eksik");

  const limit = Math.min(Math.max(opts?.limit ?? 25, 1), 100);
  const safeFields = ["id", "message", "created_time", "permalink_url", "full_picture", "shares"];
  // Engagement alanlari (reactions/comments.summary) token'da `pages_read_user_content` varsa calisir;
  // yoksa Graph #10 verir. Once zengin alanlarla dene, #10 alirsak guvenli alanlara dus.
  const richFields = [
    ...safeFields,
    "likes.summary(total_count).limit(0)",
    "comments.summary(total_count).limit(0)",
  ];

  async function call(fields: string[]) {
    const res = await fetch(
      `${FB_GRAPH_URL}/${pageId}/published_posts?fields=${encodeURIComponent(fields.join(","))}&limit=${limit}&access_token=${token}`,
    );
    const data = (await res.json()) as any;
    return { ok: res.ok, status: res.statusText, data };
  }

  let withEngagement = true;
  let resp = await call(richFields);
  if (!resp.ok && resp.data?.error?.code === 10) {
    // izin yok -> begeni/yorum olmadan tekrar dene
    withEngagement = false;
    resp = await call(safeFields);
  }
  if (!resp.ok) {
    throw new Error(`Facebook API hatasi: ${resp.data?.error?.message || resp.status}`);
  }

  const items = (resp.data?.data || []).map((p: any) => ({
    externalId: p.id,
    message: p.message || "",
    createdTime: p.created_time || null,
    permalink: p.permalink_url || null,
    imageUrl: p.full_picture || null,
    likes: withEngagement ? p.reactions?.summary?.total_count ?? 0 : null,
    comments: withEngagement ? p.comments?.summary?.total_count ?? 0 : null,
    shares: p.shares?.count ?? 0,
  }));

  return { items, engagement: withEngagement };
}

// ─── Gonderi Detayi + Yorumlar ──────────────────────────────
export async function getPagePostDetails(
  postId: string,
  opts?: { pageAccessToken?: string },
) {
  const token = opts?.pageAccessToken || env.FB_PAGE_ACCESS_TOKEN;
  if (!postId || !token) throw new Error("Facebook post ID/token eksik");

  const fields = [
    "id",
    "name",
    "created_time",
    "link",
    "picture",
    "images",
    "likes.summary(total_count).limit(0)",
    "comments.summary(total_count).limit(50){id,message,created_time,from,like_count,comments.limit(20){id,message,created_time,from,like_count}}",
  ].join(",");

  let data: any;
  let commentsReadable = true;
  const res = await fetch(
    `${FB_GRAPH_URL}/${encodeURIComponent(postId)}?fields=${encodeURIComponent(fields)}&access_token=${token}`,
  );
  data = await res.json();
  if (!res.ok) {
    commentsReadable = false;
    const fallbackFields = "id,name,created_time,link,picture,images";
    const fallbackRes = await fetch(
      `${FB_GRAPH_URL}/${encodeURIComponent(postId)}?fields=${encodeURIComponent(fallbackFields)}&access_token=${token}`,
    );
    data = await fallbackRes.json();
    if (!fallbackRes.ok) throw new Error(`Facebook detay hatasi: ${graphError(data, fallbackRes.statusText)}`);
  }

  const normalizeComment = (comment: any) => ({
    id: String(comment?.id || ""),
    authorName: typeof comment?.from?.name === "string" ? comment.from.name : null,
    authorId: typeof comment?.from?.id === "string" ? comment.from.id : null,
    message: typeof comment?.message === "string" ? comment.message : "",
    likeCount: Number(comment?.like_count ?? 0),
    createdTime: comment?.created_time || null,
    replies: Array.isArray(comment?.comments?.data)
      ? comment.comments.data.map((reply: any) => ({
          id: String(reply?.id || ""),
          authorName: typeof reply?.from?.name === "string" ? reply.from.name : null,
          authorId: typeof reply?.from?.id === "string" ? reply.from.id : null,
          message: typeof reply?.message === "string" ? reply.message : "",
          likeCount: Number(reply?.like_count ?? 0),
          createdTime: reply?.created_time || null,
        }))
      : [],
  });

  return {
    externalId: data.id,
    message: data.message || data.name || "",
    createdTime: data.created_time || null,
    permalink: data.permalink_url || data.link || null,
    imageUrl: data.full_picture || data.images?.[0]?.source || data.picture || null,
    likes: data.likes?.summary?.total_count ?? null,
    comments: data.comments?.summary?.total_count ?? null,
    shares: data.shares?.count ?? 0,
    commentsReadable,
    commentItems: Array.isArray(data.comments?.data) ? data.comments.data.map(normalizeComment) : [],
  };
}

export async function replyToComment(
  commentId: string,
  message: string,
  opts?: { pageAccessToken?: string },
) {
  const token = opts?.pageAccessToken || env.FB_PAGE_ACCESS_TOKEN;
  const text = message.trim();
  if (!commentId || !token) throw new Error("Facebook yorum ID/token eksik");
  if (!text) throw new Error("Cevap metni gerekli");

  const res = await fetch(`${FB_GRAPH_URL}/${encodeURIComponent(commentId)}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text, access_token: token }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Facebook yorum cevap hatasi: ${graphError(data, res.statusText)}`);
  return data as FBPostResult;
}

// ─── Sayfa Bilgilerini Al ───────────────────────────────────
export async function getPageInfo(opts?: { pageId?: string; pageAccessToken?: string }) {
  const pageId = opts?.pageId || env.FB_PAGE_ID;
  const token = opts?.pageAccessToken || env.FB_PAGE_ACCESS_TOKEN;
  if (!pageId || !token) throw new Error("Facebook yapilandirmasi eksik");

  const fields = "name,fan_count,followers_count,picture";
  const res = await fetch(
    `${FB_GRAPH_URL}/${pageId}?fields=${fields}&access_token=${token}`
  );

  const data = await res.json();
  if (!res.ok) {
    const err = data as FBError;
    throw new Error(`Facebook API hatasi: ${err.error?.message || res.statusText}`);
  }

  return data;
}

// ─── Long-Lived Token Al ────────────────────────────────────
export async function exchangeForLongLivedToken(
  shortLivedToken: string
): Promise<{ access_token: string; expires_in: number }> {
  const appId = env.FB_APP_ID;
  const appSecret = env.FB_APP_SECRET;
  if (!appId || !appSecret) throw new Error("FB_APP_ID ve FB_APP_SECRET gerekli");

  const res = await fetch(
    `${FB_GRAPH_URL}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`
  );

  const data = await res.json();
  if (!res.ok) {
    const err = data as FBError;
    throw new Error(`Token degisim hatasi: ${err.error?.message || res.statusText}`);
  }

  return data as { access_token: string; expires_in: number };
}

// ─── Token Gecerliligi Kontrol ──────────────────────────────
export async function debugToken(token: string) {
  const appToken = `${env.FB_APP_ID}|${env.FB_APP_SECRET}`;
  const res = await fetch(
    `${FB_GRAPH_URL}/debug_token?input_token=${token}&access_token=${appToken}`
  );
  const data = (await res.json()) as any;
  return data.data;
}
