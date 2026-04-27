CREATE TABLE IF NOT EXISTS reviews (
  id CHAR(36) PRIMARY KEY,
  target_type VARCHAR(50) NOT NULL DEFAULT 'consultant',
  target_id CHAR(36) NOT NULL,
  user_id CHAR(36),
  name VARCHAR(255),
  email VARCHAR(255),
  booking_id CHAR(36),
  rating TINYINT NOT NULL,
  role VARCHAR(255),
  company VARCHAR(255),
  avatar_url VARCHAR(500),
  logo_url VARCHAR(500),
  profile_href VARCHAR(500),
  is_active TINYINT NOT NULL DEFAULT 1,
  is_approved TINYINT NOT NULL DEFAULT 0,
  is_verified TINYINT NOT NULL DEFAULT 0,           -- T17-1: booking tamamlanmış kullanıcı (F8)
  display_order INT NOT NULL DEFAULT 0,
  likes_count INT NOT NULL DEFAULT 0,
  dislikes_count INT NOT NULL DEFAULT 0,
  helpful_count INT NOT NULL DEFAULT 0,
  submitted_locale VARCHAR(8) NOT NULL DEFAULT 'tr',
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY reviews_target_idx (target_type, target_id),
  KEY reviews_user_idx (user_id),
  KEY reviews_booking_idx (booking_id),
  KEY reviews_approved_idx (is_approved),
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_reviews_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS review_i18n (
  id CHAR(36) PRIMARY KEY,
  review_id CHAR(36) NOT NULL,
  locale VARCHAR(10) NOT NULL,
  title VARCHAR(255),
  comment TEXT NOT NULL,
  admin_reply TEXT,
  consultant_reply TEXT,                                  -- T17-2: astrolog kendi review'ına cevap
  consultant_replied_at DATETIME(3),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY review_i18n_review_locale_uq (review_id, locale),
  KEY review_i18n_locale_idx (locale),
  CONSTRAINT fk_review_i18n_review FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO reviews (
  id, target_type, target_id, user_id, name, email, booking_id, rating,
  is_active, is_approved, display_order, submitted_locale
) VALUES (
  '60000000-0000-4000-8000-000000000001',
  'consultant',
  '20000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000010',
  'Test User',
  'user@example.test',
  '40000000-0000-4000-8000-000000000001',
  5,
  1,
  0,
  10,
  'tr'
) ON DUPLICATE KEY UPDATE
  rating = VALUES(rating),
  is_active = VALUES(is_active),
  is_approved = VALUES(is_approved),
  display_order = VALUES(display_order);

INSERT INTO review_i18n (
  id, review_id, locale, title, comment, admin_reply
) VALUES (
  '61000000-0000-4000-8000-000000000001',
  '60000000-0000-4000-8000-000000000001',
  'tr',
  'Memnun kaldim',
  'Gorusme net, zamaninda ve faydaliydi.',
  NULL
) ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  comment = VALUES(comment),
  admin_reply = VALUES(admin_reply);
