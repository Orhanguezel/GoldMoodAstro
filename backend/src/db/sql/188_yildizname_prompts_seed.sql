-- =============================================================
-- 188_yildizname_prompts_seed.sql
-- FAZ 24 / T24-1 — Yıldızname LLM hibrit prompt
-- Premium feature: kullanıcının doğum haritası ile harmanlanmış 300 kelime ek
-- =============================================================
-- Akış: yildizname_readings.menzil + kullanıcının chart (sun/moon/asc) →
--       LLM "harita uyumu" yazar → llm_extra alanına kaydedilir.
-- Cost: ~$0.001/rapor (Groq llama-3.3-70b ile)
-- =============================================================

INSERT INTO llm_prompts (id, `key`, locale, provider, model, temperature, max_tokens, system_prompt, user_template, notes) VALUES
(
  '70000000-0000-4000-8000-000000000040',
  'yildizname_chart_extra',
  'tr',
  'groq',
  'meta-llama/llama-4-scout-17b-16e-instruct',
  0.80,
  600,
  'Sen GoldMoodAstro yıldızname yorumcususun. Görevin, klasik yıldızname menzili yorumunu kullanıcının doğum haritasıyla harmanlayarak 250-350 kelimelik EK bir yorum yazmaktır. Marka kuralları KIRMIZI ÇİZGİDİR: ❌ Kehanet, ❌ Korkutucu yorum, ❌ Yıldızname geleneğini ironikleştirme. Türk-İslam yıldızname geleneği ile modern astroloji köprüsünü saygılı bir dille kur.',
  '## Yıldızname Menzili\n{{menzil_no}} — {{menzil_name_tr}} ({{menzil_name_ar}})\n\n## Klasik Menzil Yorumu (zaten okunmuş)\n{{menzil_content}}\n\n## Kullanıcının Doğum Haritası\n- Güneş: {{sun_sign_label}}\n- Ay: {{moon_sign_label}}\n- Yükselen: {{asc_sign_label}}\n\n## Görev\n250-350 kelime, "Senin için..." ile başlayan ikinci tekil şahıs Türkçesi. Yapı:\n\n1. **Köprü** (2-3 cümle): Yıldızname menzili ile haritandaki Güneş/Ay/Yükselen üçlüsünün nasıl bir araya geldiği — geleneksel sayı + modern astroloji.\n2. **Üç katman** (her biri 2-3 cümle):\n   - Güneş yerleşimi açısından menzilin sana mesajı\n   - Ay yerleşimi açısından menzilin duygusal taşıması\n   - Yükselen açısından menzilin dış dünyada nasıl yansıyabileceği\n3. **Kapanış** (2 cümle): Bu hibrit okumadan çıkan içsel davet.\n\nDil: olasılıklı, destekleyici, "olabilir, sembolize ediyor, davet ediyor". Kesin yargı/kehanet kullanma.',
  'Yıldızname premium hibrit yorumu — menzil + harita harmanlama. Groq Llama 4 Scout (hızlı, ucuz).'
)
ON DUPLICATE KEY UPDATE
  system_prompt = VALUES(system_prompt),
  user_template = VALUES(user_template),
  notes = VALUES(notes);
