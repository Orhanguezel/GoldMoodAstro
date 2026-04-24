-- =============================================================
-- OPTIONAL: TESTIMONIAL reviews seed (safe)
-- - If reviews tables are missing, skip without failing the seed run
-- - target_type: 'testimonial'
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

START TRANSACTION;

-- ---------------------------
-- Table guards
-- ---------------------------
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

-- ---------------------------
-- Testimonial target ids (define your own)
-- Option A: single bucket id (recommended for homepage slider):
-- ---------------------------
SET @TESTIMONIAL_BUCKET := 'energetische-massage';

-- ---------------------------
-- Parent review ids (fixed)
-- 1 parent = 3 locale i18n
-- ---------------------------
SET @REV_TEST_1 := '55550101-5555-4444-8555-555555550101';
SET @REV_TEST_2 := '55550102-5555-4444-8555-555555550102';
SET @REV_TEST_3 := '55550103-5555-4444-8555-555555550103';
SET @REV_TEST_4 := '55550104-5555-4444-8555-555555550104';
SET @REV_TEST_5 := '55550105-5555-4444-8555-555555550105';
SET @REV_TEST_6 := '55550106-5555-4444-8555-555555550106';

-- ---------------------------
-- Insert parents (reviews)
-- ---------------------------
SET @SQL_REVIEWS := IF(@HAS_REVIEWS > 0,
'INSERT INTO `reviews`
  (`id`, `target_type`, `target_id`,
   `name`, `email`,
   `rating`, `is_active`, `is_approved`, `display_order`,
   `likes_count`, `dislikes_count`, `helpful_count`,
   `submitted_locale`,
   `created_at`, `updated_at`)
VALUES
  (@REV_TEST_1, ''testimonial'', @TESTIMONIAL_BUCKET, ''Ayşe T.'',   ''ayse.t@example.com'',   5, 1, 1, 10,  8, 0, 7, ''tr'', NOW(3), NOW(3)),
  (@REV_TEST_2, ''testimonial'', @TESTIMONIAL_BUCKET, ''Michael R.'',''michael.r@example.com'',5, 1, 1, 20,  5, 0, 5, ''en'', NOW(3), NOW(3)),
  (@REV_TEST_3, ''testimonial'', @TESTIMONIAL_BUCKET, ''Laura K.'',  ''laura.k@example.com'',  5, 1, 1, 30,  4, 0, 4, ''de'', NOW(3), NOW(3)),
  (@REV_TEST_4, ''testimonial'', @TESTIMONIAL_BUCKET, ''Sandra K.'', ''sandra.k@example.com'', 5, 1, 1, 40,  6, 0, 5, ''de'', NOW(3), NOW(3)),
  (@REV_TEST_5, ''testimonial'', @TESTIMONIAL_BUCKET, ''Markus R.'', ''markus.r@example.com'', 5, 1, 1, 50,  3, 0, 3, ''de'', NOW(3), NOW(3)),
  (@REV_TEST_6, ''testimonial'', @TESTIMONIAL_BUCKET, ''Lisa T.'',   ''lisa.t@example.com'',   5, 1, 1, 60,  4, 0, 4, ''de'', NOW(3), NOW(3))
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
  `updated_at`       = VALUES(`updated_at`);',
'SELECT ''SKIP: reviews table missing'' AS info;'
);

PREPARE stmt_reviews FROM @SQL_REVIEWS;
EXECUTE stmt_reviews;
DEALLOCATE PREPARE stmt_reviews;

-- ---------------------------
-- Insert i18n (review_i18n)
-- ---------------------------
SET @SQL_REVIEW_I18N := IF(@HAS_REVIEW_I18N > 0,
'INSERT INTO `review_i18n`
  (`id`, `review_id`, `locale`,
   `title`, `comment`, `admin_reply`,
   `created_at`, `updated_at`)
VALUES
  -- TESTIMONIAL #1 (TR)
  (''55550101-5555-4444-8555-555555551101'', @REV_TEST_1, ''tr'',
   ''Gerçekten fark ettiren bir deneyim'',
   ''Seans sonrası kendimi daha sakin ve dengede hissettim. Ortam çok temiz, yaklaşım nazik ve saygılıydı. İçe dönmek için güvenli bir alan oldu.'',
   NULL, NOW(3), NOW(3)),
  (''55550101-5555-4444-8555-555555551102'', @REV_TEST_1, ''en'',
   ''A noticeably better feeling'',
   ''After the session, I felt calmer and more grounded. Clean space, respectful approach, and a very soothing experience.'',
   NULL, NOW(3), NOW(3)),
  (''55550101-5555-4444-8555-555555551103'', @REV_TEST_1, ''de'',
   ''Spürbar besser nach der Behandlung'',
   ''Nach der Sitzung fühlte ich mich deutlich ruhiger und geerdeter. Sehr sauber, respektvoll und insgesamt sehr entspannend.'',
   NULL, NOW(3), NOW(3)),

  -- TESTIMONIAL #2
  (''55550102-5555-4444-8555-555555552201'', @REV_TEST_2, ''tr'',
   ''Zihinsel olarak çok iyi geldi'',
   ''Son dönemde stresliydim. Seansın temposu çok sakindi; nefesime ve bedenime dönmeme yardımcı oldu. İletişim net ve sınırlar çok iyiydi.'',
   NULL, NOW(3), NOW(3)),
  (''55550102-5555-4444-8555-555555552202'', @REV_TEST_2, ''en'',
   ''A gentle reset'',
   ''I came in feeling stressed and scattered. The calm pace and mindful touch helped me settle and reconnect with my body. Clear communication and boundaries.'',
   NULL, NOW(3), NOW(3)),
  (''55550102-5555-4444-8555-555555552203'', @REV_TEST_2, ''de'',
   ''Ein sanfter Reset'',
   ''Ich kam gestresst an. Das ruhige Tempo und die achtsame Berührung haben mir geholfen, runterzufahren und wieder bei mir anzukommen. Klare Kommunikation und Grenzen.'',
   NULL, NOW(3), NOW(3)),

  -- TESTIMONIAL #3
  (''55550103-5555-4444-8555-555555553301'', @REV_TEST_3, ''tr'',
   ''Hijyen ve konfor üst seviyede'',
   ''Her şey çok düzenliydi; iletişim net, uygulama nazik ve sakindi. Kendimi güvende ve rahat hissettim.'',
   NULL, NOW(3), NOW(3)),
  (''55550103-5555-4444-8555-555555553302'', @REV_TEST_3, ''en'',
   ''High standards of hygiene and comfort'',
   ''Everything was well prepared; communication was clear, and the session felt gentle and calm. I felt safe and comfortable.'',
   NULL, NOW(3), NOW(3)),
  (''55550103-5555-4444-8555-555555553303'', @REV_TEST_3, ''de'',
   ''Hygiene und Wohlbefinden auf hohem Niveau'',
   ''Alles war sehr gut vorbereitet; klare Kommunikation und eine sanfte, ruhige Sitzung. Ich habe mich sicher und wohl gefühlt.'',
   NULL, NOW(3), NOW(3)),

  -- TESTIMONIAL #4 (Sandra K. — Hausbesuch)
  (''55550104-5555-4444-8555-555555554401'', @REV_TEST_4, ''tr'',
   ''Ev ziyareti harika bir deneyimdi'',
   ''Kendi evimde masaj yaptirmak studyoya gitmekten cok daha rahatlaticiydi. Her sey ozenle hazirlanmisti. Kesinlikle tavsiye ederim.'',
   NULL, NOW(3), NOW(3)),
  (''55550104-5555-4444-8555-555555554402'', @REV_TEST_4, ''en'',
   ''The home visit was a wonderful experience'',
   ''Having the massage at home was so much more relaxing than going to a studio. Everything was carefully prepared. Absolutely recommended.'',
   NULL, NOW(3), NOW(3)),
  (''55550104-5555-4444-8555-555555554403'', @REV_TEST_4, ''de'',
   ''Der Hausbesuch war ein wunderbares Erlebnis'',
   ''Die Massage zu Hause war viel entspannender als im Studio. Alles war sorgfaeltig vorbereitet. Absolute Empfehlung.'',
   NULL, NOW(3), NOW(3)),

  -- TESTIMONIAL #5 (Markus R. — Wirkung)
  (''55550105-5555-4444-8555-555555555501'', @REV_TEST_5, ''tr'',
   ''Profesyonel ve etkili'',
   ''Enerjetik masaj sonrasi kendimi yenilenmis gibi hissettim. Ev ziyareti mukemmel organize edilmisti. Cok memnunum.'',
   NULL, NOW(3), NOW(3)),
  (''55550105-5555-4444-8555-555555555502'', @REV_TEST_5, ''en'',
   ''Professional and deeply effective'',
   ''After the energetic massage I felt completely renewed. The home visit was perfectly organized. Very satisfied.'',
   NULL, NOW(3), NOW(3)),
  (''55550105-5555-4444-8555-555555555503'', @REV_TEST_5, ''de'',
   ''Professionell und wirkungsvoll'',
   ''Nach der energetischen Massage fuehlte ich mich wie neugeboren. Der Hausbesuch war perfekt organisiert. Sehr zufrieden.'',
   NULL, NOW(3), NOW(3)),

  -- TESTIMONIAL #6 (Lisa T. — Paar)
  (''55550106-5555-4444-8555-555555556601'', @REV_TEST_6, ''tr'',
   ''Harika bir hediye fikiriydi'',
   ''Esimle birlikte ev masaji yaptik. Cok ozel ve rahatlatici bir deneyimdi. Hicbir seyle ilgilenmek zorunda kalmadik.'',
   NULL, NOW(3), NOW(3)),
  (''55550106-5555-4444-8555-555555556602'', @REV_TEST_6, ''en'',
   ''A perfect gift idea'',
   ''We had the massage at home together. It was a very special and relaxing experience. We did not have to worry about anything.'',
   NULL, NOW(3), NOW(3)),
  (''55550106-5555-4444-8555-555555556603'', @REV_TEST_6, ''de'',
   ''Ein perfektes Geschenk'',
   ''Wir haben die Massage zusammen zu Hause genossen. Ein sehr besonderes und entspannendes Erlebnis. Wir mussten uns um nichts kuemmern.'',
   NULL, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `title`       = VALUES(`title`),
  `comment`     = VALUES(`comment`),
  `admin_reply` = VALUES(`admin_reply`),
  `updated_at`  = VALUES(`updated_at`);',
'SELECT ''SKIP: review_i18n table missing'' AS info;'
);

PREPARE stmt_review_i18n FROM @SQL_REVIEW_I18N;
EXECUTE stmt_review_i18n;
DEALLOCATE PREPARE stmt_review_i18n;

COMMIT;
