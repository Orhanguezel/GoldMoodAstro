// =============================================================================
// Ağustos 2026 1. hafta EK içeriklerini (august-2026-extra:*) plana göre zamanlar.
//
// Plan (reports/GoldMoodAstro-Agustos-2026-Icerik-Plani.md): her gün 1 ek ana içerik
// + storyler. sourceRef'teki gün numarası (extra:0X:) → 2026-08-0X tarihine eşlenir.
//   - ana içerik (carousel/post): 13:00 TR (10:00 UTC)
//   - story: 19:00 TR (16:00 UTC)
// Videosuz [REEL] taslakları ATLANIR (yayınlanamaz; MP4 gerekir) ve raporlanır.
// Yalnız 'draft' + gelecekteki günler zamanlanır. Yayınlanmışlara dokunmaz.
//
// Kullanım (prod): cd backend && bun run scripts/schedule-august-week1-extra.ts
// =============================================================================

import { and, eq, like } from 'drizzle-orm';
import { db as socialDb } from '@/social/db/client';
import { socialPosts } from '@/social/db/schema';

const TENANT = 'goldmoodastro';

function isoUtc(day: number, hourUtc: number, minute = 0): Date {
  return new Date(Date.UTC(2026, 7, day, hourUtc, minute, 0)); // month 7 = Ağustos
}

const drafts = await socialDb
  .select()
  .from(socialPosts)
  .where(and(eq(socialPosts.subType, TENANT), like(socialPosts.sourceRef, 'august-2026-extra:%')));

const now = Date.now();
let scheduled = 0;
const skipped: string[] = [];

for (const p of drafts as any[]) {
  if (p.status !== 'draft') { skipped.push(`#${p.id} (${p.status}, zaten islenmis)`); continue; }
  const ref: string = p.sourceRef || '';
  const m = ref.match(/august-2026-extra:(\d{2}):/);
  if (!m) { skipped.push(`#${p.id} (gun cozulemedi: ${ref})`); continue; }
  const day = Number(m[1]);

  const isStory = /:story:/.test(ref);
  const isReel = String(p.title || '').toUpperCase().includes('[REEL]');
  const urls: string[] = [p.imageUrl, ...(Array.isArray(p.mediaUrls) ? p.mediaUrls : [])].filter(Boolean).map(String);
  const hasVideo = urls.some((u) => /\.(mp4|mov|m4v|webm)(\?|$)/i.test(u));

  if (isReel && !hasVideo) { skipped.push(`#${p.id} REEL videosuz -> MP4 gerekli (${ref})`); continue; }

  const when = isStory ? isoUtc(day, 16, 0) : isoUtc(day, 10, 0);
  if (when.getTime() <= now) { skipped.push(`#${p.id} gecmis gun (${day} Agu)`); continue; }

  await socialDb.update(socialPosts).set({ status: 'scheduled', scheduledAt: when } as any).where(eq(socialPosts.id, p.id));
  scheduled += 1;
  console.log(`[schedule] #${p.id} -> 2026-08-${String(day).padStart(2, '0')} ${isStory ? '19:00 TR (story)' : '13:00 TR'}  ${ref}`);
}

console.log(`\n[schedule] zamanlanan=${scheduled}`);
if (skipped.length) console.log(`[schedule] atlanan (${skipped.length}):\n  - ${skipped.join('\n  - ')}`);
process.exit(0);
