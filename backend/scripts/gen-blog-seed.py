#!/usr/bin/env python3
# 199_blog_posts_seed.sql'i blog-uplift-data zengin içeriğinden üretir.
# title+slug korunur (SEO URL sabit), content+meta+tags+alt JSON'dan zengin gelir.
# i18n = INSERT IGNORE (admin düzenlemesini ASLA ezmez). Parent ON DUPLICATE yalnız sistem kolonları.
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, 'blog-uplift-data')
OUT = os.path.join(HERE, '..', 'src', 'db', 'sql', '199_blog_posts_seed.sql')

# page tail -> (featured_image svg, featured, order)
PAGE = {
    '1': ('/img/blog/birth-chart.webp', 1, 101),
    '2': ('/img/blog/synastry.webp',    1, 102),
    '3': ('/img/blog/tarot.webp',       1, 103),
    '4': ('/img/blog/numerology.webp',  0, 104),
    '5': ('/img/blog/moon-sign.webp',   0, 105),
    '6': ('/img/blog/retrograde.webp',  0, 106),
    '7': ('/img/blog/consultant.webp',  0, 107),
    '8': ('/img/blog/daily-ritual.webp',0, 108),
}
# (tail, locale) -> (title, slug)  — mevcut seed'den korunur (SEO sabit)
TS = {
 ('1','tr'):('Doğum Haritası Nedir, İlk Bakışta Neler Anlatır?','dogum-haritasi-nedir'),
 ('1','en'):('What Is a Birth Chart and What Does It Reveal First?','what-is-a-birth-chart'),
 ('1','de'):('Was ist ein Geburtshoroskop und was zeigt es zuerst?','was-ist-ein-geburtshoroskop'),
 ('2','tr'):('Sinastri Uyumu Nasıl Okunur?','sinastri-uyumu-nasil-okunur'),
 ('2','en'):('How to Read Synastry Compatibility','how-to-read-synastry-compatibility'),
 ('2','de'):('Synastrie richtig lesen','synastrie-richtig-lesen'),
 ('3','tr'):('Tarot Açılımında Daha İyi Soru Nasıl Sorulur?','tarot-acilimi-soru-sorma-rehberi'),
 ('3','en'):('How to Ask Better Tarot Questions','how-to-ask-better-tarot-questions'),
 ('3','de'):('Bessere Tarot-Fragen stellen','bessere-tarot-fragen-stellen'),
 ('4','tr'):('Numerolojide Hayat Yolu Sayısı Ne Anlatır?','numeroloji-hayat-yolu-sayisi'),
 ('4','en'):('Life Path Number in Numerology','life-path-number-in-numerology'),
 ('4','de'):('Lebenswegzahl in der Numerologie','lebenswegzahl-numerologie'),
 ('5','tr'):('Ay Burcu Duygusal İhtiyaçları Nasıl Gösterir?','ay-burcu-duygusal-ihtiyaclar'),
 ('5','en'):('Moon Sign and Emotional Needs','moon-sign-and-emotional-needs'),
 ('5','de'):('Mondzeichen und emotionale Bedürfnisse','mondzeichen-und-emotionale-beduerfnisse'),
 ('6','tr'):('Retro Dönemlerinde Karar Almak','retro-donemlerinde-karar-almak'),
 ('6','en'):('Making Decisions During Retrogrades','making-decisions-during-retrogrades'),
 ('6','de'):('Entscheidungen in rückläufigen Phasen','entscheidungen-in-ruecklaeufigen-phasen'),
 ('7','tr'):('Ruhsal Danışman Seçerken Nelere Bakılmalı?','ruhsal-danisman-secme-rehberi'),
 ('7','en'):('How to Choose a Spiritual Consultant','how-to-choose-a-spiritual-consultant'),
 ('7','de'):('Spirituelle Beratung wählen','spirituelle-beratung-waehlen'),
 ('8','tr'):('Günlük Ritüel: Astroloji ve Tarot ile Kısa Check-in','gunluk-rituel-astroloji-tarot'),
 ('8','en'):('Daily Ritual with Astrology and Tarot','daily-ritual-with-astrology-and-tarot'),
 ('8','de'):('Tägliches Ritual mit Astrologie und Tarot','taegliches-ritual-astrologie-tarot'),
}

def esc(s):
    return str(s if s is not None else '').replace('\\', '\\\\').replace("'", "''")

def content_of(loc):
    return (loc.get('content') or loc.get('content_html') or '').strip()

pages, i18n = [], []
for f in sorted(os.listdir(DATA)):
    if not f.endswith('.json'): continue
    d = json.load(open(os.path.join(DATA, f), encoding='utf-8'))
    pid = d['page_id']; tail = pid[-1]
    img, feat, order = PAGE[tail]
    pages.append(f"  ('{pid}', 'blog', 1, {feat}, '{img}', {order}, {order}, NOW(3), NOW(3))")
    for loc in ('tr','en','de'):
        L = d.get(loc)
        if not L: continue
        title, slug = TS[(tail, loc)]
        html = json.dumps({'html': content_of(L)}, ensure_ascii=False)
        iid = f"b1{loc}0000-0000-4000-8000-0000000000{tail.zfill(2)}"
        i18n.append(
            f"  ('{iid}', '{pid}', '{loc}', '{esc(title)}', '{esc(slug)}', "
            f"'{esc(html)}', '{esc(L.get('meta_description',''))}', '{esc(L.get('alt') or L.get('featured_image_alt',''))}', "
            f"'{esc(L.get('meta_title',''))}', '{esc(L.get('meta_description',''))}', '{esc(L.get('tags',''))}', NOW(3), NOW(3))"
        )

sql = f"""-- =============================================================
-- FILE: 199_blog_posts_seed.sql  (OTOMATİK ÜRETİLDİ: gen-blog-seed.py)
-- GoldMoodAstro editorial blog — ZENGİN içerik (tr/en/de, 700+ kelime)
-- i18n = INSERT IGNORE: admin düzenlemesini ASLA ezmez, deploy içeriği silmez.
-- Parent ON DUPLICATE yalnız sistem kolonları (featured_image korunur).
-- =============================================================

INSERT INTO custom_pages (
  id, module_key, is_published, featured, featured_image, display_order, order_num, created_at, updated_at
) VALUES
{",\n".join(pages)}
ON DUPLICATE KEY UPDATE
  module_key = VALUES(module_key),
  is_published = VALUES(is_published),
  display_order = VALUES(display_order),
  order_num = VALUES(order_num),
  updated_at = NOW(3);

INSERT IGNORE INTO custom_pages_i18n (
  id, custom_page_id, locale, title, slug, content, summary, featured_image_alt, meta_title, meta_description, tags, created_at, updated_at
) VALUES
{",\n".join(i18n)};
"""

open(OUT, 'w', encoding='utf-8').write(sql)
print(f"yazıldı: {OUT}  ({len(pages)} parent, {len(i18n)} i18n)")
