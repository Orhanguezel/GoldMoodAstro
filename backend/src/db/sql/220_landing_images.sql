-- Landing kapak görselleri: eksik/bozuk /img/*.png default'larını tema-uygun SVG'lere çevir.
-- landing_key ↔ dosya adı birebir. Absolute URL: admin cross-domain önizleme de çalışsın
-- (custom_pages effective_url pass-through olduğu için relative path admin domain'de 404 verir).
-- İdempotent + admin düzenlemelerini KORUR (yalnız bozuk png/boş default'ları düzeltir).
UPDATE custom_pages
SET featured_image = CONCAT('https://goldmoodastro.com/img/landing/', landing_key, '.svg'),
    image_url      = CONCAT('https://goldmoodastro.com/img/landing/', landing_key, '.svg')
WHERE module_key = 'landing'
  AND landing_key IS NOT NULL
  AND (
    featured_image IS NULL
    OR featured_image = ''
    OR featured_image LIKE '/img/%.png'
    OR featured_image LIKE '/img/og-default.png'
  );
