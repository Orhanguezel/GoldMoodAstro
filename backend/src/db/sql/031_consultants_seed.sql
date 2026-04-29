-- avatar_url 141_storage_seed.sql tarafından storage_assets.public_url üzerinden set edilir.
INSERT INTO users (id, email, password_hash, full_name, phone, role, is_active, email_verified) VALUES
('10000000-0000-4000-8000-000000000001','zeynep.yildiz@goldmood.test',@ADMIN_PASSWORD_HASH,'Zeynep Yıldız','+905551111111','consultant',1,1),
('10000000-0000-4000-8000-000000000002','omer.toprak@goldmood.test',@ADMIN_PASSWORD_HASH,'Ömer Toprak','+905552222222','consultant',1,1),
('10000000-0000-4000-8000-000000000003','selin.ay@goldmood.test',@ADMIN_PASSWORD_HASH,'Selin Ay','+905553333333','consultant',1,1)
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), role = VALUES(role);

-- Seçenek A: Proje ortakları admin role korur, ek olarak consultant rolü alır.
-- (002_auth_seed.sql'de role='admin', burada user_roles tablosuna 'consultant' eklenir
--  → admin paneline girer, consultants listesinde görünür, danışman endpoint'lerine erişir)
INSERT INTO user_roles (id, user_id, role) VALUES
('aaaaaaaa-0000-4000-8000-000000000101','10000000-0000-4000-8000-000000000001','consultant'),
('aaaaaaaa-0000-4000-8000-000000000102','10000000-0000-4000-8000-000000000002','consultant'),
('aaaaaaaa-0000-4000-8000-000000000103','10000000-0000-4000-8000-000000000003','consultant'),
('aaaaaaaa-0000-4000-8000-000000000104','10000000-0000-4000-8000-0000000000b1','consultant'),
('aaaaaaaa-0000-4000-8000-000000000105','10000000-0000-4000-8000-0000000000b2','consultant'),
('aaaaaaaa-0000-4000-8000-000000000106','10000000-0000-4000-8000-0000000000b3','consultant'),
('aaaaaaaa-0000-4000-8000-000000000107','10000000-0000-4000-8000-0000000000b4','consultant')
ON DUPLICATE KEY UPDATE role = VALUES(role);

INSERT INTO consultants (
  id, user_id, slug, bio, expertise, languages,
  session_price, session_duration, supports_video, video_session_price,
  currency, approval_status, is_available, rating_avg, rating_count, total_sessions
) VALUES
-- TEST FİYATLARI: ücretli danışmanlar 5₺ (Iyzipay sandbox + UI test için).
-- Prod'a geçerken admin panelden gerçek fiyatlara çekilecek.
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','zeynep-yildiz','20 yıllık astroloji deneyimiyle doğum haritası, yıllık öngörüler ve ilişki analizi konularında uzmanlaşmış kıdemli danışman.','["astrology","birth_chart","relationship"]','["tr","en"]',5.00,30,1,5.00,'TRY','approved',1,4.90,42,126),
('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','omer-toprak','Sayıların gizemli dünyasında rehberiniz. Hayat yolu analizi ve isim enerjisi üzerine derinleşen numeroloji ve tarot uzmanı.','["tarot","numerology"]','["tr"]',5.00,30,0,NULL,'TRY','approved',1,4.75,31,88),
('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000003','selin-ay','Modern spiritualite ile kadim bilgeliği birleştiren ruhsal rehber. Sezgisel astroloji ve yaşam koçluğu seansları sunmaktadır.','["astrology","mood","career"]','["tr","en"]',5.00,45,1,5.00,'TRY','approved',1,4.85,27,64),
-- Proje ortakları (admin + consultant) — ücretsiz
('20000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-0000000000b1','murat-kisikcilar','Proje ortağı ve stratejik danışman. Detaylı bio admin panelden eklenecek.','["astrology"]','["tr"]',0.00,30,1,0.00,'TRY','approved',1,5.00,0,0),
('20000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-0000000000b2','pinar-demircioglu','Proje ortağı ve danışman. Detaylı bio admin panelden eklenecek.','["astrology","mood"]','["tr"]',0.00,30,1,0.00,'TRY','approved',1,5.00,0,0),
('20000000-0000-4000-8000-000000000006','10000000-0000-4000-8000-0000000000b3','fatma-guclu','Hayatım boyunca yaşadığım döngüleri ve zorlukları anlamak için bir yol aradım. Bu yolda astroloji bana rehberlik etti. Doğum haritası analizi, ilişki danışmanlığı, horary astroloji ve rektifikasyon hizmetlerinde uzmanım.','["astrology","birth_chart","relationship"]','["tr"]',5.00,45,1,5.00,'TRY','approved',1,4.95,25,0),
-- Test danışmanı (ücretsiz görüşme)
('20000000-0000-4000-8000-000000000007','10000000-0000-4000-8000-0000000000b4','test-danisman','Test danışmanı — sistem testleri için ücretsiz görüşme yapar. Gerçek bir profil değildir, geliştirme/QA amaçlıdır.','["astrology","tarot","numerology","mood"]','["tr","en"]',0.00,15,1,0.00,'TRY','approved',1,5.00,0,0)
ON DUPLICATE KEY UPDATE slug = VALUES(slug), bio = VALUES(bio), expertise = VALUES(expertise), session_price = VALUES(session_price),
  supports_video = VALUES(supports_video), video_session_price = VALUES(video_session_price);
