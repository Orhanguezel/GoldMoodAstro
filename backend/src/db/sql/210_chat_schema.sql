-- =============================================================
-- Chat module schema (AI-first support + admin takeover)
-- =============================================================

CREATE TABLE IF NOT EXISTS `chat_threads` (
  `id` varchar(36) NOT NULL,
  `context_type` varchar(20) NOT NULL,
  `context_id` varchar(36) NOT NULL,
  `handoff_mode` varchar(20) NOT NULL DEFAULT 'ai',
  `ai_provider_preference` varchar(20) NOT NULL DEFAULT 'auto',
  `preferred_locale` varchar(10) NOT NULL DEFAULT 'tr',
  `assigned_admin_user_id` varchar(36) DEFAULT NULL,
  `created_by_user_id` varchar(36) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_chat_threads_ctx` (`context_type`,`context_id`),
  KEY `ix_chat_threads_ctx` (`context_type`,`context_id`),
  KEY `ix_chat_threads_updated` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `chat_participants` (
  `id` varchar(36) NOT NULL,
  `thread_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `role` varchar(20) NOT NULL,
  `joined_at` datetime NOT NULL,
  `last_read_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_chat_participants_thread_user` (`thread_id`,`user_id`),
  KEY `ix_chat_participants_thread` (`thread_id`),
  KEY `ix_chat_participants_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `chat_messages` (
  `id` varchar(36) NOT NULL,
  `thread_id` varchar(36) NOT NULL,
  `sender_user_id` varchar(36) NOT NULL,
  `client_id` varchar(64) DEFAULT NULL,
  `text` text NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ix_chat_messages_thread_time` (`thread_id`,`created_at`),
  KEY `ix_chat_messages_sender_time` (`sender_user_id`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


