-- =============================================================
-- OPTIONAL: CUSTOM PAGES reviews seed (safe)
-- - If reviews tables are missing, skip without failing the seed run
-- - target_type: 'custom_page'
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

START TRANSACTION;

SET @HAS_REVIEWS := (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = DATABASE()
    AND table_name = 'reviews'
);

SET @HAS_REVIEW_I18N := (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = DATABASE()
    AND table_name = 'review_i18n'
);

-- About page id (must match 051_custom_pages_about.seed.sql)
SET @PAGE_ABOUT := '11111111-2222-3333-4444-555555555573';

-- Parent review ids (fixed)
SET @REV_ABOUT_1 := '44440201-4444-4444-8444-444444440201';
SET @REV_ABOUT_2 := '44440202-4444-4444-8444-444444440202';

-- ---------------------------
-- Insert parents (reviews)
-- ---------------------------
SET @SQL_REVIEWS := IF(@HAS_REVIEWS > 0,
"INSERT INTO `reviews`
  (`id`, `target_type`, `target_id`,
   `name`, `email`,
   `rating`, `is_active`, `is_approved`, `display_order`,
   `likes_count`, `dislikes_count`, `helpful_count`,
   `submitted_locale`,
   `created_at`, `updated_at`)
VALUES
  (@REV_ABOUT_1, 'custom_page', @PAGE_ABOUT, 'Selin A.',   'selin.a@example.com',   5, 1, 1, 310, 5, 0, 5, 'tr', NOW(3), NOW(3)),
  (@REV_ABOUT_2, 'custom_page', @PAGE_ABOUT, 'Johanna B.','johanna.b@example.com', 5, 1, 1, 320, 4, 0, 4, 'de', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `target_type`      = VALUES(`target_type`),
  `target_id`        = VALUES(`target_id`),
  `name`             = VALUES(`name`),
  `email`            = VALUES(`email`),
  `rating`           = VALUES(`rating`),
  `is_active`        = VALUES(`is_active`),
  `is_approved`      = VALUES(`is_approved`),
  `display_order`    = VALUES(`display_order`),
  `likes_count`      = VALUES(`likes_count`),
  `dislikes_count`   = VALUES(`dislikes_count`),
  `helpful_count`    = VALUES(`helpful_count`),
  `submitted_locale` = VALUES(`submitted_locale`),
  `updated_at`       = VALUES(`updated_at`);",
"SELECT 'SKIP: reviews table missing' AS info;"
);

PREPARE stmt_reviews FROM @SQL_REVIEWS;
EXECUTE stmt_reviews;
DEALLOCATE PREPARE stmt_reviews;

-- ---------------------------
-- Insert i18n (review_i18n)
-- ---------------------------
SET @SQL_REVIEW_I18N := IF(@HAS_REVIEW_I18N > 0,
"INSERT INTO `review_i18n`
  (`id`, `review_id`, `locale`,
   `title`, `comment`, `admin_reply`,
   `created_at`, `updated_at`)
VALUES
  ('44440201-4444-4444-8444-444444442101', @REV_ABOUT_1, 'tr',
   'Sakin, saygılı ve güven veren bir yaklaşım',
   'Ön görüşmede sınırlar netleşti; seans boyunca iletişim çok rahattı. Ortam sakin ve özenliydi. Kendime dönmek için iyi bir alan oldu.',
   NULL, NOW(3), NOW(3)),
  ('44440201-4444-4444-8444-444444442102', @REV_ABOUT_1, 'en',
   'Calm, respectful, and very grounding',
   'The check-in clarified boundaries and made me feel comfortable. The session felt gentle and focused. A really safe space to relax inward.',
   NULL, NOW(3), NOW(3)),
  ('44440201-4444-4444-8444-444444442103', @REV_ABOUT_1, 'de',
   'Ruhig, respektvoll und sehr stimmig',
   'Im Vorgespräch wurden Grenzen klar besprochen. Die Sitzung war sanft, achtsam und in einer sehr angenehmen Atmosphäre. Ich habe mich sicher gefühlt.',
   NULL, NOW(3), NOW(3)),

  ('44440202-4444-4444-8444-444444442201', @REV_ABOUT_2, 'tr',
   'Net sınırlar ve çok iyi bir atmosfer',
   'Kendimi güvende hissettim. Her şey sakindi; acele yoktu. Tam da ihtiyacım olan durup nefes alma alanıydı.',
   NULL, NOW(3), NOW(3)),
  ('44440202-4444-4444-8444-444444442202', @REV_ABOUT_2, 'en',
   'Clear boundaries, peaceful atmosphere',
   'I appreciated the calm pace and the clarity. Nothing felt rushed. It was a gentle reset for body awareness and relaxation.',
   NULL, NOW(3), NOW(3)),
  ('44440202-4444-4444-8444-444444442203', @REV_ABOUT_2, 'de',
   'Klare Grenzen, ruhiger Rahmen',
   'Sehr angenehmes Tempo und klare Kommunikation. Ich mochte den geschützten Rahmen und die ruhige Atmosphäre. Ich konnte gut loslassen.',
   NULL, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `title`       = VALUES(`title`),
  `comment`     = VALUES(`comment`),
  `admin_reply` = VALUES(`admin_reply`),
  `updated_at`  = VALUES(`updated_at`);",
"SELECT 'SKIP: review_i18n table missing' AS info;"
);

PREPARE stmt_review_i18n FROM @SQL_REVIEW_I18N;
EXECUTE stmt_review_i18n;
DEALLOCATE PREPARE stmt_review_i18n;

COMMIT;
