CREATE TABLE IF NOT EXISTS daily_readings (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  chart_id CHAR(36) NOT NULL,
  reading_date DATE NOT NULL,
  content TEXT NOT NULL,
  embedding JSON,
  transits_snapshot JSON,
  model_used VARCHAR(120),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY daily_readings_user_date_uq (user_id, reading_date),
  INDEX daily_readings_user_chart_idx (user_id, chart_id),
  INDEX daily_readings_date_idx (reading_date),
  CONSTRAINT fk_daily_readings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_daily_readings_chart FOREIGN KEY (chart_id) REFERENCES birth_charts(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
