-- =============================================================
-- 243_home_blog_section_seed.sql
-- Ana sayfaya blog bölümü. Yalnız admin panelinde "Ana sayfa" anahtarı açılmış
-- (custom_pages.featured = 1) ve YAYINDA olan yazıları listeler; onaylı yazı
-- yoksa bölüm hiç çizilmez.
--
-- Sıra: yorumlardan (140) sonra, uygulama indirme (145) öncesi → 142.
-- Frontend karşılığı: components/containers/home/HomeBlogSection.tsx
-- (HomeLayoutRenderer REGISTRY'sinde 'HomeBlogSection' anahtarıyla kayıtlı).
-- İdempotent: slug UNIQUE, tekrar çalıştırılabilir.
-- =============================================================
INSERT INTO home_sections (id, slug, label, component_key, order_index, is_active, config)
VALUES (
  'a1000000-0000-4000-8000-000000000018',
  'blog_featured',
  'Blog (Ana Sayfada Gösterilenler)',
  'HomeBlogSection',
  142,
  1,
  JSON_OBJECT('limit', 3)
)
ON DUPLICATE KEY UPDATE
  label = VALUES(label),
  component_key = VALUES(component_key),
  order_index = VALUES(order_index),
  config = VALUES(config);
