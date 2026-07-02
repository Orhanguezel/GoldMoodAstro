-- SEO T19: Google Search Console URL index status cache
CREATE TABLE IF NOT EXISTS gsc_url_index (
  id CHAR(36) PRIMARY KEY,
  url VARCHAR(512) NOT NULL,
  coverage_state VARCHAR(128) NULL,
  verdict VARCHAR(32) NULL,
  last_crawl DATETIME(3) NULL,
  inspected_at DATETIME(3) NULL,
  checked_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  raw JSON NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uniq_gsc_url_index_url (url),
  KEY idx_gsc_url_index_verdict (verdict),
  KEY idx_gsc_url_index_checked_at (checked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
