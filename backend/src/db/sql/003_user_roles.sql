CREATE TABLE IF NOT EXISTS user_roles (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  role ENUM('user','consultant','admin') NOT NULL DEFAULT 'user',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY user_roles_user_id_role_unique (user_id, role),
  KEY user_roles_user_id_idx (user_id),
  KEY user_roles_role_idx (role),
  CONSTRAINT fk_user_roles_user_id_users_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO user_roles (id, user_id, role) VALUES
('aaaaaaaa-0000-4000-8000-000000000001', @ADMIN_ID, 'admin'),
('aaaaaaaa-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000010', 'user'),
-- Kişisel kullanıcılar
('aaaaaaaa-0000-4000-8000-0000000000a1', '10000000-0000-4000-8000-0000000000a1', 'user'),
('aaaaaaaa-0000-4000-8000-0000000000a2', '10000000-0000-4000-8000-0000000000a2', 'admin')
ON DUPLICATE KEY UPDATE role = VALUES(role);
