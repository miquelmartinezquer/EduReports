-- Seed default colors for EduReports
-- Run with:
--   mysql -u root -p < scripts/seed_available_colors.sql

USE edureports;

INSERT INTO available_colors (color_key, name, hover_class)
VALUES
  ('purple', 'Porpra', 'hover:border-purple-400 hover:bg-purple-50'),
  ('blue', 'Blau', 'hover:border-blue-400 hover:bg-blue-50'),
  ('green', 'Verd', 'hover:border-green-400 hover:bg-green-50'),
  ('orange', 'Taronja', 'hover:border-orange-400 hover:bg-orange-50'),
  ('red', 'Vermell', 'hover:border-red-400 hover:bg-red-50'),
  ('pink', 'Rosa', 'hover:border-pink-400 hover:bg-pink-50'),
  ('yellow', 'Groc', 'hover:border-yellow-400 hover:bg-yellow-50'),
  ('teal', 'Jade', 'hover:border-teal-400 hover:bg-teal-50'),
  ('cyan', 'Cian', 'hover:border-cyan-400 hover:bg-cyan-50'),
  ('indigo', 'Indi', 'hover:border-indigo-400 hover:bg-indigo-50'),
  ('slate', 'Pissarra', 'hover:border-slate-400 hover:bg-slate-50'),
  ('emerald', 'Maragda', 'hover:border-emerald-400 hover:bg-emerald-50')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  hover_class = VALUES(hover_class);
