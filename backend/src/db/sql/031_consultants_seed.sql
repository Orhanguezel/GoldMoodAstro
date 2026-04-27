-- avatar_url 141_storage_seed.sql tarafından storage_assets.public_url üzerinden set edilir.
INSERT INTO users (id, email, password_hash, full_name, phone, role, is_active, email_verified) VALUES
('10000000-0000-4000-8000-000000000001','zeynep.yildiz@goldmood.test',@ADMIN_PASSWORD_HASH,'Zeynep Yıldız','+905551111111','consultant',1,1),
('10000000-0000-4000-8000-000000000002','omer.toprak@goldmood.test',@ADMIN_PASSWORD_HASH,'Ömer Toprak','+905552222222','consultant',1,1),
('10000000-0000-4000-8000-000000000003','selin.ay@goldmood.test',@ADMIN_PASSWORD_HASH,'Selin Ay','+905553333333','consultant',1,1)
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), role = VALUES(role);

INSERT INTO user_roles (id, user_id, role) VALUES
('aaaaaaaa-0000-4000-8000-000000000101','10000000-0000-4000-8000-000000000001','consultant'),
('aaaaaaaa-0000-4000-8000-000000000102','10000000-0000-4000-8000-000000000002','consultant'),
('aaaaaaaa-0000-4000-8000-000000000103','10000000-0000-4000-8000-000000000003','consultant')
ON DUPLICATE KEY UPDATE role = VALUES(role);

INSERT INTO consultants (
  id, user_id, slug, bio, expertise, languages,
  session_price, session_duration, supports_video, video_session_price,
  currency, approval_status, is_available, rating_avg, rating_count, total_sessions
) VALUES
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','zeynep-yildiz','20 yıllık astroloji deneyimiyle doğum haritası, yıllık öngörüler ve ilişki analizi konularında uzmanlaşmış kıdemli danışman.','["astrology","birth_chart","relationship"]','["tr","en"]',850.00,30,1,1200.00,'TRY','approved',1,4.90,42,126),
('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','omer-toprak','Sayıların gizemli dünyasında rehberiniz. Hayat yolu analizi ve isim enerjisi üzerine derinleşen numeroloji ve tarot uzmanı.','["tarot","numerology"]','["tr"]',650.00,30,0,NULL,'TRY','approved',1,4.75,31,88),
('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000003','selin-ay','Modern spiritualite ile kadim bilgeliği birleştiren ruhsal rehber. Sezgisel astroloji ve yaşam koçluğu seansları sunmaktadır.','["astrology","mood","career"]','["tr","en"]',950.00,45,1,1380.00,'TRY','approved',1,4.85,27,64)
ON DUPLICATE KEY UPDATE slug = VALUES(slug), bio = VALUES(bio), expertise = VALUES(expertise), session_price = VALUES(session_price),
  supports_video = VALUES(supports_video), video_session_price = VALUES(video_session_price);
