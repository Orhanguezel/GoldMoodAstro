-- Store payment rows are required for atomic, unique credit receipt redemption.
-- The gateway records contain no store credentials; those remain in env.
INSERT INTO payment_gateways (id, name, slug, is_active, is_test_mode, config)
VALUES
  ('061c0000-0000-4000-8000-000000000001', 'Apple In-App Purchase', 'apple_iap', 1, 0, '{}'),
  ('061c0000-0000-4000-8000-000000000002', 'Google Play Billing', 'google_iap', 1, 0, '{}')
ON DUPLICATE KEY UPDATE name = VALUES(name), is_active = VALUES(is_active);
