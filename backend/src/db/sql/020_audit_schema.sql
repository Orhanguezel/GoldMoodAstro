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
