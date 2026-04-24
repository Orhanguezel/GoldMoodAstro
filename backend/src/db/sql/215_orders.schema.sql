-- ============================================================
-- 215_orders.schema.sql
-- Orders, Order Items, Payment Gateways, Payments, User Addresses
-- ============================================================

CREATE TABLE IF NOT EXISTS `payment_gateways` (
  `id`           CHAR(36)      NOT NULL,
  `name`         VARCHAR(255)  NOT NULL,
  `slug`         VARCHAR(100)  NOT NULL,
  `is_active`    TINYINT(1)    NOT NULL DEFAULT 1,
  `is_test_mode` TINYINT(1)    NOT NULL DEFAULT 1,
  `config`       TEXT,
  `created_at`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `payment_gateways_slug_unique` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `user_addresses` (
  `id`           CHAR(36)      NOT NULL,
  `user_id`      CHAR(36)      NOT NULL,
  `title`        VARCHAR(255)  NOT NULL,
  `full_name`    VARCHAR(255)  NOT NULL,
  `phone`        VARCHAR(50)   NOT NULL,
  `email`        VARCHAR(255)  DEFAULT NULL,
  `address_line` TEXT          NOT NULL,
  `city`         VARCHAR(128)  NOT NULL,
  `district`     VARCHAR(128)  NOT NULL,
  `postal_code`  VARCHAR(32)   DEFAULT NULL,
  `is_default`   TINYINT(1)    NOT NULL DEFAULT 0,
  `created_at`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`   DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `user_addresses_user_id_idx` (`user_id`),
  CONSTRAINT `fk_user_addresses_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `orders` (
  `id`                   CHAR(36)        NOT NULL,
  `user_id`              CHAR(36)        NOT NULL,
  `order_number`         VARCHAR(50)     NOT NULL,
  `status`               VARCHAR(50)     NOT NULL DEFAULT 'pending',
  `total_amount`         DECIMAL(12, 2)  NOT NULL,
  `currency`             VARCHAR(10)     NOT NULL DEFAULT 'EUR',
  `shipping_address_id`  CHAR(36)        DEFAULT NULL,
  `billing_address_id`   CHAR(36)        DEFAULT NULL,
  `payment_gateway_id`   CHAR(36)        DEFAULT NULL,
  `payment_status`       VARCHAR(50)     NOT NULL DEFAULT 'unpaid',
  `order_notes`          TEXT,
  `transaction_id`       VARCHAR(255)    DEFAULT NULL,
  `created_at`           DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`           DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `orders_number_unique` (`order_number`),
  KEY `orders_user_id_idx` (`user_id`),
  CONSTRAINT `fk_orders_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_orders_gateway`
    FOREIGN KEY (`payment_gateway_id`) REFERENCES `payment_gateways` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `order_items` (
  `id`          CHAR(36)        NOT NULL,
  `order_id`    CHAR(36)        NOT NULL,
  `item_type`   VARCHAR(50)     NOT NULL DEFAULT 'service',
  `item_ref_id` CHAR(36)        DEFAULT NULL,
  `title`       VARCHAR(255)    NOT NULL,
  `quantity`    INT             NOT NULL DEFAULT 1,
  `price`       DECIMAL(12, 2)  NOT NULL,
  `currency`    VARCHAR(10)     NOT NULL DEFAULT 'EUR',
  `options`     TEXT,
  `created_at`  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `order_items_order_id_idx` (`order_id`),
  KEY `order_items_item_type_idx` (`item_type`),
  CONSTRAINT `fk_order_items_order`
    FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `payments` (
  `id`             CHAR(36)        NOT NULL,
  `order_id`       CHAR(36)        NOT NULL,
  `gateway_id`     CHAR(36)        NOT NULL,
  `transaction_id` VARCHAR(255)    DEFAULT NULL,
  `amount`         DECIMAL(12, 2)  NOT NULL,
  `currency`       VARCHAR(10)     NOT NULL DEFAULT 'EUR',
  `status`         VARCHAR(50)     NOT NULL,
  `raw_response`   TEXT,
  `created_at`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `payments_order_id_idx` (`order_id`),
  CONSTRAINT `fk_payments_order`
    FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_payments_gateway`
    FOREIGN KEY (`gateway_id`) REFERENCES `payment_gateways` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
