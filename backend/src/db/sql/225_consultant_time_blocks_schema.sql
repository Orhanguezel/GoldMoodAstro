CREATE TABLE IF NOT EXISTS consultant_time_blocks (
  id CHAR(36) PRIMARY KEY,
  consultant_id CHAR(36) NOT NULL,
  block_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason VARCHAR(160) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY ctb_consultant_date_idx (consultant_id, block_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
