-- EduReports MySQL schema generated from current mockData model
-- Run with:
--   mysql -u root -p < scripts/create_tables.sql

CREATE DATABASE IF NOT EXISTS edureports
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE edureports;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS course_category_items;
DROP TABLE IF EXISTS course_categories;
DROP TABLE IF EXISTS user_category_items;
DROP TABLE IF EXISTS user_categories;
DROP TABLE IF EXISTS available_colors;
DROP TABLE IF EXISTS report_drafts;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS classes;
DROP TABLE IF EXISTS collaborators;
DROP TABLE IF EXISTS course_invitations;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE courses (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  name VARCHAR(180) NOT NULL,
  level VARCHAR(80) NOT NULL,
  created_at DATE NOT NULL,
  PRIMARY KEY (id),
  KEY idx_courses_user_id (user_id),
  CONSTRAINT fk_courses_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE collaborators (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  course_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  role VARCHAR(80) NOT NULL,
  is_owner TINYINT(1) NOT NULL DEFAULT 0,
  added_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_collaborators_course_user (course_id, user_id),
  KEY idx_collaborators_user_id (user_id),
  CONSTRAINT fk_collaborators_course
    FOREIGN KEY (course_id) REFERENCES courses(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_collaborators_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE classes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  course_id INT UNSIGNED NOT NULL,
  name VARCHAR(180) NOT NULL,
  schedule VARCHAR(255) NULL,
  created_at DATE NOT NULL,
  PRIMARY KEY (id),
  KEY idx_classes_course_id (course_id),
  CONSTRAINT fk_classes_course
    FOREIGN KEY (course_id) REFERENCES courses(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE students (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  class_id INT UNSIGNED NOT NULL,
  name VARCHAR(180) NOT NULL,
  age INT NULL,
  enrolled_at DATE NOT NULL,
  PRIMARY KEY (id),
  KEY idx_students_class_id (class_id),
  CONSTRAINT fk_students_class
    FOREIGN KEY (class_id) REFERENCES classes(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reports (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id INT UNSIGNED NOT NULL,
  course_id INT UNSIGNED NOT NULL,
  title VARCHAR(190) NOT NULL,
  created_at DATE NOT NULL,
  html_content LONGTEXT NOT NULL,
  status ENUM('completed', 'draft') NOT NULL DEFAULT 'completed',
  PRIMARY KEY (id),
  KEY idx_reports_student_id (student_id),
  KEY idx_reports_course_id (course_id),
  CONSTRAINT fk_reports_student
    FOREIGN KEY (student_id) REFERENCES students(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_reports_course
    FOREIGN KEY (course_id) REFERENCES courses(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE report_drafts (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  student_id INT UNSIGNED NOT NULL,
  course_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  elements_json LONGTEXT NULL,
  student_name VARCHAR(180) NULL,
  course_label VARCHAR(120) NULL,
  language VARCHAR(60) NULL,
  element_counter INT NOT NULL DEFAULT 0,
  last_modified DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_report_drafts_student_user (student_id, user_id),
  KEY idx_report_drafts_course_id (course_id),
  KEY idx_report_drafts_user_id (user_id),
  CONSTRAINT fk_report_drafts_student
    FOREIGN KEY (student_id) REFERENCES students(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_report_drafts_course
    FOREIGN KEY (course_id) REFERENCES courses(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_report_drafts_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE course_invitations (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  course_id INT UNSIGNED NOT NULL,
  status ENUM('pending', 'accepted', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
  invited_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_course_invitations_user_id (user_id),
  KEY idx_course_invitations_course_id (course_id),
  KEY idx_course_invitations_status (status),
  CONSTRAINT fk_course_invitations_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_course_invitations_course
    FOREIGN KEY (course_id) REFERENCES courses(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE available_colors (
  color_key VARCHAR(40) NOT NULL,
  name VARCHAR(80) NOT NULL,
  hover_class VARCHAR(120) NULL,
  PRIMARY KEY (color_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_categories (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  category_key VARCHAR(80) NOT NULL,
  name VARCHAR(180) NOT NULL,
  color_key VARCHAR(40) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_category (user_id, category_key),
  KEY idx_user_categories_color_key (color_key),
  CONSTRAINT fk_user_categories_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_user_categories_color
    FOREIGN KEY (color_key) REFERENCES available_colors(color_key)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_category_items (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_category_id INT UNSIGNED NOT NULL,
  item_text TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_user_category_items_category_id (user_category_id),
  CONSTRAINT fk_user_category_items_category
    FOREIGN KEY (user_category_id) REFERENCES user_categories(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE course_categories (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  course_id INT UNSIGNED NOT NULL,
  category_key VARCHAR(80) NOT NULL,
  name VARCHAR(180) NOT NULL,
  color_key VARCHAR(40) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_course_category (course_id, category_key),
  KEY idx_course_categories_color_key (color_key),
  CONSTRAINT fk_course_categories_course
    FOREIGN KEY (course_id) REFERENCES courses(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_course_categories_color
    FOREIGN KEY (color_key) REFERENCES available_colors(color_key)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE course_category_items (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  course_category_id INT UNSIGNED NOT NULL,
  item_text TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_course_category_items_category_id (course_category_id),
  CONSTRAINT fk_course_category_items_category
    FOREIGN KEY (course_category_id) REFERENCES course_categories(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
