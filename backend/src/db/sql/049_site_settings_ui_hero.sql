-- =============================================================
-- 049_site_settings_ui_hero.sql (FINAL — Energetische Massage)
-- energetische-massage-bonn - UI Hero (site_settings.ui_hero)
--  - Key: ui_hero
--  - Value: JSON (stored as TEXT)
--  - Localized: tr / en / de
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO site_settings (id, `key`, locale, `value`, created_at, updated_at) VALUES
(
  UUID(),
  'ui_hero',
  'tr',
  CAST(JSON_OBJECT(
    'ui_hero_variant', 'v3',
    'ui_hero_kicker_prefix', '',
    'ui_hero_kicker_brand',  'Bonn''da Enerjetik Masaj',

    'ui_hero_title_fallback',
      'Evinize gelen rahatlama',
    'ui_hero_desc_fallback',
      'Kendi evinizde profesyonel enerjetik masaj — bilinçli dokunuş, derin huzur ve hissedilir bir iyilik hali.',
    'ui_hero_badge', 'Bonn ve Çevresinde Ev Ziyareti',
    'ui_hero_cta', 'Randevu Al',
    'ui_hero_cta_secondary', 'Daha Fazla',

    'ui_hero_prev', 'Önceki slayt',
    'ui_hero_next', 'Sonraki slayt'
  ) AS CHAR),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_hero',
  'en',
  CAST(JSON_OBJECT(
    'ui_hero_variant', 'v3',
    'ui_hero_kicker_prefix', '',
    'ui_hero_kicker_brand',  'Energetic Massage in Bonn',

    'ui_hero_title_fallback',
      'Relaxation that comes to your home',
    'ui_hero_desc_fallback',
      'Professional energetic massage in your familiar environment — mindful touch, deep calm and tangible well-being.',
    'ui_hero_badge', 'Home Visit in Bonn & Surroundings',
    'ui_hero_cta', 'Book Appointment',
    'ui_hero_cta_secondary', 'Learn More',

    'ui_hero_prev', 'Previous slide',
    'ui_hero_next', 'Next slide'
  ) AS CHAR),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_hero',
  'de',
  CAST(JSON_OBJECT(
    'ui_hero_variant', 'v3',
    'ui_hero_kicker_prefix', '',
    'ui_hero_kicker_brand',  'Energetische Massage in Bonn',

    'ui_hero_title_fallback',
      'Entspannung, die zu Ihnen nach Hause kommt',
    'ui_hero_desc_fallback',
      'Professionelle energetische Massage in Ihrer vertrauten Umgebung — achtsame Berührung, tiefe Ruhe und spürbares Wohlbefinden.',
    'ui_hero_badge', 'Hausbesuch in Bonn & Umgebung',
    'ui_hero_cta', 'Termin Buchen',
    'ui_hero_cta_secondary', 'Mehr Erfahren',

    'ui_hero_prev', 'Vorherige Folie',
    'ui_hero_next', 'Nächste Folie'
  ) AS CHAR),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);
