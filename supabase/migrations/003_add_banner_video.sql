-- Migration: add video support to banners
ALTER TABLE banners ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS video_start INTEGER;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS video_end INTEGER;
