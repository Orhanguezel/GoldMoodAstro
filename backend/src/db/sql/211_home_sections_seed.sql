-- =============================================================
-- 211_home_sections_seed.sql
-- Mevcut HomeContent layout'unu birebir DB'ye taşır.
-- Yeni eklemeler için yeni satır + frontend REGISTRY'e component ekle.
-- =============================================================
INSERT INTO home_sections (id, slug, label, component_key, order_index, is_active, config) VALUES
('a1000000-0000-4000-8000-000000000001', 'hero',                  'Hero (Ana Banner)',                    'HeroNew',                  10,  1, NULL),
('a1000000-0000-4000-8000-000000000002', 'banner_welcome',        'Karşılama Bannerı (Gözlemevi)',        'WelcomePremiumBanner',     20,  1, NULL),
('a1000000-0000-4000-8000-000000000003', 'zodiac_grid',           'Burç Grid Tanıtımı',                   'ZodiacGridSection',        30,  1, NULL),
('a1000000-0000-4000-8000-000000000007', 'consultants_featured',  'Öne Çıkan Danışmanlar',                'ConsultantsSection',       40,  1, JSON_OBJECT('sort','featured','limit',6,'icon','sparkles')),
('a1000000-0000-4000-8000-000000000005', 'banner_birth_chart',    'Doğum Haritası Bannerı (Parşömen)',     'BirthChartBanner',         50,  1, NULL),
('a1000000-0000-4000-8000-000000000008', 'consultants_popular',   'Popüler Danışmanlar',                  'ConsultantsSection',       60,  1, JSON_OBJECT('sort','popular','limit',6,'icon','trending')),
('a1000000-0000-4000-8000-000000000004', 'promises',              'Vaatlerimiz / Tanıtım',                'PromisesSection',          70,  1, NULL),
('a1000000-0000-4000-8000-00000000000c', 'banner_premium',        'Premium Üyelik Bannerı (Lüks Yıldız)', 'PremiumMembershipBanner',  80,  1, NULL),
('a1000000-0000-4000-8000-000000000009', 'consultants_new',       'Yeni Danışmanlar',                     'ConsultantsSection',       90,  1, JSON_OBJECT('sort','new','limit',6,'icon','clock')),
('a1000000-0000-4000-8000-00000000000a', 'consultants_online',    'Çevrimiçi Danışmanlar',                'ConsultantsSection',       100, 1, JSON_OBJECT('sort','online','limit',6,'icon','wifi','onlineOnly',true)),
('a1000000-0000-4000-8000-00000000000b', 'hybrid_model',          'Hibrit Model Açıklaması',              'HybridModelSection',       110, 1, NULL),
('a1000000-0000-4000-8000-00000000000d', 'transparency',          'Şeffaflık / Fiyat',                    'TransparencySection',      120, 1, NULL),
('a1000000-0000-4000-8000-00000000000f', 'banner_discount',       'İndirim Bannerı (Altın Pusula)',       'FirstSessionDiscountBanner', 130, 1, NULL),
('a1000000-0000-4000-8000-000000000011', 'testimonials',          'Müşteri Yorumları',                    'HomeTestimonialsSection',  140, 1, NULL),
('a1000000-0000-4000-8000-000000000012', 'app_download',           'Mobil Uygulama İndirme Section',       'AppDownloadSection',       145, 1, NULL),
('a1000000-0000-4000-8000-00000000000e', 'trust',                 'Güven / Gizlilik',                     'TrustSection',             150, 1, NULL),
('a1000000-0000-4000-8000-000000000010', 'waitlist',              'Danışman Ol / Katıl',                  'WaitlistSection',          160, 1, NULL)
ON DUPLICATE KEY UPDATE
  label = VALUES(label),
  component_key = VALUES(component_key),
  order_index = VALUES(order_index),
  config = VALUES(config);
