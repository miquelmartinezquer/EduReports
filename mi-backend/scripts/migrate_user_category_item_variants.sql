-- Migration: add variants storage for user rubrics
-- Usage:
--   mysql -u root -p edureports < scripts/migrate_user_category_item_variants.sql

USE edureports;

SET @db := DATABASE();

SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @db
    AND TABLE_NAME = 'user_category_items'
    AND COLUMN_NAME = 'response_options_json'
);

SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE user_category_items ADD COLUMN response_options_json LONGTEXT NULL AFTER item_text',
  'SELECT "response_options_json already exists"'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
