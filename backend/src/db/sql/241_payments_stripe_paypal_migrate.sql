-- =============================================================
-- 241_payments_stripe_paypal_migrate.sql
-- Ödeme sağlayıcısı geçişi: Iyzico DEĞİL → Stripe (kart) + PayPal.
--
-- 1) subscriptions.provider ENUM'una 'stripe' eklenir (additive, DROP yok).
-- 2) Iyzico gateway satırı pasifleştirilir; Stripe aktif tek sağlayıcı kalır.
-- 3) Sağlayıcı adı geçen kullanıcıya görünen ui_ metinleri güncellenir —
--    yalnız hâlâ eski adı taşıyan satırlar dokunulur (elle düzenlenmiş
--    içerik ezilmesin diye WHERE ... LIKE '%yzic%' koşulu var).
-- İdempotent: tekrar çalıştırılabilir.
-- =============================================================

-- 1) provider ENUM'una stripe ekle (varsa dokunma)
SET @has_stripe := (
  SELECT COUNT(*) FROM information_schema.columns
  WHERE table_schema = DATABASE() AND table_name = 'subscriptions'
    AND column_name = 'provider' AND column_type LIKE '%stripe%'
);
SET @sql := IF(@has_stripe = 0,
  "ALTER TABLE subscriptions MODIFY COLUMN provider ENUM('stripe','iyzipay','apple_iap','google_iap','manual') NOT NULL DEFAULT 'stripe'",
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2) Iyzico artık kullanılmıyor — pasif. (Satır silinmez: geçmiş ödemelerin
--    payments.gateway_id FK'si buna bağlı.)
UPDATE payment_gateways SET is_active = 0 WHERE slug IN ('iyzico', 'iyzipay');

-- Stripe kaydı yoksa oluştur (061b ile aynı satır — sırayı beklemesin).
INSERT INTO payment_gateways (id, name, slug, is_active, is_test_mode, config)
VALUES ('061b0000-0000-4000-8000-000000000001', 'Stripe', 'stripe', 1, 0, '{}')
ON DUPLICATE KEY UPDATE is_active = 1;

-- 3) Kullanıcıya görünen sağlayıcı adları
UPDATE site_settings
SET value = '{"label":{"tr":"* Ödeme bir sonraki adımda Stripe veya PayPal ile güvenli şekilde alınacaktır.","en":"* Payment will be processed securely via Stripe or PayPal in the next step.","de":"* Die Zahlung erfolgt im nächsten Schritt sicher über Stripe oder PayPal."}}'
WHERE `key` = 'ui_consultant_note_paid' AND value LIKE '%yzic%';

UPDATE site_settings
SET value = REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(value, 'Güvenli ödeme — Iyzipay altyapısı', 'Güvenli ödeme — Stripe & PayPal altyapısı'),
        'Secure payment — Iyzipay', 'Secure payment — Stripe & PayPal'),
      'Sichere Zahlung — Iyzipay', 'Sichere Zahlung — Stripe & PayPal'),
    'iyzicoSecure', 'paymentSecure')
WHERE `key` = 'ui_mobile_i18n' AND value LIKE '%yzic%';

UPDATE site_settings
SET value = REPLACE(
      REPLACE(
        REPLACE(value,
          'Ödemeniz Iyzipay güvencesiyle 256-bit SSL şifreleme ile gerçekleştirilir.',
          'Ödemeniz Stripe ve PayPal altyapısıyla, 256-bit SSL şifreleme ile gerçekleştirilir.'),
        'Your payment is processed with 256-bit SSL encryption secured by Iyzipay.',
        'Your payment is processed with 256-bit SSL encryption via Stripe and PayPal.'),
      'Ihre Zahlung wird mit 256-Bit-SSL-Verschlüsselung, abgesichert durch Iyzipay, verarbeitet.',
      'Ihre Zahlung wird mit 256-Bit-SSL-Verschlüsselung über Stripe und PayPal verarbeitet.')
WHERE `key` = 'ui_mobile_i18n' AND value LIKE '%yzic%';

UPDATE site_settings
SET value = REPLACE(
      REPLACE(
        REPLACE(value,
          'Ödemeleriniz iyzico güvencesiyle korunmaktadır.',
          'Ödemeleriniz Stripe ve PayPal altyapısıyla korunmaktadır.'),
        'Your payments are protected by iyzico security.',
        'Your payments are protected by Stripe and PayPal.'),
      'Ihre Zahlungen sind durch die iyzico-Sicherheit geschützt.',
      'Ihre Zahlungen sind durch Stripe und PayPal geschützt.')
WHERE `key` = 'ui_mobile_i18n' AND value LIKE '%yzic%';

-- Chat botu ödeme sorusunu Stripe/PayPal anahtar kelimeleriyle de yakalasın
UPDATE chat_ai_knowledge
SET tags = REPLACE(tags, 'iyzico', 'stripe,paypal')
WHERE tags LIKE '%iyzico%';
