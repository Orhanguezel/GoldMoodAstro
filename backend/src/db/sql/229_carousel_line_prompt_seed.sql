-- =============================================================
-- 229_carousel_line_prompt_seed.sql
-- Instagram CAROUSEL kareleri icin kisa satir uretim prompt'u.
--
-- NEDEN: carousel karesi keskin ve SPESIFIK bir satir ister ("Koç: hemen sonuç ister,
-- süreci beklemez"). astrology_kb'deki sign_section metinleri sablon nesir
-- ("Koç için Aşk başlığı yakınlık, güven, çekim ve sevgi dili üzerinden okunur...")
-- — ayni kalip her burcta tekrar ediyor, carousel icin kullanilamaz.
--
-- Cozum: gunluk burc motorunun yaptigi gibi burc profilini (astrology_kb kind='sign')
-- LLM'e besleyip konuya ozel TEK SATIR urettirmek. Uretilen satirlar
-- astrology_kb'ye kind='carousel_line' olarak yazilir; bir kez uretilir, admin
-- panelden duzenlenebilir.
-- =============================================================

-- ⚠️ ID CAKISMASI TUZAGI: ilk denemede '70000000-...-030' secilmisti; o UUID BASKA bir
-- prompt'a aitti. INSERT IGNORE hatayi yuttu, seed "basarili" gorundu ama satir yazilmadi
-- ve LLM cagrilari 'prompt_not_found' verdi. Yeni ID blogu: 70000001-...-<dosya no>.
INSERT IGNORE INTO llm_prompts
  (id, `key`, locale, provider, model, temperature, max_tokens, system_prompt, user_template, notes)
VALUES (
  '70000001-0000-4000-8000-000000000229',
  'carousel_line',
  'tr',
  'anthropic',
  'claude-haiku-4-5',
  0.8,
  200,
  'Sen GoldMoodAstro sosyal medya metin yazarisin. Gorevin, verilen burc ve konu icin Instagram carousel karesine yazilacak TEK SATIRLIK, carpici ve SPESIFIK bir ifade uretmektir. Marka kurallari: yargilayici olma, stereotip uretme, korkutma. Astrolojik dogrulugu burc profilinden al.',
  '## Burç: {{sign_label}}\n## Konu: {{topic_label}}\n\n## Astrolog Onaylı Burç Profili\n{{kb_sign_profile}}\n\n## Görev\nBu burç için "{{topic_label}}" konusunda **tek satırlık** bir ifade yaz.\n\nKurallar:\n- EN FAZLA 60 karakter (Instagram karesine sığmalı)\n- Spesifik ol: "sabırsız" değil, "hemen sonuç ister, süreci beklemez"\n- Burç adını TEKRAR YAZMA (kare zaten burcu gösteriyor)\n- Tırnak, madde işareti, emoji KULLANMA\n- Sadece ifadeyi yaz, açıklama ekleme\n\nÖrnek çıktı biçimi:\nhemen sonuç ister, süreci beklemez',
  'Carousel karesi icin kisa satir. generate-carousel-lines.ts kullanir.'
);
