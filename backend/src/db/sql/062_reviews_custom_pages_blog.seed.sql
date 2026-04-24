-- =============================================================
-- OPTIONAL: BLOG reviews seed (safe)
-- - If reviews tables are missing, skip without failing the seed run
-- - target_type: 'blog' (FE uses target_type='blog' + target_id=custom_pages.id)
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

-- Blog page ids (must match 052_custom_pages_blog.seed.sql)
SET @PAGE_BLOG_1 := '22222222-2222-3333-4444-555555555501';
SET @PAGE_BLOG_2 := '22222222-2222-3333-4444-555555555502';
SET @PAGE_BLOG_3 := '22222222-2222-3333-4444-555555555503';
SET @PAGE_BLOG_4 := '22222222-2222-3333-4444-555555555504';
SET @PAGE_BLOG_5 := '22222222-2222-3333-4444-555555555505';
SET @PAGE_BLOG_6 := '22222222-2222-3333-4444-555555555506';

-- Parent review ids (fixed)
SET @REV_BLOG_1 := '44440101-4444-4444-8444-444444440101';
SET @REV_BLOG_2 := '44440102-4444-4444-8444-444444440102';
SET @REV_BLOG_3 := '44440103-4444-4444-8444-444444440103';
SET @REV_BLOG_4 := '44440104-4444-4444-8444-444444440104';
SET @REV_BLOG_5 := '44440105-4444-4444-8444-444444440105';
SET @REV_BLOG_6 := '44440106-4444-4444-8444-444444440106';

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
  (@REV_BLOG_1, 'blog', @PAGE_BLOG_1, 'Leonie K.',  'leonie.k@example.com',  5, 1, 1, 210, 6, 0, 5, 'de', NOW(3), NOW(3)),
  (@REV_BLOG_2, 'blog', @PAGE_BLOG_2, 'Daniel S.',  'daniel.s@example.com',  5, 1, 1, 220, 4, 0, 4, 'de', NOW(3), NOW(3)),
  (@REV_BLOG_3, 'blog', @PAGE_BLOG_3, 'Anna M.',    'anna.m@example.com',    5, 1, 1, 230, 2, 0, 2, 'de', NOW(3), NOW(3)),
  (@REV_BLOG_4, 'blog', @PAGE_BLOG_4, 'Miriam N.',  'miriam.n@example.com',  5, 1, 1, 240, 3, 0, 3, 'de', NOW(3), NOW(3)),
  (@REV_BLOG_5, 'blog', @PAGE_BLOG_5, 'Tom W.',     'tom.w@example.com',     5, 1, 1, 250, 3, 0, 3, 'de', NOW(3), NOW(3)),
  (@REV_BLOG_6, 'blog', @PAGE_BLOG_6, 'Lea S.',     'lea.s@example.com',     5, 1, 1, 260, 3, 0, 3, 'de', NOW(3), NOW(3))
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
  ('44440101-4444-4444-8444-444444441103', @REV_BLOG_1, 'de',
   'Sehr verständlich und alltagstauglich',
   'Der Beitrag ist klar strukturiert und praxisnah. Die Hinweise zu Wasser, Ballaststoffen und fermentierten Lebensmitteln lassen sich gut in den Alltag integrieren – die Idee vom zweiten Gehirn ist ein starker Denkanstoß.',
   NULL, NOW(3), NOW(3)),

  ('44440102-4444-4444-8444-444444442203', @REV_BLOG_2, 'de',
   'Nachhaltige Energie ohne Koffein',
   'Sehr gute, realistische Empfehlungen. Schlafrhythmus, Morgenlicht und sanfte Bewegung sind verständlich erklärt – ohne Wunderlösungen. Die Kräutertee-Ideen passen perfekt dazu.',
   NULL, NOW(3), NOW(3)),

  ('44440103-4444-4444-8444-444444443303', @REV_BLOG_3, 'de',
   'Übersichtlich und motivierend',
   'Der saisonale Überblick ist angenehm klar und leicht umzusetzen. Besonders hilfreich finde ich den Fokus auf Wochenmarkt, Vielfalt auf dem Teller und kleine, konsequente Schritte.',
   NULL, NOW(3), NOW(3)),

  ('44440104-4444-4444-8444-444444444403', @REV_BLOG_4, 'de',
   'Sehr stimmig beschrieben',
   'Die Arbeit mit geschlossenen Augen wird nachvollziehbar als Präsenz und Sensibilität erklärt. Die Betonung von Ruhe, klaren Grenzen und einem geschützten Rahmen wirkt sehr vertrauensvoll.',
   NULL, NOW(3), NOW(3)),

  ('44440105-4444-4444-8444-444444445503', @REV_BLOG_5, 'de',
   'Klare, hilfreiche Einordnung',
   'Sehr wertvoll, wie deutlich was es ist / was es nicht ist beschrieben wird. Einverständnis, Kommunikation und Grenzen werden ruhig und respektvoll in den Mittelpunkt gestellt.',
   NULL, NOW(3), NOW(3)),

  ('44440106-4444-4444-8444-444444446603', @REV_BLOG_6, 'de',
   'Kurz und alltagstauglich',
   'Die Atem-Übung ist einfach und sofort umsetzbar. Schön ist auch der Bezug zur Massage: Tempo, Atmung und Sicherheit hängen spürbar zusammen.',
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
