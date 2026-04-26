INSERT INTO users (id, email, password_hash, full_name, phone, role, is_active, email_verified, rules_accepted_at)
VALUES
(@ADMIN_ID, @ADMIN_EMAIL, @ADMIN_PASSWORD_HASH, 'Admin User', '+905550000000', 'admin', 1, 1, NOW(3)),
('10000000-0000-4000-8000-000000000010', 'user@example.test', @ADMIN_PASSWORD_HASH, 'Test User', '+905559999999', 'user', 1, 1, NOW(3))
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash),
  full_name = VALUES(full_name),
  role = VALUES(role),
  is_active = 1,
  email_verified = 1;
