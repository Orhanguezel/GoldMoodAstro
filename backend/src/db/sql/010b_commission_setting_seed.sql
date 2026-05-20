-- =============================================================
-- 010b_commission_setting_seed.sql
-- Platform komisyon oranı + hakediş hold süresi konfigleri.
-- Admin paneliden düzenlenir. Public endpoint GET /settings/commission
-- danışmana ve müşteriye gösterir (şeffaflık).
-- YAPILACAKLAR E1, D1 (2026-05-20).
-- =============================================================

INSERT INTO site_settings (id, `key`, locale, value) VALUES
  ('01000000-0000-4000-8000-0000000000c1', 'platform_commission_rate', '*', '{"percent":15,"currency":"TRY","updated_at":"2026-05-20"}'),
  ('01000000-0000-4000-8000-0000000000c2', 'wallet_hold_days',         '*', '7'),
  ('01000000-0000-4000-8000-0000000000c3', 'withdrawal_min_amount',    '*', '100.00'),
  ('01000000-0000-4000-8000-0000000000c4', 'withdrawal_max_amount',    '*', '50000.00'),
  ('01000000-0000-4000-8000-0000000000c5', 'withdrawal_currency',      '*', 'TRY')
ON DUPLICATE KEY UPDATE value = VALUES(value);
