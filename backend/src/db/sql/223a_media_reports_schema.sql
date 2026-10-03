CREATE TABLE IF NOT EXISTS media_reports (
  id CHAR(36) PRIMARY KEY,
  message_id CHAR(36) NOT NULL,
  reporter_user_id CHAR(36) NOT NULL,
  reported_user_id CHAR(36) NOT NULL,
  reason VARCHAR(32) NOT NULL,
  details TEXT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'open',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_media_reports_reporter_message (reporter_user_id, message_id),
  KEY ix_media_reports_status (status, created_at),
  CONSTRAINT fk_media_reports_message FOREIGN KEY (message_id) REFERENCES media_messages(id) ON DELETE CASCADE,
  CONSTRAINT fk_media_reports_reporter FOREIGN KEY (reporter_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_media_reports_reported FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
