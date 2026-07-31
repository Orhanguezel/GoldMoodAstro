// backend/src/cron/social-queue.ts
// =============================================================
// Zamanlanmis sosyal medya gonderilerini otomatik yayinlar.
// social_posts.status='scheduled' ve scheduled_at <= now olanlari FB/IG'ye gonderir.
// TEK KAYNAK goldmood (ekosistem'de goldmood cron'lari kapatildi — bkz. social_cron_single_source).
//
// - Her 5 dk kontrol (setInterval; mevcut cron deseniyle ayni, node-cron yok).
// - Env kapisi: SOCIAL_QUEUE_ENABLED=1 (kapaliysa hic calismaz).
// - SOCIAL_QUEUE_DRYRUN=1: yayinlamadan sadece ne yapacagini loglar (test).
// - Yayinlama merkezi publisher'a delege edilir (FB/IG Story/Reel/Carousel dahil).
// =============================================================
import { and, eq, lte, isNotNull, asc } from 'drizzle-orm';
import { db as socialDb } from '@/social/db/client';
import { socialPosts } from '@/social/db/schema';
import { publishPost } from '@/social/modules/platforms/publisher';

const TICK_MS = 5 * 60 * 1000; // 5 dk
const BATCH = 10;

async function tick(opts: { dryRun?: boolean } = {}) {
  const dryRun = opts.dryRun ?? process.env.SOCIAL_QUEUE_DRYRUN === '1';
  try {
    const due = await socialDb
      .select()
      .from(socialPosts)
      .where(
        and(
          eq(socialPosts.status, 'scheduled'),
          isNotNull(socialPosts.scheduledAt),
          lte(socialPosts.scheduledAt, new Date()),
        ),
      )
      .orderBy(asc(socialPosts.scheduledAt))
      .limit(BATCH);

    if (!due.length) return;
    console.log(`[social-queue] ${due.length} zamanlanmis gonderi hazir${dryRun ? ' (DRYRUN)' : ''}`);

    for (const post of due) {
      if (dryRun) {
        console.log(`[social-queue] DRYRUN #${post.id} platform=${post.platform} title=${post.title || ''}`);
        continue;
      }
      await publishPost(post.id);
    }
  } catch (e) {
    console.error('[social-queue] tick hatasi:', (e as Error).message);
  }
}

/** Manuel/test icin disari acilir. */
export async function runSocialQueueOnce(dryRun = false) {
  await tick({ dryRun });
}

export function registerSocialQueueCron(_app?: unknown) {
  if (process.env.SOCIAL_QUEUE_ENABLED !== '1') {
    console.log('[social-queue] devre disi (SOCIAL_QUEUE_ENABLED != 1)');
    return;
  }
  setInterval(() => void tick(), TICK_MS);
  setTimeout(() => void tick(), 30_000); // baslangicta bekleyenler icin 30sn sonra
  const mode = process.env.SOCIAL_QUEUE_DRYRUN === '1' ? ' [DRYRUN]' : '';
  console.log(`[social-queue] aktif${mode} — her ${TICK_MS / 60000} dk zamanlanmis gonderileri yayinlar`);
}
