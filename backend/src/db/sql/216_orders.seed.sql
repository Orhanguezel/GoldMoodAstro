-- ============================================================
-- 216_orders.seed.sql
-- Payment gateways seed + booking_payment_enabled setting
-- ============================================================

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Default payment gateway: Iyzico (test mode)
INSERT IGNORE INTO `payment_gateways` (`id`, `name`, `slug`, `is_active`, `is_test_mode`, `config`)
VALUES
  ('pg-iyzico-001', 'Iyzico', 'iyzico', 0, 1, '{}');

-- Booking payment: disabled by default
INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`)
VALUES
  (UUID(), 'booking_payment_enabled', '*', '"false"'),
  (UUID(), 'booking_payment_gateway', '*', '"iyzico"')
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);
