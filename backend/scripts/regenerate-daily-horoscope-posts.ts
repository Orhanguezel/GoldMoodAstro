// =============================================================================
// Zamanlanmış (henüz yayınlanmamış) günlük burç carousel gönderilerini yeni tasarımla
// (dönen "günün burcu" kapağı) YENİDEN ÜRETIR.
//
// Neden gerekli: planner mevcut sourceRef'i olan postu atlar. Kapak eklendikten
// sonra zaten zamanlanmış eski postlar (kapaksız) kendiliğinden güncellenmez.
// Bu araç eski gelecek-scheduled postları ARŞIVLER (status=cancelled, sourceRef'e
// '-pre-cover' ekler — SILMEZ, satırlar denetim için durur) ve planner'ı çalıştırıp
// kapaklı yeni sürümleri oluşturur.
//
// Kullanım (prod):
//   cd backend && bun run scripts/regenerate-daily-horoscope-posts.ts
//
// Yayınlanmış (posted) postlara DOKUNMAZ; yalnız gelecekteki 'scheduled' olanlar.
// =============================================================================

import { and, eq, gt, like, sql } from 'drizzle-orm';
import { db as socialDb } from '@/social/db/client';
import { socialPosts } from '@/social/db/schema';
import { ensureDailyHoroscopePlan } from '@/cron/social-horoscope';

const TENANT = 'goldmoodastro';

const archived = await socialDb
  .update(socialPosts)
  .set({
    status: 'cancelled',
    sourceRef: sql`CONCAT(${socialPosts.sourceRef}, '-pre-cover')`,
    notes: sql`CONCAT(COALESCE(${socialPosts.notes}, ''), '\n[arsiv] kapak oncesi surum; kapakli yeniden uretildi.')`,
  } as any)
  .where(
    and(
      eq(socialPosts.subType, TENANT),
      like(socialPosts.sourceRef, 'daily-horoscope-carousel-%'),
      eq(socialPosts.status, 'scheduled'),
      gt(socialPosts.scheduledAt, new Date()),
    ),
  );

const archivedCount = Number((archived as { rowsAffected?: number }).rowsAffected ?? 0);
console.log(`[regen] arsivlenen eski scheduled carousel: ${archivedCount}`);

const res = await ensureDailyHoroscopePlan(7);
console.log('[regen] planner sonucu:', JSON.stringify(res));

process.exit(0);
