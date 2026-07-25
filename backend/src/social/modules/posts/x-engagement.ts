import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../../db/client";
import { platformAccounts, postComments, siteSettings, socialPosts } from "../../db/schema";
import { generateXReplyDraft } from "../ai/generator";
import * as telegram from "../platforms/telegram";
import * as xPlatform from "../platforms/x";
import type { OAuth1Creds } from "../platforms/x-oauth1";

type PlatformAccount = typeof platformAccounts.$inferSelect;
type PostComment = typeof postComments.$inferSelect;

function isCompleteOauth1(meta: unknown): meta is { oauth1: OAuth1Creds } {
  const oauth1 = (meta as { oauth1?: Partial<OAuth1Creds> } | null | undefined)?.oauth1;
  return !!(
    oauth1?.apiKey &&
    oauth1.apiSecret &&
    oauth1.accessToken &&
    oauth1.accessTokenSecret
  );
}

function mentionSinceKey(tenantKey: string) {
  return `x.mentions.sinceId.${tenantKey}`;
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

function maxTweetId(ids: string[]) {
  let max: bigint | null = null;
  let raw: string | null = null;
  for (const id of ids) {
    try {
      const next = BigInt(id);
      if (max === null || next > max) {
        max = next;
        raw = id;
      }
    } catch {
      // X ids are numeric strings; ignore malformed external data.
    }
  }
  return raw;
}

export async function syncXMentions(tenantKey: string) {
  const account = await getXAccount(tenantKey);
  const creds = resolveCreds(tenantKey, account);
  const userId = account?.accountId?.trim();
  if (!creds) throw new Error(`Tenant (${tenantKey}) icin X OAuth1 hesabi bagli degil`);
  if (!userId) throw new Error(`Tenant (${tenantKey}) icin X user id/accountId eksik`);

  const sinceKey = mentionSinceKey(tenantKey);
  const sinceId = await getSetting(sinceKey);
  const mentions = await xPlatform.getMentionsOAuth1(creds, userId, sinceId);
  const fetchedAt = new Date();
  let saved = 0;
  let skipped = 0;

  for (const mention of mentions) {
    const parentTweetId = mention.repliedToTweetId || mention.conversationId;
    if (!parentTweetId) {
      skipped += 1;
      continue;
    }

    const [post] = await db
      .select()
      .from(socialPosts)
      .where(and(eq(socialPosts.subType, tenantKey), eq(socialPosts.xTweetId, parentTweetId)))
      .limit(1);
    if (!post) {
      skipped += 1;
      continue;
    }

    const [existing] = await db
      .select({ id: postComments.id })
      .from(postComments)
      .where(
        and(
          eq(postComments.postId, post.id),
          eq(postComments.platform, "x"),
          eq(postComments.externalCommentId, mention.tweetId),
        ),
      )
      .limit(1);
    if (existing) continue;

    let draft: Awaited<ReturnType<typeof generateXReplyDraft>> | null = null;
    try {
      draft = await generateXReplyDraft(
        tenantKey,
        mention.text,
        mention.authorUsername ? `@${mention.authorUsername}` : mention.authorName,
        `Yanıtlanan yerel X post id: ${post.id}`,
      );
    } catch (err) {
      console.warn("[x-engagement] AI taslak uretilemedi:", (err as Error).message);
    }

    await db.insert(postComments).values({
      uuid: randomUUID(),
      postId: post.id,
      platform: "x",
      externalCommentId: mention.tweetId,
      parentCommentId: parentTweetId,
      authorName: mention.authorUsername ? `@${mention.authorUsername}` : mention.authorName,
      authorId: mention.authorId || null,
      message: mention.text,
      aiReplyDraft: draft?.reply ?? null,
      aiReplyStatus: draft?.reply ? "pending" : null,
      aiReplyModel: draft?.model ?? null,
      aiReplyProvider: draft?.provider ?? null,
      likeCount: mention.likeCount,
      createdTime: mention.createdAt,
      fetchedAt,
    });
    saved += 1;
  }

  const newestId = maxTweetId(mentions.map((mention) => mention.tweetId));
  if (newestId) await upsertSetting(sinceKey, newestId);

  if (saved > 0) {
    await telegram.sendMessage(
      `<b>X mention</b>\n\n${tenantKey}: ${saved} yeni mention taslagi onay bekliyor.`,
      undefined,
      { tenantKey },
    );
  }

  return { tenantKey, saved, skipped, fetched: mentions.length, sinceId: newestId ?? sinceId ?? null };
}

export async function listXMentionInbox(tenantKey: string, limit = 50) {
  const rows = await db
    .select({ comment: postComments, post: socialPosts })
    .from(postComments)
    .innerJoin(socialPosts, eq(postComments.postId, socialPosts.id))
    .where(and(eq(socialPosts.subType, tenantKey), eq(postComments.platform, "x")))
    .orderBy(desc(postComments.createdTime), desc(postComments.fetchedAt))
    .limit(Math.max(1, Math.min(limit, 100)));

  return rows.map((row) => ({ ...row.comment, postTitle: row.post.title, postXTweetId: row.post.xTweetId }));
}

export async function publishXReply(commentId: number, text?: string) {
  const [row] = await db
    .select({ comment: postComments, post: socialPosts })
    .from(postComments)
    .innerJoin(socialPosts, eq(postComments.postId, socialPosts.id))
    .where(and(eq(postComments.id, commentId), eq(postComments.platform, "x")))
    .limit(1);
  if (!row) throw new Error("X mention bulunamadi");

  const tenantKey = row.post.subType || "goldmoodastro";
  const account = await getXAccount(tenantKey);
  const creds = resolveCreds(tenantKey, account);
  if (!creds) throw new Error(`Tenant (${tenantKey}) icin X OAuth1 hesabi bagli degil`);

  const replyText = (text || row.comment.aiReplyDraft || "").trim();
  if (!replyText) throw new Error("Yanıt metni bos olamaz");

  const result = await xPlatform.publishTweetOAuth1(creds, {
    text: replyText,
    replyToTweetId: row.comment.externalCommentId,
  });

  await db
    .update(postComments)
    .set({
      aiReplyDraft: replyText,
      aiReplyStatus: "sent",
      aiRepliedTweetId: result.id,
    })
    .where(eq(postComments.id, commentId));

  return { ok: true, commentId, xTweetId: result.id };
}

export async function updateXReplyDraft(commentId: number, input: { draft?: string; status?: PostComment["aiReplyStatus"] }) {
  const values: Partial<PostComment> = {};
  if (input.draft !== undefined) values.aiReplyDraft = input.draft;
  if (input.status !== undefined) values.aiReplyStatus = input.status;
  await db.update(postComments).set(values).where(and(eq(postComments.id, commentId), eq(postComments.platform, "x")));
  return { ok: true };
}
