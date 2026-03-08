-- Seed de usuarios para EduReports
-- Ejecutar con:
--   mysql -u root -p edureports < scripts/seed_users.sql

USE edureports;

INSERT INTO users (id, name, email, password_hash, created_at)
VALUES
  (1, 'Aurora', 'aurora@escola.cat', '$2b$10$1rgcFV/WXA6AgQVnX7Tc5OgxX2HxHvhBnKyOkPbq5n2TPQLLYNXJa', '2024-01-01 00:00:00'),
  (2, 'Sol', 'sol@escola.cat', '$2b$10$1rgcFV/WXA6AgQVnX7Tc5OgxX2HxHvhBnKyOkPbq5n2TPQLLYNXJa', '2024-01-01 00:00:00'),
  (3, 'Miquel', 'miquel@escola.cat', '$2b$10$S7XpseZOzNrwSdiqq6qnJulbmlQQd1Um0r4Kmg1iG7JX89MB4NbSW', '2024-01-01 00:00:00')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  email = VALUES(email),
  password_hash = VALUES(password_hash),
  created_at = VALUES(created_at);

-- Ajusta el AUTO_INCREMENT al siguiente ID disponible
ALTER TABLE users AUTO_INCREMENT = 4;
