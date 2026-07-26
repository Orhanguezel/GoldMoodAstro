// backend/src/cron/social-queue.ts
// =============================================================
// Zamanlanmis sosyal medya gonderilerini otomatik yayinlar.
// social_posts.status='scheduled' ve scheduled_at <= now olanlari FB/IG'ye gonderir.
// TEK KAYNAK goldmood (ekosistem'de goldmood cron'lari kapatildi — bkz. social_cron_single_source).
//
// - Her 5 dk kontrol (setInterval; mevcut cron deseniyle ayni, node-cron yok).
// - Env kapisi: SOCIAL_QUEUE_ENABLED=1 (kapaliysa hic calismaz).
// - SOCIAL_QUEUE_DRYRUN=1: yayinlamadan sadece ne yapacagini loglar (test).
// - Yalniz FB/IG otomatik yayinlanir; diger platformlar 'failed' + not.
// =============================================================
import { and, eq, lte, isNotNull, asc } from 'drizzle-orm';
import { db as socialDb } from '@/social/db/client';
import { platformAccounts, socialPosts } from '@/social/db/schema';
import { publishPhotoPost as fbPublishPhoto } from '@/social/modules/platforms/facebook';
import { publishPhotoPost as igPublishPhoto } from '@/social/modules/platforms/instagram';

const TENANT = 'goldmoodastro';
const PUBLIC_BASE = (process.env.SOCIAL_PUBLIC_BASE || 'https://goldmoodastro.com').replace(/\/$/, '');
const TICK_MS = 5 * 60 * 1000; // 5 dk
const BATCH = 10;

async function getAccounts() {
  const rows = await socialDb.select().from(platformAccounts).where(eq(platformAccounts.tenantKey, TENANT));
  return {
    fb: rows.find((r) => r.platform === 'facebook') || null,
    ig: rows.find((r) => r.platform === 'instagram') || null,
  };
}

function absUrl(u?: string | null): string | null {
  const s = String(u || '').trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s)) return s;
  return `${PUBLIC_BASE}${s.startsWith('/') ? '' : '/'}${s}`;
}

async function publishOne(post: any, accounts: { fb: any; ig: any }, dryRun: boolean): Promise<void> {
  const platform = String(post.platform || 'both');
  const wantFb = platform === 'facebook' || platform === 'both' || platform === 'all';
  const wantIg = platform === 'instagram' || platform === 'both' || platform === 'all';
  const image =
    absUrl(post.imageUrl) || absUrl(Array.isArray(post.mediaUrls) ? post.mediaUrls[0] : null);
  const caption = [post.caption, post.hashtags].filter(Boolean).join('\n\n').trim();

  if (!wantFb && !wantIg) {
    await socialDb
      .update(socialPosts)
      .set({ status: 'failed', errorMessage: `desteklenmeyen platform: ${platform} (yalniz FB/IG otomatik)` })
      .where(eq(socialPosts.id, post.id));
    console.log(`[social-queue] #${post.id} atlandi — platform ${platform} otomatik desteklenmiyor`);
    return;
  }

  if (dryRun) {
    console.log(
      `[social-queue] DRYRUN #${post.id} platform=${platform} fb=${!!accounts.fb} ig=${!!accounts.ig} image=${image || 'YOK'}\n  caption: ${caption.slice(0, 120)}...`,
    );
    return; // dryrun'da status degismez
  }

  let fbId: string | null = post.fbPostId || null;
  let igId: string | null = post.igMediaId || null;
  const errors: string[] = [];

  if (wantFb && accounts.fb && !fbId) {
    try {
      if (!image) throw new Error('gorsel yok (FB foto gonderisi icin zorunlu)');
      const r = await fbPublishPhoto(image, caption, {
        pageId: accounts.fb.pageId || undefined,
        pageAccessToken: accounts.fb.pageToken || accounts.fb.accessToken || undefined,
      });
      fbId = (r as any)?.id || (r as any)?.postId || null;
    } catch (e) {
      errors.push('FB: ' + (e as Error).message);
    }
  }
  if (wantIg && accounts.ig && !igId) {
    try {
      if (!image) throw new Error('IG icin gorsel zorunlu');
      const r = await igPublishPhoto(image, caption, {
        accountId: accounts.ig.accountId || undefined,
        accessToken: accounts.ig.accessToken || accounts.ig.pageToken || undefined,
      });
      igId = (r as any)?.id || (r as any)?.mediaId || null;
    } catch (e) {
      errors.push('IG: ' + (e as Error).message);
    }
  }

  const posted = Boolean(fbId || igId);
  await socialDb
    .update(socialPosts)
    .set({
      status: posted ? 'posted' : 'failed',
      postedAt: posted ? new Date() : null,
      fbPostId: fbId,
      igMediaId: igId,
      errorMessage: errors.length ? errors.join(' | ').slice(0, 990) : null,
    })
    .where(eq(socialPosts.id, post.id));

  console.log(`[social-queue] #${post.id} ${platform} -> FB:${fbId ? 'OK' : 'x'} IG:${igId ? 'OK' : 'x'} ${errors.join('; ')}`);
}

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
    const accounts = await getAccounts();

    for (const post of due) {
      if (!dryRun) {
        // optimistic lock: baska bir tick ayni gonderiyi almasin
        const locked = await socialDb
          .update(socialPosts)
          .set({ status: 'publishing' })
          .where(and(eq(socialPosts.id, post.id), eq(socialPosts.status, 'scheduled')));
        const affected = (locked as any)?.[0]?.affectedRows ?? (locked as any)?.rowsAffected ?? 1;
        if (affected === 0) continue; // baskasi aldi
      }
      await publishOne(post, accounts, dryRun);
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
