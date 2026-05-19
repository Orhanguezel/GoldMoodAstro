-- =============================================================
-- 032b_service_templates_schema.sql
-- Hizmet şablonları — admin yönetir. Her şablon BİR kategoriye ait.
-- Danışman, expertise'indeki kategorilerin aktif şablonlarını taslak görür;
-- "Kullan/Düzenle" → kendine özel ayrı id'li consultant_services kaydı türer.
-- 032a (service_categories) bu dosyadan ÖNCE çalışır (lexical sıra) → FK güvenli.
-- =============================================================
CREATE TABLE IF NOT EXISTS service_templates (
  id CHAR(36) PRIMARY KEY,
  category_slug VARCHAR(64) NOT NULL,
  name VARCHAR(160) NOT NULL,
  slug VARCHAR(120) NOT NULL,
  description TEXT,
  duration_minutes INT NOT NULL DEFAULT 45,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'TRY',
  media_type ENUM('audio','video') NOT NULL DEFAULT 'audio',
  is_free TINYINT NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uniq_service_template (category_slug, slug),
  KEY idx_service_templates_cat (category_slug, is_active, sort_order),
  CONSTRAINT fk_service_templates_category FOREIGN KEY (category_slug)
    REFERENCES service_categories(slug) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed: 033 kataloğu şablon olarak. Her kategoride bir ÜCRETSİZ ön görüşme
-- (free-intro) + kategoriye özel paket(ler). INSERT IGNORE → admin düzenlemeleri
-- re-seed'de ezilmez. Deterministik id: MD5(category_slug|slug).
INSERT IGNORE INTO service_templates
  (id, category_slug, name, slug, description, duration_minutes, price, currency, media_type, is_free, sort_order, is_active)
VALUES
  -- Her kategoriye ücretsiz ön görüşme
  (CONCAT(SUBSTRING(MD5('astrology|free-intro'),1,8),'-',SUBSTRING(MD5('astrology|free-intro'),9,4),'-4',SUBSTRING(MD5('astrology|free-intro'),14,3),'-8',SUBSTRING(MD5('astrology|free-intro'),18,3),'-',SUBSTRING(MD5('astrology|free-intro'),21,12)),'astrology','Ücretsiz Tanışma Görüşmesi','free-intro','Ücretsiz ön görüşme: ihtiyaç ve beklentilerinizi paylaşmak için kısa tanışma.',15,0.00,'TRY','audio',1,1,1),
  (CONCAT(SUBSTRING(MD5('astrology|dogum-haritasi-yorumu'),1,8),'-',SUBSTRING(MD5('astrology|dogum-haritasi-yorumu'),9,4),'-4',SUBSTRING(MD5('astrology|dogum-haritasi-yorumu'),14,3),'-8',SUBSTRING(MD5('astrology|dogum-haritasi-yorumu'),18,3),'-',SUBSTRING(MD5('astrology|dogum-haritasi-yorumu'),21,12)),'astrology','Doğum Haritası Yorumu','dogum-haritasi-yorumu','Gezegen yerleşimleri ve açılarla kişilik, potansiyel ve güncel etkiler.',60,1800.00,'TRY','audio',0,2,1),
  (CONCAT(SUBSTRING(MD5('astrology|hizli-soru'),1,8),'-',SUBSTRING(MD5('astrology|hizli-soru'),9,4),'-4',SUBSTRING(MD5('astrology|hizli-soru'),14,3),'-8',SUBSTRING(MD5('astrology|hizli-soru'),18,3),'-',SUBSTRING(MD5('astrology|hizli-soru'),21,12)),'astrology','Hızlı Soru Seansı','hizli-soru','Tek bir konuya odaklı kısa, öz yorum.',20,400.00,'TRY','audio',0,3,1),

  (CONCAT(SUBSTRING(MD5('birth_chart|free-intro'),1,8),'-',SUBSTRING(MD5('birth_chart|free-intro'),9,4),'-4',SUBSTRING(MD5('birth_chart|free-intro'),14,3),'-8',SUBSTRING(MD5('birth_chart|free-intro'),18,3),'-',SUBSTRING(MD5('birth_chart|free-intro'),21,12)),'birth_chart','Ücretsiz Tanışma Görüşmesi','free-intro','Ücretsiz ön görüşme.',15,0.00,'TRY','audio',1,1,1),
  (CONCAT(SUBSTRING(MD5('birth_chart|detayli-dogum-haritasi'),1,8),'-',SUBSTRING(MD5('birth_chart|detayli-dogum-haritasi'),9,4),'-4',SUBSTRING(MD5('birth_chart|detayli-dogum-haritasi'),14,3),'-8',SUBSTRING(MD5('birth_chart|detayli-dogum-haritasi'),18,3),'-',SUBSTRING(MD5('birth_chart|detayli-dogum-haritasi'),21,12)),'birth_chart','Detaylı Doğum Haritası Analizi','detayli-dogum-haritasi','Tam kapsamlı natal okuma: kişilik, kariyer, ilişki, ruhsal yön, transitler.',90,2800.00,'TRY','audio',0,2,1),

  (CONCAT(SUBSTRING(MD5('tarot|free-intro'),1,8),'-',SUBSTRING(MD5('tarot|free-intro'),9,4),'-4',SUBSTRING(MD5('tarot|free-intro'),14,3),'-8',SUBSTRING(MD5('tarot|free-intro'),18,3),'-',SUBSTRING(MD5('tarot|free-intro'),21,12)),'tarot','Ücretsiz Tanışma Görüşmesi','free-intro','Ücretsiz ön görüşme.',15,0.00,'TRY','audio',1,1,1),
  (CONCAT(SUBSTRING(MD5('tarot|tarot-acilimi'),1,8),'-',SUBSTRING(MD5('tarot|tarot-acilimi'),9,4),'-4',SUBSTRING(MD5('tarot|tarot-acilimi'),14,3),'-8',SUBSTRING(MD5('tarot|tarot-acilimi'),18,3),'-',SUBSTRING(MD5('tarot|tarot-acilimi'),21,12)),'tarot','Tarot Açılımı','tarot-acilimi','Kartların sembolizmiyle sorularınıza rehberlik.',30,650.00,'TRY','audio',0,2,1),

  (CONCAT(SUBSTRING(MD5('numerology|free-intro'),1,8),'-',SUBSTRING(MD5('numerology|free-intro'),9,4),'-4',SUBSTRING(MD5('numerology|free-intro'),14,3),'-8',SUBSTRING(MD5('numerology|free-intro'),18,3),'-',SUBSTRING(MD5('numerology|free-intro'),21,12)),'numerology','Ücretsiz Tanışma Görüşmesi','free-intro','Ücretsiz ön görüşme.',15,0.00,'TRY','audio',1,1,1),
  (CONCAT(SUBSTRING(MD5('numerology|numeroloji-raporu'),1,8),'-',SUBSTRING(MD5('numerology|numeroloji-raporu'),9,4),'-4',SUBSTRING(MD5('numerology|numeroloji-raporu'),14,3),'-8',SUBSTRING(MD5('numerology|numeroloji-raporu'),18,3),'-',SUBSTRING(MD5('numerology|numeroloji-raporu'),21,12)),'numerology','Numeroloji Raporu','numeroloji-raporu','İsim ve doğum tarihinden yaşam yolu yorumu.',30,650.00,'TRY','audio',0,2,1),

  (CONCAT(SUBSTRING(MD5('coffee|free-intro'),1,8),'-',SUBSTRING(MD5('coffee|free-intro'),9,4),'-4',SUBSTRING(MD5('coffee|free-intro'),14,3),'-8',SUBSTRING(MD5('coffee|free-intro'),18,3),'-',SUBSTRING(MD5('coffee|free-intro'),21,12)),'coffee','Ücretsiz Tanışma Görüşmesi','free-intro','Ücretsiz ön görüşme.',15,0.00,'TRY','audio',1,1,1),
  (CONCAT(SUBSTRING(MD5('coffee|kahve-fali-yorumu'),1,8),'-',SUBSTRING(MD5('coffee|kahve-fali-yorumu'),9,4),'-4',SUBSTRING(MD5('coffee|kahve-fali-yorumu'),14,3),'-8',SUBSTRING(MD5('coffee|kahve-fali-yorumu'),18,3),'-',SUBSTRING(MD5('coffee|kahve-fali-yorumu'),21,12)),'coffee','Kahve Falı Yorumu','kahve-fali-yorumu','Fincan sembollerinin geleneksel anlamlarıyla kişisel yorum.',20,450.00,'TRY','audio',0,2,1),

  (CONCAT(SUBSTRING(MD5('relationship|free-intro'),1,8),'-',SUBSTRING(MD5('relationship|free-intro'),9,4),'-4',SUBSTRING(MD5('relationship|free-intro'),14,3),'-8',SUBSTRING(MD5('relationship|free-intro'),18,3),'-',SUBSTRING(MD5('relationship|free-intro'),21,12)),'relationship','Ücretsiz Tanışma Görüşmesi','free-intro','Ücretsiz ön görüşme.',15,0.00,'TRY','audio',1,1,1),
  (CONCAT(SUBSTRING(MD5('relationship|iliski-sinastri'),1,8),'-',SUBSTRING(MD5('relationship|iliski-sinastri'),9,4),'-4',SUBSTRING(MD5('relationship|iliski-sinastri'),14,3),'-8',SUBSTRING(MD5('relationship|iliski-sinastri'),18,3),'-',SUBSTRING(MD5('relationship|iliski-sinastri'),21,12)),'relationship','İlişki & Sinastri Analizi','iliski-sinastri','İki haritanın karşılaştırılması; ilişki dinamikleri ve uyum.',60,2200.00,'TRY','audio',0,2,1),

  (CONCAT(SUBSTRING(MD5('mood|free-intro'),1,8),'-',SUBSTRING(MD5('mood|free-intro'),9,4),'-4',SUBSTRING(MD5('mood|free-intro'),14,3),'-8',SUBSTRING(MD5('mood|free-intro'),18,3),'-',SUBSTRING(MD5('mood|free-intro'),21,12)),'mood','Ücretsiz Tanışma Görüşmesi','free-intro','Ücretsiz ön görüşme.',15,0.00,'TRY','audio',1,1,1),
  (CONCAT(SUBSTRING(MD5('mood|ruhsal-rehberlik'),1,8),'-',SUBSTRING(MD5('mood|ruhsal-rehberlik'),9,4),'-4',SUBSTRING(MD5('mood|ruhsal-rehberlik'),14,3),'-8',SUBSTRING(MD5('mood|ruhsal-rehberlik'),18,3),'-',SUBSTRING(MD5('mood|ruhsal-rehberlik'),21,12)),'mood','Ruhsal Rehberlik Seansı','ruhsal-rehberlik','İçsel denge ve farkındalık için destekleyici seans.',45,1100.00,'TRY','audio',0,2,1),

  (CONCAT(SUBSTRING(MD5('career|free-intro'),1,8),'-',SUBSTRING(MD5('career|free-intro'),9,4),'-4',SUBSTRING(MD5('career|free-intro'),14,3),'-8',SUBSTRING(MD5('career|free-intro'),18,3),'-',SUBSTRING(MD5('career|free-intro'),21,12)),'career','Ücretsiz Tanışma Görüşmesi','free-intro','Ücretsiz ön görüşme.',15,0.00,'TRY','audio',1,1,1),
  (CONCAT(SUBSTRING(MD5('career|kariyer-para'),1,8),'-',SUBSTRING(MD5('career|kariyer-para'),9,4),'-4',SUBSTRING(MD5('career|kariyer-para'),14,3),'-8',SUBSTRING(MD5('career|kariyer-para'),18,3),'-',SUBSTRING(MD5('career|kariyer-para'),21,12)),'career','Kariyer & Para Danışmanlığı','kariyer-para','İş hayatında zamanlama, fırsatlar ve finansal akış.',45,1100.00,'TRY','audio',0,2,1),

  (CONCAT(SUBSTRING(MD5('dream_interpretation|free-intro'),1,8),'-',SUBSTRING(MD5('dream_interpretation|free-intro'),9,4),'-4',SUBSTRING(MD5('dream_interpretation|free-intro'),14,3),'-8',SUBSTRING(MD5('dream_interpretation|free-intro'),18,3),'-',SUBSTRING(MD5('dream_interpretation|free-intro'),21,12)),'dream_interpretation','Ücretsiz Tanışma Görüşmesi','free-intro','Ücretsiz ön görüşme.',15,0.00,'TRY','audio',1,1,1),
  (CONCAT(SUBSTRING(MD5('dream_interpretation|ruya-yorumu'),1,8),'-',SUBSTRING(MD5('dream_interpretation|ruya-yorumu'),9,4),'-4',SUBSTRING(MD5('dream_interpretation|ruya-yorumu'),14,3),'-8',SUBSTRING(MD5('dream_interpretation|ruya-yorumu'),18,3),'-',SUBSTRING(MD5('dream_interpretation|ruya-yorumu'),21,12)),'dream_interpretation','Rüya Yorumu','ruya-yorumu','Rüya sembollerinin kişisel bağlamda yorumu.',30,600.00,'TRY','audio',0,2,1),

  (CONCAT(SUBSTRING(MD5('energy_healing|free-intro'),1,8),'-',SUBSTRING(MD5('energy_healing|free-intro'),9,4),'-4',SUBSTRING(MD5('energy_healing|free-intro'),14,3),'-8',SUBSTRING(MD5('energy_healing|free-intro'),18,3),'-',SUBSTRING(MD5('energy_healing|free-intro'),21,12)),'energy_healing','Ücretsiz Tanışma Görüşmesi','free-intro','Ücretsiz ön görüşme.',15,0.00,'TRY','audio',1,1,1),
  (CONCAT(SUBSTRING(MD5('energy_healing|enerji-sifasi'),1,8),'-',SUBSTRING(MD5('energy_healing|enerji-sifasi'),9,4),'-4',SUBSTRING(MD5('energy_healing|enerji-sifasi'),14,3),'-8',SUBSTRING(MD5('energy_healing|enerji-sifasi'),18,3),'-',SUBSTRING(MD5('energy_healing|enerji-sifasi'),21,12)),'energy_healing','Enerji Şifası Seansı','enerji-sifasi','Enerji dengeleme ve şifa çalışması.',45,1200.00,'TRY','audio',0,2,1),

  (CONCAT(SUBSTRING(MD5('spiritual_guidance|free-intro'),1,8),'-',SUBSTRING(MD5('spiritual_guidance|free-intro'),9,4),'-4',SUBSTRING(MD5('spiritual_guidance|free-intro'),14,3),'-8',SUBSTRING(MD5('spiritual_guidance|free-intro'),18,3),'-',SUBSTRING(MD5('spiritual_guidance|free-intro'),21,12)),'spiritual_guidance','Ücretsiz Tanışma Görüşmesi','free-intro','Ücretsiz ön görüşme.',15,0.00,'TRY','audio',1,1,1),
  (CONCAT(SUBSTRING(MD5('spiritual_guidance|manevi-rehberlik'),1,8),'-',SUBSTRING(MD5('spiritual_guidance|manevi-rehberlik'),9,4),'-4',SUBSTRING(MD5('spiritual_guidance|manevi-rehberlik'),14,3),'-8',SUBSTRING(MD5('spiritual_guidance|manevi-rehberlik'),18,3),'-',SUBSTRING(MD5('spiritual_guidance|manevi-rehberlik'),21,12)),'spiritual_guidance','Manevi Rehberlik Seansı','manevi-rehberlik','Manevi yolculukta destekleyici görüşme.',45,1000.00,'TRY','audio',0,2,1);
