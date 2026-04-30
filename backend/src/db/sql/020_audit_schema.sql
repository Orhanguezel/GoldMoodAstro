CREATE TABLE IF NOT EXISTS audit_logs (
  id CHAR(36) PRIMARY KEY,
  actor_user_id CHAR(36),
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(80),
  entity_id CHAR(36),
  metadata JSON,
  ip_address VARCHAR(64),
  user_agent TEXT,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY audit_actor_idx (actor_user_id),
  KEY audit_entity_idx (entity_type, entity_id),
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Request log table (admin audit panel — request-logs sayfası için)
CREATE TABLE IF NOT EXISTS audit_request_logs (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  req_id VARCHAR(64) NOT NULL,
  method VARCHAR(16) NOT NULL,
  url LONGTEXT NOT NULL,
  path VARCHAR(255) NOT NULL,
  status_code INT NOT NULL,
  response_time_ms INT NOT NULL DEFAULT 0,
  ip VARCHAR(64) NOT NULL,
  user_agent LONGTEXT,
  referer LONGTEXT,
  user_id VARCHAR(64),
  is_admin INT NOT NULL DEFAULT 0,
  country VARCHAR(8),
  city VARCHAR(64),
  error_message VARCHAR(512),
  error_code VARCHAR(64),
  request_body LONGTEXT,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY audit_request_logs_created_idx (created_at),
  KEY audit_request_logs_user_idx (user_id),
  KEY audit_request_logs_path_idx (path),
  KEY audit_request_logs_ip_idx (ip),
  KEY audit_request_logs_status_idx (status_code),
  KEY audit_request_logs_method_idx (method)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Auth event log (login/logout/register/password-reset)
CREATE TABLE IF NOT EXISTS audit_auth_events (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  event VARCHAR(32) NOT NULL,
  user_id VARCHAR(64),
  email VARCHAR(255),
  ip VARCHAR(64) NOT NULL,
  user_agent LONGTEXT,
  country VARCHAR(8),
  city VARCHAR(64),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY audit_auth_events_created_idx (created_at),
  KEY audit_auth_events_event_idx (event),
  KEY audit_auth_events_user_idx (user_id),
  KEY audit_auth_events_ip_idx (ip)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Domain/system events (level + topic + meta)
CREATE TABLE IF NOT EXISTS audit_events (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  ts DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  level VARCHAR(16) NOT NULL,
  topic VARCHAR(128) NOT NULL,
  message LONGTEXT,
  actor_user_id VARCHAR(64),
  ip VARCHAR(64),
  entity_type VARCHAR(64),
  entity_id VARCHAR(64),
  meta_json LONGTEXT,
  KEY audit_events_ts_idx (ts),
  KEY audit_events_topic_ts_idx (topic, ts),
  KEY audit_events_level_ts_idx (level, ts)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
