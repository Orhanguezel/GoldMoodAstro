-- 091b_chat_messages_rebuild_legacy.sql
-- Legacy 090_chat_schema.sql created chat_messages with room_id/message columns.
-- The active chat module uses thread_id/text/client_id. Rebuild only when the
-- legacy shape is still present; existing production legacy table had 0 rows.

SET @legacy_chat_messages := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'chat_messages'
    AND COLUMN_NAME = 'room_id'
);

SET @sql := IF(
  @legacy_chat_messages > 0,
  'DROP TABLE chat_messages',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS chat_messages (
  id VARCHAR(36) PRIMARY KEY,
  thread_id VARCHAR(36) NOT NULL,
  sender_user_id VARCHAR(36) NOT NULL,
  client_id VARCHAR(64) NULL,
  text TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY ix_chat_messages_thread_time (thread_id, created_at),
  KEY ix_chat_messages_sender_time (sender_user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
