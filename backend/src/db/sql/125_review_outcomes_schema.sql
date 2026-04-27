-- ============================================================================
-- Review Outcomes — Astrolog Karnesi (FAZ 17 / T17-6)
-- ============================================================================
-- Mantık: Bir review yazıldıktan 6 ay sonra kullanıcıya soruluyor:
--   "6 ay önce X astrologdan aldığın yorum gerçekleşti mi?"
-- Toplanan veri sayesinde astrologların başarı skorları (gerçek veriden,
-- fake-able olmayan trust signal — rakip differentiator F10).
-- ============================================================================

CREATE TABLE IF NOT EXISTS review_outcomes (
  id CHAR(36) PRIMARY KEY,
  review_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  consultant_id CHAR(36) NOT NULL,
  follow_up_at DATETIME(3) NOT NULL,                              -- review.created_at + 6 ay
  user_response ENUM('happened','partially','did_not_happen','no_answer'),
  user_response_at DATETIME(3),
  notes TEXT,
  push_sent_at DATETIME(3),                                       -- bildirim gönderildiyse zaman
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY review_outcomes_review_uq (review_id),
  KEY review_outcomes_user_idx (user_id),
  KEY review_outcomes_consultant_idx (consultant_id),
  KEY review_outcomes_followup_idx (follow_up_at, user_response),
  CONSTRAINT fk_review_outcomes_review FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_review_outcomes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
