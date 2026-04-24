-- ===================================================================
-- FILE: 212_chat_ai_settings.seed.sql
-- Chat AI provider settings (site_settings)
-- Telegram ayarlarindaki pattern ile ayni: global locale='*'
-- ===================================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ─── Core AI settings (global, locale='*') ────────────────────────

INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`) VALUES
  (UUID(), 'chat_ai_enabled',            '*', 'true',                       NOW(3), NOW(3)),
  (UUID(), 'chat_widget_enabled',        '*', 'true',                       NOW(3), NOW(3)),
  (UUID(), 'chat_ai_default_provider',   '*', 'auto',                       NOW(3), NOW(3)),
  (UUID(), 'chat_ai_provider_order',     '*', 'grok,openai,anthropic',      NOW(3), NOW(3)),
  (UUID(), 'chat_ai_offer_url',          '*', '/{locale}/appointment',       NOW(3), NOW(3)),
  (UUID(), 'chat_ai_system_prompt',      '*', '',                           NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- ─── Provider: Groq (Llama) ───────────────────────────────────────

INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`) VALUES
  (UUID(), 'chat_ai_groq_api_key',       '*', '',                           NOW(3), NOW(3)),
  (UUID(), 'chat_ai_groq_model',         '*', 'llama-3.3-70b-versatile',    NOW(3), NOW(3)),
  (UUID(), 'chat_ai_groq_api_base',      '*', 'https://api.groq.com/openai/v1', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- ─── Provider: xAI / Grok ─────────────────────────────────────────

INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`) VALUES
  (UUID(), 'chat_ai_xai_api_key',        '*', '',                           NOW(3), NOW(3)),
  (UUID(), 'chat_ai_xai_model',          '*', 'grok-2-latest',              NOW(3), NOW(3)),
  (UUID(), 'chat_ai_xai_api_base',       '*', 'https://api.x.ai/v1',       NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- ─── Provider: OpenAI ──────────────────────────────────────────────

INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`) VALUES
  (UUID(), 'chat_ai_openai_api_key',     '*', '',                           NOW(3), NOW(3)),
  (UUID(), 'chat_ai_openai_model',       '*', 'gpt-4o-mini',               NOW(3), NOW(3)),
  (UUID(), 'chat_ai_openai_api_base',    '*', 'https://api.openai.com/v1', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- ─── Provider: Anthropic ───────────────────────────────────────────

INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`) VALUES
  (UUID(), 'chat_ai_anthropic_api_key',  '*', '',                           NOW(3), NOW(3)),
  (UUID(), 'chat_ai_anthropic_model',    '*', 'claude-3-5-haiku-latest',   NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);

-- ─── Welcome messages (localized) ──────────────────────────────────

INSERT INTO `site_settings` (`id`, `key`, `locale`, `value`, `created_at`, `updated_at`) VALUES
  (UUID(), 'chat_ai_welcome_message', 'de', 'Willkommen bei Energetische Massage! Wie kann ich Ihnen helfen?', NOW(3), NOW(3)),
  (UUID(), 'chat_ai_welcome_message', 'tr', 'Energetische Massage''e hoş geldiniz! Size nasıl yardımcı olabilirim?', NOW(3), NOW(3)),
  (UUID(), 'chat_ai_welcome_message', 'en', 'Welcome to Energetische Massage! How can I help you?', NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);
