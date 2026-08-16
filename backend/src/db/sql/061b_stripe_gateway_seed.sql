-- =============================================================
-- 061b_stripe_gateway_seed.sql
-- Stripe ödeme sağlayıcısı kaydı (2026-08-16 — aktif sağlayıcı).
-- payments.gateway_id bu kayda bağlanır; provider ayrımı slug üzerinden.
-- Config kasıtlı boş: anahtarlar DB'de DEĞİL, yalnız env'de tutulur
-- (STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET — fail-closed).
-- =============================================================
INSERT INTO payment_gateways (id, name, slug, is_active, is_test_mode, config)
VALUES ('061b0000-0000-4000-8000-000000000001', 'Stripe', 'stripe', 1, 0, '{}')
ON DUPLICATE KEY UPDATE name = VALUES(name), is_active = VALUES(is_active);
