import { and, eq } from "drizzle-orm";
import { db, pool } from "../social/db/client";
import { socialPosts } from "../social/db/schema";
import { sendPost } from "../social/modules/platforms/telegram";
import { adaptForPlatform, isStoryPost } from "../social/modules/platforms/publisher";

const tenantKey = "goldmoodastro";
const rows = await db.select().from(socialPosts).where(and(
  eq(socialPosts.subType, tenantKey),
  eq(socialPosts.status, "posted"),
));

const unique = new Map<string, typeof rows[number]>();
for (const row of rows
  .filter((row) => !isStoryPost(row))
  .sort((a, b) => (a.postedAt ?? a.createdAt)?.getTime()! - (b.postedAt ?? b.createdAt)?.getTime()!)) {
  const key = row.sourceRef?.trim() || row.uuid;
  if (!unique.has(key)) unique.set(key, row);
}

let sent = 0;
for (const row of unique.values()) {
  const text = adaptForPlatform("telegram", {
    caption: row.caption,
    hashtags: row.hashtags,
    linkUrl: row.linkUrl,
  });
  const media = [row.imageUrl, ...(row.mediaUrls ?? [])]
    .filter((url): url is string => typeof url === "string" && url.trim().length > 0)
    .filter((url, index, all) => all.indexOf(url) === index);
  if (!(await sendPost(text, media, undefined, { tenantKey }))) {
    throw new Error(`Telegram backfill failed at social_posts.id=${row.id}`);
  }
  sent += 1;
  console.log(`[telegram-backfill] ${sent}/${unique.size} id=${row.id}`);
  await new Promise((resolve) => setTimeout(resolve, 1_100));
}

console.log(`[telegram-backfill] completed: ${sent}`);
await pool.end();
