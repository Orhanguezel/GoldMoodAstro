-- Payment gateway placeholder — slug 'iyzico' (initIyzico controller'ı arıyor).
-- API anahtarları VPS .env üzerinden gelir (IYZICO_API_KEY, IYZICO_SECRET_KEY).
-- Admin panelinden DB config'e de yazılabilir; controller önce DB'ye sonra env'e bakar.
INSERT INTO payment_gateways (id, name, slug, is_active, is_test_mode, config)
VALUES (
  '50000000-0000-4000-8000-000000000001',
  'Iyzico',
  'iyzico',
  1,
  1,
  '{}'
)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  slug = VALUES(slug),
  is_active = VALUES(is_active);

INSERT INTO orders (id, user_id, booking_id, order_number, status, total_amount, currency, payment_gateway_id, payment_status)
VALUES ('51000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000010','40000000-0000-4000-8000-000000000001','ORD-20260427-0001','completed',850.00,'TRY','50000000-0000-4000-8000-000000000001','paid')
ON DUPLICATE KEY UPDATE status = VALUES(status), payment_status = VALUES(payment_status);

INSERT INTO payments (id, order_id, gateway_id, transaction_id, amount, currency, status, raw_response)
VALUES ('52000000-0000-4000-8000-000000000001','51000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','sandbox-test-payment',850.00,'TRY','success','{"seed":true}')
ON DUPLICATE KEY UPDATE status = VALUES(status);
