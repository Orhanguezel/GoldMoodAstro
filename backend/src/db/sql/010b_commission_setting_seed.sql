-- =============================================================
-- 010b_commission_setting_seed.sql
-- Platform komisyon oranı + hakediş hold süresi konfigleri.
-- Admin paneliden düzenlenir. Public endpoint GET /settings/commission
-- danışmana ve danışana gösterir (şeffaflık).
-- YAPILACAKLAR E1, D1 (2026-05-20).
-- =============================================================

INSERT INTO site_settings (id, `key`, locale, value) VALUES
  -- 2026-07-19: %30 → %40. Platformda henüz hakedişi olan gerçek danışman bulunmadığı için
  -- (tüm kayıtlar demo/test hesabı, onaylı KYC yok) 30 günlük bildirim süresi işletilmedi;
  -- oran aynı gün yürürlüğe alındı. İlk gerçek danışman onaylandıktan sonra yapılacak her
  -- oran değişikliği minimum_notice_days kuralına tabidir.
  ('01000000-0000-4000-8000-0000000000c1', 'platform_commission_rate', '*', '{"percent":40,"previous_percent":30,"currency":"TRY","effective_from":"2026-07-19","minimum_notice_days":30,"updated_at":"2026-07-19"}'),
  ('01000000-0000-4000-8000-0000000000c2', 'wallet_hold_days',         '*', '7'),
  ('01000000-0000-4000-8000-0000000000c3', 'withdrawal_min_amount',    '*', '100.00'),
  ('01000000-0000-4000-8000-0000000000c4', 'withdrawal_max_amount',    '*', '50000.00'),
  ('01000000-0000-4000-8000-0000000000c5', 'withdrawal_currency',      '*', 'TRY'),
  ('01000000-0000-4000-8000-0000000000c6', 'payout_cycle',             '*', '{"mode":"monthly","interval_days":30,"min_threshold":100,"auto_request":false,"request_day":1,"description":"Ayda bir tahsilat talebi"}')
ON DUPLICATE KEY UPDATE value = VALUES(value);
