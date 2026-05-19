CREATE TABLE IF NOT EXISTS consultant_profile_views (
  id CHAR(36) PRIMARY KEY,
  consultant_id CHAR(36) NOT NULL,
  viewer_user_id CHAR(36) NULL,
  viewer_ip_hash VARCHAR(64) NULL,
  viewed_at DATETIME(3) NOT NULL,
  KEY idx_consultant_day (consultant_id, viewed_at),
  KEY idx_viewer_user (viewer_user_id),
  CONSTRAINT fk_consultant_profile_views_consultant FOREIGN KEY (consultant_id) REFERENCES consultants(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_consultant_profile_views_user FOREIGN KEY (viewer_user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
