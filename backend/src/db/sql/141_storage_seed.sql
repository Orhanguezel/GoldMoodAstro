-- =============================================================
-- 141_storage_seed.sql
-- Astrolog profil görselleri storage_assets tablosuna kayıtlanır
-- ve kayıt sonrası users.avatar_url buradaki public_url'ye bağlanır.
-- Fiziksel dosyalar: backend/uploads/consultant_1..3.png
-- =============================================================

INSERT INTO storage_assets (
  id, owner_user_id, bucket, path, public_url, mime_type, size_bytes, metadata
) VALUES
(
  '30000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'local',
  'consultant_1.png',
  '/uploads/consultant_1.png',
  'image/png',
  811522,
  JSON_OBJECT('purpose','avatar','seed',1)
),
(
  '30000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000002',
  'local',
  'consultant_2.png',
  '/uploads/consultant_2.png',
  'image/png',
  714930,
  JSON_OBJECT('purpose','avatar','seed',1)
),
(
  '30000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000003',
  'local',
  'consultant_3.png',
  '/uploads/consultant_3.png',
  'image/png',
  829790,
  JSON_OBJECT('purpose','avatar','seed',1)
)
ON DUPLICATE KEY UPDATE
  owner_user_id = VALUES(owner_user_id),
  path          = VALUES(path),
  public_url    = VALUES(public_url),
  mime_type     = VALUES(mime_type),
  size_bytes    = VALUES(size_bytes),
  metadata      = VALUES(metadata);

-- users.avatar_url -> storage_assets.public_url (single source of truth)
UPDATE users u
JOIN storage_assets s ON s.owner_user_id = u.id
SET u.avatar_url = s.public_url
WHERE u.id IN (
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000003'
);
