-- =============================================================
-- 010d_commission_rate_update_40.sql
-- Prod additive: platform commission announcement and payout cycle.
-- Idempotent; existing platform_commission_rate row is updated in place.
-- 2026-07-19: oran %30 -> %40. Bu dosya 010b'den SONRA calisir ve degeri
-- JSON_SET ile zorla yazar; oran degisikliginde 010b ile BIRLIKTE guncellenmeli,
-- aksi halde 010b'deki degisiklik her seed'de sessizce geri alinir.
-- =============================================================

INSERT INTO site_settings (id, `key`, locale, value)
VALUES
  (
    '01000000-0000-4000-8000-0000000000c1',
    'platform_commission_rate',
    '*',
    '{"percent":40,"previous_percent":30,"currency":"TRY","updated_at":"2026-07-19","effective_from":"2026-07-19","minimum_notice_days":30}'
  )
ON DUPLICATE KEY UPDATE
  value = JSON_SET(
    COALESCE(NULLIF(value, ''), '{}'),
    '$.percent', 40,
    '$.previous_percent', 30,
    '$.currency', 'TRY',
    '$.updated_at', '2026-07-19',
    '$.effective_from', '2026-07-19',
    '$.minimum_notice_days', 30
  );

INSERT INTO site_settings (id, `key`, locale, value)
VALUES
  (
    '01000000-0000-4000-8000-0000000000c6',
    'payout_cycle',
    '*',
    '{"mode":"monthly","interval_days":30,"min_threshold":100,"auto_request":false,"request_day":1,"description":"Ayda bir tahsilat talebi"}'
  )
ON DUPLICATE KEY UPDATE
  value = JSON_SET(
    COALESCE(NULLIF(value, ''), '{}'),
    '$.mode', 'monthly',
    '$.interval_days', 30,
    '$.min_threshold', 100,
    '$.auto_request', false,
    '$.request_day', 1,
    '$.description', 'Ayda bir tahsilat talebi'
  );
