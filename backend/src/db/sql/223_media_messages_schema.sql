CREATE TABLE IF NOT EXISTS consultant_media_settings (
  consultant_id CHAR(36) PRIMARY KEY,
  audio_enabled TINYINT NOT NULL DEFAULT 0,
  audio_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  video_enabled TINYINT NOT NULL DEFAULT 0,
  video_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  reply_sla_hours INT NOT NULL DEFAULT 72,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_consultant_media_settings_consultant FOREIGN KEY (consultant_id) REFERENCES consultants(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS media_messages (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  consultant_id CHAR(36) NOT NULL,
  parent_id CHAR(36) NULL,
  kind ENUM('audio','video') NOT NULL,
  direction ENUM('question','reply') NOT NULL DEFAULT 'question',
  storage_bucket VARCHAR(64) NOT NULL DEFAULT 'media_messages',
  storage_path VARCHAR(500) NOT NULL,
  duration_seconds INT NULL,
  note TEXT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(3) NOT NULL DEFAULT 'TRY',
  charge_ref VARCHAR(64) NULL,
  status ENUM('sent','answered','expired','refunded') NOT NULL DEFAULT 'sent',
  reply_due_at DATETIME(3) NULL,
  answered_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY mm_user_idx (user_id, created_at),
  KEY mm_consultant_idx (consultant_id, status, created_at),
  KEY mm_parent_idx (parent_id),
  KEY mm_due_idx (status, reply_due_at),
  UNIQUE KEY mm_charge_ref_uq (charge_ref),
  CONSTRAINT fk_media_messages_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_media_messages_consultant FOREIGN KEY (consultant_id) REFERENCES consultants(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_media_messages_parent FOREIGN KEY (parent_id) REFERENCES media_messages(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

