USE edureports;

-- 1) Rename old table only when needed
SET @has_old := (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = DATABASE()
    AND table_name = 'report_templates'
);

SET @has_new := (
  SELECT COUNT(*)
  FROM information_schema.tables
  WHERE table_schema = DATABASE()
    AND table_name = 'evaluation_routes'
);

SET @rename_sql := IF(
  @has_old = 1 AND @has_new = 0,
  'RENAME TABLE report_templates TO evaluation_routes',
  'SELECT "No table rename needed"'
);
PREPARE stmt FROM @rename_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) Rename unique index if old name exists
SET @has_old_unique := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'evaluation_routes'
    AND index_name = 'uq_report_templates_course_name'
);

SET @drop_old_unique_sql := IF(
  @has_old_unique = 1,
  'ALTER TABLE evaluation_routes DROP INDEX uq_report_templates_course_name',
  'SELECT "Old unique index not found"'
);
PREPARE stmt FROM @drop_old_unique_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_new_unique := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'evaluation_routes'
    AND index_name = 'uq_evaluation_routes_course_name'
);

SET @add_new_unique_sql := IF(
  @has_new_unique = 0,
  'ALTER TABLE evaluation_routes ADD UNIQUE KEY uq_evaluation_routes_course_name (course_id, name)',
  'SELECT "New unique index already exists"'
);
PREPARE stmt FROM @add_new_unique_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3) Rename foreign keys if old names exist
SET @has_old_fk_course := (
  SELECT COUNT(*)
  FROM information_schema.table_constraints
  WHERE table_schema = DATABASE()
    AND table_name = 'evaluation_routes'
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name = 'fk_report_templates_course'
);

SET @drop_old_fk_course_sql := IF(
  @has_old_fk_course = 1,
  'ALTER TABLE evaluation_routes DROP FOREIGN KEY fk_report_templates_course',
  'SELECT "Old course FK not found"'
);
PREPARE stmt FROM @drop_old_fk_course_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_new_fk_course := (
  SELECT COUNT(*)
  FROM information_schema.table_constraints
  WHERE table_schema = DATABASE()
    AND table_name = 'evaluation_routes'
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name = 'fk_evaluation_routes_course'
);

SET @add_new_fk_course_sql := IF(
  @has_new_fk_course = 0,
  'ALTER TABLE evaluation_routes ADD CONSTRAINT fk_evaluation_routes_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT "New course FK already exists"'
);
PREPARE stmt FROM @add_new_fk_course_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_old_fk_user := (
  SELECT COUNT(*)
  FROM information_schema.table_constraints
  WHERE table_schema = DATABASE()
    AND table_name = 'evaluation_routes'
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name = 'fk_report_templates_user'
);

SET @drop_old_fk_user_sql := IF(
  @has_old_fk_user = 1,
  'ALTER TABLE evaluation_routes DROP FOREIGN KEY fk_report_templates_user',
  'SELECT "Old user FK not found"'
);
PREPARE stmt FROM @drop_old_fk_user_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_new_fk_user := (
  SELECT COUNT(*)
  FROM information_schema.table_constraints
  WHERE table_schema = DATABASE()
    AND table_name = 'evaluation_routes'
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name = 'fk_evaluation_routes_user'
);

SET @add_new_fk_user_sql := IF(
  @has_new_fk_user = 0,
  'ALTER TABLE evaluation_routes ADD CONSTRAINT fk_evaluation_routes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT "New user FK already exists"'
);
PREPARE stmt FROM @add_new_fk_user_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
