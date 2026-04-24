-- 001_auth_schema.sql
CREATE TABLE IF NOT EXISTS users (
  id                CHAR(36)       NOT NULL,
  email             VARCHAR(255)   NOT NULL,
  password_hash     VARCHAR(255)   NOT NULL,
  full_name         VARCHAR(255)   DEFAULT NULL,
  phone             VARCHAR(50)    DEFAULT NULL,
  is_active         TINYINT(1)     NOT NULL DEFAULT 1,
  email_verified    TINYINT(1)     NOT NULL DEFAULT 0,
  reset_token             VARCHAR(255)  DEFAULT NULL,
  reset_token_expires     DATETIME(3)   DEFAULT NULL,
  created_at        DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at        DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  last_sign_in_at   DATETIME(3)    DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY users_email_unique (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id           CHAR(36)     NOT NULL,
  user_id      CHAR(36)     NOT NULL,
  token_hash   VARCHAR(255) NOT NULL,
  created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  expires_at   DATETIME(3)  NOT NULL,
  revoked_at   DATETIME(3)  DEFAULT NULL,
  replaced_by  CHAR(36)     DEFAULT NULL,
  PRIMARY KEY (id),
  KEY refresh_tokens_user_id_idx (user_id),
  KEY refresh_tokens_expires_at_idx (expires_at),
  CONSTRAINT fk_refresh_tokens_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS profiles (
  id             CHAR(36)      NOT NULL,
  full_name      TEXT          DEFAULT NULL,
  phone          VARCHAR(64)   DEFAULT NULL,
  avatar_url     TEXT          DEFAULT NULL,
  address_line1  VARCHAR(255)  DEFAULT NULL,
  address_line2  VARCHAR(255)  DEFAULT NULL,
  city           VARCHAR(128)  DEFAULT NULL,
  country        VARCHAR(128)  DEFAULT NULL,
  postal_code    VARCHAR(32)   DEFAULT NULL,
  created_at     DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at     DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  CONSTRAINT fk_profiles_id_users_id
    FOREIGN KEY (id) REFERENCES users (id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
