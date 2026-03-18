-- Migration (schema-only): make report drafts shared by student
-- This migration does NOT preserve report_drafts data.
-- Run with:
--   mysql -u root -p < scripts/migrate_report_drafts_shared_by_student.sql

USE edureports;

START TRANSACTION;

-- Empty table intentionally (no data preservation required).
TRUNCATE TABLE report_drafts;

-- Remove legacy unique index if it exists.
SET @drop_old_unique := (
    SELECT IF(
        EXISTS (
            SELECT 1
            FROM information_schema.statistics
            WHERE table_schema = DATABASE()
              AND table_name = 'report_drafts'
              AND index_name = 'uq_report_drafts_student_user'
        ),
        'ALTER TABLE report_drafts DROP INDEX uq_report_drafts_student_user',
        'SELECT ''Legacy unique index not found, skipping'''
    )
);
PREPARE stmt_drop_old_unique FROM @drop_old_unique;
EXECUTE stmt_drop_old_unique;
DEALLOCATE PREPARE stmt_drop_old_unique;

-- Add new unique index by student_id if missing.
SET @create_new_unique := (
    SELECT IF(
        EXISTS (
            SELECT 1
            FROM information_schema.statistics
            WHERE table_schema = DATABASE()
              AND table_name = 'report_drafts'
              AND index_name = 'uq_report_drafts_student'
        ),
        'SELECT ''New unique index already exists, skipping''',
        'ALTER TABLE report_drafts ADD UNIQUE KEY uq_report_drafts_student (student_id)'
    )
);
PREPARE stmt_create_new_unique FROM @create_new_unique;
EXECUTE stmt_create_new_unique;
DEALLOCATE PREPARE stmt_create_new_unique;

COMMIT;
