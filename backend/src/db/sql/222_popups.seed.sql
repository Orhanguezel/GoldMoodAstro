-- ============================================================
-- 222_popups.seed.sql
-- Services page popup seeds (Gutschein)
-- Idempotent via unique uuid
-- ============================================================

-- Popup #1 (topbar)
INSERT INTO `popups` (
  `uuid`,
  `type`,
  `title`,
  `content`,
  `background_color`,
  `text_color`,
  `button_text`,
  `button_color`,
  `button_hover_color`,
  `button_text_color`,
  `link_url`,
  `link_target`,
  `target_paths`,
  `text_behavior`,
  `scroll_speed`,
  `closeable`,
  `delay_seconds`,
  `display_frequency`,
  `is_active`,
  `display_order`,
  `start_at`,
  `end_at`
) VALUES (
  '17ac8b8a-bf13-4f2d-8c6c-112875e23b31',
  'topbar',
  'Geschenk-Gutschein fur eine Auszeit',
  'Sie mochten jemandem wohltuende Ruhe schenken? Auf der Services-Seite konnen Sie direkt einen Gutschein fur die energetische Entspannungsmassage anfragen.',
  '#7a3e1d',
  '#fff7ed',
  'Gutschein anfragen',
  '#fff7ed',
  '#ffedd5',
  '#7a3e1d',
  '/contact',
  '_self',
  JSON_ARRAY('/services', '/services/*'),
  'marquee',
  45,
  1,
  0,
  'daily',
  1,
  10,
  NULL,
  NULL
) ON DUPLICATE KEY UPDATE
  `type` = VALUES(`type`),
  `title` = VALUES(`title`),
  `content` = VALUES(`content`),
  `background_color` = VALUES(`background_color`),
  `text_color` = VALUES(`text_color`),
  `button_text` = VALUES(`button_text`),
  `button_color` = VALUES(`button_color`),
  `button_hover_color` = VALUES(`button_hover_color`),
  `button_text_color` = VALUES(`button_text_color`),
  `link_url` = VALUES(`link_url`),
  `link_target` = VALUES(`link_target`),
  `target_paths` = VALUES(`target_paths`),
  `text_behavior` = VALUES(`text_behavior`),
  `scroll_speed` = VALUES(`scroll_speed`),
  `closeable` = VALUES(`closeable`),
  `delay_seconds` = VALUES(`delay_seconds`),
  `display_frequency` = VALUES(`display_frequency`),
  `is_active` = VALUES(`is_active`),
  `display_order` = VALUES(`display_order`),
  `start_at` = VALUES(`start_at`),
  `end_at` = VALUES(`end_at`);

-- Popup #2 (sidebar center)
INSERT INTO `popups` (
  `uuid`,
  `type`,
  `title`,
  `content`,
  `background_color`,
  `text_color`,
  `button_text`,
  `button_color`,
  `button_hover_color`,
  `button_text_color`,
  `link_url`,
  `link_target`,
  `target_paths`,
  `text_behavior`,
  `scroll_speed`,
  `closeable`,
  `delay_seconds`,
  `display_frequency`,
  `is_active`,
  `display_order`,
  `start_at`,
  `end_at`
) VALUES (
  '6d168f0f-0f93-4de1-a23e-1d87b4cc7a11',
  'sidebar_center',
  'Verschenken Sie Entspannung',
  'Ein liebevoller Gutschein fur die Energetische Entspannungsmassage ist eine besondere Aufmerksamkeit fur Menschen, denen Sie bewusst etwas Gutes tun mochten.',
  '#fff7ed',
  '#7c2d12',
  'Jetzt verschenken',
  '#9a3412',
  '#7c2d12',
  '#ffffff',
  '/contact',
  '_self',
  JSON_ARRAY('/services', '/services/*'),
  'static',
  60,
  1,
  2,
  'once',
  1,
  20,
  NULL,
  NULL
) ON DUPLICATE KEY UPDATE
  `type` = VALUES(`type`),
  `title` = VALUES(`title`),
  `content` = VALUES(`content`),
  `background_color` = VALUES(`background_color`),
  `text_color` = VALUES(`text_color`),
  `button_text` = VALUES(`button_text`),
  `button_color` = VALUES(`button_color`),
  `button_hover_color` = VALUES(`button_hover_color`),
  `button_text_color` = VALUES(`button_text_color`),
  `link_url` = VALUES(`link_url`),
  `link_target` = VALUES(`link_target`),
  `target_paths` = VALUES(`target_paths`),
  `text_behavior` = VALUES(`text_behavior`),
  `scroll_speed` = VALUES(`scroll_speed`),
  `closeable` = VALUES(`closeable`),
  `delay_seconds` = VALUES(`delay_seconds`),
  `display_frequency` = VALUES(`display_frequency`),
  `is_active` = VALUES(`is_active`),
  `display_order` = VALUES(`display_order`),
  `start_at` = VALUES(`start_at`),
  `end_at` = VALUES(`end_at`);

SET @POPUP_TOPBAR_ID := (
  SELECT `id` FROM `popups` WHERE `uuid` = '17ac8b8a-bf13-4f2d-8c6c-112875e23b31' LIMIT 1
);

SET @POPUP_SIDEBAR_ID := (
  SELECT `id` FROM `popups` WHERE `uuid` = '6d168f0f-0f93-4de1-a23e-1d87b4cc7a11' LIMIT 1
);

-- i18n: de / tr / en
INSERT INTO `popups_i18n` (`popup_id`, `locale`, `title`, `content`, `button_text`, `alt`)
VALUES
  (@POPUP_TOPBAR_ID, 'de', 'Geschenk-Gutschein fur eine Auszeit', 'Sie mochten jemandem wohltuende Ruhe schenken? Auf der Services-Seite konnen Sie direkt einen Gutschein fur die energetische Entspannungsmassage anfragen.', 'Gutschein anfragen', 'Hinweis zum Geschenk-Gutschein'),
  (@POPUP_TOPBAR_ID, 'tr', 'Hediye kuponu ile rahatlama armağan edin', 'Sevdiginiz birine energetik rahatlama masaji icin hediye kuponu dusunuyorsaniz hizmetler sayfasindan bize kolayca ulasabilirsiniz.', 'Gutschein sor', 'Hediye kuponu bildirimi'),
  (@POPUP_TOPBAR_ID, 'en', 'Gift a calming experience', 'If you would like to give someone a voucher for the energetic relaxation massage, you can contact us directly from the services page.', 'Request voucher', 'Gift voucher notice'),

  (@POPUP_SIDEBAR_ID, 'de', 'Verschenken Sie Entspannung', 'Ein liebevoller Gutschein fur die Energetische Entspannungsmassage ist eine besondere Aufmerksamkeit fur Menschen, denen Sie bewusst etwas Gutes tun mochten.', 'Jetzt verschenken', 'Geschenk-Gutschein Popup'),
  (@POPUP_SIDEBAR_ID, 'tr', 'Arkadasiniza huzurlu bir hediye verin', 'Enerjetik rahatlama masaji icin dusunceli bir hediye kuponu, gercekten iyi hissettiren ozel bir surpriz olabilir.', 'Bilgi al', 'Hediye kuponu popup'),
  (@POPUP_SIDEBAR_ID, 'en', 'Give the gift of relaxation', 'A thoughtful voucher for the energetic relaxation massage can be a warm and memorable gift.', 'Learn more', 'Gift voucher popup')
ON DUPLICATE KEY UPDATE
  `title` = VALUES(`title`),
  `content` = VALUES(`content`),
  `button_text` = VALUES(`button_text`),
  `alt` = VALUES(`alt`),
  `updated_at` = CURRENT_TIMESTAMP(3);

-- ============================================================
-- Popup #3 (bottombar — home visit notice, marquee)
-- ============================================================
INSERT INTO `popups` (
  `uuid`,
  `type`,
  `title`,
  `content`,
  `background_color`,
  `text_color`,
  `button_text`,
  `button_color`,
  `button_hover_color`,
  `button_text_color`,
  `link_url`,
  `link_target`,
  `target_paths`,
  `text_behavior`,
  `scroll_speed`,
  `closeable`,
  `delay_seconds`,
  `display_frequency`,
  `is_active`,
  `display_order`,
  `start_at`,
  `end_at`
) VALUES (
  'c4a2e9d1-7b38-4f6a-9c15-3e8d1a5f7b20',
  'bottombar',
  'Wir kommen zu Ihnen nach Hause!',
  'Unsere Massagen finden derzeit ausschliesslich bei Ihnen zu Hause statt — bequem, entspannt und ganz privat.',
  '#fef3c7',
  '#92400e',
  'Termin buchen',
  '#92400e',
  '#78350f',
  '#ffffff',
  '/de/appointment',
  '_self',
  JSON_ARRAY('/', '/appointment', '/services', '/services/*'),
  'marquee',
  35,
  1,
  0,
  'always',
  1,
  5,
  NULL,
  NULL
) ON DUPLICATE KEY UPDATE
  `type` = VALUES(`type`),
  `title` = VALUES(`title`),
  `content` = VALUES(`content`),
  `background_color` = VALUES(`background_color`),
  `text_color` = VALUES(`text_color`),
  `button_text` = VALUES(`button_text`),
  `button_color` = VALUES(`button_color`),
  `button_hover_color` = VALUES(`button_hover_color`),
  `button_text_color` = VALUES(`button_text_color`),
  `link_url` = VALUES(`link_url`),
  `link_target` = VALUES(`link_target`),
  `target_paths` = VALUES(`target_paths`),
  `text_behavior` = VALUES(`text_behavior`),
  `scroll_speed` = VALUES(`scroll_speed`),
  `closeable` = VALUES(`closeable`),
  `delay_seconds` = VALUES(`delay_seconds`),
  `display_frequency` = VALUES(`display_frequency`),
  `is_active` = VALUES(`is_active`),
  `display_order` = VALUES(`display_order`),
  `start_at` = VALUES(`start_at`),
  `end_at` = VALUES(`end_at`);

SET @POPUP_BOTTOMBAR_ID := (
  SELECT `id` FROM `popups` WHERE `uuid` = 'c4a2e9d1-7b38-4f6a-9c15-3e8d1a5f7b20' LIMIT 1
);

INSERT INTO `popups_i18n` (`popup_id`, `locale`, `title`, `content`, `button_text`, `alt`)
VALUES
  (@POPUP_BOTTOMBAR_ID, 'de', 'Wir kommen zu Ihnen nach Hause!', 'Unsere Massagen finden derzeit ausschliesslich bei Ihnen zu Hause statt — bequem, entspannt und ganz privat.', 'Termin buchen', 'Hausbesuch-Hinweis'),
  (@POPUP_BOTTOMBAR_ID, 'tr', 'Masajimiz evinize gelir!', 'Masaj hizmetlerimizi su anda yalnizca ev ziyareti olarak sunuyoruz — rahat, huzurlu ve tamamen ozel.', 'Randevu al', 'Ev ziyareti bildirimi'),
  (@POPUP_BOTTOMBAR_ID, 'en', 'We come to your home!', 'Our massage services are currently offered exclusively as home visits — comfortable, relaxed and completely private.', 'Book appointment', 'Home visit notice')
ON DUPLICATE KEY UPDATE
  `title` = VALUES(`title`),
  `content` = VALUES(`content`),
  `button_text` = VALUES(`button_text`),
  `alt` = VALUES(`alt`),
  `updated_at` = CURRENT_TIMESTAMP(3);
