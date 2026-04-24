-- 005_user_roles_seed.sql
-- ADMIN kullanıcısına 'admin' rolünü bağlar

INSERT INTO user_roles (
  id,
  user_id,
  role,
  created_at
) VALUES (
  UUID(),
  '{{ADMIN_ID}}',
  'admin',
  CURRENT_TIMESTAMP(3)
)
ON DUPLICATE KEY UPDATE
  role = VALUES(role);
