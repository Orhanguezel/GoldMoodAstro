-- 002_auth_seed.sql (SIMPLE, rerunnable)
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET collation_connection = 'utf8mb4_unicode_ci';
SET time_zone = '+00:00';

START TRANSACTION;

INSERT IGNORE INTO users
(id, email, password_hash, full_name, phone, is_active, email_verified, reset_token, reset_token_expires, created_at, updated_at, last_sign_in_at) VALUES
('0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'mehmet@gmail.com',               '$2b$12$temporary.hash.needs.reset', 'Mehmet Kuber',     '05454905148', 1, 0, NULL, NULL, '2025-10-07 09:49:06.000', '2025-10-16 09:26:05.000', NULL),
('19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 'hostingisletmesi@gmail.com',      '$2b$12$temporary.hash.needs.reset', 'Nuri Muh',         '05414417854', 1, 0, NULL, NULL, '2025-10-13 15:07:15.000', '2025-10-16 09:26:05.000', NULL),
('4a8fb7f7-0668-4429-9309-fe88ac90eed2', 'mlhgs1@gmail.com',                '$2b$12$temporary.hash.needs.reset', 'Sultan Abdü',      '05427354197', 1, 0, NULL, NULL, '2025-10-13 20:14:20.000', '2025-10-16 09:26:05.000', NULL),
('7129bc31-88dc-42da-ab80-415a21f2ea9a', 'melihkececi@yandex.com',          '$2b$12$temporary.hash.needs.reset', 'Melih Keçeci',     NULL,          1, 0, NULL, NULL, '2025-10-06 18:08:24.000', '2025-10-16 09:26:05.000', NULL),
('d279bb9d-797d-4972-a8bd-a77a40caba91', 'kececimelih@gmail.com',           '$2b$12$temporary.hash.needs.reset', 'Keçeci Melih',     '05425547474', 1, 0, NULL, NULL, '2025-10-14 07:49:48.000', '2025-10-16 09:26:05.000', NULL),

('2b3b1d07-6c05-4f61-bf6b-2f9d0c4c01b2', 'anastasia@energetische-massage-bonn.de',    '$2b$12$temporary.hash.needs.reset', 'Anastasia Königs', NULL,          1, 1, NULL, NULL, CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3), NULL);

INSERT IGNORE INTO profiles (id, full_name, phone, created_at, updated_at) VALUES
('0ac37a5c-a8be-4d25-b853-1e5c9574c1b3', 'Mehmet Kuber',     '05454905148', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('19a2bc26-63d1-43ad-ab56-d7f3c3719a34', 'Nuri Muh',         '05414417854', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('4a8fb7f7-0668-4429-9309-fe88ac90eed2', 'Sultan Abdü',      '05427354197', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('7129bc31-88dc-42da-ab80-415a21f2ea9a', 'Melih Keçeci',     NULL,          CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('d279bb9d-797d-4972-a8bd-a77a40caba91', 'Keçeci Melih',     '05425547474', CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
('2b3b1d07-6c05-4f61-bf6b-2f9d0c4c01b2', 'Anastasia König', NULL,          CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));

COMMIT;

