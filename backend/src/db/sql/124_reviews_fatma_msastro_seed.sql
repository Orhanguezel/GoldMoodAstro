-- MsAstro Astrolog Fatma Güçlü aktarımının kontrol adımı.
-- Kaynak API (2026-08-13): comment_count=1278, comment_rate=5.00, follow_count=717.
-- follow_count yorum değildir ve GoldMoodAstro favorilerine aktarılmaz.

SET @FATMA_CONSULTANT := (
  SELECT c.id
  FROM consultants c
  JOIN users u ON u.id = c.user_id
  WHERE u.full_name IN ('Fatma Güçlü', 'Astrolog Fatma Güçlü')
  LIMIT 1
);

UPDATE users u
JOIN consultants c ON c.user_id = u.id
SET u.full_name = 'Astrolog Fatma Güçlü'
WHERE c.id = @FATMA_CONSULTANT;

-- Önceki eksik 10-kayıtlık aktarımı ve yanlış follow/beğeni metriğini temizle.
DELETE FROM reviews
WHERE target_id = @FATMA_CONSULTANT AND company = 'msastro.co';

UPDATE consultants
SET social_links = JSON_REMOVE(
  COALESCE(social_links, JSON_OBJECT()),
  '$.external_likes', '$.external_likes_source', '$.external_likes_checked_at'
)
WHERE id = @FATMA_CONSULTANT;
