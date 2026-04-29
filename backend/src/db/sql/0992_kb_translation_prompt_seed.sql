-- =============================================================
-- 0992_kb_translation_prompt_seed.sql
-- T19-4 — DeepL/Anthropic EN→TR çeviri pipeline prompt template'i.
-- =============================================================

INSERT INTO llm_prompts (
  id, `key`, locale, provider, model, temperature, max_tokens,
  system_prompt, user_template, notes, safety_check, similarity_threshold, max_attempts, is_active
) VALUES
(
  '70000000-0000-4000-8000-000000000031',
  'kb_translate_en_tr',
  'tr',
  'anthropic',
  'claude-haiku-4-5',
  0.35,
  1400,
  'Sen GoldMoodAstro çeviri editörüsün. İngilizce astrology_kb içeriğini Türkçeye çevirirken terimleri doğru, dili modern ve güvenli tut. Kelime kelime çeviri yapma; anlamı koru, Türkçe ürün diline uyumla. Kaderci, korkutucu, tıbbi/finansal kesinlik içeren ifadeleri yumuşat. Kaynak ve atıf bilgisini koru. Sadece geçerli JSON döndür.',
  '## Source KB\nkind: {{kind}}\nkey1: {{key1}}\nkey2: {{key2}}\nkey3: {{key3}}\nsource locale: en\ntarget locale: tr\nsource: {{source}}\nauthor: {{author}}\n\n## English Title\n{{title}}\n\n## English Summary\n{{short_summary}}\n\n## English Content\n{{content}}\n\n## Task\nTürkçe astrology_kb kaydı üret. JSON formatı:\n{\n  "kind": "{{kind}}",\n  "key1": "{{key1}}",\n  "key2": {{key2_json}},\n  "key3": {{key3_json}},\n  "locale": "tr",\n  "title": "Türkçe başlık",\n  "content": "180-320 kelime Türkçe editoryal KB metni",\n  "short_summary": "Tek cümle Türkçe özet",\n  "tone": "{{tone}}",\n  "source": "{{source}} | translated:en-tr",\n  "author": "{{author}}",\n  "is_active": false\n}',
  'EN astrology_kb kayıtlarını TR taslaklara çevirmek için Anthropic/DeepL sonrası edit promptu. Admin translation-drafts endpointi taslak kuyruğu oluşturur.',
  1,
  0.80,
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

