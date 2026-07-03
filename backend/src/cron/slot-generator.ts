// =============================================================
// FILE: src/cron/slot-generator.ts
// Randevu slot üretici — 041 seed'indeki "prod'da cron üretmeli" notunun cron'u.
//
// Sorun: getConsultantSlots yalnız resource_slots okur; seed sadece seed'li
// danışmanlara slot üretiyordu. Gerçek başvurudan onaylanan danışmanlarda
// (resource/working_hours/slot eksik) takvim hep "müsait slot yok" kalıyordu.
//
// Bu job idempotenttir (INSERT IGNORE + ux_resource_slots_unique):
//  1) Onaylı ama resource'suz danışmana resource açar
//  2) Working hours'u hiç olmayan consultant resource'una default mesai yazar
//     (Pzt-Paz 09:00-21:00, 30dk) — danışman panelden değiştirebilir
//  3) Working hours'a göre önümüzdeki HORIZON günün slotlarını üretir
//     (dow konvansiyonu availability/repository ile birebir: 1=Pzt..7=Paz)
// =============================================================
import { db } from '@goldmood/shared-backend/db/client';
import { sql } from 'drizzle-orm';

const HORIZON_DAYS = 30;

export async function runSlotGeneratorJob() {
  // 1) Onaylı danışman + resource yoksa oluştur
  await db.execute(sql`
    INSERT INTO resources (id, type, title, capacity, external_ref_id, is_active)
    SELECT UUID(), 'consultant', CONCAT('Consultant ', LEFT(c.id, 8)), 1, c.id, 1
    FROM consultants c
    WHERE c.approval_status = 'approved'
      AND NOT EXISTS (
        SELECT 1 FROM resources r WHERE r.external_ref_id = c.id AND r.type = 'consultant'
      )
  `);

  // 2) Hiç working hours satırı olmayan consultant resource'una default mesai
  await db.execute(sql`
    INSERT IGNORE INTO resource_working_hours
      (id, resource_id, dow, start_time, end_time, slot_minutes, capacity)
    SELECT UUID(), r.id, d.dow, '09:00:00', '21:00:00', 30, 1
    FROM resources r
    JOIN consultants c ON c.id = r.external_ref_id AND c.approval_status = 'approved'
    CROSS JOIN (
                SELECT 1 AS dow UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
      UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7
    ) d
    WHERE r.type = 'consultant' AND r.is_active = 1
      AND NOT EXISTS (SELECT 1 FROM resource_working_hours wh WHERE wh.resource_id = r.id)
  `);

  // 3) Working hours → önümüzdeki HORIZON_DAYS günün slotları (5dk çözünürlüklü seri)
  await db.execute(sql`
    INSERT IGNORE INTO resource_slots (id, resource_id, slot_date, slot_time, capacity, is_active)
    WITH RECURSIVE days AS (
      SELECT 0 AS n UNION ALL SELECT n + 1 FROM days WHERE n < ${HORIZON_DAYS - 1}
    ),
    mins AS (
      SELECT 0 AS m UNION ALL SELECT m + 5 FROM mins WHERE m < 1435
    )
    SELECT UUID(), wh.resource_id,
           DATE_ADD(CURDATE(), INTERVAL d.n DAY) AS slot_date,
           SEC_TO_TIME(m.m * 60) AS slot_time,
           wh.capacity, 1
    FROM resource_working_hours wh
    JOIN resources r ON r.id = wh.resource_id AND r.is_active = 1 AND r.type = 'consultant'
    JOIN consultants c ON c.id = r.external_ref_id AND c.approval_status = 'approved'
    JOIN days d
      ON wh.dow = (((DAYOFWEEK(DATE_ADD(CURDATE(), INTERVAL d.n DAY)) + 5) % 7) + 1)
    JOIN mins m
      ON m.m * 60 >= TIME_TO_SEC(wh.start_time)
     AND (m.m * 60 + wh.slot_minutes * 60) <= TIME_TO_SEC(wh.end_time)
     AND ((m.m * 60 - TIME_TO_SEC(wh.start_time)) % (wh.slot_minutes * 60)) = 0
  `);
}

export function registerSlotGeneratorCron() {
  const run = () =>
    runSlotGeneratorJob().catch((e) => console.error('[cron] slot-generator failed:', e));
  // Boot'ta hemen bir kez (yeni onaylanan danışman deploy sonrası beklemesin), sonra günlük.
  run();
  setInterval(run, 24 * 60 * 60 * 1000);
  console.log('[cron] slot-generator registered (daily + boot)');
}
