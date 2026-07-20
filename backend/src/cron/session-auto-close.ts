// M1-b — Süresi dolan canlı seansları otomatik sonlandır.
//
// Müşteri talebi (site düzeltme notları): "Satın alınan saat 90 dk ise örneğin
// 16:00-17:30 arasında ise seans[ı] sistem otomatik kapatabilsin."
//
// Planlanan bitiş = appointment_date + appointment_time + session_duration.
// Bitişin üzerinden `autoCloseGraceMinutes` geçmiş ve hâlâ 'active' olan seanslar:
//   1) LiveKit odası sunucu tarafında silinir → içerideki herkes anında düşer
//   2) live_sessions: status='ended', ended_at=NOW(), duration_seconds hesaplanır
//
// Neden cron: LiveKit'in kendi oda TTL'i katılımcı ayrıldığında devreye girer;
// "satın alınan süre doldu" kuralını uygulamaz. Süre aşımını biz kesmeliyiz.

import { sql } from 'drizzle-orm';
import { appConfig } from '@goldmood/shared-config/appConfig';
import { db } from '@/db/client';
import { env } from '@/core/env';
import { closeLiveKitRoom } from '@/modules/livekit/service';

const GRACE_MINUTES = appConfig.livekit.autoCloseGraceMinutes;

type ExpiredSession = {
  id: string;
  room_name: string;
  started_at: Date | string | null;
  planned_end: Date | string;
};

function toDate(value: Date | string | null): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : new Date(String(value).replace(' ', 'T'));
}

async function run() {
  if (!env.LIVEKIT_URL || !env.LIVEKIT_API_KEY || !env.LIVEKIT_API_SECRET) return;

  try {
    // Planlanan bitişi geçmiş, hâlâ aktif seanslar.
    // appointment_date VARCHAR(10) + appointment_time VARCHAR(5) olduğu için
    // CONCAT ile timestamp'e çeviriyoruz.
    const rowsResult = await db.execute(sql`
      SELECT
        ls.id,
        ls.room_name,
        ls.started_at,
        (
          STR_TO_DATE(CONCAT(b.appointment_date, ' ', COALESCE(b.appointment_time, '00:00')), '%Y-%m-%d %H:%i')
          + INTERVAL b.session_duration MINUTE
        ) AS planned_end
      FROM live_sessions ls
      JOIN bookings b ON b.id = ls.booking_id
      WHERE ls.status = 'active'
        AND b.appointment_time IS NOT NULL
        AND (
          STR_TO_DATE(CONCAT(b.appointment_date, ' ', COALESCE(b.appointment_time, '00:00')), '%Y-%m-%d %H:%i')
          + INTERVAL b.session_duration MINUTE
          + INTERVAL ${GRACE_MINUTES} MINUTE
        ) < NOW()
      LIMIT 200
    `);

    const arr = Array.isArray((rowsResult as any)?.[0]) ? (rowsResult as any)[0] : (rowsResult as any);
    const expired: ExpiredSession[] = (arr as ExpiredSession[]) ?? [];
    if (expired.length === 0) return;

    for (const session of expired) {
      try {
        const outcome = await closeLiveKitRoom(session.room_name);

        // Süre: gerçekten başlamışsa started_at'ten, yoksa planlanan süreden.
        const startedAt = toDate(session.started_at);
        const plannedEnd = toDate(session.planned_end);
        const durationSeconds =
          startedAt && plannedEnd
            ? Math.max(0, Math.round((plannedEnd.getTime() - startedAt.getTime()) / 1000))
            : null;

        await db.execute(sql`
          UPDATE live_sessions
          SET status = 'ended',
              ended_at = NOW(),
              duration_seconds = COALESCE(duration_seconds, ${durationSeconds})
          WHERE id = ${session.id}
            AND status = 'active'
        `);

        console.log(
          `[session-auto-close] ${session.room_name} sonlandırıldı (oda: ${outcome}, süre: ${durationSeconds ?? '?'}sn)`,
        );
      } catch (err) {
        // Tek bir oda kapatılamazsa diğerleri etkilenmesin; sonraki turda yeniden denenir.
        console.error(`[session-auto-close] ${session.room_name} kapatılamadı:`, err);
      }
    }
  } catch (err) {
    console.error('[session-auto-close] hata:', err);
  }
}

export function registerSessionAutoCloseCron() {
  setTimeout(run, appConfig.livekit.autoCloseFirstRunDelayMs);
  setInterval(run, appConfig.livekit.autoCloseIntervalMs);
  console.log(
    `[cron] session-auto-close registered (every ${appConfig.livekit.autoCloseIntervalMs / 1000}s, grace ${GRACE_MINUTES}m)`,
  );
}
