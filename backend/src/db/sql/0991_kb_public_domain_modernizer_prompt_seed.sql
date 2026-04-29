-- =============================================================
-- 0991_kb_public_domain_modernizer_prompt_seed.sql
-- T19-4 — Public domain klasik astroloji metinlerini modern KB formatına
-- dönüştürmek için admin'den çalıştırılabilir prompt template'i.
-- =============================================================

INSERT INTO llm_prompts (
  id, `key`, locale, provider, model, temperature, max_tokens,
  system_prompt, user_template, notes, safety_check, similarity_threshold, max_attempts, is_active
) VALUES
(
  '70000000-0000-4000-8000-000000000030',
  'kb_public_domain_modernizer',
  'tr',
  'anthropic',
  'claude-haiku-4-5',
  0.55,
  1600,
  'Sen GoldMoodAstro editoryal bilgi tabanı asistanısın. Görevin, kamu malı eski astroloji metinlerini günümüz Türkçesine ve GoldMoodAstro güvenlik standartlarına uygun hale getirmektir. Metni aynen çevirmeye veya kopyalamaya çalışma; anlamı kısa, anlaşılır ve sorumlu bir KB kaydına dönüştür. Kaderci, korkutucu, ayrımcı, tıbbi/finansal kesinlik iddiası taşıyan ifadeleri yumuşat. Bilimsel kesinlik iddiası kurma. Kaynak/atıf alanlarını koru.',
  '## Kaynak Bilgisi\n- Eser/Yazar: {{source_title}}\n- Yayın yılı: {{source_year}}\n- Bölüm/Sayfa: {{source_section}}\n- Lisans/Kamu malı notu: {{license_note}}\n\n## Hedef KB Anahtarları\n- kind: {{kind}}\n- key1: {{key1}}\n- key2: {{key2}}\n- key3: {{key3}}\n- locale: tr\n\n## Eski Kaynak Metin\n{{source_excerpt}}\n\n## Görev\nAşağıdaki JSON formatında tek bir KB kaydı üret:\n{\n  "kind": "{{kind}}",\n  "key1": "{{key1}}",\n  "key2": {{key2_json}},\n  "key3": {{key3_json}},\n  "locale": "tr",\n  "title": "Kısa ve açıklayıcı Türkçe başlık",\n  "content": "180-260 kelime. Modern, sıcak ama profesyonel Türkçe. Eski metnin ana sembolik fikrini koru, ancak korkutucu/kaderci kesinlikleri olasılık ve farkındalık diline çevir. Kullanıcıya doğrudan hitap etme; KB metni genel ve editoryal olsun.",\n  "short_summary": "1 cümlelik özet",\n  "tone": "professional",\n  "source": "{{source_title}} — {{source_section}}",\n  "author": "{{source_author}}",\n  "is_active": false\n}\n\nSadece geçerli JSON döndür. Markdown fence kullanma.',
  'Public domain klasik astroloji metinlerini modern GoldMoodAstro astrology_kb JSON kaydına dönüştürme yardımcısı. Örnek kullanım: Alan Leo ve benzeri 1900ler kamu malı kaynaklar.',
  1,
  0.78,
  2,
  1
)
ON DUPLICATE KEY UPDATE
  provider = VALUES(provider),
  model = VALUES(model),
  temperature = VALUES(temperature),
  max_tokens = VALUES(max_tokens),
  system_prompt = VALUES(system_prompt),
  user_template = VALUES(user_template),
  notes = VALUES(notes),
  safety_check = VALUES(safety_check),
  similarity_threshold = VALUES(similarity_threshold),
  max_attempts = VALUES(max_attempts),
  is_active = VALUES(is_active);

