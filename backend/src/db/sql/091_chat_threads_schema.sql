-- =============================================================
-- 091_chat_threads_schema.sql
-- T29-3: Backend chat modülü Drizzle schema (chat_threads + chat_participants + chat_messages).
-- Eski chat_rooms/chat_messages farklı tablo isimleriydi; bu modül üç-tablolu thread/participant/message yapısı kullanır.
-- =============================================================

-- NOT: Eskiden burada `DROP TABLE IF EXISTS chat_messages;` vardı (eski
-- chat_rooms şemasından bu modüle göç sırasında konmuştu). Ancak --seed her
-- çalıştığında bu DROP, KULLANICI MESAJLARINI SİLİYORDU (idempotent değil!).
-- 2026-05-21 itibariyle DROP kaldırıldı. Yeni temiz kurulum yapıyorsanız ve
-- eski chat_messages tablosu Drizzle şemasıyla uyumsuzsa, tek seferlik
-- manuel migration yapılmalıdır (bu seed her seferinde koşar, idempotent
-- olmalı).

CREATE TABLE IF NOT EXISTS chat_threads (
  id VARCHAR(36) PRIMARY KEY,
  context_type VARCHAR(20) NOT NULL,
  context_id VARCHAR(36) NOT NULL,
  created_by_user_id VARCHAR(36),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_chat_threads_ctx_creator (context_type, context_id, created_by_user_id),
  KEY ix_chat_threads_ctx (context_type, context_id),
  KEY ix_chat_threads_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS chat_participants (
  id VARCHAR(36) PRIMARY KEY,
  thread_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  role VARCHAR(20) NOT NULL,
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_read_at DATETIME NULL,
  UNIQUE KEY uq_chat_participants_thread_user (thread_id, user_id),
  KEY ix_chat_participants_thread (thread_id),
  KEY ix_chat_participants_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
