-- GoldMoodAstro blog kapaklarını yeni, yazısız WebP görsellerine geçirir.
-- ID tabanlı güncelleme admin panelden kalmış eski absolute URL'leri de yeniler.
UPDATE custom_pages
SET featured_image = CONCAT('https://goldmoodastro.com/img/blog/',
  CASE id
    WHEN 'b1000000-0000-4000-8000-000000000001' THEN 'birth-chart.webp'
    WHEN 'b1000000-0000-4000-8000-000000000002' THEN 'synastry.webp'
    WHEN 'b1000000-0000-4000-8000-000000000003' THEN 'tarot.webp'
    WHEN 'b1000000-0000-4000-8000-000000000004' THEN 'numerology.webp'
    WHEN 'b1000000-0000-4000-8000-000000000005' THEN 'moon-sign.webp'
    WHEN 'b1000000-0000-4000-8000-000000000006' THEN 'retrograde.webp'
    WHEN 'b1000000-0000-4000-8000-000000000007' THEN 'consultant.webp'
    WHEN 'b1000000-0000-4000-8000-000000000008' THEN 'daily-ritual.webp'
  END),
  image_url = featured_image,
  images = JSON_ARRAY(featured_image),
  updated_at = NOW(3)
WHERE id IN (
  'b1000000-0000-4000-8000-000000000001',
  'b1000000-0000-4000-8000-000000000002',
  'b1000000-0000-4000-8000-000000000003',
  'b1000000-0000-4000-8000-000000000004',
  'b1000000-0000-4000-8000-000000000005',
  'b1000000-0000-4000-8000-000000000006',
  'b1000000-0000-4000-8000-000000000007',
  'b1000000-0000-4000-8000-000000000008'
);
