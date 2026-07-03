CREATE TABLE IF NOT EXISTS user_favorites (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  consultant_id CHAR(36) NOT NULL,
  online_notified_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uf_user_consultant_uq (user_id, consultant_id),
  KEY uf_consultant_idx (consultant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
