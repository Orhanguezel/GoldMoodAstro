// =============================================================
// FILE: src/cron/booking-auto-complete.ts
//
// Ödemesi alınmış ve seans saati geçmiş randevuları otomatik 'completed'
// yapar; bu geçiş danışman hakedişini (pending kazanç) doğurur.
//
// NEDEN: Kazanç yalnız `createPendingSessionEarning` ile oluşuyor ve o da
// yalnız admin PATCH /admin/bookings/:id {status:'completed'} yaptığında
// çağrılıyordu. Yani admin elle dokunmazsa danışman parasını HİÇ kazanmıyordu
// (2026-08-16 finans incelemesi bulgusu #1). session-auto-close LiveKit odasını
// kapatır ama booking durumuna dokunmaz — bu cron o boşluğu kapatır.
//
// Güvenlik payı: planlanan bitişin üzerinden AUTO_COMPLETE_GRACE_MINUTES geçmiş
// olmalı; erken kapanış hakedişi erken doğurmasın diye.
// İdempotens: koşullu UPDATE (status='confirmed') + wallet_transactions'taki
// UNIQUE(booking_id, purpose) — aynı randevu iki kez hakediş üretemez.
import { sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { createPendingSessionEarning } from '@goldmood/shared-backend/modules/bookings/admin.controller';

const HOUR_MS = 60 * 60 * 1000;
const GRACE_MINUTES = 30;

type DueBooking = { id: string };

export async function runBookingAutoComplete(): Promise<{ completed: number; earnings: number }> {
  const rowsResult = await db.execute(sql`
    SELECT b.id
    FROM bookings b
    WHERE b.status = 'confirmed'
      AND b.appointment_time IS NOT NULL
      AND (
        STR_TO_DATE(CONCAT(b.appointment_date, ' ', COALESCE(b.appointment_time, '00:00')), '%Y-%m-%d %H:%i')
        + INTERVAL b.session_duration MINUTE
        + INTERVAL ${GRACE_MINUTES} MINUTE
      ) < NOW()
    LIMIT 200
  `);
  const rows = ((rowsResult as any)?.[0] ?? rowsResult ?? []) as DueBooking[];
  if (!Array.isArray(rows) || rows.length === 0) return { completed: 0, earnings: 0 };

  let completed = 0;
  let earnings = 0;
  for (const row of rows) {
    try {
      // Koşullu geçiş: paralel admin aksiyonuyla yarışmayı önler.
      const upd = await db.execute(sql`
        UPDATE bookings
        SET status = 'completed', updated_at = NOW(3)
        WHERE id = ${row.id} AND status = 'confirmed'
      `);
      const affected = Number((upd as any)?.[0]?.affectedRows ?? (upd as any)?.affectedRows ?? 0);
      if (affected < 1) continue;
      completed += 1;

      try {
        await createPendingSessionEarning(row.id);
        earnings += 1;
      } catch (err) {
        // Hakediş hatası randevunun tamamlanmasını geri almaz; log'a düşer ve
        // payment-reconciliation drift denetiminde yakalanır.
        console.error('[booking-auto-complete] earning failed', row.id, (err as Error)?.message);
      }
    } catch (err) {
      console.error('[booking-auto-complete] update failed', row.id, (err as Error)?.message);
    }
  }

  if (completed > 0) {
    console.log(`[booking-auto-complete] ${completed} randevu tamamlandı, ${earnings} hakediş oluştu`);
  }
  return { completed, earnings };
}

export function registerBookingAutoCompleteCron() {
  void runBookingAutoComplete().catch((e) => console.error('[booking-auto-complete] ilk çalıştırma hatası', e));
  setInterval(() => {
    void runBookingAutoComplete().catch((e) => console.error('[booking-auto-complete] hata', e));
  }, HOUR_MS);
}
