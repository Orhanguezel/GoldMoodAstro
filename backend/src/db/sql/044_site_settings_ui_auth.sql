-- =============================================================
-- 044_site_settings_ui_auth.sql  (Auth pages - login/register/logout)
--  - Key: ui_auth
--  - Value: JSON (stored as TEXT)
--  - Localized: tr / en / de
--  - Extendable: clone from tr as bootstrap (collation-safe)
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO site_settings (id, `key`, locale, `value`, created_at, updated_at) VALUES
(
  UUID(),
  'ui_auth',
  'tr',
  CAST(JSON_OBJECT(
    /* =========================================================
       META (NEW KEYS - preferred)
       ========================================================= */
    'ui_auth_login_meta_title',           'Giriş Yap | Energetische Massage',
    'ui_auth_login_meta_description',     'Energetische Massage hesabınıza giriş yapın.',
    'ui_auth_register_meta_title',        'Kayıt Ol | Energetische Massage',
    'ui_auth_register_meta_description',  'Energetische Massage hesabı oluşturun.',
    'ui_auth_logout_meta_title',          'Çıkış Yapılıyor | Energetische Massage',
    'ui_auth_logout_meta_description',    'Energetische Massage hesabınızdan çıkış yapılıyor.',

    /* =========================================================
       META (LEGACY KEYS - backward compatible)
       ========================================================= */
    'login_meta_title',      'Giriş Yap | Energetische Massage',
    'login_meta_desc',       'Energetische Massage hesabınıza giriş yapın.',
    'register_meta_title',   'Kayıt Ol | Energetische Massage',
    'register_meta_desc',    'Energetische Massage hesabı oluşturun.',
    'logout_meta_title',     'Çıkış Yapılıyor | Energetische Massage',
    'logout_meta_desc',      'Energetische Massage hesabınızdan çıkış yapılıyor.',

    /* =========================================================
       LOGIN
       ========================================================= */
    'login_title',                   'Giriş Yap',
    'login_lead',                    'Hesabınıza giriş yapın veya yeni hesap oluşturun.',
    'login_email_label',             'E-posta',
    'login_email_placeholder',       'ornek@example.com',
    'login_password_label',          'Şifre',
    'login_password_placeholder',    'Şifreniz',
    'login_remember_me',             'Beni hatırla',
    'login_submit',                  'Giriş Yap',
    'login_loading',                 'Giriş yapılıyor...',
    'login_or',                      'veya',
    'login_google_button',           'Google ile devam et',
    'login_google_loading',          'Google yönlendiriliyor...',
    'login_no_account',              'Hesabın yok mu?',
    'login_register_link',           'yeni hesap oluşturun',
    'login_register_cta',            'Hemen kayıt ol',
    'login_error_required',          'E-posta ve şifre zorunludur.',
    'login_error_google_generic',    'Google ile giriş başlatılırken bir hata oluştu.',

    /* =========================================================
       REGISTER
       ========================================================= */
    'register_title',                        'Kayıt Ol',
    'register_lead_has_account',             'Zaten hesabın var mı?',
    'register_login_link',                   'Giriş yap',
    'register_fullname_label',               'Ad Soyad',
    'register_fullname_placeholder',         'Adınız Soyadınız',
    'register_phone_label',                  'Telefon',
    'register_phone_placeholder',            '+90 5xx xxx xx xx',
    'register_email_label',                  'E-posta',
    'register_email_placeholder',            'ornek@example.com',
    'register_password_label',               'Şifre',
    'register_password_placeholder',         'Şifreniz',
    'register_password_again_label',         'Şifre (Tekrar)',
    'register_password_again_placeholder',   'Şifrenizi tekrar girin',
    'register_submit',                       'Kayıt Ol',
    'register_loading',                      'Kayıt olunuyor...',
    'register_or',                           'veya',
    'register_google_button',                'Google ile devam et',
    'register_google_loading',               'Google yönlendiriliyor...',
    'register_error_required',               'E-posta ve şifre zorunludur.',
    'register_error_password_length',        'Şifre en az 6 karakter olmalıdır.',
    'register_error_password_mismatch',      'Şifreler eşleşmiyor.',
    'register_error_google_generic',         'Google ile kayıt başlatılırken bir hata oluştu.',

    /* =========================================================
       LOGOUT
       ========================================================= */
    'logout_title',   'Çıkış yapılıyor...',
    'logout_lead',    'Lütfen bekleyin, birkaç saniye içinde giriş sayfasına yönlendirileceksiniz.',
    'logout_error',   'Sunucudan çıkış yapılırken bir sorun oluştu, ancak yerel oturumunuz temizlendi.'
  ) AS CHAR),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_auth',
  'en',
  CAST(JSON_OBJECT(
    /* =========================================================
       META (NEW KEYS - preferred)
       ========================================================= */
    'ui_auth_login_meta_title',           'Sign In | Energetische Massage',
    'ui_auth_login_meta_description',     'Sign in to your Energetische Massage account.',
    'ui_auth_register_meta_title',        'Sign Up | Energetische Massage',
    'ui_auth_register_meta_description',  'Create your Energetische Massage account.',
    'ui_auth_logout_meta_title',          'Signing out | Energetische Massage',
    'ui_auth_logout_meta_description',    'Signing you out of your Energetische Massage account.',

    /* =========================================================
       META (LEGACY KEYS - backward compatible)
       ========================================================= */
    'login_meta_title',      'Sign In | Energetische Massage',
    'login_meta_desc',       'Sign in to your Energetische Massage account.',
    'register_meta_title',   'Sign Up | Energetische Massage',
    'register_meta_desc',    'Create your Energetische Massage account.',
    'logout_meta_title',     'Signing out | Energetische Massage',
    'logout_meta_desc',      'Signing you out of your Energetische Massage account.',

    /* =========================================================
       LOGIN
       ========================================================= */
    'login_title',                   'Sign In',
    'login_lead',                    'Sign in to your account or create a new one.',
    'login_email_label',             'Email',
    'login_email_placeholder',       'example@example.com',
    'login_password_label',          'Password',
    'login_password_placeholder',    'Your password',
    'login_remember_me',             'Remember me',
    'login_submit',                  'Sign In',
    'login_loading',                 'Signing in...',
    'login_or',                      'or',
    'login_google_button',           'Continue with Google',
    'login_google_loading',          'Redirecting to Google...',
    'login_no_account',              'Don''t have an account?',
    'login_register_link',           'create a new account',
    'login_register_cta',            'Sign up',
    'login_error_required',          'Email and password are required.',
    'login_error_google_generic',    'An error occurred while starting Google login.',

    /* =========================================================
       REGISTER
       ========================================================= */
    'register_title',                        'Sign Up',
    'register_lead_has_account',             'Already have an account?',
    'register_login_link',                   'Sign in',
    'register_fullname_label',               'Full Name',
    'register_fullname_placeholder',         'Your full name',
    'register_phone_label',                  'Phone',
    'register_phone_placeholder',            '+90 5xx xxx xx xx',
    'register_email_label',                  'Email',
    'register_email_placeholder',            'example@example.com',
    'register_password_label',               'Password',
    'register_password_placeholder',         'Your password',
    'register_password_again_label',         'Password (again)',
    'register_password_again_placeholder',   'Re-enter your password',
    'register_submit',                       'Sign Up',
    'register_loading',                      'Creating account...',
    'register_or',                           'or',
    'register_google_button',                'Continue with Google',
    'register_google_loading',               'Redirecting to Google...',
    'register_error_required',               'Email and password are required.',
    'register_error_password_length',        'Password must be at least 6 characters.',
    'register_error_password_mismatch',      'Passwords do not match.',
    'register_error_google_generic',         'An error occurred while starting Google signup.',

    /* =========================================================
       LOGOUT
       ========================================================= */
    'logout_title',   'Signing out...',
    'logout_lead',    'Please wait, you will be redirected to the login page in a few seconds.',
    'logout_error',   'There was a problem signing out from the server, but your local session has been cleared.'
  ) AS CHAR),
  NOW(3),
  NOW(3)
),
(
  UUID(),
  'ui_auth',
  'de',
  CAST(JSON_OBJECT(
    /* =========================================================
       META (NEW KEYS - preferred)
       ========================================================= */
    'ui_auth_login_meta_title',           'Anmelden | Energetische Massage',
    'ui_auth_login_meta_description',     'Melden Sie sich bei Ihrem Energetische Massage-Konto an.',
    'ui_auth_register_meta_title',        'Registrieren | Energetische Massage',
    'ui_auth_register_meta_description',  'Erstellen Sie Ihr Energetische Massage-Konto.',
    'ui_auth_logout_meta_title',          'Abmeldung | Energetische Massage',
    'ui_auth_logout_meta_description',    'Sie werden von Ihrem Energetische Massage-Konto abgemeldet.',

    /* =========================================================
       META (LEGACY KEYS - backward compatible)
       ========================================================= */
    'login_meta_title',      'Anmelden | Energetische Massage',
    'login_meta_desc',       'Melden Sie sich bei Ihrem Energetische Massage-Konto an.',
    'register_meta_title',   'Registrieren | Energetische Massage',
    'register_meta_desc',    'Erstellen Sie Ihr Energetische Massage-Konto.',
    'logout_meta_title',     'Abmeldung | Energetische Massage',
    'logout_meta_desc',      'Sie werden von Ihrem Energetische Massage-Konto abgemeldet.',

    /* =========================================================
       LOGIN
       ========================================================= */
    'login_title',                   'Anmelden',
    'login_lead',                    'Melden Sie sich an oder erstellen Sie ein neues Konto.',
    'login_email_label',             'E-Mail',
    'login_email_placeholder',       'beispiel@example.com',
    'login_password_label',          'Passwort',
    'login_password_placeholder',    'Ihr Passwort',
    'login_remember_me',             'Angemeldet bleiben',
    'login_submit',                  'Anmelden',
    'login_loading',                 'Anmeldung läuft...',
    'login_or',                      'oder',
    'login_google_button',           'Mit Google fortfahren',
    'login_google_loading',          'Weiterleitung zu Google...',
    'login_no_account',              'Noch kein Konto?',
    'login_register_link',           'Konto erstellen',
    'login_register_cta',            'Jetzt registrieren',
    'login_error_required',          'E-Mail und Passwort sind erforderlich.',
    'login_error_google_generic',    'Beim Start der Google-Anmeldung ist ein Fehler aufgetreten.',

    /* =========================================================
       REGISTER
       ========================================================= */
    'register_title',                        'Registrieren',
    'register_lead_has_account',             'Sie haben bereits ein Konto?',
    'register_login_link',                   'Anmelden',
    'register_fullname_label',               'Vor- und Nachname',
    'register_fullname_placeholder',         'Ihr Name',
    'register_phone_label',                  'Telefon',
    'register_phone_placeholder',            '+49 ...',
    'register_email_label',                  'E-Mail',
    'register_email_placeholder',            'beispiel@example.com',
    'register_password_label',               'Passwort',
    'register_password_placeholder',         'Ihr Passwort',
    'register_password_again_label',         'Passwort (wiederholen)',
    'register_password_again_placeholder',   'Passwort erneut eingeben',
    'register_submit',                       'Registrieren',
    'register_loading',                      'Konto wird erstellt...',
    'register_or',                           'oder',
    'register_google_button',                'Mit Google fortfahren',
    'register_google_loading',               'Weiterleitung zu Google...',
    'register_error_required',               'E-Mail und Passwort sind erforderlich.',
    'register_error_password_length',        'Das Passwort muss mindestens 6 Zeichen lang sein.',
    'register_error_password_mismatch',      'Die Passwörter stimmen nicht überein.',
    'register_error_google_generic',         'Beim Start der Google-Registrierung ist ein Fehler aufgetreten.',

    /* =========================================================
       LOGOUT
       ========================================================= */
    'logout_title',   'Abmeldung läuft...',
    'logout_lead',    'Bitte warten Sie. Sie werden in wenigen Sekunden zur Anmeldeseite weitergeleitet.',
    'logout_error',   'Beim Abmelden vom Server ist ein Problem aufgetreten, aber Ihre lokale Sitzung wurde entfernt.'
  ) AS CHAR),
  NOW(3),
  NOW(3)
)
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);
