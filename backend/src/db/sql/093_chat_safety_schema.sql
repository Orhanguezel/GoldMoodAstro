CREATE TABLE IF NOT EXISTS chat_blocks (
  id VARCHAR(36) PRIMARY KEY,
  blocker_user_id CHAR(36) NOT NULL,
  blocked_user_id CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_chat_blocks_pair (blocker_user_id, blocked_user_id),
  KEY ix_chat_blocks_blocked (blocked_user_id),
  CONSTRAINT fk_chat_blocks_blocker FOREIGN KEY (blocker_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_chat_blocks_blocked FOREIGN KEY (blocked_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS chat_reports (
  id VARCHAR(36) PRIMARY KEY,
  thread_id VARCHAR(36) NOT NULL,
  message_id VARCHAR(36) NOT NULL,
  reporter_user_id CHAR(36) NOT NULL,
  reported_user_id CHAR(36) NOT NULL,
  reason VARCHAR(32) NOT NULL,
  details TEXT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'open',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_chat_reports_reporter_message (reporter_user_id, message_id),
  KEY ix_chat_reports_status (status, created_at),
  KEY ix_chat_reports_thread (thread_id),
  KEY ix_chat_reports_message (message_id),
  KEY ix_chat_reports_reported (reported_user_id),
  CONSTRAINT fk_chat_reports_thread FOREIGN KEY (thread_id) REFERENCES chat_threads(id) ON DELETE CASCADE,
  CONSTRAINT fk_chat_reports_message FOREIGN KEY (message_id) REFERENCES chat_messages(id) ON DELETE CASCADE,
  CONSTRAINT fk_chat_reports_reporter FOREIGN KEY (reporter_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_chat_reports_reported FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
