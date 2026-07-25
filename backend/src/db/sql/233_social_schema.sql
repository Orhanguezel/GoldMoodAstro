-- Ekosistem pazarlama/analitik modulleri — Faz 1 (GA4 + Search Console) tablolari.
-- Kaynak: ekosistem-sosyal-medya schema.ts (de-tenant: goldmoodastro tek tenant,
-- tenant_key kolonlari korunur ve daima "goldmoodastro" tutar).
-- ALTER yok; CREATE TABLE IF NOT EXISTS (idempotent).

-- Tenant/proje kayit deposu (de-tenant sonrasi TEK satir: goldmoodastro).
-- GA4/GSC/Ads/GTM kimlik ID'leri buradan okunur.
CREATE TABLE IF NOT EXISTS social_projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL,
  project_key VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  website_url VARCHAR(500),
  gtm_container_id VARCHAR(64),
  ga4_measurement_id VARCHAR(64),
  ga4_property_id VARCHAR(32),
  google_ads_customer_id VARCHAR(64),
  google_ads_manager_id VARCHAR(64),
  search_console_site_url VARCHAR(500),
  site_settings_api_url VARCHAR(500),
  content_source_url VARCHAR(500),
  content_source_type VARCHAR(50),
  marketing_json JSON,
  email_settings JSON,
  source_db JSON,
  is_active TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY social_projects_uuid_unique (uuid),
  UNIQUE KEY social_projects_project_key_unique (project_key),
  KEY idx_social_projects_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Entegrasyon ayarlari (secret'lar AES-256-GCM sifreli value_encrypted'de).
CREATE TABLE IF NOT EXISTS tenant_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL,
  tenant_key VARCHAR(100) NOT NULL,
  namespace VARCHAR(50) NOT NULL,
  setting_key VARCHAR(120) NOT NULL,
  value JSON,
  value_encrypted TEXT,
  is_secret TINYINT NOT NULL DEFAULT 0,
  updated_by VARCHAR(100),
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY tenant_settings_uuid_unique (uuid),
  UNIQUE KEY uk_tenant_setting (tenant_key, namespace, setting_key),
  KEY idx_ts_tenant (tenant_key),
  KEY idx_ts_namespace (tenant_key, namespace)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Google Ads degisiklik setleri (draft/validate/apply is akisi).
CREATE TABLE IF NOT EXISTS google_ads_change_sets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL,
  tenant_key VARCHAR(100) NOT NULL,
  customer_id VARCHAR(64) NOT NULL,
  manager_id VARCHAR(64),
  campaign_id VARCHAR(64),
  campaign_name VARCHAR(255),
  title VARCHAR(255) NOT NULL,
  status ENUM('draft','validated','validation_failed','applied','failed','cancelled') NOT NULL DEFAULT 'draft',
  source VARCHAR(50) NOT NULL DEFAULT 'manual',
  payload JSON NOT NULL,
  validation_result JSON,
  applied_result JSON,
  created_by VARCHAR(100) DEFAULT 'system',
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY google_ads_change_sets_uuid_unique (uuid),
  KEY idx_gacs_tenant (tenant_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cok-platform pazarlama degisiklik setleri (ga4/gsc/gtm/ads/merchant/meta).
CREATE TABLE IF NOT EXISTS marketing_change_sets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL,
  tenant_key VARCHAR(100) NOT NULL,
  platform ENUM('google_ads','gtm','ga4','gsc','merchant','meta') NOT NULL,
  target_ref VARCHAR(255),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('draft','validated','validation_failed','applied','failed','cancelled') NOT NULL DEFAULT 'draft',
  source ENUM('manual','automation','ai','recommendation') NOT NULL DEFAULT 'manual',
  payload JSON NOT NULL,
  validation_result JSON,
  applied_result JSON,
  created_by VARCHAR(100) DEFAULT 'system',
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY marketing_change_sets_uuid_unique (uuid),
  KEY idx_mcs_tenant (tenant_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Search Console URL denetim indeksi.
CREATE TABLE IF NOT EXISTS gsc_url_index (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid CHAR(36) NOT NULL,
  tenant_key VARCHAR(100) NOT NULL,
  url VARCHAR(1000) NOT NULL,
  verdict VARCHAR(64),
  coverage_state VARCHAR(255),
  last_crawl_time DATETIME(3),
  robots_txt_state VARCHAR(64),
  indexing_state VARCHAR(64),
  page_fetch_state VARCHAR(64),
  google_canonical VARCHAR(1000),
  user_canonical VARCHAR(1000),
  status_text VARCHAR(255),
  recommendation TEXT,
  raw_result JSON,
  checked_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  created_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY gsc_url_index_uuid_unique (uuid),
  UNIQUE KEY uk_gsc_url_index_tenant_url (tenant_key, url(255)),
  KEY idx_gsc_url_index_tenant (tenant_key),
  KEY idx_gsc_url_index_checked (checked_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
