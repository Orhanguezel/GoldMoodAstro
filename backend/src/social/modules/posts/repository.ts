import { db, pool } from "../../db/client";
import { campaignCalendar, postAnalytics, postComments, socialPosts } from "../../db/schema";
import { eq, desc, asc, and, gte, lte, or, isNull, isNotNull, inArray, like, sql, type SQL } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import type { RowDataPacket } from "mysql2";
import type { CreatePostInput, CreateXThreadInput, UpdatePostInput, ListPostsQuery } from "./validation";

export async function createPost(input: CreatePostInput) {
  const uuid = uuidv4();
  await db.insert(socialPosts).values({
    uuid,
    postType: input.postType,
    subType: input.tenantKey ?? null,
    title: input.title,
    caption: input.caption,
    hashtags: input.hashtags,
    imageUrl: input.imageUrl,
    imageLocal: input.imageLocal,
    mediaUrls: input.mediaUrls ?? null,
    linkUrl: input.linkUrl,
    linkText: input.linkText,
    platform: input.platform,
    scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
    xThreadGroup: input.xThreadGroup,
    xThreadOrder: input.xThreadOrder,
    xReplyToTweetId: input.xReplyToTweetId,
    status: input.scheduledAt ? "scheduled" : "draft",
    sourceType: input.sourceType,
    sourceRef: input.sourceRef,
    aiGenerated: input.sourceType === "ai" ? 1 : 0,
    notes: input.notes,
  });

  const post = await getPostByUuid(uuid);
  if (post && input.scheduledAt) {
    await syncScheduledPostToCalendar(post.id, new Date(input.scheduledAt));
    return getPostById(post.id);
  }

  return post;
}

export async function createXThread(input: CreateXThreadInput) {
  const threadGroup = uuidv4();
  const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
  const createdIds: number[] = [];

  await db.transaction(async (tx) => {
    for (let index = 0; index < input.parts.length; index += 1) {
      const uuid = uuidv4();
      const part = input.parts[index]!;
      await tx.insert(socialPosts).values({
        uuid,
        postType: input.postType,
        subType: input.tenantKey,
        title: index === 0 ? input.title : input.title ? `${input.title} (${index + 1})` : null,
        caption: part.text,
        hashtags: index === 0 ? input.hashtags : null,
        mediaUrls: part.mediaUrls ?? null,
        platform: "x",
        scheduledAt,
        status: scheduledAt ? "scheduled" : "draft",
        xThreadGroup: threadGroup,
        xThreadOrder: index,
        sourceType: input.sourceType,
        sourceRef: input.sourceRef,
        aiGenerated: input.sourceType === "ai" ? 1 : 0,
        notes: input.notes,
      });
      const [created] = await tx
        .select({ id: socialPosts.id })
        .from(socialPosts)
        .where(eq(socialPosts.uuid, uuid))
        .limit(1);
      if (created?.id) createdIds.push(created.id);
    }
  });

  if (createdIds[0] && scheduledAt) {
    await syncScheduledPostToCalendar(createdIds[0], scheduledAt);
  }

  return {
    threadGroup,
    items: await getThreadGroup(threadGroup),
  };
}

export async function getPostById(id: number) {
  const rows = await db
    .select()
    .from(socialPosts)
    .where(eq(socialPosts.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function getPostByUuid(uuid: string) {
  const rows = await db
    .select()
    .from(socialPosts)
    .where(eq(socialPosts.uuid, uuid))
    .limit(1);
  return rows[0] ?? null;
}

export async function getPostBySourceRef(tenantKey: string, sourceRef: string) {
  const rows = await db
    .select()
    .from(socialPosts)
    .where(and(eq(socialPosts.subType, tenantKey), eq(socialPosts.sourceRef, sourceRef)))
    .limit(1);
  return rows[0] ?? null;
}

export async function existsBySourceRef(sourceRef: string, tenantKey: string) {
  const existing = await getPostBySourceRef(tenantKey, sourceRef);
  return !!existing;
}

export async function insertImportedTweet(input: {
  tenantKey: string;
  caption: string;
  xTweetId: string;
  postedAt: Date;
  sourceRef: string;
}) {
  const uuid = uuidv4();
  await db.insert(socialPosts).values({
    uuid,
    postType: "haber",
    subType: input.tenantKey,
    title: null,
    caption: input.caption,
    platform: "x",
    status: "posted",
    sourceType: "manual",
    sourceRef: input.sourceRef,
    createdBy: "x-sync",
    xTweetId: input.xTweetId,
    postedAt: input.postedAt,
  });

  return getPostByUuid(uuid);
}

export async function listXOwnTweets(tenantKey: string, limit = 50) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const posts = await db
    .select()
    .from(socialPosts)
    .where(
      and(
        eq(socialPosts.platform, "x"),
        eq(socialPosts.subType, tenantKey),
        // Hesabin X'te GERCEKTEN var olan tweet'leri = x_tweet_id dolu. Hem timeline'dan
        // sync edilen (`:owntweet:`) hem otomasyonla yayinlanan (`wiribu-live:tweets:` gibi)
        // tweet'leri kapsar. Eski dar `:owntweet:%` filtresi otomasyon tweet'lerini disliyordu.
        isNotNull(socialPosts.xTweetId),
      ),
    )
    .orderBy(desc(socialPosts.postedAt), desc(socialPosts.createdAt))
    .limit(safeLimit);
  if (posts.length === 0) return [];

  const analytics = await db
    .select()
    .from(postAnalytics)
    .where(inArray(postAnalytics.postId, posts.map((post) => post.id)))
    .orderBy(desc(postAnalytics.fetchedAt));
  const latest = new Map<number, typeof postAnalytics.$inferSelect>();
  for (const row of analytics) {
    if (!latest.has(row.postId)) latest.set(row.postId, row);
  }

  return posts.map((post) => ({
    ...post,
    latestAnalytics: latest.get(post.id) ?? null,
  }));
}

export async function listPosts(query: ListPostsQuery) {
  const conditions: SQL<unknown>[] = [];

  if (query.status) {
    conditions.push(eq(socialPosts.status, query.status));
  }
  if (query.platform) {
    // Platforma ozel sayfa (or. /social/facebook) icin: tam eslesen + cok-platformlu (both/all) postlar.
    // Boylece X gibi yogun bir platform, ortak fetch limitinde digerlerini disari itmez.
    conditions.push(
      query.platform === "both" || query.platform === "all"
        ? eq(socialPosts.platform, query.platform)
        : (or(
            eq(socialPosts.platform, query.platform),
            eq(socialPosts.platform, "both"),
            eq(socialPosts.platform, "all"),
          ) as SQL<unknown>),
    );
  }
  if (query.postType) {
    conditions.push(eq(socialPosts.postType, query.postType));
  }
  if (query.tenantKey) {
    conditions.push(eq(socialPosts.subType, query.tenantKey));
  }
  if (query.from) {
    conditions.push(gte(socialPosts.createdAt, new Date(query.from)));
  }
  if (query.to) {
    conditions.push(lte(socialPosts.createdAt, new Date(query.to)));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const sortColumn =
    query.sort === "scheduled_at"
      ? socialPosts.scheduledAt
      : query.sort === "posted_at"
        ? socialPosts.postedAt
        : socialPosts.createdAt;

  const orderFn = query.order === "asc" ? asc : desc;

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(socialPosts)
      .where(where)
      .orderBy(orderFn(sortColumn))
      .limit(query.limit)
      .offset(query.offset),
    db
      .select({ count: sql<number>`COUNT(*)` })
      .from(socialPosts)
      .where(where),
  ]);

  return {
    items: rows,
    total: Number(countResult[0]?.count ?? 0),
    limit: query.limit,
    offset: query.offset,
  };
}

export async function updatePost(id: number, input: UpdatePostInput) {
  const { scheduledAt, tenantKey, ...rest } = input;
  await db.update(socialPosts).set({
    ...rest,
    ...(tenantKey !== undefined ? { subType: tenantKey } : {}),
    ...(scheduledAt !== undefined ? { scheduledAt: new Date(scheduledAt) } : {}),
  }).where(eq(socialPosts.id, id));
  return getPostById(id);
}

export async function deletePost(id: number) {
  await db.transaction(async (tx) => {
    await tx.delete(postComments).where(eq(postComments.postId, id));
    await tx.delete(postAnalytics).where(eq(postAnalytics.postId, id));
    await tx.delete(campaignCalendar).where(eq(campaignCalendar.postId, id));
    await tx.delete(socialPosts).where(eq(socialPosts.id, id));
  });
}

export async function schedulePost(id: number, scheduledAt: string) {
  const scheduledDate = new Date(scheduledAt);
  await db
    .update(socialPosts)
    .set({
      scheduledAt: scheduledDate,
      status: "scheduled",
    })
    .where(eq(socialPosts.id, id));

  await syncScheduledPostToCalendar(id, scheduledDate);
  return getPostById(id);
}

export async function cancelPost(id: number) {
  await db
    .update(socialPosts)
    .set({ status: "cancelled" })
    .where(eq(socialPosts.id, id));
  return getPostById(id);
}

export async function duplicatePost(id: number) {
  const original = await getPostById(id);
  if (!original) return null;

  return createPost({
    tenantKey: original.subType || "goldmoodastro",
    postType: original.postType,
    title: original.title ? `${original.title} (kopya)` : undefined,
    caption: original.caption,
    hashtags: original.hashtags ?? undefined,
    imageUrl: original.imageUrl ?? undefined,
    imageLocal: original.imageLocal ?? undefined,
    mediaUrls: original.mediaUrls ?? undefined,
    linkUrl: original.linkUrl ?? undefined,
    linkText: original.linkText ?? undefined,
    platform: original.platform,
    xThreadGroup: original.xThreadGroup ?? undefined,
    xThreadOrder: original.xThreadOrder ?? undefined,
    xReplyToTweetId: original.xReplyToTweetId ?? undefined,
    sourceType: original.sourceType,
    sourceRef: original.sourceRef ?? undefined,
    notes: original.notes ?? undefined,
  });
}

export async function getPostQueue(limit = 10) {
  return db
    .select()
    .from(socialPosts)
    .where(eq(socialPosts.status, "scheduled"))
    .orderBy(asc(socialPosts.scheduledAt))
    .limit(limit);
}

export async function getPostsDueForPublishing() {
  return db
    .select()
    .from(socialPosts)
    .where(
      and(
        eq(socialPosts.status, "scheduled"),
        lte(socialPosts.scheduledAt, new Date()),
        or(isNull(socialPosts.xThreadGroup), eq(socialPosts.xThreadOrder, 0))
      )
    )
    .orderBy(asc(socialPosts.scheduledAt));
}

/**
 * Bir postu yayin icin ATOMIK olarak sahiplen.
 *
 * NEDEN: publisher, due postlari cekip yayinliyordu ama satiri once "sahiplenmiyordu".
 * Ayni satiri iki farkli cron tetigi (veya `bun --hot` sonrasi birikmis cron kayitlari,
 * ya da birden fazla backend ornegi) ayni anda cekebiliyor ve AYNI ICERIK BIRDEN FAZLA
 * KEZ YAYINLANIYOR. 2026-07-18'de goldmoodastro hesabinda ayni gonderi Instagram'da 3,
 * Facebook'ta 2 kez yayinlandi — Instagram Graph API silmeyi desteklemedigi icin
 * temizligi elle yapmak zorunda kalindi.
 *
 * `status='scheduled'` sartli UPDATE veritabani seviyesinde tekildir: yalnizca bir
 * cagri 1 satir etkiler, digerleri 0 alir ve o postu atlar.
 *
 * @returns true → sahiplenildi, yayina devam et. false → baskasi almis, ATLA.
 */
export async function claimPostForPublishing(postId: number): Promise<boolean> {
  const [res] = await (db as any).session.client.query(
    `UPDATE social_posts SET status = 'publishing' WHERE id = ? AND status = 'scheduled'`,
    [postId],
  );
  return (res?.affectedRows ?? 0) === 1;
}

export async function getThreadGroup(threadGroup: string) {
  return db
    .select()
    .from(socialPosts)
    .where(eq(socialPosts.xThreadGroup, threadGroup))
    .orderBy(asc(socialPosts.xThreadOrder));
}

export async function applyThreadResult(
  threadGroup: string,
  posts: Array<typeof socialPosts.$inferSelect>,
  result: { tweetIds: string[]; failedAtIndex?: number; error?: string },
) {
  await db.transaction(async (tx) => {
    for (let index = 0; index < posts.length; index += 1) {
      const post = posts[index]!;
      const tweetId = result.tweetIds[index];
      if (tweetId) {
        await tx
          .update(socialPosts)
          .set({
            status: "posted",
            postedAt: new Date(),
            xTweetId: tweetId,
            errorMessage: null,
          })
          .where(eq(socialPosts.id, post.id));
        continue;
      }

      if (result.failedAtIndex != null && index >= result.failedAtIndex) {
        await tx
          .update(socialPosts)
          .set({
            status: "failed",
            errorMessage: `X thread ${threadGroup} part ${index}: ${result.error ?? "unknown error"}`,
          })
          .where(eq(socialPosts.id, post.id));
      }
    }
  });
}

export async function markPostAsPublished(
  id: number,
  fbPostId?: string,
  igMediaId?: string,
  xTweetId?: string,
  youtubeVideoId?: string,
  postproxyPostId?: string,
) {
  await db
    .update(socialPosts)
    .set({
      status: "posted",
      postedAt: new Date(),
      fbPostId: fbPostId ?? null,
      igMediaId: igMediaId ?? null,
      xTweetId: xTweetId ?? null,
      youtubeVideoId: youtubeVideoId ?? null,
      postproxyPostId: postproxyPostId ?? null,
      errorMessage: null,
    })
    .where(eq(socialPosts.id, id));
}

export async function markYouTubePublished(postId: number, youtubeVideoId: string): Promise<void> {
  await db
    .update(socialPosts)
    .set({
      status: "posted",
      postedAt: new Date(),
      youtubeVideoId,
      errorMessage: null,
    })
    .where(eq(socialPosts.id, postId));
}

export async function saveLinkedInPostId(postId: number, linkedinPostId: string): Promise<void> {
  const [post] = await db.select({ notes: socialPosts.notes }).from(socialPosts).where(eq(socialPosts.id, postId)).limit(1);
  const marker = `[linkedin_post_id:${linkedinPostId}]`;
  const notes = [post?.notes?.replace(/\n?\[linkedin_post_id:[^\]]+\]/g, "").trim(), marker]
    .filter(Boolean)
    .join("\n");
  await db.update(socialPosts).set({ notes }).where(eq(socialPosts.id, postId));
}

export async function markLinkedInManualPending(postId: number): Promise<void> {
  const [post] = await db.select({ notes: socialPosts.notes }).from(socialPosts).where(eq(socialPosts.id, postId)).limit(1);
  const cleanNotes = post?.notes?.replace(/\n?\[linkedin_manual_(?:pending|posted)(?::[^\]]+)?\]/g, "").trim();
  const [columns] = await pool.query<Array<RowDataPacket & { COLUMN_TYPE: string }>>(
    "SELECT COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'social_posts' AND COLUMN_NAME = 'status' LIMIT 1",
  );
  const supportsManualPending = columns[0]?.COLUMN_TYPE.includes("'manual_pending'") ?? false;
  await db
    .update(socialPosts)
    .set({
      // Eski kurulumlar yetkili schema uygulamasina kadar draft fallback'iyle
      // calisir; yeni CREATE TABLE tanimi gercek manual_pending degerini saklar.
      status: supportsManualPending ? "manual_pending" : "draft",
      errorMessage: null,
      notes: [cleanNotes, "[linkedin_manual_pending]"].filter(Boolean).join("\n"),
    })
    .where(eq(socialPosts.id, postId));
}

export async function markLinkedInManualPosted(postId: number): Promise<void> {
  const [post] = await db.select({ notes: socialPosts.notes }).from(socialPosts).where(eq(socialPosts.id, postId)).limit(1);
  const cleanNotes = post?.notes?.replace(/\n?\[linkedin_manual_(?:pending|posted)(?::[^\]]+)?\]/g, "").trim();
  await db
    .update(socialPosts)
    .set({
      status: "posted",
      postedAt: new Date(),
      errorMessage: null,
      notes: [cleanNotes, `[linkedin_manual_posted:${new Date().toISOString()}]`].filter(Boolean).join("\n"),
    })
    .where(eq(socialPosts.id, postId));
}

export async function markPostAsPublishing(id: number) {
  await db
    .update(socialPosts)
    .set({
      status: "publishing",
      errorMessage: null,
    })
    .where(eq(socialPosts.id, id));
}

export async function markPostAsFailed(id: number, errorMessage: string) {
  await db
    .update(socialPosts)
    .set({
      status: "failed",
      errorMessage,
    })
    .where(eq(socialPosts.id, id));
}

export type AutoEditStatus = "queued" | "processing" | "done" | "failed" | "approved";

export async function updateAutoEditState(
  postId: number,
  input: {
    jobId?: string | null;
    status: AutoEditStatus;
    transcript?: unknown;
    segments?: unknown[] | null;
    error?: string | null;
  },
) {
  await db
    .update(socialPosts)
    .set({
      autoEditJobId: input.jobId ?? undefined,
      autoEditStatus: input.status,
      autoEditTranscript:
        input.transcript === undefined
          ? undefined
          : typeof input.transcript === "string"
            ? input.transcript
            : JSON.stringify(input.transcript),
      autoEditSegments: input.segments === undefined ? undefined : input.segments,
      autoEditError: input.error === undefined ? undefined : input.error,
    })
    .where(eq(socialPosts.id, postId));
  return getPostById(postId);
}

export async function approveAutoEdit(postId: number) {
  const post = await getPostById(postId);
  if (!post) return null;
  const segments = Array.isArray(post.autoEditSegments) ? post.autoEditSegments : [];
  const result = segments.find((item: any) => item?.type === "result") as any;
  const editedVideoUrl = typeof result?.editedVideoUrl === "string" ? result.editedVideoUrl : "";
  const thumbnailUrl = typeof result?.thumbnailUrl === "string" ? result.thumbnailUrl : "";
  if (!editedVideoUrl) {
    throw new Error("Onaylanacak auto-edit çıktısı bulunamadı");
  }

  await db
    .update(socialPosts)
    .set({
      mediaUrls: [editedVideoUrl],
      imageUrl: thumbnailUrl || post.imageUrl,
      autoEditStatus: "approved",
      autoEditError: null,
    })
    .where(eq(socialPosts.id, postId));
  return getPostById(postId);
}

export async function getPostStats(tenantKey?: string) {
  const result = await db
    .select({
      status: socialPosts.status,
      count: sql<number>`COUNT(*)`,
    })
    .from(socialPosts)
    .where(tenantKey ? eq(socialPosts.subType, tenantKey) : undefined)
    .groupBy(socialPosts.status);

  const stats: Record<string, number> = {};
  for (const row of result) {
    stats[row.status] = Number(row.count);
  }
  return stats;
}

function dateOnly(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function inferTimeSlot(value: Date): "morning" | "afternoon" | "evening" {
  const hour = value.getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

async function syncScheduledPostToCalendar(postId: number, scheduledAt: Date) {
  const post = await getPostById(postId);
  if (!post) return;

  const date = dateOnly(scheduledAt);
  const timeSlot = inferTimeSlot(scheduledAt);
  const tenantKey = post.subType || "goldmoodastro";
  const values = {
    tenantKey,
    date,
    timeSlot,
    postType: post.postType,
    platform: post.platform,
    postId: post.id,
    status: "scheduled" as const,
    notes: post.title || post.caption.slice(0, 140),
  };

  const [linked] = await db
    .select({ id: campaignCalendar.id })
    .from(campaignCalendar)
    .where(eq(campaignCalendar.postId, post.id))
    .limit(1);

  if (linked) {
    await db
      .update(campaignCalendar)
      .set(values)
      .where(eq(campaignCalendar.id, linked.id));
    return;
  }

  try {
    await db.insert(campaignCalendar).values({
      uuid: uuidv4(),
      ...values,
    });
    return;
  } catch {
    const [slot] = await db
      .select({ id: campaignCalendar.id, postId: campaignCalendar.postId })
      .from(campaignCalendar)
      .where(
        and(
          eq(campaignCalendar.tenantKey, tenantKey),
          eq(campaignCalendar.date, date),
          eq(campaignCalendar.timeSlot, timeSlot),
          eq(campaignCalendar.platform, post.platform),
        ),
      )
      .limit(1);

    if (slot && !slot.postId) {
      await db
        .update(campaignCalendar)
        .set(values)
        .where(eq(campaignCalendar.id, slot.id));
    }
  }
}
