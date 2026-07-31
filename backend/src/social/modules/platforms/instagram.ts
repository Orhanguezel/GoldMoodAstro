import { env } from "../../core/env";

const FB_GRAPH_URL = `https://graph.facebook.com/${env.META_GRAPH_API_VERSION}`;

interface IGMediaResult {
  id: string;
}

interface IGError {
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

// ─── Gorsel Postu Yayinla (2 Adim) ─────────────────────────
export async function publishPhotoPost(
  imageUrl: string,
  caption: string,
  opts?: { accountId?: string; accessToken?: string }
): Promise<IGMediaResult> {
  const accountId = opts?.accountId || env.IG_ACCOUNT_ID;
  const token = opts?.accessToken || env.IG_ACCESS_TOKEN;

  if (!accountId || !token) {
    throw new Error("Instagram yapilandirmasi eksik: IG_ACCOUNT_ID ve IG_ACCESS_TOKEN gerekli");
  }

  // Adim 1: Media container olustur
  const containerRes = await fetch(`${FB_GRAPH_URL}/${accountId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_url: imageUrl,
      caption,
      access_token: token,
    }),
  });

  const containerData = await containerRes.json();
  if (!containerRes.ok) {
    const err = containerData as IGError;
    throw new Error(`Instagram container hatasi: ${err.error?.message || containerRes.statusText}`);
  }

  const containerId = (containerData as IGMediaResult).id;

  // Container hazir olana kadar bekle (max 30 saniye)
  await waitForContainer(containerId, token);

  // Adim 2: Yayinla
  const publishRes = await fetch(`${FB_GRAPH_URL}/${accountId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creation_id: containerId,
      access_token: token,
    }),
  });

  const publishData = await publishRes.json();
  if (!publishRes.ok) {
    const err = publishData as IGError;
    throw new Error(`Instagram yayinlama hatasi: ${err.error?.message || publishRes.statusText}`);
  }

  return publishData as IGMediaResult;
}

// ─── Story (Hikaye) ─────────────────────────────────────────
/**
 * IG Story paylasir (media_type=STORIES). Sadece GORSEL yayinlanir — Graph API story'de
 * metin/sticker overlay desteklemez (caption gosterilmez). Public image_url gerekir.
 */
export async function publishStory(
  imageUrl: string,
  opts?: { accountId?: string; accessToken?: string },
): Promise<IGMediaResult> {
  const accountId = opts?.accountId || env.IG_ACCOUNT_ID;
  const token = opts?.accessToken || env.IG_ACCESS_TOKEN;
  if (!accountId || !token) throw new Error("Instagram yapilandirmasi eksik");

  // Adim 1: STORIES container
  const containerRes = await fetch(`${FB_GRAPH_URL}/${accountId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: imageUrl, media_type: "STORIES", access_token: token }),
  });
  const containerData = (await containerRes.json()) as any;
  if (!containerRes.ok) {
    throw new Error(`Instagram story container hatasi: ${containerData?.error?.message || containerRes.statusText}`);
  }
  const containerId = (containerData as IGMediaResult).id;

  await waitForContainer(containerId, token);

  // Adim 2: Yayinla
  const publishRes = await fetch(`${FB_GRAPH_URL}/${accountId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: containerId, access_token: token }),
  });
  const publishData = (await publishRes.json()) as any;
  if (!publishRes.ok) {
    throw new Error(`Instagram story yayinlama hatasi: ${publishData?.error?.message || publishRes.statusText}`);
  }
  return publishData as IGMediaResult;
}

// ─── Reel (Video) ───────────────────────────────────────────
/**
 * IG Reel yayını. Graph API video_url ister; görsel URL reel kapağı değildir.
 * `videoUrl` public erişilebilir bir MP4/MOV olmalıdır.
 */
export async function publishReel(
  videoUrl: string,
  caption: string,
  opts?: { accountId?: string; accessToken?: string; coverUrl?: string; shareToFeed?: boolean },
): Promise<IGMediaResult> {
  const accountId = opts?.accountId || env.IG_ACCOUNT_ID;
  const token = opts?.accessToken || env.IG_ACCESS_TOKEN;
  if (!accountId || !token) throw new Error("Instagram yapilandirmasi eksik");

  const body: Record<string, unknown> = {
    media_type: "REELS",
    video_url: videoUrl,
    caption,
    share_to_feed: opts?.shareToFeed ?? true,
    access_token: token,
  };
  if (opts?.coverUrl) body.cover_url = opts.coverUrl;

  const containerRes = await fetch(`${FB_GRAPH_URL}/${accountId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const containerData = (await containerRes.json()) as any;
  if (!containerRes.ok) {
    throw new Error(`Instagram reel container hatasi: ${containerData?.error?.message || containerRes.statusText}`);
  }
  const containerId = (containerData as IGMediaResult).id;

  await waitForContainer(containerId, token, 120_000);

  const publishRes = await fetch(`${FB_GRAPH_URL}/${accountId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: containerId, access_token: token }),
  });
  const publishData = (await publishRes.json()) as any;
  if (!publishRes.ok) {
    throw new Error(`Instagram reel yayinlama hatasi: ${publishData?.error?.message || publishRes.statusText}`);
  }
  return publishData as IGMediaResult;
}

// ─── Carousel (Coklu Gorsel) Postu ─────────────────────────
/**
 * Carousel (cok gorselli) gonderi — 2-10 gorsel.
 *
 * ⚠️ Per-tenant kimlik ZORUNLU: bu fonksiyon eskiden yalnizca global env
 * (IG_ACCOUNT_ID/IG_ACCESS_TOKEN) okuyordu — tek-tenant doneminden kalma. Coklu tenant'ta
 * yanlis hesaba yayin yapma riski tasiyordu. publishPhotoPost ile ayni opts kalibina
 * getirildi; env yalnizca geriye uyumluluk icin fallback.
 */
export async function publishCarouselPost(
  imageUrls: string[],
  caption: string,
  opts?: { accountId?: string; accessToken?: string }
): Promise<IGMediaResult> {
  const accountId = opts?.accountId || env.IG_ACCOUNT_ID;
  const token = opts?.accessToken || env.IG_ACCESS_TOKEN;

  if (!accountId || !token) {
    throw new Error("Instagram yapilandirmasi eksik");
  }

  if (imageUrls.length < 2 || imageUrls.length > 10) {
    throw new Error("Carousel icin 2-10 gorsel gerekli");
  }

  // Her gorsel icin container olustur
  const childIds: string[] = [];
  for (const url of imageUrls) {
    const res = await fetch(`${FB_GRAPH_URL}/${accountId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: url,
        is_carousel_item: true,
        access_token: token,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      const err = data as IGError;
      throw new Error(`Carousel item hatasi: ${err.error?.message}`);
    }
    childIds.push((data as IGMediaResult).id);
  }

  // Ana carousel container
  const carouselRes = await fetch(`${FB_GRAPH_URL}/${accountId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      media_type: "CAROUSEL",
      children: childIds.join(","),
      caption,
      access_token: token,
    }),
  });

  const carouselData = await carouselRes.json();
  if (!carouselRes.ok) {
    const err = carouselData as IGError;
    throw new Error(`Carousel container hatasi: ${err.error?.message}`);
  }

  const carouselId = (carouselData as IGMediaResult).id;
  await waitForContainer(carouselId, token);

  // Yayinla
  const publishRes = await fetch(`${FB_GRAPH_URL}/${accountId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creation_id: carouselId,
      access_token: token,
    }),
  });

  const publishData = await publishRes.json();
  if (!publishRes.ok) {
    const err = publishData as IGError;
    throw new Error(`Carousel yayinlama hatasi: ${err.error?.message}`);
  }

  return publishData as IGMediaResult;
}

// ─── Post Metriklerini Cek ──────────────────────────────────
export async function getMediaInsights(mediaId: string) {
  const token = env.IG_ACCESS_TOKEN;
  if (!token) throw new Error("IG_ACCESS_TOKEN eksik");

  const metrics = "impressions,reach,likes,comments,saved,shares";
  const res = await fetch(
    `${FB_GRAPH_URL}/${mediaId}/insights?metric=${metrics}&access_token=${token}`
  );

  const data = (await res.json()) as any;
  if (!res.ok) {
    // Fallback: temel metrikleri fields ile cek
    const fallbackRes = await fetch(
      `${FB_GRAPH_URL}/${mediaId}?fields=like_count,comments_count,timestamp&access_token=${token}`
    );
    const fallbackData = (await fallbackRes.json()) as any;
    return {
      likes: fallbackData.like_count ?? 0,
      comments: fallbackData.comments_count ?? 0,
      shares: 0,
      saves: 0,
      reach: 0,
      impressions: 0,
    };
  }

  const metrics_data = data.data || [];
  const result: Record<string, number> = {};
  for (const m of metrics_data) {
    result[m.name] = m.values?.[0]?.value ?? 0;
  }

  return {
    likes: result.likes ?? 0,
    comments: result.comments ?? 0,
    shares: result.shares ?? 0,
    saves: result.saved ?? 0,
    reach: result.reach ?? 0,
    impressions: result.impressions ?? 0,
  };
}

// ─── Hesap Medyalarini Al ───────────────────────────────────
/** Hesabin yayinlanmis gonderilerini ceker (begeni/yorum sayilariyla). */
export async function getRecentMedia(
  opts?: { accountId?: string; accessToken?: string; limit?: number },
) {
  const accountId = opts?.accountId || env.IG_ACCOUNT_ID;
  const token = opts?.accessToken || env.IG_ACCESS_TOKEN;
  if (!accountId || !token) throw new Error("Instagram yapilandirmasi eksik");

  const limit = Math.min(Math.max(opts?.limit ?? 25, 1), 100);
  const fields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count";
  const res = await fetch(
    `${FB_GRAPH_URL}/${accountId}/media?fields=${encodeURIComponent(fields)}&limit=${limit}&access_token=${token}`,
  );
  const data = (await res.json()) as any;
  if (!res.ok) {
    const err = data as IGError;
    throw new Error(`Instagram API hatasi: ${err.error?.message}`);
  }

  const items = (data?.data || []).map((m: any) => ({
    externalId: m.id,
    message: m.caption || "",
    mediaType: m.media_type || null,
    createdTime: m.timestamp || null,
    permalink: m.permalink || null,
    imageUrl: m.media_type === "VIDEO" ? m.thumbnail_url || m.media_url || null : m.media_url || null,
    likes: m.like_count ?? 0,
    comments: m.comments_count ?? 0,
    shares: 0,
  }));

  return { items };
}

// ─── Gonderi Detayi + Yorumlar ──────────────────────────────
export async function getMediaDetails(
  mediaId: string,
  opts?: { accessToken?: string },
) {
  const token = opts?.accessToken || env.IG_ACCESS_TOKEN;
  if (!mediaId || !token) throw new Error("Instagram medya ID/token eksik");

  const fieldsWithComments = [
    "id",
    "caption",
    "media_type",
    "media_url",
    "thumbnail_url",
    "permalink",
    "timestamp",
    "like_count",
    "comments_count",
    "comments.limit(50){id,text,timestamp,username,like_count,replies.limit(20){id,text,timestamp,username,like_count}}",
  ].join(",");

  let data: any;
  let commentsReadable = true;
  const res = await fetch(
    `${FB_GRAPH_URL}/${encodeURIComponent(mediaId)}?fields=${encodeURIComponent(fieldsWithComments)}&access_token=${token}`,
  );
  data = await res.json();
  if (!res.ok) {
    commentsReadable = false;
    const fallbackFields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count";
    const fallbackRes = await fetch(
      `${FB_GRAPH_URL}/${encodeURIComponent(mediaId)}?fields=${encodeURIComponent(fallbackFields)}&access_token=${token}`,
    );
    data = await fallbackRes.json();
    if (!fallbackRes.ok) throw new Error(`Instagram detay hatasi: ${graphError(data, fallbackRes.statusText)}`);
  }

  const normalizeComment = (comment: any) => ({
    id: String(comment?.id || ""),
    authorName: typeof comment?.username === "string" ? comment.username : null,
    message: typeof comment?.text === "string" ? comment.text : "",
    likeCount: Number(comment?.like_count ?? 0),
    createdTime: comment?.timestamp || null,
    replies: Array.isArray(comment?.replies?.data)
      ? comment.replies.data.map((reply: any) => ({
          id: String(reply?.id || ""),
          authorName: typeof reply?.username === "string" ? reply.username : null,
          message: typeof reply?.text === "string" ? reply.text : "",
          likeCount: Number(reply?.like_count ?? 0),
          createdTime: reply?.timestamp || null,
        }))
      : [],
  });

  return {
    externalId: data.id,
    message: data.caption || "",
    mediaType: data.media_type || null,
    createdTime: data.timestamp || null,
    permalink: data.permalink || null,
    imageUrl: data.media_type === "VIDEO" ? data.thumbnail_url || data.media_url || null : data.media_url || null,
    likes: Number(data.like_count ?? 0),
    comments: Number(data.comments_count ?? 0),
    commentsReadable,
    commentItems: Array.isArray(data.comments?.data) ? data.comments.data.map(normalizeComment) : [],
  };
}

export async function replyToComment(
  commentId: string,
  message: string,
  opts?: { accessToken?: string },
) {
  const token = opts?.accessToken || env.IG_ACCESS_TOKEN;
  const text = message.trim();
  if (!commentId || !token) throw new Error("Instagram yorum ID/token eksik");
  if (!text) throw new Error("Cevap metni gerekli");

  const res = await fetch(`${FB_GRAPH_URL}/${encodeURIComponent(commentId)}/replies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text, access_token: token }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Instagram yorum cevap hatasi: ${graphError(data, res.statusText)}`);
  return data as IGMediaResult;
}

// ─── Hesap Bilgilerini Al ───────────────────────────────────
export async function getAccountInfo(opts?: { accountId?: string; accessToken?: string }) {
  const accountId = opts?.accountId || env.IG_ACCOUNT_ID;
  const token = opts?.accessToken || env.IG_ACCESS_TOKEN;
  if (!accountId || !token) throw new Error("Instagram yapilandirmasi eksik");

  const fields = "username,name,profile_picture_url,followers_count,media_count";
  const res = await fetch(
    `${FB_GRAPH_URL}/${accountId}?fields=${fields}&access_token=${token}`
  );

  const data = await res.json();
  if (!res.ok) {
    const err = data as IGError;
    throw new Error(`Instagram API hatasi: ${err.error?.message}`);
  }

  return data;
}

// ─── Container Hazir Bekle ──────────────────────────────────
async function waitForContainer(
  containerId: string,
  token: string,
  maxWaitMs = 30000
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const res = await fetch(
      `${FB_GRAPH_URL}/${containerId}?fields=status_code&access_token=${token}`
    );
    const data = (await res.json()) as any;

    if (data.status_code === "FINISHED") return;
    if (data.status_code === "ERROR") {
      throw new Error(`Instagram media isleme hatasi: ${data.status || "bilinmeyen hata"}`);
    }

    // 2 saniye bekle
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error("Instagram media isleme zaman asimi (30s)");
}
