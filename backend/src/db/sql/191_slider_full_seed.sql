-- =============================================================
-- FILE: 191_slider_full.sql (Energetische Massage — FINAL)
-- Slider - schema + seed + i18n (TR / EN / DE)
-- Tüm slaytlar Energetische Massage odaklı
-- Idempotent seed
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

START TRANSACTION;

-- -------------------------------------------------------------
-- DROP & SCHEMA
-- -------------------------------------------------------------
DROP TABLE IF EXISTS `slider_i18n`;
DROP TABLE IF EXISTS `slider`;

CREATE TABLE IF NOT EXISTS `slider` (
  `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid`              CHAR(36)     NOT NULL,

  `image_url`         TEXT,
  `image_asset_id`    CHAR(36),

  `featured`          TINYINT(1) UNSIGNED NOT NULL DEFAULT 0,
  `is_active`         TINYINT(1) UNSIGNED NOT NULL DEFAULT 1,

  `display_order`     INT UNSIGNED NOT NULL DEFAULT 0,

  `created_at`        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                    ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_slider_uuid`        (`uuid`),
  KEY `idx_slider_active`              (`is_active`),
  KEY `idx_slider_order`               (`display_order`),
  KEY `idx_slider_image_asset`         (`image_asset_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `slider_i18n` (
  `id`           INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  `slider_id`    INT UNSIGNED   NOT NULL,
  `locale`       VARCHAR(8)     NOT NULL,

  `name`         VARCHAR(255)   NOT NULL,
  `slug`         VARCHAR(255)   NOT NULL,
  `description`  TEXT,

  `alt`          VARCHAR(255),
  `button_text`  VARCHAR(100),
  `button_link`  VARCHAR(255),

  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_slider_i18n_slider_locale` (`slider_id`,`locale`),
  UNIQUE KEY `uniq_slider_i18n_slug_locale`   (`slug`,`locale`),
  KEY `idx_slider_i18n_locale`                (`locale`),

  CONSTRAINT `fk_slider_i18n_slider`
    FOREIGN KEY (`slider_id`) REFERENCES `slider` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- PARENT SEED (6 slides — all Energetische Massage)
-- -------------------------------------------------------------
INSERT INTO `slider`
(`uuid`,`image_url`,`image_asset_id`,`featured`,`is_active`,`display_order`,`created_at`,`updated_at`)
VALUES
('aa990001-1111-4111-8111-aa9900000001','https://res.cloudinary.com/dbozv7wqd/image/upload/v1748866121/uploads/anastasia/gallery/14-1748866115117-20866348.webp',NULL,1,1,1,'2024-01-20 00:00:00.000','2024-01-20 00:00:00.000'),
('aa990002-1111-4111-8111-aa9900000002','https://res.cloudinary.com/dbozv7wqd/image/upload/v1748866951/uploads/anastasia/gallery/21-1748866946899-726331234.webp',NULL,0,1,2,'2024-01-21 00:00:00.000','2024-01-21 00:00:00.000'),
('aa990003-1111-4111-8111-aa9900000003','https://res.cloudinary.com/dbozv7wqd/image/upload/v1748866833/uploads/anastasia/gallery/10-1748866827290-437834578.webp',NULL,0,1,3,'2024-01-22 00:00:00.000','2024-01-22 00:00:00.000'),
('aa990004-1111-4111-8111-aa9900000004','https://res.cloudinary.com/dbozv7wqd/image/upload/v1748867152/uploads/anastasia/gallery/37-1748867148559-823774231.webp',NULL,0,1,4,'2024-01-23 00:00:00.000','2024-01-23 00:00:00.000'),
('aa990005-1111-4111-8111-aa9900000005','https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1800&q=80',NULL,0,1,5,'2024-01-24 00:00:00.000','2024-01-24 00:00:00.000'),
('aa990006-1111-4111-8111-aa9900000006','https://res.cloudinary.com/dbozv7wqd/image/upload/v1748866255/uploads/anastasia/gallery/47-1748866252901-503887675.webp',NULL,0,1,6,'2024-01-25 00:00:00.000','2024-01-25 00:00:00.000')
ON DUPLICATE KEY UPDATE
  `image_url`      = VALUES(`image_url`),
  `image_asset_id` = VALUES(`image_asset_id`),
  `featured`       = VALUES(`featured`),
  `is_active`      = VALUES(`is_active`),
  `display_order`  = VALUES(`display_order`),
  `updated_at`     = VALUES(`updated_at`);

-- -------------------------------------------------------------
-- I18N — DE  (Energetische Massage — 6 Aspekte)
-- -------------------------------------------------------------
INSERT INTO `slider_i18n`
(`slider_id`,`locale`,`name`,`slug`,`description`,`alt`,`button_text`,`button_link`)
VALUES
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990001-1111-4111-8111-aa9900000001'),
  'de',
  'Entspannung, die zu Ihnen nach Hause kommt',
  'energetische-massage-willkommen-slider',
  'Professionelle energetische Massage direkt bei Ihnen zu Hause in Bonn — achtsame Berührung, klare Grenzen und tiefe Ruhe.',
  'Energetische Massage Hausbesuch in Bonn',
  'Termin Buchen',
  '/appointment'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990002-1111-4111-8111-aa9900000002'),
  'de',
  'Dankbarkeit als Grundlage',
  'energetische-massage-dankbarkeit-slider',
  'Jede Sitzung beginnt mit stiller Dankbarkeit — ein warmes Gefühl in der Brust, das den Raum für tiefe Entspannung öffnet.',
  'Dankbarkeit als Grundlage der energetischen Massage',
  'Mehr erfahren',
  '/services/energetische-massage-bonn'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990003-1111-4111-8111-aa9900000003'),
  'de',
  'Achtsame Berührung',
  'energetische-massage-achtsam-slider',
  'Bewusste, respektvolle Berührung mit geschlossenen Augen — volle Aufmerksamkeit auf das, was Ihr Körper gerade braucht.',
  'Achtsame Berührung bei der energetischen Massage',
  'Mehr erfahren',
  '/services/energetische-massage-bonn'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990004-1111-4111-8111-aa9900000004'),
  'de',
  'Ankommen & Loslassen',
  'energetische-massage-ankommen-slider',
  'In einem geschützten Raum zur Ruhe kommen, den Alltag hinter sich lassen und dem Körper erlauben, loszulassen.',
  'Ankommen und Loslassen bei der energetischen Massage',
  'Mehr erfahren',
  '/services/energetische-massage-bonn'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990005-1111-4111-8111-aa9900000005'),
  'de',
  'Klare Grenzen, sicherer Raum',
  'energetische-massage-grenzen-slider',
  'Professionelle Grenzen, frische Handtücher und eine respektvolle Atmosphäre — damit Sie sich sicher und geborgen fühlen.',
  'Klare Grenzen und sicherer Raum',
  'Mehr erfahren',
  '/services/energetische-massage-bonn'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990006-1111-4111-8111-aa9900000006'),
  'de',
  'Wir kommen zu Ihnen',
  'energetische-massage-individuell-slider',
  'Jede Massage wird individuell auf Sie abgestimmt — direkt bei Ihnen zu Hause, in Ihrer vertrauten Umgebung.',
  'Energetische Massage Hausbesuch',
  'Termin Buchen',
  '/appointment'
)
ON DUPLICATE KEY UPDATE
  `name`        = VALUES(`name`),
  `slug`        = VALUES(`slug`),
  `description` = VALUES(`description`),
  `alt`         = VALUES(`alt`),
  `button_text` = VALUES(`button_text`),
  `button_link` = VALUES(`button_link`);

-- -------------------------------------------------------------
-- I18N — TR  (Enerjetik Masaj — 6 Yön)
-- -------------------------------------------------------------
INSERT INTO `slider_i18n`
(`slider_id`,`locale`,`name`,`slug`,`description`,`alt`,`button_text`,`button_link`)
VALUES
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990001-1111-4111-8111-aa9900000001'),
  'tr',
  'Evinize gelen rahatlama',
  'enerjetik-masaj-hosgeldiniz-slider',
  'Bonn''da evinizde profesyonel enerjetik masaj — bilinçli dokunuş, derin huzur ve hissedilir iyilik hali.',
  'Bonn''da enerjetik masaj ev ziyareti',
  'Randevu Al',
  '/appointment'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990002-1111-4111-8111-aa9900000002'),
  'tr',
  'Temel: Şükran Duygusu',
  'enerjetik-masaj-sukran-slider',
  'Her seans sessiz bir şükranla başlar — göğüste sıcak bir his, derin gevşeme için alanı açan bir başlangıç.',
  'Şükran duygusu ile başlayan enerjetik masaj',
  'Daha fazla bilgi',
  '/services/enerjetik-rahatlama-masaji'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990003-1111-4111-8111-aa9900000003'),
  'tr',
  'Bilinçli Dokunuş',
  'enerjetik-masaj-bilincli-slider',
  'Gözler kapalı, saygılı ve bilinçli dokunuş — tüm dikkat bedeninizin o an neye ihtiyacı olduğuna yönelir.',
  'Bilinçli dokunuş ile enerjetik masaj',
  'Daha fazla bilgi',
  '/services/enerjetik-rahatlama-masaji'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990004-1111-4111-8111-aa9900000004'),
  'tr',
  'Varış & Bırakış',
  'enerjetik-masaj-varis-slider',
  'Güvenli bir ortamda huzura kavuşun, günlük stresi geride bırakın ve bedeninizin gevşemesine izin verin.',
  'Enerjetik masajda varış ve bırakış',
  'Daha fazla bilgi',
  '/services/enerjetik-rahatlama-masaji'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990005-1111-4111-8111-aa9900000005'),
  'tr',
  'Net Sınırlar, Güvenli Alan',
  'enerjetik-masaj-sinirlar-slider',
  'Profesyonel sınırlar, temiz havlular ve saygılı bir atmosfer — kendinizi güvende ve rahat hissetmeniz için.',
  'Net sınırlar ve güvenli alan',
  'Daha fazla bilgi',
  '/services/enerjetik-rahatlama-masaji'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990006-1111-4111-8111-aa9900000006'),
  'tr',
  'Size geliyoruz',
  'enerjetik-masaj-bireysel-slider',
  'Her masaj size özel şekillenir — doğrudan evinizde, kendi ortamınızda.',
  'Enerjetik masaj ev ziyareti',
  'Randevu Al',
  '/appointment'
)
ON DUPLICATE KEY UPDATE
  `name`        = VALUES(`name`),
  `slug`        = VALUES(`slug`),
  `description` = VALUES(`description`),
  `alt`         = VALUES(`alt`),
  `button_text` = VALUES(`button_text`),
  `button_link` = VALUES(`button_link`);

-- -------------------------------------------------------------
-- I18N — EN  (Energetic Massage — 6 Aspects)
-- -------------------------------------------------------------
INSERT INTO `slider_i18n`
(`slider_id`,`locale`,`name`,`slug`,`description`,`alt`,`button_text`,`button_link`)
VALUES
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990001-1111-4111-8111-aa9900000001'),
  'en',
  'Relaxation that comes to your home',
  'energetic-massage-welcome-slider',
  'Professional energetic massage at your home in Bonn — mindful touch, deep calm and tangible well-being.',
  'Energetic massage home visit in Bonn',
  'Book Appointment',
  '/appointment'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990002-1111-4111-8111-aa9900000002'),
  'en',
  'Gratitude as Foundation',
  'energetic-massage-gratitude-slider',
  'Every session begins with silent gratitude — a warm feeling in the chest that opens the space for deep relaxation.',
  'Gratitude as the foundation of energetic massage',
  'Learn more',
  '/services/energetic-relaxation-massage'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990003-1111-4111-8111-aa9900000003'),
  'en',
  'Mindful Touch',
  'energetic-massage-mindful-slider',
  'Conscious, respectful touch with closed eyes — full attention on what your body needs right now.',
  'Mindful touch during energetic massage',
  'Learn more',
  '/services/energetic-relaxation-massage'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990004-1111-4111-8111-aa9900000004'),
  'en',
  'Arriving & Letting Go',
  'energetic-massage-arriving-slider',
  'Find stillness in a protected space, leave the everyday behind, and allow your body to release.',
  'Arriving and letting go during energetic massage',
  'Learn more',
  '/services/energetic-relaxation-massage'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990005-1111-4111-8111-aa9900000005'),
  'en',
  'Clear Boundaries, Safe Space',
  'energetic-massage-boundaries-slider',
  'Professional boundaries, fresh towels, and a respectful atmosphere — so you can feel safe and held.',
  'Clear boundaries and safe space',
  'Learn more',
  '/services/energetic-relaxation-massage'
),
(
  (SELECT `id` FROM `slider` WHERE `uuid`='aa990006-1111-4111-8111-aa9900000006'),
  'en',
  'We come to you',
  'energetic-massage-individual-slider',
  'Each massage is tailored to you — directly at your home, in your familiar environment.',
  'Energetic massage home visit',
  'Book Appointment',
  '/appointment'
)
ON DUPLICATE KEY UPDATE
  `name`        = VALUES(`name`),
  `slug`        = VALUES(`slug`),
  `description` = VALUES(`description`),
  `alt`         = VALUES(`alt`),
  `button_text` = VALUES(`button_text`),
  `button_link` = VALUES(`button_link`);

COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
