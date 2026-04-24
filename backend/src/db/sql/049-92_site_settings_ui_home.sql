-- =============================================================
-- FILE: 049-92_site_settings_ui_home.sql (FINAL — Energetische Massage)
--  - FIX 1093: no SELECT from site_settings inside INSERT
--  - Adds ui_home_meta_title / ui_home_meta_description
--  - Prevents Title == H1
--  - Removes "&" from meta titles
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO `site_settings`
  (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`)
VALUES
(
  UUID(),
  'ui_home',
  'tr',
  CAST(JSON_OBJECT(
    'ui_home_h1', 'Energetische Massage - Bonn''da Evinize Gelen Masaj',
    'ui_home_meta_title', 'Energetische Massage - Bonn''da Evinize Gelen Enerjetik Masaj',
    'ui_home_meta_description', 'Bonn''da evinizde profesyonel enerjetik masaj: bilinçli dokunuş, derin gevşeme ve beden farkındalığı. Ev ziyareti ile. Hemen randevu alın!'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_home',
  'en',
  CAST(JSON_OBJECT(
    'ui_home_h1', 'Energetische Massage - Home Visit Massage in Bonn',
    'ui_home_meta_title', 'Energetische Massage - Energetic Massage at Your Home in Bonn',
    'ui_home_meta_description', 'Professional energetic massage at your home in Bonn: mindful touch, deep relaxation and body awareness. Home visit service. Book your session now!'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_home',
  'de',
  CAST(JSON_OBJECT(
    'ui_home_h1', 'Energetische Massage - Hausbesuch in Bonn',
    'ui_home_meta_title', 'Energetische Massage Bonn - Premium Massage bei Ihnen zu Hause',
    'ui_home_meta_description', 'Energetische Massage direkt bei Ihnen zu Hause in Bonn — achtsame Berührung, tiefe Entspannung und Wohlbefinden. Hausbesuch-Service. Jetzt Termin buchen!'
  ) AS CHAR CHARACTER SET utf8mb4),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);
