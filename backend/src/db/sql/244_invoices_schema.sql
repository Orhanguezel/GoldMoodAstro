-- =============================================================
-- 244_invoices_schema.sql
-- Satış faturaları (müşteriye kesilen). Almanya Kleinunternehmer (§19 UStG):
-- KDV gösterilmez, faturada bunun açık notu bulunur.
--
-- NUMARA SIRA ATLAMAZ: yıllık sayaç ayrı tabloda tutulur ve fatura numarası
-- transaction içinde `UPDATE ... SET n = n + 1` ile alınır. AUTO_INCREMENT
-- kullanılmaz — rollback'te numara yakılır ve vergi dairesi açısından sıra
-- boşluğu açıklanması gereken bir durumdur.
--
-- NOT: danışmanın PLATFORMA kestiği hakediş faturası AYRI bir akıştır
-- (sözleşme gereği danışman kendi faturasını keser) — bu tablo yalnız
-- GoldMoodAstro'nun müşteriye kestiği satış faturasıdır.
-- =============================================================

CREATE TABLE IF NOT EXISTS invoice_counters (
  year SMALLINT PRIMARY KEY,
  last_number INT NOT NULL DEFAULT 0,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS invoices (
  id CHAR(36) PRIMARY KEY,
  invoice_number VARCHAR(32) NOT NULL,        -- GM-2026-00001
  year SMALLINT NOT NULL,
  seq INT NOT NULL,
  order_id CHAR(36) NULL,
  booking_id CHAR(36) NULL,
  user_id CHAR(36) NULL,

  -- Müşteri anlık kopyası: kullanıcı sonradan adını/e-postasını değiştirse bile
  -- fatura kesildiği andaki bilgiyi taşımalı (belge değişmez olmalı).
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NULL,
  customer_address TEXT NULL,

  description VARCHAR(500) NOT NULL,          -- "Danışmanlık seansı — 2026-08-20"
  amount DECIMAL(10,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'TRY',
  tax_note VARCHAR(255) NOT NULL,             -- §19 UStG metni (o günkü haliyle saklanır)

  pdf_path VARCHAR(500) NULL,                 -- uploads/invoices/GM-2026-00001.pdf
  issued_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  emailed_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  UNIQUE KEY invoices_number_uq (invoice_number),
  UNIQUE KEY invoices_year_seq_uq (year, seq),
  -- Bir sipariş için tek fatura: webhook tekrar teslimatı ikinci belge üretemez.
  UNIQUE KEY invoices_order_uq (order_id),
  KEY invoices_user_idx (user_id),
  KEY invoices_issued_idx (issued_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
