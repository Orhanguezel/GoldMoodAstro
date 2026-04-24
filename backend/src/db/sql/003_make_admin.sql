-- 003_make_admin.sql
-- Uygulamaya tam yetkili bir ADMIN kullanıcı seed eder
-- Placeholder''lar seeder script''i üzerinden ENV''den dolduruluyor:
--   - src/db/index.ts (bun run db:seed)
--   - dist/db/index.js (bun run build sonrası)
--   {{ADMIN_ID}}, {{ADMIN_EMAIL}}, {{ADMIN_PASSWORD_HASH}}

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET collation_connection = utf8mb4_unicode_ci;

-- =============================================================
-- ADMIN USER UPSERT (users)
-- 001_auth_schema.sql''deki kolonlara birebir uyumlu
-- =============================================================
INSERT INTO users (
  id,
  email,
  password_hash,
  full_name,
  phone,
  is_active,
  email_verified,
  reset_token,
  reset_token_expires,
  created_at,
  updated_at,
  last_sign_in_at
) VALUES (
  '{{ADMIN_ID}}',            -- Örn: 4f618a8d-6fdb-498c-898a-395d368b2193
  '{{ADMIN_EMAIL}}',         -- Örn: orhanguzell@gmail.com
  '{{ADMIN_PASSWORD_HASH}}', -- bcrypt hash
  'Orhan Güzel',
  '+905551112233',
  1,                         -- is_active
  1,                         -- email_verified
  NULL,                      -- reset_token
  NULL,                      -- reset_token_expires
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3),
  NULL                       -- last_sign_in_at
)
ON DUPLICATE KEY UPDATE
  password_hash  = VALUES(password_hash),
  full_name      = VALUES(full_name),
  phone          = VALUES(phone),
  is_active      = 1,
  email_verified = 1,
  updated_at     = CURRENT_TIMESTAMP(3);

-- =============================================================
-- PROFILE UPSERT (profiles)
-- =============================================================
INSERT INTO profiles (
  id,
  full_name,
  phone,
  created_at,
  updated_at
) VALUES (
  '{{ADMIN_ID}}',
  'Orhan Güzel',
  '+905551112233',
  CURRENT_TIMESTAMP(3),
  CURRENT_TIMESTAMP(3)
)
ON DUPLICATE KEY UPDATE
  full_name  = VALUES(full_name),
  phone      = VALUES(phone),
  updated_at = CURRENT_TIMESTAMP(3);
