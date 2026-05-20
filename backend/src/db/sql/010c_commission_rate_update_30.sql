-- =============================================================
-- 010c_commission_rate_update_30.sql
-- Prod additive: platform commission announcement and payout cycle.
-- Idempotent; existing platform_commission_rate row is updated in place.
-- =============================================================

INSERT INTO site_settings (id, `key`, locale, value)
VALUES
  (
    '01000000-0000-4000-8000-0000000000c1',
    'platform_commission_rate',
    '*',
    '{"percent":30,"previous_percent":15,"currency":"TRY","updated_at":"2026-05-20","effective_from":"2026-06-20","minimum_notice_days":30}'
  )
ON DUPLICATE KEY UPDATE
  value = JSON_SET(
    COALESCE(NULLIF(value, ''), '{}'),
    '$.percent', 30,
    '$.previous_percent', IFNULL(JSON_EXTRACT(COALESCE(NULLIF(value, ''), '{}'), '$.previous_percent'), 15),
    '$.currency', 'TRY',
    '$.updated_at', '2026-05-20',
    '$.effective_from', '2026-06-20',
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
