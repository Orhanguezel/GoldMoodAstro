-- ===================================================================
-- FILE: 110.1_telegram_inbound_messages.seed.sql
-- Telegram inbound messages sample seeds (Energetische Massage)
-- ===================================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO `telegram_inbound_messages` (
  `id`,
  `update_id`,
  `message_id`,
  `chat_id`,
  `chat_type`,
  `chat_title`,
  `chat_username`,
  `from_id`,
  `from_username`,
  `from_first_name`,
  `from_last_name`,
  `from_is_bot`,
  `text`,
  `raw`,
  `telegram_date`,
  `created_at`
) VALUES

-- 1) Private chat, customer message
(
  '9a6c0e2a-0a44-4e35-9cdd-0c54d2c1a001',
  10000001,
  501,
  '123456789',
  'private',
  NULL,
  'kunde_user',
  '123456789',
  'kunde_user',
  'Max',
  'Müller',
  0,
  'Hallo, ich möchte einen Termin für eine Thai-Massage buchen.',
  '{ "update_id": 10000001, "message": { "message_id": 501, "chat": { "id": 123456789, "type": "private", "username": "kunde_user" }, "from": { "id": 123456789, "is_bot": false, "first_name": "Max", "last_name": "Müller", "username": "kunde_user" }, "date": 1737040000, "text": "Hallo, ich möchte einen Termin für eine Thai-Massage buchen." } }',
  1737040000,
  NOW(3)
),

-- 2) Group chat message
(
  '9a6c0e2a-0a44-4e35-9cdd-0c54d2c1a002',
  10000002,
  777,
  '-100987654321',
  'group',
  'Energetische Massage Team',
  'energetische_massage',
  '222333444',
  'massage_team',
  'Team',
  'Energetische',
  0,
  'Neuer Termin wurde bestätigt.',
  '{ "update_id": 10000002, "message": { "message_id": 777, "chat": { "id": -100987654321, "type": "group", "title": "Energetische Massage Team", "username": "energetische_massage" }, "from": { "id": 222333444, "is_bot": false, "first_name": "Team", "last_name": "Energetische", "username": "massage_team" }, "date": 1737040100, "text": "Neuer Termin wurde bestätigt." } }',
  1737040100,
  NOW(3)
),

-- 3) Update without message_id
(
  '9a6c0e2a-0a44-4e35-9cdd-0c54d2c1a003',
  10000003,
  NULL,
  '123456789',
  'private',
  NULL,
  'kunde_user',
  '123456789',
  'kunde_user',
  'Max',
  'Müller',
  0,
  NULL,
  '{ "update_id": 10000003, "some_other_update": { "note": "Update-Typ ohne message_id" } }',
  1737040200,
  NOW(3)
)

ON DUPLICATE KEY UPDATE
  `chat_id`        = VALUES(`chat_id`),
  `chat_type`      = VALUES(`chat_type`),
  `chat_title`     = VALUES(`chat_title`),
  `chat_username`  = VALUES(`chat_username`),
  `from_id`        = VALUES(`from_id`),
  `from_username`  = VALUES(`from_username`),
  `from_first_name`= VALUES(`from_first_name`),
  `from_last_name` = VALUES(`from_last_name`),
  `from_is_bot`    = VALUES(`from_is_bot`),
  `text`           = VALUES(`text`),
  `raw`            = VALUES(`raw`),
  `telegram_date`  = VALUES(`telegram_date`),
  `created_at`     = VALUES(`created_at`);
