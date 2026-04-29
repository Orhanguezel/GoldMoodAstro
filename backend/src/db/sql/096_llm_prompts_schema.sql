-- =============================================================
-- 096_llm_prompts_schema.sql
-- Admin panelinden düzenlenebilir LLM prompt şablonları.
-- Hibrit içerik motorunun "talimat" katmanı.
-- =============================================================

CREATE TABLE IF NOT EXISTS llm_prompts (
  id CHAR(36) PRIMARY KEY,
  -- Mantıksal anahtar — kod bu key'le çağırır.
  -- Örnek: 'natal_overview', 'natal_planet_sign', 'natal_aspect',
  --        'daily_reading', 'transit_summary'
  `key` VARCHAR(80) NOT NULL,
  locale VARCHAR(8) NOT NULL DEFAULT 'tr',

  -- Provider seçimi (groq 2026-04-28 eklendi — geoserra'dan)
  provider ENUM('openai','anthropic','groq','azure','local') NOT NULL DEFAULT 'anthropic',
  model VARCHAR(120) NOT NULL DEFAULT 'claude-haiku-4-5',
  temperature DECIMAL(3,2) NOT NULL DEFAULT 0.80,
  max_tokens INT NOT NULL DEFAULT 800,

  -- Promptlar — Mustache benzeri {{placeholder}} desteği var (renderer doldurur)
  system_prompt TEXT NOT NULL,
  user_template TEXT NOT NULL,

  -- Üretim sonrası güvenlik filtresi (regex tabanlı, _shared/contentModeration)
  safety_check TINYINT NOT NULL DEFAULT 1,

  -- Anti-copy-paste embedding eşik değeri (cosine sim)
  similarity_threshold DECIMAL(3,2) NOT NULL DEFAULT 0.85,

  -- Maks deneme sayısı (similarity reroll için)
  max_attempts TINYINT NOT NULL DEFAULT 3,

  notes TEXT,
  is_active TINYINT NOT NULL DEFAULT 1,

  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  UNIQUE KEY llm_prompts_key_locale_uq (`key`, locale),
  KEY llm_prompts_active_idx (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Örnek prompt şablonları (admin panelden düzenlenebilir, başlangıç değerleri)
INSERT INTO llm_prompts (id, `key`, locale, provider, model, temperature, max_tokens, system_prompt, user_template, notes) VALUES
(
  '70000000-0000-4000-8000-000000000001',
  'natal_overview',
  'tr',
  'anthropic',
  'claude-haiku-4-5',
  0.85,
  1200,
  'Sen GoldMoodAstro''nun astrolojik yorum motorusun. Görevin, kullanıcının doğum haritasını sıcak, profesyonel ve KESİN YARGI içermeyen bir Türkçe ile yorumlamak. Ölüm, ağır hastalık, kesin ayrılık, ihanet kesinliği gibi zarar verici ifadeler ASLA kullanma. Aşağıda astrolog ekibimizin "altın metinleri" var; bunları temel al, kullanıcıya kişiselleştir, ama ASTROLOJİK ANLAMI ASLA değiştirme.',
  '## Kullanıcı: {{name}}\n\n## Doğum Haritası Özeti\n- Güneş: {{sun_sign}} {{sun_house}}. ev\n- Ay: {{moon_sign}} {{moon_house}}. ev\n- Yükselen: {{ascendant_sign}}\n\n## Astrolog Onaylı Altın Metinler\n{{kb_excerpts}}\n\n## Önemli Açılar\n{{key_aspects}}\n\n## Görev\nYukarıdaki altın metinlere DAYANARAK 250-350 kelimelik akıcı bir GENEL BAKIŞ yorumu yaz. Şu yapıyı izle:\n1. Açılış (1-2 cümle): Güneş+Ay+Yükselen üçlüsünün kişilik özetinden bir cümle.\n2. Karakter (4-5 cümle): Güneş ve Ay yerleşimlerinin nasıl bir iç dünya yarattığını açıkla.\n3. İlişki tarzı (2-3 cümle): Venüs ve 7. ev üzerinden.\n4. Eylem stili (2-3 cümle): Mars üzerinden.\n5. Kapanış (1 cümle): Önümüzdeki dönem için cesaret veren bir not.\n\nAltın metinleri kelime kelime kopyalama — kullanıcıya hitap eden ikinci tekil şahısla yeniden yaz.',
  'Doğum haritası ana yorumu — kullanıcı haritayı ilk gördüğünde gösterilen.'
),
(
  '70000000-0000-4000-8000-000000000002',
  'daily_reading',
  'tr',
  'anthropic',
  'claude-haiku-4-5',
  0.85,
  600,
  'Sen GoldMoodAstro günlük yorum motorusun. Kullanıcının doğum haritasına bugünün gezegen geçişlerini uygulayarak sıcak, somut, eylem yönelimli bir TR yorum yaz. Kesin yargı yok, kehanet yok, kötü haber yok.',
  '## Kullanıcı: {{name}} — Bugün: {{today}}\n\n## Natal\n- Güneş: {{sun_sign}} {{sun_house}}. ev\n- Ay: {{moon_sign}} {{moon_house}}. ev\n\n## Bugünün önemli transitleri (natal''e dokunan)\n{{transit_aspects}}\n\n## Altın Metinler (transit yorumu)\n{{kb_excerpts}}\n\n## Son 30 günde yazılmış yorumlar (TEKRAR ETME)\n{{recent_readings}}\n\n## Görev\n180-240 kelime: önce bugünün kısa teması (1 cümle), sonra ilişki/iş/öz-bakım için ayrı 2''şer cümle. Son 30 günde kullanılan ifadeleri tekrarlama.',
  'Günlük yorum — her sabah üretilir, embedding ile anti-copy-paste.'
),
(
  '70000000-0000-4000-8000-000000000003',
  'natal_planet_sign',
  'tr',
  'anthropic',
  'claude-haiku-4-5',
  0.75,
  300,
  'Tek bir gezegen+burç yerleşimini kullanıcıya kişiselleştir. Astrolog metnini KORU ama kullanıcıya hitap eden, ikinci tekil şahıs Türkçesi ile.',
  '## Yerleşim: {{planet}} {{sign}}\n\n## Astrolog Metni\n{{kb_text}}\n\n## Görev\n80-120 kelime, kullanıcıya hitap ederek anlat. "Senin için" diye başla.',
  'Tekil yerleşim mikro-yorumu (popup/tooltip için).'
)
ON DUPLICATE KEY UPDATE
  provider = VALUES(provider),
  model = VALUES(model),
  notes = VALUES(notes);
