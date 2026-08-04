CREATE TABLE IF NOT EXISTS llm_usage_events (
  id CHAR(36) NOT NULL PRIMARY KEY,
  provider VARCHAR(32) NOT NULL,
  model VARCHAR(128) NOT NULL,
  input_tokens BIGINT UNSIGNED NOT NULL DEFAULT 0,
  output_tokens BIGINT UNSIGNED NOT NULL DEFAULT 0,
  net_cost_usd DECIMAL(14,8) NOT NULL DEFAULT 0,
  vat_rate DECIMAL(6,4) NOT NULL DEFAULT 0.1900,
  gross_cost_usd DECIMAL(14,8) NOT NULL DEFAULT 0,
  source VARCHAR(64) NOT NULL DEFAULT 'goldmoodastro',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_llm_usage_created (created_at),
  INDEX idx_llm_usage_provider_model (provider, model)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

