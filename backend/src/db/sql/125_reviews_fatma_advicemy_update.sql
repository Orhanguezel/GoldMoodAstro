-- Advicemy Fatma Güçlü profilinde 2026-08-13 taramasında bulunan 4 yeni yorum.
-- Eski 25 yorum 122_reviews_fatma_seed.sql içinde bulunuyor.
SET @FATMA_CONSULTANT := (
  SELECT c.id FROM consultants c JOIN users u ON u.id=c.user_id
  WHERE u.full_name='Astrolog Fatma Güçlü' LIMIT 1
);

UPDATE reviews
SET company='advicemy.com', profile_href='https://www.advicemy.com/danisman/fatma-guclu', is_verified=0
WHERE target_id=@FATMA_CONSULTANT AND id LIKE 'abcdef00-0000-4000-8000-%';

-- Fatma bu ortamda yoksa (ör. lokal fresh seed) INSERT'ler no-op kalmalı;
-- target_id NOT NULL olduğundan NULL değişkenle seed pipeline'ı durur.
INSERT INTO reviews
  (id,target_type,target_id,name,rating,company,profile_href,is_active,is_approved,is_verified,submitted_locale,created_at,updated_at)
SELECT 'ad6f0000-0000-4000-8000-000000000026','consultant',@FATMA_CONSULTANT,'E∗∗∗ ∗∗∗',5,'advicemy.com','https://www.advicemy.com/danisman/fatma-guclu',1,1,0,'tr','2026-06-28 12:00:00','2026-06-28 12:00:00' FROM DUAL WHERE @FATMA_CONSULTANT IS NOT NULL UNION ALL
SELECT 'ad6f0000-0000-4000-8000-000000000027','consultant',@FATMA_CONSULTANT,'P∗∗∗ K∗∗∗',5,'advicemy.com','https://www.advicemy.com/danisman/fatma-guclu',1,1,0,'tr','2026-06-28 11:00:00','2026-06-28 11:00:00' FROM DUAL WHERE @FATMA_CONSULTANT IS NOT NULL UNION ALL
SELECT 'ad6f0000-0000-4000-8000-000000000028','consultant',@FATMA_CONSULTANT,'Ö∗∗∗ ∗∗∗',5,'advicemy.com','https://www.advicemy.com/danisman/fatma-guclu',1,1,0,'tr','2026-06-19 12:00:00','2026-06-19 12:00:00' FROM DUAL WHERE @FATMA_CONSULTANT IS NOT NULL UNION ALL
SELECT 'ad6f0000-0000-4000-8000-000000000029','consultant',@FATMA_CONSULTANT,'S∗∗∗ K∗∗∗ A∗∗∗',5,'advicemy.com','https://www.advicemy.com/danisman/fatma-guclu',1,1,0,'tr','2026-05-12 12:00:00','2026-05-12 12:00:00' FROM DUAL WHERE @FATMA_CONSULTANT IS NOT NULL
ON DUPLICATE KEY UPDATE target_id=VALUES(target_id),name=VALUES(name),rating=VALUES(rating),company=VALUES(company),profile_href=VALUES(profile_href),is_active=1,is_approved=1,is_verified=0;

INSERT INTO review_i18n (id,review_id,locale,comment)
SELECT 'ad6f1000-0000-4000-8000-000000000026','ad6f0000-0000-4000-8000-000000000026','tr','İlk andan itibaren sıcak ve güven veren bir yaklaşımı vardı. Kendimi çok daha iyi hissettiren birisi Enerjisi gerçekten harika En umutsuz hissettiğim anda bana iyi geldi. Söylediklerinin zamanla çıkması muhteşem Emeğiniz için teşekkür ederim ☺️🌸' FROM DUAL WHERE @FATMA_CONSULTANT IS NOT NULL UNION ALL
SELECT 'ad6f1000-0000-4000-8000-000000000027','ad6f0000-0000-4000-8000-000000000027','tr','Çok profesyonel ama aynı zamanda inanılmaz samimi ve astroloji çok hakim Fatma Hanım. Olumsuz cevapları bile o kadar güzel bir dille ifade ediyor ki, yeni ihtimalleri değerlendirme isteği uyandırıyor. Başarılı :)' FROM DUAL WHERE @FATMA_CONSULTANT IS NOT NULL UNION ALL
SELECT 'ad6f1000-0000-4000-8000-000000000028','ad6f0000-0000-4000-8000-000000000028','tr','Her zaman öngörülerini yaşıyorum oldukça fikirleriyle de destek oluyor iyi ki karşılaştık.' FROM DUAL WHERE @FATMA_CONSULTANT IS NOT NULL UNION ALL
SELECT 'ad6f1000-0000-4000-8000-000000000029','ad6f0000-0000-4000-8000-000000000029','tr','Pozitif enerjisi, nokta atışı ve detaylı yorumları için kendisine çok teşekkür ederim. Gönül rahatlığı ile tavsiye ederim 🫶🏻' FROM DUAL WHERE @FATMA_CONSULTANT IS NOT NULL
ON DUPLICATE KEY UPDATE comment=VALUES(comment);

UPDATE consultants
SET rating_avg=(SELECT ROUND(AVG(r.rating),2) FROM reviews r WHERE r.target_type='consultant' AND r.target_id=@FATMA_CONSULTANT AND r.is_approved=1 AND r.is_active=1),
    rating_count=(SELECT COUNT(*) FROM reviews r WHERE r.target_type='consultant' AND r.target_id=@FATMA_CONSULTANT AND r.is_approved=1 AND r.is_active=1)
WHERE id=@FATMA_CONSULTANT;
