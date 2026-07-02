-- =============================================================
-- 217_payment_security_additive_migrate.sql
-- Payment/credit/subscription idempotency indexes for prod no-drop.
-- Duplicate data must be cleaned before unique indexes are added.
-- =============================================================

SET @dup := (SELECT COUNT(*) FROM (
  SELECT transaction_id FROM payments
  WHERE transaction_id IS NOT NULL AND transaction_id <> ''
  GROUP BY transaction_id HAVING COUNT(*) > 1
) d);
SET @idx := (SELECT COUNT(*) FROM information_schema.statistics
             WHERE table_schema = DATABASE() AND table_name = 'payments' AND index_name = 'payments_txid_uq');
SET @sql := IF(@idx = 0 AND @dup = 0, 'ALTER TABLE payments ADD UNIQUE KEY payments_txid_uq (transaction_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @dup := (SELECT COUNT(*) FROM (
  SELECT reference_type, reference_id, type FROM credit_transactions
  WHERE reference_type IS NOT NULL AND reference_id IS NOT NULL
  GROUP BY reference_type, reference_id, type HAVING COUNT(*) > 1
) d);
SET @idx := (SELECT COUNT(*) FROM information_schema.statistics
             WHERE table_schema = DATABASE() AND table_name = 'credit_transactions' AND index_name = 'credit_tx_ref_uq');
SET @sql := IF(@idx = 0 AND @dup = 0, 'ALTER TABLE credit_transactions ADD UNIQUE KEY credit_tx_ref_uq (reference_type, reference_id, type)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @dup := (SELECT COUNT(*) FROM (
  SELECT provider, provider_subscription_id FROM subscriptions
  WHERE provider_subscription_id IS NOT NULL AND provider_subscription_id <> ''
  GROUP BY provider, provider_subscription_id HAVING COUNT(*) > 1
) d);
SET @idx := (SELECT COUNT(*) FROM information_schema.statistics
             WHERE table_schema = DATABASE() AND table_name = 'subscriptions' AND index_name = 'sub_provider_uq');
SET @sql := IF(@idx = 0 AND @dup = 0, 'ALTER TABLE subscriptions ADD UNIQUE KEY sub_provider_uq (provider, provider_subscription_id)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @dup := (SELECT COUNT(*) FROM (
  SELECT booking_id, purpose FROM wallet_transactions
  WHERE booking_id IS NOT NULL AND purpose IS NOT NULL AND purpose <> ''
  GROUP BY booking_id, purpose HAVING COUNT(*) > 1
) d);
SET @idx := (SELECT COUNT(*) FROM information_schema.statistics
             WHERE table_schema = DATABASE() AND table_name = 'wallet_transactions' AND index_name = 'wtx_booking_purpose_uq');
SET @sql := IF(@idx = 0 AND @dup = 0, 'ALTER TABLE wallet_transactions ADD UNIQUE KEY wtx_booking_purpose_uq (booking_id, purpose)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
