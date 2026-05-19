-- =============================================================
-- 032a_service_categories_schema.sql
-- Hizmet kategorileri — admin yönetir, TEK doğruluk kaynağı.
-- Frontend'deki hardcoded expertise/kategori dizileri (BecomeConsultantPage
-- EXPERTISE_OPTIONS, ExpertiseCategoriesSection) bu tabloyu kaynak alacak.
-- slug = mevcut consultants.expertise slug'larıyla BİREBİR uyumlu.
-- =============================================================
CREATE TABLE IF NOT EXISTS service_categories (
  id CHAR(36) PRIMARY KEY,
  slug VARCHAR(64) NOT NULL,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  icon VARCHAR(64),
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uniq_service_category_slug (slug),
  KEY idx_service_categories_active (is_active, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed: mevcut taksonomi (BecomeConsultantPage + home ExpertiseCategoriesSection
-- + consultants.expertise içinde fiilen kullanılan slug'lar).
-- INSERT IGNORE: admin sonradan düzenler/eklerse re-seed ezmez.
-- Deterministik id: MD5(slug) → 8-4-4-4-12.
INSERT IGNORE INTO service_categories (id, slug, name, description, icon, sort_order, is_active)
VALUES
  (CONCAT(SUBSTRING(MD5('astrology'),1,8),'-',SUBSTRING(MD5('astrology'),9,4),'-4',SUBSTRING(MD5('astrology'),14,3),'-8',SUBSTRING(MD5('astrology'),18,3),'-',SUBSTRING(MD5('astrology'),21,12)),
   'astrology','Astroloji','Doğum haritası ve gezegen etkileriyle rehberlik.','Compass',10,1),
  (CONCAT(SUBSTRING(MD5('birth_chart'),1,8),'-',SUBSTRING(MD5('birth_chart'),9,4),'-4',SUBSTRING(MD5('birth_chart'),14,3),'-8',SUBSTRING(MD5('birth_chart'),18,3),'-',SUBSTRING(MD5('birth_chart'),21,12)),
   'birth_chart','Doğum Haritası','Detaylı natal harita analizi.','Star',20,1),
  (CONCAT(SUBSTRING(MD5('tarot'),1,8),'-',SUBSTRING(MD5('tarot'),9,4),'-4',SUBSTRING(MD5('tarot'),14,3),'-8',SUBSTRING(MD5('tarot'),18,3),'-',SUBSTRING(MD5('tarot'),21,12)),
   'tarot','Tarot','Kartların sembolizmiyle rehberlik.','Layers',30,1),
  (CONCAT(SUBSTRING(MD5('numerology'),1,8),'-',SUBSTRING(MD5('numerology'),9,4),'-4',SUBSTRING(MD5('numerology'),14,3),'-8',SUBSTRING(MD5('numerology'),18,3),'-',SUBSTRING(MD5('numerology'),21,12)),
   'numerology','Numeroloji','Sayıların diliyle yaşam yolu yorumu.','Hash',40,1),
  (CONCAT(SUBSTRING(MD5('coffee'),1,8),'-',SUBSTRING(MD5('coffee'),9,4),'-4',SUBSTRING(MD5('coffee'),14,3),'-8',SUBSTRING(MD5('coffee'),18,3),'-',SUBSTRING(MD5('coffee'),21,12)),
   'coffee','Kahve Falı','Fincan sembollerinin geleneksel yorumu.','Coffee',50,1),
  (CONCAT(SUBSTRING(MD5('relationship'),1,8),'-',SUBSTRING(MD5('relationship'),9,4),'-4',SUBSTRING(MD5('relationship'),14,3),'-8',SUBSTRING(MD5('relationship'),18,3),'-',SUBSTRING(MD5('relationship'),21,12)),
   'relationship','İlişki & Aşk','İlişki dinamikleri ve sinastri.','Heart',60,1),
  (CONCAT(SUBSTRING(MD5('mood'),1,8),'-',SUBSTRING(MD5('mood'),9,4),'-4',SUBSTRING(MD5('mood'),14,3),'-8',SUBSTRING(MD5('mood'),18,3),'-',SUBSTRING(MD5('mood'),21,12)),
   'mood','Ruhsal Rehberlik','İçsel denge ve farkındalık.','Moon',70,1),
  (CONCAT(SUBSTRING(MD5('career'),1,8),'-',SUBSTRING(MD5('career'),9,4),'-4',SUBSTRING(MD5('career'),14,3),'-8',SUBSTRING(MD5('career'),18,3),'-',SUBSTRING(MD5('career'),21,12)),
   'career','Kariyer & Para','İş hayatı ve finansal akış.','Briefcase',80,1),
  (CONCAT(SUBSTRING(MD5('dream_interpretation'),1,8),'-',SUBSTRING(MD5('dream_interpretation'),9,4),'-4',SUBSTRING(MD5('dream_interpretation'),14,3),'-8',SUBSTRING(MD5('dream_interpretation'),18,3),'-',SUBSTRING(MD5('dream_interpretation'),21,12)),
   'dream_interpretation','Rüya Tabiri','Rüya sembollerinin yorumu.','CloudMoon',90,1),
  (CONCAT(SUBSTRING(MD5('energy_healing'),1,8),'-',SUBSTRING(MD5('energy_healing'),9,4),'-4',SUBSTRING(MD5('energy_healing'),14,3),'-8',SUBSTRING(MD5('energy_healing'),18,3),'-',SUBSTRING(MD5('energy_healing'),21,12)),
   'energy_healing','Enerji Şifası','Enerji dengeleme ve şifa çalışması.','Sparkles',100,1),
  (CONCAT(SUBSTRING(MD5('spiritual_guidance'),1,8),'-',SUBSTRING(MD5('spiritual_guidance'),9,4),'-4',SUBSTRING(MD5('spiritual_guidance'),14,3),'-8',SUBSTRING(MD5('spiritual_guidance'),18,3),'-',SUBSTRING(MD5('spiritual_guidance'),21,12)),
   'spiritual_guidance','Manevi Rehberlik','Manevi yolculukta destek.','Flame',110,1);
