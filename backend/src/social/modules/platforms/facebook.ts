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
    "reactions.summary(total_count).limit(0)",
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
