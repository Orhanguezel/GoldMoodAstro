CREATE TABLE IF NOT EXISTS storage_assets (
  id CHAR(36) PRIMARY KEY,
  owner_user_id CHAR(36),
  bucket VARCHAR(80) NOT NULL DEFAULT 'local',
  path VARCHAR(500) NOT NULL,
  public_url VARCHAR(800),
  mime_type VARCHAR(120),
  size_bytes BIGINT,
  metadata JSON,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_storage_owner FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
