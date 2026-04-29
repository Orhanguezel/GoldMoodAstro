INSERT INTO users (id, email, password_hash, full_name, phone, role, is_active, email_verified, rules_accepted_at)
VALUES
(@ADMIN_ID, @ADMIN_EMAIL, @ADMIN_PASSWORD_HASH, 'Admin User', '+905550000000', 'admin', 1, 1, NOW(3)),
('10000000-0000-4000-8000-000000000010', 'user@example.test', @ADMIN_PASSWORD_HASH, 'Test User', '+905559999999', 'user', 1, 1, NOW(3)),
-- Kişisel kullanıcılar (şifre: admin123)
('10000000-0000-4000-8000-0000000000a1', 'oorhanguzel@gmail.com',  @ADMIN_PASSWORD_HASH, 'Orhan Güzel',         NULL, 'user',  1, 1, NOW(3)),
('10000000-0000-4000-8000-0000000000a2', 'orhanguzell@gmail.com',  @ADMIN_PASSWORD_HASH, 'Orhan Güzel (Admin)', NULL, 'admin', 1, 1, NOW(3)),
-- Proje ortakları (admin + consultant kapasitesi — consultants kaydı 031'de)
('10000000-0000-4000-8000-0000000000b1', 'muratkisikcilar@gmail.com', @ADMIN_PASSWORD_HASH, 'Murat Kısıkçılar',   NULL, 'admin', 1, 1, NOW(3)),
('10000000-0000-4000-8000-0000000000b2', 'dan.pinardem@gmail.com',    @ADMIN_PASSWORD_HASH, 'Pınar Demircioğlu',  NULL, 'admin', 1, 1, NOW(3)),
('10000000-0000-4000-8000-0000000000b3', 'fatma.guclu@goldmoodastro.com', @ADMIN_PASSWORD_HASH, 'Fatma Güçlü',     NULL, 'admin', 1, 1, NOW(3)),
-- Test danışmanı (ücretsiz, sistem testleri için)
('10000000-0000-4000-8000-0000000000b4', 'test.danisman@goldmoodastro.com', @ADMIN_PASSWORD_HASH, 'Test Danışman', NULL, 'consultant', 1, 1, NOW(3))
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash),
  full_name = VALUES(full_name),
  role = VALUES(role),
  is_active = 1,
  email_verified = 1;
