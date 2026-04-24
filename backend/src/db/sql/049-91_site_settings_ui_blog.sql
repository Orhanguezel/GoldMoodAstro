-- =============================================================
-- 049-91_site_settings_ui_blog.sql
-- konigsmassage - UI Blog (site_settings.ui_blog)
--  - Value: JSON (stored as TEXT)
--  - Localized: tr / en / de
--  - Extendable: clone from tr as bootstrap (collation-safe)
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO site_settings (id, `key`, locale, `value`, created_at, updated_at) VALUES
(
  UUID(),
  'ui_blog',
  'tr',
  CAST(JSON_OBJECT(
    'ui_blog_page_title',               'Blog',
    'ui_blog_detail_page_title',        'Blog Detayı',

    'ui_blog_subprefix',                'Energetische Massage',
    'ui_blog_page_lead',                'Enerjetik masaj, beden farkındalığı ve içsel denge üzerine yazılar.',
    'ui_blog_empty',                    'Henüz blog yazısı bulunmuyor.',
    'ui_blog_untitled',                 'Başlıksız',
    'ui_blog_no_image',                 '(Görsel yok)',

    'ui_blog_meta_title',               'Blog | Energetische Massage',
    'ui_blog_meta_description',         'Energetische Massage, derin gevşeme, beden farkındalığı ve içsel denge üzerine yazılar. Energetische Massage - Bonn.',
    'ui_blog_og_image',                 '',

    'ui_blog_loading',                  'Yükleniyor...',
    'ui_blog_not_found',                'Blog içeriği bulunamadı.',
    'ui_blog_back_to_list',             'Tüm yazılara dön',
    'ui_blog_other_blogs_title',        'Diğer yazılar',
    'ui_blog_gallery_title',            'Galeriyi aç',
    'ui_blog_content_soon',             'İçerik yakında eklenecek.',
    'ui_blog_author_fallback',          'Anastasia König',
    'ui_blog_author_role_fallback',     'Blog Admin',

    'ui_blog_highlights_title',         'Öne Çıkanlar',
    'ui_blog_home_subprefix',           'Energetische Massage',
    'ui_blog_home_sublabel',            'Blog',
    'ui_blog_home_title',               'Son Yazılar',
    'ui_blog_home_lead',                'Enerjetik masaj ve iyi oluş üzerine seçilmiş yazılar.',
    'ui_blog_home_view_all',            'Tümünü Gör',
    'ui_blog_home_read_more',           'Devamını oku',

    'ui_blog_tags_title',               'Etiketler:',

    'ui_blog_prev_post',                'Önceki Yazı',
    'ui_blog_next_post',                'Sonraki Yazı',

    'ui_blog_like',                     'Beğen',
    'ui_blog_liked',                    'Beğenildi',
    'ui_blog_share',                    'Paylaş',
    'ui_blog_comments_title',           'Yorumlar',

    'ui_blog_leave_comment',            'Yorum Bırak',
    'ui_blog_comment_label',            'Yorumunuz',
    'ui_blog_comment_placeholder',      'Yazmaya başlayın...',
    'ui_blog_comment_name_placeholder', 'adınız',
    'ui_blog_comment_email_placeholder','e-posta adresiniz',
    'ui_blog_comment_submit',           'Yorum Gönder',

    'ui_blog_contact_cta_title',        'Sorunuz mu var?',
    'ui_blog_contact_cta_desc',         'Seanslar veya randevu ile ilgili sorularınız için bize ulaşabilirsiniz.',
    'ui_blog_contact_phone',            'Telefon',
    'ui_blog_contact_whatsapp',         'WhatsApp',
    'ui_blog_contact_form',             'İletişim formu',
    'ui_blog_filter_all',               'Tümü'
  ) AS CHAR),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_blog',
  'en',
  CAST(JSON_OBJECT(
    'ui_blog_page_title',               'Blog',
    'ui_blog_detail_page_title',        'Blog Detail',

    'ui_blog_subprefix',                'Energetische Massage',
    'ui_blog_page_lead',                'Articles on energetic massage, body awareness, and inner balance.',
    'ui_blog_empty',                    'No blog posts yet.',
    'ui_blog_untitled',                 'Untitled',
    'ui_blog_no_image',                 '(No image)',

    'ui_blog_meta_title',               'Blog | Energetische Massage',
    'ui_blog_meta_description',         'Articles on energetic massage, deep relaxation, body awareness, and inner balance. Energetische Massage - Bonn.',
    'ui_blog_og_image',                 '',

    'ui_blog_loading',                  'Loading...',
    'ui_blog_not_found',                'Blog post not found.',
    'ui_blog_back_to_list',             'Back to all posts',
    'ui_blog_other_blogs_title',        'Other posts',
    'ui_blog_gallery_title',            'Open gallery',
    'ui_blog_content_soon',             'Content will be added soon.',
    'ui_blog_author_fallback',          'Anastasia König',
    'ui_blog_author_role_fallback',     'Blog Admin',

    'ui_blog_highlights_title',         'Highlights',
    'ui_blog_home_subprefix',           'Energetische Massage',
    'ui_blog_home_sublabel',            'Blog',
    'ui_blog_home_title',               'Latest Posts',
    'ui_blog_home_lead',                'Selected posts about energetic massage and well-being.',
    'ui_blog_home_view_all',            'View All',
    'ui_blog_home_read_more',           'Read more',

    'ui_blog_tags_title',               'Tags:',

    'ui_blog_prev_post',                'Previous Post',
    'ui_blog_next_post',                'Next Post',

    'ui_blog_like',                     'Like',
    'ui_blog_liked',                    'Liked',
    'ui_blog_share',                    'Share',
    'ui_blog_comments_title',           'Comments',

    'ui_blog_leave_comment',            'Leave A Comment',
    'ui_blog_comment_label',            'Your comment',
    'ui_blog_comment_placeholder',      'Start type...',
    'ui_blog_comment_name_placeholder', 'your name',
    'ui_blog_comment_email_placeholder','your email',
    'ui_blog_comment_submit',           'Post Comment',

    'ui_blog_contact_cta_title',        'Have a question?',
    'ui_blog_contact_cta_desc',         'If you have questions about a session or scheduling, feel free to contact us.',
    'ui_blog_contact_phone',            'Phone',
    'ui_blog_contact_whatsapp',         'WhatsApp',
    'ui_blog_contact_form',             'Contact form',
    'ui_blog_filter_all',               'All'
  ) AS CHAR),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_blog',
  'de',
  CAST(JSON_OBJECT(
    'ui_blog_page_title',               'Blog',
    'ui_blog_detail_page_title',        'Blogdetails',

    'ui_blog_subprefix',                'Energetische Massage',
    'ui_blog_page_lead',                'Beiträge über energetische Massage, Körperwahrnehmung und innere Balance.',
    'ui_blog_empty',                    'Noch keine Blogbeiträge.',
    'ui_blog_untitled',                 'Ohne Titel',
    'ui_blog_no_image',                 '(Kein Bild)',

    'ui_blog_meta_title',               'Blog | Energetische Massage',
    'ui_blog_meta_description',         'Beiträge über energetische Massage, tiefe Entspannung, Körperwahrnehmung und innere Balance. Energetische Massage - Bonn.',
    'ui_blog_og_image',                 '',

    'ui_blog_loading',                  'Wird geladen...',
    'ui_blog_not_found',                'Blogbeitrag nicht gefunden.',
    'ui_blog_back_to_list',             'Zur Übersicht',
    'ui_blog_other_blogs_title',        'Weitere Beiträge',
    'ui_blog_gallery_title',            'Galerie öffnen',
    'ui_blog_content_soon',             'Inhalt wird in Kürze hinzugefügt.',
    'ui_blog_author_fallback',          'Anastasia König',
    'ui_blog_author_role_fallback',     'Blog-Admin',

    'ui_blog_highlights_title',         'Highlights',
    'ui_blog_home_subprefix',           'Energetische Massage',
    'ui_blog_home_sublabel',            'Blog',
    'ui_blog_home_title',               'Aktuelle Beitraege',
    'ui_blog_home_lead',                'Ausgewaehlte Beitraege ueber energetische Massage und Wohlbefinden.',
    'ui_blog_home_view_all',            'Alle Beitraege',
    'ui_blog_home_read_more',           'Weiterlesen',

    'ui_blog_tags_title',               'Tags:',

    'ui_blog_prev_post',                'Vorheriger Beitrag',
    'ui_blog_next_post',                'Nächster Beitrag',

    'ui_blog_like',                     'Gefällt mir',
    'ui_blog_liked',                    'Gefällt mir',
    'ui_blog_share',                    'Teilen',
    'ui_blog_comments_title',           'Kommentare',

    'ui_blog_leave_comment',            'Kommentar hinterlassen',
    'ui_blog_comment_label',            'Ihr Kommentar',
    'ui_blog_comment_placeholder',      'Beginnen Sie zu schreiben...',
    'ui_blog_comment_name_placeholder', 'Ihr Name',
    'ui_blog_comment_email_placeholder','Ihre E-Mail',
    'ui_blog_comment_submit',           'Kommentar senden',

    'ui_blog_contact_cta_title',        'Noch Fragen?',
    'ui_blog_contact_cta_desc',         'Wenn Sie Fragen zur Sitzung oder zur Terminvereinbarung haben, kontaktieren Sie uns gern.',
    'ui_blog_contact_phone',            'Telefon',
    'ui_blog_contact_whatsapp',         'WhatsApp',
    'ui_blog_contact_form',             'Kontaktformular',
    'ui_blog_filter_all',               'Alle'
  ) AS CHAR),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);
