INSERT INTO users (id, email, password_hash, full_name, phone, role, is_active, email_verified) VALUES
('10000000-0000-4000-8000-000000000001','consultant1@example.test',@ADMIN_PASSWORD_HASH,'Test Consultant 1','+905551111111','consultant',1,1),
('10000000-0000-4000-8000-000000000002','consultant2@example.test',@ADMIN_PASSWORD_HASH,'Test Consultant 2','+905552222222','consultant',1,1),
('10000000-0000-4000-8000-000000000003','consultant3@example.test',@ADMIN_PASSWORD_HASH,'Test Consultant 3','+905553333333','consultant',1,1)
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), role = VALUES(role);

INSERT INTO user_roles (id, user_id, role) VALUES
('aaaaaaaa-0000-4000-8000-000000000101','10000000-0000-4000-8000-000000000001','consultant'),
('aaaaaaaa-0000-4000-8000-000000000102','10000000-0000-4000-8000-000000000002','consultant'),
('aaaaaaaa-0000-4000-8000-000000000103','10000000-0000-4000-8000-000000000003','consultant')
ON DUPLICATE KEY UPDATE role = VALUES(role);

INSERT INTO consultants (id, user_id, bio, expertise, languages, session_price, session_duration, currency, approval_status, is_available, rating_avg, rating_count, total_sessions) VALUES
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Dogum haritasi ve iliski uyumu danismani.','["astrology","birth_chart","relationship"]','["tr","en"]',850.00,30,'TRY','approved',1,4.90,42,126),
('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','Tarot ve numeroloji seanslari sunar.','["tarot","numerology"]','["tr"]',650.00,30,'TRY','approved',1,4.75,31,88),
('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000003','Kariyer ve donemsel astroloji danismanligi.','["astrology","mood","career"]','["tr","en"]',950.00,45,'TRY','approved',1,4.85,27,64)
ON DUPLICATE KEY UPDATE bio = VALUES(bio), expertise = VALUES(expertise), session_price = VALUES(session_price);
