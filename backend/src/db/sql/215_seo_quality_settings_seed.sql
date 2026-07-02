-- SEO T22: publish gate settings. Disabled by default; admin/ops can enable safely.
INSERT INTO site_settings (id, `key`, locale, value)
VALUES (
  '01000000-0000-4000-8000-000000000215',
  'seo.minimum_score_for_publish',
  '*',
  '{"enabled":false,"score":50,"block_adsense_risk":false}'
)
ON DUPLICATE KEY UPDATE
  value = VALUES(value),
  updated_at = NOW(3);
