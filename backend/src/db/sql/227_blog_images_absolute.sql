-- Blog kapakları absolute URL (admin panel farklı origin'de; relative /img/blog/*
-- admin.goldmoodastro.com'da 404 verir). İdempotent: yalnız relative olanları düzeltir.
UPDATE custom_pages
SET featured_image = CONCAT('https://goldmoodastro.com', featured_image),
    image_url      = CONCAT('https://goldmoodastro.com', COALESCE(NULLIF(image_url,''), featured_image)),
    images         = JSON_ARRAY(featured_image)
WHERE module_key = 'blog' AND featured_image LIKE '/img/blog/%';
