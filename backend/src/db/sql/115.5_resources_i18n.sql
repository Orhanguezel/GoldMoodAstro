CREATE TABLE IF NOT EXISTS `resources_i18n` (
  `id` CHAR(36) NOT NULL,
  `resource_id` CHAR(36) NOT NULL,
  `locale` VARCHAR(10) NOT NULL,
  `title` VARCHAR(190) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_resources_i18n_unique` (`resource_id`, `locale`),
  KEY `resources_i18n_resource_idx` (`resource_id`),
  KEY `resources_i18n_locale_idx` (`locale`),
  KEY `resources_i18n_title_idx` (`title`),
  CONSTRAINT `fk_resources_i18n_resource`
    FOREIGN KEY (`resource_id`) REFERENCES `resources` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `resources_i18n` (`id`, `resource_id`, `locale`, `title`, `created_at`, `updated_at`)
SELECT UUID(), r.`id`, 'de', r.`title`, NOW(3), NOW(3)
FROM `resources` r
LEFT JOIN `resources_i18n` ri
  ON ri.`resource_id` = r.`id`
 AND ri.`locale` = 'de'
WHERE ri.`id` IS NULL;
