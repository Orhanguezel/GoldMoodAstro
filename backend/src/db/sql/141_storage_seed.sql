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
),
(
  UUID(),
  NULL,
  'local',
  'zodiac/aquarius.png',
  '/uploads/zodiac/aquarius.png',
  'image/png',
  960126,
  JSON_OBJECT('purpose', 'zodiac_icon', 'sign', 'aquarius')
),
(
  UUID(),
  NULL,
  'local',
  'zodiac/aries.png',
  '/uploads/zodiac/aries.png',
  'image/png',
  767287,
  JSON_OBJECT('purpose', 'zodiac_icon', 'sign', 'aries')
),
(
  UUID(),
  NULL,
  'local',
  'zodiac/cancer.png',
  '/uploads/zodiac/cancer.png',
  'image/png',
  906148,
  JSON_OBJECT('purpose', 'zodiac_icon', 'sign', 'cancer')
),
(
  UUID(),
  NULL,
  'local',
  'zodiac/capricorn.png',
  '/uploads/zodiac/capricorn.png',
  'image/png',
  907181,
  JSON_OBJECT('purpose', 'zodiac_icon', 'sign', 'capricorn')
),
(
  UUID(),
  NULL,
  'local',
  'zodiac/gemini.png',
  '/uploads/zodiac/gemini.png',
  'image/png',
  884920,
  JSON_OBJECT('purpose', 'zodiac_icon', 'sign', 'gemini')
),
(
  UUID(),
  NULL,
  'local',
  'zodiac/leo.png',
  '/uploads/zodiac/leo.png',
  'image/png',
  873937,
  JSON_OBJECT('purpose', 'zodiac_icon', 'sign', 'leo')
),
(
  UUID(),
  NULL,
  'local',
  'zodiac/libra.png',
  '/uploads/zodiac/libra.png',
  'image/png',
  897219,
  JSON_OBJECT('purpose', 'zodiac_icon', 'sign', 'libra')
),
(
  UUID(),
  NULL,
  'local',
  'zodiac/pisces.png',
  '/uploads/zodiac/pisces.png',
  'image/png',
  863762,
  JSON_OBJECT('purpose', 'zodiac_icon', 'sign', 'pisces')
),
(
  UUID(),
  NULL,
  'local',
  'zodiac/sagittarius.png',
  '/uploads/zodiac/sagittarius.png',
  'image/png',
  778284,
  JSON_OBJECT('purpose', 'zodiac_icon', 'sign', 'sagittarius')
),
(
  UUID(),
  NULL,
  'local',
  'zodiac/scorpio.png',
  '/uploads/zodiac/scorpio.png',
  'image/png',
  845073,
  JSON_OBJECT('purpose', 'zodiac_icon', 'sign', 'scorpio')
),
(
  UUID(),
  NULL,
  'local',
  'zodiac/taurus.png',
  '/uploads/zodiac/taurus.png',
  'image/png',
  781019,
  JSON_OBJECT('purpose', 'zodiac_icon', 'sign', 'taurus')
),
(
  UUID(),
  NULL,
  'local',
  'zodiac/virgo.png',
  '/uploads/zodiac/virgo.png',
  'image/png',
  818622,
  JSON_OBJECT('purpose', 'zodiac_icon', 'sign', 'virgo')
)
ON DUPLICATE KEY UPDATE
  owner_user_id = VALUES(owner_user_id),
  path          = VALUES(path),
  public_url    = VALUES(public_url),
  mime_type     = VALUES(mime_type),
  size_bytes    = VALUES(size_bytes),
  metadata      = VALUES(metadata);

-- Tarot card image asset records.
-- Fiziksel dosyalar daha sonra backend/uploads/tarot/{slug}.png altına eklenecek.
INSERT INTO storage_assets (
  id, owner_user_id, bucket, path, public_url, mime_type, size_bytes, metadata
)
SELECT
  CONCAT('31000000-0000-4000-8000-', LPAD(seq, 12, '0')),
  NULL,
  'local',
  CONCAT('tarot/', slug, '.png'),
  CONCAT('/uploads/tarot/', slug, '.png'),
  'image/png',
  0,
  JSON_OBJECT('purpose', 'tarot_card', 'slug', slug, 'seed', 1)
FROM (
  SELECT 1 AS seq, 'the-fool' AS slug
  UNION ALL SELECT 2 AS seq, 'the-magician' AS slug
  UNION ALL SELECT 3 AS seq, 'the-high-priestess' AS slug
  UNION ALL SELECT 4 AS seq, 'the-empress' AS slug
  UNION ALL SELECT 5 AS seq, 'the-emperor' AS slug
  UNION ALL SELECT 6 AS seq, 'the-hierophant' AS slug
  UNION ALL SELECT 7 AS seq, 'the-lovers' AS slug
  UNION ALL SELECT 8 AS seq, 'the-chariot' AS slug
  UNION ALL SELECT 9 AS seq, 'strength' AS slug
  UNION ALL SELECT 10 AS seq, 'the-hermit' AS slug
  UNION ALL SELECT 11 AS seq, 'wheel-of-fortune' AS slug
  UNION ALL SELECT 12 AS seq, 'justice' AS slug
  UNION ALL SELECT 13 AS seq, 'the-hanged-man' AS slug
  UNION ALL SELECT 14 AS seq, 'death' AS slug
  UNION ALL SELECT 15 AS seq, 'temperance' AS slug
  UNION ALL SELECT 16 AS seq, 'the-devil' AS slug
  UNION ALL SELECT 17 AS seq, 'the-tower' AS slug
  UNION ALL SELECT 18 AS seq, 'the-star' AS slug
  UNION ALL SELECT 19 AS seq, 'the-moon' AS slug
  UNION ALL SELECT 20 AS seq, 'the-sun' AS slug
  UNION ALL SELECT 21 AS seq, 'judgement' AS slug
  UNION ALL SELECT 22 AS seq, 'the-world' AS slug
  UNION ALL SELECT 23 AS seq, 'ace-of-cups' AS slug
  UNION ALL SELECT 24 AS seq, 'ace-of-swords' AS slug
  UNION ALL SELECT 25 AS seq, 'ace-of-wands' AS slug
  UNION ALL SELECT 26 AS seq, 'ace-of-pentacles' AS slug
  UNION ALL SELECT 27 AS seq, 'two-of-cups' AS slug
  UNION ALL SELECT 28 AS seq, 'three-of-cups' AS slug
  UNION ALL SELECT 29 AS seq, 'four-of-cups' AS slug
  UNION ALL SELECT 30 AS seq, 'five-of-cups' AS slug
  UNION ALL SELECT 31 AS seq, 'six-of-cups' AS slug
  UNION ALL SELECT 32 AS seq, 'seven-of-cups' AS slug
  UNION ALL SELECT 33 AS seq, 'eight-of-cups' AS slug
  UNION ALL SELECT 34 AS seq, 'nine-of-cups' AS slug
  UNION ALL SELECT 35 AS seq, 'ten-of-cups' AS slug
  UNION ALL SELECT 36 AS seq, 'page-of-cups' AS slug
  UNION ALL SELECT 37 AS seq, 'knight-of-cups' AS slug
  UNION ALL SELECT 38 AS seq, 'queen-of-cups' AS slug
  UNION ALL SELECT 39 AS seq, 'king-of-cups' AS slug
  UNION ALL SELECT 40 AS seq, 'two-of-swords' AS slug
  UNION ALL SELECT 41 AS seq, 'three-of-swords' AS slug
  UNION ALL SELECT 42 AS seq, 'four-of-swords' AS slug
  UNION ALL SELECT 43 AS seq, 'five-of-swords' AS slug
  UNION ALL SELECT 44 AS seq, 'six-of-swords' AS slug
  UNION ALL SELECT 45 AS seq, 'seven-of-swords' AS slug
  UNION ALL SELECT 46 AS seq, 'eight-of-swords' AS slug
  UNION ALL SELECT 47 AS seq, 'nine-of-swords' AS slug
  UNION ALL SELECT 48 AS seq, 'ten-of-swords' AS slug
  UNION ALL SELECT 49 AS seq, 'page-of-swords' AS slug
  UNION ALL SELECT 50 AS seq, 'knight-of-swords' AS slug
  UNION ALL SELECT 51 AS seq, 'queen-of-swords' AS slug
  UNION ALL SELECT 52 AS seq, 'king-of-swords' AS slug
  UNION ALL SELECT 53 AS seq, 'two-of-wands' AS slug
  UNION ALL SELECT 54 AS seq, 'three-of-wands' AS slug
  UNION ALL SELECT 55 AS seq, 'four-of-wands' AS slug
  UNION ALL SELECT 56 AS seq, 'five-of-wands' AS slug
  UNION ALL SELECT 57 AS seq, 'six-of-wands' AS slug
  UNION ALL SELECT 58 AS seq, 'seven-of-wands' AS slug
  UNION ALL SELECT 59 AS seq, 'eight-of-wands' AS slug
  UNION ALL SELECT 60 AS seq, 'nine-of-wands' AS slug
  UNION ALL SELECT 61 AS seq, 'ten-of-wands' AS slug
  UNION ALL SELECT 62 AS seq, 'page-of-wands' AS slug
  UNION ALL SELECT 63 AS seq, 'knight-of-wands' AS slug
  UNION ALL SELECT 64 AS seq, 'queen-of-wands' AS slug
  UNION ALL SELECT 65 AS seq, 'king-of-wands' AS slug
  UNION ALL SELECT 66 AS seq, 'two-of-pentacles' AS slug
  UNION ALL SELECT 67 AS seq, 'three-of-pentacles' AS slug
  UNION ALL SELECT 68 AS seq, 'four-of-pentacles' AS slug
  UNION ALL SELECT 69 AS seq, 'five-of-pentacles' AS slug
  UNION ALL SELECT 70 AS seq, 'six-of-pentacles' AS slug
  UNION ALL SELECT 71 AS seq, 'seven-of-pentacles' AS slug
  UNION ALL SELECT 72 AS seq, 'eight-of-pentacles' AS slug
  UNION ALL SELECT 73 AS seq, 'nine-of-pentacles' AS slug
  UNION ALL SELECT 74 AS seq, 'ten-of-pentacles' AS slug
  UNION ALL SELECT 75 AS seq, 'page-of-pentacles' AS slug
  UNION ALL SELECT 76 AS seq, 'knight-of-pentacles' AS slug
  UNION ALL SELECT 77 AS seq, 'queen-of-pentacles' AS slug
  UNION ALL SELECT 78 AS seq, 'king-of-pentacles' AS slug
) tarot_assets
ON DUPLICATE KEY UPDATE
  owner_user_id = VALUES(owner_user_id),
  path          = VALUES(path),
  public_url    = VALUES(public_url),
  mime_type     = VALUES(mime_type),
  size_bytes    = VALUES(size_bytes),
  metadata      = VALUES(metadata);

-- Proje ortakları + test danışmanı için avatar kayıtları
-- (Fatma için gerçek foto: backend/uploads/consultant_fatma.jpg
--  Diğerleri default olarak consultant_1.png'yi kullanır — admin sonra değiştirir)
INSERT INTO storage_assets (
  id, owner_user_id, bucket, path, public_url, mime_type, size_bytes, metadata
) VALUES
(
  '30000000-0000-4000-8000-0000000000b3',
  '10000000-0000-4000-8000-0000000000b3',
  'local',
  'consultant_fatma.jpg',
  '/uploads/consultant_fatma.jpg',
  'image/jpeg',
  11215,
  JSON_OBJECT('purpose','avatar','seed',1,'consultant','fatma-guclu')
)
ON DUPLICATE KEY UPDATE
  path = VALUES(path), public_url = VALUES(public_url), size_bytes = VALUES(size_bytes);

-- users.avatar_url -> storage_assets.public_url (single source of truth)
UPDATE users u
JOIN storage_assets s ON s.owner_user_id = u.id
SET u.avatar_url = s.public_url
WHERE u.id IN (
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-0000000000b3'
);
