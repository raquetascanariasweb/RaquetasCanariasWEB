-- Añadir columna height a banners
ALTER TABLE banners ADD COLUMN IF NOT EXISTS height INTEGER DEFAULT 55;
