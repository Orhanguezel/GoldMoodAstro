-- =============================================================
-- 242_currency_try_to_eur_migrate.sql
-- TL KALDIRILDI: defter para birimi EUR, ödeme sayfasında USD de sunulur.
--
-- Sebep (kullanıcı talimatı, 2026-08-16): PayPal Stripe üzerinden TRY'de
-- sunulamıyor. Satıcı Alman kimliğiyle (Orhan Güzel Einzelunternehmen) EUR
-- tahsil ediyor; defterin tek para biriminde olması hakediş/komisyon/ödeme
-- mutabakatının kur farkıyla kaymasını önler.
--
-- KUR: 1 EUR = 55.415 TRY (16.08.2026, open.er-api.com). Fiyatlar bu kurla
-- çevrilip EN YAKIN 0,50 EUR'ya yuvarlandı; bakiyeler kuruşuna kadar çevrildi
-- (borç yuvarlanmaz).
--
-- GERİ ALINABİLİR: dönüşümden önce tüm eski değerler currency_migration_backup
-- tablosuna yazılır. Geri almak için o tablodan UPDATE yeterlidir.
--
-- DOKUNULMAYANLAR (kasıtlı):
--   * orders / payments geçmişi — gerçekte TL tahsil edildi, tarihsel kayıt
--     olduğu gibi kalır. Yeni siparişler zaten EUR açılır.
--   * user_credits ('TRY-CREDIT') — para değil, kredi birimi.
-- İdempotent: yedek tablosu doluysa dönüşüm ikinci kez çalışmaz.
-- =============================================================

CREATE TABLE IF NOT EXISTS currency_migration_backup (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  table_name VARCHAR(64) NOT NULL,
  row_id VARCHAR(64) NOT NULL,
  column_name VARCHAR(64) NOT NULL,
  old_value VARCHAR(64) NULL,
  old_currency VARCHAR(16) NULL,
  migrated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY cmb_table_idx (table_name, row_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Daha önce çalıştıysa hiçbir şey yapma (çift bölme = fiyatların 55'te biri).
SET @already := (SELECT COUNT(*) FROM currency_migration_backup);

-- ── 1) Yedek ──
INSERT INTO currency_migration_backup (table_name, row_id, column_name, old_value, old_currency)
SELECT 'consultants', id, 'session_price', session_price, currency FROM consultants WHERE @already = 0;
INSERT INTO currency_migration_backup (table_name, row_id, column_name, old_value, old_currency)
SELECT 'consultants', id, 'video_session_price', video_session_price, currency FROM consultants WHERE @already = 0;
INSERT INTO currency_migration_backup (table_name, row_id, column_name, old_value, old_currency)
SELECT 'consultant_services', id, 'price', price, currency FROM consultant_services WHERE @already = 0;
INSERT INTO currency_migration_backup (table_name, row_id, column_name, old_value, old_currency)
SELECT 'credit_packages', id, 'price_minor', price_minor, currency FROM credit_packages WHERE @already = 0;
INSERT INTO currency_migration_backup (table_name, row_id, column_name, old_value, old_currency)
SELECT 'subscription_plans', id, 'price_minor', price_minor, currency FROM subscription_plans WHERE @already = 0;
INSERT INTO currency_migration_backup (table_name, row_id, column_name, old_value, old_currency)
SELECT 'wallets', id, 'balance', balance, currency FROM wallets WHERE @already = 0;
INSERT INTO currency_migration_backup (table_name, row_id, column_name, old_value, old_currency)
SELECT 'wallets', id, 'pending_balance', pending_balance, currency FROM wallets WHERE @already = 0;
INSERT INTO currency_migration_backup (table_name, row_id, column_name, old_value, old_currency)
SELECT 'wallet_transactions', id, 'amount', amount, currency FROM wallet_transactions WHERE @already = 0;
INSERT INTO currency_migration_backup (table_name, row_id, column_name, old_value, old_currency)
SELECT 'consultant_media_settings', consultant_id, 'audio_price', audio_price, 'TRY'
FROM consultant_media_settings WHERE @already = 0;
INSERT INTO currency_migration_backup (table_name, row_id, column_name, old_value, old_currency)
SELECT 'consultant_media_settings', consultant_id, 'video_price', video_price, 'TRY'
FROM consultant_media_settings WHERE @already = 0;

-- ── 2) Fiyatlar: /55.415 → en yakın 0,50 EUR (0 ise 0 kalır) ──
UPDATE consultants SET
  session_price = IF(session_price > 0, GREATEST(0.50, ROUND(session_price / 55.415 * 2) / 2), session_price),
  video_session_price = IF(video_session_price > 0, GREATEST(0.50, ROUND(video_session_price / 55.415 * 2) / 2), video_session_price),
  currency = 'EUR'
WHERE @already = 0;

UPDATE consultant_services SET
  price = IF(price > 0, GREATEST(0.50, ROUND(price / 55.415 * 2) / 2), price),
  currency = 'EUR'
WHERE @already = 0;

UPDATE consultant_media_settings SET
  audio_price = IF(audio_price > 0, GREATEST(0.50, ROUND(audio_price / 55.415 * 2) / 2), audio_price),
  video_price = IF(video_price > 0, GREATEST(0.50, ROUND(video_price / 55.415 * 2) / 2), video_price)
WHERE @already = 0;

-- price_minor kuruş cinsinden: 0,50 EUR = 50 cent adımı
UPDATE credit_packages SET
  price_minor = GREATEST(50, ROUND(price_minor / 55.415 / 50) * 50),
  currency = 'EUR'
WHERE @already = 0 AND price_minor > 0;

UPDATE subscription_plans SET
  price_minor = GREATEST(50, ROUND(price_minor / 55.415 / 50) * 50),
  currency = 'EUR'
WHERE @already = 0 AND price_minor > 0;

-- ── 3) Bakiye ve defter: kuruşuna kadar (yuvarlama yok) ──
UPDATE wallets SET
  balance = ROUND(balance / 55.415, 2),
  pending_balance = ROUND(pending_balance / 55.415, 2),
  currency = 'EUR'
WHERE @already = 0;

UPDATE wallet_transactions SET
  amount = ROUND(amount / 55.415, 2),
  currency = 'EUR'
WHERE @already = 0;

-- Ödenmemiş randevu fiyatları (gelecekteki seanslar) da EUR'ya çekilir; ödenmiş
-- olanlar tarihsel kayıt olarak dokunulmadan kalır.
INSERT INTO currency_migration_backup (table_name, row_id, column_name, old_value, old_currency)
SELECT 'bookings', b.id, 'session_price', b.session_price, 'TRY'
FROM bookings b
LEFT JOIN orders o ON o.booking_id = b.id AND o.payment_status = 'paid'
WHERE @already = 0 AND o.id IS NULL;

UPDATE bookings b
LEFT JOIN orders o ON o.booking_id = b.id AND o.payment_status = 'paid'
SET b.session_price = IF(b.session_price > 0, GREATEST(0.50, ROUND(b.session_price / 55.415 * 2) / 2), b.session_price)
WHERE @already = 0 AND o.id IS NULL;

-- ── 4) Kolon varsayılanları EUR ──
ALTER TABLE consultants MODIFY COLUMN currency CHAR(3) DEFAULT 'EUR';
ALTER TABLE consultant_services MODIFY COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'EUR';
ALTER TABLE credit_packages MODIFY COLUMN currency CHAR(3) NOT NULL DEFAULT 'EUR';
ALTER TABLE orders MODIFY COLUMN currency CHAR(3) NOT NULL DEFAULT 'EUR';
ALTER TABLE payments MODIFY COLUMN currency CHAR(3) NOT NULL DEFAULT 'EUR';
ALTER TABLE wallets MODIFY COLUMN currency CHAR(3) NOT NULL DEFAULT 'EUR';
ALTER TABLE media_messages MODIFY COLUMN currency VARCHAR(3) NOT NULL DEFAULT 'EUR';

-- ── 5) Ayar: defter EUR, checkout'ta USD de sunulur ──
INSERT INTO site_settings (id, `key`, locale, value)
VALUES ('01000000-0000-4000-8000-00000000001c', 'platform_currency', '*',
        '{"base":"EUR","supported":["EUR","USD"],"rates":{"USD":1.1564}}')
ON DUPLICATE KEY UPDATE value = VALUES(value);

UPDATE site_settings SET value = 'EUR' WHERE `key` = 'session.price_currency';

-- Boost paketleri de EUR
UPDATE site_settings
SET value = '[{"id":"wk1","days":7,"price":10.9,"currency":"EUR"},{"id":"wk2","days":14,"price":19.9,"currency":"EUR"},{"id":"wk4","days":28,"price":34.9,"currency":"EUR"}]'
WHERE `key` = 'service_boost_packages' AND value LIKE '%TRY%';
