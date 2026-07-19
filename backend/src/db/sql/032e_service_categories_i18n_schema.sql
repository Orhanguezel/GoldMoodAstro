-- =============================================================
-- 032e_service_categories_i18n_schema.sql
-- Hizmet kategorileri cok dilli icerik aynasi.
-- Ana tablodaki name/description fallback olarak kalir.
-- =============================================================
CREATE TABLE IF NOT EXISTS service_categories_i18n (
  id CHAR(36) NOT NULL PRIMARY KEY,
  category_id CHAR(36) NOT NULL,
  locale CHAR(8) NOT NULL,
  name VARCHAR(120) NOT NULL,
  description TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY service_categories_i18n_category_locale_uq (category_id, locale),
  KEY service_categories_i18n_locale_idx (locale),
  CONSTRAINT fk_service_categories_i18n_category
    FOREIGN KEY (category_id) REFERENCES service_categories(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO service_categories_i18n
  (id, category_id, locale, name, description)
SELECT
  CONCAT(
    SUBSTRING(MD5(CONCAT(id, '|tr')), 1, 8), '-',
    SUBSTRING(MD5(CONCAT(id, '|tr')), 9, 4), '-4',
    SUBSTRING(MD5(CONCAT(id, '|tr')), 14, 3), '-8',
    SUBSTRING(MD5(CONCAT(id, '|tr')), 18, 3), '-',
    SUBSTRING(MD5(CONCAT(id, '|tr')), 21, 12)
  ),
  id,
  'tr',
  name,
  description
FROM service_categories;

INSERT IGNORE INTO service_categories_i18n
  (id, category_id, locale, name, description)
SELECT
  CONCAT(
    SUBSTRING(MD5(CONCAT(id, '|en')), 1, 8), '-',
    SUBSTRING(MD5(CONCAT(id, '|en')), 9, 4), '-4',
    SUBSTRING(MD5(CONCAT(id, '|en')), 14, 3), '-8',
    SUBSTRING(MD5(CONCAT(id, '|en')), 18, 3), '-',
    SUBSTRING(MD5(CONCAT(id, '|en')), 21, 12)
  ),
  id,
  'en',
  CASE slug
    WHEN 'astrology' THEN 'Astrology'
    WHEN 'birth_chart' THEN 'Birth Chart'
    WHEN 'tarot' THEN 'Tarot'
    WHEN 'numerology' THEN 'Numerology'
    WHEN 'coffee' THEN 'Coffee Reading'
    WHEN 'relationship' THEN 'Love & Relationships'
    WHEN 'mood' THEN 'Spiritual Guidance'
    WHEN 'career' THEN 'Career & Money'
    WHEN 'dream_interpretation' THEN 'Dream Interpretation'
    WHEN 'energy_healing' THEN 'Energy Healing'
    WHEN 'spiritual_guidance' THEN 'Spiritual Mentoring'
    WHEN 'nefes_terapisi' THEN 'Breath Therapy'
    WHEN 'bioenerji' THEN 'Bioenergy'
    WHEN 'reiki' THEN 'Reiki'
    WHEN 'yasam_koclugu' THEN 'Life Coaching'
    WHEN 'bilincalti_donusum' THEN 'Subconscious Transformation'
    WHEN 'psikoloji' THEN 'Psychology'
    WHEN 'fizyonomi' THEN 'Physiognomy'
    ELSE name
  END,
  CASE slug
    WHEN 'astrology' THEN 'Guidance through birth charts and planetary influences.'
    WHEN 'birth_chart' THEN 'Detailed natal chart analysis.'
    WHEN 'tarot' THEN 'Guidance through the symbolism of tarot cards.'
    WHEN 'numerology' THEN 'Life path insights through the language of numbers.'
    WHEN 'coffee' THEN 'Traditional interpretation of coffee cup symbols.'
    WHEN 'relationship' THEN 'Relationship dynamics and synastry insights.'
    WHEN 'mood' THEN 'Support for inner balance and awareness.'
    WHEN 'career' THEN 'Work life, opportunities, and financial flow.'
    WHEN 'dream_interpretation' THEN 'Interpretation of dream symbols.'
    WHEN 'energy_healing' THEN 'Energy balancing and healing work.'
    WHEN 'spiritual_guidance' THEN 'Support on your spiritual path.'
    WHEN 'nefes_terapisi' THEN 'Conscious breathing techniques for stress relief and balance.'
    WHEN 'bioenerji' THEN 'Balancing the body energy flow.'
    WHEN 'reiki' THEN 'Healing sessions with universal life energy.'
    WHEN 'yasam_koclugu' THEN 'Goal setting, motivation, and personal development guidance.'
    WHEN 'bilincalti_donusum' THEN 'Awareness and transformation of subconscious patterns.'
    WHEN 'psikoloji' THEN 'Individual counselling with licensed psychology support.'
    WHEN 'fizyonomi' THEN 'Character reading through the traditional interpretation of facial features.'
    ELSE description
  END
FROM service_categories
WHERE slug IN (
  'astrology','birth_chart','tarot','numerology','coffee','relationship','mood','career',
  'dream_interpretation','energy_healing','spiritual_guidance','nefes_terapisi','bioenerji',
  'reiki','yasam_koclugu','bilincalti_donusum','psikoloji','fizyonomi'
);

INSERT IGNORE INTO service_categories_i18n
  (id, category_id, locale, name, description)
SELECT
  CONCAT(
    SUBSTRING(MD5(CONCAT(id, '|de')), 1, 8), '-',
    SUBSTRING(MD5(CONCAT(id, '|de')), 9, 4), '-4',
    SUBSTRING(MD5(CONCAT(id, '|de')), 14, 3), '-8',
    SUBSTRING(MD5(CONCAT(id, '|de')), 18, 3), '-',
    SUBSTRING(MD5(CONCAT(id, '|de')), 21, 12)
  ),
  id,
  'de',
  CASE slug
    WHEN 'astrology' THEN 'Astrologie'
    WHEN 'birth_chart' THEN 'Geburtshoroskop'
    WHEN 'tarot' THEN 'Tarot'
    WHEN 'numerology' THEN 'Numerologie'
    WHEN 'coffee' THEN 'Kaffeesatzlesen'
    WHEN 'relationship' THEN 'Liebe & Beziehungen'
    WHEN 'mood' THEN 'Spirituelle Begleitung'
    WHEN 'career' THEN 'Karriere & Geld'
    WHEN 'dream_interpretation' THEN 'Traumdeutung'
    WHEN 'energy_healing' THEN 'Energieheilung'
    WHEN 'spiritual_guidance' THEN 'Spirituelles Mentoring'
    WHEN 'nefes_terapisi' THEN 'Atemtherapie'
    WHEN 'bioenerji' THEN 'Bioenergie'
    WHEN 'reiki' THEN 'Reiki'
    WHEN 'yasam_koclugu' THEN 'Life Coaching'
    WHEN 'bilincalti_donusum' THEN 'Unterbewusste Transformation'
    WHEN 'psikoloji' THEN 'Psychologie'
    WHEN 'fizyonomi' THEN 'Physiognomie'
    ELSE name
  END,
  CASE slug
    WHEN 'astrology' THEN 'Begleitung durch Geburtshoroskope und planetarische Einfluesse.'
    WHEN 'birth_chart' THEN 'Detaillierte Analyse des Geburtshoroskops.'
    WHEN 'tarot' THEN 'Begleitung durch die Symbolik der Tarotkarten.'
    WHEN 'numerology' THEN 'Lebensweg-Einsichten durch die Sprache der Zahlen.'
    WHEN 'coffee' THEN 'Traditionelle Deutung von Symbolen in der Kaffeetasse.'
    WHEN 'relationship' THEN 'Beziehungsdynamik und Synastrie-Einsichten.'
    WHEN 'mood' THEN 'Unterstuetzung fuer innere Balance und Achtsamkeit.'
    WHEN 'career' THEN 'Berufsleben, Chancen und finanzieller Fluss.'
    WHEN 'dream_interpretation' THEN 'Deutung von Traumsymbolen.'
    WHEN 'energy_healing' THEN 'Energieausgleich und Heilarbeit.'
    WHEN 'spiritual_guidance' THEN 'Unterstuetzung auf deinem spirituellen Weg.'
    WHEN 'nefes_terapisi' THEN 'Bewusste Atemtechniken fuer Stressabbau und Balance.'
    WHEN 'bioenerji' THEN 'Ausgleich des Energieflusses im Koerper.'
    WHEN 'reiki' THEN 'Heilsitzungen mit universeller Lebensenergie.'
    WHEN 'yasam_koclugu' THEN 'Zielsetzung, Motivation und persoenliche Entwicklung.'
    WHEN 'bilincalti_donusum' THEN 'Bewusstwerden und Transformation unterbewusster Muster.'
    WHEN 'psikoloji' THEN 'Individuelle Beratung mit psychologischer Unterstuetzung.'
    WHEN 'fizyonomi' THEN 'Charakterlesung durch traditionelle Deutung der Gesichtszuege.'
    ELSE description
  END
FROM service_categories
WHERE slug IN (
  'astrology','birth_chart','tarot','numerology','coffee','relationship','mood','career',
  'dream_interpretation','energy_healing','spiritual_guidance','nefes_terapisi','bioenerji',
  'reiki','yasam_koclugu','bilincalti_donusum','psikoloji','fizyonomi'
);
