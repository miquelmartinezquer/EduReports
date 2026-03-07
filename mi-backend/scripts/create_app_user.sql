-- Crea/actualiza un usuario dedicado para la app.
-- Ejecutar este script conectado como root (Workbench, DBeaver o phpMyAdmin SQL editor).

CREATE USER IF NOT EXISTS 'edureports_app'@'localhost' IDENTIFIED BY 'edureports123!';
CREATE USER IF NOT EXISTS 'edureports_app'@'127.0.0.1' IDENTIFIED BY 'edureports123!';

ALTER USER 'edureports_app'@'localhost' IDENTIFIED BY 'edureports123!';
ALTER USER 'edureports_app'@'127.0.0.1' IDENTIFIED BY 'edureports123!';

GRANT ALL PRIVILEGES ON edureports.* TO 'edureports_app'@'localhost';
GRANT ALL PRIVILEGES ON edureports.* TO 'edureports_app'@'127.0.0.1';

FLUSH PRIVILEGES;
