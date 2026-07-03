UPDATE site_settings
SET value = JSON_SET(
  value,
  '$.login_error_invalid_credentials',
  CASE locale
    WHEN 'en' THEN 'The email or password is incorrect.'
    WHEN 'de' THEN 'E-Mail oder Passwort ist falsch.'
    ELSE 'E-posta veya şifre hatalı.'
  END
)
WHERE `key` = 'ui_auth'
  AND locale IN ('tr', 'en', 'de');
