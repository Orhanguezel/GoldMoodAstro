-- Fatma Güçlü talebi (2026-08-13): uzmanlık ve seans listesine Fizyonomi ekle.
SET @FATMA_CONSULTANT := (
  SELECT c.id FROM consultants c JOIN users u ON u.id=c.user_id
  WHERE u.full_name='Astrolog Fatma Güçlü' LIMIT 1
);

UPDATE consultants
SET expertise = CASE
  WHEN JSON_CONTAINS(COALESCE(expertise, JSON_ARRAY()), '"fizyonomi"') THEN expertise
  ELSE JSON_ARRAY_APPEND(COALESCE(expertise, JSON_ARRAY()), '$', 'fizyonomi')
END
WHERE id=@FATMA_CONSULTANT;

-- Fatma bu ortamda yoksa (ör. lokal fresh seed) dosya no-op kalmalı; NOT NULL
-- consultant_id'ye NULL yazılırsa tüm seed pipeline'ı durur.
INSERT INTO consultant_services
  (id,consultant_id,name,slug,description,duration_minutes,price,currency,media_type,is_free,is_active,sort_order,category_slug)
SELECT
  'f17a0000-0000-4000-8000-000000000001',@FATMA_CONSULTANT,
  'Fizyonomi Analizi','fizyonomi-analizi',
  'Yüz hatlarının geleneksel fizyonomi yaklaşımıyla yorumlandığı; karakter eğilimleri, güçlü yönler ve davranış kalıpları üzerine kişisel analiz.',
  45,1100.00,'TRY','audio',0,1,14,'fizyonomi'
FROM DUAL WHERE @FATMA_CONSULTANT IS NOT NULL
ON DUPLICATE KEY UPDATE
  name=VALUES(name),description=VALUES(description),category_slug='fizyonomi',is_active=1;
