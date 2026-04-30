-- =============================================================
-- 141_storage_seed.sql
-- Astrolog profil görselleri + zodiak + tarot kart resimleri.
-- 140_storage_schema.sql ile uyumlu kolonlar (name, folder, provider zorunlu).
-- =============================================================

INSERT INTO storage_assets (id, user_id, bucket, path, url, mime, size, name, folder, provider, metadata) VALUES
('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'local', 'local/consultant_1.png', '/uploads/consultant_1.png', 'image/png', 811522, 'consultant_1.png', 'local', 'local', JSON_OBJECT('purpose','avatar','seed',1)),
('30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'local', 'local/consultant_2.png', '/uploads/consultant_2.png', 'image/png', 714930, 'consultant_2.png', 'local', 'local', JSON_OBJECT('purpose','avatar','seed',1)),
('30000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003', 'local', 'local/consultant_3.png', '/uploads/consultant_3.png', 'image/png', 829790, 'consultant_3.png', 'local', 'local', JSON_OBJECT('purpose','avatar','seed',1))
ON DUPLICATE KEY UPDATE url = VALUES(url), mime = VALUES(mime), size = VALUES(size);

-- Zodiac icons (bucket='zodiac')
INSERT INTO storage_assets (id, user_id, bucket, path, url, mime, size, name, folder, provider, metadata)
SELECT
  CONCAT('32000000-0000-4000-8000-', LPAD(seq, 12, '0')),
  NULL, 'zodiac',
  CONCAT('zodiac/', sign, '.png'),
  CONCAT('/uploads/zodiac/', sign, '.png'),
  'image/png', 800000,
  CONCAT(sign, '.png'), 'zodiac', 'local',
  JSON_OBJECT('purpose','zodiac_icon','sign',sign,'seed',1)
FROM (
  SELECT 1 AS seq, 'aquarius' AS sign UNION ALL SELECT 2, 'aries' UNION ALL SELECT 3, 'cancer'
  UNION ALL SELECT 4, 'capricorn' UNION ALL SELECT 5, 'gemini' UNION ALL SELECT 6, 'leo'
  UNION ALL SELECT 7, 'libra' UNION ALL SELECT 8, 'pisces' UNION ALL SELECT 9, 'sagittarius'
  UNION ALL SELECT 10, 'scorpio' UNION ALL SELECT 11, 'taurus' UNION ALL SELECT 12, 'virgo'
) z
ON DUPLICATE KEY UPDATE url = VALUES(url);

-- Tarot card image asset records (bucket='tarot')
INSERT INTO storage_assets (id, user_id, bucket, path, url, mime, size, name, folder, provider, metadata)
SELECT
  CONCAT('31000000-0000-4000-8000-', LPAD(seq, 12, '0')),
  NULL, 'tarot',
  CONCAT('tarot/', slug, '.png'),
  CONCAT('/uploads/tarot/', slug, '.png'),
  'image/png', 1,
  CONCAT(slug, '.png'), 'tarot', 'local',
  JSON_OBJECT('purpose','tarot_card','slug',slug,'seed',1)
FROM (
  SELECT 1 AS seq, 'the-fool' AS slug UNION ALL SELECT 2, 'the-magician' UNION ALL SELECT 3, 'the-high-priestess'
  UNION ALL SELECT 4, 'the-empress' UNION ALL SELECT 5, 'the-emperor' UNION ALL SELECT 6, 'the-hierophant'
  UNION ALL SELECT 7, 'the-lovers' UNION ALL SELECT 8, 'the-chariot' UNION ALL SELECT 9, 'strength'
  UNION ALL SELECT 10, 'the-hermit' UNION ALL SELECT 11, 'wheel-of-fortune' UNION ALL SELECT 12, 'justice'
  UNION ALL SELECT 13, 'the-hanged-man' UNION ALL SELECT 14, 'death' UNION ALL SELECT 15, 'temperance'
  UNION ALL SELECT 16, 'the-devil' UNION ALL SELECT 17, 'the-tower' UNION ALL SELECT 18, 'the-star'
  UNION ALL SELECT 19, 'the-moon' UNION ALL SELECT 20, 'the-sun' UNION ALL SELECT 21, 'judgement'
  UNION ALL SELECT 22, 'the-world' UNION ALL SELECT 23, 'ace-of-cups' UNION ALL SELECT 24, 'ace-of-swords'
  UNION ALL SELECT 25, 'ace-of-wands' UNION ALL SELECT 26, 'ace-of-pentacles' UNION ALL SELECT 27, 'two-of-cups'
  UNION ALL SELECT 28, 'three-of-cups' UNION ALL SELECT 29, 'four-of-cups' UNION ALL SELECT 30, 'five-of-cups'
  UNION ALL SELECT 31, 'six-of-cups' UNION ALL SELECT 32, 'seven-of-cups' UNION ALL SELECT 33, 'eight-of-cups'
  UNION ALL SELECT 34, 'nine-of-cups' UNION ALL SELECT 35, 'ten-of-cups' UNION ALL SELECT 36, 'page-of-cups'
  UNION ALL SELECT 37, 'knight-of-cups' UNION ALL SELECT 38, 'queen-of-cups' UNION ALL SELECT 39, 'king-of-cups'
  UNION ALL SELECT 40, 'two-of-swords' UNION ALL SELECT 41, 'three-of-swords' UNION ALL SELECT 42, 'four-of-swords'
  UNION ALL SELECT 43, 'five-of-swords' UNION ALL SELECT 44, 'six-of-swords' UNION ALL SELECT 45, 'seven-of-swords'
  UNION ALL SELECT 46, 'eight-of-swords' UNION ALL SELECT 47, 'nine-of-swords' UNION ALL SELECT 48, 'ten-of-swords'
  UNION ALL SELECT 49, 'page-of-swords' UNION ALL SELECT 50, 'knight-of-swords' UNION ALL SELECT 51, 'queen-of-swords'
  UNION ALL SELECT 52, 'king-of-swords' UNION ALL SELECT 53, 'two-of-wands' UNION ALL SELECT 54, 'three-of-wands'
  UNION ALL SELECT 55, 'four-of-wands' UNION ALL SELECT 56, 'five-of-wands' UNION ALL SELECT 57, 'six-of-wands'
  UNION ALL SELECT 58, 'seven-of-wands' UNION ALL SELECT 59, 'eight-of-wands' UNION ALL SELECT 60, 'nine-of-wands'
  UNION ALL SELECT 61, 'ten-of-wands' UNION ALL SELECT 62, 'page-of-wands' UNION ALL SELECT 63, 'knight-of-wands'
  UNION ALL SELECT 64, 'queen-of-wands' UNION ALL SELECT 65, 'king-of-wands' UNION ALL SELECT 66, 'two-of-pentacles'
  UNION ALL SELECT 67, 'three-of-pentacles' UNION ALL SELECT 68, 'four-of-pentacles' UNION ALL SELECT 69, 'five-of-pentacles'
  UNION ALL SELECT 70, 'six-of-pentacles' UNION ALL SELECT 71, 'seven-of-pentacles' UNION ALL SELECT 72, 'eight-of-pentacles'
  UNION ALL SELECT 73, 'nine-of-pentacles' UNION ALL SELECT 74, 'ten-of-pentacles' UNION ALL SELECT 75, 'page-of-pentacles'
  UNION ALL SELECT 76, 'knight-of-pentacles' UNION ALL SELECT 77, 'queen-of-pentacles' UNION ALL SELECT 78, 'king-of-pentacles'
) tarot_assets
ON DUPLICATE KEY UPDATE url = VALUES(url);

-- Fatma için gerçek foto (consultant_fatma2.png ile güncellendi — 2026-04-30)
INSERT INTO storage_assets (id, user_id, bucket, path, url, mime, size, name, folder, provider, metadata) VALUES
('30000000-0000-4000-8000-0000000000b3', '10000000-0000-4000-8000-0000000000b3', 'local', 'local/consultant_fatma2.png', '/uploads/consultant_fatma2.png', 'image/png', 2444081, 'consultant_fatma2.png', 'local', 'local', JSON_OBJECT('purpose','avatar','seed',1,'consultant','fatma-guclu'))
ON DUPLICATE KEY UPDATE url = VALUES(url), path = VALUES(path), name = VALUES(name), mime = VALUES(mime), size = VALUES(size);

-- Orhan (sanal asistan astrolog) — 2026-04-30
INSERT INTO storage_assets (id, user_id, bucket, path, url, mime, size, name, folder, provider, metadata) VALUES
('30000000-0000-4000-8000-0000000000c1', '10000000-0000-4000-8000-0000000000c1', 'local', 'local/consultant_orhan.png', '/uploads/consultant_orhan.png', 'image/png', 2400154, 'consultant_orhan.png', 'local', 'local', JSON_OBJECT('purpose','avatar','seed',1,'consultant','orhan-guzel-astrolog'))
ON DUPLICATE KEY UPDATE url = VALUES(url), path = VALUES(path), name = VALUES(name);

-- users.avatar_url -> storage_assets.url
UPDATE users u
JOIN storage_assets s ON s.user_id = u.id
SET u.avatar_url = s.url
WHERE u.id IN (
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-0000000000b3',
  '10000000-0000-4000-8000-0000000000c1'
);

-- App Features & Support Assets
INSERT INTO storage_assets (id, user_id, bucket, path, url, mime, size, name, folder, provider, metadata) VALUES
('33000000-0000-4000-8000-000000000001', NULL, 'features', 'features/natal_chart.png', '/uploads/features/natal_chart.png', 'image/png', 1000000, 'natal_chart.png', 'features', 'local', JSON_OBJECT('purpose','feature_image','slug','natal_chart')),
('33000000-0000-4000-8000-000000000002', NULL, 'features', 'features/daily_reading.png', '/uploads/features/daily_reading.png', 'image/png', 1000000, 'daily_reading.png', 'features', 'local', JSON_OBJECT('purpose','feature_image','slug','daily_reading')),
('33000000-0000-4000-8000-000000000003', NULL, 'features', 'features/synastry_chart.png', '/uploads/features/synastry_chart.png', 'image/png', 1000000, 'synastry_chart.png', 'features', 'local', JSON_OBJECT('purpose','feature_image','slug','synastry_chart')),
('33000000-0000-4000-8000-000000000004', NULL, 'support', 'support/support_ai.png', '/uploads/support/support_ai.png', 'image/png', 1000000, 'support_ai.png', 'support', 'local', JSON_OBJECT('purpose','support_ai_avatar'))
ON DUPLICATE KEY UPDATE url = VALUES(url);
