-- ============================================================
-- 220_gutschein.schema.sql
-- Gutschein (Gift Card) Tabellen
-- ============================================================

CREATE TABLE IF NOT EXISTS `gutschein_products` (
  `id`            CHAR(36)        NOT NULL,
  `name`          VARCHAR(255)    NOT NULL,
  `value`         DECIMAL(10, 2)  NOT NULL,
  `currency`      VARCHAR(10)     NOT NULL DEFAULT 'EUR',
  `validity_days` INT             NOT NULL DEFAULT 365,
  `description`   TEXT,
  `is_active`     TINYINT(1)      NOT NULL DEFAULT 1,
  `display_order` INT             NOT NULL DEFAULT 0,
  `created_at`    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`    DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `gutschein_products_active_order_idx` (`is_active`, `display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `gutscheins` (
  `id`                     CHAR(36)       NOT NULL,
  `code`                   VARCHAR(30)    NOT NULL,
  `product_id`             CHAR(36)       DEFAULT NULL,
  `value`                  DECIMAL(10, 2) NOT NULL,
  `currency`               VARCHAR(10)    NOT NULL DEFAULT 'EUR',
  `status`                 ENUM('pending','active','redeemed','expired','cancelled') NOT NULL DEFAULT 'pending',

  -- Käufer
  `purchaser_user_id`      CHAR(36)       DEFAULT NULL,
  `purchaser_email`        VARCHAR(255)   NOT NULL,
  `purchaser_name`         VARCHAR(255)   NOT NULL,

  -- Empfänger
  `recipient_email`        VARCHAR(255)   DEFAULT NULL,
  `recipient_name`         VARCHAR(255)   DEFAULT NULL,
  `personal_message`       TEXT,

  -- Lebenszyklus
  `issued_at`              DATETIME(3)    DEFAULT NULL,
  `expires_at`             DATETIME(3)    DEFAULT NULL,
  `redeemed_at`            DATETIME(3)    DEFAULT NULL,
  `redeemed_by_user_id`    CHAR(36)       DEFAULT NULL,
  `redeemed_booking_id`    CHAR(36)       DEFAULT NULL,

  -- Zahlung
  `payment_status`         ENUM('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  `payment_transaction_id` VARCHAR(255)   DEFAULT NULL,
  `order_ref`              VARCHAR(100)   DEFAULT NULL,

  -- Admin
  `is_admin_created`       TINYINT(1)     NOT NULL DEFAULT 0,
  `admin_note`             TEXT,

  `created_at`             DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`             DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  UNIQUE KEY `gutscheins_code_unique` (`code`),
  KEY `gutscheins_status_idx` (`status`),
  KEY `gutscheins_purchaser_email_idx` (`purchaser_email`),
  KEY `gutscheins_purchaser_user_id_idx` (`purchaser_user_id`),
  KEY `gutscheins_expires_at_idx` (`expires_at`),

  CONSTRAINT `fk_gutscheins_product`
    FOREIGN KEY (`product_id`) REFERENCES `gutschein_products` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT `fk_gutscheins_purchaser`
    FOREIGN KEY (`purchaser_user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,

  CONSTRAINT `fk_gutscheins_redeemer`
    FOREIGN KEY (`redeemed_by_user_id`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- order_items ve orders tabloları 215_orders.schema.sql içinde oluşturulur.
