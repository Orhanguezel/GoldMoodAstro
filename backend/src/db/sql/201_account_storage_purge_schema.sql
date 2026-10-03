-- Account deletion object purge outbox. No user FK: entries survive user cascade.
CREATE TABLE IF NOT EXISTS account_storage_purge (
  asset_id CHAR(36) PRIMARY KEY,
  provider VARCHAR(16) NOT NULL,
  provider_public_id VARCHAR(255) NOT NULL,
  resource_type VARCHAR(16) NOT NULL DEFAULT 'image',
  attempts INT UNSIGNED NOT NULL DEFAULT 0,
  next_attempt_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  lease_token CHAR(36),
  lease_until DATETIME(3),
  last_error VARCHAR(500),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY account_storage_purge_due_idx (next_attempt_at, lease_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
