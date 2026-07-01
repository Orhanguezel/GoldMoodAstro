-- =============================================================
-- 091a_chat_threads_unique_per_creator.sql
-- Prod additive: chat_threads tablosundaki UNIQUE (context_type, context_id)
-- key'ini (context_type, context_id, created_by_user_id) ile değiştir.
-- Sebep: consultant_lead/support gibi 1:1 sohbet context'lerinde farklı
-- müşteriler aynı danışmana mesaj attıklarında tek thread'e birleşmemeli.
-- Idempotent: index varsa drop+recreate, yoksa sadece ekle.
-- =============================================================

-- Önce var olan eski UNIQUE varsa drop (INFORMATION_SCHEMA guard)
SET @drop_old := (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'chat_threads'
        AND INDEX_NAME = 'uq_chat_threads_ctx'
    ),
    'ALTER TABLE chat_threads DROP INDEX uq_chat_threads_ctx',
    'SELECT 1'
  )
);
PREPARE stmt FROM @drop_old; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Yeni UNIQUE (context_type, context_id, created_by_user_id) — yoksa ekle
SET @add_new := (
  SELECT IF(
    EXISTS (
      SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'chat_threads'
        AND INDEX_NAME = 'uq_chat_threads_ctx_creator'
    ),
    'SELECT 1',
    'ALTER TABLE chat_threads ADD UNIQUE KEY uq_chat_threads_ctx_creator (context_type, context_id, created_by_user_id)'
  )
);
PREPARE stmt FROM @add_new; EXECUTE stmt; DEALLOCATE PREPARE stmt;
