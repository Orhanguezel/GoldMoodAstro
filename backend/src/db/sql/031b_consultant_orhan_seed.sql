-- =============================================================
-- 031b_consultant_orhan_seed.sql
-- Orhan Güzel — sanal asistan astrolog danışman.
--
-- ÖNEMLİ: Bu danışman canlı görüşme almaz (is_available=0, session_price=0).
-- consultantServices tablosuna kaydı eklenmez → "Randevu Al" / "Hemen Görüş"
-- butonları doğal olarak görünmez. Yalnızca async messaging için açıktır.
--
-- Profil tamamen normal bir astrolog görünür; arayüzde "bot/asistan" etiketi yoktur.
-- Bağlantı kontrolü: backend booking flow zaten is_available=0 olan danışmana
-- anlık görüşme talebi gönderilmesini engeller (T29-4 controller).
-- =============================================================

-- 1) Kullanıcı kaydı (consultant rolünde)
INSERT INTO users (id, email, password_hash, full_name, phone, role, is_active, email_verified) VALUES
('10000000-0000-4000-8000-0000000000c1','orhan.guzel@goldmood.test',@ADMIN_PASSWORD_HASH,'Orhan Güzel','+905554444444','consultant',1,1)
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), role = VALUES(role);

-- 2) user_roles consultant
INSERT INTO user_roles (id, user_id, role) VALUES
('aaaaaaaa-0000-4000-8000-000000000108','10000000-0000-4000-8000-0000000000c1','consultant')
ON DUPLICATE KEY UPDATE role = VALUES(role);

-- 3) Consultants kaydı — zengin profil, canlı görüşme YOK (is_available=0)
INSERT INTO consultants (
  id, user_id, slug,
  bio, expertise, languages, meeting_platforms, social_links,
  session_price, session_duration, supports_video, video_session_price,
  currency, approval_status, is_available, rating_avg, rating_count, total_sessions
) VALUES
(
  '20000000-0000-4000-8000-000000000008',
  '10000000-0000-4000-8000-0000000000c1',
  'orhan-guzel',
  'Orhan Güzel — astroloji, tarot ve numeroloji alanlarında 15 yılı aşkın deneyime sahip rehber. Doğum haritası analizi, sinastri (ilişki uyumu), kariyer haritası, transit yorumlama ve spiritüel danışmanlık konularında derin bir uzmanlığa sahiptir.\n\nAstrolojiyi hem klasik (Helenistik, Vedik) hem de psikolojik (Liz Greene, Steven Forrest okulu) yaklaşımlarla birleştirir. Numerolojide Pisagor sistemini esas alır; tarot okumalarında Rider-Waite ve Thoth ekollerini kullanır.\n\nFelsefesi: "Astroloji bir kader bildirimi değil; kendini tanımanın, döngülerini fark etmenin ve seçim alanını genişletmenin sembolik bir dilidir." Görüşmelerinde danışana hızlı ve net bir özet sunmayı, sonra derinleşmeyi tercih eder.\n\nÖzel ilgi alanları: Plüton transitleri, satürn döngüsü (Saturn return), 12. ev temaları, gölge çalışması ve evrimsel astroloji. Türkçe astroloji terminolojisinin sadeleştirilmesi konusunda eğitim içerikleri üretir.\n\nBu profilden anlık sesli/görüntülü görüşme planlanmamaktadır; mesaj üzerinden detaylı sorularınızı yöneltebilir, asenkron olarak rehberlik alabilirsiniz.',
  '["astrology","birth_chart","relationship","tarot","numerology","career","spiritual_guidance"]',
  '["tr","en"]',
  '["chat"]',
  '{"website":"https://www.goldmoodastro.com","instagram":"https://instagram.com/orhanguzelastro","linkedin":"https://linkedin.com/in/orhan-guzel-astrology"}',
  0.00, 30, 0, 0.00,
  'TRY', 'approved', 0, 5.00, 18, 0
)
ON DUPLICATE KEY UPDATE
  slug = VALUES(slug),
  bio = VALUES(bio),
  expertise = VALUES(expertise),
  languages = VALUES(languages),
  meeting_platforms = VALUES(meeting_platforms),
  social_links = VALUES(social_links),
  session_price = VALUES(session_price),
  is_available = VALUES(is_available),
  rating_avg = VALUES(rating_avg),
  rating_count = VALUES(rating_count);

-- NOT: Orhan için yorumlar (reviews + review_i18n) ayrı dosyaya taşındı:
-- → 123_reviews_orhan_seed.sql (120_review_schema.sql sonra çalışır)
