-- avatar_url 141_storage_seed.sql tarafından storage_assets.public_url üzerinden set edilir.
-- INSERT IGNORE: yeni kurulumda demo test danışmanlarını ekler, mevcut kurulumda
-- HİÇBİR ALANI ezmez. Daha önce ON DUPLICATE KEY UPDATE kullanılırken her --seed
-- canlıda gerçek consultant bio'larını seed default ile eziyordu (2026-05-21).
INSERT IGNORE INTO users (id, email, password_hash, full_name, phone, role, is_active, email_verified) VALUES
('10000000-0000-4000-8000-000000000001','zeynep.yildiz@goldmood.test',@ADMIN_PASSWORD_HASH,'Zeynep Yıldız','+905551111111','consultant',1,1),
('10000000-0000-4000-8000-000000000002','omer.toprak@goldmood.test',@ADMIN_PASSWORD_HASH,'Ömer Toprak','+905552222222','consultant',1,1),
('10000000-0000-4000-8000-000000000003','selin.ay@goldmood.test',@ADMIN_PASSWORD_HASH,'Selin Ay','+905553333333','consultant',1,1);

-- Seçenek A: Proje ortakları admin role korur, ek olarak consultant rolü alır.
-- (002_auth_seed.sql'de role='admin', burada user_roles tablosuna 'consultant' eklenir
--  → admin paneline girer, consultants listesinde görünür, danışman endpoint'lerine erişir)
-- INSERT IGNORE: role bilgisi user_roles'e yalnız yoksa eklensin; varsa dokunma.
INSERT IGNORE INTO user_roles (id, user_id, role) VALUES
('aaaaaaaa-0000-4000-8000-000000000101','10000000-0000-4000-8000-000000000001','consultant'),
('aaaaaaaa-0000-4000-8000-000000000102','10000000-0000-4000-8000-000000000002','consultant'),
('aaaaaaaa-0000-4000-8000-000000000103','10000000-0000-4000-8000-000000000003','consultant'),
('aaaaaaaa-0000-4000-8000-000000000104','10000000-0000-4000-8000-0000000000b1','consultant'),
('aaaaaaaa-0000-4000-8000-000000000105','10000000-0000-4000-8000-0000000000b2','consultant'),
('aaaaaaaa-0000-4000-8000-000000000106','10000000-0000-4000-8000-0000000000b3','consultant'),
('aaaaaaaa-0000-4000-8000-000000000107','10000000-0000-4000-8000-0000000000b4','consultant');

-- INSERT IGNORE: consultant row YALNIZ yoksa (id+slug+user_id UNIQUE'lerinden hiçbiri
-- çakışmıyorsa) ekler. Mevcut row varsa hiçbir alanı (bio, expertise, languages, fiyat
-- vs.) ezmez. Üretimde admin/danışman içeriği düzenlerken seed her run'da ezilmemeli.
INSERT IGNORE INTO consultants (
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
('20000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-0000000000b2','pinar-demircioglu','Proje ortağı ve danışman. Detaylı bio admin panelden eklenecek.','["psikoloji","bilincalti_donusum","yasam_koclugu"]','["tr"]',0.00,30,1,0.00,'TRY','approved',1,5.00,0,0),
('20000000-0000-4000-8000-000000000006','10000000-0000-4000-8000-0000000000b3','fatma-guclu','Hayatım boyunca yaşadığım döngüleri ve zorlukları anlamak için bir yol aradım. Bu yolda astroloji bana rehberlik etti. Doğum haritası analizi, ilişki danışmanlığı, horary astroloji ve rektifikasyon hizmetlerinde uzmanım.','["astrology","birth_chart","relationship"]','["tr"]',5.00,45,1,5.00,'TRY','approved',1,4.95,25,0),
-- Test danışmanı (ücretsiz görüşme)
('20000000-0000-4000-8000-000000000007','10000000-0000-4000-8000-0000000000b4','test-danisman','Test danışmanı — sistem testleri için ücretsiz görüşme yapar. Gerçek bir profil değildir, geliştirme/QA amaçlıdır.','["astrology","tarot","numerology","mood"]','["tr","en"]',0.00,15,1,0.00,'TRY','approved',1,5.00,0,0);

-- Danışman bio/headline i18n seed'i. INSERT IGNORE canlıda/admin panelde
-- düzenlenmiş çeviri içeriğini ezmez; eksik satırları tamamlar.
INSERT IGNORE INTO consultant_i18n (id, consultant_id, locale, headline, bio) VALUES
('23000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','tr','Kıdemli Astroloji Danışmanı','20 yıllık astroloji deneyimiyle doğum haritası, yıllık öngörüler ve ilişki analizi konularında uzmanlaşmış kıdemli danışman.'),
('23000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001','en','Senior Astrology Consultant','A senior consultant with 20 years of astrology experience, specializing in birth charts, annual forecasts and relationship analysis.'),
('23000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000001','de','Erfahrene Astrologie-Beraterin','Eine erfahrene Beraterin mit 20 Jahren Astrologie-Erfahrung, spezialisiert auf Geburtshoroskope, Jahresprognosen und Beziehungsanalysen.'),
('23000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000002','tr','Numeroloji ve Tarot Uzmanı','Sayıların gizemli dünyasında rehberiniz. Hayat yolu analizi ve isim enerjisi üzerine derinleşen numeroloji ve tarot uzmanı.'),
('23000000-0000-4000-8000-000000000005','20000000-0000-4000-8000-000000000002','en','Numerology and Tarot Specialist','Your guide in the mysterious world of numbers. A numerology and tarot specialist focused on life path analysis and name energy.'),
('23000000-0000-4000-8000-000000000006','20000000-0000-4000-8000-000000000002','de','Numerologie- und Tarot-Spezialist','Ihr Begleiter in der geheimnisvollen Welt der Zahlen. Ein Numerologie- und Tarot-Spezialist mit Fokus auf Lebensweganalyse und Namensenergie.'),
('23000000-0000-4000-8000-000000000007','20000000-0000-4000-8000-000000000003','tr','Ruhsal Rehber ve Yaşam Koçu','Modern spiritualite ile kadim bilgeliği birleştiren ruhsal rehber. Sezgisel astroloji ve yaşam koçluğu seansları sunmaktadır.'),
('23000000-0000-4000-8000-000000000008','20000000-0000-4000-8000-000000000003','en','Spiritual Guide and Life Coach','A spiritual guide who blends modern spirituality with ancient wisdom. She offers intuitive astrology and life coaching sessions.'),
('23000000-0000-4000-8000-000000000009','20000000-0000-4000-8000-000000000003','de','Spirituelle Beraterin und Lebenscoach','Eine spirituelle Beraterin, die moderne Spiritualität mit alter Weisheit verbindet. Sie bietet intuitive Astrologie- und Life-Coaching-Sitzungen an.'),
('23000000-0000-4000-8000-00000000000a','20000000-0000-4000-8000-000000000004','tr','Stratejik Danışman','Proje ortağı ve stratejik danışman. Detaylı bio admin panelden eklenecek.'),
('23000000-0000-4000-8000-00000000000b','20000000-0000-4000-8000-000000000004','en','Strategic Consultant','Project partner and strategic consultant. A detailed bio will be added from the admin panel.'),
('23000000-0000-4000-8000-00000000000c','20000000-0000-4000-8000-000000000004','de','Strategischer Berater','Projektpartner und strategischer Berater. Eine ausführliche Bio wird im Admin-Panel ergänzt.'),
('23000000-0000-4000-8000-00000000000d','20000000-0000-4000-8000-000000000005','tr','Danışman ve Proje Ortağı','Proje ortağı ve danışman. Detaylı bio admin panelden eklenecek.'),
('23000000-0000-4000-8000-00000000000e','20000000-0000-4000-8000-000000000005','en','Consultant and Project Partner','Project partner and consultant. A detailed bio will be added from the admin panel.'),
('23000000-0000-4000-8000-00000000000f','20000000-0000-4000-8000-000000000005','de','Beraterin und Projektpartnerin','Projektpartnerin und Beraterin. Eine ausführliche Bio wird im Admin-Panel ergänzt.'),
('23000000-0000-4000-8000-000000000010','20000000-0000-4000-8000-000000000006','tr','Doğum Haritası ve İlişki Astrolojisi Uzmanı','Hayatım boyunca yaşadığım döngüleri ve zorlukları anlamak için bir yol aradım. Bu yolda astroloji bana rehberlik etti. Doğum haritası analizi, ilişki danışmanlığı, horary astroloji ve rektifikasyon hizmetlerinde uzmanım.'),
('23000000-0000-4000-8000-000000000011','20000000-0000-4000-8000-000000000006','en','Birth Chart and Relationship Astrology Expert','Throughout my life, I searched for a way to understand the cycles and challenges I experienced. Astrology guided me on that path. I specialize in birth chart analysis, relationship consulting, horary astrology and rectification.'),
('23000000-0000-4000-8000-000000000012','20000000-0000-4000-8000-000000000006','de','Expertin für Geburtshoroskop und Beziehungsastrologie','Mein Leben lang suchte ich nach einem Weg, die Zyklen und Herausforderungen zu verstehen, die ich erlebt habe. Auf diesem Weg wurde Astrologie zu meiner Begleitung. Ich bin spezialisiert auf Geburtshoroskop-Analyse, Beziehungsberatung, Stundenastrologie und Rektifikation.'),
('23000000-0000-4000-8000-000000000013','20000000-0000-4000-8000-000000000007','tr','Test Danışmanı','Test danışmanı: sistem testleri için ücretsiz görüşme yapar. Gerçek bir profil değildir, geliştirme/QA amaçlıdır.'),
('23000000-0000-4000-8000-000000000014','20000000-0000-4000-8000-000000000007','en','Test Consultant','Test consultant: provides free sessions for system testing. This is not a real profile and is intended for development/QA.'),
('23000000-0000-4000-8000-000000000015','20000000-0000-4000-8000-000000000007','de','Testberater','Testberater: führt kostenlose Gespräche für Systemtests durch. Dies ist kein echtes Profil und dient Entwicklungs- und QA-Zwecken.');
