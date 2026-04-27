-- 035_birth_charts_schema.sql

CREATE TABLE IF NOT EXISTS birth_charts (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,            -- FK -> users.id
  name VARCHAR(255) NOT NULL,           -- "My Chart", "Wife", "Child"
  dob DATE NOT NULL,                    -- Date of Birth
  tob TIME NOT NULL,                    -- Time of Birth
  pob_lat DECIMAL(9,6) NOT NULL,        -- Latitude of Birth
  pob_lng DECIMAL(9,6) NOT NULL,        -- Longitude of Birth
  pob_label VARCHAR(255),               -- "Istanbul, Turkey"
  tz_offset SMALLINT DEFAULT 0,         -- Timezone offset in minutes
  chart_data JSON,                      -- Computed natal chart (planets, houses, aspects)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE INDEX idx_user_chart_name (user_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
