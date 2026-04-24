-- =============================================================
-- FILE: 050.1_custom_pages_featured.sql
-- Adds parent-level featured flag to custom_pages (idempotent)
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

SET @has_featured_col := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'custom_pages'
    AND COLUMN_NAME = 'featured'
);

SET @sql_add_featured_col := IF(
  @has_featured_col = 0,
  'ALTER TABLE `custom_pages` ADD COLUMN `featured` TINYINT(1) NOT NULL DEFAULT 0 AFTER `is_published`',
  'SELECT 1'
);
PREPARE stmt_add_featured_col FROM @sql_add_featured_col;
EXECUTE stmt_add_featured_col;
DEALLOCATE PREPARE stmt_add_featured_col;

SET @has_featured_idx := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'custom_pages'
    AND INDEX_NAME = 'custom_pages_featured_idx'
);

SET @sql_add_featured_idx := IF(
  @has_featured_idx = 0,
  'ALTER TABLE `custom_pages` ADD INDEX `custom_pages_featured_idx` (`featured`)',
  'SELECT 1'
);
PREPARE stmt_add_featured_idx FROM @sql_add_featured_idx;
EXECUTE stmt_add_featured_idx;
DEALLOCATE PREPARE stmt_add_featured_idx;
