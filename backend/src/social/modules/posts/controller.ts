import type { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import * as repo from "./repository";
import * as insights from "./insights";
import * as xEngagement from "./x-engagement";
import * as xOwnTweets from "./x-owntweets";
import {
  createPostSchema,
  createXThreadSchema,
  updatePostSchema,
  schedulePostSchema,
  listPostsSchema,
} from "./validation";
import * as publisher from "../platforms/publisher";
import * as xPlatform from "../platforms/x";
import * as facebook from "../platforms/facebook";
import * as youtubePlatform from "../platforms/youtube";
import * as compliance from "./compliance";
import { enqueueVideoEditJob, getVideoEditQueue } from "../../core/queue";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { v4 as uuidv4 } from "uuid";
import { env } from "../../core/env";

/** POST /posts/upload-image — lokal gorsel yukleme (multipart). /uploads/social altina yazar. */
export async function uploadImage(req: FastifyRequest, reply: FastifyReply) {
  const mp = await (req as any).file?.();
  if (!mp) return reply.status(400).send({ error: "Dosya gerekli (multipart 'file' alani)" });
  const mime: string = mp.mimetype || "";
  if (!mime.startsWith("image/")) return reply.status(400).send({ error: "Sadece gorsel yuklenebilir" });
  try {
    const ext = (mime.split("/")[1] || "jpg").split("+")[0].replace("jpeg", "jpg");
    const root = env.LOCAL_STORAGE_ROOT ? path.resolve(env.LOCAL_STORAGE_ROOT) : path.resolve(process.cwd(), "uploads");
    const dir = path.join(root, "social");
    await mkdir(dir, { recursive: true });
    const fname = `${uuidv4()}.${ext}`;
    const buf = await mp.toBuffer();
    await writeFile(path.join(dir, fname), buf);
    const host = req.headers.host;
    const proto = (req.headers["x-forwarded-proto"] as string) || (req.protocol ?? "http");
    const rel = `/uploads/social/${fname}`;
    return reply.send({ url: host ? `${proto}://${host}${rel}` : rel, path: rel });
  } catch (err) {
    return reply.status(400).send({ error: (err as Error).message || "Yukleme basarisiz" });
  }
}

const xInboxQuerySchema = z.object({
  tenantKey: z.string().trim().min(1).max(100).default("goldmoodastro"),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const xReplyBodySchema = z.object({
  text: z.string().trim().min(1).max(280).optional(),
});

const xReplyDraftBodySchema = z.object({
  draft: z.string().max(280).optional(),
  status: z.enum(["pending", "approved", "rejected", "sent"]).nullable().optional(),
});

const autoEditBodySchema = z.object({
  targetDurationSec: z.coerce.number().int().min(30).max(90).optional(),
  contentStyle: z.enum(["highlight", "summary", "best-moments"]).default("highlight"),
});

function isProbablyVideoUrl(url: string): boolean {
  const value = url.toLowerCase();
  return [".mp4", ".mov", ".m4v", ".webm"].some((ext) => value.includes(ext));
}

function pickVideoSource(post: Awaited<ReturnType<typeof repo.getPostById>>): string {
  if (!post) throw new Error("Post bulunamadi");
  const candidates = [
    ...(post.mediaUrls ?? []),
    post.imageUrl,
    post.imageLocal,
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0);
  const video = candidates.find(isProbablyVideoUrl);
  if (!video) throw new Error("Auto-edit icin video dosyasi bulunamadi");
  return video;
}

export async function list(req: FastifyRequest, reply: FastifyReply) {
  const query = listPostsSchema.parse(req.query);
  const result = await repo.listPosts(query);
  return reply.send(result);
}

/**
 * Uyumluluk denetimi — panelde "bu post kaynağına sadık mı?" göstergesi.
 * Üretim script'lerindeki guard'lar sadece bizim ürettiğimizi korur; elle yazılan
 * postlar oradan geçmez. Bu uç yayından ÖNCE aynı kuralları görünür kılar.
 */
export async function complianceList(req: FastifyRequest, reply: FastifyReply) {
  const query = listPostsSchema.parse(req.query);
  const result = await repo.listPosts(query);
  const items = (result as { items?: unknown[] }).items ?? [];
  const audits = await compliance.auditPosts(items as any[]);
  const values = Object.values(audits);
  return reply.send({
    items: audits,
    summary: {
      total: values.length,
      fail: values.filter((a) => a.level === "fail").length,
      warn: values.filter((a) => a.level === "warn").length,
      ok: values.filter((a) => a.level === "ok").length,
    },
  });
}

export async function complianceOne(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const post = await repo.getPostById(Number(req.params.id));
  if (!post) return reply.status(404).send({ error: "Post bulunamadi" });
  return reply.send(await compliance.auditPost(post as any));
}

export async function getById(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const post = await repo.getPostById(Number(req.params.id));
  if (!post) return reply.status(404).send({ error: "Post bulunamadi" });
  return reply.send(post);
}

export async function create(req: FastifyRequest, reply: FastifyReply) {
  const input = createPostSchema.parse(req.body);
  const post = await repo.createPost(input);
  return reply.status(201).send(post);
}

export async function createXThread(req: FastifyRequest, reply: FastifyReply) {
  const input = createXThreadSchema.parse(req.body);
  const result = await repo.createXThread(input);
  return reply.status(201).send(result);
}

export async function xInbox(req: FastifyRequest, reply: FastifyReply) {
  const query = xInboxQuerySchema.parse(req.query);
  const items = await xEngagement.listXMentionInbox(query.tenantKey, query.limit);
  return reply.send({ items });
}

export async function syncXMentions(req: FastifyRequest, reply: FastifyReply) {
  const query = xInboxQuerySchema.pick({ tenantKey: true }).parse(req.body || req.query);
  try {
    const result = await xEngagement.syncXMentions(query.tenantKey);
    return reply.send(result);
  } catch (err) {
    return reply.status(500).send({ error: (err as Error).message });
  }
}

export async function syncXOwnTweets(req: FastifyRequest, reply: FastifyReply) {
  const query = xInboxQuerySchema.pick({ tenantKey: true }).parse(req.body || req.query);
  try {
    const result = await xOwnTweets.syncXOwnTweets(query.tenantKey);
    return reply.send(result);
  } catch (err) {
    return reply.status(500).send({ error: (err as Error).message });
  }
}

export async function listXOwnTweets(req: FastifyRequest, reply: FastifyReply) {
  const query = xInboxQuerySchema.parse(req.query);
  const items = await repo.listXOwnTweets(query.tenantKey, query.limit);
  return reply.send({ items });
}

export async function updateXReplyDraft(
  req: FastifyRequest<{ Params: { commentId: string } }>,
  reply: FastifyReply,
) {
  const input = xReplyDraftBodySchema.parse(req.body);
  const result = await xEngagement.updateXReplyDraft(Number(req.params.commentId), input);
  return reply.send(result);
}

export async function publishXReply(
  req: FastifyRequest<{ Params: { commentId: string } }>,
  reply: FastifyReply,
) {
  const input = xReplyBodySchema.parse(req.body || {});
  try {
    const result = await xEngagement.publishXReply(Number(req.params.commentId), input.text);
    return reply.send(result);
  } catch (err) {
    return reply.status(500).send({ error: (err as Error).message });
  }
}

export async function update(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const existing = await repo.getPostById(Number(req.params.id));
  if (!existing) return reply.status(404).send({ error: "Post bulunamadi" });

  const input = updatePostSchema.parse(req.body);
  const post = await repo.updatePost(existing.id, input);
  return reply.send(post);
}

export async function remove(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const existing = await repo.getPostById(Number(req.params.id));
  if (!existing) return reply.status(404).send({ error: "Post bulunamadi" });

  // Yayinlanmis bir X tweet'i varsa once X'ten sil — panel silmesi artik X'ten de siler.
  // Credential publisher ile ayni kaynaktan gelir (tenant'a ozel platform_accounts.oauth1,
  // yoksa haldefiyat icin env fallback) — yanlis tenant token'i kullanilmasin.
  // HIBRIT politika: 404 = zaten yok (sorun degil). Gecici hata (402 kredi / 429 limit /
  // 5xx / ag) -> DB kaydi yine silinir + uyari (panel kullanilabilir kalir). Gercek hata
  // (400/401/403 auth/yetki) -> DB kaydi KORUNUR, 502 (kullanici tweet'in canli oldugunu bilsin).
  let xDeleteWarning: string | undefined;
  if (existing.xTweetId) {
    const creds = await publisher.getXCredsForTenant(existing.subType ?? "");
    if (!creds) {
      xDeleteWarning = "X hesabi bagli degil; tweet X'ten silinemedi, panel kaydi silindi.";
      req.log.warn({ postId: existing.id, tenant: existing.subType }, xDeleteWarning);
    } else {
      try {
        const result = await xPlatform.deleteTweetOAuth1(creds, existing.xTweetId);
        if (result.alreadyGone) {
          req.log.info(
            { postId: existing.id, tweetId: existing.xTweetId },
            "X tweet zaten yok (elle silinmis), DB kaydi siliniyor"
          );
        }
      } catch (err) {
        const status = (err as Error & { httpStatus?: number }).httpStatus;
        const isHardFailure = status === 400 || status === 401 || status === 403;
        req.log.error(
          { err, postId: existing.id, tweetId: existing.xTweetId, status, isHardFailure },
          "X tweet silinemedi"
        );
        if (isHardFailure) {
          // Auth/yetki sorunu — kaydi koru, kullanici tweet'in hala canli oldugunu gormeli
          return reply.status(502).send({
            error: "Tweet X'ten silinemedi (kayit korundu, kontrol et): " + (err as Error).message,
          });
        }
        // Gecici hata (402/429/5xx/ag) — DB kaydini sil ama uyari dondur
        xDeleteWarning =
          "Tweet X'ten silinemedi (X gecici/kredi sorunu); panel kaydi silindi ama tweet hala canli olabilir: " +
          (err as Error).message;
      }
    }
  }

  // ─── Facebook: yayinlanmis page postu varsa FB'den de sil ──────────────
  // Ayni hibrit politika: 404/zaten-yok = sorun degil; 400/401/403 (auth/yetki) = kaydi
  // KORU + 502; gecici hata (429/5xx/ag) = kaydi sil + uyari.
  let fbDeleteWarning: string | undefined;
  if (existing.fbPostId) {
    const creds = await publisher.getFbCredsForTenant(existing.subType ?? "");
    if (!creds) {
      fbDeleteWarning = "Facebook hesabi bagli degil; gonderi FB'den silinemedi, panel kaydi silindi.";
      req.log.warn({ postId: existing.id, tenant: existing.subType }, fbDeleteWarning);
    } else {
      try {
        const result = await facebook.facebookPostDelete(creds.token, existing.fbPostId);
        if (result.alreadyGone) {
          req.log.info(
            { postId: existing.id, fbPostId: existing.fbPostId },
            "FB gonderi zaten yok (elle silinmis), DB kaydi siliniyor"
          );
        }
      } catch (err) {
        const status = (err as Error & { httpStatus?: number }).httpStatus;
        const isHardFailure = status === 400 || status === 401 || status === 403;
        req.log.error(
          { err, postId: existing.id, fbPostId: existing.fbPostId, status, isHardFailure },
          "FB gonderi silinemedi"
        );
        if (isHardFailure) {
          return reply.status(502).send({
            error: "Gonderi Facebook'tan silinemedi (kayit korundu, kontrol et): " + (err as Error).message,
          });
        }
        fbDeleteWarning =
          "Gonderi Facebook'tan silinemedi (gecici sorun); panel kaydi silindi ama gonderi hala canli olabilir: " +
          (err as Error).message;
      }
    }
  }

  // ─── YouTube: yayinlanmis video varsa YouTube'dan da sil ───────────────
  // FB/X ile ayni hibrit politika: zaten yok = sorun degil; 401/403 (auth/yetki) =
  // kaydi KORU + 502; gecici hata (429 kota / 5xx / ag) = kaydi sil + uyari.
  // NOT: YouTube kota asimini 403 ile de bildirebiliyor; bu durumda reason
  // "quotaExceeded" olur ve gecici sayilir (kullaniciyi bosuna kilitlemeyelim).
  let ytDeleteWarning: string | undefined;
  if (existing.youtubeVideoId) {
    const yt = await publisher.getYouTubeAccountForTenant(existing.subType ?? "").catch(() => null);
    if (!yt) {
      ytDeleteWarning = "YouTube hesabi bagli degil; video YouTube'dan silinemedi, panel kaydi silindi.";
      req.log.warn({ postId: existing.id, tenant: existing.subType }, ytDeleteWarning);
    } else {
      try {
        const result = await youtubePlatform.deleteVideo(existing.youtubeVideoId, yt.account);
        if (result.alreadyGone) {
          req.log.info(
            { postId: existing.id, videoId: existing.youtubeVideoId },
            "YouTube video zaten yok (elle silinmis), DB kaydi siliniyor"
          );
        }
      } catch (err) {
        const status = (err as Error & { httpStatus?: number }).httpStatus;
        // deleteVideo hatayi sarmaliyor ve `reason`i wrapper'a tasiyor; ham Gaxios
        // hatasi da gelebilir diye `errors[0].reason` fallback'i duruyor.
        const reason =
          (err as { reason?: string }).reason ??
          (err as { errors?: Array<{ reason?: string }> }).errors?.[0]?.reason;
        const isQuota = reason === "quotaExceeded" || reason === "rateLimitExceeded";
        const isHardFailure = !isQuota && (status === 400 || status === 401 || status === 403);
        req.log.error(
          { err, postId: existing.id, videoId: existing.youtubeVideoId, status, reason, isHardFailure },
          "YouTube video silinemedi"
        );
        if (isHardFailure) {
          return reply.status(502).send({
            error: "Video YouTube'dan silinemedi (kayit korundu, kontrol et): " + (err as Error).message,
          });
        }
        ytDeleteWarning =
          "Video YouTube'dan silinemedi (gecici/kota sorunu); panel kaydi silindi ama video hala yayinda olabilir: " +
          (err as Error).message;
      }
    }
  }

  // ─── Instagram: Graph API yayinlanmis medyayi SILMEYE IZIN VERMIYOR ─────
  // (Meta kisiti — kod degil.) Kullaniciyi bilgilendir: IG uygulamasindan elle silmeli.
  let igDeleteWarning: string | undefined;
  if (existing.igMediaId) {
    igDeleteWarning =
      "Instagram gonderisi API'den silinemez (Instagram kisiti); panel kaydi silindi ama IG'de kalir — IG uygulamasindan elle silin.";
    req.log.info({ postId: existing.id, igMediaId: existing.igMediaId }, igDeleteWarning);
  }

  await repo.deletePost(existing.id);
  const warnings = [xDeleteWarning, fbDeleteWarning, ytDeleteWarning, igDeleteWarning].filter(Boolean);
  return reply.send({ ok: true, ...(warnings.length ? { warning: warnings.join(" ") } : {}) });
}

export async function schedule(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const existing = await repo.getPostById(Number(req.params.id));
  if (!existing) return reply.status(404).send({ error: "Post bulunamadi" });

  const { scheduledAt } = schedulePostSchema.parse(req.body);
  const post = await repo.schedulePost(existing.id, scheduledAt);
  return reply.send(post);
}

export async function publishNow(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const existing = await repo.getPostById(Number(req.params.id));
  if (!existing) return reply.status(404).send({ error: "Post bulunamadi" });

  try {
    const result = await publisher.publishPost(existing.id);
    return reply.send({
      ok: result.success,
      fbPostId: result.fbPostId,
      igMediaId: result.igMediaId,
      xTweetId: result.xTweetId,
      errors: result.errors,
    });
  } catch (err) {
    return reply.status(500).send({ error: (err as Error).message });
  }
}

export async function cancel(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const existing = await repo.getPostById(Number(req.params.id));
  if (!existing) return reply.status(404).send({ error: "Post bulunamadi" });

  const post = await repo.cancelPost(existing.id);
  return reply.send(post);
}

export async function duplicate(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const post = await repo.duplicatePost(Number(req.params.id));
  if (!post) return reply.status(404).send({ error: "Post bulunamadi" });
  return reply.status(201).send(post);
}

export async function details(
  req: FastifyRequest<{ Params: { id: string }; Querystring: { refresh?: string } }>,
  reply: FastifyReply
) {
  try {
    const result = await insights.getPostDetails(Number(req.params.id), {
      refresh: req.query.refresh === "1" || req.query.refresh === "true",
    });
    return reply.send(result);
  } catch (err) {
    if ((err as Error).message === "Post bulunamadi") {
      return reply.status(404).send({ error: "Post bulunamadi" });
    }
    return reply.status(500).send({ error: (err as Error).message });
  }
}

export async function refreshMetrics(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const result = await insights.refreshPostMetrics(Number(req.params.id));
    return reply.send(result);
  } catch (err) {
    if ((err as Error).message === "Post bulunamadi") {
      return reply.status(404).send({ error: "Post bulunamadi" });
    }
    return reply.status(500).send({ error: (err as Error).message });
  }
}

export async function queue(req: FastifyRequest, reply: FastifyReply) {
  const posts = await repo.getPostQueue();
  return reply.send({ items: posts });
}

export async function history(req: FastifyRequest, reply: FastifyReply) {
  const query = listPostsSchema.parse({ ...req.query as object, status: "posted" });
  const result = await repo.listPosts(query);
  return reply.send(result);
}

export async function stats(req: FastifyRequest, reply: FastifyReply) {
  const tenantKey =
    typeof (req.query as Record<string, unknown> | null)?.tenantKey === "string"
      ? ((req.query as Record<string, unknown>).tenantKey as string)
      : undefined;
  const s = await repo.getPostStats(tenantKey);
  return reply.send(s);
}

export async function startAutoEdit(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const post = await repo.getPostById(Number(req.params.id));
  if (!post) return reply.status(404).send({ error: "Post bulunamadi" });
  const options = autoEditBodySchema.parse(req.body || {});
  const videoLocalPath = pickVideoSource(post);
  const tenantKey = post.subType || "goldmoodastro";
  const job = await enqueueVideoEditJob({
    postId: post.id,
    tenantKey,
    videoLocalPath,
    options,
  });
  await repo.updateAutoEditState(post.id, {
    jobId: String(job.id),
    status: "queued",
    error: null,
  });
  return reply.status(202).send({ jobId: String(job.id), status: "queued" });
}

export async function getAutoEditStatus(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const post = await repo.getPostById(Number(req.params.id));
  if (!post) return reply.status(404).send({ error: "Post bulunamadi" });
  const jobId = post.autoEditJobId;
  const job = jobId ? await getVideoEditQueue().getJob(jobId).catch(() => null) : null;
  const progress = job?.progress ?? null;
  return reply.send({
    status: post.autoEditStatus || null,
    jobId,
    progress,
    result: {
      transcript: post.autoEditTranscript,
      segments: post.autoEditSegments,
      error: post.autoEditError,
    },
  });
}

export async function approveAutoEdit(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  const post = await repo.approveAutoEdit(Number(req.params.id));
  if (!post) return reply.status(404).send({ error: "Post bulunamadi" });
  return reply.send({ ok: true, post });
}

export async function retryAutoEdit(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  return startAutoEdit(req, reply);
}
