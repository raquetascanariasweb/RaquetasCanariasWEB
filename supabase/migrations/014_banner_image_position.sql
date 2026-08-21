-- Renombrar height a image_position en banners
ALTER TABLE banners ADD COLUMN IF NOT EXISTS image_position INTEGER DEFAULT 50;
