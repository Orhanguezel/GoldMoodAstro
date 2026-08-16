-- Iyzico ARTIK KULLANILMIYOR (2026-08-16 — aktif sağlayıcı Stripe + PayPal, 061b).
-- Satır silinmiyor: geçmiş payments.gateway_id FK'si buna bağlı; yalnız is_active = 0.
INSERT INTO payment_gateways (id, name, slug, is_active, is_test_mode, config)
VALUES (
  '50000000-0000-4000-8000-000000000001',
  'Iyzico (pasif)',
  'iyzico',
  0,
  1,
  '{}'
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  slug = VALUES(slug),
  is_active = VALUES(is_active);

INSERT INTO orders (id, user_id, booking_id, order_number, status, total_amount, currency, payment_gateway_id, payment_status)
VALUES ('51000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000010','40000000-0000-4000-8000-000000000001','ORD-20260427-0001','completed',850.00,'EUR','50000000-0000-4000-8000-000000000001','paid')
ON DUPLICATE KEY UPDATE status = VALUES(status), payment_status = VALUES(payment_status);

INSERT INTO payments (id, order_id, gateway_id, transaction_id, amount, currency, status, raw_response)
VALUES ('52000000-0000-4000-8000-000000000001','51000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','sandbox-test-payment',850.00,'EUR','success','{"seed":true}')
ON DUPLICATE KEY UPDATE status = VALUES(status);
